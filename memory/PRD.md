# Deployable SaaS Platform - PRD

## Original Problem Statement
Fix failing production build (`yarn build`) for Next.js application to unblock Vercel deployment. Build was failing due to TypeScript type errors caused by Prisma schema mismatches.

## Current Status: Build Stabilization Phase B Complete
- **TypeScript Compilation**: ✅ PASSING
- **Static Generation**: ❌ FAILING (Dynamic server usage errors)

## What's Been Implemented (December 2025)

### Phase B - Global Mechanical Batch Stabilization (COMPLETE)
All TypeScript/Prisma mismatch errors have been resolved:

1. **POS Module** (`src/lib/pos/**`)
   - Fixed `inv_audit_items` → `items` relation in `report-service.ts`, `sale-service.ts`, `shift-service.ts`

2. **Rules Module** (`src/lib/rules/**`)
   - Fixed type re-export syntax in `commission.ts` and `promotions.ts`
   - Changed `_getPromotions(tenantId, {isActive: true})` → `_getActivePromotions(tenantId)`

3. **Shipping Storage** (`src/lib/shipping-storage.ts`)
   - Fixed `rates` → `svm_shipping_rates` relation
   - Added `withPrismaDefaults` for `id` and `updatedAt` fields

4. **Sites-Funnels Module** (`src/lib/sites-funnels/**`)
   - Removed non-existent `branding` relation, access fields directly on Tenant/PlatformInstance
   - Fixed `status: 'ACTIVE'` → `isActive: true` in TenantMembership queries
   - Fixed `'OWNER' || 'ADMIN'` → `'TENANT_ADMIN'` for TenantRole enum
   - Fixed audit action type casting
   - Fixed `ProductCategory` → `category` relation in template-service

## Current Blocker
Build fails during static page generation because API routes use `cookies()` without proper dynamic route configuration.

**Error**: `Route /api/... couldn't be rendered statically because it used 'cookies'`

**Solution Required**: Add `export const dynamic = 'force-dynamic'` to all API routes using `getCurrentSession()` or `cookies()`.

## Prioritized Backlog

### P0 - Critical (Build Blocking)
- [ ] Add dynamic export to ~50+ API routes using session/cookies

### P1 - Important
- [ ] Fix ~56 React Hook dependency warnings
- [ ] Semantic fixes in `src/lib/rules/**` (missing type definitions)

### P2 - Nice to Have
- [ ] Code quality hardening
- [ ] Lint warning cleanup

### Future Features
- [ ] Guided Demo Tours (ALL SUITES)

## Technical Architecture
- **Framework**: Next.js 14.2.21
- **Database**: Prisma ORM with PostgreSQL (Supabase)
- **Deployment**: Vercel

## Key Files
- `/app/frontend/prisma/schema.prisma` - Source of truth for DB models
- `/app/frontend/src/lib/db/prismaDefaults.ts` - Helper for required Prisma fields
- `/app/frontend/docs/GLOBAL_MECHANICAL_ERROR_MAP.md` - Error classification report
