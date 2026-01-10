/**
 * Canonical Audit Event Model
 * 
 * Single, normalized audit event shape used across all governance surfaces.
 * This is the source of truth for audit event structure.
 * 
 * @phase Stop Point 4 - Audit & Governance Hooks
 */

// =============================================================================
// CANONICAL AUDIT EVENT TYPE
// =============================================================================

/**
 * Actor types that can perform governed actions
 */
export type AuditActorType = 'super-admin' | 'partner-admin' | 'system' | 'demo-user'

/**
 * Subject types that can be affected by governed actions
 */
export type AuditSubjectType = 
  | 'partner'
  | 'partner-type'
  | 'partner-category'
  | 'client'
  | 'pricing-model'
  | 'pricing-assignment'
  | 'trial'
  | 'domain'
  | 'capability'
  | 'entitlement'

/**
 * Governance flags for audit classification
 */
export interface GovernanceFlags {
  /** Action respects commerce boundary (no billing/payments) */
  commerceBoundary: boolean
  /** Event is append-only (cannot be modified/deleted) */
  appendOnly: boolean
  /** Action occurred in demo context */
  demoOnly: boolean
  /** Action is read-only (no state change) */
  readOnly: boolean
  /** Action is capability-gated */
  capabilityGated: boolean
}

/**
 * Default governance flags
 */
export const DEFAULT_GOVERNANCE_FLAGS: GovernanceFlags = {
  commerceBoundary: true,
  appendOnly: true,
  demoOnly: false,
  readOnly: false,
  capabilityGated: false,
}

/**
 * Canonical Audit Event
 * 
 * Every governed action in the system emits an event conforming to this shape.
 * This ensures consistency across Super Admin, Partner Admin, Domain, Pricing,
 * Trial, and Demo surfaces.
 */
export interface CanonicalAuditEvent {
  /** Unique event identifier */
  id: string
  
  /** ISO 8601 timestamp when event occurred */
  timestamp: string
  
  /** Type of actor who performed the action */
  actorType: AuditActorType
  
  /** Unique identifier of the actor */
  actorId: string
  
  /** Email or display name of actor (for display only) */
  actorDisplay?: string
  
  /** Partner context (if applicable) */
  partnerId?: string
  
  /** Client/tenant context (if applicable) */
  tenantId?: string
  
  /** Domain context (if applicable) */
  domain?: string
  
  /** Suite context (if applicable) */
  suite?: string
  
  /** Action identifier (e.g., 'pricing.assigned', 'client.created') */
  action: string
  
  /** Type of subject affected by the action */
  subjectType: AuditSubjectType
  
  /** Unique identifier of the subject */
  subjectId: string
  
  /** Additional metadata (redacted, non-PII) */
  metadata: AuditEventMetadata
  
  /** Governance classification flags */
  governanceFlags: GovernanceFlags
}

/**
 * Audit event metadata (non-PII, redacted)
 */
export interface AuditEventMetadata {
  /** Type of change */
  changeType: 'create' | 'update' | 'assign' | 'revoke' | 'emit' | 'view' | 'export'
  
  /** Previous value (for updates) - must not contain PII */
  previousValue?: unknown
  
  /** New value (for creates/updates) - must not contain PII */
  newValue?: unknown
  
  /** Reason for action (optional) */
  reason?: string
  
  /** Surface where action originated */
  surface: AuditSurface
  
  /** Additional context-specific data */
  context?: Record<string, unknown>
}

/**
 * Governance surfaces that emit audit events
 */
export type AuditSurface = 
  | 'super-admin-control-plane'
  | 'partner-admin-portal'
  | 'domain-middleware'
  | 'pricing-engine'
  | 'trial-management'
  | 'demo-mode'
  | 'system'

// =============================================================================
// ACTION REGISTRY
// =============================================================================

/**
 * Complete registry of all auditable actions in the system
 */
export const AUDIT_ACTION_REGISTRY = {
  // Super Admin - Partner Management
  'partner.type.created': { surface: 'super-admin-control-plane', subjectType: 'partner-type' },
  'partner.type.updated': { surface: 'super-admin-control-plane', subjectType: 'partner-type' },
  'partner.type.assigned': { surface: 'super-admin-control-plane', subjectType: 'partner' },
  'partner.category.created': { surface: 'super-admin-control-plane', subjectType: 'partner-category' },
  'partner.category.updated': { surface: 'super-admin-control-plane', subjectType: 'partner-category' },
  'partner.category.assigned': { surface: 'super-admin-control-plane', subjectType: 'partner' },
  'partner.capabilities.updated': { surface: 'super-admin-control-plane', subjectType: 'capability' },
  
  // Super Admin - Pricing Models
  'pricing-model.created': { surface: 'super-admin-control-plane', subjectType: 'pricing-model' },
  'pricing-model.updated': { surface: 'super-admin-control-plane', subjectType: 'pricing-model' },
  'pricing-model.activated': { surface: 'super-admin-control-plane', subjectType: 'pricing-model' },
  'pricing-model.deactivated': { surface: 'super-admin-control-plane', subjectType: 'pricing-model' },
  
  // Pricing Assignments (Super Admin or Partner Admin)
  'pricing.assigned': { surface: 'pricing-engine', subjectType: 'pricing-assignment' },
  'pricing.discount.applied': { surface: 'pricing-engine', subjectType: 'pricing-assignment' },
  'pricing.assignment.revoked': { surface: 'pricing-engine', subjectType: 'pricing-assignment' },
  'pricing.fact.emitted': { surface: 'pricing-engine', subjectType: 'pricing-assignment' },
  
  // Partner Admin - Client Management
  'client.created': { surface: 'partner-admin-portal', subjectType: 'client' },
  'client.updated': { surface: 'partner-admin-portal', subjectType: 'client' },
  'client.suspended': { surface: 'partner-admin-portal', subjectType: 'client' },
  'client.reactivated': { surface: 'partner-admin-portal', subjectType: 'client' },
  
  // Trial Management
  'trial.granted': { surface: 'trial-management', subjectType: 'trial' },
  'trial.extended': { surface: 'trial-management', subjectType: 'trial' },
  'trial.cancelled': { surface: 'trial-management', subjectType: 'trial' },
  'trial.expired': { surface: 'trial-management', subjectType: 'trial' },
  'trial.converted': { surface: 'trial-management', subjectType: 'trial' },
  
  // Domain Lifecycle
  'domain.created': { surface: 'domain-middleware', subjectType: 'domain' },
  'domain.activated': { surface: 'domain-middleware', subjectType: 'domain' },
  'domain.suspended': { surface: 'domain-middleware', subjectType: 'domain' },
  'domain.terminated': { surface: 'domain-middleware', subjectType: 'domain' },
  
  // Entitlements
  'entitlement.computed': { surface: 'system', subjectType: 'entitlement' },
  'entitlement.viewed': { surface: 'partner-admin-portal', subjectType: 'entitlement' },
  
  // Demo Mode
  'demo.session.started': { surface: 'demo-mode', subjectType: 'partner' },
  'demo.session.ended': { surface: 'demo-mode', subjectType: 'partner' },
  'demo.action.performed': { surface: 'demo-mode', subjectType: 'client' },
  
  // Audit (meta)
  'audit.viewed': { surface: 'super-admin-control-plane', subjectType: 'partner' },
  'audit.exported': { surface: 'super-admin-control-plane', subjectType: 'partner' },
} as const

export type AuditAction = keyof typeof AUDIT_ACTION_REGISTRY

// =============================================================================
// AUDIT EVENT VALIDATION
// =============================================================================

/**
 * Validate that an audit event conforms to the canonical model
 */
export function validateAuditEvent(event: Partial<CanonicalAuditEvent>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!event.id) errors.push('Missing required field: id')
  if (!event.timestamp) errors.push('Missing required field: timestamp')
  if (!event.actorType) errors.push('Missing required field: actorType')
  if (!event.actorId) errors.push('Missing required field: actorId')
  if (!event.action) errors.push('Missing required field: action')
  if (!event.subjectType) errors.push('Missing required field: subjectType')
  if (!event.subjectId) errors.push('Missing required field: subjectId')
  if (!event.metadata) errors.push('Missing required field: metadata')
  if (!event.governanceFlags) errors.push('Missing required field: governanceFlags')
  
  // Validate governance flags
  if (event.governanceFlags) {
    if (typeof event.governanceFlags.commerceBoundary !== 'boolean') {
      errors.push('governanceFlags.commerceBoundary must be boolean')
    }
    if (typeof event.governanceFlags.appendOnly !== 'boolean') {
      errors.push('governanceFlags.appendOnly must be boolean')
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// =============================================================================
// AUDIT EVENT SERIALIZATION
// =============================================================================

/**
 * Serialize an audit event for storage/transmission
 * Ensures no PII leakage
 */
export function serializeAuditEvent(event: CanonicalAuditEvent): string {
  // Redact any potentially sensitive fields
  const sanitized = {
    ...event,
    actorDisplay: event.actorDisplay ? redactEmail(event.actorDisplay) : undefined,
    metadata: {
      ...event.metadata,
      // Ensure no PII in metadata
      previousValue: sanitizeValue(event.metadata.previousValue),
      newValue: sanitizeValue(event.metadata.newValue),
    },
  }
  
  return JSON.stringify(sanitized)
}

/**
 * Redact email addresses for audit logs
 */
function redactEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local.charAt(0)}***@${domain}`
}

/**
 * Sanitize values to remove potential PII
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    // Redact anything that looks like an email
    if (value.includes('@')) return redactEmail(value)
    return value
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue)
    }
    const sanitized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      // Skip sensitive field names
      if (['email', 'password', 'phone', 'address'].includes(k.toLowerCase())) {
        sanitized[k] = '***REDACTED***'
      } else {
        sanitized[k] = sanitizeValue(v)
      }
    }
    return sanitized
  }
  return value
}
