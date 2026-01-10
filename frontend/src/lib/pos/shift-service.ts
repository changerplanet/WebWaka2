/**
 * POS Shift Service
 * 
 * Manages register shifts: open, close, reconcile.
 * Generates Z-reports for end-of-day reconciliation.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { 
  POS_CONFIG, 
  generateShiftNumber, 
  formatNGN,
  type POSShift,
  type POSShiftStatus,
  type ZReport,
  type POSPaymentMethod
} from './config'

// =============================================================================
// SHIFT SERVICE
// =============================================================================

/**
 * Open a new shift
 */
export async function openShift(data: {
  tenantId: string
  platformInstanceId?: string
  locationId: string
  registerId?: string
  openedById: string
  openedByName: string
  openingFloat?: number
}): Promise<POSShift> {
  // Check for existing open shift at this location
  const existingShift = await prisma.pos_shift.findFirst({
    where: {
      tenantId: data.tenantId,
      locationId: data.locationId,
      status: 'OPEN',
    },
  })

  if (existingShift) {
    throw new Error(`Shift ${existingShift.shiftNumber} is already open at this location. Close it before opening a new one.`)
  }

  // Get next sequence number for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayShifts = await prisma.pos_shift.count({
    where: {
      tenantId: data.tenantId,
      openedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  const shiftNumber = generateShiftNumber(todayShifts + 1)
  const openingFloat = data.openingFloat ?? POS_CONFIG.defaultOpeningFloat

  const shift = await prisma.pos_shift.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      platformInstanceId: data.platformInstanceId,
      locationId: data.locationId,
      registerId: data.registerId,
      shiftNumber,
      openedById: data.openedById,
      openedByName: data.openedByName,
      openingFloat,
      status: 'OPEN',
      currency: POS_CONFIG.currency,
    }),
  })

  // Record opening float as cash movement
  await prisma.pos_cash_movement.create({
    data: withPrismaDefaults({
      tenantId: data.tenantId,
      shiftId: shift.id,
      movementType: 'OPEN_FLOAT',
      amount: openingFloat,
      direction: 'IN',
      balanceBefore: 0,
      balanceAfter: openingFloat,
      currency: POS_CONFIG.currency,
      performedById: data.openedById,
      performedByName: data.openedByName,
    }),
  })

  return mapShiftToInterface(shift)
}

/**
 * Get active shift for a location
 */
export async function getActiveShift(
  tenantId: string, 
  locationId: string
): Promise<POSShift | null> {
  const shift = await prisma.pos_shift.findFirst({
    where: {
      tenantId,
      locationId,
      status: 'OPEN',
    },
  })

  return shift ? mapShiftToInterface(shift) : null
}

/**
 * Get shift by ID
 */
export async function getShift(
  tenantId: string, 
  shiftId: string
): Promise<POSShift | null> {
  const shift = await prisma.pos_shift.findFirst({
    where: {
      tenantId,
      id: shiftId,
    },
  })

  return shift ? mapShiftToInterface(shift) : null
}

/**
 * List shifts for a tenant
 */
export async function listShifts(
  tenantId: string,
  options?: {
    locationId?: string
    status?: POSShiftStatus
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<{ shifts: POSShift[]; total: number }> {
  const where: any = { tenantId }

  if (options?.locationId) {
    where.locationId = options.locationId
  }
  if (options?.status) {
    where.status = options.status
  }
  if (options?.startDate || options?.endDate) {
    where.openedAt = {}
    if (options.startDate) where.openedAt.gte = options.startDate
    if (options.endDate) where.openedAt.lte = options.endDate
  }

  const [shifts, total] = await Promise.all([
    prisma.pos_shift.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.pos_shift.count({ where }),
  ])

  return {
    shifts: shifts.map(mapShiftToInterface),
    total,
  }
}

/**
 * Close a shift
 */
export async function closeShift(data: {
  tenantId: string
  shiftId: string
  closedById: string
  closedByName: string
  actualCash: number
  notes?: string
}): Promise<POSShift> {
  const shift = await prisma.pos_shift.findFirst({
    where: {
      tenantId: data.tenantId,
      id: data.shiftId,
      status: 'OPEN',
    },
  })

  if (!shift) {
    throw new Error('Shift not found or already closed')
  }

  // Calculate expected cash
  const expectedCash = Number(shift.openingFloat) + Number(shift.cashTotal) - Number(shift.totalRefunds)
  const cashVariance = data.actualCash - expectedCash

  const updatedShift = await prisma.pos_shift.update({
    where: { id: data.shiftId },
    data: {
      status: 'CLOSED',
      closedById: data.closedById,
      closedByName: data.closedByName,
      closedAt: new Date(),
      actualCash: data.actualCash,
      expectedCash,
      cashVariance,
      notes: data.notes,
    },
  })

  return mapShiftToInterface(updatedShift)
}

/**
 * Reconcile a shift (confirm cash count)
 */
export async function reconcileShift(data: {
  tenantId: string
  shiftId: string
  varianceReason?: string
  notes?: string
}): Promise<POSShift> {
  const shift = await prisma.pos_shift.findFirst({
    where: {
      tenantId: data.tenantId,
      id: data.shiftId,
      status: 'CLOSED',
    },
  })

  if (!shift) {
    throw new Error('Shift not found or not in CLOSED status')
  }

  // Check if variance requires explanation
  const variance = Math.abs(Number(shift.cashVariance || 0))
  if (variance > POS_CONFIG.maxCashVarianceWarning && !data.varianceReason) {
    throw new Error(`Cash variance of ${formatNGN(variance)} requires an explanation`)
  }

  const updatedShift = await prisma.pos_shift.update({
    where: { id: data.shiftId },
    data: {
      status: 'RECONCILED',
      varianceReason: data.varianceReason,
      notes: data.notes ? `${shift.notes || ''}\n${data.notes}`.trim() : shift.notes,
    },
  })

  return mapShiftToInterface(updatedShift)
}

/**
 * Calculate cash variance for a shift
 */
export async function calculateCashVariance(
  tenantId: string,
  shiftId: string
): Promise<{
  openingFloat: number
  cashSales: number
  cashRefunds: number
  paidOut: number
  paidIn: number
  safeDrops: number
  expectedCash: number
}> {
  const shift = await prisma.pos_shift.findFirst({
    where: { tenantId, id: shiftId },
  })

  if (!shift) {
    throw new Error('Shift not found')
  }

  // Get all cash movements for this shift
  const movements = await prisma.pos_cash_movement.findMany({
    where: { shiftId },
  })

  let openingFloat = 0
  let cashSales = 0
  let cashRefunds = 0
  let paidOut = 0
  let paidIn = 0
  let safeDrops = 0

  for (const movement of movements) {
    const amount = Number(movement.amount)
    switch (movement.movementType) {
      case 'OPEN_FLOAT':
        openingFloat = amount
        break
      case 'SALE':
        cashSales += amount
        break
      case 'REFUND':
        cashRefunds += amount
        break
      case 'PAYOUT':
        paidOut += amount
        break
      case 'PAY_IN':
        paidIn += amount
        break
      case 'DROP':
        safeDrops += amount
        break
    }
  }

  const expectedCash = openingFloat + cashSales + paidIn - cashRefunds - paidOut - safeDrops

  return {
    openingFloat,
    cashSales,
    cashRefunds,
    paidOut,
    paidIn,
    safeDrops,
    expectedCash: Math.round(expectedCash * 100) / 100,
  }
}

/**
 * Generate Z-Report for a closed shift
 */
export async function generateZReport(
  tenantId: string,
  shiftId: string
): Promise<ZReport> {
  const shift = await prisma.pos_shift.findFirst({
    where: { 
      tenantId, 
      id: shiftId,
      status: { in: ['CLOSED', 'RECONCILED'] },
    },
  })

  if (!shift) {
    throw new Error('Shift not found or still open')
  }

  // Get all sales for this shift
  const sales = await prisma.pos_sale.findMany({
    where: { shiftId },
    include: { inv_audit_items: true },
  })

  // Calculate totals
  const completedSales = sales.filter((s: any) => s.status === 'COMPLETED')
  const refundedSales = sales.filter((s: any) => s.status === 'REFUNDED' || s.status === 'PARTIALLY_REFUNDED')

  const grossSales = completedSales.reduce((sum: any, s) => sum + Number(s.grandTotal), 0)
  const totalRefunds = refundedSales.reduce((sum: any, s) => sum + Number(s.grandTotal), 0)
  const netSales = grossSales - totalRefunds
  const transactionCount = completedSales.length
  const refundCount = refundedSales.length
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

  // Cash reconciliation
  const cashCalc = await calculateCashVariance(tenantId, shiftId)

  // Tax collected
  const taxCollected = completedSales.reduce((sum: any, s) => sum + Number(s.taxTotal), 0)

  // Staff breakdown
  const staffStats: Record<string, { name: string; count: number; total: number }> = {}
  for (const sale of completedSales) {
    if (!staffStats[sale.staffId]) {
      staffStats[sale.staffId] = { name: sale.staffName, count: 0, total: 0 }
    }
    staffStats[sale.staffId].count++
    staffStats[sale.staffId].total += Number(sale.grandTotal)
  }

  const staffSummary = Object.entries(staffStats).map(([staffId, data]) => ({
    staffId,
    staffName: data.name,
    salesCount: data.count,
    salesTotal: data.total,
  }))

  return {
    shiftId: shift.id,
    shiftNumber: shift.shiftNumber,
    locationId: shift.locationId,
    locationName: '', // Would need to join with Location
    openedAt: shift.openedAt,
    closedAt: shift.closedAt!,
    openedBy: shift.openedByName,
    closedBy: shift.closedByName || '',
    
    grossSales: Math.round(grossSales * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    netSales: Math.round(netSales * 100) / 100,
    transactionCount,
    refundCount,
    averageTransaction: Math.round(averageTransaction * 100) / 100,
    
    paymentBreakdown,
    
    openingFloat: cashCalc.openingFloat,
    cashSales: cashCalc.cashSales,
    cashRefunds: cashCalc.cashRefunds,
    paidOut: cashCalc.paidOut,
    paidIn: cashCalc.paidIn,
    safeDrops: cashCalc.safeDrops,
    expectedCash: cashCalc.expectedCash,
    actualCash: Number(shift.actualCash || 0),
    variance: Number(shift.cashVariance || 0),
    varianceReason: shift.varianceReason || undefined,
    
    taxCollected: Math.round(taxCollected * 100) / 100,
    staffSummary,
    
    currency: shift.currency,
    generatedAt: new Date(),
  }
}

/**
 * Update shift payment totals (called after each sale)
 */
export async function updateShiftTotals(
  shiftId: string,
  saleAmount: number,
  paymentMethod: POSPaymentMethod,
  isRefund: boolean = false
): Promise<void> {
  const update: any = {
    transactionCount: { increment: isRefund ? 0 : 1 },
    refundCount: { increment: isRefund ? 1 : 0 },
  }

  if (isRefund) {
    update.totalRefunds = { increment: saleAmount }
    update.netSales = { decrement: saleAmount }
  } else {
    update.totalSales = { increment: saleAmount }
    update.netSales = { increment: saleAmount }
  }

  // Update payment method totals
  switch (paymentMethod) {
    case 'CASH':
      update.cashTotal = { increment: isRefund ? -saleAmount : saleAmount }
      break
    case 'CARD':
    case 'POS_TERMINAL':
      update.cardTotal = { increment: saleAmount }
      break
    case 'BANK_TRANSFER':
      update.transferTotal = { increment: saleAmount }
      break
    case 'MOBILE_MONEY':
      update.mobileMoneyTotal = { increment: saleAmount }
      break
    case 'WALLET':
      update.walletTotal = { increment: saleAmount }
      break
    default:
      update.otherTotal = { increment: saleAmount }
  }

  await prisma.pos_shift.update({
    where: { id: shiftId },
    data: update,
  })
}

// =============================================================================
// HELPERS
// =============================================================================

function mapShiftToInterface(shift: any): POSShift {
  return {
    id: shift.id,
    tenantId: shift.tenantId,
    platformInstanceId: shift.platformInstanceId,
    locationId: shift.locationId,
    registerId: shift.registerId,
    shiftNumber: shift.shiftNumber,
    openedById: shift.openedById,
    openedByName: shift.openedByName,
    closedById: shift.closedById,
    closedByName: shift.closedByName,
    openedAt: shift.openedAt,
    closedAt: shift.closedAt,
    status: shift.status as POSShiftStatus,
    openingFloat: Number(shift.openingFloat),
    expectedCash: shift.expectedCash ? Number(shift.expectedCash) : undefined,
    actualCash: shift.actualCash ? Number(shift.actualCash) : undefined,
    cashVariance: shift.cashVariance ? Number(shift.cashVariance) : undefined,
    currency: shift.currency,
    totalSales: Number(shift.totalSales),
    totalRefunds: Number(shift.totalRefunds),
    netSales: Number(shift.netSales),
    transactionCount: shift.transactionCount,
    refundCount: shift.refundCount,
    cashTotal: Number(shift.cashTotal),
    cardTotal: Number(shift.cardTotal),
    transferTotal: Number(shift.transferTotal),
    mobileMoneyTotal: Number(shift.mobileMoneyTotal),
    walletTotal: Number(shift.walletTotal),
    otherTotal: Number(shift.otherTotal),
    notes: shift.notes,
    varianceReason: shift.varianceReason,
  }
}
