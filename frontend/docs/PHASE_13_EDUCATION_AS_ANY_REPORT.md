# Phase 13 — Education Module `as any` Audit & Reduction

**Date**: December 2025  
**Status**: COMPLETE  
**Module**: `education`

---

## Audit Summary

| Metric | Count |
|--------|-------|
| Total casts found | 16 |
| SAFE_WITH_MAPPING | 1 |
| DOMAIN_DECISION | 7 |
| CONDITIONAL (Prisma) | 8 |
| **Fixed** | 1 |
| **Remaining** | 15 |

---

## Classification Details

### 🟢 SAFE_WITH_MAPPING (1) — FIXED

| File | Line | Cast | Fix |
|------|------|------|-----|
| `grades/route.ts` | 115 | `scale as any` | ✅ `validateGradeScale()` validator |

**Fix Applied:**
```typescript
// Added validator
const VALID_GRADE_SCALES = Object.keys(GRADE_SCALES) as GradeScaleType[];
function validateGradeScale(scale: string): GradeScaleType {
  if (VALID_GRADE_SCALES.includes(scale as GradeScaleType)) {
    return scale as GradeScaleType;
  }
  console.warn(`[Education Grades] Invalid grade scale '${scale}', defaulting to WAEC`);
  return 'WAEC';
}

// Usage
const result = getGradeFromScore(parseFloat(score), validateGradeScale(scale));
```

---

### 🟡 DOMAIN_DECISION_REQUIRED (7) — Deferred

These casts pass Prisma query results to service functions that expect specific interfaces.

| File | Line | Cast | Issue |
|------|------|------|-------|
| `attendance/route.ts` | 93 | `attendance as any` | `calculateAttendanceStats()` expects interface |
| `attendance/route.ts` | 116 | `attendance as any` | `calculateDailyClassSummary()` expects interface |
| `fees/route.ts` | 232 | `feeStructure as any` | `createFeeAssignmentEntity()` signature |
| `fees/route.ts` | 268 | `feeStructure as any` | Same function in bulk |
| `assessments/route.ts` | 305 | `assessments as any` | `createResultEntity()` signature |
| `assessments/route.ts` | 373 | `current as any` | `canModifyResult()` signature |
| `assessments/route.ts` | 379 | `current.status as any` | `isValidResultStatusTransition()` signature |

**Reason for Deferral:** These require updating service function signatures to accept Prisma-generated types, which is a refactoring task beyond SAFE_WITH_MAPPING scope.

---

### 🔴 CONDITIONAL — Prisma Type Issues (8) — Deferred

These casts wrap entity objects passed to `prisma.*.create()` calls.

| File | Line | Cast | Issue |
|------|------|------|-------|
| `attendance/route.ts` | 177 | `prisma.edu_attendance.create as any` | Entity type mismatch |
| `attendance/route.ts` | 206 | `prisma.edu_attendance.create as any` | Bulk create |
| `fees/route.ts` | 190 | `prisma.edu_fee_structure.create as any` | Entity type |
| `fees/route.ts` | 234 | `prisma.edu_fee_assignment.create as any` | Entity type |
| `fees/route.ts` | 271 | `prisma.edu_fee_assignment.create as any` | Bulk |
| `assessments/route.ts` | 215 | `assessmentData as any` | Entity → create |
| `assessments/route.ts` | 314 | `resultData as any` | Entity → upsert |
| `guardians/route.ts` | 142 | `guardianData as any` | Entity → create |

**Reason for Deferral:** 
- Entity creation functions return plain objects
- Prisma expects specific generated types
- Fixing requires either Prisma schema adjustments or entity type alignment
- This is CONDITIONAL category per Phase 11A classification

---

## Build Verification

```
✅ yarn build passed (107.45s)
✅ No regressions
```

---

## Module Outcome

| Before | After | Change |
|--------|-------|--------|
| 16 | 15 | -1 (6%) |

**Note:** Education module has limited SAFE_WITH_MAPPING opportunities. Most casts are Prisma-related (entity → create type mismatches), which are correctly deferred per standing mandate.

---

**Proceeding to next module: Hospitality**
