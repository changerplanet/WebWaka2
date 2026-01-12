# Phase 13 — CONDITIONAL `as any` Reduction Program

**Date**: December 2025  
**Status**: COMPLETE (Continuous Execution)  
**Authorization**: Standing Mandate for SAFE_WITH_MAPPING patterns

---

## Executive Summary

Phase 13 systematically audited and remediated `as any` casts across multiple low-risk modules using the proven audit → fix → verify pattern. The program operated under standing authorization with automatic stop conditions.

### Overall Results

| Module | Before | After | Fixed | Deferred | Reduction |
|--------|--------|-------|-------|----------|-----------|
| Sites/Funnels | 5 | 1 | 4 | 1 | 80% |
| Education | 16 | 15 | 1 | 15 | 6% |
| Hospitality | 5 | 0 | 5 | 0 | 100% |
| Logistics | 13 | 13 | 0 | 13 | 0% |
| Marketing | 0 | 0 | 0 | 0 | N/A |
| CRM | 16 | 15 | 1 | 15 | 6% |
| **Total** | **55** | **44** | **11** | **44** | **20%** |

**Note**: Most deferred casts are Prisma `create`/`upsert` type mismatches requiring schema-level fixes.

---

## Module Reports

### Sites/Funnels (80% reduction)

**Casts Fixed**: 4 of 5

| Type | Fix |
|------|-----|
| `template.blocks as any[]` (×4) | Zod-validated `parseTemplateBlocks()` parser |

**Deferred**: 1 (AuditAction enum bypass — requires schema migration)

**Report**: `/app/frontend/docs/PHASE_13A_SITES_FUNNELS_AS_ANY_AUDIT.md`  
**Report**: `/app/frontend/docs/PHASE_13C_SITES_FUNNELS_AS_ANY_REDUCTION_REPORT.md`

---

### Education (6% reduction)

**Casts Fixed**: 1 of 16

| Type | Fix |
|------|-----|
| `scale as any` | `validateGradeScale()` validator |

**Deferred**: 15
- 8× Prisma create entity casts
- 7× Function signature mismatches (service layer)

**Report**: `/app/frontend/docs/PHASE_13_EDUCATION_AS_ANY_REPORT.md`

---

### Hospitality (100% reduction)

**Casts Fixed**: 5 of 5

| Type | Fix |
|------|-----|
| `status as any` (folio) | `validateFolioStatus()` validator |
| `status as any` (housekeeping) | `validateHousekeepingStatus()` validator |
| `taskType as any` | `validateTaskType()` validator |
| `priority as any` | `validatePriority()` validator |
| `roomType as any` | `validateRoomType()` validator |

**Deferred**: 0

---

### Logistics (0% reduction)

**Casts Audited**: 13  
**All Deferred**: 13× Prisma create/update entity casts

These are all `data: {...} as any` patterns in service layer functions. Fixing requires either:
1. Schema-aligned entity builders
2. Prisma type generation alignment

---

### Marketing (N/A)

**Casts Found**: 0  
No remediation needed.

---

### CRM (6% reduction)

**Casts Fixed**: 1 of 16

| Type | Fix |
|------|-----|
| `transactionType as any` | `validateTransactionType()` validator |

**Deferred**: 15× Prisma create/upsert entity casts

---

## Validators Created

### Sites/Funnels
- `parseTemplateBlocks()` — Zod schema for JSON template blocks

### Education  
- `validateGradeScale()` — WAEC/JAMB/custom grade scales

### Hospitality
- `validateFolioStatus()` — OPEN/SETTLED/CLOSED
- `validateHousekeepingStatus()` — PENDING/ASSIGNED/IN_PROGRESS/COMPLETED/INSPECTED/CANCELLED
- `validateTaskType()` — CHECKOUT_CLEAN/STAY_OVER/DEEP_CLEAN/TURNDOWN/INSPECTION/TOUCH_UP
- `validatePriority()` — LOW/MEDIUM/HIGH/URGENT
- `validateRoomType()` — STANDARD/DELUXE/EXECUTIVE/SUITE/PRESIDENTIAL/STUDIO/APARTMENT/DORMITORY

### CRM
- `validateTransactionType()` — EARN/REDEEM/BONUS/ADJUSTMENT/EXPIRY/TRANSFER_IN/TRANSFER_OUT

---

## Stop Conditions Encountered

The following patterns triggered automatic deferral per standing mandate:

### 1. Prisma Create/Upsert Type Mismatches
**Count**: ~40 casts across modules

```typescript
// Pattern seen in all service layers
const entity = await prisma.model.create({
  data: { ...input } as any,  // Entity object doesn't match Prisma generated type
})
```

**Reason for deferral**: Fixing requires either:
- Modifying entity builder functions to return Prisma-compatible types
- Aligning service layer interfaces with Prisma schema
- Schema changes to match application types

### 2. Function Signature Mismatches
**Count**: ~7 casts in education module

```typescript
const stats = calculateAttendanceStats(attendance as any);
```

**Reason for deferral**: Service functions expect specific interfaces that don't match Prisma query results.

---

## Build Verification

All changes verified with `yarn build`:

| Module | Build Status | Time |
|--------|--------------|------|
| Sites/Funnels | ✅ Pass | ~106s |
| Education | ✅ Pass | ~107s |
| Hospitality | ✅ Pass | ~106s |
| CRM | ✅ Pass | ~108s |

---

## Files Modified

### Sites/Funnels
- `src/lib/sites-funnels/template-service.ts` — Added Zod schema + parser

### Education
- `src/app/api/education/grades/route.ts` — Added grade scale validator

### Hospitality
- `src/app/api/hospitality/folio/route.ts` — Added folio status validator
- `src/app/api/hospitality/housekeeping/route.ts` — Added housekeeping validators (status, taskType, priority)
- `src/lib/hospitality/services/reservation-service.ts` — Added room type validator

### CRM
- `src/app/api/crm/loyalty/customer/[id]/route.ts` — Added transaction type validator

---

## Remaining Work (Deferred)

### CONDITIONAL — Prisma Entity Casts (~40)
These require structural changes:
- **Option A**: Create typed entity builders that return `Prisma.ModelCreateInput`
- **Option B**: Use Prisma's `satisfies` operator with intermediate types
- **Option C**: Schema alignment pass to unify application and Prisma types

### Domain Decision Required (~7)
Education module service function signatures need domain owner review to determine:
- Should functions accept Prisma types directly?
- Or should route layer transform data before passing?

---

## Recommendations

1. **Short-term**: The 11 fixes applied in Phase 13 are stable and production-ready
2. **Medium-term**: Consider a "Phase 13D — Entity Builder Alignment" to address Prisma casts systematically
3. **Long-term**: Schema governance initiative to unify application types with Prisma generated types

---

**END OF PHASE 13 PROGRAM REPORT**
