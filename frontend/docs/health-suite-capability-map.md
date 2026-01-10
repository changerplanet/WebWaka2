# Health Suite - Capability Mapping Document

## S0: Context Confirmation ✅
## S1: Capability Mapping (Design Only - NO CODE)

---

## Suite Overview

**Target Customers:**
- Clinics & Medical Centers
- Hospitals (Small to Medium)
- Diagnostic Centers
- Pharmacies with Consultation Services
- Wellness Centers & Spas
- Dental Practices
- Specialist Practices (Dermatology, Pediatrics, etc.)

**Key Capabilities Required:**
1. Patient Management (Registration, Medical History)
2. Appointment Scheduling
3. Consultation/Visit Records
4. Prescriptions & Pharmacy
5. Billing & Insurance
6. Staff Management

---

## Capability Mapping Matrix

### 1. PATIENT MANAGEMENT

| Health Need | Existing Capability | Reuse Strategy | Gap? |
|-------------|---------------------|----------------|------|
| Patient Profiles | **CRM Contacts** | Configure contact type = "PATIENT" with health metadata | ✅ REUSE |
| Emergency Contacts | **CRM Contacts** | Configure contact type = "EMERGENCY_CONTACT" with relationship | ✅ REUSE |
| Patient ID/MRN Generation | **StaffMember.employeeId pattern** | Apply same ID generation for Medical Record Number | ✅ REUSE |
| Patient Categories | **CRM Segmentation** | Use segments (VIP, Insurance, Walk-in, Chronic Care) | ✅ REUSE |
| Visit History | **CRM Engagement** | Track visits as engagement events | ✅ REUSE |
| Medical Alerts | **CRM Contact Tags** | Use tags for allergies, conditions | ✅ REUSE |

**Verdict: 100% REUSE** - CRM module with health-specific configuration

**Patient Metadata Schema (stored in CRM Contact.metadata):**
```json
{
  "contactType": "PATIENT",
  "medicalRecordNumber": "MRN-2025-0001",
  "dateOfBirth": "1985-03-15",
  "bloodGroup": "O+",
  "genotype": "AA",
  "allergies": ["Penicillin", "Sulfa drugs"],
  "chronicConditions": ["Hypertension", "Diabetes Type 2"],
  "insuranceProvider": "HMO Nigeria",
  "insurancePolicyNumber": "HMO-12345",
  "primaryPhysicianId": "doctor_001",
  "emergencyContactId": "contact_002",
  "lastVisitDate": "2025-01-03"
}
```

---

### 2. APPOINTMENT SCHEDULING

| Health Need | Existing Capability | Reuse Strategy | Gap? |
|-------------|---------------------|----------------|------|
| Appointment Booking | **HR Work Schedules** | Adapt schedule model for appointments | ⚠️ PARTIAL |
| Doctor Availability | **HR Employee Service** | Use staff schedules for availability | ✅ REUSE |
| Appointment Slots | **HR Attendance patterns** | Use time slot concepts | ⚠️ PARTIAL |
| Reminders | **CRM Campaigns** | Automated SMS/Email reminders | ✅ REUSE |
| Appointment Status | - | NEW service with in-memory storage | 🔴 GAP |
| Calendar View | - | UI-only, no backend needed | ✅ UI-ONLY |

**Verdict: 60% REUSE** - Appointment scheduling requires NEW service layer
- **Proposed**: `health/appointment-service.ts` - Pure business logic
- **Data Storage**: Use tenant-scoped in-memory storage (demo) or CRM engagement events

**Appointment Status Flow:**
```
SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
                │                         │
                ├── CANCELLED             └── NO_SHOW
                └── RESCHEDULED
```

---

### 3. CONSULTATION/VISIT RECORDS

| Health Need | Existing Capability | Reuse Strategy | Gap? |
|-------------|---------------------|----------------|------|
| Visit Recording | **CRM Engagement Events** | Create engagement type = "CONSULTATION" | ✅ REUSE |
| Consultation Notes | **CRM Engagement.metadata** | Store notes in JSON | ✅ REUSE |
| Vital Signs | - | Store in engagement metadata | ✅ REUSE (metadata) |
| Diagnosis Codes | - | Store in engagement metadata (ICD-10) | ✅ REUSE (metadata) |
| Treatment Plans | - | Store in engagement metadata | ✅ REUSE (metadata) |
| Lab Orders | **Product (SERVICE type)** | Configure services as lab tests | ✅ REUSE |
| Lab Results | **CRM Engagement** | Create engagement type = "LAB_RESULT" | ✅ REUSE |

**Verdict: 90% REUSE** - CRM Engagement with health-specific types

**Consultation Metadata Schema:**
```json
{
  "consultationType": "GENERAL",
  "vitalSigns": {
    "bloodPressure": "120/80",
    "pulse": 72,
    "temperature": 36.8,
    "weight": 75,
    "height": 175,
    "oxygenSaturation": 98
  },
  "chiefComplaint": "Persistent headache for 3 days",
  "historyOfPresentIllness": "...",
  "physicalExamination": "...",
  "diagnosis": [
    { "code": "R51", "description": "Headache", "type": "PRIMARY" }
  ],
  "treatmentPlan": "...",
  "labOrders": ["CBC", "Blood Sugar"],
  "followUpDate": "2025-01-10"
}
```

---

### 4. PRESCRIPTIONS & PHARMACY

| Health Need | Existing Capability | Reuse Strategy | Gap? |
|-------------|---------------------|----------------|------|
| Drug Catalog | **Product Model** | Configure type = "PHYSICAL" for medications | ✅ REUSE |
| Drug Categories | **ProductCategory** | Antibiotics, Pain Relief, etc. | ✅ REUSE |
| Prescription Creation | - | NEW service linking consultation to products | 🔴 GAP |
| Prescription Status | - | NEW service for tracking | 🔴 GAP |
| Drug Inventory | **Inventory Module** | Already exists | ✅ REUSE |
| Drug Dispensing | **POS/Sales** | Use existing sales flow | ✅ REUSE |
| Drug Interactions | - | Validation service (optional) | ⚠️ FUTURE |

**Verdict: 70% REUSE** - Prescription management requires NEW service

**Prescription Flow:**
```
CONSULTATION → PRESCRIPTION_CREATED → PENDING_DISPENSING → DISPENSED
                                           │
                                           └── PARTIALLY_DISPENSED
```

**Prescription Metadata Schema:**
```json
{
  "prescriptionId": "RX-2025-0001",
  "consultationId": "engagement_001",
  "patientId": "patient_001",
  "doctorId": "doctor_001",
  "status": "PENDING_DISPENSING",
  "items": [
    {
      "productId": "med_001",
      "drugName": "Amoxicillin 500mg",
      "dosage": "1 capsule",
      "frequency": "3 times daily",
      "duration": "7 days",
      "quantity": 21,
      "instructions": "Take after meals"
    }
  ],
  "validUntil": "2025-01-15",
  "dispensedAt": null,
  "dispensedBy": null
}
```

---

### 5. BILLING & INSURANCE

| Health Need | Existing Capability | Reuse Strategy | Gap? |
|-------------|---------------------|----------------|------|
| Service Pricing | **Product Model (SERVICE)** | Configure consultation fees | ✅ REUSE |
| Invoice Generation | **Invoice Model** | Already exists | ✅ REUSE |
| Payment Processing | **Payments Module** | Already exists | ✅ REUSE |
| Insurance Claims | - | Track in invoice metadata | ⚠️ PARTIAL |
| HMO Integration | - | Future integration | ❌ FUTURE |
| Payment Plans | **Billing Adjustments** | Installment support | ✅ REUSE |
| Receipts | **Payment Events** | Already tracks | ✅ REUSE |
| Discounts | **Billing Discounts** | Staff/senior discounts | ✅ REUSE |

**Verdict: 85% REUSE** - Billing module with insurance metadata

**Insurance Claim Metadata (stored in Invoice.metadata):**
```json
{
  "insuranceProvider": "HMO Nigeria",
  "policyNumber": "HMO-12345",
  "preAuthCode": "PA-2025-001",
  "claimStatus": "SUBMITTED",
  "coveredAmount": 15000,
  "patientCopay": 2000,
  "claimSubmittedAt": "2025-01-05",
  "claimApprovedAt": null
}
```

---

### 6. STAFF MANAGEMENT

| Health Need | Existing Capability | Reuse Strategy | Gap? |
|-------------|---------------------|----------------|------|
| Doctor Profiles | **StaffMember Model** | Already exists | ✅ REUSE |
| Nurse/Staff Profiles | **StaffMember Model** | Already exists | ✅ REUSE |
| Department Assignment | **StaffMember.department** | Already exists | ✅ REUSE |
| Staff Attendance | **HR Attendance** | Already exists | ✅ REUSE |
| Leave Management | **HR Leave Service** | Already exists | ✅ REUSE |
| Payroll | **HR Payroll Service** | Already exists | ✅ REUSE |
| Doctor License | **StaffMember metadata** | Store license info | ✅ REUSE |
| Specializations | **StaffMember metadata** | Store specialties | ✅ REUSE |

**Verdict: 100% REUSE** - HR module fully applicable

**Doctor Metadata Schema (stored in StaffMember.metadata):**
```json
{
  "staffType": "DOCTOR",
  "licenseNumber": "MDCN/2020/12345",
  "licenseExpiry": "2027-03-15",
  "specializations": ["General Practice", "Family Medicine"],
  "qualifications": ["MBBS", "FWACP"],
  "consultationFee": 5000,
  "availableDays": ["MON", "TUE", "WED", "THU", "FRI"],
  "maxPatientsPerDay": 30
}
```

---

## Summary: Capability Reuse Analysis

| Capability Area | Reuse % | Primary Module | Notes |
|-----------------|---------|----------------|-------|
| Patient Management | 100% | CRM | Contact type configuration |
| Appointment Scheduling | 60% | NEW + HR | Requires appointment service |
| Consultation Records | 90% | CRM Engagement | Engagement type configuration |
| Prescriptions | 70% | NEW + Products | Requires prescription service |
| Billing & Insurance | 85% | Billing | Insurance metadata tracking |
| Staff Management | 100% | HR | Already complete |

**Overall Reuse: ~84%**

---

## Gap Register

### GAP-HEALTH-001: Appointment Scheduling Service

**Description:** No existing capability for managing patient appointments with doctors.

**Proposed Solution (Design Only):**
- Create `health/appointment-service.ts` - Business logic only
- Store appointments in tenant-scoped in-memory storage (demo)
- Track appointment status workflow
- Link to HR staff schedules for doctor availability

**Data Model Approach (NO SCHEMA CHANGES):**
```typescript
interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;  // CRM Contact ID
  doctorId: string;   // StaffMember ID
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'PROCEDURE' | 'LAB_TEST';
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Core Impact:** NONE - In-memory demo storage

---

### GAP-HEALTH-002: Prescription Management Service

**Description:** No existing capability for creating and tracking prescriptions.

**Proposed Solution (Design Only):**
- Create `health/prescription-service.ts` - Business logic only
- Link prescriptions to consultations (CRM Engagement)
- Link prescription items to Products (medications)
- Track dispensing status

**Data Model Approach (NO SCHEMA CHANGES):**
```typescript
interface Prescription {
  id: string;
  tenantId: string;
  consultationId: string;  // CRM Engagement ID
  patientId: string;       // CRM Contact ID
  doctorId: string;        // StaffMember ID
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  validUntil: string;
  createdAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
}

interface PrescriptionItem {
  productId: string;  // Product ID (medication)
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}
```

**Core Impact:** NONE - In-memory demo storage

---

## Core Impact Assessment

| Question | Answer |
|----------|--------|
| New database tables required? | **NO** |
| Schema changes to existing tables? | **NO** |
| New Core primitives required? | **NO** |
| Cross-suite data dependencies? | **NO** |
| Partner-First compliance? | **YES** |

### Detailed Assessment:

1. **CRM Module Extension**
   - Add health-specific contact types: PATIENT, EMERGENCY_CONTACT
   - Add engagement types: CONSULTATION, LAB_RESULT, PROCEDURE
   - Store medical data in existing `metadata` JSON field
   - **Impact: NONE** - Configuration only

2. **HR Module Extension**
   - Configure staff metadata for doctors (license, specializations)
   - **Impact: NONE** - Metadata configuration only

3. **Product Module Extension**
   - Configure SERVICE type products for consultations
   - Configure PHYSICAL type products for medications
   - **Impact: NONE** - Data configuration only

4. **Billing Extension**
   - Store insurance claim info in Invoice metadata
   - **Impact: NONE** - Metadata only

5. **New Services Required**
   - `health/appointment-service.ts` - Pure business logic, in-memory
   - `health/prescription-service.ts` - Pure business logic, in-memory
   - `health/consultation-service.ts` - Wraps CRM Engagement
   - **Impact: NONE** - New code, no schema changes

---

## What Will NOT Be Built

1. ❌ Custom patient database table
2. ❌ Custom appointment table
3. ❌ Custom prescription table
4. ❌ Electronic Health Records (EHR) full implementation
5. ❌ NHIS/Insurance provider integrations
6. ❌ Telemedicine/video consultations
7. ❌ Medical imaging (DICOM)
8. ❌ Complex drug interaction checking
9. ❌ Patient portal (Partner activates access)

---

## What Will Be Reused

1. ✅ **CRM Module** - Patient/emergency contact management
2. ✅ **CRM Engagement** - Consultation/visit records
3. ✅ **CRM Campaigns** - Appointment reminders, follow-up notifications
4. ✅ **CRM Segmentation** - Patient categorization
5. ✅ **HR Staff Management** - Doctor/nurse management
6. ✅ **HR Attendance** - Staff attendance
7. ✅ **HR Payroll** - Staff salary processing
8. ✅ **Product Model** - Services (consultations) + Products (medications)
9. ✅ **Inventory Module** - Drug/supplies inventory
10. ✅ **Billing Module** - Invoice generation
11. ✅ **Payments Module** - Payment processing
12. ✅ **POS/Sales** - Drug dispensing
13. ✅ **Capability Framework** - Module activation
14. ✅ **Partner-First Model** - Activation flow

---

## Architecture: Health Suite Composition

```
┌─────────────────────────────────────────────────────────────┐
│                      HEALTH SUITE                           │
│           (Clinic/Hospital Management Solution)             │
└─────────────────────────────────────────────────────────────┘
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────────┐  ┌───────┐  ┌─────────┐
│  CRM  │  │  HR   │  │  Billing  │  │Product│  │   NEW   │
│       │  │       │  │           │  │       │  │Services │
│Patient│  │Doctor │  │Invoicing  │  │Drugs  │  │ Appt    │
│Visits │  │Nurse  │  │Insurance  │  │Labs   │  │ Rx      │
└───────┘  └───────┘  └───────────┘  └───────┘  └─────────┘
    │           │           │           │           │
    └───────────┴───────────┴───────────┴───────────┘
                            │
                    ┌───────────────┐
                    │  Inventory    │
                    │  + Payments   │
                    │  + POS        │
                    └───────────────┘
```

---

## Nigerian Healthcare Context

### Common Consultation Types
- General Practice
- Specialist Consultation (Cardiology, Dermatology, Pediatrics, etc.)
- Dental Services
- Eye Examination
- Antenatal/Postnatal Care
- Family Planning
- Laboratory Tests
- Pharmacy Services

### Common Payment Methods
- Cash (most common)
- POS/Card
- Bank Transfer
- HMO/Insurance (NHIS, Private HMOs)
- Company Retainer

### Typical Clinic Workflow
1. Patient Registration / Check-in
2. Vital Signs Recording (Nurse Station)
3. Doctor Consultation
4. Lab Tests (if ordered)
5. Diagnosis & Prescription
6. Pharmacy/Dispensing
7. Billing & Payment
8. Next Appointment Scheduling

---

## Recommended Next Steps (S2-S5)

**S2: Core Services**
- Create `health/config.ts` - Labels, constants, enums
- Create `health/patient-service.ts` - Wraps CRM for patient management
- Create `health/appointment-service.ts` - Appointment scheduling
- Create `health/consultation-service.ts` - Wraps CRM Engagement
- Create `health/prescription-service.ts` - Prescription management

**S3: API Routes**
- `/api/health` - Suite configuration and activation
- `/api/health/patients` - Patient CRUD (wraps CRM)
- `/api/health/appointments` - Appointment management
- `/api/health/consultations` - Visit/consultation records
- `/api/health/prescriptions` - Prescription management
- `/api/health/billing` - Healthcare billing (wraps Billing)

**S4: UI Pages**
- Clinic Admin Dashboard
- Patient Registration
- Appointment Calendar/Scheduler
- Doctor's Consultation View
- Prescription Writer
- Pharmacy/Dispensing View
- Billing & Payments

**S5: Demo Data & Documentation**
- Demo patients, doctors, appointments
- Partner implementation guide

---

## Sign-off

| Item | Status |
|------|--------|
| Capability mapping complete | ✅ |
| Gap register documented | ✅ |
| Core impact assessment: NO CHANGES | ✅ |
| Partner-First compliance | ✅ |
| Ready for S2 (Services) | ✅ |

---

*Document Version: 1.0*
*Created: January 2026*
*Phase: S0-S1 Complete*
