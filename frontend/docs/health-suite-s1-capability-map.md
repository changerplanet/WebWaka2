# Health Suite — S1 Capability Mapping

**Suite**: Health  
**Standard**: Platform Standardisation v2  
**Phase**: S1 — Capability Mapping  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document maps the Health Suite capabilities identified in S0 to specific modules, services, and data entities. It establishes the foundation for S2 (Schema & Services).

---

## Capability Categories

| Category | Description | Status |
|----------|-------------|--------|
| Patient & Identity | Patient registry, demographics | 🔲 To build |
| Appointments & Visits | Scheduling, walk-ins | 🔲 To build |
| Clinical Encounters | Consultations, observations | 🔲 To build |
| Prescriptions & Orders | Rx facts, lab orders | 🔲 To build |
| Billing Facts | Fee facts → Commerce | 🔲 + ♻️ Commerce |
| Reporting & Audit | History, timelines, logs | 🔲 To build |

---

## 🧍 Patient & Identity

### Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Patient Registry | CRUD for patient records | P0 |
| Demographics | Name, DOB, gender, contact | P0 |
| Nigerian Demographics | Blood group, genotype, NIN | P0 |
| Next-of-Kin | Emergency contact information | P0 |
| Unique Patient Identifiers | MRN, facility-specific IDs | P0 |
| Status Lifecycle | Active, inactive, deceased | P0 |

### Data Entities (Planned)

```
health_patient
├── id (UUID)
├── tenantId
├── mrn (Medical Record Number)
├── firstName, lastName
├── dateOfBirth
├── gender
├── bloodGroup
├── genotype
├── phoneNumber, email
├── address (JSON)
├── nextOfKin (JSON)
├── nationalId (NIN)
├── status (ACTIVE, INACTIVE, DECEASED)
├── createdAt, updatedAt
└── metadata (JSON)
```

---

## 📅 Appointments & Visits

### Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Appointment Scheduling | Book future appointments | P0 |
| Walk-in Visit Capture | Record unscheduled visits | P0 |
| Provider Assignment | Link to doctor/clinician | P0 |
| Visit Status Tracking | Scheduled → Checked-in → In-progress → Completed | P0 |
| Appointment Types | Consultation, follow-up, procedure | P1 |

### Data Entities (Planned)

```
health_appointment
├── id (UUID)
├── tenantId
├── patientId → health_patient
├── providerId → health_provider
├── appointmentDate
├── appointmentTime
├── duration (minutes)
├── type (CONSULTATION, FOLLOW_UP, PROCEDURE)
├── status (SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
├── notes
├── createdAt, updatedAt
└── metadata (JSON)

health_provider
├── id (UUID)
├── tenantId
├── staffId → (optional link to HR)
├── firstName, lastName
├── title (Dr., Nurse, etc.)
├── specialty
├── licenseNumber
├── isActive
├── createdAt, updatedAt
└── metadata (JSON)
```

---

## 🩺 Clinical Encounters

### Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Encounter Records | Per-visit clinical documentation | P0 |
| Chief Complaint | Reason for visit | P0 |
| Observations | Vitals, measurements | P0 |
| Clinical Notes | Append-only documentation | P0 |
| Diagnoses | ICD-10 coded diagnoses (facts only) | P0 |
| Encounter Timeline | Chronological view | P1 |

### Data Integrity

> **CRITICAL**: Encounters are **append-only**. No overwrites allowed.

### Data Entities (Planned)

```
health_encounter
├── id (UUID)
├── tenantId
├── patientId → health_patient
├── providerId → health_provider
├── appointmentId → health_appointment (optional)
├── encounterDate
├── chiefComplaint
├── status (IN_PROGRESS, COMPLETED, AMENDED)
├── createdAt, updatedAt
└── metadata (JSON)

health_vital
├── id (UUID)
├── tenantId
├── encounterId → health_encounter
├── type (BLOOD_PRESSURE, TEMPERATURE, PULSE, WEIGHT, HEIGHT, SPO2)
├── value
├── unit
├── recordedAt
├── recordedBy
└── metadata (JSON)

health_diagnosis
├── id (UUID)
├── tenantId
├── encounterId → health_encounter
├── icdCode (ICD-10)
├── description
├── type (PRIMARY, SECONDARY)
├── status (ACTIVE, RESOLVED, RULED_OUT)
├── diagnosedAt
├── diagnosedBy
└── metadata (JSON)

health_note
├── id (UUID)
├── tenantId
├── encounterId → health_encounter
├── noteType (HISTORY, EXAMINATION, ASSESSMENT, PLAN, PROGRESS)
├── content (TEXT)
├── authorId
├── createdAt
└── metadata (JSON)
```

> Notes are **append-only**. Amendments create new notes referencing the original.

---

## 💊 Prescriptions & Orders

### Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Prescription Facts | Record Rx (no fulfillment) | P0 |
| Lab / Diagnostic Orders | Order tests (no fulfillment) | P0 |
| Diagnostic Results | Record results (no interpretation) | P0 |
| Result Timestamps | Provenance tracking | P0 |

### Commerce Boundary

> **CRITICAL**: Health emits facts. Fulfillment is external.
> - Prescriptions are **facts** — pharmacy fulfillment is NOT in scope
> - Lab orders are **facts** — lab processing is NOT in scope

### Data Entities (Planned)

```
health_prescription
├── id (UUID)
├── tenantId
├── encounterId → health_encounter
├── patientId → health_patient
├── medication (name)
├── dosage
├── frequency
├── duration
├── quantity
├── instructions
├── prescribedBy
├── prescribedAt
├── status (ACTIVE, DISPENSED, CANCELLED)
├── createdAt
└── metadata (JSON)

health_lab_order
├── id (UUID)
├── tenantId
├── encounterId → health_encounter
├── patientId → health_patient
├── testName
├── testCode
├── urgency (ROUTINE, URGENT, STAT)
├── orderedBy
├── orderedAt
├── status (ORDERED, COLLECTED, PROCESSING, COMPLETED, CANCELLED)
├── createdAt, updatedAt
└── metadata (JSON)

health_lab_result
├── id (UUID)
├── tenantId
├── labOrderId → health_lab_order
├── resultValue
├── unit
├── referenceRange
├── interpretation (NORMAL, ABNORMAL, CRITICAL)
├── resultedAt
├── resultedBy
├── createdAt
└── metadata (JSON)
```

---

## 💰 Billing Facts (Commerce Boundary)

### Capabilities

| Capability | Commerce Reuse | Priority |
|------------|----------------|----------|
| Consultation Fee Facts | → Billing | P0 |
| Procedure Fee Facts | → Billing | P0 |
| Diagnostic Fee Facts | → Billing | P0 |

### Critical Rule

**Health NEVER:**
- ❌ Calculates totals
- ❌ Applies VAT
- ❌ Issues invoices
- ❌ Records payments
- ❌ Touches journals

### Canonical Flow

```
Health [Care Facts] → Billing [Invoice] → Payments [Collection] → Accounting [Journal]
```

### Data Entities (Planned)

```
health_fee_fact
├── id (UUID)
├── tenantId
├── encounterId → health_encounter
├── patientId → health_patient
├── feeType (CONSULTATION, PROCEDURE, LAB, IMAGING)
├── description
├── amount (NGN)
├── quantity
├── providerId → health_provider
├── serviceDate
├── status (PENDING, BILLED, WAIVED)
├── billingReference (link to Commerce invoice)
├── createdAt
└── metadata (JSON)
```

> Fee facts are **emitted** to Commerce Billing. Health does not own money.

---

## 📊 Reporting & Audit

### Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Patient History | Complete care timeline | P0 |
| Encounter Timelines | Chronological encounters | P0 |
| Clinical Audit Trails | Change tracking | P0 |
| Provider Activity Logs | Who did what, when | P1 |

### Audit Requirements

| Event | Logged |
|-------|--------|
| Patient created | ✅ |
| Patient updated | ✅ |
| Encounter created | ✅ |
| Diagnosis added | ✅ |
| Prescription created | ✅ |
| Lab order created | ✅ |
| Lab result recorded | ✅ |
| Fee fact emitted | ✅ |

---

## 🔁 Commerce Reuse Boundary (MANDATORY)

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEALTH SUITE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Patient  │  │Encounter │  │Diagnosis │  │ Orders   │        │
│  │ Registry │  │  Records │  │  Facts   │  │  Facts   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                         │                                        │
│                         ▼                                        │
│                  ┌──────────────┐                                │
│                  │  Fee Facts   │                                │
│                  └──────┬───────┘                                │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COMMERCE SUITE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ Billing  │→ │ Payments │→ │Accounting│                       │
│  │ (Invoice)│  │(Collect) │  │ (Journal)│                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Boundary Rules

| Health CAN | Health CANNOT |
|------------|---------------|
| ✅ Create fee facts | ❌ Create invoices |
| ✅ Track service delivery | ❌ Calculate totals |
| ✅ Reference billing IDs | ❌ Apply VAT |
| ✅ Query payment status | ❌ Record payments |
| | ❌ Touch journals |

---

## 🎭 Demo Intent (S5 Preparation)

### Storylines (Planned)

| Storyline | Persona | Key Message |
|-----------|---------|-------------|
| Doctor | Clinician | "From patient greeting to prescription, without paperwork chaos" |
| Clinic Admin | Administrator | "Know your patients, appointments, and billing facts at a glance" |
| Patient | Care recipient | "Your health records, accessible and transparent" |
| Regulator | Auditor | "Full traceability from registration to clinical outcome" |

### Quick Start Roles (Planned)

```
?quickstart=doctor    → Doctor storyline
?quickstart=admin     → Clinic Admin storyline
?quickstart=patient   → Patient storyline
?quickstart=regulator → Regulator storyline
```

---

## 🇳🇬 Nigerian Healthcare Context

### Common Scenarios

| Scenario | Health Suite Support |
|----------|---------------------|
| Walk-in patient | Rapid registration + encounter |
| Cash payment | Fee fact → immediate billing |
| HMO patient | Fee fact + HMO reference |
| Referral | Inter-provider encounter linking |
| Chronic care | Multi-encounter patient timeline |

### Nigerian Medical Standards

| Standard | Support |
|----------|---------|
| ICD-10 coding | Diagnosis capture |
| Nigerian blood groups | Patient demographics |
| Nigerian genotypes | Patient demographics |
| MDCN license numbers | Provider registry |

---

## 🛑 S1 Sign-Off

**Health Suite S1 Capability Mapping: COMPLETE**

| Item | Status |
|------|--------|
| ✅ Patient & Identity mapped | Done |
| ✅ Appointments & Visits mapped | Done |
| ✅ Clinical Encounters mapped | Done |
| ✅ Prescriptions & Orders mapped | Done |
| ✅ Billing Facts mapped | Done |
| ✅ Reporting & Audit mapped | Done |
| ✅ Commerce boundary documented | Done |
| ✅ Demo intent declared | Done |

---

## S0–S1 Complete

**No schema, services, APIs, or UI were created.**

Rules strictly followed.

---

## Next Phase

| Phase | Description | Status |
|-------|-------------|--------|
| S2 | Schema & Services | 🔲 Awaiting authorization |
| S3 | API Layer | 🔲 Blocked on S2 |
| S4 | Demo UI + Nigerian Data | 🔲 Blocked on S3 |
| S5 | Narrative Integration | 🔲 Blocked on S4 |
| S6 | Verification & FREEZE | 🔲 Blocked on S5 |

---

*This document follows Platform Standardisation v2 requirements.*
