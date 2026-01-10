# Canonical Audit Event Model

**Phase:** Stop Point 4 — Audit & Governance Hooks  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the **canonical audit event model** used across all governance surfaces in the WebWaka Partner Governance System. Every governed action emits an event conforming to this shape.

---

## Canonical Event Structure

```typescript
interface CanonicalAuditEvent {
  // Identity
  id: string                    // Unique event identifier (UUID)
  timestamp: string             // ISO 8601 timestamp
  
  // Actor
  actorType: AuditActorType     // super-admin | partner-admin | system | demo-user
  actorId: string               // Unique identifier of actor
  actorDisplay?: string         // Email/name for display (redacted)
  
  // Context
  partnerId?: string            // Partner context
  tenantId?: string             // Client/tenant context
  domain?: string               // Domain context
  suite?: string                // Suite context
  
  // Action
  action: string                // Action identifier (e.g., 'pricing.assigned')
  subjectType: AuditSubjectType // Type of subject affected
  subjectId: string             // Unique identifier of subject
  
  // Metadata
  metadata: AuditEventMetadata  // Change details, surface, context
  
  // Governance
  governanceFlags: GovernanceFlags // Classification flags
}
```

---

## Actor Types

| Actor Type | Description | Example |
|------------|-------------|---------|
| `super-admin` | Platform administrator | Creating pricing models |
| `partner-admin` | Partner organization admin | Creating clients |
| `system` | Automated system actions | Trial expiration |
| `demo-user` | Demo mode user | Simulated actions |

---

## Subject Types

| Subject Type | Description |
|--------------|-------------|
| `partner` | Partner organization |
| `partner-type` | Partner type definition |
| `partner-category` | Partner category definition |
| `client` | Client/tenant |
| `pricing-model` | Pricing model configuration |
| `pricing-assignment` | Pricing assignment to partner/client |
| `trial` | Trial grant |
| `domain` | Domain lifecycle |
| `capability` | Partner capability |
| `entitlement` | Computed entitlement |

---

## Governance Flags

| Flag | Type | Description |
|------|------|-------------|
| `commerceBoundary` | boolean | Action respects commerce boundary (no billing) |
| `appendOnly` | boolean | Event is append-only (immutable) |
| `demoOnly` | boolean | Action occurred in demo context |
| `readOnly` | boolean | Action is read-only (no state change) |
| `capabilityGated` | boolean | Action is capability-gated |

**Default Values:**
```typescript
{
  commerceBoundary: true,
  appendOnly: true,
  demoOnly: false,
  readOnly: false,
  capabilityGated: false
}
```

---

## Metadata Structure

```typescript
interface AuditEventMetadata {
  changeType: 'create' | 'update' | 'assign' | 'revoke' | 'emit' | 'view' | 'export'
  previousValue?: unknown       // Must not contain PII
  newValue?: unknown           // Must not contain PII
  reason?: string              // Optional reason for action
  surface: AuditSurface        // Origin surface
  context?: Record<string, unknown> // Additional context
}
```

---

## Surfaces

| Surface | Description |
|---------|-------------|
| `super-admin-control-plane` | Super Admin governance UI |
| `partner-admin-portal` | Partner Admin UI |
| `domain-middleware` | Domain lifecycle middleware |
| `pricing-engine` | Pricing configuration/assignment |
| `trial-management` | Trial grant/management |
| `demo-mode` | Demo mode actions |
| `system` | Automated system actions |

---

## Action Registry

### Super Admin Actions
- `partner.type.created`
- `partner.type.updated`
- `partner.type.assigned`
- `partner.category.created`
- `partner.category.updated`
- `partner.category.assigned`
- `partner.capabilities.updated`

### Pricing Actions
- `pricing-model.created`
- `pricing-model.updated`
- `pricing-model.activated`
- `pricing-model.deactivated`
- `pricing.assigned`
- `pricing.discount.applied`
- `pricing.assignment.revoked`
- `pricing.fact.emitted`

### Client Actions
- `client.created`
- `client.updated`
- `client.suspended`
- `client.reactivated`

### Trial Actions
- `trial.granted`
- `trial.extended`
- `trial.cancelled`
- `trial.expired`
- `trial.converted`

### Domain Actions
- `domain.created`
- `domain.activated`
- `domain.suspended`
- `domain.terminated`

### Meta Actions
- `audit.viewed`
- `audit.exported`
- `entitlement.computed`
- `entitlement.viewed`
- `demo.session.started`
- `demo.session.ended`

---

## PII Protection

All audit events are automatically sanitized:

1. **Email Redaction**: `a***@example.com`
2. **Sensitive Fields**: `password`, `phone`, `address` → `***REDACTED***`
3. **No Persistence of PII**: Metadata must not contain personally identifiable information

---

## Implementation

**Source File:** `/app/frontend/src/lib/partner-governance/audit-canonical.ts`

**Key Functions:**
- `validateAuditEvent()` — Validate event structure
- `serializeAuditEvent()` — Serialize with PII redaction

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026
