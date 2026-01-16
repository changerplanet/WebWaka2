export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VARIANCE_REASONS = [
  'SHORT_CASH',
  'EXCESS_CASH',
  'TRANSFER_MISMATCH',
  'ERROR_CORRECTION',
  'CHANGE_ERROR',
  'COUNTERFEIT_DETECTED',
  'OTHER',
] as const

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      shiftId, 
      declaredCash, 
      varianceReason, 
      notes,
      supervisorApproval,
    } = body

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'shiftId is required' },
        { status: 400 }
      )
    }

    const shift = await prisma.pos_shift.findFirst({
      where: {
        id: shiftId,
        tenantId: session.activeTenantId,
      }
    })

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      )
    }

    if (shift.status === 'RECONCILED') {
      return NextResponse.json(
        { success: false, error: 'Shift is already reconciled. Reconciliation is read-only.' },
        { status: 400 }
      )
    }

    if (shift.status !== 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Shift must be closed before reconciliation' },
        { status: 400 }
      )
    }

    const systemCash = Number(shift.expectedCash || 0)
    const variance = declaredCash - systemCash

    if (variance !== 0 && !supervisorApproval) {
      return NextResponse.json({
        success: false,
        error: 'Supervisor approval required for non-zero variance',
        requiresSupervisorApproval: true,
        variance,
        systemCash,
        declaredCash,
      })
    }

    if (variance !== 0 && !varianceReason) {
      return NextResponse.json({
        success: false,
        error: 'Variance reason is required when there is a cash discrepancy',
      }, { status: 400 })
    }

    const updatedShift = await prisma.pos_shift.update({
      where: { id: shiftId },
      data: {
        status: 'RECONCILED',
        actualCash: declaredCash,
        cashVariance: variance,
        varianceReason: varianceReason || null,
        notes: notes || null,
      }
    })

    console.log('[POS Audit] Shift reconciled:', {
      shiftNumber: shift.shiftNumber,
      systemCash,
      declaredCash,
      variance,
      varianceReason,
      supervisorApproval: !!supervisorApproval,
      reconciledBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      shift: {
        id: updatedShift.id,
        shiftNumber: updatedShift.shiftNumber,
        status: updatedShift.status,
        expectedCash: Number(updatedShift.expectedCash),
        actualCash: Number(updatedShift.actualCash),
        cashVariance: Number(updatedShift.cashVariance),
        varianceReason: updatedShift.varianceReason,
        notes: updatedShift.notes,
      },
      message: 'Shift reconciled successfully',
    })
    
  } catch (error) {
    console.error('Reconciliation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reconcile shift' },
      { status: 500 }
    )
  }
}

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

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'shiftId is required' },
        { status: 400 }
      )
    }

    const shift = await prisma.pos_shift.findFirst({
      where: {
        id: shiftId,
        tenantId: session.activeTenantId,
      }
    })

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'Shift not found' },
        { status: 404 }
      )
    }

    const cashMovements = await prisma.pos_cash_movement.findMany({
      where: { shiftId: shift.id },
      orderBy: { createdAt: 'asc' },
    })

    const salesByPayment = await prisma.pos_sale.groupBy({
      by: ['paymentMethod'],
      where: {
        shiftId: shift.id,
        status: 'COMPLETED',
      },
      _sum: {
        grandTotal: true,
      },
      _count: true,
    })

    const paymentBreakdown = salesByPayment.map(row => ({
      method: row.paymentMethod,
      total: Number(row._sum.grandTotal || 0),
      count: row._count,
    }))

    const cashSalesTotal = paymentBreakdown.find(p => p.method === 'CASH')?.total || 0
    const systemCash = Number(shift.openingFloat) + cashSalesTotal

    return NextResponse.json({
      success: true,
      reconciliation: {
        shift: {
          id: shift.id,
          shiftNumber: shift.shiftNumber,
          locationId: shift.locationId,
          status: shift.status,
          openedAt: shift.openedAt,
          closedAt: shift.closedAt,
          openedByName: shift.openedByName,
          closedByName: shift.closedByName,
        },
        cash: {
          openingFloat: Number(shift.openingFloat),
          cashSales: cashSalesTotal,
          systemTotal: systemCash,
          declaredTotal: shift.actualCash ? Number(shift.actualCash) : null,
          variance: shift.cashVariance ? Number(shift.cashVariance) : null,
          varianceReason: shift.varianceReason,
        },
        paymentBreakdown,
        cashMovements: cashMovements.map(m => ({
          id: m.id,
          type: m.movementType,
          amount: Number(m.amount),
          notes: m.notes,
          performedByName: m.performedByName,
          createdAt: m.createdAt,
        })),
        isReconciled: shift.status === 'RECONCILED',
        notes: shift.notes,
        varianceReasons: VARIANCE_REASONS,
      },
    })
    
  } catch (error) {
    console.error('Reconciliation fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reconciliation data' },
      { status: 500 }
    )
  }
}
