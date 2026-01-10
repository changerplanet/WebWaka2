# Health Suite — S2 Services Documentation

**Suite**: Health  
**Standard**: Platform Standardisation v2  
**Phase**: S2 — Schema & Services  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document describes the domain services for the Health Suite. All services are pure domain logic with no API or UI dependencies.

---

## Services Summary

| Service | Path | Description |
|---------|------|-------------|
| PatientService | `/services/patient-service.ts` | Patient registry management |
| FacilityService | `/services/facility-service.ts` | Facilities and providers |
| AppointmentService | `/services/appointment-service.ts` | Appointment scheduling |
| VisitService | `/services/visit-service.ts` | Visit lifecycle |
| EncounterService | `/services/encounter-service.ts` | Clinical encounters (append-only) |
| PrescriptionService | `/services/prescription-service.ts` | Prescription facts |
| LabOrderService | `/services/lab-order-service.ts` | Lab orders and results |
| BillingFactService | `/services/billing-fact-service.ts` | Billing facts → Commerce |

---

## Service Rules

All Health Suite services follow these rules:

| Rule | Description |
|------|-------------|
| **Deterministic** | Same input always produces same output |
| **Tenant-scoped** | All operations are tenant-isolated |
| **No API calls** | Services don't call external APIs |
| **No UI logic** | Services don't know about UI |
| **No payment logic** | Health never handles money |
| **No journal logic** | Health never touches accounting |
| **No integrations** | Services don't call external services |

---

## PatientService

Patient registry management with privacy-first design.

### Functions

| Function | Description |
|----------|-------------|
| `createPatient(tenantId, input)` | Create a new patient with auto-MRN |
| `getPatient(tenantId, patientId)` | Get patient by ID |
| `getPatientByMRN(tenantId, mrn)` | Get patient by MRN |
| `listPatients(tenantId, filters)` | List patients with filters |
| `updatePatient(tenantId, patientId, input)` | Update non-clinical fields |
| `updatePatientStatus(tenantId, patientId, status)` | Update status |
| `addPatientAllergy(tenantId, patientId, allergy)` | Add allergy (append) |
| `addPatientCondition(tenantId, patientId, condition)` | Add condition (append) |
| `addPatientGuardian(tenantId, patientId, guardian)` | Add guardian |
| `getPatientStats(tenantId)` | Get patient statistics |

### MRN Generation

```typescript
// Format: MRN-{YEAR}-{SEQUENCE}
// Example: MRN-2026-00001
const mrn = await generateMRN(tenantId)
```

---

## FacilityService

Facility and provider management.

### Facility Functions

| Function | Description |
|----------|-------------|
| `createFacility(tenantId, input)` | Create facility |
| `getFacility(tenantId, facilityId)` | Get facility with counts |
| `listFacilities(tenantId, filters)` | List facilities |
| `updateFacility(tenantId, facilityId, input)` | Update facility |

### Provider Functions

| Function | Description |
|----------|-------------|
| `createProvider(tenantId, input)` | Create provider |
| `getProvider(tenantId, providerId)` | Get provider |
| `listProviders(tenantId, filters)` | List providers |
| `updateProvider(tenantId, providerId, input)` | Update provider |

---

## AppointmentService

Appointment scheduling and management.

### Functions

| Function | Description |
|----------|-------------|
| `createAppointment(tenantId, input)` | Create appointment |
| `getAppointment(tenantId, appointmentId)` | Get appointment |
| `listAppointments(tenantId, filters)` | List appointments |
| `updateAppointmentStatus(tenantId, id, status)` | Update status |
| `rescheduleAppointment(tenantId, id, date, time)` | Reschedule |
| `getTodaySchedule(tenantId, providerId)` | Provider's today schedule |
| `getAppointmentStats(tenantId, dateFrom, dateTo)` | Statistics |

### Status Flow

```
SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
                                  ↘ CANCELLED
                                  ↘ NO_SHOW
```

---

## VisitService

Patient visit lifecycle (scheduled + walk-in).

### Functions

| Function | Description |
|----------|-------------|
| `createVisit(tenantId, input)` | Create visit |
| `getVisit(tenantId, visitId)` | Get visit with encounters |
| `getVisitByNumber(tenantId, visitNumber)` | Get by visit number |
| `listVisits(tenantId, filters)` | List visits |
| `updateVisitStatus(tenantId, visitId, status)` | Update status |
| `assignProvider(tenantId, visitId, providerId)` | Assign provider |
| `getWaitingQueue(tenantId, facilityId?)` | Get waiting queue |
| `getVisitStats(tenantId, dateFrom, dateTo)` | Statistics |

### Walk-In Support

```typescript
// Walk-in visits have no appointmentId
const { visit } = await createVisit(tenantId, {
  patientId,
  isWalkIn: true,
  chiefComplaint: 'Fever and headache',
})
```

---

## EncounterService

Clinical encounter management. **APPEND-ONLY**.

### Functions

| Function | Description |
|----------|-------------|
| `createEncounter(tenantId, input)` | Create encounter |
| `getEncounter(tenantId, encounterId)` | Get with all clinical data |
| `listPatientEncounters(tenantId, patientId)` | Patient history |
| `recordVitals(tenantId, encounterId, vitals)` | Record vitals |
| `completeEncounter(tenantId, encounterId, userId)` | Complete (final) |
| `amendEncounter(tenantId, encounterId, userId, reason)` | Amend completed |

### Notes (IMMUTABLE)

| Function | Description |
|----------|-------------|
| `addNote(tenantId, encounterId, input)` | Add note (immutable) |
| `getEncounterNotes(tenantId, encounterId)` | Get notes |
| `amendNote(tenantId, noteId, content, author)` | Create amendment |

### Diagnoses (APPEND-ONLY)

| Function | Description |
|----------|-------------|
| `addDiagnosis(tenantId, encounterId, input)` | Add diagnosis |
| `getEncounterDiagnoses(tenantId, encounterId)` | Get diagnoses |
| `resolveDiagnosis(tenantId, diagnosisId, userId)` | Mark resolved |
| `getPatientDiagnosisHistory(tenantId, patientId)` | Full history |

### Vitals Structure

```typescript
interface VitalsInput {
  bloodPressure?: string  // "120/80"
  temperature?: number    // Celsius
  pulse?: number          // bpm
  weight?: number         // kg
  height?: number         // cm
  spo2?: number           // %
  respiratoryRate?: number
}
```

---

## PrescriptionService

Prescription facts. Health does NOT handle fulfillment.

### Functions

| Function | Description |
|----------|-------------|
| `createPrescription(tenantId, input)` | Create prescription |
| `getPrescription(tenantId, prescriptionId)` | Get prescription |
| `listPrescriptions(tenantId, filters)` | List prescriptions |
| `getActivePrescriptions(tenantId, patientId)` | Active Rx for patient |
| `recordDispensing(tenantId, id, dispensedBy)` | Record dispensing (callback) |
| `cancelPrescription(tenantId, prescriptionId)` | Cancel |
| `getPrescriptionStats(tenantId, dateFrom, dateTo)` | Statistics |

### Fulfillment Note

```typescript
// Health ONLY records the prescription fact
// Pharmacy/external system calls back when dispensed
await recordDispensing(tenantId, prescriptionId, 'pharm-001', 'Dispensed in full')
```

---

## LabOrderService

Lab order and result management.

### Order Functions

| Function | Description |
|----------|-------------|
| `createLabOrder(tenantId, input)` | Create order |
| `getLabOrder(tenantId, labOrderId)` | Get with results |
| `listLabOrders(tenantId, filters)` | List orders |
| `getPendingLabOrders(tenantId)` | Pending queue |
| `updateLabOrderStatus(tenantId, id, status)` | Update status |
| `cancelLabOrder(tenantId, labOrderId)` | Cancel |

### Result Functions (IMMUTABLE)

| Function | Description |
|----------|-------------|
| `recordLabResult(tenantId, input)` | Record result (immutable) |
| `verifyLabResult(tenantId, resultId, verifiedBy)` | Verify result |
| `getLabOrderResults(tenantId, labOrderId)` | Get results |
| `getPatientLabHistory(tenantId, patientId)` | Full history |

### Urgency Levels

```typescript
enum HealthLabOrderUrgency {
  ROUTINE  // Normal processing
  URGENT   // Expedited
  STAT     // Immediate
}
```

---

## BillingFactService

**CRITICAL: Commerce Reuse Boundary**

Health emits billing facts ONLY. Commerce handles invoicing, payments, and accounting.

### Functions

| Function | Description |
|----------|-------------|
| `createBillingFact(tenantId, input)` | Create fact |
| `getBillingFact(tenantId, billingFactId)` | Get fact |
| `listBillingFacts(tenantId, filters)` | List facts |
| `getPendingBillingFacts(tenantId)` | Pending facts |
| `getVisitBillingFacts(tenantId, visitId)` | Visit facts |
| `getPatientBillingFacts(tenantId, patientId)` | Patient facts |
| `markAsBilled(tenantId, id, invoiceId)` | Commerce callback |
| `waiveBillingFact(tenantId, id, userId, reason)` | Waive fact |
| `cancelBillingFact(tenantId, billingFactId)` | Cancel fact |

### Auto-Creation Helpers

```typescript
// Create consultation fee fact
await createConsultationFeeFact(tenantId, patientId, encounterId, visitId, providerId, providerName)

// Create lab test fee fact
await createLabTestFeeFact(tenantId, patientId, encounterId, visitId, 'CBC', 5000)
```

### Commerce Boundary Rules

| Health CAN | Health CANNOT |
|------------|---------------|
| ✅ Create billing facts | ❌ Create invoices |
| ✅ Track service delivery | ❌ Calculate totals |
| ✅ Record fact amounts | ❌ Apply VAT |
| ✅ Link to Commerce invoice | ❌ Record payments |
| | ❌ Touch accounting |

### Canonical Flow

```
Health [Billing Facts] → Commerce Billing → Payments → Accounting
        ↑                      ↓
        └── markAsBilled() ────┘
```

---

## Append-Only Guarantees

### Clinical Records

| Record | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Encounter | ✅ | ✅ | ❌ (status only) | ❌ |
| Note | ✅ | ✅ | ❌ | ❌ |
| Diagnosis | ✅ | ✅ | ❌ (resolve only) | ❌ |
| Lab Result | ✅ | ✅ | ❌ (verify only) | ❌ |

### Corrections

Clinical corrections are made via amendments, not edits:

```typescript
// Wrong way: Edit note (NOT ALLOWED)
// await updateNote(noteId, { content: 'new content' }) // ❌

// Right way: Create amendment
await amendNote(tenantId, originalNoteId, 'Correction: ...', authorId, authorName) // ✅
```

---

## 🛑 S2 Services Sign-Off

**Health Suite S2 Services: COMPLETE**

| Item | Status |
|------|--------|
| ✅ PatientService | Implemented |
| ✅ FacilityService | Implemented |
| ✅ AppointmentService | Implemented |
| ✅ VisitService | Implemented |
| ✅ EncounterService | Implemented (append-only) |
| ✅ PrescriptionService | Implemented (facts only) |
| ✅ LabOrderService | Implemented (results immutable) |
| ✅ BillingFactService | Implemented (Commerce boundary) |
| ✅ No API calls | Verified |
| ✅ No UI logic | Verified |
| ✅ No payment logic | Verified |
| ✅ Tenant-scoped | Verified |

---

*This document follows Platform Standardisation v2 requirements.*
