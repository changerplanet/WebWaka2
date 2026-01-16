export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const reportType = searchParams.get('type') || 'X'
    const shiftId = searchParams.get('shiftId')
    const locationId = searchParams.get('locationId')

    if (!shiftId && !locationId) {
      return NextResponse.json(
        { success: false, error: 'Either shiftId or locationId is required' },
        { status: 400 }
      )
    }

    let shift
    if (shiftId) {
      shift = await prisma.pos_shift.findFirst({
        where: {
          id: shiftId,
          tenantId: session.activeTenantId,
        }
      })
    } else if (locationId) {
      shift = await prisma.pos_shift.findFirst({
        where: {
          tenantId: session.activeTenantId,
          locationId,
          status: 'OPEN',
        }
      })
    }

    if (!shift) {
      return NextResponse.json(
        { success: false, error: 'No active shift found' },
        { status: 404 }
      )
    }

    if (reportType === 'Z' && shift.status !== 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Z Report requires a closed shift' },
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
        subtotal: true,
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
      _count: true,
    })

    const refundSummary = await prisma.pos_sale.aggregate({
      where: {
        shiftId: shift.id,
        status: { in: ['VOIDED', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
      },
      _sum: { grandTotal: true },
      _count: true,
    })

    const paymentBreakdown = salesByPayment.map(row => ({
      method: row.paymentMethod,
      total: Number(row._sum.grandTotal || 0),
      count: row._count,
    }))

    const cashPayment = paymentBreakdown.find(p => p.method === 'CASH')
    const systemCashTotal = Number(shift.openingFloat) + (cashPayment?.total || 0)

    const report = {
      reportType,
      reportNumber: `${reportType}-${shift.shiftNumber}`,
      generatedAt: new Date().toISOString(),
      isImmutable: reportType === 'Z',
      shift: {
        id: shift.id,
        shiftNumber: shift.shiftNumber,
        registerId: shift.registerId,
        locationId: shift.locationId,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        status: shift.status,
        openedByName: shift.openedByName,
        closedByName: shift.closedByName,
      },
      summary: {
        grossSales: Number(salesSummary._sum.grandTotal || 0),
        subtotal: Number(salesSummary._sum.subtotal || 0),
        totalVAT: Number(salesSummary._sum.taxTotal || 0),
        vatRate: 0.075,
        totalDiscounts: Number(salesSummary._sum.discountTotal || 0),
        netSales: Number(salesSummary._sum.grandTotal || 0) - Number(refundSummary._sum.grandTotal || 0),
        transactionCount: salesSummary._count,
        averageTransaction: salesSummary._count > 0 
          ? Number(salesSummary._sum.grandTotal || 0) / salesSummary._count 
          : 0,
      },
      paymentBreakdown,
      cash: {
        openingFloat: Number(shift.openingFloat),
        cashSales: paymentBreakdown.find(p => p.method === 'CASH')?.total || 0,
        systemTotal: systemCashTotal,
        declaredTotal: shift.actualCash ? Number(shift.actualCash) : null,
        variance: shift.cashVariance ? Number(shift.cashVariance) : null,
      },
      refunds: {
        total: Number(refundSummary._sum.grandTotal || 0),
        count: refundSummary._count,
      },
      currency: 'NGN',
    }

    return NextResponse.json({
      success: true,
      report,
    })
    
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
