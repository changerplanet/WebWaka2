/**
 * Partner Earnings Ledger
 * 
 * IMMUTABLE, APPEND-ONLY ledger for partner earnings.
 * 
 * KEY PRINCIPLES:
 * 1. Earnings are APPEND-ONLY - no direct edits
 * 2. Reversals create DEBIT entries, not updates
 * 3. Status transitions are one-way
 * 4. Idempotency prevents duplicate processing
 * 5. Full audit trail maintained
 * 
 * STATE MACHINE:
 * PENDING → CLEARED → APPROVED → PAID
 *    ↓         ↓         ↓
 * VOIDED   DISPUTED   REVERSED
 */

import { prisma } from './prisma'
import { 
  PartnerEarning, 
  EarningStatus, 
  EarningEntryType,
  CommissionType,
  SubscriptionEvent
} from '@prisma/client'
import { calculateCommission, CommissionCalculationResult } from './commission-engine'
import { getPartnerEvents } from './subscription-events'
import { withPrismaDefaults } from './db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateEarningInput {
  partnerId: string
  referralId: string
  agreementId: string
  subscriptionEventId: string
  
  // Idempotency
  idempotencyKey: string
  
  // Period
  periodStart: Date
  periodEnd: Date
  
  // Financial
  grossAmount: number
  commissionType: CommissionType
  commissionRate?: number
  fixedAmount?: number
  commissionAmount: number
  currency: string
  
  // Calculation details
  calculationDetails?: Record<string, any>
  
  // Metadata
  metadata?: Record<string, any>
  createdByUserId?: string
}

export interface EarningResult {
  success: boolean
  earning?: PartnerEarning
  error?: string
  code?: 'DUPLICATE' | 'INVALID_STATE' | 'NOT_FOUND' | 'VALIDATION_ERROR'
}

export interface LedgerSummary {
  partnerId: string
  period: { start: Date; end: Date }
  totals: {
    pending: number
    cleared: number
    approved: number
    paid: number
    disputed: number
    reversed: number
    net: number
  }
  count: {
    pending: number
    cleared: number
    approved: number
    paid: number
    disputed: number
    reversed: number
  }
  currency: string
}

// ============================================================================
// VALID STATE TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS: Record<EarningStatus, EarningStatus[]> = {
  PENDING: ['CLEARED', 'VOIDED', 'DISPUTED'],
  CLEARED: ['APPROVED', 'DISPUTED', 'REVERSED'],
  APPROVED: ['PAID', 'DISPUTED', 'REVERSED'],
  PAID: ['DISPUTED', 'REVERSED'],
  DISPUTED: ['CLEARED', 'REVERSED', 'VOIDED'],
  REVERSED: [],  // Terminal state
  VOIDED: []     // Terminal state
}

function isValidTransition(from: EarningStatus, to: EarningStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// ============================================================================
// EARNING CREATION (Append-only)
// ============================================================================

/**
 * Create a new earning entry in the ledger
 * 
 * Uses idempotency key to prevent duplicates
 * This is the ONLY way to add entries to the ledger
 */
export async function createEarning(input: CreateEarningInput): Promise<EarningResult> {
  // Check for existing entry with same idempotency key
  const existing = await prisma.partnerEarning.findUnique({
    where: { idempotencyKey: input.idempotencyKey }
  })
  
  if (existing) {
    // Idempotent - return existing entry
    return { success: true, earning: existing }
  }
  
  // Validate required fields
  if (!input.partnerId || !input.referralId || !input.agreementId) {
    return {
      success: false,
      error: 'Missing required fields: partnerId, referralId, agreementId',
      code: 'VALIDATION_ERROR'
    }
  }
  
  // Create the earning entry
  const earning = await prisma.$transaction(async (tx) => {
    const entry = await tx.partnerEarning.create({
      data: withPrismaDefaults({
        partnerId: input.partnerId,
        referralId: input.referralId,
        agreementId: input.agreementId,
        subscriptionEventId: input.subscriptionEventId,
        idempotencyKey: input.idempotencyKey,
        entryType: 'CREDIT',
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        grossAmount: input.grossAmount,
        commissionType: input.commissionType,
        commissionRate: input.commissionRate,
        fixedAmount: input.fixedAmount,
        commissionAmount: input.commissionAmount,
        currency: input.currency,
        calculationDetails: input.calculationDetails,
        metadata: input.metadata,
        createdByUserId: input.createdByUserId || 'system',
        status: 'PENDING'
      })
    })
    
    // Audit log
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_CREATED',
        actorId: input.createdByUserId || 'system',
        actorEmail: 'commission@webwaka.internal',
        targetType: 'PartnerEarning',
        targetId: entry.id,
        metadata: {
          partnerId: input.partnerId,
          commissionAmount: input.commissionAmount,
          currency: input.currency,
          idempotencyKey: input.idempotencyKey
        }
      })
    })
    
    return entry
  })
  
  return { success: true, earning }
}

/**
 * Create a DEBIT entry (reversal)
 * 
 * Used to reverse a previous earning - does NOT modify the original
 */
export async function createReversalEntry(
  originalEarningId: string,
  reason: string,
  userId?: string
): Promise<EarningResult> {
  const original = await prisma.partnerEarning.findUnique({
    where: { id: originalEarningId }
  })
  
  if (!original) {
    return { success: false, error: 'Original earning not found', code: 'NOT_FOUND' }
  }
  
  if (original.entryType === 'DEBIT') {
    return { success: false, error: 'Cannot reverse a debit entry', code: 'VALIDATION_ERROR' }
  }
  
  const idempotencyKey = `reversal_${originalEarningId}`
  
  // Check for existing reversal
  const existingReversal = await prisma.partnerEarning.findUnique({
    where: { idempotencyKey }
  })
  
  if (existingReversal) {
    return { success: true, earning: existingReversal }
  }
  
  const reversal = await prisma.$transaction(async (tx) => {
    // Create debit entry
    const debitEntry = await tx.partnerEarning.create({
      data: withPrismaDefaults({
        partnerId: original.partnerId,
        referralId: original.referralId,
        agreementId: original.agreementId,
        subscriptionEventId: original.subscriptionEventId,
        idempotencyKey,
        entryType: 'DEBIT',
        periodStart: original.periodStart,
        periodEnd: original.periodEnd,
        grossAmount: original.grossAmount,
        commissionType: original.commissionType,
        commissionRate: original.commissionRate,
        fixedAmount: original.fixedAmount,
        commissionAmount: Number(original.commissionAmount) * -1, // Negative
        currency: original.currency,
        reversedById: originalEarningId,
        reversalReason: reason,
        createdByUserId: userId || 'system',
        status: 'CLEARED', // Reversals are immediately cleared
        clearedAt: new Date()
      })
    })
    
    // Update original entry status
    await tx.partnerEarning.update({
      where: { id: originalEarningId },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversalEntryId: debitEntry.id,
        reversalReason: reason
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_REVERSED',
        actorId: userId || 'system',
        actorEmail: 'commission@webwaka.internal',
        targetType: 'PartnerEarning',
        targetId: originalEarningId,
        metadata: {
          reversalEntryId: debitEntry.id,
          reason,
          originalAmount: Number(original.commissionAmount),
          reversalAmount: Number(original.commissionAmount) * -1
        }
      })
    })
    
    return debitEntry
  })
  
  return { success: true, earning: reversal }
}

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Transition earning to CLEARED status
 * 
 * Called after clearance period has passed
 */
export async function clearEarning(earningId: string): Promise<EarningResult> {
  const earning = await prisma.partnerEarning.findUnique({
    where: { id: earningId }
  })
  
  if (!earning) {
    return { success: false, error: 'Earning not found', code: 'NOT_FOUND' }
  }
  
  if (!isValidTransition(earning.status, 'CLEARED')) {
    return { 
      success: false, 
      error: `Cannot transition from ${earning.status} to CLEARED`,
      code: 'INVALID_STATE'
    }
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.partnerEarning.update({
      where: { id: earningId },
      data: {
        status: 'CLEARED',
        clearedAt: new Date()
      }
    })
    
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_CLEARED',
        actorId: 'system',
        actorEmail: 'commission@webwaka.internal',
        targetType: 'PartnerEarning',
        targetId: earningId,
        metadata: {
          partnerId: earning.partnerId,
          amount: Number(earning.commissionAmount)
        }
      })
    })
    
    return entry
  })
  
  return { success: true, earning: updated }
}

/**
 * Approve earning for payout
 */
export async function approveEarning(
  earningId: string,
  approverId: string
): Promise<EarningResult> {
  const earning = await prisma.partnerEarning.findUnique({
    where: { id: earningId }
  })
  
  if (!earning) {
    return { success: false, error: 'Earning not found', code: 'NOT_FOUND' }
  }
  
  if (!isValidTransition(earning.status, 'APPROVED')) {
    return { 
      success: false, 
      error: `Cannot transition from ${earning.status} to APPROVED`,
      code: 'INVALID_STATE'
    }
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.partnerEarning.update({
      where: { id: earningId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedByUserId: approverId
      }
    })
    
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_APPROVED',
        actorId: approverId,
        actorEmail: 'admin',
        targetType: 'PartnerEarning',
        targetId: earningId,
        metadata: {
          partnerId: earning.partnerId,
          amount: Number(earning.commissionAmount)
        }
      })
    })
    
    return entry
  })
  
  return { success: true, earning: updated }
}

/**
 * Mark earning as paid
 */
export async function markEarningPaid(
  earningId: string,
  paymentDetails: {
    payoutBatchId?: string
    paymentReference?: string
    paymentMethod?: string
  }
): Promise<EarningResult> {
  const earning = await prisma.partnerEarning.findUnique({
    where: { id: earningId }
  })
  
  if (!earning) {
    return { success: false, error: 'Earning not found', code: 'NOT_FOUND' }
  }
  
  if (!isValidTransition(earning.status, 'PAID')) {
    return { 
      success: false, 
      error: `Cannot transition from ${earning.status} to PAID`,
      code: 'INVALID_STATE'
    }
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.partnerEarning.update({
      where: { id: earningId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        payoutBatchId: paymentDetails.payoutBatchId,
        paymentReference: paymentDetails.paymentReference,
        paymentMethod: paymentDetails.paymentMethod
      }
    })
    
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_PAID',
        actorId: 'payout-system',
        actorEmail: 'payout@webwaka.internal',
        targetType: 'PartnerEarning',
        targetId: earningId,
        metadata: {
          partnerId: earning.partnerId,
          amount: Number(earning.commissionAmount),
          ...paymentDetails
        }
      })
    })
    
    return entry
  })
  
  return { success: true, earning: updated }
}

/**
 * Dispute an earning
 */
export async function disputeEarning(
  earningId: string,
  reason: string,
  disputedBy: string
): Promise<EarningResult> {
  const earning = await prisma.partnerEarning.findUnique({
    where: { id: earningId }
  })
  
  if (!earning) {
    return { success: false, error: 'Earning not found', code: 'NOT_FOUND' }
  }
  
  if (!isValidTransition(earning.status, 'DISPUTED')) {
    return { 
      success: false, 
      error: `Cannot transition from ${earning.status} to DISPUTED`,
      code: 'INVALID_STATE'
    }
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.partnerEarning.update({
      where: { id: earningId },
      data: {
        status: 'DISPUTED',
        disputedAt: new Date(),
        metadata: {
          ...(earning.metadata as object || {}),
          disputeReason: reason,
          disputedBy
        }
      }
    })
    
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_DISPUTED',
        actorId: disputedBy,
        actorEmail: 'dispute',
        targetType: 'PartnerEarning',
        targetId: earningId,
        metadata: {
          partnerId: earning.partnerId,
          amount: Number(earning.commissionAmount),
          reason
        }
      }
    })
    
    return entry
  })
  
  return { success: true, earning: updated }
}

/**
 * Void a pending earning (before clearance)
 */
export async function voidEarning(
  earningId: string,
  reason: string,
  voidedBy: string
): Promise<EarningResult> {
  const earning = await prisma.partnerEarning.findUnique({
    where: { id: earningId }
  })
  
  if (!earning) {
    return { success: false, error: 'Earning not found', code: 'NOT_FOUND' }
  }
  
  if (!isValidTransition(earning.status, 'VOIDED')) {
    return { 
      success: false, 
      error: `Cannot transition from ${earning.status} to VOIDED`,
      code: 'INVALID_STATE'
    }
  }
  
  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.partnerEarning.update({
      where: { id: earningId },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        reversalReason: reason
      }
    })
    
    await tx.auditLog.create({
      data: withPrismaDefaults({
        action: 'EARNING_VOIDED',
        actorId: voidedBy,
        actorEmail: 'void',
        targetType: 'PartnerEarning',
        targetId: earningId,
        metadata: {
          partnerId: earning.partnerId,
          amount: Number(earning.commissionAmount),
          reason
        }
      })
    })
    
    return entry
  })
  
  return { success: true, earning: updated }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get earnings for a partner
 */
export async function getPartnerEarnings(
  partnerId: string,
  options?: {
    status?: EarningStatus[]
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<{ earnings: PartnerEarning[]; total: number }> {
  const where: any = {
    partnerId,
    entryType: 'CREDIT' // Only show credits in standard queries
  }
  
  if (options?.status) {
    where.status = { in: options.status }
  }
  
  if (options?.startDate || options?.endDate) {
    where.createdAt = {}
    if (options?.startDate) where.createdAt.gte = options.startDate
    if (options?.endDate) where.createdAt.lte = options.endDate
  }
  
  const [earnings, total] = await Promise.all([
    prisma.partnerEarning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        referral: {
          include: {
            Tenant: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    }),
    prisma.partnerEarning.count({ where })
  ])
  
  return { earnings, total }
}

/**
 * Get ledger summary for a partner
 */
export async function getLedgerSummary(
  partnerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<LedgerSummary> {
  const earnings = await prisma.partnerEarning.findMany({
    where: {
      partnerId,
      createdAt: { gte: periodStart, lte: periodEnd }
    }
  })
  
  const summary: LedgerSummary = {
    partnerId,
    period: { start: periodStart, end: periodEnd },
    totals: {
      pending: 0,
      cleared: 0,
      approved: 0,
      paid: 0,
      disputed: 0,
      reversed: 0,
      net: 0
    },
    count: {
      pending: 0,
      cleared: 0,
      approved: 0,
      paid: 0,
      disputed: 0,
      reversed: 0
    },
    currency: 'USD'
  }
  
  for (const earning of earnings) {
    const amount = Number(earning.commissionAmount)
    const statusLower = earning.status.toLowerCase()
    
    // Update totals and counts based on status
    if (statusLower === 'pending') {
      summary.totals.pending += amount
      summary.count.pending++
    } else if (statusLower === 'cleared') {
      summary.totals.cleared += amount
      summary.count.cleared++
    } else if (statusLower === 'approved') {
      summary.totals.approved += amount
      summary.count.approved++
    } else if (statusLower === 'paid') {
      summary.totals.paid += amount
      summary.count.paid++
    } else if (statusLower === 'disputed') {
      summary.totals.disputed += amount
      summary.count.disputed++
    } else if (statusLower === 'reversed') {
      summary.totals.reversed += amount
      summary.count.reversed++
    }
    
    // Net is sum of all non-voided, non-reversed amounts
    if (!['VOIDED', 'REVERSED'].includes(earning.status)) {
      summary.totals.net += amount
    }
    
    if (earning.currency) {
      summary.currency = earning.currency
    }
  }
  
  return summary
}

/**
 * Get earnings ready for payout (APPROVED status)
 */
export async function getEarningsReadyForPayout(
  partnerId: string
): Promise<PartnerEarning[]> {
  return prisma.partnerEarning.findMany({
    where: {
      partnerId,
      status: 'APPROVED',
      entryType: 'CREDIT',
      payoutBatchId: null
    },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Get pending earnings that should be cleared
 */
export async function getEarningsToProcess(
  clearanceDays: number = 30
): Promise<PartnerEarning[]> {
  const clearanceDate = new Date()
  clearanceDate.setDate(clearanceDate.getDate() - clearanceDays)
  
  return prisma.partnerEarning.findMany({
    where: {
      status: 'PENDING',
      entryType: 'CREDIT',
      createdAt: { lte: clearanceDate }
    }
  })
}

// ============================================================================
// COMMISSION PROCESSING (Integration with events)
// ============================================================================

/**
 * Process a subscription event and create earning if applicable
 * 
 * This is called by the event listener
 */
export async function processEventForCommission(
  event: SubscriptionEvent
): Promise<EarningResult | null> {
  // Skip if no partner
  if (!event.partnerId) {
    return null
  }
  
  // Get partner's active agreement
  const agreement = await prisma.partnerAgreement.findFirst({
    where: {
      partner: {
        referrals: {
          some: {
            id: event.partnerId
          }
        }
      },
      status: 'ACTIVE',
      effectiveFrom: { lte: event.occurredAt },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: event.occurredAt } }
      ]
    }
  })
  
  if (!agreement) {
    return null // No active agreement
  }
  
  // Get referral
  const referral = await prisma.partnerReferral.findFirst({
    where: { partnerId: event.partnerId, tenant: { id: event.tenantId } }
  })
  
  if (!referral) {
    return null
  }
  
  // Check attribution window
  if (referral.attributionExpiresAt && referral.attributionExpiresAt < new Date()) {
    return null // Attribution expired
  }
  
  // Calculate commission
  const isFirstPayment = event.eventType === 'SUBSCRIPTION_ACTIVATED'
  const commissionResult = calculateCommission(agreement, {
    eventType: event.eventType,
    grossAmount: event.billingAmount ? Number(event.billingAmount) : 0,
    currency: event.billingCurrency || 'USD',
    periodStart: event.periodStart || event.occurredAt,
    periodEnd: event.periodEnd || event.occurredAt,
    isFirstPayment,
    modules: event.modules
  })
  
  if (!commissionResult.success || commissionResult.commissionAmount === 0) {
    return null
  }
  
  // Create earning entry
  return createEarning({
    partnerId: event.partnerId,
    referralId: referral.id,
    agreementId: agreement.id,
    subscriptionEventId: event.id,
    idempotencyKey: `evt_${event.id}_comm`,
    periodStart: event.periodStart || event.occurredAt,
    periodEnd: event.periodEnd || event.occurredAt,
    grossAmount: event.billingAmount ? Number(event.billingAmount) : 0,
    commissionType: agreement.commissionType,
    commissionRate: agreement.commissionRate ? Number(agreement.commissionRate) : undefined,
    fixedAmount: agreement.fixedAmount ? Number(agreement.fixedAmount) : undefined,
    commissionAmount: commissionResult.commissionAmount,
    currency: commissionResult.currency,
    calculationDetails: commissionResult.details
  })
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const LEDGER_RULES = {
  // Earnings are append-only
  APPEND_ONLY: true,
  
  // No direct edits - use reversals
  NO_DIRECT_EDITS: true,
  
  // Valid status transitions
  VALID_TRANSITIONS,
  
  // Terminal states
  TERMINAL_STATES: ['REVERSED', 'VOIDED'] as EarningStatus[]
} as const
