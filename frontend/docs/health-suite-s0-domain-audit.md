# Health Suite — S0 Domain Audit

**Suite**: Health  
**Standard**: Platform Standardisation v2  
**Phase**: S0 — Domain Audit  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document defines the Phase 1 scope of the Health Suite, Nigeria-first, with explicit exclusions to prevent regulatory and architectural overreach.

---

## 🎯 In Scope (Phase 1)

### Care Settings

| Setting | Description |
|---------|-------------|
| Clinics | Private and public outpatient facilities |
| Hospitals | Inpatient and outpatient services |
| Diagnostic Centers | Labs, imaging, diagnostic services |
| Primary Care | General practice, family medicine |
| Secondary Care | Specialist consultations |

### Core Domains

| Domain | Description |
|--------|-------------|
| Patient Registry | Demographics, identifiers, status |
| Appointments & Visits | Scheduling, walk-ins, provider assignment |
| Clinical Encounters | Complaints, observations, diagnoses |
| Clinical Notes | Append-only documentation |
| Prescriptions | Facts only (no fulfillment) |
| Diagnostic Orders | Lab/imaging orders and results |
| Billing Facts | Consultation, lab, procedure fees |

---

## 🚫 Explicitly Out of Scope (Phase 2+)

| Exclusion | Reason |
|-----------|--------|
| Telemedicine / Video | Requires real-time infrastructure |
| Insurance Claims (NHIS, HMOs) | Regulatory complexity |
| National Health System Integrations | Government API dependencies |
| Pharmacy Inventory Management | Separate vertical concern |
| Medical Devices / IoT | Hardware integration complexity |
| Clinical Decision Support (CDSS) | AI/ML requirement |

> **Principle**: Health v1 captures facts, not workflows that mutate truth.

---

## 🇳🇬 Nigeria-First Assumptions

| Assumption | Implication |
|------------|-------------|
| Cash-heavy healthcare payments | Support walk-in pay-at-counter flows |
| Walk-in patients common | Don't require pre-registration |
| Mixed digital + paper workflows | Support offline-first patterns |
| Strong need for auditability | Full audit trails mandatory |
| High regulatory sensitivity | Privacy-first defaults |
| VAT-exempt healthcare services | No VAT calculation in Health |
| Privacy-first defaults | HIPAA-like posture, Nigeria context |

### Nigerian Healthcare Demographics

| Field | Values |
|-------|--------|
| Blood Groups | A+, A-, B+, B-, AB+, AB-, O+, O- |
| Genotypes | AA, AS, SS, AC, SC, CC |
| ID Types | NIN, Driver's License, Voter's Card, Passport |
| Payment Methods | Cash, Card/POS, Transfer, HMO/Insurance |
| Phone Prefixes | 080, 081, 090, 070, 091 |

---

## 🔐 Data Integrity Rules

| Rule | Enforcement |
|------|-------------|
| Clinical records are **append-only** | No DELETE operations on clinical data |
| No destructive updates to diagnoses | Use amendments, not overwrites |
| Corrections are additive | New records reference old records |
| Full audit trail mandatory | Every change logged with timestamp and user |

### Immutable Record Types

- Patient demographics (soft-delete only)
- Clinical encounters
- Diagnoses
- Prescriptions
- Lab results
- Clinical notes

### Mutable Record Types (with audit)

- Appointment status
- Visit status
- Patient contact information

---

## ❌ Non-Goals

| Non-Goal | Explanation |
|----------|-------------|
| EMR replacement | Health Suite is not a full Electronic Medical Record system |
| Hospital Management System (HMS) | Not managing beds, wards, or facility operations |
| Billing engine | Health emits facts; Commerce handles billing |
| Regulatory submission tool | Not filing reports to NAFDAC, MDCN, or other bodies |

---

## Commerce Reuse Boundary

```
Health [Care Facts] → Billing [Invoice] → Payments [Collection] → Accounting [Journal]
```

### Health Suite Responsibilities

| Does | Does NOT |
|------|----------|
| ✅ Create consultation fee facts | ❌ Create invoices |
| ✅ Create lab/procedure fee facts | ❌ Calculate totals |
| ✅ Track service delivery | ❌ Apply VAT |
| ✅ Emit billing facts | ❌ Record payments |
| | ❌ Touch accounting journals |

---

## Demo Intent (Declared, Not Built)

### Demo Route

```
/health-demo
```

### Demo Personas

| Persona | Narrative Focus |
|---------|-----------------|
| Doctor | Clinical workflow, encounters, prescriptions |
| Clinic Admin | Patient registration, appointments, billing facts |
| Patient | Appointment booking, results access |
| Regulator / Auditor | Audit trails, compliance verification |

### Quick Start Roles (Planned)

```
?quickstart=doctor
?quickstart=admin
?quickstart=patient
?quickstart=regulator
```

> Narrative integration is mandatory at S5, not now.

---

## 🛑 S0 Sign-Off

**Health Suite S0 Domain Audit: COMPLETE**

| Item | Status |
|------|--------|
| ✅ Care settings defined | Done |
| ✅ Core domains identified | Done |
| ✅ Phase 2+ exclusions documented | Done |
| ✅ Nigeria-First assumptions | Done |
| ✅ Data integrity rules | Done |
| ✅ Commerce boundary declared | Done |
| ✅ Demo intent declared | Done |

---

## Next Phase

| Phase | Description | Status |
|-------|-------------|--------|
| S1 | Capability Mapping | ✅ COMPLETE |
| S2 | Schema & Services | 🔲 Awaiting authorization |

---

*This document follows Platform Standardisation v2 requirements.*
