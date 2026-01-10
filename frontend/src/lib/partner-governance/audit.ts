/**
 * Partner Governance Audit System
 * 
 * Append-only audit logging for all partner governance actions.
 * Governance requires full audit trail - no action goes unlogged.
 * 
 * @module lib/partner-governance/audit
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { v4 as uuidv4 } from 'uuid'
import { PartnerGovernanceAuditEvent, PartnerGovernanceAction } from './types'

// =============================================================================
// AUDIT LOG STORE (In-memory for demo, append-only)
// =============================================================================

// In production, this would be persisted to a write-only audit database
const GOVERNANCE_AUDIT_LOG: PartnerGovernanceAuditEvent[] = []

// =============================================================================
// AUDIT FUNCTIONS
// =============================================================================

export interface CreateAuditEventInput {
  action: PartnerGovernanceAction
  actorId: string
  actorType: 'super-admin' | 'partner-admin' | 'system'
  actorEmail: string
  scope: {
    partnerId?: string
    clientId?: string
    pricingModelId?: string
    trialId?: string
  }
  changeType: 'create' | 'update' | 'assign' | 'revoke' | 'emit'
  previousValue?: unknown
  newValue?: unknown
  reason?: string
  ipAddress?: string
  sessionId?: string
}

/**
 * Create and append an audit event (append-only, never modified)
 */
export function createGovernanceAuditEvent(input: CreateAuditEventInput): PartnerGovernanceAuditEvent {
  const event: PartnerGovernanceAuditEvent = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actorId: input.actorId,
    actorType: input.actorType,
    actorEmail: input.actorEmail,
    action: input.action,
    scope: input.scope,
    changeType: input.changeType,
    previousValue: input.previousValue,
    newValue: input.newValue,
    reason: input.reason,
    ipAddress: input.ipAddress,
    sessionId: input.sessionId,
  }
  
  // Append to log (immutable once added)
  GOVERNANCE_AUDIT_LOG.push(Object.freeze(event))
  
  console.log(`[GOVERNANCE AUDIT] ${event.action}`, {
    id: event.id,
    actor: event.actorEmail,
    scope: event.scope,
  })
  
  return event
}

/**
 * Get audit events with optional filters
 */
export function getGovernanceAuditEvents(filters?: {
  action?: PartnerGovernanceAction
  actorId?: string
  partnerId?: string
  clientId?: string
  pricingModelId?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}): { events: PartnerGovernanceAuditEvent[]; total: number } {
  let filtered = [...GOVERNANCE_AUDIT_LOG]
  
  if (filters?.action) {
    filtered = filtered.filter((e: any) => e.action === filters.action)
  }
  
  if (filters?.actorId) {
    filtered = filtered.filter((e: any) => e.actorId === filters.actorId)
  }
  
  if (filters?.partnerId) {
    filtered = filtered.filter((e: any) => e.scope.partnerId === filters.partnerId)
  }
  
  if (filters?.clientId) {
    filtered = filtered.filter((e: any) => e.scope.clientId === filters.clientId)
  }
  
  if (filters?.pricingModelId) {
    filtered = filtered.filter((e: any) => e.scope.pricingModelId === filters.pricingModelId)
  }
  
  if (filters?.fromDate) {
    filtered = filtered.filter((e: any) => e.timestamp >= filters.fromDate!)
  }
  
  if (filters?.toDate) {
    filtered = filtered.filter((e: any) => e.timestamp <= filters.toDate!)
  }
  
  // Sort by timestamp descending (most recent first)
  filtered.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))
  
  const total = filtered.length
  
  // Apply pagination
  const offset = filters?.offset || 0
  const limit = filters?.limit || 50
  filtered = filtered.slice(offset, offset + limit)
  
  return { events: filtered, total }
}

/**
 * Get audit events for a specific partner
 */
export function getPartnerAuditHistory(partnerId: string, limit = 50): PartnerGovernanceAuditEvent[] {
  return getGovernanceAuditEvents({ partnerId, limit }).events
}

/**
 * Get audit events for a specific pricing model
 */
export function getPricingModelAuditHistory(pricingModelId: string, limit = 50): PartnerGovernanceAuditEvent[] {
  return getGovernanceAuditEvents({ pricingModelId, limit }).events
}

/**
 * Get all audit events by a specific actor
 */
export function getActorAuditHistory(actorId: string, limit = 50): PartnerGovernanceAuditEvent[] {
  return getGovernanceAuditEvents({ actorId, limit }).events
}

// =============================================================================
// AUDIT ACTION HELPERS
// =============================================================================

/**
 * Log partner type assignment
 */
export function auditPartnerTypeAssigned(
  actorId: string,
  actorEmail: string,
  partnerId: string,
  previousTypeId: string | null,
  newTypeId: string,
  reason?: string
): void {
  createGovernanceAuditEvent({
    action: 'partner.type.assigned',
    actorId,
    actorType: 'super-admin',
    actorEmail,
    scope: { partnerId },
    changeType: previousTypeId ? 'update' : 'assign',
    previousValue: previousTypeId,
    newValue: newTypeId,
    reason,
  })
}

/**
 * Log partner category assignment
 */
export function auditPartnerCategoryAssigned(
  actorId: string,
  actorEmail: string,
  partnerId: string,
  previousCategoryId: string | null,
  newCategoryId: string,
  reason?: string
): void {
  createGovernanceAuditEvent({
    action: 'partner.category.assigned',
    actorId,
    actorType: 'super-admin',
    actorEmail,
    scope: { partnerId },
    changeType: previousCategoryId ? 'update' : 'assign',
    previousValue: previousCategoryId,
    newValue: newCategoryId,
    reason,
  })
}

/**
 * Log partner capabilities update
 */
export function auditPartnerCapabilitiesUpdated(
  actorId: string,
  actorEmail: string,
  partnerId: string,
  previousCapabilities: unknown,
  newCapabilities: unknown,
  reason?: string
): void {
  createGovernanceAuditEvent({
    action: 'partner.capabilities.updated',
    actorId,
    actorType: 'super-admin',
    actorEmail,
    scope: { partnerId },
    changeType: 'update',
    previousValue: previousCapabilities,
    newValue: newCapabilities,
    reason,
  })
}

/**
 * Log pricing model creation
 */
export function auditPricingModelCreated(
  actorId: string,
  actorEmail: string,
  pricingModelId: string,
  modelConfig: unknown
): void {
  createGovernanceAuditEvent({
    action: 'pricing-model.created',
    actorId,
    actorType: 'super-admin',
    actorEmail,
    scope: { pricingModelId },
    changeType: 'create',
    newValue: modelConfig,
  })
}

/**
 * Log pricing model activation
 */
export function auditPricingModelActivated(
  actorId: string,
  actorEmail: string,
  pricingModelId: string
): void {
  createGovernanceAuditEvent({
    action: 'pricing-model.activated',
    actorId,
    actorType: 'super-admin',
    actorEmail,
    scope: { pricingModelId },
    changeType: 'update',
    previousValue: { isActive: false },
    newValue: { isActive: true },
  })
}

/**
 * Log pricing model deactivation
 */
export function auditPricingModelDeactivated(
  actorId: string,
  actorEmail: string,
  pricingModelId: string,
  reason?: string
): void {
  createGovernanceAuditEvent({
    action: 'pricing-model.deactivated',
    actorId,
    actorType: 'super-admin',
    actorEmail,
    scope: { pricingModelId },
    changeType: 'update',
    previousValue: { isActive: true },
    newValue: { isActive: false },
    reason,
  })
}

/**
 * Log pricing assignment
 */
export function auditPricingAssigned(
  actorId: string,
  actorEmail: string,
  actorType: 'super-admin' | 'partner-admin',
  partnerId: string,
  clientId: string | undefined,
  pricingModelId: string,
  assignmentDetails: unknown
): void {
  createGovernanceAuditEvent({
    action: 'pricing.assigned',
    actorId,
    actorType,
    actorEmail,
    scope: { partnerId, clientId, pricingModelId },
    changeType: 'assign',
    newValue: assignmentDetails,
  })
}

/**
 * Log discount application
 */
export function auditDiscountApplied(
  actorId: string,
  actorEmail: string,
  actorType: 'super-admin' | 'partner-admin',
  partnerId: string,
  clientId: string | undefined,
  discountPercent: number,
  reason?: string
): void {
  createGovernanceAuditEvent({
    action: 'pricing.discount.applied',
    actorId,
    actorType,
    actorEmail,
    scope: { partnerId, clientId },
    changeType: 'update',
    newValue: { discountPercent },
    reason,
  })
}

/**
 * Log pricing fact emission
 */
export function auditPricingFactEmitted(
  partnerId: string,
  clientId: string,
  factId: string,
  factDetails: unknown
): void {
  createGovernanceAuditEvent({
    action: 'pricing.fact.emitted',
    actorId: 'system',
    actorType: 'system',
    actorEmail: 'system@webwaka.com',
    scope: { partnerId, clientId },
    changeType: 'emit',
    newValue: { factId, ...factDetails as object },
  })
}

// =============================================================================
// AUDIT STATISTICS
// =============================================================================

/**
 * Get audit statistics for governance dashboard
 */
export function getGovernanceAuditStats(): {
  totalEvents: number
  last24Hours: number
  last7Days: number
  byAction: Record<string, number>
  byActorType: Record<string, number>
} {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  
  const byAction: Record<string, number> = {}
  const byActorType: Record<string, number> = {}
  let countLast24Hours = 0
  let countLast7Days = 0
  
  for (const event of GOVERNANCE_AUDIT_LOG) {
    // Count by action
    byAction[event.action] = (byAction[event.action] || 0) + 1
    
    // Count by actor type
    byActorType[event.actorType] = (byActorType[event.actorType] || 0) + 1
    
    // Time-based counts
    if (event.timestamp >= last24Hours) {
      countLast24Hours++
    }
    if (event.timestamp >= last7Days) {
      countLast7Days++
    }
  }
  
  return {
    totalEvents: GOVERNANCE_AUDIT_LOG.length,
    last24Hours: countLast24Hours,
    last7Days: countLast7Days,
    byAction,
    byActorType,
  }
}
