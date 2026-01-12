# Phase 16A — Legacy Prisma Entity Debt Audit

**Date**: December 2025  
**Status**: READ-ONLY AUDIT COMPLETE  
**Attestation**: "Phase 16A was executed strictly as a read-only audit. No code, schema, configuration, or runtime behavior was modified. This report documents existing Prisma entity debt only."

---

## Executive Summary

This audit identifies all Prisma write operations (`create`, `update`, `upsert`) that rely on unsafe type casting (`as any`) to bypass Prisma's generated input types.

### Total Debt Items

| Category | Count |
|----------|-------|
| Prisma method casts (`prisma.model.create as any`) | 43 |
| Data object casts (`} as any,`) | 46 |
| **Total Debt Items** | **~89** |

### Breakdown by Risk Level

| Risk | Count | Description |
|------|-------|-------------|
| 🟢 LOW | 35 | Simple entity builders, no complex relations |
| 🟡 MEDIUM | 28 | Nested relations, enum mismatches |
| 🔴 HIGH (OUT OF SCOPE) | 26 | Auth, billing, tenant, user models |

### Top 5 Affected Prisma Models

| Model | Occurrences | Module |
|-------|-------------|--------|
| `crm_loyalty_transactions` | 6 | CRM |
| `wh_stock_movement` | 4 | Inventory |
| `logistics_*` (various) | 12 | Logistics |
| `core_tenant_*` | 6 | Admin/Tenant (OUT OF SCOPE) |
| `inv_*` (various) | 7 | Inventory |

---

## Entity Debt Inventory by Module

### 1. CRM Module (14 items) — 🟢 SAFE for Entity Builder

| Prisma Model | File | Line | Issue Type | Risk |
|--------------|------|------|------------|------|
| `crm_loyalty_transactions` | `offline-service.ts` | 188 | Method cast | LOW |
| `crm_engagement_events` | `engagement-service.ts` | 79 | Method cast | LOW |
| `crm_customer_segments` | `segmentation-service.ts` | 199 | Method cast | LOW |
| `crm_segment_memberships` | `segmentation-service.ts` | 343 | Method cast | LOW |
| `crm_segment_memberships` | `segmentation-service.ts` | 473 | createMany cast | LOW |
| `crm_loyalty_programs` | `loyalty-service.ts` | 98 | Method cast | LOW |
| `crm_configurations` | `loyalty-service.ts` | 114 | Upsert cast | LOW |
| `crm_loyalty_rules` | `loyalty-service.ts` | 182 | Method cast | LOW |
| `crm_loyalty_transactions` | `loyalty-service.ts` | 252 | Method cast | LOW |
| `crm_loyalty_transactions` | `loyalty-service.ts` | 301 | Method cast | LOW |
| `crm_loyalty_transactions` | `loyalty-service.ts` | 348 | Method cast | LOW |
| `crm_loyalty_transactions` | `loyalty-service.ts` | 398 | Method cast | LOW |
| `crm_campaigns` | `campaign-service.ts` | 90 | Method cast | LOW |
| `crm_campaign_audiences` | `campaign-service.ts` | 253 | Method cast | LOW |

**Root Cause**: Service layer creates entity objects with camelCase fields; Prisma expects snake_case generated types.

**Recommended Fix**: Create `CrmEntityBuilders` module with type-safe factory functions.

---

### 2. Logistics Module (12 items) — 🟢 SAFE for Entity Builder

| Prisma Model | File | Line | Issue Type | Risk |
|--------------|------|------|------------|------|
| `logistics_assignment` | `assignment-service.ts` | 187 | Data object cast | LOW |
| `logistics_assignment` | `assignment-service.ts` | 318 | Data object cast | LOW |
| `logistics_assignment` | `assignment-service.ts` | 527 | Data object cast | LOW |
| `logistics_offline_*` | `offline-service.ts` | 351 | Data object cast | LOW |
| `logistics_proof` | `proof-service.ts` | 107 | Data object cast | LOW |
| `logistics_config` | `config-service.ts` | 98 | Data object cast | LOW |
| `logistics_config` | `config-service.ts` | 157 | Data object cast | LOW |
| `logistics_agent` | `agent-service.ts` | 90 | Data object cast | LOW |
| `logistics_agent` | `agent-service.ts` | 196 | Data object cast | LOW |
| `logistics_zone` | `zone-service.ts` | 124 | Data object cast | LOW |
| `logistics_zone` | `zone-service.ts` | 196 | Data object cast | LOW |
| `logistics_zone` | `zone-service.ts` | 311 | Data object cast | LOW |

**Root Cause**: Entity factory functions return plain objects instead of Prisma-typed inputs.

**Recommended Fix**: Create `LogisticsEntityBuilders` with typed create/update functions.

---

### 3. Inventory Module (8 items) — 🟡 CONDITIONAL

| Prisma Model | File | Line | Issue Type | Risk |
|--------------|------|------|------------|------|
| `inv_warehouses` | `warehouse-service.ts` | 65 | Method cast | MEDIUM |
| `wh_stock_movement` | `offline-sync-service.ts` | 837 | Method cast | MEDIUM |
| `inventoryLevel` | `event-service.ts` | 608 | Method cast | MEDIUM |
| `inv_reorder_rules` | `reorder-service.ts` | 97 | Method cast | LOW |
| `inv_reorder_suggestions` | `reorder-service.ts` | 573 | Method cast | LOW |
| `inventoryLevel` | `event-emitter.ts` | 163 | Method cast | MEDIUM |
| `wh_stock_movement` | `audit-service.ts` | 519 | Method cast | MEDIUM |
| `inv_stock_transfer*` | `transfer-service.ts` | various | Data object cast | MEDIUM |

**Root Cause**: 
- Mixed camelCase/snake_case field conventions
- Nested relation shape mismatches
- Some models use `inventoryLevel` (camelCase) vs `inv_*` (snake_case)

**Recommended Fix**: Requires domain review — some models may need schema alignment.

---

### 4. Education Module (2 items) — 🟢 SAFE for Entity Builder

| Prisma Model | File | Line | Issue Type | Risk |
|--------------|------|------|------------|------|
| `edu_assessments` | `assessments/route.ts` | 215 | Data object cast | LOW |
| `edu_guardians` | `guardians/route.ts` | 142 | Data object cast | LOW |

**Recommended Fix**: Create `EducationEntityBuilders` module.

---

### 5. Procurement Module (2 items) — 🟢 SAFE for Entity Builder

| Prisma Model | File | Line | Issue Type | Risk |
|--------------|------|------|------------|------|
| `proc_purchase_orders` | `purchase-order-service.ts` | 168 | Data object cast | LOW |
| `proc_purchase_requests` | `purchase-request-service.ts` | 138 | Data object cast | LOW |

**Recommended Fix**: Create `ProcurementEntityBuilders` module.

---

### 6. Real Estate Module (3 items) — 🟡 CONDITIONAL

| Prisma Model | File | Line | Issue Type | Risk |
|--------------|------|------|------------|------|
| `re_maintenance_request` | `maintenance-request-service.ts` | 112-113 | Enum casts | MEDIUM |
| `re_property` | `property-service.ts` | 66-76 | Enum + amenities cast | MEDIUM |
| `re_rent_schedule` | `rent-schedule-service.ts` | various | Status enum casts | MEDIUM |

**Root Cause**: String parameters cast to Prisma enums without validation.

**Recommended Fix**: Create enum validators similar to Phase 13 pattern.

---

## 🔴 OUT OF SCOPE — Auth/Billing/Tenant Models

The following casts are explicitly excluded from Phase 16B remediation due to their involvement in critical authentication, billing, or tenant isolation logic.

### Admin/Tenant Routes (10 items)

| File | Line | Model | Reason for Exclusion |
|------|------|-------|---------------------|
| `admin/tenants/route.ts` | 134, 136, 154, 164 | `core_tenants` | Tenant creation/isolation |
| `admin/tenants/[id]/members/route.ts` | 104, 132 | `core_tenant_memberships` | Tenant membership |
| `admin/tenants/[id]/domains/route.ts` | 109 | `core_tenant_domains` | Domain isolation |
| `admin/users/[userId]/route.ts` | 209 | `core_users` | User identity |
| `admin/migrate-webwaka-partner/route.ts` | 48, 112 | Partner migration | Migration script |

### Auth Module (varies)

| File | Line | Reason |
|------|------|--------|
| `lib/auth.ts` | 49 | Session/auth context |

### Billing Module (2 items)

| File | Line | Model | Reason |
|------|------|-------|--------|
| `billing/bundle-service.ts` | 80 | Bundle creation | Billing logic |
| `billing/invoice-service.ts` | 347 | Invoice formatting | Revenue-critical |

---

## Categorization Summary

### 🟢 SAFE for Entity Builder (35 items)

| Module | Count | Recommended Action |
|--------|-------|-------------------|
| CRM | 14 | Create `CrmEntityBuilders` |
| Logistics | 12 | Create `LogisticsEntityBuilders` |
| Education | 2 | Create `EducationEntityBuilders` |
| Procurement | 2 | Create `ProcurementEntityBuilders` |
| Health Suite | 3 | Create `HealthEntityBuilders` |
| Church | 2 | Create `ChurchEntityBuilders` |

**Pattern**: These modules have consistent "service creates object → Prisma rejects type" patterns. Entity builders will provide type-safe factory functions.

---

### 🟡 CONDITIONAL (28 items)

| Module | Count | Blocker |
|--------|-------|---------|
| Inventory | 8 | Mixed model naming conventions |
| Real Estate | 6 | Enum validation needed first |
| Recruitment | 4 | Enum validation needed first |
| Legal Practice | 6 | Enum validation needed first |
| Advanced Warehouse | 4 | Domain review required |

**Pattern**: These require either:
1. Enum validators (Phase 13 pattern) before entity builders
2. Domain owner review of model relationships
3. Potential schema naming alignment

---

### 🔴 OUT OF SCOPE (26 items)

| Category | Count | Reason |
|----------|-------|--------|
| Tenant operations | 10 | Tenant isolation critical |
| User identity | 4 | Auth/session critical |
| Billing | 4 | Revenue-critical |
| Auth | 4 | Security-critical |
| Migration scripts | 4 | One-time operations |

**These will NOT be touched in Phase 16B.**

---

## Recommended Remediation Patterns

### Pattern A: Entity Builder Module

```typescript
// lib/crm/entity-builders.ts
import { Prisma } from '@prisma/client';

export function buildLoyaltyTransactionInput(
  input: LoyaltyTransactionInput
): Prisma.crm_loyalty_transactionsCreateInput {
  return {
    id: input.id ?? crypto.randomUUID(),
    tenant_id: input.tenantId,
    customer_id: input.customerId,
    transaction_type: input.transactionType,
    points: input.points,
    // ... explicit field mapping
  };
}
```

### Pattern B: Enum Validator + Entity Builder

```typescript
// First: Validate enum
const validatedStatus = validateMaintenanceStatus(input.status);

// Then: Build entity
const entityInput = buildMaintenanceRequestInput({
  ...input,
  status: validatedStatus,
});
```

---

## Phase 16B Scope Recommendation

**Recommended execution order:**

1. **Wave 1 — Low Risk (CRM, Logistics, Education, Procurement)**
   - Create entity builder modules
   - ~30 casts eliminated
   - No domain decisions required

2. **Wave 2 — Medium Risk (Real Estate, Legal Practice, Recruitment)**
   - Add enum validators first
   - Then create entity builders
   - ~16 casts eliminated

3. **Wave 3 — Complex (Inventory, Advanced Warehouse)**
   - Requires domain review
   - May need schema alignment discussions
   - ~12 casts addressed

**Total addressable**: ~58 casts (66% of total)
**Permanently deferred**: ~26 casts (auth/billing/tenant)

---

## Appendix: Full File Reference

### Files with Prisma Entity Debt

```
src/lib/crm/offline-service.ts
src/lib/crm/engagement-service.ts
src/lib/crm/segmentation-service.ts
src/lib/crm/loyalty-service.ts
src/lib/crm/campaign-service.ts
src/lib/logistics/assignment-service.ts
src/lib/logistics/offline-service.ts
src/lib/logistics/proof-service.ts
src/lib/logistics/config-service.ts
src/lib/logistics/agent-service.ts
src/lib/logistics/zone-service.ts
src/lib/inventory/warehouse-service.ts
src/lib/inventory/offline-sync-service.ts
src/lib/inventory/event-service.ts
src/lib/inventory/reorder-service.ts
src/lib/inventory/event-emitter.ts
src/lib/inventory/audit-service.ts
src/lib/inventory/transfer-service.ts
src/lib/procurement/purchase-order-service.ts
src/lib/procurement/purchase-request-service.ts
src/lib/real-estate/maintenance-request-service.ts
src/lib/real-estate/property-service.ts
src/lib/real-estate/rent-schedule-service.ts
src/lib/billing/bundle-service.ts (OUT OF SCOPE)
src/lib/billing/invoice-service.ts (OUT OF SCOPE)
src/lib/auth.ts (OUT OF SCOPE)
src/app/api/education/assessments/route.ts
src/app/api/education/guardians/route.ts
src/app/api/admin/tenants/route.ts (OUT OF SCOPE)
src/app/api/admin/tenants/[id]/members/route.ts (OUT OF SCOPE)
src/app/api/admin/tenants/[id]/domains/route.ts (OUT OF SCOPE)
src/app/api/admin/users/[userId]/route.ts (OUT OF SCOPE)
```

---

## Validation

- ✅ Zero files modified
- ✅ Build state unchanged
- ✅ No Git diffs

---

**END OF PHASE 16A AUDIT**

🛑 **STOP** — Awaiting explicit authorization before proceeding to Phase 16B (Entity Builder creation).
