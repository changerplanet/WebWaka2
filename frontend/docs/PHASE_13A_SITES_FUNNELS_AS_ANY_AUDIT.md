# Phase 13A — Sites/Funnels `as any` Audit

**Date**: December 2025  
**Status**: COMPLETE (READ-ONLY AUDIT)  
**Module**: `sites-funnels`  
**Total Casts Found**: 5  
**Scope**: `/app/frontend/src/lib/sites-funnels/` + `/app/frontend/src/app/api/sites-funnels/`

---

## Executive Summary

The Sites/Funnels module has only **5 `as any` casts**, making it an ideal low-risk candidate for Phase 13C remediation. All casts fall into two clear categories:

1. **JSON Field Casting (4 casts)** — Prisma `Json` fields being cast to `any[]` for iteration
2. **Dynamic Enum Construction (1 cast)** — Audit action string not in `AuditAction` enum

---

## Cast Inventory

| # | File | Line | Cast | Category | Risk |
|---|------|------|------|----------|------|
| 1 | `permissions-service.ts` | 315 | `SITES_FUNNELS_${action}` as any | 🟡 DOMAIN_DECISION | Medium |
| 2 | `template-service.ts` | 230 | `t.blocks as any[]` | 🟢 SAFE_WITH_MAPPING | Low |
| 3 | `template-service.ts` | 275 | `template.blocks as any[]` | 🟢 SAFE_WITH_MAPPING | Low |
| 4 | `template-service.ts` | 375 | `template.blocks as any[]` | 🟢 SAFE_WITH_MAPPING | Low |
| 5 | `template-service.ts` | 478 | `template.blocks as any[]` | 🟢 SAFE_WITH_MAPPING | Low |

---

## Detailed Analysis

### Cast #1: Dynamic AuditAction Construction

**Location**: `src/lib/sites-funnels/permissions-service.ts:315`

```typescript
action: `SITES_FUNNELS_${action.toUpperCase()}` as any,
```

**Context**:
- Creating audit log entries for Sites/Funnels actions
- The `AuditAction` Prisma enum does NOT include Sites/Funnels-specific actions
- Developer constructed dynamic string to bypass enum constraint

**Why `as any` exists**:
- Prisma expects `AuditAction` enum value
- Sites/Funnels actions (CREATE_SITE, UPDATE_PAGE, etc.) are not in the enum
- Cast bypasses type checking to allow arbitrary string

**Current AuditAction enum** (from schema.prisma):
- Contains: TENANT_*, USER_*, PARTNER_*, SUBSCRIPTION_*, etc.
- Missing: Any SITES_FUNNELS_* actions

**Classification**: 🟡 **DOMAIN_DECISION_REQUIRED**

**Options**:
| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| A. Add to AuditAction enum | Type-safe, auditable | Requires Prisma migration | ⚠️ Deferred (schema change) |
| B. Use generic action + metadata | No schema change | Less queryable | ✅ Possible |
| C. Keep `as any` | Zero risk | Tech debt remains | ⏸ Acceptable for now |

**Proposed Fix Strategy**:
- **Short-term**: Keep `as any` with clarifying comment
- **Long-term**: Add `SITES_FUNNELS_*` actions to `AuditAction` enum in schema governance phase

---

### Casts #2-5: JSON Field → Array Casting

**Locations**: `src/lib/sites-funnels/template-service.ts:230, 275, 375, 478`

```typescript
// All identical pattern:
blocks: t.blocks as any[] || [],
const templateBlocks = template.blocks as any[] || [];
```

**Context**:
- `sf_templates.blocks` is defined as `Json @default("[]")` in Prisma schema
- Prisma returns `Prisma.JsonValue` type (union of primitives, arrays, objects)
- Code needs to iterate over blocks as array

**Why `as any` exists**:
- `Prisma.JsonValue` is not directly iterable
- Need to assert array structure for `for...of` loop and array methods

**Existing Type Definition**:
```typescript
// Already defined in template-service.ts:50
export interface TemplateBlock {
  id: string;
  type: string;
  name: string;
  content: any;
  styles?: any;
  settings?: any;
}
```

**Classification**: 🟢 **SAFE_WITH_MAPPING**

**Proposed Fix Strategy**:

1. Create a Zod schema for runtime validation:
```typescript
const TemplateBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  name: z.string(),
  content: z.record(z.any()),
  styles: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

const TemplateBlocksSchema = z.array(TemplateBlockSchema);
```

2. Create a safe parser function:
```typescript
function parseTemplateBlocks(blocks: Prisma.JsonValue): TemplateBlock[] {
  const result = TemplateBlocksSchema.safeParse(blocks);
  if (!result.success) {
    console.warn('[Sites/Funnels] Invalid template blocks structure:', result.error);
    return [];
  }
  return result.data;
}
```

3. Replace all `as any[]` casts with the parser:
```typescript
// Before
const templateBlocks = template.blocks as any[] || [];

// After
const templateBlocks = parseTemplateBlocks(template.blocks);
```

**Risk Assessment**: LOW
- All usages are read-only iteration
- Existing code already handles empty/null with `|| []`
- Parser adds runtime safety net

---

## Classification Summary

| Classification | Count | Casts |
|----------------|-------|-------|
| 🟢 SAFE_WITH_MAPPING | 4 | #2, #3, #4, #5 |
| 🟡 DOMAIN_DECISION_REQUIRED | 1 | #1 |
| 🔴 DO_NOT_TOUCH | 0 | — |

---

## Phase 13B Approval Questions

### For Cast #1 (AuditAction):

1. **Should Sites/Funnels audit actions be added to the `AuditAction` enum?**
   - If YES: Requires Prisma schema migration (defer to schema governance)
   - If NO: Keep `as any` with documentation

2. **Is there a preferred audit action naming convention?**
   - Current pattern: `SITES_FUNNELS_${action}` (e.g., `SITES_FUNNELS_CREATE_SITE`)
   - Alternative: Use generic `RESOURCE_CREATED` with metadata

### For Casts #2-5 (Template Blocks):

1. **Approve creation of `TemplateBlockSchema` Zod validator?**
   - Location: `/app/frontend/src/lib/sites-funnels/template-service.ts`
   - Impact: 4 casts → 0 casts

2. **Should validation failures log or throw?**
   - Recommended: Log warning + return empty array (matches current `|| []` behavior)

---

## Recommended Phase 13C Scope

**Approved for immediate fix** (pending 13B confirmation):
- Casts #2-5: Replace `as any[]` with Zod-validated parser

**Deferred** (requires schema decision):
- Cast #1: Keep `as any` until AuditAction enum governance

**Expected Outcome**:
- Cast count: 5 → 1
- 80% reduction in this module

---

## Appendix: File References

### permissions-service.ts (Cast #1)
```
/app/frontend/src/lib/sites-funnels/permissions-service.ts:315
```

### template-service.ts (Casts #2-5)
```
/app/frontend/src/lib/sites-funnels/template-service.ts:230
/app/frontend/src/lib/sites-funnels/template-service.ts:275
/app/frontend/src/lib/sites-funnels/template-service.ts:375
/app/frontend/src/lib/sites-funnels/template-service.ts:478
```

### Prisma Schema Reference
```
/app/frontend/prisma/schema.prisma
  - model sf_templates (blocks: Json)
  - enum AuditAction (missing SITES_FUNNELS_* actions)
```

---

**END OF PHASE 13A AUDIT — SITES/FUNNELS MODULE**
