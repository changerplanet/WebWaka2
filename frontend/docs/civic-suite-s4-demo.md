# Civic / GovTech Suite S4: Demo UI + Seeder Documentation

**Phase**: S4 (Demo UI + Nigerian Demo Data Seeder)  
**Standard**: Platform Standardisation v2  
**Status**: COMPLETE  
**Date**: December 2025

---

## Overview

This document describes the Demo UI and Nigerian Demo Data Seeder implementation for the Civic / GovTech Suite. The demo showcases a real-world Lagos State Lands Bureau scenario with Certificate of Occupancy (C of O) applications.

---

## Demo Scenario

### Lagos State Lands Bureau — Certificate of Occupancy (C of O)

**Journey**: A citizen applies for a Certificate of Occupancy for land ownership. The application progresses through:

1. **Submission** — Citizen submits application with required documents
2. **Payment** — Fees are paid (Commerce handles billing)
3. **Case Creation** — Internal case file created for processing
4. **Assignment** — Case assigned to Land Officer
5. **Survey Verification** — Survey plan checked against master records
6. **Site Inspection** — Field inspector visits property
7. **Approval** — Final approval by senior officer
8. **Certificate Issuance** — C of O ready for collection

---

## Demo Data Seeder

### API Endpoint

`POST /api/civic/demo`

**Body**: `{ "action": "seed" }`

### Seeded Data Summary

| Entity | Count | Notes |
|--------|-------|-------|
| Agencies | 1 | Lagos State Lands Bureau |
| Departments | 3 | Certificate of Occupancy, Survey & Mapping, Land Litigation |
| Units | 2 | Application Processing, Field Inspection |
| Staff | 7 | Admin, Managers, Officers, Inspectors, Clerk |
| Services | 4 | C of O, Deed Registration, Building Plan, Survey Certification |
| Citizens | 5 | With various verification states |
| Organizations | 2 | Registered companies |
| Requests | 5 | Various statuses (Draft → Approved) |
| Cases | 3 | Active workflow cases |
| Inspections | 2 | Completed + Scheduled |
| Approvals | 1 | Completed approval |
| Billing Facts | 12 | Pending + Billed |
| Audit Logs | 5 | Sample audit entries |
| Public Statuses | 4 | Trackable statuses |

### Nigerian Demo Data Characteristics

**Staff Names (Nigerian)**:
- Adebayo Okonkwo, Ngozi Eze, Chukwuemeka Nwosu
- Aisha Bello, Olumide Adeyanju, Ibrahim Mohammed, Blessing Ogunkoya

**Citizen Names (Nigerian)**:
- Chief Adewale Johnson, Mrs Folakemi Adeleke
- Mr Emeka Obi, Dr Hauwa Ibrahim, Engr Tunde Bakare

**Addresses (Lagos)**:
- Allen Avenue (Ikeja), Bode Thomas (Surulere)
- Admiralty Road (Lekki), Victoria Island, Opebi

**Organizations**:
- Zenith Properties Limited (RC123456)
- BuildRight Construction Company (RC789012)

**Services with Nigerian Fees**:
- C of O: ₦335,000 total (base ₦250,000 + processing ₦50,000 + inspection ₦35,000)
- Deed Registration: ₦100,000 total
- Building Plan Approval: ₦205,000 total
- Survey Certification: ₦75,000 total

---

## Demo UI Features

### Page Route

`/civic-demo`

### Components

1. **Hero Section**
   - Platform branding (Civic / GovTech Suite)
   - Key badges (S3 API Complete, Capability Guarded, Nigeria-First, FOI-Ready)

2. **Demo Scenario Banner**
   - Lagos State Lands Bureau scenario description
   - C of O application journey context

3. **Public Status Tracker**
   - No authentication required
   - Sample tracking codes pre-populated
   - Progress bar visualization (7 stages)
   - Estimated completion date display

4. **Stats Dashboard**
   - Citizens, Requests, Inspections, Approvals, Billing Facts
   - Real-time counts from seeded data

5. **Module Cards**
   - Citizen & Org Registry
   - Agency Structure
   - Service Catalogue
   - Request & Cases
   - Inspections & Approvals
   - Audit & Transparency

6. **Recent Requests Table**
   - Request number, tracking code, applicant, service, status, payment status

7. **Active Cases Table**
   - Case number, status, priority, SLA deadline, SLA status, escalation

8. **Audit Trail Section**
   - Append-only log entries
   - Action badges, actor names, timestamps

9. **Architecture Diagram**
   - Public Layer
   - Citizen Layer
   - Agency Layer
   - Commerce Boundary (visual separation)

10. **Nigeria-First Design Section**
    - Identity references (not replacement)
    - Append-only audit
    - Public transparency

---

## Sample Tracking Codes

For demo testing:

| Code | Status | Service |
|------|--------|---------|
| `LSLB-A1B2C3` | APPROVED | C of O |
| `LSLB-D4E5F6` | PENDING_INSPECTION | Building Plan |
| `LSLB-G7H8I9` | UNDER_REVIEW | C of O |
| `LSLB-J0K1L2` | PENDING_PAYMENT | C of O |

---

## Commerce Boundary Demonstration

The demo UI clearly shows how Civic emits billing facts while Commerce handles the rest:

**Visible in Demo**:
- Billing facts with amounts (₦250,000, ₦50,000, ₦35,000)
- Status: PENDING or BILLED
- Reference to Commerce invoice IDs when billed

**Not in Civic**:
- VAT calculation
- Invoice generation
- Payment recording
- Accounting entries

---

## Append-Only Visibility

The demo surfaces append-only patterns:

1. **Case Notes** — Each note shows author and timestamp, no edit buttons
2. **Status Changes** — Full trail from OPEN → CLOSED with reasons
3. **Inspection Findings** — Categorized findings with severity
4. **Approvals** — Decision, rationale, conditions recorded permanently
5. **Audit Logs** — Every action logged with actor identification

---

## Demo Preview Mode

For unauthenticated users:
- Public status tracker works without login
- Module cards visible for feature overview
- Login prompt to seed demo data
- Links to dashboard and other demos

---

## Technical Implementation

### Files Created

```
/app/frontend/
├── src/app/civic-demo/
│   └── page.tsx               # Demo UI page (850+ lines)
└── src/app/api/civic/demo/
    └── route.ts               # Demo seeder API (1500+ lines)
```

### TypeScript Compilation

✅ Demo seeder compiles without errors  
✅ Demo page compiles without errors  
✅ All Prisma types correctly used

---

## Compliance Checklist

| Requirement | Status |
|-------------|--------|
| Demo scenario: Lagos Lands Bureau | ✅ |
| C of O application journey | ✅ |
| Nigerian demo data (names, addresses, fees) | ✅ |
| Non-NIN identifiers | ✅ |
| Demo Preview Mode (no auth required for tracking) | ✅ |
| Audit trails visible | ✅ |
| Status transitions visible | ✅ |
| Fee transparency (facts only) | ✅ |
| Commerce boundary demonstrable | ✅ |
| Demo-safe, reversible | ✅ |
| No real identity systems | ✅ |
| No biometric data | ✅ |
| No elections/law enforcement | ✅ |
| No Demo Mode/Quick Start wiring (S5) | ✅ |
| No background jobs | ✅ |

---

*Document generated as part of Civic / GovTech Suite S4 completion.*
