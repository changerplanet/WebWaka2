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

**Phase 10E - Domain-Approved Delivery Status Mapping (COMPLETE - December 2025)**
- Implemented `LogisticsDeliveryStatus` mapping with domain approval
- Canonical mappings: READY→ASSIGNED, OUT_FOR_DELIVERY→IN_TRANSIT, COMPLETED→DELIVERED, CANCELLED→FAILED
- Created `validateDeliveryStatusArray()` for comma-separated status filtering
- Eliminated final `as any` cast in `/api/logistics/assignments`
- **ENUM ALIGNMENT WORKSTREAM CLOSED** - 0 `as any` casts remaining in civic/logistics routes
- Report: `/app/frontend/docs/PHASE_10E_DELIVERY_STATUS_MAPPING_REPORT.md`

**Phase 11A - `as any` Classification (COMPLETE - December 2025)**
- Read-only audit of 380 remaining `as any` casts
- Classified into: OUT OF SCOPE (57), CONDITIONAL (247), SAFE (76)
- Report: `/app/frontend/docs/PHASE_11A_AS_ANY_CLASSIFICATION_REPORT.md`

**Phase 11B - SAFE `as any` Reduction (COMPLETE - December 2025)**
- Eliminated 26 `as any` casts (380 → 354)
- Created 21 new enum validators for Procurement and Project Management
- Fixed 9 API routes across logistics-suite, procurement, and project-management
- All fixes are mechanical type annotations with zero behavior changes
- Report: `/app/frontend/docs/PHASE_11B_SAFE_AS_ANY_REDUCTION_REPORT.md`

**Phase 11C - Extended SAFE Reduction (COMPLETE - December 2025)**
- Eliminated 9 additional `as any` casts (354 → 345)
- Created validators for Sites/Funnels (6) and SVM (3) modules
- Fixed 4 API routes and 1 service file
- Documented casts that require schema/Prisma changes to fix
- Report: `/app/frontend/docs/PHASE_11C_SAFE_AS_ANY_REDUCTION_REPORT.md`

**PHASE 11 SUMMARY: Total 35 casts eliminated (380 → 345)**

---

## Remaining Items (Prioritized Backlog)

### P2 - Phase 12: React Hook Warnings (COMPLETE - December 2025)

**Phase 12A - Classification (COMPLETE)**
- Read-only audit of 52 baselined React Hook dependency warnings
- Classified into: SAFE (31), DOMAIN_REQUIRED (15), DO_NOT_TOUCH (6)
- Report: `/app/frontend/docs/PHASE_12A_REACT_HOOK_CLASSIFICATION_REPORT.md`

**Phase 12B - SAFE Remediation (COMPLETE)**
- Applied `useCallback` wrapper pattern to all 31 SAFE warnings
- Fixed 30 warnings across 27 files
- Warning count reduced: 52 → 22
- Zero regressions, build passes

**Phase 12C - Documentation (COMPLETE)**
- Created final hygiene report documenting all fixes and baselined warnings
- 22 warnings remain baselined (9 DO_NOT_TOUCH + 13 DOMAIN_REQUIRED)
- Report: `/app/frontend/docs/PHASE_12_REACT_HOOK_HYGIENE_REPORT.md`

---

### P2 - Legacy Debt (Remaining)
- Address ~310 remaining `as any` casts (CONDITIONAL/OUT OF SCOPE)
- 1,201 baselined Prisma issues (requires schema governance)

### P3 - Features (Backlog)
- Guided Demo Tours (ALL SUITES)

### P3 - Optional Enhancements
- Structured logging integration (Pino/Winston) for enum mismatches
- SvmOrderStatus mapping (if needed, currently stub)
- Fix DOMAIN_REQUIRED React Hook warnings (13 remaining - requires domain review)

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
