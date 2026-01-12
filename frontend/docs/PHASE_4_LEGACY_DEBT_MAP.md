# PHASE 4: LEGACY PRISMA & TYPE SAFETY DEBT MAP

**Generated**: January 2026  
**Mode**: READ-ONLY ANALYSIS  
**Status**: ANALYSIS COMPLETE

---

## Executive Summary

| Category | Count | Risk | Effort |
|----------|-------|------|--------|
| **Prisma Baselined Issues** | 1,201 | 🟡 Medium | High |
| **Unsafe `as any` Casts** | 235 | 🔴 High | Medium |
| **Unsafe `as unknown` Casts** | 41 | 🟡 Medium | Low |
| **JSON Field Casts** | 105 | 🟢 Low | Low |
| **Aggregate Access (._count)** | 237 | 🟢 Low | Low |
| **withPrismaDefaults Usage** | 515 | ✅ Healthy | N/A |

---

## 1. Prisma Baselined Issues (1,201)

### Summary
```
Total Prisma References: 4,191
Valid Models: 365
Baselined Issues: 1,201 (28.7%)
New Errors: 0
```

### Classification

| Type | Description | Estimated Count |
|------|-------------|-----------------|
| **Legacy Model Names** | References to old/renamed models | ~600 |
| **Relation Drift** | Incorrect relation names | ~300 |
| **Field Mismatches** | Accessing non-existent fields | ~200 |
| **Import Issues** | Incorrect Prisma client imports | ~100 |

### Risk Assessment
- **Build Impact**: ✅ None (baselined)
- **Runtime Impact**: 🟡 Potential (silent failures)
- **Data Integrity**: 🟡 Potential (wrong queries)

### Remediation Strategy
| Approach | Effort | Risk |
|----------|--------|------|
| **Option A**: Schema audit + batch fix | High | Low |
| **Option B**: Incremental fix per module | Medium | Medium |
| **Option C**: Accept as debt | None | High |

---

## 2. Unsafe Type Casts — `as any` (235)

### Distribution by Module

| Directory | Count | Risk Level |
|-----------|-------|------------|
| `src/lib/crm/` | 31 | 🔴 High |
| `src/lib/accounting/` | 27 | 🔴 High |
| `src/lib/inventory/` | 24 | 🔴 High |
| `src/lib/real-estate/` | 29 | 🟡 Medium |
| `src/lib/auth/` | 16 | 🔴 High |
| `src/lib/legal-practice/` | 15 | 🟡 Medium |
| `src/lib/subscription.ts` | 11 | 🔴 High |
| `src/lib/tenant-isolation.ts` | 8 | 🔴 High |
| `src/lib/partner-*` | 7 | 🟡 Medium |
| Other modules | 67 | 🟢 Low-Medium |

### Cast Pattern Analysis

| Pattern | Count | Category | Fix Strategy |
|---------|-------|----------|--------------|
| `(prisma.model.create as any)` | ~80 | ❌ SEMANTIC | Requires type augmentation |
| `(prisma.model.update as any)` | ~40 | ❌ SEMANTIC | Requires type augmentation |
| `(tx.auditLog.create as any)` | ~15 | ✅ MECHANICAL | Add proper types |
| `context as any` | ~20 | ⚠️ CONFIG | Define context types |
| `data as any` | ~30 | ❌ SEMANTIC | Domain-specific |
| `response as any` | ~25 | ✅ MECHANICAL | Define response types |
| Other patterns | ~25 | Mixed | Case-by-case |

### Hotspot Files (Top 10)

| File | Count | Reason |
|------|-------|--------|
| `real-estate/maintenance-request-service.ts` | 12 | Complex nested creates |
| `subscription.ts` | 11 | Audit log casting |
| `auth/login-service.ts` | 10 | Session handling |
| `accounting/expense-service.ts` | 10 | Financial records |
| `tenant-isolation.ts` | 8 | Generic model checking |
| `inventory/transfer-service.ts` | 8 | Stock movements |
| `real-estate/property-service.ts` | 7 | Property relations |
| `partner-tenant-creation.ts` | 7 | Multi-model creation |
| `crm/loyalty-service.ts` | 7 | Loyalty transactions |
| `inventory/reorder-service.ts` | 6 | Suggestion system |

---

## 3. Unsafe Type Casts — `as unknown` (41)

### Pattern Analysis

| Pattern | Count | Fix Strategy |
|---------|-------|--------------|
| `as unknown as Prisma.InputJsonValue` | 25 | ✅ MECHANICAL |
| `as unknown as T` | 10 | ⚠️ CONFIG |
| Other | 6 | Case-by-case |

### Recommendation
Most `as unknown` casts are for JSON field conversion, which is a known Prisma limitation. These can be addressed with a utility type:

```typescript
type JsonInput<T> = T extends object ? Prisma.InputJsonValue : never
```

---

## 4. JSON Field Casts (105)

### Pattern Analysis
```typescript
// Common pattern
data: someObject as Prisma.InputJsonValue
metadata: config as unknown as Prisma.InputJsonValue
```

### Fix Strategy
- **Mechanical**: Create `toJsonValue()` utility function
- **Effort**: Low
- **Risk**: None

---

## 5. Aggregate Access Patterns (237)

### Pattern Analysis
```typescript
// Common pattern
result._count?.field
result._sum?.amount
```

### Assessment
- These are valid Prisma aggregate patterns
- No fix required unless type errors occur
- Classified as: ✅ HEALTHY

---

## 6. Remediation Roadmap

### Batch 1: Mechanical Fixes (Low Risk)

| Task | Files | Effort | Approach |
|------|-------|--------|----------|
| JSON field utility | All | 1 day | Create helper function |
| Audit log types | 15 | 2 days | Add proper types |
| Response types | 25 | 3 days | Define interfaces |

**Total Batch 1**: ~1 week, ✅ Safe to execute

### Batch 2: Configuration Fixes (Medium Risk)

| Task | Files | Effort | Approach |
|------|-------|--------|----------|
| Context types | 20 | 2 days | Define context interface |
| Auth session types | 16 | 3 days | Align with schema |
| Tenant types | 8 | 2 days | Define isolation types |

**Total Batch 2**: ~1 week, ⚠️ Requires testing

### Batch 3: Semantic Fixes (High Risk)

| Task | Files | Effort | Approach |
|------|-------|--------|----------|
| CRM service types | 31 | 1 week | Domain expert review |
| Accounting types | 27 | 1 week | Financial validation |
| Inventory types | 24 | 1 week | Stock flow validation |

**Total Batch 3**: ~3 weeks, ❌ Requires domain input

### Batch 4: Prisma Baseline Cleanup (High Effort)

| Task | Files | Effort | Approach |
|------|-------|--------|----------|
| Schema audit | N/A | 3 days | Validate all models |
| Reference fix | ~100 | 2 weeks | Module-by-module |
| Relation alignment | ~50 | 1 week | Schema-guided |

**Total Batch 4**: ~4 weeks, ❌ Requires schema governance

---

## 7. Risk Matrix

| Category | Build Risk | Runtime Risk | Data Risk | Priority |
|----------|------------|--------------|-----------|----------|
| Prisma baseline | None | Medium | Medium | P2 |
| `as any` Prisma casts | None | High | Medium | P1 |
| `as any` other | None | Medium | Low | P3 |
| JSON casts | None | None | None | P4 |

---

## 8. Recommendations

### Immediate (P0)
- ✅ No immediate action required
- Build is stable
- Runtime is functional

### Short Term (P1)
- Address `subscription.ts` audit log casts
- Address `tenant-isolation.ts` model casts
- Create JSON utility function

### Medium Term (P2)
- Module-by-module type strengthening
- CRM, Accounting, Inventory prioritized
- Requires domain expert pairing

### Long Term (P3)
- Full Prisma baseline cleanup
- Requires schema governance decision
- May involve migration strategy

---

## 9. Stop Conditions Observed

During this analysis, the following semantic decisions were identified:

| Decision Point | Location | Owner |
|----------------|----------|-------|
| CRM loyalty tier structure | `crm/loyalty-service.ts` | Product |
| Accounting journal entry types | `accounting/journal-service.ts` | Finance |
| Inventory movement types | `inventory/transfer-service.ts` | Operations |
| Tenant isolation model list | `tenant-isolation.ts` | Platform |

These cannot be resolved without domain input.

---

## 10. Attestation

> **"Phase 4 was conducted in read-only mode.
> No code, schema, configuration, or Git state was modified."**

---

## Appendix: Raw Metrics

```
Total src/lib files: ~200
Files with 'as any': 47
Files with 'as unknown': 12
Total type assertions: 276
Prisma model references: 4,191
Baselined Prisma issues: 1,201
withPrismaDefaults usage: 515 (healthy)
```

---

**END OF PHASE 4 ANALYSIS**
