export const dynamic = 'force-dynamic'

/**
 * POS Shifts API
 * 
 * Manages shift open/close operations for POS module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { getCurrentSession } from '@/lib/auth'

/**
 * GET /api/pos/shifts
 * List shifts for a tenant/location
 */
export async function GET(request: NextRequest) {
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const session = await getCurrentSession()
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const tenantId = session.activeTenantId

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    
    const where: any = { tenantId }
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    
    const [shifts, total] = await Promise.all([
      prisma.pos_shift.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.pos_shift.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('[POS Shifts] Error fetching shifts:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pos/shifts
 * Open a new shift or close an existing shift
 */
export async function POST(request: NextRequest) {
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const session = await getCurrentSession()
    if (!session || !session.activeTenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const tenantId = session.activeTenantId
    const userId = session.user.id
    const userName = session.user.name || session.user.email || 'Unknown'

    const body = await request.json()
    const { action, locationId, shiftId, openingFloat, closingData } = body

    if (action === 'open') {
      if (!locationId) {
        return NextResponse.json(
          { success: false, error: 'locationId is required to open a shift' },
          { status: 400 }
        )
      }

      const existingOpenShift = await prisma.pos_shift.findFirst({
        where: {
          tenantId,
          locationId,
          status: 'OPEN'
        }
      })

      if (existingOpenShift) {
        return NextResponse.json(
          { success: false, error: 'A shift is already open for this location', existingShift: existingOpenShift },
          { status: 400 }
        )
      }

      const today = new Date()
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
      const count = await prisma.pos_shift.count({
        where: {
          tenantId,
          shiftNumber: { startsWith: `SHIFT-${dateStr}` }
        }
      })
      const shiftNumber = `SHIFT-${dateStr}-${String(count + 1).padStart(3, '0')}`

      const registerId = `REG-${locationId.slice(-4)}-${Date.now().toString(36).toUpperCase()}`

      const newShift = await prisma.pos_shift.create({
        data: {
          tenantId,
          locationId,
          registerId,
          shiftNumber,
          openedById: userId,
          openedByName: userName,
          openingFloat: openingFloat || 0,
          status: 'OPEN',
          currency: 'NGN'
        }
      })

      await prisma.pos_cash_movement.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          shiftId: newShift.id,
          movementType: 'OPEN_FLOAT',
          amount: openingFloat || 0,
          currency: 'NGN',
          performedById: userId,
          performedByName: userName,
          notes: 'Opening float',
        }
      })

      console.log('[POS Audit] Shift opened:', {
        shiftNumber,
        registerId,
        locationId,
        openingFloat: openingFloat || 0,
        userId,
      })

      return NextResponse.json({
        success: true,
        shift: newShift,
        message: 'Shift opened successfully'
      })
    }

    if (action === 'close') {
      if (!shiftId) {
        return NextResponse.json(
          { success: false, error: 'shiftId is required to close a shift' },
          { status: 400 }
        )
      }

      const shift = await prisma.pos_shift.findFirst({
        where: { 
          id: shiftId,
          tenantId 
        }
      })

      if (!shift) {
        return NextResponse.json(
          { success: false, error: 'Shift not found' },
          { status: 404 }
        )
      }

      if (shift.status !== 'OPEN') {
        return NextResponse.json(
          { success: false, error: 'Shift is not open' },
          { status: 400 }
        )
      }

      const salesSummary = await prisma.pos_sale.aggregate({
        where: {
          shiftId: shift.id,
          status: 'COMPLETED',
        },
        _sum: {
          grandTotal: true,
          taxTotal: true,
          discountTotal: true,
        },
        _count: true,
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
      })

      const paymentTotals: Record<string, number> = {}
      for (const row of salesByPayment) {
        paymentTotals[row.paymentMethod] = Number(row._sum.grandTotal || 0)
      }

      const refundSummary = await prisma.pos_sale.aggregate({
        where: {
          shiftId: shift.id,
          status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
        },
        _sum: { grandTotal: true },
        _count: true,
      })

      const systemCash = Number(shift.openingFloat) + (paymentTotals['CASH'] || 0)
      const declaredCash = closingData?.actualCash || 0
      const variance = declaredCash - systemCash

      const updatedShift = await prisma.pos_shift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedById: closingData?.userId || userId,
          closedByName: closingData?.userName || userName,
          totalSales: salesSummary._sum.grandTotal || 0,
          totalRefunds: refundSummary._sum.grandTotal || 0,
          netSales: Number(salesSummary._sum.grandTotal || 0) - Number(refundSummary._sum.grandTotal || 0),
          transactionCount: salesSummary._count,
          refundCount: refundSummary._count,
          cashTotal: paymentTotals['CASH'] || 0,
          cardTotal: paymentTotals['CARD'] || 0,
          transferTotal: (paymentTotals['TRANSFER'] || 0) + (paymentTotals['BANK_TRANSFER'] || 0),
          mobileMoneyTotal: paymentTotals['MOBILE_MONEY'] || 0,
          walletTotal: paymentTotals['WALLET'] || 0,
          expectedCash: systemCash,
          actualCash: declaredCash,
          cashVariance: variance,
          varianceReason: closingData?.varianceReason || null,
          notes: closingData?.notes || null,
        }
      })

      console.log('[POS Audit] Shift closed:', {
        shiftNumber: shift.shiftNumber,
        systemCash,
        declaredCash,
        variance,
        totalSales: salesSummary._sum.grandTotal,
        userId: closingData?.userId || userId,
      })

      return NextResponse.json({
        success: true,
        shift: {
          ...updatedShift,
          openingFloat: Number(updatedShift.openingFloat),
          totalSales: Number(updatedShift.totalSales),
          totalRefunds: Number(updatedShift.totalRefunds),
          netSales: Number(updatedShift.netSales),
          cashTotal: Number(updatedShift.cashTotal),
          cardTotal: Number(updatedShift.cardTotal),
          transferTotal: Number(updatedShift.transferTotal),
          mobileMoneyTotal: Number(updatedShift.mobileMoneyTotal),
          expectedCash: Number(updatedShift.expectedCash),
          actualCash: Number(updatedShift.actualCash),
          cashVariance: Number(updatedShift.cashVariance),
        },
        message: 'Shift closed successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "open" or "close"' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('[POS Shifts] Error managing shift:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
