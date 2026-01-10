/**
 * POS Report Service
 * 
 * Generates POS reports: daily summary, shift summary, payment breakdown.
 * Nigeria-first: NGN formatting.
 */

import { prisma } from '@/lib/prisma'
import { 
  POS_CONFIG,
  formatNGN,
  type POSPaymentMethod,
  type DailySummary
} from './config'
import { generateZReport } from './shift-service'

// =============================================================================
// REPORT TYPES
// =============================================================================

export interface PaymentBreakdown {
  method: POSPaymentMethod
  methodLabel: string
  count: number
  total: number
  percentage: number
}

export interface StaffSummary {
  staffId: string
  staffName: string
  salesCount: number
  salesTotal: number
  averageSale: number
  refundCount: number
  refundTotal: number
}

export interface HourlySummary {
  hour: number
  hourLabel: string
  salesCount: number
  salesTotal: number
}

export interface ProductSummary {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
  averagePrice: number
}

// =============================================================================
// REPORT SERVICE
// =============================================================================

/**
 * Generate daily summary for a location
 */
export async function generateDailySummary(
  tenantId: string,
  date: Date,
  locationId?: string
): Promise<DailySummary> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const where: any = {
    tenantId,
    saleDate: {
      gte: startOfDay,
      lte: endOfDay,
    },
  }

  if (locationId) {
    where.locationId = locationId
  }

  // Get all sales for the day
  const sales = await prisma.pos_sale.findMany({
    where,
    include: { inv_audit_items: true },
  })

  // Get shifts for the day
  const shiftWhere: any = {
    tenantId,
    openedAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
  }
  if (locationId) shiftWhere.locationId = locationId

  const shifts = await prisma.pos_shift.findMany({
    where: shiftWhere,
  })

  // Calculate totals
  const completedSales = sales.filter((s: any) => s.status === 'COMPLETED')
  const refundedSales = sales.filter((s: any) => s.status === 'REFUNDED' || s.status === 'PARTIALLY_REFUNDED')

  const grossSales = completedSales.reduce((sum: any, s) => sum + Number(s.grandTotal), 0)
  const totalRefunds = refundedSales.reduce((sum: any, s) => sum + Number(s.grandTotal), 0)
  const netSales = grossSales - totalRefunds
  const transactionCount = completedSales.length
  const averageTransaction = transactionCount > 0 ? netSales / transactionCount : 0

  // Payment breakdown
  const paymentCounts: Record<string, { count: number; total: number }> = {}
  for (const sale of completedSales) {
    const method = sale.paymentMethod
    if (!paymentCounts[method]) {
      paymentCounts[method] = { count: 0, total: 0 }
    }
    paymentCounts[method].count++
    paymentCounts[method].total += Number(sale.grandTotal)
  }

  const paymentBreakdown = Object.entries(paymentCounts).map(([method, data]) => ({
    method: method as POSPaymentMethod,
    count: data.count,
    total: data.total,
  }))

  // Shift stats
  const shiftsOpened = shifts.length
  const shiftsClosed = shifts.filter((s: any) => s.status === 'CLOSED' || s.status === 'RECONCILED').length
  const shiftsReconciled = shifts.filter((s: any) => s.status === 'RECONCILED').length
  const totalCashVariance = shifts.reduce((sum: any, s) => sum + Number(s.cashVariance || 0), 0)

  return {
    date: startOfDay.toISOString().slice(0, 10),
    locationId: locationId || 'ALL',
    locationName: locationId || 'All Locations',
    shiftsOpened,
    shiftsClosed,
    shiftsReconciled,
    grossSales: Math.round(grossSales * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    netSales: Math.round(netSales * 100) / 100,
    transactionCount,
    averageTransaction: Math.round(averageTransaction * 100) / 100,
    paymentBreakdown,
    totalCashVariance: Math.round(totalCashVariance * 100) / 100,
    currency: POS_CONFIG.currency,
    generatedAt: new Date(),
  }
}

/**
 * Generate shift summary (alias for Z-report)
 */
export async function generateShiftSummary(
  tenantId: string,
  shiftId: string
) {
  return generateZReport(tenantId, shiftId)
}

/**
 * Generate payment method breakdown for a date range
 */
export async function generatePaymentBreakdown(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  locationId?: string
): Promise<PaymentBreakdown[]> {
  const where: any = {
    tenantId,
    status: 'COMPLETED',
    saleDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (locationId) {
    where.locationId = locationId
  }

  const sales = await prisma.pos_sale.findMany({
    where,
    select: {
      paymentMethod: true,
      grandTotal: true,
    },
  })

  const totals: Record<string, { count: number; total: number }> = {}
  let grandTotal = 0

  for (const sale of sales) {
    const method = sale.paymentMethod
    if (!totals[method]) {
      totals[method] = { count: 0, total: 0 }
    }
    totals[method].count++
    totals[method].total += Number(sale.grandTotal)
    grandTotal += Number(sale.grandTotal)
  }

  const methodLabels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    BANK_TRANSFER: 'Bank Transfer',
    MOBILE_MONEY: 'Mobile Money',
    POS_TERMINAL: 'POS Terminal',
    WALLET: 'Store Credit',
    SPLIT: 'Split Payment',
  }

  return Object.entries(totals)
    .map(([method, data]) => ({
      method: method as POSPaymentMethod,
      methodLabel: methodLabels[method] || method,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
      percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a: any, b: any) => b.total - a.total)
}

/**
 * Generate staff performance summary
 */
export async function generateStaffSummary(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  locationId?: string
): Promise<StaffSummary[]> {
  const where: any = {
    tenantId,
    saleDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (locationId) {
    where.locationId = locationId
  }

  const sales = await prisma.pos_sale.findMany({
    where,
    select: {
      staffId: true,
      staffName: true,
      status: true,
      grandTotal: true,
    },
  })

  const staffStats: Record<string, StaffSummary> = {}

  for (const sale of sales) {
    if (!staffStats[sale.staffId]) {
      staffStats[sale.staffId] = {
        staffId: sale.staffId,
        staffName: sale.staffName,
        salesCount: 0,
        salesTotal: 0,
        averageSale: 0,
        refundCount: 0,
        refundTotal: 0,
      }
    }

    if (sale.status === 'COMPLETED') {
      staffStats[sale.staffId].salesCount++
      staffStats[sale.staffId].salesTotal += Number(sale.grandTotal)
    } else if (sale.status === 'REFUNDED' || sale.status === 'PARTIALLY_REFUNDED') {
      staffStats[sale.staffId].refundCount++
      staffStats[sale.staffId].refundTotal += Number(sale.grandTotal)
    }
  }

  return Object.values(staffStats)
    .map(staff => ({
      ...staff,
      salesTotal: Math.round(staff.salesTotal * 100) / 100,
      refundTotal: Math.round(staff.refundTotal * 100) / 100,
      averageSale: staff.salesCount > 0 
        ? Math.round((staff.salesTotal / staff.salesCount) * 100) / 100 
        : 0,
    }))
    .sort((a: any, b: any) => b.salesTotal - a.salesTotal)
}

/**
 * Generate hourly sales breakdown
 */
export async function generateHourlySummary(
  tenantId: string,
  date: Date,
  locationId?: string
): Promise<HourlySummary[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const where: any = {
    tenantId,
    status: 'COMPLETED',
    saleDate: {
      gte: startOfDay,
      lte: endOfDay,
    },
  }

  if (locationId) {
    where.locationId = locationId
  }

  const sales = await prisma.pos_sale.findMany({
    where,
    select: {
      saleDate: true,
      grandTotal: true,
    },
  })

  // Initialize all hours
  const hourlyData: Record<number, { count: number; total: number }> = {}
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { count: 0, total: 0 }
  }

  // Aggregate by hour
  for (const sale of sales) {
    const hour = new Date(sale.saleDate).getHours()
    hourlyData[hour].count++
    hourlyData[hour].total += Number(sale.grandTotal)
  }

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    hourLabel: formatHour(parseInt(hour)),
    salesCount: data.count,
    salesTotal: Math.round(data.total * 100) / 100,
  }))
}

/**
 * Generate top products summary
 */
export async function generateTopProducts(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  locationId?: string,
  limit: number = 10
): Promise<ProductSummary[]> {
  const where: any = {
    sale: {
      tenantId,
      status: 'COMPLETED',
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  }

  if (locationId) {
    where.sale.locationId = locationId
  }

  const items = await prisma.pos_sale_item.findMany({
    where,
    select: {
      productId: true,
      productName: true,
      quantity: true,
      lineTotal: true,
      unitPrice: true,
    },
  })

  const productStats: Record<string, ProductSummary> = {}

  for (const item of items) {
    if (!productStats[item.productId]) {
      productStats[item.productId] = {
        productId: item.productId,
        productName: item.productName,
        quantitySold: 0,
        revenue: 0,
        averagePrice: 0,
      }
    }

    productStats[item.productId].quantitySold += item.quantity
    productStats[item.productId].revenue += Number(item.lineTotal)
  }

  return Object.values(productStats)
    .map(product => ({
      ...product,
      revenue: Math.round(product.revenue * 100) / 100,
      averagePrice: product.quantitySold > 0 
        ? Math.round((product.revenue / product.quantitySold) * 100) / 100 
        : 0,
    }))
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, limit)
}

/**
 * Get sales trend for date range (daily totals)
 */
export async function getSalesTrend(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  locationId?: string
): Promise<{ date: string; salesCount: number; salesTotal: number }[]> {
  const where: any = {
    tenantId,
    status: 'COMPLETED',
    saleDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (locationId) {
    where.locationId = locationId
  }

  const sales = await prisma.pos_sale.findMany({
    where,
    select: {
      saleDate: true,
      grandTotal: true,
    },
    orderBy: { saleDate: 'asc' },
  })

  const dailyData: Record<string, { count: number; total: number }> = {}

  for (const sale of sales) {
    const dateKey = new Date(sale.saleDate).toISOString().slice(0, 10)
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { count: 0, total: 0 }
    }
    dailyData[dateKey].count++
    dailyData[dateKey].total += Number(sale.grandTotal)
  }

  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      salesCount: data.count,
      salesTotal: Math.round(data.total * 100) / 100,
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
}

// =============================================================================
// HELPERS
// =============================================================================

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}
