# Deployable SaaS Platform - PRD

## Original Problem Statement
Fix failing production build (`yarn build`) for Next.js application to unblock Vercel deployment. Build was failing due to TypeScript type errors caused by Prisma schema mismatches and Next.js dynamic route configuration issues.

## Current Status: ✅ BUILD SUCCESSFUL
- **TypeScript Compilation**: ✅ PASSING
- **Static Generation**: ✅ PASSING  
- **Build Exit Code**: 0
- **Build Time**: ~100 seconds

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

### Phase 6 - Runtime JSON Validation Cleanup (COMPLETE)
- Installed `zod` for runtime validation
- Created `parseJsonField` utility in `src/lib/db/jsonValidation.ts`
- Fixed 9 unsafe JSON read casts:
  - `loyalty-service.ts`: 5 casts (TierConfig validation)
  - `bulk-order-service.ts`: 2 casts (BulkOrderItem[] validation)  
  - `commission-engine.ts`: 2 casts (CommissionTier/HybridRule validation)
- Report: `/app/frontend/docs/PHASE_6_RUNTIME_JSON_VALIDATION_REPORT.md`

### Phase 7 - Prisma Result Typing (COMPLETE)
- Created `prismaResultMappers.ts` with typed view models and mapper functions
- Eliminated 5 unsafe Prisma result casts:
  - `tenant-resolver.ts`: 3 casts (PlatformInstanceWithTenant)
  - `partner-staff.ts`: 2 casts (StaffMember)
- View models introduced: `PlatformInstanceWithTenant`, `StaffMemberViewModel`, `StaffUserInfo`, `DomainWithInstance`
- Mapper functions: `mapPlatformInstanceWithTenant()`, `mapStaffMember()`, `mapStaffMembers()`, `mapDomainPlatformInstance()`
- Report: `/app/frontend/docs/PHASE_7_PRISMA_RESULT_TYPING_REPORT.md`

### Phase 8 - Event Type System (COMPLETE - December 2025)
- Created centralized event type system in `src/lib/events/eventTypes.ts`
- Implemented discriminated unions for all 3 module event systems:
  - `POSEvent` (4 event types)
  - `SVMEvent` (5 event types)
  - `MVMEvent` (9 event types)
- Introduced 3 type guard functions: `isPOSEvent()`, `isSVMEvent()`, `isMVMEvent()`
- Centralized 18 payload type definitions
- Eliminated 17 unsafe `as unknown` casts in event handlers:
  - `pos-event-handlers.ts`: 4 casts
  - `svm-event-handlers.ts`: 5 casts
  - `mvm-event-handlers.ts`: 8 casts
- Report: `/app/frontend/docs/PHASE_8_EVENT_TYPE_SYSTEM_REPORT.md`

### Phase 9 - `as any` Reduction (COMPLETE - December 2025)

**Phase 9A - Audit (COMPLETE)**
- Audited all 419 `as any` casts across 169 files
- Categorized by risk: SAFE (37%), CONDITIONAL (23%), DOMAIN_REQUIRED (39%)
- Report: `/app/frontend/docs/PHASE_9A_AS_ANY_AUDIT_REPORT.md`

**Phase 9B - Conservative Reduction (COMPLETE)**
- Created URL param utility: `src/lib/utils/urlParams.ts`
- Fixed 15 casts in 8 API route files (real-estate, HR, logistics)
- Discovered systemic enum drift between service interfaces and Prisma schema
- Several attempted fixes reverted to preserve behavior
- Report: `/app/frontend/docs/PHASE_9B_AS_ANY_REDUCTION_REPORT.md`

### Phase 10 - Enum Alignment (COMPLETE - December 2025)

**Phase 10A - Authority Resolution (COMPLETE)**
- Audited 299 Prisma enums
- Mapped drift between Prisma, service layer, and API
- Identified ~250+ aligned, ~15 service-only, ~8 semantic mismatches
- Flagged 8 critical enums (auth/billing) as DO NOT TOUCH
- Report: `/app/frontend/docs/PHASE_10_ENUM_AUTHORITY_MATRIX.md`

**Phase 10B - Compatibility Mapping (COMPLETE)**
- Created enum mapping infrastructure: `src/lib/enums/`
- Utilities: `createEnumMapper`, `validateEnumValue`, `isValidEnumValue`
- Mappers created but discovered service interfaces are the blocker
- Cast elimination blocked by service function type signatures
- Stub functions created for Phase 10C-requiring enums
- Report: `/app/frontend/docs/PHASE_10B_ENUM_MAPPING_REPORT.md`

**Phase 10C - Bidirectional Mapping Implementation (COMPLETE - December 2025)**
- Implemented 22 enum validators for API → Service layer boundaries
- Civic module: 13 validators (status, priority, category, events, constituents, certificates, dues, voting)
- Logistics module: 9 validators (jobs, drivers, vehicles, license types)
- Updated 8 API routes to use type-safe validators
- Eliminated 17 of 18 `as any` casts in civic/logistics API routes (94% reduction)
- Remaining 1 cast: `LogisticsDeliveryStatus` (CONDITIONAL - requires domain approval)
- Report: `/app/frontend/docs/PHASE_10C_ENUM_ALIGNMENT_REPORT.md`

**Phase 10D - Runtime Safety Nets (COMPLETE - December 2025)**
- Added `logEnumMismatch()` utility for runtime observability
- Updated `validateEnumValue()` to log invalid values without changing return behavior
- All 22 validators now include enum names and source tracking
- Logging only, no behavior changes - purely diagnostic
- Zero regressions, build passes
- Report: `/app/frontend/docs/PHASE_10D_RUNTIME_ENUM_SAFETY_REPORT.md`

---

## Remaining Items (Prioritized Backlog)

### P0 - Phase 10C Conditional Enums
- `LogisticsDeliveryStatus` mapping requires domain approval (significant semantic drift)
- `SvmOrderStatus` mapping (if needed)

### P1 - Phase 10D Runtime Safety Nets
- Optional non-fatal runtime guards for unexpected enum values
- Logging/monitoring for enum validation failures

### P2 - Legacy Debt
- Fix 52 semantic React Hook warnings (baselined in Phase 3)
- Address 1,201 baselined Prisma issues (requires schema governance)
- Remaining ~400 `as any` casts (most blocked by domain-specific enum decisions)

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
