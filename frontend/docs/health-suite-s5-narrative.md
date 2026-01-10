# Health Suite — S5 Narrative Integration

**Suite**: Health  
**Standard**: Platform Standardisation v2  
**Phase**: S5 — Narrative Integration  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the Narrative Integration for the Health Suite, connecting the demo page to the platform-wide Partner Demo Mode, storylines, and Quick Start system.

---

## 🎭 Demo Mode Integration

### Components Added
- `DemoModeProvider` — Wraps entire demo page
- `DemoOverlay` — Shows when in partner demo mode
- `QuickStartBanner` — Shows for quick start roles

### File Updates
- `/app/health-demo/page.tsx` — Wrapped with Demo Mode

---

## 📖 Storylines Registered

Three storylines created in `/lib/demo/storylines.ts`:

### 1. Clinic Owner / Medical Director (`clinic`)

**Persona**: Clinic Owner, Medical Director, or Healthcare Administrator  
**Duration**: 10 minutes  
**Suites**: Health, Billing  
**Message**: "From patient greeting to prescription, without chaos"

| Step | Title | Key Point |
|------|-------|-----------|
| 1 | Patient Registry | Nigerian demographics, blood group, genotype |
| 2 | Appointments & Walk-ins | Walk-in support for 60%+ of Nigerian clinic visits |
| 3 | Visit Workflow | Track patients from registration to discharge |
| 4 | Clinical Encounters | Vitals, diagnoses (ICD-10), append-only notes |
| 5 | Prescriptions & Lab Orders | Nigerian medication formulary |
| 6 | Billing Facts | Service charges without invoice creation |
| 7 | Commerce Boundary | Health emits facts → Billing handles money |

### 2. Patient / Guardian (`patient`)

**Persona**: Patient, Guardian, or Care Recipient  
**Duration**: 6 minutes  
**Suites**: Health  
**Message**: "Your health records, accessible and transparent"

| Step | Title | Key Point |
|------|-------|-----------|
| 1 | Your Health Profile | Blood group, genotype, allergies in one place |
| 2 | Appointment Booking | Scheduled visits with walk-in support |
| 3 | Visit Transparency | Know your queue position |
| 4 | Clinical Records | Access your diagnosis and notes |
| 5 | Prescriptions | Clear medication instructions |
| 6 | Billing Transparency | Itemized charges, no hidden fees |

### 3. Health Regulator / Auditor (`healthRegulator`)

**Persona**: Health Regulator, Medical Auditor, or Compliance Officer  
**Duration**: 8 minutes  
**Suites**: Health  
**Message**: "Full traceability from registration to outcome"

| Step | Title | Key Point |
|------|-------|-----------|
| 1 | Patient Registry Audit | Complete demographics, unique MRN |
| 2 | Appointment Audit Trail | All visits documented |
| 3 | Clinical Records Integrity | Append-only, immutable records |
| 4 | Diagnosis Traceability | ICD-10 coded diagnoses |
| 5 | Lab Results Immutability | Results cannot be modified |
| 6 | Privacy Compliance | Consent and access controls |
| 7 | Commerce Boundary Audit | Health never handles money |

---

## 🚀 Quick Start Roles

Added to `/lib/demo/quickstart.ts`:

| Role | URL Parameter | Storyline | Description |
|------|---------------|-----------|-------------|
| Clinic Owner | `?quickstart=clinic` | `clinic` | Patient flow → visits → billing facts |
| Patient | `?quickstart=patient` | `patient` | Appointments → encounters → prescriptions |
| Health Regulator | `?quickstart=healthRegulator` | `healthRegulator` | Append-only → privacy → auditability |

### Usage Examples
```
/health-demo?quickstart=clinic
/health-demo?quickstart=patient
/health-demo?quickstart=healthRegulator
```

---

## 📝 Type Updates

Updated `/lib/demo/types.ts`:

```typescript
export type StorylineId = 
  | 'retail' | 'marketplace' | 'sme' | 'full' | 'cfo' | 'regulator' 
  | 'school' | 'parent' 
  | 'clinic' | 'patient' | 'healthRegulator'  // Health Suite
```

---

## 🇳🇬 Nigeria-First Narrative Notes

Each storyline includes Nigeria-specific context:

### Clinic Owner Storyline
- "Walk-in support is critical — most Nigerian clinics handle 60%+ walk-ins"
- "Common Nigerian diagnoses: Malaria, URI, Typhoid, Hypertension"
- "Healthcare is VAT-exempt in Nigeria"

### Patient Storyline
- "Blood group and genotype are critical for Nigerian healthcare"
- "Nigerian dosing conventions: OD, BD, TDS, PRN"
- "Healthcare services are VAT-exempt in Nigeria"

### Regulator Storyline
- "NIN (National ID) support for identity verification"
- "HIPAA-like posture for Nigerian healthcare"
- "Clean separation of clinical and financial concerns"

---

## 🔗 Commerce Boundary Narrative

All three storylines reinforce the Commerce Boundary:

> "The Health Suite emits billing facts only. It never creates invoices, calculates totals, or records payments. Financial logic lives in Commerce."

This is explicitly shown in:
- Clinic Owner Step 7: "Commerce Boundary"
- Regulator Step 7: "Commerce Boundary Audit"

---

## 📁 Files Modified/Created

| File | Change |
|------|--------|
| `/app/health-demo/page.tsx` | Added DemoModeProvider, QuickStartBanner, wrapper pattern |
| `/lib/demo/types.ts` | Added `clinic`, `patient`, `healthRegulator` to StorylineId |
| `/lib/demo/quickstart.ts` | Added 3 Health quick start roles |
| `/lib/demo/storylines.ts` | Added 3 Health storylines (21 steps total) |
| `/docs/health-suite-s5-narrative.md` | This documentation |

---

## ✅ Verification Checklist

| Requirement | Status |
|-------------|--------|
| DemoModeProvider wrapping | ✅ |
| DemoOverlay integration | ✅ |
| QuickStartBanner integration | ✅ |
| Clinic Owner storyline | ✅ (7 steps) |
| Patient storyline | ✅ (6 steps) |
| Health Regulator storyline | ✅ (7 steps) |
| Quick Start roles registered | ✅ (3 roles) |
| StorylineId types updated | ✅ |
| Nigeria-first narrative copy | ✅ |
| Commerce boundary narrative | ✅ |
| Documentation | ✅ |

---

## 🛑 S5 Sign-Off

**Health Suite S5 (Narrative Integration): COMPLETE**

- Demo page wrapped with DemoModeProvider
- 3 storylines registered (21 steps total)
- 3 Quick Start roles available
- Nigeria-first narrative throughout
- Commerce boundary clearly communicated

---

## Next Phase

| Phase | Description | Status |
|-------|-------------|--------|
| S6 | Verification & FREEZE | 🔲 Awaiting authorization |

---

*This document follows Platform Standardisation v2 requirements.*
