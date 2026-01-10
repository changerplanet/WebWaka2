/**
 * POS Cash Drawer Service
 * 
 * Manages cash drawer operations: pay-in, pay-out, safe drops, reconciliation.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { 
  POS_CONFIG,
  type POSCashMovement,
  type POSCashMovementType,
  CASH_MOVEMENT_LABELS
} from './config'

// =============================================================================
// CASH DRAWER SERVICE
// =============================================================================

export interface CashInInput {
  tenantId: string
  shiftId: string
  amount: number
  movementType?: POSCashMovementType
  referenceType?: string
  referenceId?: string
  referenceNumber?: string
  performedById: string
  performedByName: string
  reason?: string
  notes?: string
}

export interface CashOutInput {
  tenantId: string
  shiftId: string
  amount: number
  movementType: POSCashMovementType
  referenceType?: string
  referenceId?: string
  referenceNumber?: string
  performedById: string
  performedByName: string
  approvedById?: string
  approvedByName?: string
  reason?: string
  notes?: string
}

/**
 * Record cash coming into the drawer
 */
export async function recordCashIn(input: CashInInput): Promise<POSCashMovement> {
  const currentBalance = await getCurrentDrawerBalance(input.shiftId)
  const newBalance = currentBalance + input.amount

  const movement = await prisma.pos_cash_movement.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      shiftId: input.shiftId,
      movementType: input.movementType || 'SALE',
      amount: input.amount,
      direction: 'IN',
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNumber: input.referenceNumber,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      currency: POS_CONFIG.currency,
      performedById: input.performedById,
      performedByName: input.performedByName,
      reason: input.reason,
      notes: input.notes,
    }),
  })

  return mapMovementToInterface(movement)
}

/**
 * Record cash going out of the drawer
 */
export async function recordCashOut(input: CashOutInput): Promise<POSCashMovement> {
  const currentBalance = await getCurrentDrawerBalance(input.shiftId)
  
  // Validate sufficient funds
  if (input.amount > currentBalance) {
    throw new Error(`Insufficient drawer balance. Available: ₦${currentBalance.toFixed(2)}, Requested: ₦${input.amount.toFixed(2)}`)
  }

  // Check if large payout requires approval
  if (input.amount > POS_CONFIG.maxCashVarianceBlock && !input.approvedById) {
    throw new Error(`Payouts over ₦${POS_CONFIG.maxCashVarianceBlock} require manager approval`)
  }

  const newBalance = currentBalance - input.amount

  const movement = await prisma.pos_cash_movement.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      shiftId: input.shiftId,
      movementType: input.movementType,
      amount: input.amount,
      direction: 'OUT',
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNumber: input.referenceNumber,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      currency: POS_CONFIG.currency,
      performedById: input.performedById,
      performedByName: input.performedByName,
      approvedById: input.approvedById,
      approvedByName: input.approvedByName,
      reason: input.reason,
      notes: input.notes,
    }),
  })

  return mapMovementToInterface(movement)
}

/**
 * Pay in cash to drawer (manual addition)
 */
export async function payIn(input: {
  tenantId: string
  shiftId: string
  amount: number
  performedById: string
  performedByName: string
  reason: string
  notes?: string
}): Promise<POSCashMovement> {
  return recordCashIn({
    ...input,
    movementType: 'PAY_IN',
    referenceType: 'MANUAL',
  })
}

/**
 * Pay out cash from drawer (manual removal)
 */
export async function payOut(input: {
  tenantId: string
  shiftId: string
  amount: number
  performedById: string
  performedByName: string
  approvedById?: string
  approvedByName?: string
  reason: string
  notes?: string
}): Promise<POSCashMovement> {
  return recordCashOut({
    ...input,
    movementType: 'PAYOUT',
    referenceType: 'MANUAL',
  })
}

/**
 * Safe drop - remove excess cash to safe
 */
export async function safeDrop(input: {
  tenantId: string
  shiftId: string
  amount: number
  performedById: string
  performedByName: string
  approvedById?: string
  approvedByName?: string
  notes?: string
}): Promise<POSCashMovement> {
  return recordCashOut({
    ...input,
    movementType: 'DROP',
    referenceType: 'SAFE_DROP',
    reason: 'Safe drop - excess cash removal',
  })
}

/**
 * Record adjustment (count correction)
 */
export async function recordAdjustment(input: {
  tenantId: string
  shiftId: string
  amount: number
  direction: 'IN' | 'OUT'
  performedById: string
  performedByName: string
  approvedById?: string
  approvedByName?: string
  reason: string
  notes?: string
}): Promise<POSCashMovement> {
  const currentBalance = await getCurrentDrawerBalance(input.shiftId)
  const newBalance = input.direction === 'IN' 
    ? currentBalance + input.amount 
    : currentBalance - input.amount

  const movement = await prisma.pos_cash_movement.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      shiftId: input.shiftId,
      movementType: 'ADJUSTMENT',
      amount: input.amount,
      direction: input.direction,
      referenceType: 'ADJUSTMENT',
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      currency: POS_CONFIG.currency,
      performedById: input.performedById,
      performedByName: input.performedByName,
      approvedById: input.approvedById,
      approvedByName: input.approvedByName,
      reason: input.reason,
      notes: input.notes,
    }),
  })

  return mapMovementToInterface(movement)
}

/**
 * Get current drawer balance for a shift
 */
export async function getCurrentDrawerBalance(shiftId: string): Promise<number> {
  const movements = await prisma.pos_cash_movement.findMany({
    where: { shiftId },
    orderBy: { performedAt: 'desc' },
    take: 1,
  })

  if (movements.length === 0) {
    return 0
  }

  return Number(movements[0].balanceAfter || 0)
}

/**
 * Get drawer summary for a shift
 */
export async function getDrawerSummary(shiftId: string): Promise<{
  currentBalance: number
  openingFloat: number
  totalIn: number
  totalOut: number
  byType: Record<POSCashMovementType, { count: number; total: number }>
}> {
  const movements = await prisma.pos_cash_movement.findMany({
    where: { shiftId },
    orderBy: { performedAt: 'asc' },
  })

  let openingFloat = 0
  let totalIn = 0
  let totalOut = 0
  const byType: Record<POSCashMovementType, { count: number; total: number }> = {
    OPEN_FLOAT: { count: 0, total: 0 },
    SALE: { count: 0, total: 0 },
    REFUND: { count: 0, total: 0 },
    PAYOUT: { count: 0, total: 0 },
    PAY_IN: { count: 0, total: 0 },
    DROP: { count: 0, total: 0 },
    ADJUSTMENT: { count: 0, total: 0 },
  }

  for (const movement of movements) {
    const amount = Number(movement.amount)
    const type = movement.movementType as POSCashMovementType

    byType[type].count++
    byType[type].total += amount

    if (type === 'OPEN_FLOAT') {
      openingFloat = amount
    }

    if (movement.direction === 'IN') {
      totalIn += amount
    } else {
      totalOut += amount
    }
  }

  const currentBalance = totalIn - totalOut

  return {
    currentBalance: Math.round(currentBalance * 100) / 100,
    openingFloat,
    totalIn: Math.round(totalIn * 100) / 100,
    totalOut: Math.round(totalOut * 100) / 100,
    byType,
  }
}

/**
 * Reconcile drawer - compare expected vs actual
 */
export async function reconcileDrawer(
  shiftId: string,
  actualCash: number
): Promise<{
  expectedCash: number
  actualCash: number
  variance: number
  varianceStatus: 'EXACT' | 'OVER' | 'SHORT'
  requiresExplanation: boolean
}> {
  const summary = await getDrawerSummary(shiftId)
  const expectedCash = summary.currentBalance
  const variance = actualCash - expectedCash

  let varianceStatus: 'EXACT' | 'OVER' | 'SHORT' = 'EXACT'
  if (variance > 0) varianceStatus = 'OVER'
  if (variance < 0) varianceStatus = 'SHORT'

  const requiresExplanation = Math.abs(variance) > POS_CONFIG.maxCashVarianceWarning

  return {
    expectedCash: Math.round(expectedCash * 100) / 100,
    actualCash,
    variance: Math.round(variance * 100) / 100,
    varianceStatus,
    requiresExplanation,
  }
}

/**
 * List cash movements for a shift
 */
export async function listCashMovements(
  shiftId: string,
  options?: {
    movementType?: POSCashMovementType
    direction?: 'IN' | 'OUT'
    limit?: number
    offset?: number
  }
): Promise<{ movements: POSCashMovement[]; total: number }> {
  const where: any = { shiftId }

  if (options?.movementType) where.movementType = options.movementType
  if (options?.direction) where.direction = options.direction

  const [movements, total] = await Promise.all([
    prisma.pos_cash_movement.findMany({
      where,
      orderBy: { performedAt: 'desc' },
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
    }),
    prisma.pos_cash_movement.count({ where }),
  ])

  return {
    movements: movements.map(mapMovementToInterface),
    total,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function mapMovementToInterface(movement: any): POSCashMovement {
  return {
    id: movement.id,
    tenantId: movement.tenantId,
    shiftId: movement.shiftId,
    movementType: movement.movementType as POSCashMovementType,
    amount: Number(movement.amount),
    direction: movement.direction as 'IN' | 'OUT',
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    referenceNumber: movement.referenceNumber,
    balanceBefore: movement.balanceBefore ? Number(movement.balanceBefore) : undefined,
    balanceAfter: movement.balanceAfter ? Number(movement.balanceAfter) : undefined,
    currency: movement.currency,
    performedById: movement.performedById,
    performedByName: movement.performedByName,
    approvedById: movement.approvedById,
    approvedByName: movement.approvedByName,
    reason: movement.reason,
    notes: movement.notes,
    performedAt: movement.performedAt,
  }
}
