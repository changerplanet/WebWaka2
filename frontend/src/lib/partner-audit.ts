/**
 * Partner Audit Service
 * 
 * Comprehensive audit logging for Partner-related actions.
 * 
 * KEY PRINCIPLES:
 * 1. Audits are IMMUTABLE - no updates or deletes
 * 2. Full context captured at time of action
 * 3. Suitable for compliance reporting
 * 4. Retention policy enforcement
 * 
 * TRACKED ACTIONS:
 * - Partner creation/updates
 * - Agreement changes
 * - Attribution events
 * - Earnings generation/status changes
 * - Payout events
 */

import { prisma } from './prisma'
import { AuditAction, AuditLog } from '@prisma/client'
import { withPrismaDefaults } from './db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audit entry input
 */
export interface AuditEntryInput {
  action: AuditAction
  actorId: string
  actorEmail: string
  tenantId?: string
  targetType: string
  targetId: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
  actions?: AuditAction[]
  actorId?: string
  targetType?: string
  targetId?: string
  tenantId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Audit report
 */
export interface AuditReport {
  period: { start: Date; end: Date }
  totalEntries: number
  byAction: Record<string, number>
  byTargetType: Record<string, number>
  entries: AuditLog[]
}

// ============================================================================
// PARTNER-SPECIFIC AUDIT ACTIONS
// ============================================================================

export const PARTNER_AUDIT_ACTIONS: AuditAction[] = [
  // Partner lifecycle
  'PARTNER_CREATED',
  'PARTNER_UPDATED',
  'PARTNER_APPROVED',
  'PARTNER_SUSPENDED',
  'PARTNER_TERMINATED',
  'PARTNER_USER_ADDED',
  'PARTNER_USER_REMOVED',
  
  // Agreements
  'PARTNER_AGREEMENT_CREATED',
  'PARTNER_AGREEMENT_SIGNED',
  'PARTNER_AGREEMENT_APPROVED',
  
  // Attribution
  'ATTRIBUTION_CREATED',
  'ATTRIBUTION_LOCKED',
  'ATTRIBUTION_LOCK_ATTEMPTED',
  'ATTRIBUTION_REASSIGN_BLOCKED',
  'PARTNER_REFERRAL_CREATED',
  'PARTNER_REFERRAL_LOCKED',
  
  // Partner tenant creation
  'PARTNER_TENANT_CREATED',
  'PARTNER_TENANT_ACTIVATED',
  
  // Earnings
  'COMMISSION_CALCULATED',
  'EARNING_CREATED',
  'EARNING_CLEARED',
  'EARNING_APPROVED',
  'EARNING_PAID',
  'EARNING_DISPUTED',
  'EARNING_REVERSED',
  'EARNING_VOIDED',
  'PARTNER_EARNING_CREATED',
  'PARTNER_EARNING_APPROVED',
  'PARTNER_EARNING_PAID',
  
  // Payouts
  'PAYOUT_BATCH_CREATED',
  'PAYOUT_BATCH_APPROVED',
  'PAYOUT_BATCH_PROCESSED',
  'PAYOUT_BATCH_FAILED',
  'PAYOUT_BATCH_CANCELLED',
  'PAYOUT_READINESS_CHECKED',
  'PAYOUT_HOLD_APPLIED',
  'PAYOUT_HOLD_RELEASED',
  'PAYOUT_SETTINGS_UPDATED',
  'TAX_DOCUMENT_SUBMITTED',
  'TAX_DOCUMENT_VERIFIED'
]

// ============================================================================
// AUDIT ENTRY CREATION
// ============================================================================

/**
 * Create an audit log entry
 * 
 * Entries are IMMUTABLE once created
 */
export async function createAuditEntry(input: AuditEntryInput): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: withPrismaDefaults({
      action: input.action,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      tenantId: input.tenantId,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: {
        ...input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        timestamp: new Date().toISOString()
      }
    })
  })
}

/**
 * Create audit entry with full context
 */
export async function auditPartnerAction(
  action: AuditAction,
  partnerId: string,
  actorId: string,
  actorEmail: string,
  details: Record<string, any>
): Promise<AuditLog> {
  return createAuditEntry({
    action,
    actorId,
    actorEmail,
    targetType: 'Partner',
    targetId: partnerId,
    metadata: {
      partnerId,
      ...details
    }
  })
}

/**
 * Audit earning action
 */
export async function auditEarningAction(
  action: AuditAction,
  earningId: string,
  partnerId: string,
  actorId: string,
  details: Record<string, any>
): Promise<AuditLog> {
  return createAuditEntry({
    action,
    actorId,
    actorEmail: 'system',
    targetType: 'PartnerEarning',
    targetId: earningId,
    metadata: {
      partnerId,
      earningId,
      ...details
    }
  })
}

/**
 * Audit payout action
 */
export async function auditPayoutAction(
  action: AuditAction,
  batchId: string,
  partnerId: string,
  actorId: string,
  details: Record<string, any>
): Promise<AuditLog> {
  return createAuditEntry({
    action,
    actorId,
    actorEmail: 'admin',
    targetType: 'PayoutBatch',
    targetId: batchId,
    metadata: {
      partnerId,
      batchId,
      ...details
    }
  })
}

// ============================================================================
// AUDIT QUERIES
// ============================================================================

/**
 * Query audit logs
 */
export async function queryAuditLogs(
  options: AuditQueryOptions
): Promise<{ entries: AuditLog[]; total: number }> {
  const where: any = {}
  
  if (options.actions && options.actions.length > 0) {
    where.action = { in: options.actions }
  }
  
  if (options.actorId) {
    where.actorId = options.actorId
  }
  
  if (options.targetType) {
    where.targetType = options.targetType
  }
  
  if (options.targetId) {
    where.targetId = options.targetId
  }
  
  if (options.tenantId) {
    where.tenantId = options.tenantId
  }
  
  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }
  
  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
      skip: options.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])
  
  return { entries, total }
}

/**
 * Get audit logs for a specific partner
 */
export async function getPartnerAuditLogs(
  partnerId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<{ entries: AuditLog[]; total: number }> {
  return queryAuditLogs({
    actions: PARTNER_AUDIT_ACTIONS,
    targetId: partnerId,
    ...options
  })
}

/**
 * Get audit logs for a specific earning
 */
export async function getEarningAuditLogs(earningId: string): Promise<AuditLog[]> {
  const { entries } = await queryAuditLogs({
    targetType: 'PartnerEarning',
    targetId: earningId
  })
  return entries
}

/**
 * Get audit logs for a payout batch
 */
export async function getPayoutAuditLogs(batchId: string): Promise<AuditLog[]> {
  const { entries } = await queryAuditLogs({
    targetType: 'PayoutBatch',
    targetId: batchId
  })
  return entries
}

// ============================================================================
// COMPLIANCE REPORTS
// ============================================================================

/**
 * Generate audit report for compliance
 */
export async function generateAuditReport(
  periodStart: Date,
  periodEnd: Date,
  options?: {
    partnerId?: string
    actions?: AuditAction[]
  }
): Promise<AuditReport> {
  const where: any = {
    createdAt: { gte: periodStart, lte: periodEnd }
  }
  
  if (options?.partnerId) {
    where.targetId = options.partnerId
  }
  
  if (options?.actions && options.actions.length > 0) {
    where.action = { in: options.actions }
  } else {
    where.action = { in: PARTNER_AUDIT_ACTIONS }
  }
  
  // Get all entries
  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
  
  // Aggregate by action
  const byAction: Record<string, number> = {}
  const byTargetType: Record<string, number> = {}
  
  for (const entry of entries) {
    byAction[entry.action] = (byAction[entry.action] || 0) + 1
    if (entry.targetType) {
      byTargetType[entry.targetType] = (byTargetType[entry.targetType] || 0) + 1
    }
  }
  
  return {
    period: { start: periodStart, end: periodEnd },
    totalEntries: entries.length,
    byAction,
    byTargetType,
    entries
  }
}

/**
 * Generate partner activity report
 */
export async function generatePartnerActivityReport(
  partnerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  partner: { id: string; name: string } | null
  period: { start: Date; end: Date }
  summary: {
    totalActions: number
    earningsCreated: number
    earningsPaid: number
    payoutBatches: number
    referralsAdded: number
  }
  timeline: AuditLog[]
}> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true }
  })
  
  const { entries } = await queryAuditLogs({
    actions: PARTNER_AUDIT_ACTIONS,
    startDate: periodStart,
    endDate: periodEnd
  })
  
  // Filter entries related to this partner
  const partnerEntries = entries.filter(e => {
    const metadata = e.metadata as Record<string, any>
    return e.targetId === partnerId || metadata?.partnerId === partnerId
  })
  
  // Calculate summary
  const summary = {
    totalActions: partnerEntries.length,
    earningsCreated: partnerEntries.filter(e => e.action === 'EARNING_CREATED').length,
    earningsPaid: partnerEntries.filter(e => e.action === 'EARNING_PAID').length,
    payoutBatches: partnerEntries.filter(e => e.action === 'PAYOUT_BATCH_CREATED').length,
    referralsAdded: partnerEntries.filter(e => 
      e.action === 'ATTRIBUTION_CREATED' || e.action === 'PARTNER_REFERRAL_CREATED'
    ).length
  }
  
  return {
    partner,
    period: { start: periodStart, end: periodEnd },
    summary,
    timeline: partnerEntries
  }
}

// ============================================================================
// RETENTION POLICY
// ============================================================================

/**
 * Retention policy configuration
 */
export const RETENTION_POLICY = {
  // Partner audit logs - keep for 7 years (compliance requirement)
  PARTNER_LOGS_YEARS: 7,
  
  // Earnings audit logs - keep for 7 years (tax/financial compliance)
  EARNINGS_LOGS_YEARS: 7,
  
  // Payout audit logs - keep for 7 years (financial compliance)
  PAYOUT_LOGS_YEARS: 7,
  
  // General audit logs - keep for 3 years
  GENERAL_LOGS_YEARS: 3,
  
  // Actions that require extended retention
  EXTENDED_RETENTION_ACTIONS: [
    'EARNING_CREATED',
    'EARNING_PAID',
    'EARNING_REVERSED',
    'PAYOUT_BATCH_CREATED',
    'PAYOUT_BATCH_PROCESSED',
    'PARTNER_AGREEMENT_SIGNED',
    'TAX_DOCUMENT_VERIFIED'
  ] as AuditAction[]
} as const

/**
 * Check if an audit entry is within retention period
 */
export function isWithinRetention(entry: AuditLog): boolean {
  const now = new Date()
  const entryAge = (now.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365)
  
  // Extended retention for financial actions
  if (RETENTION_POLICY.EXTENDED_RETENTION_ACTIONS.includes(entry.action)) {
    return entryAge < RETENTION_POLICY.EARNINGS_LOGS_YEARS
  }
  
  // Partner actions
  if (PARTNER_AUDIT_ACTIONS.includes(entry.action)) {
    return entryAge < RETENTION_POLICY.PARTNER_LOGS_YEARS
  }
  
  // General logs
  return entryAge < RETENTION_POLICY.GENERAL_LOGS_YEARS
}

/**
 * Get entries due for archival (outside retention but not deleted)
 * 
 * NOTE: Actual archival/deletion should be done via a scheduled job
 * and may require legal/compliance approval
 */
export async function getEntriesDueForArchival(): Promise<{
  count: number
  oldestEntry: Date | null
  byAction: Record<string, number>
}> {
  const now = new Date()
  const generalCutoff = new Date(now)
  generalCutoff.setFullYear(generalCutoff.getFullYear() - RETENTION_POLICY.GENERAL_LOGS_YEARS)
  
  const extendedCutoff = new Date(now)
  extendedCutoff.setFullYear(extendedCutoff.getFullYear() - RETENTION_POLICY.EARNINGS_LOGS_YEARS)
  
  // Get entries outside general retention that are NOT in extended retention category
  const generalExpired = await prisma.auditLog.findMany({
    where: {
      createdAt: { lt: generalCutoff },
      action: { notIn: RETENTION_POLICY.EXTENDED_RETENTION_ACTIONS }
    }
  })
  
  // Get entries outside extended retention
  const extendedExpired = await prisma.auditLog.findMany({
    where: {
      createdAt: { lt: extendedCutoff },
      action: { in: RETENTION_POLICY.EXTENDED_RETENTION_ACTIONS }
    }
  })
  
  const allExpired = [...generalExpired, ...extendedExpired]
  
  const byAction: Record<string, number> = {}
  let oldestEntry: Date | null = null
  
  for (const entry of allExpired) {
    byAction[entry.action] = (byAction[entry.action] || 0) + 1
    if (!oldestEntry || entry.createdAt < oldestEntry) {
      oldestEntry = entry.createdAt
    }
  }
  
  return {
    count: allExpired.length,
    oldestEntry,
    byAction
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUDIT_RULES = {
  // Audits are immutable
  IMMUTABLE: true,
  
  // No updates allowed
  NO_UPDATES: true,
  
  // No deletes allowed (except via retention policy)
  NO_DELETES: true,
  
  // Full context required
  FULL_CONTEXT: true,
  
  // Timestamp auto-generated
  AUTO_TIMESTAMP: true
} as const
