# Education Suite — S5 Narrative Integration

**Suite**: Education  
**Standard**: Platform Standardisation v2  
**Phase**: S5 — Narrative Integration  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

S5 integrates the Education Suite into the platform's narrative layer, making it:
- Demo Mode–compliant
- Quick Start–compatible
- Storyline-addressable
- Ready for FREEZE in S6

---

## Demo Mode Integration

### DemoModeProvider

The `/education-demo` page is wrapped with `DemoModeProvider`:

```tsx
export default function EducationDemoPortal() {
  return (
    <Suspense fallback={...}>
      <DemoModeProvider>
        <EducationDemoWrapper />
      </DemoModeProvider>
    </Suspense>
  )
}
```

### DemoOverlay

The `DemoOverlay` component is rendered when the page is accessed in Partner Demo Mode:
- Top banner showing storyline name and progress
- Bottom tooltip showing step narrative
- Navigation controls (Back, Next, Exit)

### Exit Demo Behavior

Clicking "Exit Demo" safely returns users to `/commerce-demo` (the main commerce demo portal).

---

## Quick Start Compatibility

### Registered Roles

| Role | Storyline | Description |
|------|-----------|-------------|
| `school` | School Owner | From enrollment to accounting, without chaos |
| `parent` | Parent / Guardian | Know what you owe and what your child achieved |

### URL Format

```
/education-demo?quickstart=school
/education-demo?quickstart=parent
```

### Behavior

| Scenario | Result |
|----------|--------|
| Valid role (`school`, `parent`) | Banner displays with role-specific messaging |
| Invalid role | Fails safely — no banner, page renders normally |
| No quickstart param | Normal page render |

### QuickStartBanner Features

- Role-specific icon and gradient
- Role-specific tagline
- "Copy Link" button (shares demo URL)
- "Switch Role" button (navigates to role selector)
- "X" dismiss button (clears URL param)
- Keyboard escape support (Esc key dismisses banner)

---

## Storyline Registration

### Storyline A — School Owner

**ID**: `school`  
**Persona**: School Founder, Proprietor, or Principal  
**Duration**: ~10 minutes  
**Narrative Focus**: "From enrollment to accounting, without chaos"

| Step | Title | Suite | Key Message |
|------|-------|-------|-------------|
| 1 | Student Registry | Education | Nigerian demographics, guardian contacts, admission workflow |
| 2 | Academic Structure | Education | 3-term calendar, JSS/SS classes, curriculum subjects |
| 3 | Attendance Discipline | Education | Daily marking, backfill, parent notifications |
| 4 | Assessment & Results | Education | 40% CA + 60% Exam, A-F grades, class positions |
| 5 | Fee Management | Education | Tuition, installments, VAT-exempt |
| 6 | Commerce Integration | Billing | Fee facts → Billing → Payments → Accounting |

---

### Storyline B — Parent / Guardian

**ID**: `parent`  
**Persona**: Parent, Guardian, or Sponsor  
**Duration**: ~6 minutes  
**Narrative Focus**: "Know what you owe and what your child achieved"

| Step | Title | Suite | Key Message |
|------|-------|-------|-------------|
| 1 | Student Profile | Education | Class assignment, enrollment status, guardian info |
| 2 | Attendance Confidence | Education | Real-time attendance records |
| 3 | Academic Results | Education | CA + Exam scores, grade conversion |
| 4 | Fee Transparency | Education | Fee breakdown, installments, NGN amounts |
| 5 | Report Cards | Education | Professional reports, teacher remarks |

---

## Demo Compliance Checklist (v2)

| Requirement | Status |
|-------------|--------|
| ✅ `/education-demo` renders inside Demo Mode | Done |
| ✅ Responds to `?quickstart=[role]` | Done |
| ✅ Participates in 2 storylines | Done (school, parent) |
| ✅ No destructive writes in demo | Done (read-only API calls) |
| ✅ Clear demo / derived notices | Done ("Demo Data Mode" banner) |

---

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `/lib/demo/types.ts` | Updated | Added `school`, `parent` to StorylineId |
| `/lib/demo/quickstart.ts` | Updated | Added `school`, `parent` roles with mappings |
| `/lib/demo/storylines.ts` | Updated | Added `schoolOwnerStoryline`, `parentGuardianStoryline` |
| `/components/demo/QuickStartBanner.tsx` | Updated | Added School Owner, Parent/Guardian messaging |
| `/app/education-demo/page.tsx` | Updated | Wrapped with DemoModeProvider, added QuickStart handling |

---

## Nigeria-First Narrative Elements

Both storylines emphasize Nigeria-first design:

- **Names**: Nigerian name formats throughout
- **Demographics**: State of origin, genotype, blood group
- **Calendar**: 3-term academic year (First, Second, Third Term)
- **Structure**: JSS 1-3, SS 1-3 classes
- **Grading**: A-F scale, 40% CA + 60% Exam
- **Currency**: NGN (Nigerian Naira), VAT-exempt education
- **Fees**: Tuition ₦150,000/term, installment support

---

## Demo Mode Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| No data mutation | API calls are read-only (GET requests) |
| No side effects | No notifications sent, no background jobs |
| Tenant-scoped | All demo data is `demo-school` tenant only |
| Resettable | Demo data can be re-seeded via API |
| Commerce boundary | Education emits fee facts only, no money handling |

---

## S5 Sign-Off

**S5 Narrative Integration: COMPLETE**

Education Suite S5 is complete under Platform Standardisation v2.

### Verification Checklist

| Item | Status |
|------|--------|
| ✅ DemoModeProvider wraps page | Done |
| ✅ DemoOverlay renders in Partner Mode | Done |
| ✅ Quick Start roles registered | Done |
| ✅ 2 storylines implemented | Done |
| ✅ Invalid quickstart fails safely | Done |
| ✅ Exit Demo returns to `/commerce-demo` | Done |
| ✅ Documentation complete | Done |

---

## Next Steps (Require Authorization)

| Phase | Description | Status |
|-------|-------------|--------|
| S6 | Verification & FREEZE | 🔲 Awaiting authorization |

---

## 🛑 STOP POINT

Education Suite S5 is complete.

**Awaiting explicit authorization to proceed with S6 (Verification & FREEZE).**

---

*This document follows Platform Standardisation v2 requirements.*
