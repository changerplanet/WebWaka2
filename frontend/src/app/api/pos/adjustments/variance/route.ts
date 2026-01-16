export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { coreInventoryService } from '@/lib/core-services'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')
    const locationId = searchParams.get('locationId')
    const registerId = searchParams.get('registerId')

    if (!shiftId && !locationId) {
      return NextResponse.json(
        { success: false, error: 'Either shiftId or locationId is required' },
        { status: 400 }
      )
    }

    const shift = shiftId ? await prisma.pos_shift.findFirst({
      where: {
        id: shiftId,
        tenantId: session.activeTenantId,
      }
    }) : null

    const effectiveLocationId = shift?.locationId || locationId

    if (!effectiveLocationId) {
      return NextResponse.json(
        { success: false, error: 'Could not determine location' },
        { status: 400 }
      )
    }

    const saleItemsWhere: Record<string, unknown> = {
      sale: {
        tenantId: session.activeTenantId,
        locationId: effectiveLocationId,
        status: { in: ['COMPLETED'] },
      }
    }

    if (shiftId) {
      saleItemsWhere.sale = {
        ...(saleItemsWhere.sale as Record<string, unknown>),
        shiftId,
      }
    }

    const saleItems = await prisma.pos_sale_item.findMany({
      where: saleItemsWhere,
      include: {
        sale: {
          select: {
            saleDate: true,
            status: true,
          }
        }
      }
    })

    const soldByProduct: Record<string, {
      productId: string
      variantId: string | null
      productName: string
      sku: string | null
      totalSold: number
    }> = {}

    for (const item of saleItems) {
      const key = `${item.productId}:${item.variantId || ''}`
      if (!soldByProduct[key]) {
        soldByProduct[key] = {
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          totalSold: 0,
        }
      }
      soldByProduct[key].totalSold += item.quantity - (item.returnedQuantity || 0)
    }

    let currentInventory: Array<{
      productId: string
      variantId?: string
      productName: string
      sku?: string
      currentStock: number
    }> = []

    try {
      const inventorySnapshot = await coreInventoryService.getInventorySnapshot(
        session.activeTenantId,
        { locationId: effectiveLocationId }
      )
      currentInventory = (inventorySnapshot as any[]).map((inv) => ({
        productId: inv.productId as string,
        variantId: inv.variantId as string | undefined,
        productName: inv.productName as string,
        sku: inv.sku as string | undefined,
        currentStock: (inv.quantity as number) || 0,
      }))
    } catch {
      console.warn('[POS] Could not fetch core inventory, using empty baseline')
    }

    const existingAdjustments = await (prisma as any).pos_inventory_adjustment.findMany({
      where: {
        tenantId: session.activeTenantId,
        locationId: effectiveLocationId,
        ...(shiftId ? { shiftId } : {}),
      },
      orderBy: { performedAt: 'desc' },
    })

    const varianceItems = Object.values(soldByProduct).map(sold => {
      const current = currentInventory.find(
        inv => inv.productId === sold.productId && 
               (inv.variantId || null) === (sold.variantId || null)
      )
      const currentStock = current?.currentStock || 0

      const adjustments = existingAdjustments.filter(
        (adj: any) => adj.productId === sold.productId && 
               (adj.variantId || null) === (sold.variantId || null)
      )

      return {
        productId: sold.productId,
        variantId: sold.variantId,
        productName: sold.productName,
        sku: sold.sku,
        totalSold: sold.totalSold,
        currentStock,
        adjustments: adjustments.map((adj: any) => ({
          id: adj.id,
          adjustmentNumber: adj.adjustmentNumber,
          adjustmentType: adj.adjustmentType,
          quantityChange: adj.quantityChange,
          reason: adj.reason,
          performedAt: adj.performedAt,
          approvedByName: adj.approvedByName,
        })),
      }
    })

    return NextResponse.json({
      success: true,
      shiftId,
      locationId: effectiveLocationId,
      registerId,
      shiftNumber: shift?.shiftNumber,
      varianceItems,
      itemCount: varianceItems.length,
      totalSoldQuantity: varianceItems.reduce((sum, item) => sum + item.totalSold, 0),
      adjustmentCount: existingAdjustments.length,
    })
    
  } catch (error) {
    console.error('[POS] Error calculating inventory variance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
