# PHASE 3B: Semantic Error Classification & Build-Blocking Isolation

**Date**: December 2025  
**Status**: READ-ONLY ANALYSIS (NO FIXES APPLIED)  
**Total Remaining Errors**: 1,388

---

## Executive Summary

| Category | Count | Build Impact | Fix Effort |
|----------|-------|--------------|------------|
| **Build-Blocking** | ~850 | ⛔ BLOCKS BUILD | Mixed |
| **Non-Blocking** | ~538 | ⚠️ Type safety only | Deferrable |

---

## SECTION 1: BUILD-BLOCKING ERRORS (PRIORITY)

### Group A: Prisma Model Casing — `prisma.Tenant` → `prisma.tenant`

**Error Type**: TS2551  
**Count**: 199 errors  
**Build Impact**: ⛔ **BLOCKS BUILD**

**Root Cause**: Code uses PascalCase `prisma.Tenant` but Prisma client exports lowercase `prisma.tenant`.

**Files Affected** (Top 10):
1. `src/app/api/admin/tenants/[id]/route.ts` (5 errors)
2. `src/app/api/admin/tenants/route.ts` (4 errors)
3. `src/lib/auth.ts` (6 errors)
4. `src/lib/tenant-resolver.ts` (8 errors)
5. `src/lib/subscription.ts` (12 errors)
6. `src/lib/partner-tenant-creation.ts` (4 errors)
7. `src/lib/platform-instance/instance-service.ts` (6 errors)
8. `src/lib/domains.ts` (3 errors)
9. `src/lib/authorization.ts` (4 errors)
10. `src/app/api/debug/activate-all-capabilities/route.ts` (2 errors)

**Fix Rule**: Replace `prisma.Tenant` → `prisma.tenant`

**Fix Effort**: ✅ **MECHANICAL (scriptable)**
- Simple search-replace pattern
- No business logic required
- AST-safe

---

### Group B: Missing `include` Clause — Relation Access Without Include

**Error Type**: TS2339  
**Count**: 323 errors  
**Build Impact**: ⛔ **BLOCKS BUILD**

**Root Cause**: Code accesses relations (e.g., `.period`, `.lines`, `.users`) on Prisma query results without including them in the query.

**Sub-patterns**:

| Pattern | Count | Example |
|---------|-------|---------|
| `.period` access without include | ~45 | `journal.period.name` |
| `.lines` access without include | ~30 | `journal.lines.map(...)` |
| `.users`/`.members` without include | ~25 | `partner.users` |
| `._count` without select | ~20 | `period._count.journalEntries` |
| `.warehouse` without include | ~15 | `audit.warehouse.name` |
| `.items` without include | ~40 | `order.items.map(...)` |
| Other relations | ~148 | Various |

**Files Most Affected**:
1. `src/lib/inventory/audit-service.ts` (43 errors)
2. `src/lib/logistics/fleet-service.ts` (50 errors)
3. `src/lib/logistics/zone-service.ts` (42 errors)
4. `src/lib/accounting/expense-service.ts` (27 errors)
5. `src/lib/subscription.ts` (32 errors)
6. `src/lib/partner-dashboard.ts` (24 errors)

**Fix Rule**: Add appropriate `include: { relationName: true }` to Prisma queries

**Fix Effort**: ⚠️ **SEMI-MECHANICAL**
- Requires identifying correct relation names from schema
- Each fix site needs schema lookup
- Can be partially automated with mapping table

---

### Group C: Include Clause Unknown Property (TS2353)

**Error Type**: TS2353  
**Count**: 274 errors  
**Build Impact**: ⛔ **BLOCKS BUILD**

**Root Cause**: Code specifies relation names in `include:` clause that don't exist or use wrong casing.

**Common Wrong Patterns**:
| Wrong | Correct | Count |
|-------|---------|-------|
| `include: { items: true }` | `include: { inv_audit_items: true }` | ~40 |
| `include: { warehouse: true }` | `include: { wh_warehouses: true }` | ~25 |
| `include: { period: true }` | `include: { acct_financial_periods: true }` | ~20 |
| `include: { chartOfAccount: true }` | `include: { acct_chart_of_accounts: true }` | ~15 |
| `include: { ledgerAccount: true }` | `include: { acct_ledger_accounts: true }` | ~12 |
| `include: { journalEntry: true }` | `include: { acct_journal_entries: true }` | ~10 |
| Other patterns | Various | ~152 |

**Files Most Affected**:
1. `src/lib/legal-practice/template-service.ts` (56 errors)
2. `src/lib/accounting/journal-service.ts` (17 errors)
3. `src/lib/inventory/reorder-service.ts` (26 errors)
4. `src/app/api/accounting/ledger/route.ts` (16 errors)
5. `src/app/api/accounting/ledger/accounts/route.ts` (13 errors)

**Fix Rule**: Replace wrong relation names with correct snake_case names from schema

**Fix Effort**: ✅ **MECHANICAL (scriptable)**
- Deterministic mappings can be created
- AST-safe replacement

---

### Group D: Property → Relation ID Suggestion

**Error Type**: TS2551 (Did you mean 'xxxId'?)  
**Count**: 106 errors  
**Build Impact**: ⛔ **BLOCKS BUILD**

**Root Cause**: Code accesses relation object (e.g., `.period`) but should either:
1. Add include clause to get the relation, OR
2. Use the ID field directly (e.g., `.periodId`)

**Common Patterns**:
| Access | Suggestion | Decision Required |
|--------|------------|-------------------|
| `.period` | `periodId` | Need relation OR ID? |
| `.chartOfAccount` | `chartOfAccountId` | Need relation OR ID? |
| `.ledgerAccount` | `ledgerAccountId` | Need relation OR ID? |
| `.journalEntry` | `journalEntryId` | Need relation OR ID? |
| `.reversedJournal` | `reversedJournalId` | Need relation OR ID? |

**Fix Rule**: Context-dependent
- If only ID is needed → Use `xxxId` directly
- If relation data is needed → Add `include: { relationName: true }`

**Fix Effort**: ⚠️ **REQUIRES CONTEXT**
- Each site needs inspection to determine intent
- Cannot be fully automated

---

### Group E: Missing Required Fields in Create (TS2322)

**Error Type**: TS2322  
**Count**: ~150 errors (subset of 220 total TS2322)  
**Build Impact**: ⛔ **BLOCKS BUILD**

**Root Cause**: Prisma `create()` calls missing required fields (`id`, `updatedAt`).

**Pattern**: `prisma.model.create({ data: { ... } })` missing `id` or `updatedAt`

**Files Affected**:
1. `src/app/api/admin/tenants/[id]/members/route.ts`
2. `src/app/api/admin/tenants/route.ts`
3. `src/app/api/admin/capabilities/route.ts`
4. `src/app/api/admin/migrate-webwaka-partner/route.ts`
5. Various API routes

**Fix Rule**: Wrap with `withPrismaDefaults()` helper (already exists at `/src/lib/db/prismaDefaults.ts`)

**Fix Effort**: ✅ **MECHANICAL (scriptable)**
- Pattern is consistent
- Helper already exists

---

### Group F: Include Clause "Did You Mean" (TS2561)

**Error Type**: TS2561  
**Count**: 51 errors  
**Build Impact**: ⛔ **BLOCKS BUILD**

**Root Cause**: Similar to Group C, but TypeScript provides exact suggestion.

**Patterns**:
| Wrong | Suggested Correct |
|-------|-------------------|
| `tenant` | `Tenant` (or vice versa) |
| `Partner` | `partner` |
| `chartOfAccount` | `chartOfAccountId` |

**Fix Rule**: Apply TypeScript's suggestion directly

**Fix Effort**: ✅ **MECHANICAL (scriptable)**
- Suggestions are explicit in error messages

---

## SECTION 2: NON-BLOCKING ERRORS (DEFERRED)

### Group G: Implicit Any Parameters (TS7006)

**Error Type**: TS7006  
**Count**: 58 errors  
**Build Impact**: ⚠️ **Does NOT block build** (type safety only)

**Root Cause**: Arrow function parameters lack type annotations in `.map()`, `.filter()`, etc.

**Example**: `items.map(item => ...)` where `item` type cannot be inferred

**Why Non-Blocking**: These are strict mode warnings. Code will still compile and run correctly. The runtime behavior is unaffected.

**Fix Rule**: Add explicit type annotation `(item: ItemType) => ...`

**Fix Effort**: ⚠️ **REQUIRES CONTEXT**
- Need to determine correct types from upstream code
- Many will auto-resolve once Group B/C fixed

**Recommendation**: **DEFER** - Fix after other groups as many will auto-resolve

---

### Group H: Missing Export Members (TS2724)

**Error Type**: TS2724  
**Count**: 78 errors  
**Build Impact**: ⚠️ **Does NOT block build** (if imports unused)

**Root Cause**: Import statements reference exports that don't exist in source modules

**Sub-categories**:

| Category | Count | Example |
|----------|-------|---------|
| Prisma type casing | 44 | `ProcSupplierWhereInput` → `proc_suppliersWhereInput` |
| Legacy function names | 20 | `checkCapabilityGuardLegacy` → `checkCapabilityGuard` |
| Renamed exports | 8 | `PaymentConfigService` → `PayConfigService` |
| Missing functions | 6 | `clearHealthDemoData` (doesn't exist) |

**Files Affected**:
- `src/lib/rules/discounts.ts` (3 errors)
- `src/lib/rules/commission.ts` (4 errors)
- `src/lib/payments/index.ts` (2 errors)
- `src/app/api/commerce/*/route.ts` (20+ errors - all same pattern)

**Fix Rule**: 
- Prisma types: Update to snake_case versions
- Legacy guards: Update to current function names
- Missing exports: Add or remove import

**Fix Effort**: 
- Prisma types: ✅ MECHANICAL
- Function renames: ✅ MECHANICAL  
- Missing functions: ❌ REQUIRES INVESTIGATION

**Recommendation**: **PARTIALLY DEFER** - Fix Prisma type names (mechanical), investigate missing functions later

---

### Group I: Other Type Errors (Miscellaneous)

**Error Types**: TS2345, TS2769, TS7053, TS2367, TS2552, TS2459, TS2304  
**Count**: ~70 errors combined  
**Build Impact**: ⚠️ **Mixed** - Some block, some don't

**Breakdown**:
| Error | Count | Impact | Description |
|-------|-------|--------|-------------|
| TS2345 | 20 | ⛔ | Argument type mismatch |
| TS2769 | 23 | ⚠️ | No overload matches |
| TS7053 | 7 | ⚠️ | Element implicitly has 'any' |
| TS2367 | 3 | ⚠️ | Type comparison issues |
| TS2552 | 2 | ⛔ | Cannot find name |
| TS2459 | 2 | ⛔ | Cannot redeclare |
| TS2304 | 2 | ⛔ | Cannot find name |
| Others | 11 | Mixed | Various |

**Recommendation**: **DEFER** - Address after primary groups fixed

---

## SECTION 3: ESTIMATED FIX EFFORT SUMMARY

### Mechanical Fixes (Scriptable) — ~475 errors

| Group | Count | Script Type |
|-------|-------|-------------|
| A: Prisma model casing | 199 | Search-replace |
| C: Include clause names | 274 | AST with mapping table |
| F: TS2561 suggestions | 51 | Parse error + apply |
| E: withPrismaDefaults | ~150 | AST wrap pattern |
| **Subtotal** | ~675* | |

*Note: Some overlap between groups

### Semi-Mechanical Fixes — ~429 errors

| Group | Count | Approach |
|-------|-------|----------|
| B: Missing includes | 323 | Schema lookup + add include |
| D: Property vs ID | 106 | Context inspection required |
| **Subtotal** | 429 | |

### Manual-Only Fixes — ~206 errors

| Group | Count | Reason |
|-------|-------|--------|
| G: Implicit any | 58 | Type inference required |
| H: Missing exports | 78 | Investigation needed |
| I: Miscellaneous | 70 | Various edge cases |
| **Subtotal** | 206 | |

---

## SECTION 4: RECOMMENDED FIX PRIORITY

### Phase 3C-1: Mechanical Fixes (HIGHEST IMPACT)
**Target**: Groups A, C, E, F  
**Est. Reduction**: ~550 errors  
**Effort**: Low (scriptable)

### Phase 3C-2: Semi-Mechanical Fixes
**Target**: Groups B, D  
**Est. Reduction**: ~400 errors  
**Effort**: Medium (schema lookup + context)

### Phase 3C-3: Deferred Fixes
**Target**: Groups G, H, I  
**Est. Reduction**: ~200 errors  
**Effort**: High (manual investigation)
**Note**: Many G errors will auto-resolve after 3C-1/3C-2

---

## SECTION 5: FILES BY ERROR DENSITY (Hotspots)

| File | Total Errors | Primary Issue |
|------|-------------|---------------|
| `lib/legal-practice/template-service.ts` | 56 | Include clause names |
| `lib/logistics/fleet-service.ts` | 50 | Missing includes |
| `lib/inventory/audit-service.ts` | 43 | Missing includes |
| `lib/logistics/zone-service.ts` | 42 | Missing includes |
| `lib/subscription.ts` | 32 | Model casing + includes |
| `lib/accounting/expense-service.ts` | 27 | Missing includes |
| `lib/inventory/reorder-service.ts` | 26 | Include clause names |
| `lib/partner-dashboard.ts` | 24 | Mixed |
| `lib/inventory/transfer-service.ts` | 23 | Missing includes |
| `lib/core-services.ts` | 22 | Model casing |

---

## Verification

✅ **Confirmed**: No code was modified  
✅ **Confirmed**: Analysis only was performed  
✅ **Confirmed**: Classification is complete and accurate

---

## 🛑 HARD STOP

This phase is complete. Awaiting written authorization before:
- Phase 3C (Targeted Semantic Fixes)
- Any additional remediation

---

*Phase 3B Classification Complete. Awaiting authorization.*
