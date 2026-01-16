export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface VoidSaleInput {
  saleId: string
  reason: string
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

    const body: VoidSaleInput = await request.json()

    if (!body.saleId) {
      return NextResponse.json(
        { success: false, error: 'saleId is required' },
        { status: 400 }
      )
    }

    if (!body.reason) {
      return NextResponse.json(
        { success: false, error: 'Void reason is required' },
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
      return NextResponse.json({
        success: true,
        message: 'Sale already voided',
        sale: {
          id: sale.id,
          saleNumber: sale.saleNumber,
          status: sale.status,
        }
      })
    }

    if (sale.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: `Cannot void sale with status: ${sale.status}` },
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
        { success: false, error: 'Supervisor approval required for void' },
        { status: 403 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSale = await tx.pos_sale.update({
        where: { id: sale.id },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidedById: supervisorId,
          voidedByName: supervisorName,
          voidReason: body.reason,
        }
      })

      for (const item of sale.items) {
        const inventoryLevel = await tx.inventoryLevel.findFirst({
          where: {
            productId: item.productId,
            locationId: sale.locationId,
          }
        })

        if (inventoryLevel) {
          await tx.inventoryLevel.update({
            where: { id: inventoryLevel.id },
            data: {
              quantityOnHand: { increment: item.quantity },
              quantityAvailable: { increment: item.quantity },
            }
          })
        }
      }

      if (sale.shiftId && sale.paymentMethod === 'CASH') {
        await tx.pos_cash_movement.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: session.activeTenantId!,
            shiftId: sale.shiftId,
            movementType: 'VOID_REVERSAL',
            amount: -Number(sale.grandTotal),
            direction: 'OUT',
            referenceType: 'VOID',
            referenceId: sale.id,
            referenceNumber: sale.saleNumber,
            notes: `Void reversal for sale ${sale.saleNumber}: ${body.reason}`,
            performedById: session.user.id,
            performedByName: session.user.name || 'Unknown',
          }
        })
      }

      await tx.pos_void_log.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: session.activeTenantId!,
          saleId: sale.id,
          saleNumber: sale.saleNumber,
          originalAmount: sale.grandTotal,
          reason: body.reason,
          voidedById: session.user.id,
          voidedByName: session.user.name || 'Unknown',
          approvedById: supervisorId!,
          approvedByName: supervisorName!,
          shiftId: sale.shiftId,
          locationId: sale.locationId,
        }
      })

      return updatedSale
    })

    console.log('[POS Audit] Sale voided:', {
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      amount: Number(sale.grandTotal),
      reason: body.reason,
      approvedBy: supervisorName,
      cashierId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Sale voided successfully',
      sale: {
        id: result.id,
        saleNumber: result.saleNumber,
        status: result.status,
        voidedAt: result.voidedAt,
        voidedByName: result.voidedByName,
        voidReason: result.voidReason,
      }
    })
    
  } catch (error) {
    console.error('Void sale error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to void sale' },
      { status: 500 }
    )
  }
}
