# Demo Seed Script Index

**Document Type:** Phase D2 Deliverable  
**Date:** January 14, 2026  
**Status:** SCRIPTS CREATED - NOT EXECUTED

---

## Overview

This document indexes all demo seed scripts for the WebWaka platform. All scripts are scoped to the **Demo Partner** and designed to create realistic Nigerian business context data.

---

## Script Inventory

### Pre-Existing Scripts (NOT MODIFIED)

| Script | Suite | Tenant Slug | Status |
|--------|-------|-------------|--------|
| seed-demo-partner-master.ts | Partner Infrastructure | N/A | EXECUTED |
| seed-pos-demo.ts | Commerce/POS | demo-retail-store | NOT EXECUTED |
| seed-svm-demo.ts | Commerce/SVM | demo-retail-store | NOT EXECUTED |
| seed-mvm-demo.ts | Commerce/MVM | demo-marketplace | NOT EXECUTED |
| seed-recruitment-demo.ts | Recruitment | demo-recruitment | NOT EXECUTED |
| seed-project-management-demo.ts | Project Mgmt | demo-project | NOT EXECUTED |
| seed-legal-practice-demo.ts | Legal Practice | demo-legal | NOT EXECUTED |
| seed-advanced-warehouse-demo.ts | Warehouse | demo-warehouse | NOT EXECUTED |

### Newly Created Scripts (Phase D2)

| Script | Suite | Priority | Tenant Slug | Status |
|--------|-------|----------|-------------|--------|
| seed-products-demo.ts | Commerce/Inventory | P0 | demo-retail-store | CREATED |
| seed-education-demo.ts | Education | P0 | demo-school | CREATED |
| seed-health-demo.ts | Health | P0 | demo-clinic | CREATED |
| seed-hospitality-demo.ts | Hospitality | P1 | demo-hotel | CREATED |
| seed-civic-demo.ts | Civic | P1 | demo-civic | CREATED |
| seed-church-demo.ts | Church | P2 | demo-church | CREATED |
| seed-political-demo.ts | Political | P2 | demo-political | CREATED |
| seed-logistics-demo.ts | Logistics | P2 | demo-logistics | CREATED |
| seed-real-estate-demo.ts | Real Estate | P2 | demo-real-estate | CREATED |

---

## Detailed Script Information

### seed-products-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Commerce/Inventory |
| **Target Tenant** | demo-retail-store (Lagos Retail Store) |
| **Priority** | P0 (Critical) |
| **Personas Supported** | Store Manager, Cashier, Stock Clerk |
| **Use Cases Enabled** | UC-C1 (POS Sale), UC-C2 (Day Close), UC-C3 (Receive Inventory), UC-C4 (Online Purchase) |
| **Dependencies** | None (foundation script) |
| **Execution Order** | 1 (run first) |
| **Entities Created** | ProductCategory (10), Product (42), ProductVariant (6), InventoryLevel (42) |

---

### seed-education-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Education |
| **Target Tenant** | demo-school (Bright Future Academy) |
| **Priority** | P0 (Critical) |
| **Personas Supported** | Principal, Teacher, Bursar, Student, Parent |
| **Use Cases Enabled** | UC-E1 (Attendance), UC-E2 (Grades), UC-E3 (Fee Payment), UC-E4 (Report Card), UC-E5 (Analytics) |
| **Dependencies** | None |
| **Execution Order** | 5 |
| **Entities Created** | Session (1), Term (3), Class (9), Subject (15), Staff (15), Student (35), FeeStructure (7) |

---

### seed-health-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Health |
| **Target Tenant** | demo-clinic (HealthFirst Clinic) |
| **Priority** | P0 (Critical) |
| **Personas Supported** | Medical Director, Doctor, Nurse, Receptionist, Patient |
| **Use Cases Enabled** | UC-H1 (Appointment), UC-H2 (Vitals), UC-H3 (Consultation), UC-H4 (Prescription), UC-H5 (History) |
| **Dependencies** | None |
| **Execution Order** | 6 |
| **Entities Created** | Facility (1), Provider (10), Patient (15), Appointment (8), Config (1) |

---

### seed-hospitality-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Hospitality |
| **Target Tenant** | demo-hotel (PalmView Suites Lagos) |
| **Priority** | P1 (High) |
| **Personas Supported** | General Manager, Front Desk, Housekeeping, Guest |
| **Use Cases Enabled** | UC-HO1 (Reservation), UC-HO2 (Check-in), UC-HO3 (Housekeeping), UC-HO4 (Room Service), UC-HO5 (Reports) |
| **Dependencies** | None |
| **Execution Order** | 7 |
| **Entities Created** | Venue (1), Floor (6), Room (16), Staff (10), Guest (10), Reservation (6), Config (1) |

---

### seed-civic-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Civic |
| **Target Tenant** | demo-civic (Lagos State Lands Bureau) |
| **Priority** | P1 (High) |
| **Personas Supported** | Director, Case Officer, Citizen |
| **Use Cases Enabled** | UC-CV1 (Submit Request), UC-CV2 (Process Request), UC-CV3 (Inspection), UC-CV4 (Certificate), UC-CV5 (Voting) |
| **Dependencies** | None |
| **Execution Order** | 8 |
| **Entities Created** | Agency (1), Department (5), Service (10), Staff (10), Citizen (10), Request (6), Config (1) |

---

### seed-church-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Church |
| **Target Tenant** | demo-church (GraceLife Community Church) |
| **Priority** | P2 (Optional) |
| **Personas Supported** | Pastor, Deacon, Member |
| **Use Cases Enabled** | UC-CH1 (Giving), UC-CH2 (Attendance), UC-CH3 (Cell Groups), UC-CH4 (Reports) |
| **Dependencies** | None |
| **Execution Order** | 9 |
| **Entities Created** | Church (1), Unit (4), Ministry (10), CellGroup (8), Role (8), Member (20) |

---

### seed-political-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Political |
| **Target Tenant** | demo-political (Lagos Campaign HQ) |
| **Priority** | P2 (Optional) |
| **Personas Supported** | Chairman, Secretary, Volunteer |
| **Use Cases Enabled** | UC-PO1 (Register Member), UC-PO2 (Donation), UC-PO3 (Campaign), UC-PO4 (Primary) |
| **Dependencies** | None |
| **Execution Order** | 10 |
| **Entities Created** | Party (1), Organ (7), Member (15), Campaign (4), Candidate (3) |

---

### seed-logistics-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Logistics |
| **Target Tenant** | demo-logistics (Swift Logistics) |
| **Priority** | P2 (Optional) |
| **Personas Supported** | Dispatch Manager, Delivery Agent |
| **Use Cases Enabled** | Zone management, Agent assignment, Pricing rules |
| **Dependencies** | Commerce suite (for delivery integration) |
| **Execution Order** | 11 |
| **Entities Created** | Zone (8), Agent (8), PricingRule (5), Config (1) |

---

### seed-real-estate-demo.ts

| Property | Value |
|----------|-------|
| **Suite** | Real Estate |
| **Target Tenant** | demo-real-estate (Lagos Property Managers) |
| **Priority** | P2 (Optional) |
| **Personas Supported** | Property Manager, Tenant |
| **Use Cases Enabled** | Property listing, Unit management, Lease tracking, Maintenance |
| **Dependencies** | None |
| **Execution Order** | 12 |
| **Entities Created** | Property (5), Unit (18), Lease (8), MaintenanceRequest (5) |

---

## Recommended Execution Order

```bash
cd frontend

# Phase 1: Commerce Foundation
npx ts-node --project tsconfig.json scripts/seed-products-demo.ts
npx ts-node --project tsconfig.json scripts/seed-pos-demo.ts
npx ts-node --project tsconfig.json scripts/seed-svm-demo.ts
npx ts-node --project tsconfig.json scripts/seed-mvm-demo.ts

# Phase 2: Core Verticals
npx ts-node --project tsconfig.json scripts/seed-education-demo.ts
npx ts-node --project tsconfig.json scripts/seed-health-demo.ts
npx ts-node --project tsconfig.json scripts/seed-hospitality-demo.ts
npx ts-node --project tsconfig.json scripts/seed-civic-demo.ts

# Phase 3: Specialized
npx ts-node --project tsconfig.json scripts/seed-recruitment-demo.ts
npx ts-node --project tsconfig.json scripts/seed-project-management-demo.ts
npx ts-node --project tsconfig.json scripts/seed-legal-practice-demo.ts
npx ts-node --project tsconfig.json scripts/seed-advanced-warehouse-demo.ts

# Phase 4: Community
npx ts-node --project tsconfig.json scripts/seed-church-demo.ts
npx ts-node --project tsconfig.json scripts/seed-political-demo.ts

# Phase 5: Support
npx ts-node --project tsconfig.json scripts/seed-logistics-demo.ts
npx ts-node --project tsconfig.json scripts/seed-real-estate-demo.ts
```

---

## Script Design Compliance

All scripts comply with Phase D2 requirements:

| Requirement | Status |
|-------------|--------|
| Written in TypeScript | ✅ |
| Uses PrismaClient | ✅ |
| Hard-fails if Demo Partner missing | ✅ |
| Hard-fails if target tenant missing | ✅ |
| Hard-fails if tenant not owned by Demo Partner | ✅ |
| Follows layered seeding (Config → Operational → Transactions) | ✅ |
| Idempotent-safe (guards against duplicates) | ✅ |
| Uses realistic African-context data | ✅ |
| Includes required header comment | ✅ |

---

## Demo Partner Reference

| Property | Value |
|----------|-------|
| Partner ID | `63a86a6a-b40d-4825-8d44-cce8aa893c42` |
| Partner Name | WebWaka Demo Partner |

## Demo Tenant Reference

| Slug | Name | Suite |
|------|------|-------|
| demo-retail-store | Lagos Retail Store | Commerce/POS/SVM |
| demo-marketplace | Naija Market Hub | Commerce/MVM |
| demo-b2b | B2B Wholesale Hub | Commerce/B2B |
| demo-school | Bright Future Academy | Education |
| demo-clinic | HealthFirst Clinic | Health |
| demo-logistics | Swift Logistics | Logistics |
| demo-hotel | PalmView Suites Lagos | Hospitality |
| demo-civic | Lagos State Lands Bureau | Civic |
| demo-real-estate | Lagos Property Managers | Real Estate |
| demo-recruitment | Swift HR Solutions | Recruitment |
| demo-project | BuildRight Projects Ltd | Project Mgmt |
| demo-legal | Nwosu & Associates Chambers | Legal Practice |
| demo-warehouse | Lagos Fulfillment Center | Warehouse |
| demo-parkhub | Ojota Motor Park | ParkHub |
| demo-political | Lagos Campaign HQ | Political |
| demo-church | GraceLife Community Church | Church |

---

*End of Demo Seed Script Index*
