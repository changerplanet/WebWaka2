/**
 * Audit Hook Utilities
 * 
 * Standardized audit helpers used across all governance surfaces.
 * Ensures no governed mutation exists without an audit hook.
 * 
 * @phase Stop Point 4 - Audit & Governance Hooks
 */

import { v4 as uuidv4 } from 'uuid'
import {
  CanonicalAuditEvent,
  AuditActorType,
  AuditSubjectType,
  AuditSurface,
  GovernanceFlags,
  DEFAULT_GOVERNANCE_FLAGS,
  validateAuditEvent,
  serializeAuditEvent,
  AUDIT_ACTION_REGISTRY,
  AuditAction,
} from './audit-canonical'

// =============================================================================
// AUDIT EVENT STORE (In-memory, append-only)
// =============================================================================

// Canonical audit store - append-only, never modified
const CANONICAL_AUDIT_STORE: CanonicalAuditEvent[] = []

// Missing audit warnings (for integrity checks)
const MISSING_AUDIT_WARNINGS: { action: string; timestamp: string; details: string }[] = []

// =============================================================================
// AUDIT HOOK CREATION
// =============================================================================

export interface CreateAuditHookInput {
  action: AuditAction | string
  actorType: AuditActorType
  actorId: string
  actorDisplay?: string
  subjectType: AuditSubjectType
  subjectId: string
  partnerId?: string
  tenantId?: string
  domain?: string
  suite?: string
  changeType: 'create' | 'update' | 'assign' | 'revoke' | 'emit' | 'view' | 'export'
  previousValue?: unknown
  newValue?: unknown
  reason?: string
  surface: AuditSurface
  context?: Record<string, unknown>
  governanceOverrides?: Partial<GovernanceFlags>
}

/**
 * Create and emit a canonical audit event
 * 
 * This is the primary entry point for all audit event creation.
 * All governed actions MUST use this function.
 */
export function emitAuditEvent(input: CreateAuditHookInput): CanonicalAuditEvent {
  const event: CanonicalAuditEvent = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actorType: input.actorType,
    actorId: input.actorId,
    actorDisplay: input.actorDisplay,
    partnerId: input.partnerId,
    tenantId: input.tenantId,
    domain: input.domain,
    suite: input.suite,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    metadata: {
      changeType: input.changeType,
      previousValue: input.previousValue,
      newValue: input.newValue,
      reason: input.reason,
      surface: input.surface,
      context: input.context,
    },
    governanceFlags: {
      ...DEFAULT_GOVERNANCE_FLAGS,
      ...input.governanceOverrides,
    },
  }

  // Validate event
  const validation = validateAuditEvent(event)
  if (!validation.valid) {
    console.error('[AUDIT] Invalid audit event:', validation.errors)
    // Still emit but log warning
    MISSING_AUDIT_WARNINGS.push({
      action: input.action,
      timestamp: new Date().toISOString(),
      details: `Validation errors: ${validation.errors.join(', ')}`,
    })
  }

  // Append to store (immutable)
  CANONICAL_AUDIT_STORE.push(Object.freeze(event))

  // Log for debugging
  console.log(`[AUDIT] ${event.action}`, {
    id: event.id,
    actor: event.actorDisplay || event.actorId,
    subject: `${event.subjectType}:${event.subjectId}`,
    surface: event.metadata.surface,
  })

  return event
}

// =============================================================================
// SURFACE-SPECIFIC AUDIT HOOKS
// =============================================================================

/**
 * Super Admin audit hook
 */
export function auditSuperAdmin(input: Omit<CreateAuditHookInput, 'actorType' | 'surface'>) {
  return emitAuditEvent({
    ...input,
    actorType: 'super-admin',
    surface: 'super-admin-control-plane',
  })
}

/**
 * Partner Admin audit hook
 */
export function auditPartnerAdmin(
  input: Omit<CreateAuditHookInput, 'actorType' | 'surface'> & { partnerId: string }
) {
  return emitAuditEvent({
    ...input,
    actorType: 'partner-admin',
    surface: 'partner-admin-portal',
    governanceOverrides: {
      ...input.governanceOverrides,
      capabilityGated: true,
    },
  })
}

/**
 * Domain middleware audit hook
 */
export function auditDomainLifecycle(
  input: Omit<CreateAuditHookInput, 'actorType' | 'surface' | 'subjectType'> & { domain: string }
) {
  return emitAuditEvent({
    ...input,
    actorType: 'system',
    surface: 'domain-middleware',
    subjectType: 'domain',
    subjectId: input.domain,
  })
}

/**
 * Pricing engine audit hook
 */
export function auditPricing(
  input: Omit<CreateAuditHookInput, 'surface'> & { pricingModelId?: string }
) {
  return emitAuditEvent({
    ...input,
    surface: 'pricing-engine',
    context: {
      ...input.context,
      pricingModelId: input.pricingModelId,
    },
  })
}

/**
 * Trial management audit hook
 */
export function auditTrial(
  input: Omit<CreateAuditHookInput, 'surface' | 'subjectType'> & { trialId: string }
) {
  return emitAuditEvent({
    ...input,
    surface: 'trial-management',
    subjectType: 'trial',
    subjectId: input.trialId,
  })
}

/**
 * Demo mode audit hook
 */
export function auditDemo(input: Omit<CreateAuditHookInput, 'actorType' | 'surface'>) {
  return emitAuditEvent({
    ...input,
    actorType: 'demo-user',
    surface: 'demo-mode',
    governanceOverrides: {
      ...input.governanceOverrides,
      demoOnly: true,
    },
  })
}

/**
 * System audit hook (for automated/scheduled actions)
 */
export function auditSystem(input: Omit<CreateAuditHookInput, 'actorType' | 'actorId'>) {
  return emitAuditEvent({
    ...input,
    actorType: 'system',
    actorId: 'system',
    actorDisplay: 'System',
  })
}

// =============================================================================
// AUDIT QUERY FUNCTIONS
// =============================================================================

export interface AuditQueryFilters {
  action?: string
  actorType?: AuditActorType
  actorId?: string
  partnerId?: string
  tenantId?: string
  subjectType?: AuditSubjectType
  subjectId?: string
  surface?: AuditSurface
  fromDate?: string
  toDate?: string
  demoOnly?: boolean
  limit?: number
  offset?: number
}

/**
 * Query canonical audit events with filters
 */
export function queryAuditEvents(filters?: AuditQueryFilters): {
  events: CanonicalAuditEvent[]
  total: number
} {
  let filtered = [...CANONICAL_AUDIT_STORE]

  if (filters?.action) {
    filtered = filtered.filter((e: any) => e.action === filters.action)
  }
  if (filters?.actorType) {
    filtered = filtered.filter((e: any) => e.actorType === filters.actorType)
  }
  if (filters?.actorId) {
    filtered = filtered.filter((e: any) => e.actorId === filters.actorId)
  }
  if (filters?.partnerId) {
    filtered = filtered.filter((e: any) => e.partnerId === filters.partnerId)
  }
  if (filters?.tenantId) {
    filtered = filtered.filter((e: any) => e.tenantId === filters.tenantId)
  }
  if (filters?.subjectType) {
    filtered = filtered.filter((e: any) => e.subjectType === filters.subjectType)
  }
  if (filters?.subjectId) {
    filtered = filtered.filter((e: any) => e.subjectId === filters.subjectId)
  }
  if (filters?.surface) {
    filtered = filtered.filter((e: any) => e.metadata.surface === filters.surface)
  }
  if (filters?.fromDate) {
    filtered = filtered.filter((e: any) => e.timestamp >= filters.fromDate!)
  }
  if (filters?.toDate) {
    filtered = filtered.filter((e: any) => e.timestamp <= filters.toDate!)
  }
  if (filters?.demoOnly !== undefined) {
    filtered = filtered.filter((e: any) => e.governanceFlags.demoOnly === filters.demoOnly)
  }

  // Sort by timestamp descending
  filtered.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))

  const total = filtered.length
  const offset = filters?.offset || 0
  const limit = filters?.limit || 50

  return {
    events: filtered.slice(offset, offset + limit),
    total,
  }
}

/**
 * Get audit events for a specific partner
 */
export function getPartnerAuditTrail(partnerId: string, limit = 100): CanonicalAuditEvent[] {
  return queryAuditEvents({ partnerId, limit }).events
}

/**
 * Get audit events for a specific action
 */
export function getActionAuditTrail(action: string, limit = 100): CanonicalAuditEvent[] {
  return queryAuditEvents({ action, limit }).events
}

/**
 * Get audit events by surface
 */
export function getSurfaceAuditTrail(surface: AuditSurface, limit = 100): CanonicalAuditEvent[] {
  return queryAuditEvents({ surface, limit }).events
}

// =============================================================================
// AUDIT STATISTICS
// =============================================================================

export interface AuditStatistics {
  totalEvents: number
  last24Hours: number
  last7Days: number
  byActorType: Record<AuditActorType, number>
  bySurface: Record<AuditSurface, number>
  bySubjectType: Record<string, number>
  byAction: Record<string, number>
  demoEvents: number
  capabilityGatedEvents: number
}

/**
 * Get comprehensive audit statistics
 */
export function getAuditStatistics(): AuditStatistics {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const byActorType: Record<string, number> = {}
  const bySurface: Record<string, number> = {}
  const bySubjectType: Record<string, number> = {}
  const byAction: Record<string, number> = {}
  let count24h = 0
  let count7d = 0
  let demoEvents = 0
  let capabilityGatedEvents = 0

  for (const event of CANONICAL_AUDIT_STORE) {
    // Actor type
    byActorType[event.actorType] = (byActorType[event.actorType] || 0) + 1

    // Surface
    bySurface[event.metadata.surface] = (bySurface[event.metadata.surface] || 0) + 1

    // Subject type
    bySubjectType[event.subjectType] = (bySubjectType[event.subjectType] || 0) + 1

    // Action
    byAction[event.action] = (byAction[event.action] || 0) + 1

    // Time-based
    if (event.timestamp >= last24Hours) count24h++
    if (event.timestamp >= last7Days) count7d++

    // Governance flags
    if (event.governanceFlags.demoOnly) demoEvents++
    if (event.governanceFlags.capabilityGated) capabilityGatedEvents++
  }

  return {
    totalEvents: CANONICAL_AUDIT_STORE.length,
    last24Hours: count24h,
    last7Days: count7d,
    byActorType: byActorType as Record<AuditActorType, number>,
    bySurface: bySurface as Record<AuditSurface, number>,
    bySubjectType,
    byAction,
    demoEvents,
    capabilityGatedEvents,
  }
}

// =============================================================================
// INTEGRITY CHECKS
// =============================================================================

/**
 * Get missing audit warnings (for integrity monitoring)
 */
export function getMissingAuditWarnings(): typeof MISSING_AUDIT_WARNINGS {
  return [...MISSING_AUDIT_WARNINGS]
}

/**
 * Check if a specific action has been audited
 */
export function hasAuditForAction(action: string, subjectId: string): boolean {
  return CANONICAL_AUDIT_STORE.some((e: any) => e.action === action && e.subjectId === subjectId)
}

/**
 * Assert that an action was audited (for testing)
 */
export function assertAudited(action: string, subjectId: string): void {
  if (!hasAuditForAction(action, subjectId)) {
    MISSING_AUDIT_WARNINGS.push({
      action,
      timestamp: new Date().toISOString(),
      details: `Expected audit event for ${action} on ${subjectId} not found`,
    })
    console.warn(`[AUDIT WARNING] Missing audit event: ${action} on ${subjectId}`)
  }
}

// =============================================================================
// EXPORT FOR STATIC BUNDLES
// =============================================================================

/**
 * Export all audit events as a static bundle (for regulator evidence)
 */
export function exportAuditBundle(filters?: AuditQueryFilters): {
  exportedAt: string
  filters: AuditQueryFilters | undefined
  eventCount: number
  events: string[]
  statistics: AuditStatistics
} {
  const { events, total } = queryAuditEvents(filters)
  
  return {
    exportedAt: new Date().toISOString(),
    filters,
    eventCount: total,
    events: events.map(serializeAuditEvent),
    statistics: getAuditStatistics(),
  }
}
