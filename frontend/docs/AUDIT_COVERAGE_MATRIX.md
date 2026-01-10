# Audit Coverage Matrix

**Phase:** Stop Point 4 — Audit & Governance Hooks  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document provides a living coverage map showing which governed actions emit audit events across all governance surfaces. This is a **regulator-readable artifact** for compliance purposes.

---

## Coverage Summary

| Surface | Total Actions | Audited | Coverage |
|---------|---------------|---------|----------|
| Super Admin Control Plane | 7 | 7 | ✅ 100% |
| Partner Admin Portal | 4 | 4 | ✅ 100% |
| Pricing Engine | 4 | 4 | ✅ 100% |
| Trial Management | 5 | 5 | ✅ 100% |
| Domain Middleware | 4 | 4 | ✅ 100% |
| Demo Mode | 3 | 3 | ✅ 100% |
| System | 2 | 2 | ✅ 100% |

**Total Coverage: 29/29 actions (100%)**

---

## Detailed Coverage by Surface

### Super Admin Control Plane

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Partner type created | ✅ | partner-type | Append-only |
| Partner type updated | ✅ | partner-type | Append-only |
| Partner type assigned | ✅ | partner | Links partner to type |
| Partner category created | ✅ | partner-category | Append-only |
| Partner category updated | ✅ | partner-category | Append-only |
| Partner category assigned | ✅ | partner | Links partner to category |
| Partner capabilities updated | ✅ | capability | Override applied |

### Partner Admin Portal

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Client created | ✅ | client | Capability-gated |
| Client updated | ✅ | client | Capability-gated |
| Client suspended | ✅ | client | Capability-gated |
| Client reactivated | ✅ | client | Capability-gated |

### Pricing Engine

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Pricing model created | ✅ | pricing-model | Super Admin only |
| Pricing model activated/deactivated | ✅ | pricing-model | Super Admin only |
| Pricing assigned | ✅ | pricing-assignment | Facts only |
| Discount applied | ✅ | pricing-assignment | Within limits |

### Trial Management

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Trial granted | ✅ | trial | Time-bound |
| Trial extended | ✅ | trial | Within limits |
| Trial cancelled | ✅ | trial | Partner action |
| Trial expired | ✅ | trial | System action |
| Trial converted | ✅ | trial | To paid subscription |

### Domain Middleware

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Domain created | ✅ | domain | Initial registration |
| Domain activated | ✅ | domain | Status change |
| Domain suspended | ✅ | domain | Lifecycle enforcement |
| Domain terminated | ✅ | domain | End of lifecycle |

### Demo Mode

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Demo session started | ✅ | partner | demoOnly flag set |
| Demo session ended | ✅ | partner | demoOnly flag set |
| Demo action performed | ✅ | client | demoOnly flag set |

### System

| Action | Audited | Subject Type | Notes |
|--------|---------|--------------|-------|
| Entitlement computed | ✅ | entitlement | Auto-computed |
| Audit exported | ✅ | partner | Static bundle |

---

## Governance Flags Coverage

| Flag | Purpose | Applied To |
|------|---------|------------|
| `commerceBoundary` | No billing/payments | All events (100%) |
| `appendOnly` | Immutable records | All events (100%) |
| `demoOnly` | Demo context marker | Demo mode events |
| `readOnly` | No state change | View/export events |
| `capabilityGated` | Permission-gated | Partner Admin events |

---

## Integrity Guarantees

### Assertion Points

The system includes integrity checks at:

1. **Partner Admin Mutations**
   - Every client create/update/suspend → audit event
   - Every pricing assignment → audit event
   - Every trial grant → audit event

2. **Super Admin Mutations**
   - Every type/category change → audit event
   - Every capability update → audit event
   - Every pricing model change → audit event

3. **System Mutations**
   - Every domain lifecycle transition → audit event
   - Every trial expiration → audit event

### Missing Audit Warnings

The system tracks missing audit events via:
```typescript
getMissingAuditWarnings(): { action: string; timestamp: string; details: string }[]
```

These are displayed in the Audit Inspection UI as integrity warnings.

---

## Verification Methods

### 1. Audit Inspection UI
- Location: `/admin/partners/governance/inspection`
- Purpose: Read-only event review
- Access: Super Admin only

### 2. Audit Export
- Location: `/audit/export`
- Purpose: Static bundle generation
- Format: JSON with statistics

### 3. Integrity Assertions
```typescript
// Check if action was audited
hasAuditForAction(action: string, subjectId: string): boolean

// Assert and warn if missing
assertAudited(action: string, subjectId: string): void
```

---

## Compliance Notes

### For Regulators

1. **All governed actions are logged** — No silent mutations
2. **Events are append-only** — Cannot be modified or deleted
3. **PII is redacted** — Safe for evidence
4. **Demo actions are flagged** — Clear distinction from production
5. **Coverage is 100%** — No gaps in audit trail

### Export Format

Static audit bundles include:
- All events (serialized, redacted)
- Filter criteria applied
- Statistics summary
- Export timestamp

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Review Cycle:** Before each regulator audit
