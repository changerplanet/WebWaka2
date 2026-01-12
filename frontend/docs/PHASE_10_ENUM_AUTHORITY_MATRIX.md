# Phase 10A — Enum Authority Matrix

**Date**: December 2025  
**Status**: AUDIT COMPLETE (Read-Only)  
**Scope**: All enum types across Prisma schema, service layer, and API layer

---

## Executive Summary

A comprehensive read-only audit identified **299 enums in Prisma schema** with various levels of alignment to service layer types. Key findings:

| Category | Count | Status |
|----------|-------|--------|
| **Fully Aligned** | ~250+ | ✅ No action needed |
| **Minor Drift** | ~15 | ⚠️ Safe to map |
| **Significant Drift** | ~8 | ⚠️ Requires mapping |
| **Semantic Mismatch** | ~5 | 🛑 Domain review required |
| **Critical (Auth/Billing)** | ~8 | 🛑 FLAGGED - Do not touch |

---

## Enum Authority Matrix

### Category 1: Status Enums (High Impact)

| Enum Name | Prisma Values | Service Values | Drift Type | Proposed Authority | Risk |
|-----------|---------------|----------------|------------|-------------------|------|
| **CivicRequestStatus** | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `PENDING_DOCUMENTS`, `PENDING_PAYMENT`, `PENDING_INSPECTION`, `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED` | `SUBMITTED`, `UNDER_REVIEW`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`, `REJECTED` | SEMANTIC | Service (with adapter) | 🟡 MEDIUM |
| **LogisticsDeliveryStatus** | `PENDING`, `ASSIGNED`, `ACCEPTED`, `PICKING_UP`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVING`, `DELIVERED`, `FAILED`, `RETURNED` | `CREATED`, `PENDING`, `ASSIGNED`, `ACCEPTED`, `EN_ROUTE_PICKUP`, `AT_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `AT_DELIVERY`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `FAILED` | SEMANTIC | Service (richer workflow) | 🟡 MEDIUM |
| **VehicleStatus** (local) | N/A (no Prisma enum) | `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `OUT_OF_SERVICE`, `RESERVED` | SERVICE-ONLY | Service | 🟢 LOW |
| **SvmOrderStatus** | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`, `PARTIALLY_REFUNDED` | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED` | VALUE MISMATCH | Prisma (canonical) | 🟡 MEDIUM |
| **re_MaintenanceStatus** | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **re_LeaseStatus** | `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `RENEWED` | (uses Prisma directly) | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **HrLeaveStatus** | `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` | (uses Prisma directly) | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **HrAttendanceStatus** | `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `LEAVE`, `HOLIDAY`, `REST_DAY` | (uses Prisma directly) | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **pos_ShiftStatus** | `OPEN`, `CLOSED`, `RECONCILED`, `VOID` | `OPEN`, `CLOSED`, `RECONCILED`, `VOID` | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **pos_SaleStatus** | `COMPLETED`, `VOIDED`, `REFUNDED`, `PARTIALLY_REFUNDED` | `COMPLETED`, `VOIDED`, `REFUNDED`, `PARTIALLY_REFUNDED` | **ALIGNED** ✅ | Prisma | 🟢 LOW |

---

### Category 2: Priority/Type Enums (Medium Impact)

| Enum Name | Prisma Values | Service Values | Drift Type | Proposed Authority | Risk |
|-----------|---------------|----------------|------------|-------------------|------|
| **ServiceRequestPriority** (local) | N/A | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | SERVICE-ONLY | Service (with SLA metadata) | 🟢 LOW |
| **CivicCasePriority** | `LOW`, `NORMAL`, `HIGH`, `URGENT` | N/A (uses Prisma) | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **re_MaintenancePriority** | `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY` | `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY` | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **re_MaintenanceCategory** | `PLUMBING`, `ELECTRICAL`, `STRUCTURAL`, `HVAC`, `CLEANING`, `SECURITY`, `OTHER` | `PLUMBING`, `ELECTRICAL`, `STRUCTURAL`, `HVAC`, `CLEANING`, `SECURITY`, `OTHER` | **ALIGNED** ✅ | Prisma | 🟢 LOW |
| **JobPriority** (logistics) | N/A | `LOW`, `NORMAL`, `HIGH`, `URGENT`, `EXPRESS` | SERVICE-ONLY | Service (UI-enriched) | 🟢 LOW |
| **JobType** (logistics) | N/A | `DELIVERY`, `PICKUP`, `PICKUP_DELIVERY`, `MULTI_STOP`, `TRANSPORT`, `FREIGHT`, `TRANSFER` | SERVICE-ONLY | Service | 🟢 LOW |

---

### Category 3: Workflow/Lifecycle Enums (Highest Complexity)

| Enum Name | Prisma Values | Service Values | Drift Type | Proposed Authority | Risk |
|-----------|---------------|----------------|------------|-------------------|------|
| **JobStatus** (logistics) | N/A | `CREATED`, `PENDING`, `ASSIGNED`, `ACCEPTED`, `EN_ROUTE_PICKUP`, `AT_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `AT_DELIVERY`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `FAILED` | SERVICE-ONLY | Service (state machine) | 🟢 LOW |
| **FulfillmentStatus** (SVM) | N/A | `UNFULFILLED`, `PARTIALLY_FULFILLED`, `FULFILLED`, `RETURNED` | SERVICE-ONLY | Service | 🟢 LOW |

---

### Category 4: 🛑 CRITICAL ENUMS (DO NOT MODIFY)

These enums are tied to authorization, billing, or tenant isolation. **Phase 10B must NOT create mappers for these.**

| Enum Name | Location | Reason | Action |
|-----------|----------|--------|--------|
| **SubscriptionStatus** | Prisma | Billing critical path | 🛑 SKIP |
| **InstanceSubscriptionStatus** | Prisma | Platform billing | 🛑 SKIP |
| **BillingInterval** | Prisma | Payment scheduling | 🛑 SKIP |
| **TenantRole** | Prisma | Authorization | 🛑 SKIP |
| **TenantStatus** | Prisma | Access control | 🛑 SKIP |
| **ApiKeyStatus** | Prisma | Security | 🛑 SKIP |
| **EntitlementStatus** | Prisma | Feature access | 🛑 SKIP |
| **PartnerRole** | Prisma | Partner authorization | 🛑 SKIP |

---

## Drift Analysis Summary

### Type 1: ALIGNED (No Action Needed)
Enums where service layer directly imports and uses Prisma types.

**Examples**: 
- All `re_*` (real-estate) enums
- All `Hr*` (HR) enums  
- All `pos_*` (POS) enums
- All `Edu*` (Education) enums

**Count**: ~250+ enums  
**Action**: None required

---

### Type 2: SERVICE-ONLY (UI Enrichment)
Local enum definitions that exist only in service layer for UI display metadata (colors, labels, SLA values). No Prisma equivalent exists.

**Examples**:
- `VEHICLE_STATUS` (has color classes)
- `JOB_STATUS` (has order property)
- `SERVICE_REQUEST_PRIORITY` (has SLA hours)

**Count**: ~15 enums  
**Action**: Keep as service-layer types. No Prisma alignment needed.

---

### Type 3: SEMANTIC MISMATCH (Requires Mapping)
Enums where Prisma and service define different values for the same concept.

#### 3.1 CivicRequestStatus
| Prisma | Service | Semantic Match |
|--------|---------|----------------|
| `DRAFT` | - | No match |
| `SUBMITTED` | `SUBMITTED` | ✅ |
| `UNDER_REVIEW` | `UNDER_REVIEW` | ✅ |
| `PENDING_DOCUMENTS` | - | No match |
| `PENDING_PAYMENT` | - | No match |
| `PENDING_INSPECTION` | - | No match |
| `APPROVED` | - | No match |
| `REJECTED` | `REJECTED` | ✅ |
| `CANCELLED` | - | No match |
| `EXPIRED` | - | No match |
| - | `IN_PROGRESS` | Service-only |
| - | `ESCALATED` | Service-only |
| - | `RESOLVED` | Service-only |
| - | `CLOSED` | Service-only |

**Analysis**: The service layer defines a **simplified workflow** compared to Prisma's detailed status tracking. This is intentional - the config file is for a **different civic module variant**.

**Proposed Authority**: Prisma (canonical data layer)  
**Mapping Strategy**: Service values must map to Prisma values at DB write boundaries.

#### 3.2 SvmOrderStatus
| Prisma | Service | Semantic Match |
|--------|---------|----------------|
| `PENDING` | `PENDING` | ✅ |
| `CONFIRMED` | `CONFIRMED` | ✅ |
| `PROCESSING` | `PROCESSING` | ✅ |
| `SHIPPED` | `SHIPPED` | ✅ |
| `DELIVERED` | `DELIVERED` | ✅ |
| `CANCELLED` | `CANCELLED` | ✅ |
| `REFUNDED` | - | Prisma-only |
| `PARTIALLY_REFUNDED` | - | Prisma-only |
| - | `OUT_FOR_DELIVERY` | Service-only |
| - | `RETURNED` | Service-only |

**Analysis**: Service defines additional granular states not in Prisma.

**Proposed Authority**: Prisma (DB storage)  
**Mapping Strategy**: 
- `OUT_FOR_DELIVERY` → maps to `SHIPPED` (in transit)
- `RETURNED` → maps to `REFUNDED` or separate return record

---

### Type 4: VALUE MISMATCH (Case/Naming)
Enums with same semantics but different naming conventions.

| Prisma | Service | Issue |
|--------|---------|-------|
| `NORMAL` (CivicCasePriority) | `MEDIUM` (ServiceRequestPriority) | Naming mismatch |

**Action**: Create mapping function in Phase 10B.

---

## Recommended Phase 10B Scope

### ✅ Safe for Phase 10B Mapping

| Enum Category | Files Affected | Est. Casts | Risk |
|---------------|----------------|------------|------|
| Civic status/priority/category | `app/api/civic/*` | ~10 | 🟢 LOW |
| Logistics vehicle types | `app/api/logistics/*` | ~5 | 🟢 LOW |
| SVM order status | `lib/svm/*` | ~8 | 🟡 MEDIUM |
| Generic status adapters | Multiple | ~15 | 🟢 LOW |

**Total Estimated**: ~38 casts

---

### ⚠️ Requires Explicit Domain Approval

| Enum | Reason | Required Approval |
|------|--------|-------------------|
| `SvmOrderStatus` | E-commerce critical path | Product owner |
| `LogisticsDeliveryStatus` | Dispatch workflow | Operations |
| `CivicRequestStatus` | Government/civic workflows | Domain expert |

---

### 🛑 Blocked by Schema/Data Concerns

| Enum | Concern | Action |
|------|---------|--------|
| `SubscriptionStatus` | Billing system integrity | DO NOT TOUCH |
| `EntitlementStatus` | Feature flag system | DO NOT TOUCH |
| `TenantRole` | Authorization boundaries | DO NOT TOUCH |
| `ApiKeyStatus` | Security implications | DO NOT TOUCH |

---

## Proposed Enum Normalizer Architecture (Phase 10B Preview)

```
/src/lib/enums/
├── index.ts              # Re-exports all normalizers
├── civic.ts              # Civic enum normalizers
├── logistics.ts          # Logistics enum normalizers
├── svm.ts                # SVM enum normalizers
└── types.ts              # Shared types & utilities
```

Each normalizer will:
1. Accept service-layer enum value
2. Return Prisma-compatible enum value
3. Log warning for unknown values
4. Never throw (graceful degradation)

---

## Final Attestation

> **"Phase 10A was executed as a read-only audit.
> No code changes were made.
> All enum categories have been cataloged and risk-assessed.
> Critical enums (auth/billing/subscription) have been explicitly flagged for exclusion."**

---

## Next Steps

Awaiting approval to proceed with **Phase 10B (Compatibility Mapping Layer)** for:
1. Safe enum categories only
2. With explicit domain approval for medium-risk categories
3. Excluding all flagged critical enums

---

**END OF PHASE 10A AUDIT REPORT**
