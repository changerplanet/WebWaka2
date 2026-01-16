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
    const locationId = searchParams.get('locationId')
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const startOfDay = new Date(dateStr)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(dateStr)
    endOfDay.setHours(23, 59, 59, 999)

    const baseWhere = {
      tenantId: session.activeTenantId,
      ...(locationId ? { locationId } : {}),
    }

    const [
      openShifts,
      todaysSales,
      todaysVoids,
      todaysRefunds,
      pendingAdjustments,
      todaysTransfers,
    ] = await Promise.all([
      prisma.pos_shift.findMany({
        where: {
          ...baseWhere,
          status: 'OPEN',
        },
        orderBy: { openedAt: 'desc' },
      }),

      prisma.pos_sale.findMany({
        where: {
          ...baseWhere,
          saleDate: { gte: startOfDay, lte: endOfDay },
        },
        select: {
          id: true,
          saleNumber: true,
          grandTotal: true,
          paymentMethod: true,
          status: true,
          discountTotal: true,
          staffName: true,
          saleDate: true,
          voidReason: true,
        },
        orderBy: { saleDate: 'desc' },
      }),

      prisma.pos_sale.count({
        where: {
          ...baseWhere,
          status: 'VOIDED',
          voidedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),

      prisma.pos_sale.count({
        where: {
          ...baseWhere,
          status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
          saleDate: { gte: startOfDay, lte: endOfDay },
        },
      }),

      (prisma as any).pos_inventory_adjustment.findMany({
        where: {
          tenantId: session.activeTenantId,
          performedAt: { gte: startOfDay, lte: endOfDay },
          ...(locationId ? { locationId } : {}),
        },
        orderBy: { performedAt: 'desc' },
        take: 20,
      }),

      (prisma as any).pos_drawer_transfer.findMany({
        where: {
          tenantId: session.activeTenantId,
          initiatedAt: { gte: startOfDay, lte: endOfDay },
          ...(locationId ? { locationId } : {}),
        },
        orderBy: { initiatedAt: 'desc' },
      }),
    ])

    const completedSales = todaysSales.filter(s => s.status === 'COMPLETED')
    const voidedSales = todaysSales.filter(s => s.status === 'VOIDED')

    const totalSalesAmount = completedSales.reduce((sum, s) => sum + Number(s.grandTotal), 0)
    const totalDiscounts = completedSales.reduce((sum, s) => sum + Number(s.discountTotal), 0)
    const totalVoidedAmount = voidedSales.reduce((sum, s) => sum + Number(s.grandTotal), 0)

    const byPaymentMethod: Record<string, { count: number; total: number }> = {}
    for (const sale of completedSales) {
      if (!byPaymentMethod[sale.paymentMethod]) {
        byPaymentMethod[sale.paymentMethod] = { count: 0, total: 0 }
      }
      byPaymentMethod[sale.paymentMethod].count++
      byPaymentMethod[sale.paymentMethod].total += Number(sale.grandTotal)
    }

    const byStaff: Record<string, { count: number; total: number; voids: number; discounts: number }> = {}
    for (const sale of todaysSales) {
      const name = sale.staffName || 'Unknown'
      if (!byStaff[name]) {
        byStaff[name] = { count: 0, total: 0, voids: 0, discounts: 0 }
      }
      if (sale.status === 'COMPLETED') {
        byStaff[name].count++
        byStaff[name].total += Number(sale.grandTotal)
        byStaff[name].discounts += Number(sale.discountTotal)
      } else if (sale.status === 'VOIDED') {
        byStaff[name].voids++
      }
    }

    const riskIndicators = []
    
    const voidRate = todaysSales.length > 0 
      ? (todaysVoids / todaysSales.length) * 100 
      : 0
    if (voidRate > 10) {
      riskIndicators.push({
        type: 'EXCESSIVE_VOIDS',
        severity: voidRate > 20 ? 'HIGH' : 'MEDIUM',
        message: `Void rate is ${voidRate.toFixed(1)}% (${todaysVoids} of ${todaysSales.length} sales)`,
      })
    }

    const discountRate = totalSalesAmount > 0 
      ? (totalDiscounts / totalSalesAmount) * 100 
      : 0
    if (discountRate > 15) {
      riskIndicators.push({
        type: 'EXCESSIVE_DISCOUNTS',
        severity: discountRate > 25 ? 'HIGH' : 'MEDIUM',
        message: `Discount rate is ${discountRate.toFixed(1)}% of sales`,
      })
    }

    for (const [staffName, stats] of Object.entries(byStaff)) {
      if (stats.count > 0 && stats.voids > 3) {
        riskIndicators.push({
          type: 'STAFF_VOIDS',
          severity: stats.voids > 5 ? 'HIGH' : 'MEDIUM',
          message: `${staffName} has ${stats.voids} voids today`,
          staffName,
        })
      }
    }

    const shiftsWithVariance = await prisma.pos_shift.findMany({
      where: {
        ...baseWhere,
        status: 'RECONCILED',
        closedAt: { gte: startOfDay, lte: endOfDay },
        NOT: { cashVariance: 0 },
      },
      select: {
        shiftNumber: true,
        cashVariance: true,
        varianceReason: true,
        closedByName: true,
      },
    })

    for (const shift of shiftsWithVariance) {
      const variance = Math.abs(Number(shift.cashVariance))
      if (variance > 500) {
        riskIndicators.push({
          type: 'CASH_SHORTAGE',
          severity: variance > 2000 ? 'HIGH' : 'MEDIUM',
          message: `${shift.shiftNumber} has ₦${variance.toLocaleString()} variance (${shift.varianceReason})`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      locationId,

      openShifts: openShifts.map(s => ({
        id: s.id,
        shiftNumber: s.shiftNumber,
        registerId: s.registerId,
        openedByName: s.openedByName,
        openedAt: s.openedAt,
        locationId: s.locationId,
      })),

      summary: {
        totalSales: completedSales.length,
        totalSalesAmount,
        totalVoids: todaysVoids,
        totalVoidedAmount,
        totalRefunds: todaysRefunds,
        totalDiscounts,
        discountRate,
        voidRate,
        adjustmentCount: pendingAdjustments.length,
        transferCount: todaysTransfers.length,
      },

      byPaymentMethod,
      byStaff,

      riskIndicators,

      recentVoids: voidedSales.slice(0, 10).map(v => ({
        saleNumber: v.saleNumber,
        amount: Number(v.grandTotal),
        reason: v.voidReason,
        staffName: v.staffName,
        saleDate: v.saleDate,
      })),

      recentAdjustments: pendingAdjustments.map((a: any) => ({
        adjustmentNumber: a.adjustmentNumber,
        adjustmentType: a.adjustmentType,
        productName: a.productName,
        quantityChange: a.quantityChange,
        reason: a.reason,
        approvedByName: a.approvedByName,
        performedAt: a.performedAt,
      })),

      recentTransfers: todaysTransfers.map((t: any) => ({
        transferNumber: t.transferNumber,
        transferType: t.transferType,
        amount: Number(t.amount),
        reason: t.reason,
        approvedByName: t.approvedByName,
        initiatedAt: t.initiatedAt,
      })),
    })
    
  } catch (error) {
    console.error('[POS] Error loading oversight dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
