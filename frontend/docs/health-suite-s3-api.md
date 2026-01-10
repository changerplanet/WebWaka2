# Health Suite — S3 API Layer

**Suite**: Health  
**Standard**: Platform Standardisation v2  
**Phase**: S3 — API Layer  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the API layer for the Health Suite, implementing capability-guarded endpoints for all domain services defined in S2.

---

## 🔐 Security & Guards

### Authentication

All endpoints require authentication via `getCurrentSession()`.

| Response | Condition |
|----------|-----------|
| `401 Unauthorized` | No session or no active tenant |
| `403 Forbidden` | Tenant does not have `health` capability enabled |

### Capability Guard

Every API route enforces:

```typescript
const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
if (guardResult) return guardResult
```

---

## 📋 API Routes

### Main Configuration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Get config/stats |
| `/api/health` | POST | Initialize health suite |

#### GET /api/health

Query params:
- `action=config` — Get health configuration (default)
- `action=stats` — Get health statistics

#### POST /api/health

Body:
```json
{
  "action": "initialize",
  "facilityName": "My Clinic",
  "facilityType": "CLINIC",
  "defaultAppointmentDuration": 30,
  "allowWalkIns": true
}
```

---

### Patients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/patients` | GET | List patients or get by ID/MRN |
| `/api/health/patients` | POST | Create patient |
| `/api/health/patients` | PATCH | Update patient (non-clinical) |

#### GET /api/health/patients

Query params:
- `id` — Get single patient by ID
- `mrn` — Get single patient by MRN
- `search` — Search by name, MRN, or phone
- `status` — Filter by status (ACTIVE, INACTIVE, DECEASED)
- `gender` — Filter by gender
- `page`, `limit` — Pagination

#### POST /api/health/patients

Required fields: `firstName`, `lastName`

Body:
```json
{
  "firstName": "Chukwuemeka",
  "lastName": "Okonkwo",
  "dateOfBirth": "1985-03-15",
  "gender": "MALE",
  "bloodGroup": "O_POSITIVE",
  "genotype": "AA",
  "phone": "+2348012345678"
}
```

#### PATCH /api/health/patients

Required: `id`

Allowed fields: `firstName`, `lastName`, `middleName`, `dateOfBirth`, `gender`, `bloodGroup`, `genotype`, `phone`, `email`, `address`, `nationalId`, `nextOfKin`, `status`

---

### Guardians

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/guardians` | GET | List guardians |
| `/api/health/guardians` | POST | Add guardian to patient |
| `/api/health/guardians` | PATCH | Update guardian |
| `/api/health/guardians` | DELETE | Remove guardian |

#### GET /api/health/guardians

Query params:
- `id` — Get single guardian
- `patientId` — Get all guardians for a patient
- `page`, `limit` — Pagination

#### POST /api/health/guardians

Required: `patientId`, `fullName`, `relationship`, `phone`

Body:
```json
{
  "patientId": "uuid",
  "fullName": "Ngozi Okonkwo",
  "relationship": "Spouse",
  "phone": "+2348098765432",
  "isPrimaryContact": true,
  "canAuthorize": true
}
```

---

### Providers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/providers` | GET | List providers |
| `/api/health/providers` | POST | Create provider |
| `/api/health/providers` | PATCH | Update provider |

#### GET /api/health/providers

Query params:
- `id` — Get single provider
- `role` — Filter by role (DOCTOR, NURSE, etc.)
- `facilityId` — Filter by facility
- `specialty` — Filter by specialty
- `page`, `limit` — Pagination

#### POST /api/health/providers

Required: `firstName`, `lastName`, `role`

Body:
```json
{
  "firstName": "Adaeze",
  "lastName": "Nwosu",
  "title": "Dr.",
  "role": "DOCTOR",
  "specialty": "General Practice",
  "licenseNumber": "MDCN/12345"
}
```

---

### Facilities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/facilities` | GET | List facilities |
| `/api/health/facilities` | POST | Create facility |
| `/api/health/facilities` | PATCH | Update facility |

#### GET /api/health/facilities

Query params:
- `id` — Get single facility
- `type` — Filter by type (CLINIC, HOSPITAL, etc.)
- `page`, `limit` — Pagination

#### POST /api/health/facilities

Required: `name`, `type`

Body:
```json
{
  "name": "City Medical Centre",
  "type": "CLINIC",
  "address": {
    "street": "15 Marina Road",
    "city": "Lagos",
    "state": "Lagos"
  }
}
```

---

### Appointments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/appointments` | GET | List appointments |
| `/api/health/appointments` | POST | Create appointment (scheduled or walk-in) |
| `/api/health/appointments` | PATCH | Update appointment status |

#### GET /api/health/appointments

Query params:
- `id` — Get single appointment
- `action=today&providerId=uuid` — Get today's schedule for provider
- `patientId`, `providerId`, `facilityId` — Filter by entity
- `status` — Filter by status
- `dateFrom`, `dateTo` — Date range
- `page`, `limit` — Pagination

#### POST /api/health/appointments

Required: `patientId`, `appointmentDate`

Body:
```json
{
  "patientId": "uuid",
  "providerId": "uuid",
  "appointmentDate": "2026-01-15",
  "appointmentTime": "09:00",
  "duration": 30,
  "type": "CONSULTATION",
  "isWalkIn": false,
  "reason": "Routine check-up"
}
```

#### PATCH /api/health/appointments

Required: `id`

Body:
```json
{
  "id": "uuid",
  "status": "CONFIRMED"
}
```

Status transitions:
- `SCHEDULED` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`
- `SCHEDULED` → `CANCELLED` (with `reason`)
- `SCHEDULED` → `RESCHEDULED` (with new `appointmentDate`)

---

### Visits

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/visits` | GET | List visits, get queue |
| `/api/health/visits` | POST | Create visit (from appointment or walk-in) |
| `/api/health/visits` | PATCH | Update visit status |

#### GET /api/health/visits

Query params:
- `id` — Get single visit by ID
- `visitNumber` — Get single visit by number
- `action=queue&facilityId=uuid` — Get waiting queue
- `patientId`, `providerId`, `facilityId` — Filter by entity
- `status` — Filter by status
- `dateFrom`, `dateTo` — Date range
- `page`, `limit` — Pagination

#### POST /api/health/visits

Required: `patientId`

Body (walk-in):
```json
{
  "patientId": "uuid",
  "chiefComplaint": "Headache and fever",
  "isWalkIn": true
}
```

Body (from appointment):
```json
{
  "patientId": "uuid",
  "appointmentId": "uuid"
}
```

#### PATCH /api/health/visits

Required: `id`

Body:
```json
{
  "id": "uuid",
  "status": "IN_CONSULTATION"
}
```

Status flow: `REGISTERED` → `WAITING` → `IN_CONSULTATION` → `IN_LAB` → `COMPLETED` / `DISCHARGED`

---

### Encounters (APPEND-ONLY)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/encounters` | GET | List encounters, get notes/diagnoses |
| `/api/health/encounters` | POST | Create encounter, add note, add diagnosis |
| `/api/health/encounters` | PATCH | Complete, amend, resolve diagnosis |

> ⚠️ **APPEND-ONLY**: Clinical records cannot be modified after creation. Only status transitions and amendments are allowed.

#### GET /api/health/encounters

Query params:
- `id` — Get single encounter with all clinical data
- `entity=notes&encounterId=uuid` — Get notes for encounter
- `entity=diagnoses&encounterId=uuid` — Get diagnoses for encounter
- `patientId` — Get patient encounter history
- `visitId`, `providerId` — Filter by entity
- `page`, `limit` — Pagination

#### POST /api/health/encounters

Actions:

**Create encounter** (`action=create`):
```json
{
  "action": "create",
  "visitId": "uuid",
  "patientId": "uuid",
  "providerId": "uuid",
  "vitals": {
    "bloodPressure": "120/80",
    "temperature": 36.5,
    "pulse": 72
  }
}
```

**Add note** (`action=add_note`):
```json
{
  "action": "add_note",
  "encounterId": "uuid",
  "noteType": "ASSESSMENT",
  "content": "Patient presents with..."
}
```

Note types: `HISTORY`, `EXAMINATION`, `ASSESSMENT`, `PLAN`, `PROGRESS`, `AMENDMENT`

**Add diagnosis** (`action=add_diagnosis`):
```json
{
  "action": "add_diagnosis",
  "encounterId": "uuid",
  "icdCode": "J06.9",
  "description": "Acute upper respiratory infection",
  "type": "PRIMARY"
}
```

**Record vitals** (`action=record_vitals`):
```json
{
  "action": "record_vitals",
  "encounterId": "uuid",
  "vitals": { "bloodPressure": "118/75" }
}
```

#### PATCH /api/health/encounters

Actions:

**Complete encounter** (`action=complete`):
```json
{
  "action": "complete",
  "id": "uuid"
}
```
> ⚠️ **FINAL**: Once completed, encounter cannot be modified.

**Amend encounter** (`action=amend`):
```json
{
  "action": "amend",
  "id": "uuid",
  "reason": "Additional findings from lab results"
}
```

**Resolve diagnosis** (`action=resolve_diagnosis`):
```json
{
  "action": "resolve_diagnosis",
  "diagnosisId": "uuid",
  "resolutionNote": "Resolved with treatment"
}
```

---

### Prescriptions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/prescriptions` | GET | List prescriptions |
| `/api/health/prescriptions` | POST | Create prescription |
| `/api/health/prescriptions` | PATCH | Record dispensing, cancel |

> ⚠️ **FACTS ONLY**: Health records prescriptions. Fulfillment is external.

#### GET /api/health/prescriptions

Query params:
- `id` — Get single prescription
- `patientId&active=true` — Get active prescriptions for patient
- `patientId`, `prescriberId`, `encounterId` — Filter by entity
- `status` — Filter by status
- `page`, `limit` — Pagination

#### POST /api/health/prescriptions

Required: `patientId`, `encounterId`, `prescriberId`, `medication`, `dosage`, `frequency`, `duration`

Body:
```json
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "prescriberId": "uuid",
  "medication": "Amoxicillin 500mg",
  "dosage": "500mg",
  "frequency": "TDS (3 times daily)",
  "duration": "7 days",
  "quantity": 21,
  "instructions": "Take after meals"
}
```

#### PATCH /api/health/prescriptions

Actions:

**Record dispensing** (`action=dispense`):
```json
{
  "action": "dispense",
  "id": "uuid",
  "dispensedBy": "pharmacy-user-id",
  "partial": false
}
```

**Cancel prescription** (`action=cancel`):
```json
{
  "action": "cancel",
  "id": "uuid"
}
```

---

### Lab Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/lab-orders` | GET | List orders, get results |
| `/api/health/lab-orders` | POST | Create order, record result |
| `/api/health/lab-orders` | PATCH | Update status, verify result |

> ⚠️ **RESULTS ARE IMMUTABLE**: Lab results cannot be modified after creation. Only verification is allowed.

#### GET /api/health/lab-orders

Query params:
- `id` — Get single lab order with results
- `entity=results&labOrderId=uuid` — Get results for order
- `pending=true` — Get pending orders (queue)
- `patientId&history=true` — Get patient lab history
- `patientId`, `orderedById`, `encounterId` — Filter by entity
- `status`, `urgency` — Filter by status/urgency
- `page`, `limit` — Pagination

#### POST /api/health/lab-orders

Actions:

**Create order** (`action=create_order`):
```json
{
  "action": "create_order",
  "patientId": "uuid",
  "encounterId": "uuid",
  "orderedById": "uuid",
  "testName": "Full Blood Count",
  "testCode": "FBC",
  "testType": "HEMATOLOGY",
  "urgency": "ROUTINE",
  "clinicalInfo": "Suspected anemia"
}
```

Urgency: `ROUTINE`, `URGENT`, `STAT`

**Record result** (`action=record_result`):
```json
{
  "action": "record_result",
  "labOrderId": "uuid",
  "parameterName": "Hemoglobin",
  "resultValue": "12.5",
  "unit": "g/dL",
  "referenceRange": "12.0-16.0",
  "interpretation": "NORMAL"
}
```

Interpretation: `NORMAL`, `ABNORMAL`, `CRITICAL`

#### PATCH /api/health/lab-orders

Actions:

**Update status** (`action=update_status`):
```json
{
  "action": "update_status",
  "id": "uuid",
  "status": "SAMPLE_COLLECTED"
}
```

Status flow: `ORDERED` → `SAMPLE_COLLECTED` → `PROCESSING` → `COMPLETED`

**Cancel order** (`action=cancel`):
```json
{
  "action": "cancel",
  "id": "uuid"
}
```

**Verify result** (`action=verify_result`):
```json
{
  "action": "verify_result",
  "resultId": "uuid"
}
```

---

### Billing Facts (COMMERCE BOUNDARY)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/billing-facts` | GET | List billing facts |
| `/api/health/billing-facts` | POST | Create billing fact |
| `/api/health/billing-facts` | PATCH | Mark billed, waive, cancel |

> ⚠️ **COMMERCE BOUNDARY**: Health emits FACTS only. Health NEVER calculates totals, applies VAT, creates invoices, records payments, or touches accounting journals.

#### Canonical Flow

```
Health [Billing Facts] → Commerce Billing → Payments → Accounting
```

#### GET /api/health/billing-facts

Query params:
- `id` — Get single billing fact
- `pending=true` — Get pending billing facts
- `visitId` — Get billing facts for visit
- `patientId` — Get billing facts for patient
- `factType`, `status` — Filter by type/status
- `dateFrom`, `dateTo` — Date range
- `page`, `limit` — Pagination

#### POST /api/health/billing-facts

Required: `patientId`, `factType`, `description`, `amount`

Body:
```json
{
  "patientId": "uuid",
  "visitId": "uuid",
  "encounterId": "uuid",
  "factType": "CONSULTATION",
  "description": "General consultation",
  "amount": 5000,
  "quantity": 1,
  "providerId": "uuid",
  "providerName": "Dr. Adaeze Nwosu"
}
```

Fact types: `CONSULTATION`, `PROCEDURE`, `LAB`, `IMAGING`, `MEDICATION`, `SUPPLIES`

> **Note**: Healthcare is VAT-exempt in Nigeria. No VAT is applied.

#### PATCH /api/health/billing-facts

Actions:

**Mark as billed** (`action=mark_billed`):
```json
{
  "action": "mark_billed",
  "id": "uuid",
  "billingInvoiceId": "commerce-invoice-uuid"
}
```
> Called by Commerce Billing when invoice is created.

**Waive billing fact** (`action=waive`):
```json
{
  "action": "waive",
  "id": "uuid",
  "reason": "Charity case"
}
```

**Cancel billing fact** (`action=cancel`):
```json
{
  "action": "cancel",
  "id": "uuid"
}
```

---

### Demo (S4 Preparation)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/demo` | POST | Seed/clear demo data |

> ⚠️ Demo seeding will be implemented in S4 phase.

---

## 🛡️ Append-Only Guarantees

The following entities are **append-only**:

| Entity | Rule |
|--------|------|
| `health_encounter` | Cannot modify after completion. Amendments create audit trail. |
| `health_note` | Immutable. Amendments reference original note. |
| `health_diagnosis` | Cannot delete. Can only resolve with note. |
| `health_lab_result` | Immutable. Can only verify. |

---

## 💰 Commerce Boundary Compliance

### Health CAN:
- ✅ Create billing facts
- ✅ Track service delivery
- ✅ Reference billing IDs
- ✅ Query payment status (via Commerce API)

### Health CANNOT:
- ❌ Create invoices
- ❌ Calculate totals
- ❌ Apply VAT
- ❌ Record payments
- ❌ Touch accounting journals

---

## 🇳🇬 Nigeria-First Design

| Feature | Implementation |
|---------|----------------|
| Blood groups | Full Nigerian prevalence (O+, A+, B+, AB+, etc.) |
| Genotypes | AA, AS, SS, AC, SC |
| National ID | NIN support |
| Currency | NGN (default) |
| VAT | Healthcare VAT-exempt |
| Phone format | +234 prefix support |

---

## 🛑 S3 Sign-Off

**Health Suite S3 API Layer: COMPLETE**

| Route | Methods | Guard | Status |
|-------|---------|-------|--------|
| `/api/health` | GET, POST | ✅ | ✅ Complete |
| `/api/health/patients` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/guardians` | GET, POST, PATCH, DELETE | ✅ | ✅ Complete |
| `/api/health/providers` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/facilities` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/appointments` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/visits` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/encounters` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/prescriptions` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/lab-orders` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/billing-facts` | GET, POST, PATCH | ✅ | ✅ Complete |
| `/api/health/demo` | POST | ✅ | ✅ Placeholder |

**All endpoints:**
- ✅ Return 401 if unauthenticated
- ✅ Return 403 if `health` capability not enabled
- ✅ Enforce tenant scoping
- ✅ Respect append-only rules
- ✅ Respect commerce boundary

---

## Next Phase

| Phase | Description | Status |
|-------|-------------|--------|
| S4 | Demo UI + Nigerian Data | 🔲 Awaiting authorization |
| S5 | Narrative Integration | 🔲 Blocked on S4 |
| S6 | Verification & FREEZE | 🔲 Blocked on S5 |

---

*This document follows Platform Standardisation v2 requirements.*
