# SUITE ERROR MATRIX

**Date**: December 2025  
**Status**: READ-ONLY AUDIT  
**Total TypeScript Errors**: 1,533

---

## Executive Summary

| Category | Suites | Errors | % of Total |
|----------|--------|--------|------------|
| **BLOCKING** | 18 | 1,533 | 100% |
| **CLEAN** | 0 | 0 | 0% |

**No suite is currently clean.** All suites have at least 1 error.

---

## Suite Error Matrix

| Suite | Error Count | Blocking | Top Error Source | Primary Issue |
|-------|-------------|----------|------------------|---------------|
| **Core/Platform** | 232 | YES | `partner-dashboard.ts` (38) | Include/relation mismatches |
| **Inventory** | 170 | YES | `audit-service.ts` (57) | Include clause errors |
| **Accounting** | 141 | YES | `expense-service.ts` (32) | Missing create fields |
| **Logistics** | 130 | YES | `fleet-service.ts` (50) | Include/relation errors |
| **Commerce/SVM** | 110 | YES | `commerce-wallet-service.ts` (14) | Model name mismatches |
| **Legal Practice** | 84 | YES | `template-service.ts` (56) | Include clause errors |
| **Procurement** | 63 | YES | Multiple files | Include/relation errors |
| **Billing** | 57 | YES | Multiple files | Type assignment |
| **Integrations** | 54 | YES | Multiple files | Include clause errors |
| **Marketing** | 38 | YES | Multiple files | Include clause errors |
| **CRM** | 35 | YES | Multiple files | Model name mismatches |
| **HR** | 34 | YES | Multiple files | Include clause errors |
| **Political** | 31 | YES | Multiple files | Include clause errors |
| **Payments** | 31 | YES | `config-service.ts` (6) | Type mismatches |
| **Analytics** | 30 | YES | Multiple files | Model name mismatches |
| **B2B** | 29 | YES | Multiple files | Include clause errors |
| **Health/Medical** | 28 | YES | Multiple files | Include clause errors |
| **Warehouse** | 17 | YES | Multiple files | Include clause errors |
| **Rules Engine** | 16 | YES | `commission.ts` (8) | Missing exports |
| **POS** | 15 | YES | Multiple files | Type mismatches |
| **Sites/Funnels** | 15 | YES | `domain-service.ts` (10) | Include clause errors |
| **Developer/API** | 10 | YES | Multiple files | Type mismatches |
| **AI/Recommendations** | 8 | YES | Multiple files | Include clause errors |
| **Education** | 7 | YES | Multiple files | Type mismatches |
| **Automation** | 3 | YES | Multiple files | Include clause errors |
| **Project Management** | 1 | YES | Single file | Type mismatch |

---

## Detailed Breakdown by Suite

### CORE/PLATFORM (232 errors) — CRITICAL

**Files Affected**:
| File | Errors |
|------|--------|
| `partner-dashboard.ts` | 38 |
| `subscription.ts` | 31 |
| `core-services.ts` | 23 |
| `partner-tenant-creation.ts` | 12 |
| `partner-attribution.ts` | 10 |
| `partner-first/client-service.ts` | 10 |
| `auth/signup-service.ts` | 8 |
| Others | 100 |

**Primary Issues**:
- Include relation mismatches
- Missing tenant/partner includes
- Type assignment errors

**Governance Note**: Core platform cannot be gated - must be fixed.

---

### INVENTORY (170 errors)

**Files Affected**:
| File | Errors |
|------|--------|
| `audit-service.ts` | 57 |
| `transfer-service.ts` | 41 |
| `reorder-service.ts` | 28 |
| `offline-sync-service.ts` | 21 |
| `warehouse-service.ts` | 17 |
| Others | 6 |

**Primary Issues**:
- Include clause unknown properties
- Property access mismatches
- Missing relation includes

**Gateable**: YES

---

### ACCOUNTING (141 errors)

**Files Affected**:
| File | Errors |
|------|--------|
| `expense-service.ts` | 32 |
| `journal-service.ts` | 17 |
| `api/accounting/ledger/route.ts` | 16 |
| `reports-service.ts` | 15 |
| `tax-service.ts` | 14 |
| Others | 47 |

**Primary Issues**:
- Missing `id, updatedAt` in create calls
- Include clause relation names
- Property access after query

**Gateable**: YES

---

### LOGISTICS (130 errors)

**Files Affected**:
| File | Errors |
|------|--------|
| `fleet-service.ts` | 50 |
| `zone-service.ts` | 42 |
| `assignment-service.ts` | 14 |
| `job-service.ts` | 8 |
| Others | 16 |

**Primary Issues**:
- Include clause errors
- Relation name mismatches
- Missing includes

**Gateable**: YES

---

### COMMERCE/SVM (110 errors)

**Files Affected**:
| File | Errors |
|------|--------|
| `commerce-wallet-service.ts` | 14 |
| `api/svm/cart/route.ts` | 13 |
| `shipping-storage.ts` | 12 |
| `api/svm/orders/route.ts` | 10 |
| `promotions-storage.ts` | 7 |
| Others | 54 |

**Primary Issues**:
- Model name mismatches
- Include clause errors
- Type assignment

**Gateable**: PARTIAL (Core commerce may be needed)

---

### LEGAL PRACTICE (84 errors)

**Files Affected**:
| File | Errors |
|------|--------|
| `template-service.ts` | 56 |
| Others | 28 |

**Primary Issues**:
- Include clause errors concentrated in one file
- Template category relation issues

**Gateable**: YES

---

## Error Type Distribution (All Suites)

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2353 | 386 | Include clause unknown property |
| TS2339 | 354 | Property does not exist |
| TS2551 | 256 | "Did you mean" property suggestion |
| TS2322 | 226 | Type assignment errors |
| TS7006 | 123 | Implicit any |
| TS2724 | 78 | Missing export members |
| TS2561 | 52 | Include "Did you mean" |
| Others | 58 | Various |

---

## Governance Gating Recommendations

### CANNOT BE GATED (Core Dependencies)

| Suite | Reason |
|-------|--------|
| Core/Platform | Auth, Tenant, Partner - platform foundation |
| Subscription | Billing dependency |

### RECOMMENDED FOR GATING (High Error, Low Impact)

| Suite | Errors | Rationale |
|-------|--------|-----------|
| Inventory | 170 | Self-contained warehouse ops |
| Logistics | 130 | Delivery operations only |
| Legal Practice | 84 | Specialized vertical |
| Procurement | 63 | Supply chain only |
| Political | 31 | Niche vertical |
| Health/Medical | 28 | Specialized vertical |

### EVALUATE FOR GATING (Medium Priority)

| Suite | Errors | Consideration |
|-------|--------|---------------|
| Accounting | 141 | May have billing dependencies |
| Commerce/SVM | 110 | Core commerce - needs analysis |
| Marketing | 38 | CRM integration |
| CRM | 35 | Customer data |
| HR | 34 | Employee management |

### LOW PRIORITY (Few Errors)

| Suite | Errors | Action |
|-------|--------|--------|
| Project Management | 1 | Quick fix possible |
| Automation | 3 | Quick fix possible |
| Education | 7 | Already partially gated |
| AI/Recommendations | 8 | Quick fix possible |

---

## 🛑 HARD STOP

This audit is complete. Awaiting authorization before:
- Phase 2: Governance Suite Gating
- Any code modifications

---

*Suite Error Matrix Complete. Awaiting authorization.*
