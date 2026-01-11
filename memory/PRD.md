# Deployable SaaS Platform - PRD

## Original Problem Statement
Fix failing production build (`yarn build`) for Next.js application to unblock Vercel deployment. Build was failing due to TypeScript type errors caused by Prisma schema mismatches and Next.js dynamic route configuration issues.

## Current Status: ✅ BUILD SUCCESSFUL
- **TypeScript Compilation**: ✅ PASSING
- **Static Generation**: ✅ PASSING  
- **Build Exit Code**: 0
- **Build Time**: ~96 seconds

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
Added `export const dynamic = 'force-dynamic'` to 412 files:

- **Wave 1**: 211 API routes (cookies/headers/session detection)
- **Wave 2**: 198 API routes (request.url/request.headers detection)
- **Wave 3**: 3 additional files (partner/settings, church, root layout)

---

## Remaining Items (Non-Blocking)

### P1 - React Hook Warnings (~56 warnings)
- Missing dependency array warnings in useEffect/useCallback
- These are ESLint warnings, not build errors
- Can be addressed incrementally

### P2 - Code Quality
- Consider addressing baselined Prisma validation issues (1201 baselined)

---

## Technical Architecture
- **Framework**: Next.js 14.2.21
- **Database**: Prisma ORM with PostgreSQL (Supabase)
- **Deployment**: Vercel (now unblocked)

## Key Files
- `/app/frontend/prisma/schema.prisma` - Source of truth for DB models
- `/app/frontend/src/lib/db/prismaDefaults.ts` - Helper for required Prisma fields
- `/app/frontend/docs/DYNAMIC_API_ROUTE_FIX_REPORT.md` - Complete fix report
- `/app/frontend/docs/DYNAMIC_API_ROUTE_DETECTION_REPORT.md` - Detection report

## Build Command
```bash
cd /app/frontend && NODE_OPTIONS="--max-old-space-size=4096" yarn build
```
