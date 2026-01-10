# Phase 3.1 — Quick Start v0 (S1 Implementation)

**Completed**: January 7, 2026  
**Status**: S1 Complete — Ready for S2-S3 Polish

---

## Executive Summary

Quick Start v0 enables role-based demo entry via URL parameter. Visitors can jump directly into a tailored demo experience without navigating through the storyline selector.

> "The demo should adapt to the visitor, not the other way around."

---

## Implementation

### Entry URLs

| Role | URL | Auto-Storyline |
|------|-----|----------------|
| Partner | `/commerce-demo?quickstart=partner` | Retail Business in Lagos |
| Investor | `/commerce-demo?quickstart=investor` | Full Tour |
| CFO | `/commerce-demo?quickstart=cfo` | CFO / Finance Story |
| Regulator | `/commerce-demo?quickstart=regulator` | Regulator / Auditor Story |
| Founder | `/commerce-demo?quickstart=founder` | SME with Invoicing + Accounting |
| Retail | `/commerce-demo?quickstart=retail` | Retail Business in Lagos |
| Marketplace | `/commerce-demo?quickstart=marketplace` | Marketplace Operator |

### What Happens Automatically

1. **URL Parsed**: `?quickstart=` parameter is extracted
2. **Role Resolved**: Mapped to a storyline via `resolveQuickStart()`
3. **Demo Mode Activated**: `startStoryline()` is called automatically
4. **Banner Displayed**: Shows role context with escape options
5. **Navigation Begins**: User is taken to step 1 of the storyline

### User Controls

- **Switch Role**: Returns to storyline selector (keeps demo mode)
- **Exit Demo**: Exits demo mode entirely, returns to portal

---

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `/lib/demo/quickstart.ts` | Role → Storyline resolver logic |
| `/components/demo/QuickStartBanner.tsx` | Context banner with escape actions |
| `/docs/phase3-quickstart-s1.md` | This documentation |

### Modified Files

| File | Changes |
|------|---------|
| `/lib/demo/index.ts` | Added quickstart exports |
| `/components/demo/index.ts` | Added QuickStartBanner export |
| `/app/commerce-demo/page.tsx` | Integrated QuickStart resolver |

---

## Technical Specification

### QuickStartResolver

```typescript
// Input: URL parameter value
// Output: Resolved config or inactive state

interface QuickStartResult {
  isActive: boolean
  config: QuickStartConfig | null
  originalRole: string | null
}

interface QuickStartConfig {
  storylineId: StorylineId
  roleLabel: string
  roleDescription: string
}

function resolveQuickStart(param: string | null): QuickStartResult
```

### Role Mappings

```typescript
const ROLE_MAPPINGS = {
  partner:     { storylineId: 'retail',    roleLabel: 'Partner' },
  investor:    { storylineId: 'full',      roleLabel: 'Investor' },
  cfo:         { storylineId: 'cfo',       roleLabel: 'CFO / Finance' },
  regulator:   { storylineId: 'regulator', roleLabel: 'Regulator / Auditor' },
  founder:     { storylineId: 'sme',       roleLabel: 'Founder / SME Owner' },
  retail:      { storylineId: 'retail',    roleLabel: 'Retail Business' },
  marketplace: { storylineId: 'marketplace', roleLabel: 'Marketplace Operator' }
}
```

---

## Guardrails (Enforced)

| Guardrail | Status |
|-----------|--------|
| ❌ No cookies | ✅ Enforced |
| ❌ No tracking | ✅ Enforced |
| ❌ No persistence | ✅ Enforced |
| ✅ URL-only state | ✅ Enforced |
| ✅ Escapable in one click | ✅ Enforced |
| ✅ Manual override allowed | ✅ Enforced |
| ✅ Invalid role → Selector | ✅ Enforced |

---

## Banner UX

### Banner Copy
```
You're viewing the platform as a [Role Label]
[Role Description]
```

### Example (CFO)
```
You're viewing the platform as a CFO / Finance
Financial correctness, traceability, and compliance

[Switch Role] [X]
```

---

## Fail-Safe Behavior

| Scenario | Behavior |
|----------|----------|
| No `?quickstart=` param | Normal portal, no auto-start |
| Unknown role (e.g., `?quickstart=hacker`) | Ignored, falls back to selector |
| Valid role + already in demo | Banner shown, storyline activated |
| User clicks "Switch Role" | Returns to storyline selector |
| User clicks "X" (dismiss) | Exits demo mode entirely |

---

## Testing Checklist

| Test | Expected | Status |
|------|----------|--------|
| `/commerce-demo?quickstart=cfo` | Auto-starts CFO storyline | ✅ PASS |
| `/commerce-demo?quickstart=investor` | Auto-starts Full Tour | ✅ PASS |
| `/commerce-demo?quickstart=invalid` | Shows storyline selector | ✅ PASS |
| Banner "Switch Role" button | Returns to selector | ✅ PASS |
| Banner "X" button | Exits demo mode | ✅ PASS |

---

## Verification Screenshots

- `/tmp/quickstart_cfo2.png` - CFO role auto-navigates to Billing Demo
- `/tmp/quickstart_investor.png` - Investor role shows QuickStartBanner + Full Tour
- `/tmp/quickstart_invalid.png` - Invalid role falls back to normal portal

---

## S2-S3 Remaining (Not Authorized Yet)

- Visual polish of banner
- Confirmation modal before auto-start (optional)
- Analytics-free event logging (optional)
- FREEZE declaration

---

## Document References

- `/app/frontend/src/lib/demo/quickstart.ts`
- `/app/frontend/src/components/demo/QuickStartBanner.tsx`
- `/app/frontend/src/app/commerce-demo/page.tsx`

---

*This document serves as the S1 completion record for Phase 3.1 Quick Start v0.*
