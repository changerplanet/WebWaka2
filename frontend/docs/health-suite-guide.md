# Health Suite - Partner Implementation Guide

## Overview

The Health Suite is a comprehensive clinic and hospital management solution built on the WebWaka platform. It enables healthcare providers to manage patients, appointments, consultations, prescriptions, and billing.

## Key Features

| Module | Description |
|--------|-------------|
| **Patient Management** | Registration, medical history, allergies, insurance |
| **Appointment Scheduling** | Doctor calendars, time slots, status tracking |
| **Consultation Records** | Vital signs, diagnosis (ICD-10), treatment plans |
| **Prescription Management** | Drug prescriptions, dosage, dispensing |
| **Pharmacy/Dispensing** | Queue management, stock integration |
| **Healthcare Billing** | Invoice generation, insurance claims |

## Architecture

### Capability Composition (~84% Reuse)
```
┌─────────────────────────────────────────────────────────────┐
│                      HEALTH SUITE                           │
├─────────────────────────────────────────────────────────────┤
│  Patient    │ Appointments │ Consultations │ Prescriptions │
│  (CRM)      │ (NEW svc)    │ (CRM Engage)  │ (NEW svc)     │
├─────────────────────────────────────────────────────────────┤
│        CRM Module    │   HR Module    │   Billing Module   │
│        Products      │   Inventory    │   Payments/POS     │
└─────────────────────────────────────────────────────────────┘
```

### No New Schemas
- **Patients** → CRM Contacts with health metadata
- **Doctors/Staff** → HR StaffMembers with license metadata
- **Services** → Products (type: SERVICE)
- **Medications** → Products (type: PHYSICAL)
- **Appointments** → In-memory demo storage
- **Prescriptions** → In-memory demo storage

## API Endpoints

### Main Health Suite API
```
GET  /api/health-suite?action=config          - Get suite configuration
GET  /api/health-suite?action=solution-package - Partner solution info
GET  /api/health-suite?action=doctors         - List demo doctors
POST /api/health-suite { action: 'seed-demo-data' } - Seed demo data
```

### Patients API
```
GET  /api/health-suite/patients               - List patients
GET  /api/health-suite/patients?id={id}       - Get patient by ID
GET  /api/health-suite/patients?mrn={mrn}     - Get patient by MRN
GET  /api/health-suite/patients?action=stats  - Get patient stats
POST /api/health-suite/patients               - Create patient
PATCH /api/health-suite/patients              - Update patient
```

### Appointments API
```
GET  /api/health-suite/appointments           - List appointments
GET  /api/health-suite/appointments?action=today - Today's appointments
GET  /api/health-suite/appointments?action=stats - Appointment stats
GET  /api/health-suite/appointments?action=available-slots&doctorId=X&date=Y
POST /api/health-suite/appointments           - Book appointment
POST /api/health-suite/appointments { action: 'reschedule' }
POST /api/health-suite/appointments { action: 'cancel' }
PATCH /api/health-suite/appointments          - Update status
```

### Consultations API
```
GET  /api/health-suite/consultations          - List consultations
GET  /api/health-suite/consultations?action=today
GET  /api/health-suite/consultations?action=patient-history&patientId=X
POST /api/health-suite/consultations          - Create consultation
POST /api/health-suite/consultations { action: 'record-vitals' }
POST /api/health-suite/consultations { action: 'complete' }
PATCH /api/health-suite/consultations         - Update status/notes
```

### Prescriptions API
```
GET  /api/health-suite/prescriptions          - List prescriptions
GET  /api/health-suite/prescriptions?action=pending
GET  /api/health-suite/prescriptions?action=medications - Common medications
POST /api/health-suite/prescriptions          - Create prescription
POST /api/health-suite/prescriptions { action: 'dispense' }
POST /api/health-suite/prescriptions { action: 'cancel' }
```

## UI Pages

| Route | Description |
|-------|-------------|
| `/health/admin` | Clinic dashboard with stats and quick actions |
| `/health/patients` | Patient list with search and filters |
| `/health/appointments` | Appointment calendar and scheduling |
| `/health/consultations` | Patient queue (Kanban-style) |
| `/health/pharmacy` | Prescription dispensing queue |

## Nigerian Healthcare Context

### Blood Groups & Genotypes
- Blood Groups: A+, A-, B+, B-, AB+, AB-, O+, O-
- Genotypes: AA, AS, SS, AC, SC, CC

### Common Consultation Types
- General Practice
- Specialist Consultation
- Follow-up Visit
- Laboratory Test
- Vaccination
- Emergency

### Payment Methods
- Cash
- Card/POS
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

## Partner Activation Checklist

1. **Configure Clinic Profile** - Name, address, contact details, logo
2. **Add Doctors & Staff** - Create profiles with specializations, license numbers
3. **Set Up Services** - Configure consultation fees and service prices
4. **Configure Pharmacy** - Add medications to inventory with prices
5. **Test Workflow** - Run through complete patient journey
6. **Go Live** - Start accepting patients

## Pricing Recommendations

| Tier | Max Patients | Monthly (NGN) |
|------|--------------|---------------|
| Starter | 500 | ₦10,000 |
| Professional | 2,000 | ₦30,000 |
| Enterprise | Unlimited | Custom |

## Technical Notes

### Current Limitations (Demo Implementation)
- Appointments stored in-memory (resets on server restart)
- Prescriptions stored in-memory (resets on server restart)
- Patient data uses demo stubs
- No actual HMO/insurance integrations

### Production Requirements
- Add metadata JSON field to Customer model for patient data
- Create Health-specific appointment and prescription tables
- Integrate with NHIS and HMO providers
- Implement proper data persistence

## Support

For partner support, contact: partners@webwaka.com
Technical documentation: https://docs.webwaka.com/health
