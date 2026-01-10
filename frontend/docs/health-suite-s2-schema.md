# Health Suite — S2 Schema Documentation

**Suite**: Health  
**Standard**: Platform Standardisation v2  
**Phase**: S2 — Schema & Services  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document describes the Prisma schema for the Health Suite. All tables are additive (`health_*` prefix) and follow Platform Standardisation v2 requirements.

---

## Schema Summary

| Model | Description | Records |
|-------|-------------|---------|
| `health_facility` | Clinics, hospitals, diagnostic centers | Mutable |
| `health_provider` | Doctors, nurses, staff | Mutable |
| `health_patient` | Patient registry | Mutable (non-clinical) |
| `health_patient_guardian` | Guardians for minors | Mutable |
| `health_appointment` | Scheduled appointments | Mutable |
| `health_visit` | Patient visits (scheduled + walk-in) | Mutable |
| `health_encounter` | Clinical encounters | **APPEND-ONLY** |
| `health_note` | Clinical notes | **IMMUTABLE** |
| `health_diagnosis` | Diagnoses (ICD-10) | **APPEND-ONLY** |
| `health_prescription` | Prescription facts | **APPEND-ONLY** |
| `health_lab_order` | Lab/diagnostic orders | Mutable (status only) |
| `health_lab_result` | Lab results | **IMMUTABLE** |
| `health_billing_fact` | Billing facts → Commerce | Mutable (status only) |
| `health_config` | Tenant configuration | Mutable |

---

## Enums

### Patient Status
```prisma
enum HealthPatientStatus {
  ACTIVE
  INACTIVE
  DECEASED
  TRANSFERRED
}
```

### Gender
```prisma
enum HealthGender {
  MALE
  FEMALE
  OTHER
}
```

### Blood Groups (Nigerian Context)
```prisma
enum HealthBloodGroup {
  A_POSITIVE, A_NEGATIVE
  B_POSITIVE, B_NEGATIVE
  AB_POSITIVE, AB_NEGATIVE
  O_POSITIVE, O_NEGATIVE
  UNKNOWN
}
```

### Genotypes (Nigerian Context)
```prisma
enum HealthGenotype {
  AA, AS, SS, AC, SC, CC, UNKNOWN
}
```

### Facility Types
```prisma
enum HealthFacilityType {
  CLINIC
  HOSPITAL
  DIAGNOSTIC_CENTER
  PHARMACY
  LABORATORY
  IMAGING_CENTER
}
```

### Provider Roles
```prisma
enum HealthProviderRole {
  DOCTOR, NURSE, PHARMACIST
  LAB_TECHNICIAN, RADIOLOGIST
  RECEPTIONIST, ADMIN, CONSULTANT
}
```

### Appointment Status
```prisma
enum HealthAppointmentStatus {
  SCHEDULED, CONFIRMED, CHECKED_IN
  IN_PROGRESS, COMPLETED
  CANCELLED, NO_SHOW, RESCHEDULED
}
```

### Encounter Status
```prisma
enum HealthEncounterStatus {
  IN_PROGRESS
  COMPLETED
  AMENDED
}
```

### Billing Fact Types
```prisma
enum HealthBillingFactType {
  CONSULTATION
  PROCEDURE
  LAB_TEST
  IMAGING
  MEDICATION
  SUPPLIES
  ADMISSION
  OTHER
}
```

---

## Core Models

### health_facility

Represents a healthcare facility (clinic, hospital, diagnostic center).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key (CUID) |
| `tenantId` | String | Tenant isolation |
| `name` | String | Facility name |
| `code` | String? | Internal code |
| `type` | HealthFacilityType | Facility type |
| `phone` | String? | Contact phone |
| `email` | String? | Contact email |
| `address` | Json? | Address object |
| `location` | Json? | GPS coordinates |
| `operatingHours` | Json? | Operating hours |
| `isActive` | Boolean | Active status |

### health_provider

Represents a healthcare provider (doctor, nurse, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `tenantId` | String | Tenant isolation |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `title` | String? | Title (Dr., Nurse) |
| `role` | HealthProviderRole | Provider role |
| `specialty` | String? | Medical specialty |
| `licenseNumber` | String? | MDCN/Nursing license |
| `facilityId` | String? | Primary facility |
| `isActive` | Boolean | Active status |

### health_patient

Patient registry with privacy-first design.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `tenantId` | String | Tenant isolation |
| `mrn` | String | Medical Record Number |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `dateOfBirth` | DateTime? | Date of birth |
| `gender` | HealthGender? | Gender |
| `bloodGroup` | HealthBloodGroup | Blood group |
| `genotype` | HealthGenotype | Genotype (Nigerian) |
| `phone` | String? | Contact phone |
| `nationalId` | String? | NIN |
| `nextOfKin` | Json? | Emergency contact |
| `allergies` | Json? | Known allergies |
| `conditions` | Json? | Chronic conditions |
| `status` | HealthPatientStatus | Patient status |

**Unique Constraint**: `(tenantId, mrn)`

---

## Clinical Models (APPEND-ONLY)

### health_encounter

Clinical encounter documentation. **APPEND-ONLY** - cannot be deleted.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `visitId` | String | FK → health_visit |
| `patientId` | String | FK → health_patient |
| `providerId` | String | FK → health_provider |
| `vitals` | Json? | Vital signs snapshot |
| `status` | HealthEncounterStatus | IN_PROGRESS → COMPLETED → AMENDED |
| `completedAt` | DateTime? | Completion timestamp |
| `amendedAt` | DateTime? | Amendment timestamp |
| `amendmentReason` | String? | Reason for amendment |

**Audit Rules**:
- Cannot be deleted
- Can only progress status (IN_PROGRESS → COMPLETED → AMENDED)
- Amendments create audit trail

### health_note

Clinical notes. **IMMUTABLE** after creation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `encounterId` | String | FK → health_encounter |
| `noteType` | HealthNoteType | Note type |
| `content` | Text | Full note content |
| `authorId` | String | Provider who wrote |
| `authorName` | String | Denormalized name |
| `amendsNoteId` | String? | If this amends another note |
| `createdAt` | DateTime | Creation timestamp |

**Note Types**: CHIEF_COMPLAINT, HISTORY, EXAMINATION, ASSESSMENT, PLAN, PROGRESS, PROCEDURE, DISCHARGE, AMENDMENT

**Audit Rules**:
- Cannot be edited or deleted
- Corrections create new AMENDMENT note

### health_diagnosis

Diagnosis records. **APPEND-ONLY**.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `encounterId` | String | FK → health_encounter |
| `icdCode` | String? | ICD-10 code |
| `description` | String | Diagnosis text |
| `type` | HealthDiagnosisType | PRIMARY, SECONDARY, DIFFERENTIAL |
| `status` | HealthDiagnosisStatus | ACTIVE, RESOLVED, CHRONIC |
| `diagnosedAt` | DateTime | When diagnosed |
| `diagnosedBy` | String | Provider ID |
| `resolvedAt` | DateTime? | When resolved |

### health_lab_result

Lab results. **IMMUTABLE** after creation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `labOrderId` | String | FK → health_lab_order |
| `parameterName` | String | Result parameter |
| `resultValue` | String | Result value |
| `unit` | String? | Unit of measure |
| `referenceRange` | String? | Normal range |
| `interpretation` | HealthResultInterpretation | NORMAL, ABNORMAL, CRITICAL |
| `resultedAt` | DateTime | When resulted |
| `verifiedAt` | DateTime? | When verified |

---

## Commerce Boundary

### health_billing_fact

Billing facts emitted to Commerce. **CRITICAL: Commerce reuse boundary**.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `patientId` | String | FK → health_patient |
| `visitId` | String? | FK → health_visit |
| `encounterId` | String? | FK → health_encounter |
| `factType` | HealthBillingFactType | Type of service |
| `description` | String | Service description |
| `amount` | Decimal | Unit amount (NGN) |
| `quantity` | Int | Quantity |
| `status` | HealthBillingFactStatus | PENDING, BILLED, WAIVED |
| `billingInvoiceId` | String? | Commerce invoice ref |
| `billedAt` | DateTime? | When billed |

**Commerce Rules**:
- Health ONLY creates facts
- Commerce Billing creates invoices
- Health does NOT calculate totals
- Health does NOT apply VAT (healthcare is VAT-exempt)

---

## Nigeria-First Design

### Demographics
- Blood groups: Nigerian standard set
- Genotypes: AA, AS, SS, AC, SC, CC (sickle cell context)
- National ID: NIN support

### Healthcare Context
- Walk-in support (common in Nigeria)
- Cash-heavy payment context
- VAT-exempt healthcare
- Privacy-first (minimal PII)

### ID Formats
- MRN: `MRN-{YEAR}-{SEQUENCE}` (e.g., MRN-2026-00001)
- Visit: `VST-{YYYYMMDD}-{SEQUENCE}` (e.g., VST-20260107-0001)

---

## Data Integrity Guarantees

| Record Type | Can Edit | Can Delete | Corrections |
|-------------|----------|------------|-------------|
| Facility | ✅ | ❌ (soft) | Direct edit |
| Provider | ✅ | ❌ (soft) | Direct edit |
| Patient (non-clinical) | ✅ | ❌ (soft) | Direct edit |
| Appointment | ✅ (status) | ❌ | Cancel/reschedule |
| Visit | ✅ (status) | ❌ | Status progression |
| Encounter | ❌ | ❌ | Amendment only |
| Note | ❌ | ❌ | New note with amendsNoteId |
| Diagnosis | ❌ (status only) | ❌ | Resolve, don't delete |
| Prescription | ❌ (status only) | ❌ | Cancel, don't delete |
| Lab Order | ✅ (status) | ❌ | Cancel, don't delete |
| Lab Result | ❌ | ❌ | Cannot modify |
| Billing Fact | ✅ (status) | ❌ | Waive/cancel |

---

## Indexes

All models include standard indexes:
- `tenantId` (tenant isolation)
- `platformInstanceId` (multi-instance)
- Foreign keys
- Status fields
- Date fields for range queries

---

## 🛑 S2 Schema Sign-Off

**Health Suite S2 Schema: COMPLETE**

| Item | Status |
|------|--------|
| ✅ All `health_*` tables created | 14 models |
| ✅ All enums defined | 16 enums |
| ✅ Append-only enforcement | Notes, Diagnoses, Results |
| ✅ Commerce boundary documented | Billing facts only |
| ✅ Nigeria-first design | Blood groups, genotypes, VAT-exempt |
| ✅ Prisma validates successfully | Verified |

---

*This document follows Platform Standardisation v2 requirements.*
