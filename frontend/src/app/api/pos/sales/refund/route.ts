export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RefundItem {
  saleItemId: string
  quantity: number
  amount: number
}

interface RefundSaleInput {
  saleId: string
  reason: string
  refundType: 'FULL' | 'PARTIAL'
  items?: RefundItem[]
  totalRefundAmount?: number
  supervisorPin?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: RefundSaleInput = await request.json()

    if (!body.saleId) {
      return NextResponse.json(
        { success: false, error: 'saleId is required' },
        { status: 400 }
      )
    }

    if (!body.reason) {
      return NextResponse.json(
        { success: false, error: 'Refund reason is required' },
        { status: 400 }
      )
    }

    if (!body.refundType) {
      return NextResponse.json(
        { success: false, error: 'refundType is required (FULL or PARTIAL)' },
        { status: 400 }
      )
    }

    const sale = await prisma.pos_sale.findFirst({
      where: {
        id: body.saleId,
        tenantId: session.activeTenantId,
      },
      include: {
        items: true,
        shift: true,
      }
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    if (sale.status === 'VOIDED') {
      return NextResponse.json(
        { success: false, error: 'Cannot refund a voided sale' },
        { status: 400 }
      )
    }

    if (sale.status === 'REFUNDED') {
      return NextResponse.json(
        { success: false, error: 'Sale has already been fully refunded' },
        { status: 400 }
      )
    }

    let supervisorId: string | null = null
    let supervisorName: string | null = null

    const userMembership = await prisma.tenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId: session.activeTenantId,
      }
    })

    const userRole = userMembership?.role || ''
    const isPOSSupervisorOrAbove = ['POS_SUPERVISOR', 'POS_MANAGER', 'TENANT_ADMIN', 'TENANT_OWNER'].includes(userRole)

    if (isPOSSupervisorOrAbove) {
      supervisorId = session.user.id
      supervisorName = session.user.name || 'Unknown'
    } else if (body.supervisorPin) {
      const supervisor = await prisma.user.findFirst({
        where: {
          posPin: body.supervisorPin,
          memberships: {
            some: {
              tenantId: session.activeTenantId,
              role: { in: ['POS_SUPERVISOR', 'POS_MANAGER', 'TENANT_ADMIN', 'TENANT_OWNER'] }
            }
          }
        }
      })

      if (!supervisor) {
        return NextResponse.json(
          { success: false, error: 'Invalid supervisor PIN' },
          { status: 403 }
        )
      }

      supervisorId = supervisor.id
      supervisorName = supervisor.name || 'Unknown'
    } else {
      return NextResponse.json(
        { success: false, error: 'Supervisor approval required for refund' },
        { status: 403 }
      )
    }

    let totalRefundAmount = 0
    let refundItems: Array<{ saleItemId: string; quantity: number; amount: number }> = []

    if (body.refundType === 'FULL') {
      const alreadyRefunded = sale.items.reduce((sum, item) => sum + Number(item.refundedAmount || 0), 0)
      totalRefundAmount = Number(sale.grandTotal) - alreadyRefunded
      
      if (totalRefundAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Nothing left to refund' },
          { status: 400 }
        )
      }
      
      refundItems = sale.items.map(item => ({
        saleItemId: item.id,
        quantity: item.quantity - (item.returnedQuantity || 0),
        amount: Number(item.lineTotal) - Number(item.refundedAmount || 0),
      })).filter(item => item.quantity > 0)
      
    } else {
      if (!body.items || body.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Items required for partial refund' },
          { status: 400 }
        )
      }

      for (const refundItem of body.items) {
        const saleItem = sale.items.find(i => i.id === refundItem.saleItemId)
        if (!saleItem) {
          return NextResponse.json(
            { success: false, error: `Sale item ${refundItem.saleItemId} not found` },
            { status: 400 }
          )
        }

        const availableQty = saleItem.quantity - (saleItem.returnedQuantity || 0)
        if (refundItem.quantity > availableQty) {
          return NextResponse.json(
            { success: false, error: `Cannot refund ${refundItem.quantity} of ${saleItem.productName}. Only ${availableQty} available.` },
            { status: 400 }
          )
        }

        const maxRefundableAmount = Number(saleItem.lineTotal) - Number(saleItem.refundedAmount || 0)
        if (refundItem.amount > maxRefundableAmount) {
          return NextResponse.json(
            { success: false, error: `Cannot refund ₦${refundItem.amount.toLocaleString()} for ${saleItem.productName}. Maximum: ₦${maxRefundableAmount.toLocaleString()}` },
            { status: 400 }
          )
        }

        totalRefundAmount += refundItem.amount
        refundItems.push(refundItem)
      }
    }

    if (totalRefundAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Refund amount must be greater than zero' },
        { status: 400 }
      )
    }

    const currentShift = await prisma.pos_shift.findFirst({
      where: {
        tenantId: session.activeTenantId,
        locationId: sale.locationId,
        status: 'OPEN',
      },
      orderBy: { openedAt: 'desc' }
    })

    const result = await prisma.$transaction(async (tx) => {
      for (const refundItem of refundItems) {
        const saleItem = sale.items.find(i => i.id === refundItem.saleItemId)!
        
        await tx.pos_sale_item.update({
          where: { id: refundItem.saleItemId },
          data: {
            returnedQuantity: { increment: refundItem.quantity },
            refundedAmount: { increment: refundItem.amount },
          }
        })

        const inventoryLevel = await tx.inventoryLevel.findFirst({
          where: {
            productId: saleItem.productId,
            locationId: sale.locationId,
          }
        })

        if (inventoryLevel) {
          await tx.inventoryLevel.update({
            where: { id: inventoryLevel.id },
            data: {
              quantityOnHand: { increment: refundItem.quantity },
              quantityAvailable: { increment: refundItem.quantity },
            }
          })
        }
      }

      const isFullRefund = body.refundType === 'FULL' || 
        sale.items.every(item => {
          const refundItem = refundItems.find(r => r.saleItemId === item.id)
          const newReturnedQty = (item.returnedQuantity || 0) + (refundItem?.quantity || 0)
          return newReturnedQty >= item.quantity
        })

      const newStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED'

      const updatedSale = await tx.pos_sale.update({
        where: { id: sale.id },
        data: {
          status: newStatus,
        }
      })

      if (currentShift && (sale.paymentMethod === 'CASH' || sale.paymentMethod === 'TRANSFER')) {
        await tx.pos_cash_movement.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: session.activeTenantId!,
            shiftId: currentShift.id,
            movementType: 'REFUND',
            amount: totalRefundAmount,
            direction: 'OUT',
            referenceType: 'REFUND',
            referenceId: sale.id,
            referenceNumber: sale.saleNumber,
            notes: `Refund for sale ${sale.saleNumber}: ${body.reason}`,
            performedById: session.user.id,
            performedByName: session.user.name || 'Unknown',
          }
        })
      }

      const refundLog = await tx.pos_refund_log.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: session.activeTenantId!,
          saleId: sale.id,
          saleNumber: sale.saleNumber,
          refundType: body.refundType,
          refundAmount: totalRefundAmount,
          reason: body.reason,
          itemsRefunded: refundItems,
          processedById: session.user.id,
          processedByName: session.user.name || 'Unknown',
          approvedById: supervisorId!,
          approvedByName: supervisorName!,
          shiftId: currentShift?.id,
          locationId: sale.locationId,
        }
      })

      return { sale: updatedSale, refundLog }
    })

    console.log('[POS Audit] Refund processed:', {
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      refundType: body.refundType,
      refundAmount: totalRefundAmount,
      reason: body.reason,
      approvedBy: supervisorName,
      processedBy: session.user.name,
    })

    return NextResponse.json({
      success: true,
      message: `${body.refundType === 'FULL' ? 'Full' : 'Partial'} refund processed successfully`,
      refund: {
        id: result.refundLog.id,
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        refundAmount: totalRefundAmount,
        refundType: body.refundType,
        newStatus: result.sale.status,
      }
    })
    
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}
