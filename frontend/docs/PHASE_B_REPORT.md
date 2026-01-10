# Phase B: AST-Based Remediation Report

**Mode:** LIVE
**Date:** 2026-01-10T12:27:58.531Z

## Summary

| Metric | Count |
|--------|-------|
| Files Scanned | 392 |
| Files Modified | 22 |
| Total Transforms | 38 |
| Ambiguous Cases | 4 |

## Modified Files

- `lib/billing/event-service.ts`
- `lib/capabilities/activation-service.ts`
- `lib/civic/services/audit-service.ts`
- `lib/crm/loyalty-service.ts`
- `lib/education/demo-data.ts`
- `lib/entitlements.ts`
- `lib/health/demo-data.ts`
- `lib/hospitality/services/guest-service.ts`
- `lib/hospitality/services/order-service.ts`
- `lib/hospitality/services/reservation-service.ts`
- `lib/hospitality/services/stay-service.ts`
- `lib/hr/attendance-service.ts`
- `lib/hr/employee-service.ts`
- `lib/hr/leave-service.ts`
- `lib/hr/payroll-service.ts`
- `lib/integrations/config-service.ts`
- `lib/integrations/instance-service.ts`
- `lib/partner/onboarding-service.ts`
- `lib/partner-tenant-creation.ts`
- `lib/payments/config-service.ts`
- `lib/payout-readiness.ts`
- `lib/procurement/supplier-service.ts`

## Ambiguous Cases (Not Modified)

- `lib/crm/segmentation-service.ts:474` - createMany.data is not an array literal
- `lib/partner/config-service.ts:82` - Data value is not an object literal (may be spread or variable)
- `lib/project-management/budget-service.ts:332` - createMany.data is not an array literal
- `lib/real-estate/rent-schedule-service.ts:353` - createMany.data is not an array literal

## Transformation Applied

All .create() calls with object literal data were wrapped:

```typescript
// BEFORE
await prisma.model.create({
  data: { field1, field2 }
})

// AFTER
await prisma.model.create({
  data: withPrismaDefaults({ field1, field2 }) // AUTO-FIX: required by Prisma schema
})
```

## Prohibited Actions Confirmation

- ❌ No sed/regex replacements used
- ❌ No manual file edits
- ❌ No compiler-output-driven fixes
- ✅ All transforms via TypeScript AST
- ✅ All transforms are deterministic and idempotent

---
END OF REPORT
