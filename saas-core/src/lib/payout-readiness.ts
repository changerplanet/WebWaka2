/**
 * Payout Readiness Service
 * 
 * Prepares partner payouts WITHOUT executing actual payments.
 * 
 * KEY PRINCIPLES:
 * 1. Track payable balances per partner
 * 2. Support configurable payout thresholds
 * 3. Support tax withholding hooks
 * 4. NO actual payment gateway integration
 * 5. Only readiness checks and reporting
 * 
 * PAYOUT BATCH STATUS:
 * DRAFT → PENDING_APPROVAL → APPROVED → READY
 * (PROCESSING, COMPLETED, FAILED are for Phase 6+)
 */

import { prisma } from './prisma'
import { 
  PayoutBatch, 
  PartnerPayoutSettings,
  Partner,
  EarningStatus
} from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Payable balance summary for a partner
 */
export interface PayableBalance {
  partnerId: string
  partnerName: string
  
  // Balance breakdown
  pending: number      // In clearance period
  cleared: number      // Ready to be approved
  approved: number     // Approved, waiting for batch
  inBatch: number      // Already in a payout batch
  
  // Total payable (cleared + approved not in batch)
  totalPayable: number
  
  // Historical
  totalPaid: number
  totalReversed: number
  
  currency: string
  
  // Thresholds
  minimumPayout: number
  meetsMinimum: boolean
}

/**
 * Readiness check result
 */
export interface ReadinessCheck {
  check: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: Record<string, any>
}

export interface PayoutReadinessResult {
  partnerId: string
  isReady: boolean
  checks: ReadinessCheck[]
  blockers: string[]
  warnings: string[]
  summary: {
    grossAmount: number
    taxWithholding: number
    netAmount: number
    earningsCount: number
  }
}

/**
 * Payout batch creation input
 */
export interface CreatePayoutBatchInput {
  partnerId: string
  periodStart: Date
  periodEnd: Date
  includeCleared?: boolean  // Include CLEARED earnings
  includeApproved?: boolean // Include APPROVED earnings
  notes?: string
}

export interface PayoutBatchResult {
  success: boolean
  batch?: PayoutBatch
  error?: string
  code?: 'NOT_READY' | 'NO_EARNINGS' | 'BELOW_MINIMUM' | 'HOLD_ACTIVE' | 'VALIDATION_ERROR'
}

// ============================================================================
// PAYOUT SETTINGS
// ============================================================================

/**
 * Get or create payout settings for a partner
 */
export async function getPayoutSettings(partnerId: string): Promise<PartnerPayoutSettings> {
  let settings = await prisma.partnerPayoutSettings.findUnique({
    where: { partnerId }
  })
  
  if (!settings) {
    // Create default settings
    settings = await prisma.partnerPayoutSettings.create({
      data: {
        partnerId,
        minimumPayout: 100.00,
        currency: 'USD',
        payoutFrequency: 'MONTHLY',
        taxWithholdingEnabled: false,
        taxDocumentStatus: 'NOT_SUBMITTED',
        paymentMethodVerified: false,
        payoutHold: false
      }
    })
  }
  
  return settings
}

/**
 * Update payout settings
 */
export async function updatePayoutSettings(
  partnerId: string,
  updates: Partial<{
    minimumPayout: number
    payoutFrequency: string
    taxWithholdingEnabled: boolean
    taxWithholdingRate: number
    taxWithholdingReason: string
    paymentMethodType: string
  }>,
  updatedBy: string
): Promise<PartnerPayoutSettings> {
  const settings = await prisma.$transaction(async (tx) => {
    const updated = await tx.partnerPayoutSettings.upsert({
      where: { partnerId },
      create: {
        partnerId,
        ...updates,
        minimumPayout: updates.minimumPayout ?? 100.00
      },
      update: updates
    })
    
    await tx.auditLog.create({
      data: {
        action: 'PAYOUT_SETTINGS_UPDATED',
        actorId: updatedBy,
        actorEmail: 'admin',
        targetType: 'PartnerPayoutSettings',
        targetId: updated.id,
        metadata: {
          partnerId,
          updates
        }
      }
    })
    
    return updated
  })
  
  return settings
}

// ============================================================================
// PAYABLE BALANCE
// ============================================================================

/**
 * Get payable balance for a partner
 */
export async function getPayableBalance(partnerId: string): Promise<PayableBalance> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { name: true }
  })
  
  const settings = await getPayoutSettings(partnerId)
  
  // Get earnings grouped by status
  const earnings = await prisma.partnerEarning.groupBy({
    by: ['status'],
    where: {
      partnerId,
      entryType: 'CREDIT'
    },
    _sum: {
      commissionAmount: true
    },
    _count: true
  })
  
  // Get earnings already in batches
  const inBatchEarnings = await prisma.partnerEarning.aggregate({
    where: {
      partnerId,
      entryType: 'CREDIT',
      payoutBatchId: { not: null },
      status: { in: ['APPROVED', 'CLEARED'] }
    },
    _sum: {
      commissionAmount: true
    }
  })
  
  // Build balance object
  const balance: PayableBalance = {
    partnerId,
    partnerName: partner?.name || 'Unknown',
    pending: 0,
    cleared: 0,
    approved: 0,
    inBatch: Number(inBatchEarnings._sum.commissionAmount || 0),
    totalPayable: 0,
    totalPaid: 0,
    totalReversed: 0,
    currency: settings.currency,
    minimumPayout: Number(settings.minimumPayout),
    meetsMinimum: false
  }
  
  for (const group of earnings) {
    const amount = Number(group._sum.commissionAmount || 0)
    
    switch (group.status) {
      case 'PENDING':
        balance.pending = amount
        break
      case 'CLEARED':
        balance.cleared = amount
        break
      case 'APPROVED':
        balance.approved = amount
        break
      case 'PAID':
        balance.totalPaid = amount
        break
      case 'REVERSED':
        balance.totalReversed = amount
        break
    }
  }
  
  // Calculate total payable (cleared + approved not in batch)
  balance.totalPayable = balance.cleared + balance.approved - balance.inBatch
  balance.meetsMinimum = balance.totalPayable >= balance.minimumPayout
  
  return balance
}

/**
 * Get payable balances for all partners
 */
export async function getAllPayableBalances(options?: {
  onlyMeetsMinimum?: boolean
  onlyReady?: boolean
}): Promise<PayableBalance[]> {
  const partners = await prisma.partner.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true }
  })
  
  const balances: PayableBalance[] = []
  
  for (const partner of partners) {
    const balance = await getPayableBalance(partner.id)
    
    if (options?.onlyMeetsMinimum && !balance.meetsMinimum) continue
    if (options?.onlyReady && balance.totalPayable <= 0) continue
    
    balances.push(balance)
  }
  
  return balances.sort((a, b) => b.totalPayable - a.totalPayable)
}

// ============================================================================
// READINESS CHECKS
// ============================================================================

/**
 * Perform comprehensive readiness check for partner payout
 */
export async function checkPayoutReadiness(
  partnerId: string,
  amount?: number  // Optional specific amount to check
): Promise<PayoutReadinessResult> {
  const checks: ReadinessCheck[] = []
  const blockers: string[] = []
  const warnings: string[] = []
  
  // Get partner and settings
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId }
  })
  
  if (!partner) {
    return {
      partnerId,
      isReady: false,
      checks: [{ check: 'partner_exists', status: 'FAIL', message: 'Partner not found' }],
      blockers: ['Partner not found'],
      warnings: [],
      summary: { grossAmount: 0, taxWithholding: 0, netAmount: 0, earningsCount: 0 }
    }
  }
  
  const settings = await getPayoutSettings(partnerId)
  const balance = await getPayableBalance(partnerId)
  
  const checkAmount = amount ?? balance.totalPayable
  
  // =========================================================================
  // CHECK 1: Partner Status
  // =========================================================================
  if (partner.status === 'ACTIVE') {
    checks.push({
      check: 'partner_status',
      status: 'PASS',
      message: 'Partner is active',
      details: { status: partner.status }
    })
  } else {
    checks.push({
      check: 'partner_status',
      status: 'FAIL',
      message: `Partner status is ${partner.status}`,
      details: { status: partner.status }
    })
    blockers.push(`Partner is not active (status: ${partner.status})`)
  }
  
  // =========================================================================
  // CHECK 2: Minimum Payout Threshold
  // =========================================================================
  if (checkAmount >= Number(settings.minimumPayout)) {
    checks.push({
      check: 'minimum_threshold',
      status: 'PASS',
      message: `Amount ${checkAmount} meets minimum ${settings.minimumPayout}`,
      details: { amount: checkAmount, minimum: Number(settings.minimumPayout) }
    })
  } else {
    checks.push({
      check: 'minimum_threshold',
      status: 'FAIL',
      message: `Amount ${checkAmount} below minimum ${settings.minimumPayout}`,
      details: { amount: checkAmount, minimum: Number(settings.minimumPayout) }
    })
    blockers.push(`Balance below minimum payout threshold (${checkAmount} < ${settings.minimumPayout})`)
  }
  
  // =========================================================================
  // CHECK 3: Payout Hold
  // =========================================================================
  if (!settings.payoutHold) {
    checks.push({
      check: 'payout_hold',
      status: 'PASS',
      message: 'No payout hold active'
    })
  } else {
    const holdExpired = settings.payoutHoldUntil && settings.payoutHoldUntil < new Date()
    if (holdExpired) {
      checks.push({
        check: 'payout_hold',
        status: 'WARNING',
        message: 'Payout hold has expired but not released',
        details: { 
          reason: settings.payoutHoldReason, 
          until: settings.payoutHoldUntil 
        }
      })
      warnings.push('Expired payout hold needs to be released')
    } else {
      checks.push({
        check: 'payout_hold',
        status: 'FAIL',
        message: `Payout on hold: ${settings.payoutHoldReason}`,
        details: { 
          reason: settings.payoutHoldReason, 
          until: settings.payoutHoldUntil 
        }
      })
      blockers.push(`Payout on hold: ${settings.payoutHoldReason}`)
    }
  }
  
  // =========================================================================
  // CHECK 4: Tax Documentation
  // =========================================================================
  if (settings.taxWithholdingEnabled) {
    if (settings.taxDocumentStatus === 'VERIFIED') {
      checks.push({
        check: 'tax_documentation',
        status: 'PASS',
        message: 'Tax documentation verified',
        details: { 
          documentType: settings.taxDocumentType,
          verifiedAt: settings.taxDocumentVerifiedAt 
        }
      })
    } else if (settings.taxDocumentStatus === 'PENDING') {
      checks.push({
        check: 'tax_documentation',
        status: 'WARNING',
        message: 'Tax documentation pending verification',
        details: { status: settings.taxDocumentStatus }
      })
      warnings.push('Tax documentation pending verification - withholding will apply')
    } else {
      checks.push({
        check: 'tax_documentation',
        status: 'WARNING',
        message: `Tax documentation status: ${settings.taxDocumentStatus}`,
        details: { status: settings.taxDocumentStatus }
      })
      warnings.push(`Tax documentation not verified - full withholding (${Number(settings.taxWithholdingRate || 0.30) * 100}%) will apply`)
    }
  } else {
    checks.push({
      check: 'tax_documentation',
      status: 'PASS',
      message: 'Tax withholding not required'
    })
  }
  
  // =========================================================================
  // CHECK 5: Payment Method
  // =========================================================================
  if (settings.paymentMethodVerified) {
    checks.push({
      check: 'payment_method',
      status: 'PASS',
      message: 'Payment method verified',
      details: { type: settings.paymentMethodType }
    })
  } else if (settings.paymentMethodType) {
    checks.push({
      check: 'payment_method',
      status: 'WARNING',
      message: 'Payment method not verified',
      details: { type: settings.paymentMethodType }
    })
    warnings.push('Payment method set but not verified')
  } else {
    checks.push({
      check: 'payment_method',
      status: 'WARNING',
      message: 'No payment method configured',
    })
    warnings.push('No payment method configured - manual payout required')
  }
  
  // =========================================================================
  // CHECK 6: Active Agreement
  // =========================================================================
  const activeAgreement = await prisma.partnerAgreement.findFirst({
    where: {
      partnerId,
      status: 'ACTIVE',
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } }
      ]
    }
  })
  
  if (activeAgreement) {
    checks.push({
      check: 'active_agreement',
      status: 'PASS',
      message: 'Active agreement in place',
      details: { agreementId: activeAgreement.id, version: activeAgreement.version }
    })
  } else {
    checks.push({
      check: 'active_agreement',
      status: 'WARNING',
      message: 'No active agreement found',
    })
    warnings.push('No active agreement - historical earnings can still be paid')
  }
  
  // =========================================================================
  // CALCULATE SUMMARY
  // =========================================================================
  
  // Get earnings that would be included
  const payableEarnings = await prisma.partnerEarning.findMany({
    where: {
      partnerId,
      entryType: 'CREDIT',
      status: { in: ['CLEARED', 'APPROVED'] },
      payoutBatchId: null
    }
  })
  
  const grossAmount = payableEarnings.reduce(
    (sum, e) => sum + Number(e.commissionAmount), 
    0
  )
  
  // Calculate tax withholding
  let taxWithholding = 0
  if (settings.taxWithholdingEnabled && settings.taxWithholdingRate) {
    // Apply full withholding if docs not verified
    const rate = settings.taxDocumentStatus !== 'VERIFIED' 
      ? Number(settings.taxWithholdingRate)
      : Number(settings.taxWithholdingRate)
    taxWithholding = grossAmount * rate
  }
  
  const netAmount = grossAmount - taxWithholding
  
  // =========================================================================
  // DETERMINE OVERALL READINESS
  // =========================================================================
  const isReady = blockers.length === 0 && grossAmount > 0
  
  // Log the readiness check
  await prisma.auditLog.create({
    data: {
      action: 'PAYOUT_READINESS_CHECKED',
      actorId: 'system',
      actorEmail: 'payout@saascore.internal',
      targetType: 'Partner',
      targetId: partnerId,
      metadata: {
        isReady,
        blockers,
        warnings,
        grossAmount,
        netAmount,
        earningsCount: payableEarnings.length
      }
    }
  })
  
  return {
    partnerId,
    isReady,
    checks,
    blockers,
    warnings,
    summary: {
      grossAmount,
      taxWithholding,
      netAmount,
      earningsCount: payableEarnings.length
    }
  }
}

// ============================================================================
// TAX WITHHOLDING
// ============================================================================

/**
 * Calculate tax withholding for a payout
 */
export function calculateTaxWithholding(
  grossAmount: number,
  settings: PartnerPayoutSettings
): { withholdingAmount: number; rate: number; reason: string | null } {
  if (!settings.taxWithholdingEnabled) {
    return { withholdingAmount: 0, rate: 0, reason: null }
  }
  
  const rate = Number(settings.taxWithholdingRate || 0.30) // Default 30% if not specified
  const withholdingAmount = Math.round(grossAmount * rate * 100) / 100
  
  return {
    withholdingAmount,
    rate,
    reason: settings.taxWithholdingReason || 'Tax withholding required'
  }
}

/**
 * Update tax document status
 */
export async function updateTaxDocumentStatus(
  partnerId: string,
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED',
  documentType?: string,
  updatedBy?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.partnerPayoutSettings.update({
      where: { partnerId },
      data: {
        taxDocumentStatus: status,
        taxDocumentType: documentType,
        taxDocumentVerifiedAt: status === 'VERIFIED' ? new Date() : undefined
      }
    })
    
    const action = status === 'VERIFIED' 
      ? 'TAX_DOCUMENT_VERIFIED' 
      : 'TAX_DOCUMENT_SUBMITTED'
    
    await tx.auditLog.create({
      data: {
        action,
        actorId: updatedBy || 'system',
        actorEmail: 'tax@saascore.internal',
        targetType: 'PartnerPayoutSettings',
        targetId: partnerId,
        metadata: { status, documentType }
      }
    })
  })
}

// ============================================================================
// PAYOUT HOLD
// ============================================================================

/**
 * Apply payout hold on a partner
 */
export async function applyPayoutHold(
  partnerId: string,
  reason: string,
  holdUntil?: Date,
  appliedBy?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.partnerPayoutSettings.upsert({
      where: { partnerId },
      create: {
        partnerId,
        payoutHold: true,
        payoutHoldReason: reason,
        payoutHoldUntil: holdUntil
      },
      update: {
        payoutHold: true,
        payoutHoldReason: reason,
        payoutHoldUntil: holdUntil
      }
    })
    
    await tx.auditLog.create({
      data: {
        action: 'PAYOUT_HOLD_APPLIED',
        actorId: appliedBy || 'system',
        actorEmail: 'admin',
        targetType: 'Partner',
        targetId: partnerId,
        metadata: { reason, holdUntil }
      }
    })
  })
}

/**
 * Release payout hold
 */
export async function releasePayoutHold(
  partnerId: string,
  releasedBy?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const settings = await tx.partnerPayoutSettings.findUnique({
      where: { partnerId }
    })
    
    await tx.partnerPayoutSettings.update({
      where: { partnerId },
      data: {
        payoutHold: false,
        payoutHoldReason: null,
        payoutHoldUntil: null
      }
    })
    
    await tx.auditLog.create({
      data: {
        action: 'PAYOUT_HOLD_RELEASED',
        actorId: releasedBy || 'system',
        actorEmail: 'admin',
        targetType: 'Partner',
        targetId: partnerId,
        metadata: { 
          previousReason: settings?.payoutHoldReason 
        }
      }
    })
  })
}

// ============================================================================
// PAYOUT BATCH CREATION (No Execution)
// ============================================================================

/**
 * Create a payout batch (DRAFT status)
 * 
 * This does NOT execute the payout - only prepares it
 */
export async function createPayoutBatch(
  input: CreatePayoutBatchInput
): Promise<PayoutBatchResult> {
  // Check readiness
  const readiness = await checkPayoutReadiness(input.partnerId)
  
  if (!readiness.isReady) {
    return {
      success: false,
      error: `Payout not ready: ${readiness.blockers.join(', ')}`,
      code: 'NOT_READY'
    }
  }
  
  const settings = await getPayoutSettings(input.partnerId)
  
  // Get eligible earnings
  const statusFilter: EarningStatus[] = []
  if (input.includeCleared !== false) statusFilter.push('CLEARED')
  if (input.includeApproved !== false) statusFilter.push('APPROVED')
  
  const earnings = await prisma.partnerEarning.findMany({
    where: {
      partnerId: input.partnerId,
      entryType: 'CREDIT',
      status: { in: statusFilter },
      payoutBatchId: null,
      createdAt: {
        gte: input.periodStart,
        lte: input.periodEnd
      }
    }
  })
  
  if (earnings.length === 0) {
    return {
      success: false,
      error: 'No eligible earnings found for the specified period',
      code: 'NO_EARNINGS'
    }
  }
  
  // Calculate totals
  const grossAmount = earnings.reduce(
    (sum, e) => sum + Number(e.commissionAmount), 
    0
  )
  
  if (grossAmount < Number(settings.minimumPayout)) {
    return {
      success: false,
      error: `Amount ${grossAmount} below minimum ${settings.minimumPayout}`,
      code: 'BELOW_MINIMUM'
    }
  }
  
  // Calculate tax withholding
  const taxResult = calculateTaxWithholding(grossAmount, settings)
  const netAmount = grossAmount - taxResult.withholdingAmount
  
  // Generate batch number
  const batchNumber = await generateBatchNumber()
  
  // Create batch in transaction
  const batch = await prisma.$transaction(async (tx) => {
    const newBatch = await tx.payoutBatch.create({
      data: {
        partnerId: input.partnerId,
        batchNumber,
        status: 'DRAFT',
        grossAmount,
        taxWithholding: taxResult.withholdingAmount,
        netAmount,
        currency: settings.currency,
        earningsCount: earnings.length,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        readinessChecks: {
          checks: readiness.checks,
          checkedAt: new Date()
        },
        readinessStatus: 'READY',
        internalNotes: input.notes
      }
    })
    
    // Link earnings to batch
    await tx.partnerEarning.updateMany({
      where: {
        id: { in: earnings.map(e => e.id) }
      },
      data: {
        payoutBatchId: newBatch.id
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'PAYOUT_BATCH_CREATED',
        actorId: 'system',
        actorEmail: 'payout@saascore.internal',
        targetType: 'PayoutBatch',
        targetId: newBatch.id,
        metadata: {
          partnerId: input.partnerId,
          batchNumber,
          grossAmount,
          taxWithholding: taxResult.withholdingAmount,
          netAmount,
          earningsCount: earnings.length
        }
      }
    })
    
    return newBatch
  })
  
  return { success: true, batch }
}

/**
 * Generate unique batch number
 */
async function generateBatchNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.payoutBatch.count({
    where: {
      batchNumber: { startsWith: `PO-${year}-` }
    }
  })
  return `PO-${year}-${String(count + 1).padStart(6, '0')}`
}

/**
 * Cancel a draft payout batch
 */
export async function cancelPayoutBatch(
  batchId: string,
  reason: string,
  cancelledBy: string
): Promise<PayoutBatchResult> {
  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId }
  })
  
  if (!batch) {
    return { success: false, error: 'Batch not found', code: 'VALIDATION_ERROR' }
  }
  
  if (!['DRAFT', 'PENDING_APPROVAL'].includes(batch.status)) {
    return { 
      success: false, 
      error: `Cannot cancel batch in ${batch.status} status`,
      code: 'VALIDATION_ERROR'
    }
  }
  
  const updatedBatch = await prisma.$transaction(async (tx) => {
    // Unlink earnings from batch
    await tx.partnerEarning.updateMany({
      where: { payoutBatchId: batchId },
      data: { payoutBatchId: null }
    })
    
    // Update batch status
    const updated = await tx.payoutBatch.update({
      where: { id: batchId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledByUserId: cancelledBy,
        cancellationReason: reason
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'PAYOUT_BATCH_CANCELLED',
        actorId: cancelledBy,
        actorEmail: 'admin',
        targetType: 'PayoutBatch',
        targetId: batchId,
        metadata: { reason }
      }
    })
    
    return updated
  })
  
  return { success: true, batch: updatedBatch }
}

/**
 * Approve a payout batch
 */
export async function approvePayoutBatch(
  batchId: string,
  approvedBy: string
): Promise<PayoutBatchResult> {
  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId }
  })
  
  if (!batch) {
    return { success: false, error: 'Batch not found', code: 'VALIDATION_ERROR' }
  }
  
  if (!['DRAFT', 'PENDING_APPROVAL'].includes(batch.status)) {
    return { 
      success: false, 
      error: `Cannot approve batch in ${batch.status} status`,
      code: 'VALIDATION_ERROR'
    }
  }
  
  // Re-check readiness
  const readiness = await checkPayoutReadiness(batch.partnerId, Number(batch.grossAmount))
  
  if (!readiness.isReady) {
    return {
      success: false,
      error: `Payout no longer ready: ${readiness.blockers.join(', ')}`,
      code: 'NOT_READY'
    }
  }
  
  const updatedBatch = await prisma.$transaction(async (tx) => {
    const updated = await tx.payoutBatch.update({
      where: { id: batchId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedByUserId: approvedBy,
        readinessChecks: {
          checks: readiness.checks,
          checkedAt: new Date()
        },
        readinessStatus: 'READY'
      }
    })
    
    // Update earnings status to APPROVED
    await tx.partnerEarning.updateMany({
      where: { 
        payoutBatchId: batchId,
        status: 'CLEARED'
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedByUserId: approvedBy
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'PAYOUT_BATCH_APPROVED',
        actorId: approvedBy,
        actorEmail: 'admin',
        targetType: 'PayoutBatch',
        targetId: batchId,
        metadata: {
          partnerId: batch.partnerId,
          netAmount: Number(batch.netAmount)
        }
      }
    })
    
    return updated
  })
  
  return { success: true, batch: updatedBatch }
}

// ============================================================================
// REPORTING VIEWS
// ============================================================================

/**
 * Get payout report for a partner
 */
export interface PayoutReport {
  partnerId: string
  partnerName: string
  period: { start: Date; end: Date }
  
  // Current balances
  balance: PayableBalance
  
  // Pending batches
  pendingBatches: {
    id: string
    batchNumber: string
    status: string
    netAmount: number
    earningsCount: number
    createdAt: Date
  }[]
  
  // Historical payouts
  paidBatches: {
    id: string
    batchNumber: string
    netAmount: number
    paidAt: Date | null
  }[]
  
  // Summary
  totalPending: number
  totalPaidThisPeriod: number
  totalPaidAllTime: number
}

export async function getPayoutReport(
  partnerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayoutReport> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { name: true }
  })
  
  const balance = await getPayableBalance(partnerId)
  
  // Get pending batches
  const pendingBatches = await prisma.payoutBatch.findMany({
    where: {
      partnerId,
      status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'READY'] }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  // Get paid batches in period
  const paidBatches = await prisma.payoutBatch.findMany({
    where: {
      partnerId,
      status: 'COMPLETED',
      processedAt: { gte: periodStart, lte: periodEnd }
    },
    orderBy: { processedAt: 'desc' }
  })
  
  // Get all-time paid total
  const allTimePaid = await prisma.payoutBatch.aggregate({
    where: {
      partnerId,
      status: 'COMPLETED'
    },
    _sum: { netAmount: true }
  })
  
  return {
    partnerId,
    partnerName: partner?.name || 'Unknown',
    period: { start: periodStart, end: periodEnd },
    balance,
    pendingBatches: pendingBatches.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      status: b.status,
      netAmount: Number(b.netAmount),
      earningsCount: b.earningsCount,
      createdAt: b.createdAt
    })),
    paidBatches: paidBatches.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      netAmount: Number(b.netAmount),
      paidAt: b.processedAt
    })),
    totalPending: pendingBatches.reduce((sum, b) => sum + Number(b.netAmount), 0),
    totalPaidThisPeriod: paidBatches.reduce((sum, b) => sum + Number(b.netAmount), 0),
    totalPaidAllTime: Number(allTimePaid._sum.netAmount || 0)
  }
}

/**
 * Get platform-wide payout summary
 */
export interface PlatformPayoutSummary {
  period: { start: Date; end: Date }
  
  // Partner counts
  totalPartners: number
  partnersWithBalance: number
  partnersReadyForPayout: number
  partnersOnHold: number
  
  // Amounts
  totalPending: number
  totalCleared: number
  totalApproved: number
  totalInBatches: number
  
  // Batch counts
  draftBatches: number
  approvedBatches: number
  
  currency: string
}

export async function getPlatformPayoutSummary(
  periodStart: Date,
  periodEnd: Date
): Promise<PlatformPayoutSummary> {
  const [
    totalPartners,
    partnersOnHold,
    balances,
    batchCounts
  ] = await Promise.all([
    prisma.partner.count({ where: { status: 'ACTIVE' } }),
    prisma.partnerPayoutSettings.count({ where: { payoutHold: true } }),
    getAllPayableBalances(),
    prisma.payoutBatch.groupBy({
      by: ['status'],
      _count: true
    })
  ])
  
  const partnersWithBalance = balances.filter(b => b.totalPayable > 0).length
  const partnersReadyForPayout = balances.filter(b => b.meetsMinimum).length
  
  return {
    period: { start: periodStart, end: periodEnd },
    totalPartners,
    partnersWithBalance,
    partnersReadyForPayout,
    partnersOnHold,
    totalPending: balances.reduce((sum, b) => sum + b.pending, 0),
    totalCleared: balances.reduce((sum, b) => sum + b.cleared, 0),
    totalApproved: balances.reduce((sum, b) => sum + b.approved, 0),
    totalInBatches: balances.reduce((sum, b) => sum + b.inBatch, 0),
    draftBatches: batchCounts.find(c => c.status === 'DRAFT')?._count || 0,
    approvedBatches: batchCounts.find(c => c.status === 'APPROVED')?._count || 0,
    currency: 'USD'
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PAYOUT_RULES = {
  // Default minimum payout threshold
  DEFAULT_MINIMUM_PAYOUT: 100.00,
  
  // Default tax withholding rate (if docs not verified)
  DEFAULT_TAX_WITHHOLDING_RATE: 0.30,
  
  // Payout frequencies
  PAYOUT_FREQUENCIES: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'] as const,
  
  // Batch statuses
  BATCH_STATUSES: [
    'DRAFT',
    'PENDING_APPROVAL', 
    'APPROVED', 
    'READY',
    'PROCESSING',  // Not used in Phase 5
    'COMPLETED',   // Not used in Phase 5
    'FAILED',      // Not used in Phase 5
    'CANCELLED'
  ] as const,
  
  // No actual payout execution in Phase 5
  EXECUTION_ENABLED: false
} as const
