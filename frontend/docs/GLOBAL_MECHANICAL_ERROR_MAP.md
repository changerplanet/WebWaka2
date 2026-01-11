# GLOBAL MECHANICAL ERROR MAP

**Generated**: December 2025  
**Phase**: A — Read-Only Discovery  
**Total Errors**: 98  
**Total Files**: 17  

---

## Directory Error Summary

| Directory | Files | Errors | Classification | Safe for Batch? |
|-----------|-------|--------|----------------|-----------------|
| `src/lib/phase-4b/**` | 5 | 26 | ✅ MECHANICAL | YES |
| `src/lib/platform-instance/**` | 2 | 15 | ✅ MECHANICAL | YES |
| `src/lib/pos/**` | 3 | 8 | ⚠️ NEEDS SCHEMA CHECK | CONDITIONAL |
| `src/lib/promotions-storage.ts` | 1 | 7 | ✅ MECHANICAL | YES |
| `src/lib/rules/**` | 2 | 5 | ⚠️ SEMANTIC | NO |
| `src/lib/shipping-storage.ts` | 1 | 12 | ⚠️ NEEDS SCHEMA CHECK | CONDITIONAL |
| `src/lib/sites-funnels/**` | 3 | 25 | ⚠️ MIXED | PARTIAL |

---

## Detailed Error Classification

### 1. `src/lib/phase-4b/**` — ✅ MECHANICAL ONLY

| File | Errors | Pattern |
|------|--------|---------|
| `client-lifecycle.ts` | 4 | Relation casing (`Tenant`→`tenant`, `platformInstance`→`PlatformInstance`) |
| `expansion-signals.ts` | 11 | Relation casing, missing includes, property access after include fix |
| `partner-dashboard.ts` | 6 | Relation casing (`platformInstance`→`PlatformInstance`, `Tenant`→`tenant`) |
| `partner-packages.ts` | 1 | Missing `withPrismaDefaults()` (missing `updatedAt`) |
| `partner-staff.ts` | 4 | Missing `withPrismaDefaults()`, relation casing |

**Verdict**: ✅ Safe for batch remediation

---

### 2. `src/lib/platform-instance/**` — ✅ MECHANICAL ONLY

| File | Errors | Pattern |
|------|--------|---------|
| `default-instance.ts` | 1 | Missing `withPrismaDefaults()` (missing `id`, `updatedAt`) |
| `instance-service.ts` | 14 | Relation casing (`Tenant`→`tenant`), missing `withPrismaDefaults()`, type annotations |

**Verdict**: ✅ Safe for batch remediation

---

### 3. `src/lib/pos/**` — ⚠️ NEEDS SCHEMA CHECK

| File | Errors | Pattern |
|------|--------|---------|
| `report-service.ts` | 1 | Non-existent relation `inv_audit_items` on `pos_sale` |
| `sale-service.ts` | 6 | Non-existent relation `inv_audit_items` on `pos_sale` |
| `shift-service.ts` | 1 | Non-existent relation `inv_audit_items` on `pos_sale` |

**Analysis**: The relation `inv_audit_items` does not exist in the `pos_sale` model. This could be:
- A missing relation in schema (SEMANTIC)
- An incorrect relation name that needs removal (MECHANICAL)

**Action Required**: Verify if relation should exist in schema. If not, remove the include.

**Verdict**: ⚠️ Conditional — needs schema verification before fix

---

### 4. `src/lib/promotions-storage.ts` — ✅ MECHANICAL ONLY

| Errors | Pattern |
|--------|---------|
| 7 | Missing `withPrismaDefaults()` (missing `id`, `updatedAt`) |

**Verdict**: ✅ Safe for batch remediation

---

### 5. `src/lib/rules/**` — ⚠️ SEMANTIC ISSUES

| File | Errors | Pattern |
|------|--------|---------|
| `commission.ts` | 2 | Missing type definitions (`CommissionCalculationInput`, `CommissionCalculationResult`) |
| `promotions.ts` | 3 | Missing type definitions (`Promotion`, `AppliedPromotion`), wrong argument count |

**Analysis**: These are missing type imports or definitions. The types may need to be:
- Imported from another module
- Defined locally
- Using different names (`_Promotion` exists, `Promotion` does not)

**Verdict**: ⚠️ SEMANTIC — requires understanding of intended type source

---

### 6. `src/lib/shipping-storage.ts` — ⚠️ NEEDS SCHEMA CHECK

| Errors | Pattern |
|--------|---------|
| 11 | Non-existent relation `rates` on `svm_shipping_zones` |
| 1 | Missing `withPrismaDefaults()` |

**Analysis**: The relation `rates` does not exist in the `svm_shipping_zones` model. This could be:
- A missing relation in schema (SEMANTIC)
- An incorrect relation name (MECHANICAL)

**Action Required**: Verify if relation should exist. If the relation is `svm_shipping_rates`, fix mechanically.

**Verdict**: ⚠️ Conditional — needs schema verification before fix

---

### 7. `src/lib/sites-funnels/**` — ⚠️ MIXED

| File | Errors | Pattern | Classification |
|------|--------|---------|----------------|
| `domain-service.ts` | 10 | Non-existent relation `branding` on Tenant/PlatformInstance | NEEDS SCHEMA CHECK |
| `permissions-service.ts` | 4 | Non-existent `status` field, enum value mismatch (`OWNER`, `ADMIN` not in `TenantRole`) | ⚠️ SEMANTIC |
| `template-service.ts` | 11 | Non-existent relation `ProductCategory`, property access `category` | NEEDS SCHEMA CHECK |

**Analysis**:
- `domain-service.ts`: The `branding` relation doesn't exist. Need to determine correct source for branding data.
- `permissions-service.ts`: The `TenantRole` enum doesn't include `OWNER` or `ADMIN`. This is a **semantic decision** about role naming.
- `template-service.ts`: The `ProductCategory` relation doesn't exist on `sf_templates`. Need to find correct relation name.

**Verdict**: ⚠️ MIXED — some mechanical, some semantic

---

## Summary by Classification

| Classification | Directories | Files | Errors |
|----------------|-------------|-------|--------|
| ✅ MECHANICAL (Safe) | 3 | 9 | 48 |
| ⚠️ NEEDS SCHEMA CHECK | 3 | 6 | 34 |
| ⚠️ SEMANTIC (Stop Required) | 2 | 3 | 16 |

---

## Batch Remediation Recommendation

### Phase B-1: Safe Mechanical Fixes (No Stops)
- `src/lib/phase-4b/**` — 26 errors
- `src/lib/platform-instance/**` — 15 errors  
- `src/lib/promotions-storage.ts` — 7 errors

**Total**: 48 errors across 9 files

### Phase B-2: Conditional Fixes (Schema Check Required)
- `src/lib/pos/**` — Remove `inv_audit_items` include if not in schema
- `src/lib/shipping-storage.ts` — Fix `rates` relation name or remove
- `src/lib/sites-funnels/domain-service.ts` — Remove `branding` or find correct source
- `src/lib/sites-funnels/template-service.ts` — Fix `ProductCategory` relation

### Phase B-3: Semantic Decisions Required
- `src/lib/rules/**` — Type definition decisions
- `src/lib/sites-funnels/permissions-service.ts` — Role enum value decisions

---

## 🛑 PHASE A COMPLETE — AWAITING APPROVAL FOR PHASE B

Report location: `/app/frontend/docs/GLOBAL_MECHANICAL_ERROR_MAP.md`
