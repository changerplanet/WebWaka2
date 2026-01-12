# Deployable SaaS Platform - PRD

## Original Problem Statement
Fix failing production build (`yarn build`) for Next.js application to unblock Vercel deployment. Build was failing due to TypeScript type errors caused by Prisma schema mismatches and Next.js dynamic route configuration issues.

## Current Status: ✅ BUILD SUCCESSFUL
- **TypeScript Compilation**: ✅ PASSING
- **Static Generation**: ✅ PASSING  
- **Build Exit Code**: 0
- **Build Time**: ~101 seconds

---

## What's Been Implemented (December 2025)

### Phase A - TypeScript/Prisma Mechanical Fixes (COMPLETE)
All TypeScript/Prisma mismatch errors resolved:

1. **POS Module** (`src/lib/pos/**`)
   - Fixed `inv_audit_items` → `items` relation

2. **Rules Module** (`src/lib/rules/**`)
   - Fixed type re-export syntax in `commission.ts` and `promotions.ts`
   - Changed `_getPromotions(tenantId, {isActive: true})` → `_getActivePromotions(tenantId)`

3. **Shipping Storage** (`src/lib/shipping-storage.ts`)
   - Fixed `rates` → `svm_shipping_rates` relation
   - Added `withPrismaDefaults` for `id` and `updatedAt` fields

4. **Sites-Funnels Module** (`src/lib/sites-funnels/**`)
   - Removed non-existent `branding` relation
   - Fixed `status: 'ACTIVE'` → `isActive: true` in TenantMembership
   - Fixed role enum mismatch
   - Fixed `ProductCategory` → `category` relation

### Phase B - Next.js Dynamic Route Fixes (COMPLETE)
Added `export const dynamic = 'force-dynamic'` to 485 API routes.

### Phase 3 - React Hook Hygiene (COMPLETE)
- Fixed 8 mechanical React Hook warnings
- Baselined 52 semantic warnings (require domain expert review)
- Report: `/app/frontend/docs/PHASE_3_REACT_HOOK_HYGIENE_REPORT.md`

### Phase 4 - Legacy Debt Audit (COMPLETE)
- Full read-only audit of remaining technical debt
- Report: `/app/frontend/docs/PHASE_4_LEGACY_DEBT_MAP.md`

### Phase 5 - Mechanical Type Cleanup (COMPLETE)
- Created `toJsonValue` utility for JSON writes
- Eliminated all 7 unsafe `as unknown as Prisma.InputJsonValue` casts
- Report: `/app/frontend/docs/PHASE_5_MECHANICAL_TYPE_CLEANUP_REPORT.md`

### Phase 6 - Runtime JSON Validation Cleanup (COMPLETE - December 2025)
- Installed `zod` for runtime validation
- Created `parseJsonField` utility in `src/lib/db/jsonValidation.ts`
- Fixed 9 unsafe JSON read casts:
  - `loyalty-service.ts`: 5 casts (TierConfig validation)
  - `bulk-order-service.ts`: 2 casts (BulkOrderItem[] validation)  
  - `commission-engine.ts`: 2 casts (CommissionTier/HybridRule validation)
- Report: `/app/frontend/docs/PHASE_6_RUNTIME_JSON_VALIDATION_REPORT.md`

---

## Remaining Items (Prioritized Backlog)

### P1 - Remaining Type Safety Issues
- Review remaining `as unknown` casts related to Prisma result type augmentation
- Address ~235 `as any` casts (require domain expert review)

### P2 - Legacy Debt
- Fix 52 semantic React Hook warnings (baselined in Phase 3)
- Address 1,201 baselined Prisma issues (requires schema governance)

### P2 - Features (Backlog)
- Guided Demo Tours (ALL SUITES)

---

## Technical Architecture
- **Framework**: Next.js 14.2.21
- **Database**: Prisma ORM with PostgreSQL (Supabase)
- **Validation**: Zod (for runtime JSON validation)
- **Deployment**: Vercel (now unblocked)

## Key Files
- `/app/frontend/prisma/schema.prisma` - Source of truth for DB models
- `/app/frontend/src/lib/db/prismaDefaults.ts` - Helper for required Prisma fields & JSON writes
- `/app/frontend/src/lib/db/jsonValidation.ts` - Zod schemas & JSON read validation
- `/app/frontend/docs/` - All audit and remediation reports

## Build Command
```bash
cd /app/frontend && NODE_OPTIONS="--max-old-space-size=4096" yarn build
```
