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
    const registerId = searchParams.get('registerId')
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const view = searchParams.get('view') || 'location'

    const startOfDay = new Date(dateStr)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(dateStr)
    endOfDay.setHours(23, 59, 59, 999)

    const baseWhere = {
      tenantId: session.activeTenantId,
    }

    const shifts = await prisma.pos_shift.findMany({
      where: {
        ...baseWhere,
        openedAt: { gte: startOfDay, lte: endOfDay },
        ...(locationId ? { locationId } : {}),
        ...(registerId ? { registerId } : {}),
      },
      include: {
        sales: {
          select: {
            id: true,
            grandTotal: true,
            paymentMethod: true,
            status: true,
          },
        },
      },
      orderBy: { openedAt: 'asc' },
    })

    const locations = await prisma.location.findMany({
      where: {
        tenantId: session.activeTenantId,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const transfers = await (prisma as any).pos_drawer_transfer.findMany({
      where: {
        tenantId: session.activeTenantId,
        initiatedAt: { gte: startOfDay, lte: endOfDay },
        ...(locationId ? { locationId } : {}),
      },
    })

    interface RegisterSummary {
      registerId: string
      locationId: string
      locationName: string
      shifts: Array<{
        shiftNumber: string
        status: string
        openedByName: string
        closedByName: string | null
        openedAt: Date
        closedAt: Date | null
        openingFloat: number
        expectedCash: number | null
        actualCash: number | null
        cashVariance: number | null
        varianceReason: string | null
        totalSales: number
        totalRefunds: number
        salesCount: number
        byPaymentMethod: Record<string, { count: number; total: number }>
      }>
      totals: {
        salesCount: number
        totalSales: number
        totalCash: number
        totalCard: number
        totalTransfer: number
        totalMobileMoney: number
        totalOther: number
        totalVariance: number
        openingFloat: number
        closingCash: number
        transfersIn: number
        transfersOut: number
      }
    }

    const byRegister: Record<string, RegisterSummary> = {}

    for (const shift of shifts) {
      const key = shift.registerId || shift.locationId
      const loc = locations.find(l => l.id === shift.locationId)

      if (!byRegister[key]) {
        byRegister[key] = {
          registerId: shift.registerId || 'UNKNOWN',
          locationId: shift.locationId,
          locationName: loc?.name || 'Unknown Location',
          shifts: [],
          totals: {
            salesCount: 0,
            totalSales: 0,
            totalCash: 0,
            totalCard: 0,
            totalTransfer: 0,
            totalMobileMoney: 0,
            totalOther: 0,
            totalVariance: 0,
            openingFloat: 0,
            closingCash: 0,
            transfersIn: 0,
            transfersOut: 0,
          },
        }
      }

      const completedSales = shift.sales.filter(s => s.status === 'COMPLETED')
      const byPaymentMethod: Record<string, { count: number; total: number }> = {}
      
      for (const sale of completedSales) {
        const method = sale.paymentMethod
        if (!byPaymentMethod[method]) {
          byPaymentMethod[method] = { count: 0, total: 0 }
        }
        byPaymentMethod[method].count++
        byPaymentMethod[method].total += Number(sale.grandTotal)
      }

      const shiftTotalSales = completedSales.reduce((sum, s) => sum + Number(s.grandTotal), 0)

      byRegister[key].shifts.push({
        shiftNumber: shift.shiftNumber,
        status: shift.status,
        openedByName: shift.openedByName,
        closedByName: shift.closedByName,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        openingFloat: Number(shift.openingFloat),
        expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
        actualCash: shift.actualCash ? Number(shift.actualCash) : null,
        cashVariance: shift.cashVariance ? Number(shift.cashVariance) : null,
        varianceReason: shift.varianceReason,
        totalSales: shiftTotalSales,
        totalRefunds: Number(shift.totalRefunds),
        salesCount: completedSales.length,
        byPaymentMethod,
      })

      byRegister[key].totals.salesCount += completedSales.length
      byRegister[key].totals.totalSales += shiftTotalSales
      byRegister[key].totals.openingFloat += Number(shift.openingFloat)
      byRegister[key].totals.closingCash += shift.actualCash ? Number(shift.actualCash) : 0
      byRegister[key].totals.totalVariance += shift.cashVariance ? Number(shift.cashVariance) : 0

      byRegister[key].totals.totalCash += byPaymentMethod['CASH']?.total || 0
      byRegister[key].totals.totalCard += byPaymentMethod['CARD']?.total || 0
      byRegister[key].totals.totalTransfer += (byPaymentMethod['TRANSFER']?.total || 0) + (byPaymentMethod['BANK_TRANSFER']?.total || 0)
      byRegister[key].totals.totalMobileMoney += byPaymentMethod['MOBILE_MONEY']?.total || 0
      byRegister[key].totals.totalOther += byPaymentMethod['WALLET']?.total || 0
    }

    for (const transfer of transfers) {
      const amount = Number(transfer.amount)
      
      if (transfer.fromShiftId) {
        const fromShift = shifts.find(s => s.id === transfer.fromShiftId)
        if (fromShift) {
          const key = fromShift.registerId || fromShift.locationId
          if (byRegister[key]) {
            byRegister[key].totals.transfersOut += amount
          }
        }
      }
      
      if (transfer.toShiftId) {
        const toShift = shifts.find(s => s.id === transfer.toShiftId)
        if (toShift) {
          const key = toShift.registerId || toShift.locationId
          if (byRegister[key]) {
            byRegister[key].totals.transfersIn += amount
          }
        }
      }
    }

    interface LocationSummary {
      locationId: string
      locationName: string
      registers: RegisterSummary[]
      totals: RegisterSummary['totals']
    }

    const byLocation: Record<string, LocationSummary> = {}

    for (const register of Object.values(byRegister)) {
      if (!byLocation[register.locationId]) {
        byLocation[register.locationId] = {
          locationId: register.locationId,
          locationName: register.locationName,
          registers: [],
          totals: {
            salesCount: 0,
            totalSales: 0,
            totalCash: 0,
            totalCard: 0,
            totalTransfer: 0,
            totalMobileMoney: 0,
            totalOther: 0,
            totalVariance: 0,
            openingFloat: 0,
            closingCash: 0,
            transfersIn: 0,
            transfersOut: 0,
          },
        }
      }

      byLocation[register.locationId].registers.push(register)
      
      for (const key of Object.keys(byLocation[register.locationId].totals) as Array<keyof RegisterSummary['totals']>) {
        byLocation[register.locationId].totals[key] += register.totals[key]
      }
    }

    const tenantTotals = {
      salesCount: 0,
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      totalTransfer: 0,
      totalMobileMoney: 0,
      totalOther: 0,
      totalVariance: 0,
      openingFloat: 0,
      closingCash: 0,
      transfersIn: 0,
      transfersOut: 0,
      locationCount: Object.keys(byLocation).length,
      registerCount: Object.keys(byRegister).length,
      shiftCount: shifts.length,
    }

    for (const loc of Object.values(byLocation)) {
      for (const key of Object.keys(tenantTotals) as Array<keyof typeof tenantTotals>) {
        if (key in loc.totals) {
          (tenantTotals as any)[key] += (loc.totals as any)[key]
        }
      }
    }

    const reconciledShifts = shifts.filter(s => s.status === 'RECONCILED')
    const unreconciledShifts = shifts.filter(s => s.status !== 'RECONCILED' && s.status !== 'OPEN')

    return NextResponse.json({
      success: true,
      date: dateStr,
      view,

      tenantTotals,

      byLocation: Object.values(byLocation),

      byRegister: Object.values(byRegister),

      reconciliationStatus: {
        total: shifts.length,
        open: shifts.filter(s => s.status === 'OPEN').length,
        closed: shifts.filter(s => s.status === 'CLOSED').length,
        reconciled: reconciledShifts.length,
        withVariance: reconciledShifts.filter(s => Number(s.cashVariance) !== 0).length,
      },

      zReportLinks: reconciledShifts.map(s => ({
        shiftId: s.id,
        shiftNumber: s.shiftNumber,
        closedAt: s.closedAt,
        variance: Number(s.cashVariance),
      })),

      unreconciledShifts: unreconciledShifts.map(s => ({
        shiftId: s.id,
        shiftNumber: s.shiftNumber,
        status: s.status,
        closedAt: s.closedAt,
        closedByName: s.closedByName,
      })),
    })
    
  } catch (error) {
    console.error('[POS] Error loading daily reconciliation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
