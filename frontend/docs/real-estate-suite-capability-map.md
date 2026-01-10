# Real Estate Management — S0–S1 Capability Mapping

## Document Info
- **Suite**: Real Estate Management
- **Phase**: 7A (First Domain)
- **Step**: S0–S1 (Capability Mapping)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: January 6, 2026
- **Author**: E1 Agent

---

## 1️⃣ SUITE OVERVIEW

### Purpose
The **Real Estate Management** suite enables Partners to manage properties, units, leases, rent collection, and maintenance requests. It serves landlords, property managers, and real estate agencies operating in Nigeria's rental market.

### Strategic Positioning

| Aspect | Position |
|--------|----------|
| **Primary Value** | Property portfolio and tenant management |
| **Target Market** | Landlords, property managers, estate agents |
| **Architecture Role** | Establishes asset + tenancy primitives for other Phase 7 domains |
| **Maturity Level** | Production-grade (database-backed) |

### How Real Estate Fits Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WEBWAKA PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              REAL ESTATE MANAGEMENT SUITE (NEW)                   │  │
│  │                                                                   │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │
│  │   │ Property │  │   Unit   │  │  Lease   │  │  Rent    │        │  │
│  │   │  Mgmt    │  │   Mgmt   │  │   Mgmt   │  │ Schedule │        │  │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │  │
│  │        │             │             │             │               │  │
│  │        └─────────────┴─────────────┴─────────────┘               │  │
│  │                           │                                       │  │
│  └───────────────────────────┼───────────────────────────────────────┘  │
│                              │                                          │
│  ┌───────────────────────────▼───────────────────────────────────────┐  │
│  │                    REUSED EXISTING SUITES                         │  │
│  │                                                                   │  │
│  │   CRM (Tenants)  │  Billing (Rent)  │  Payments  │  Logistics    │  │
│  │                                       (NGN)       (Maintenance)   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ TARGET CUSTOMERS

### Primary User: Partners ✅

Partners use Real Estate to:
- Manage property portfolios for clients
- Track tenants and leases
- Automate rent collection
- Handle maintenance requests

### Target Partner Profiles

| Profile | Use Case |
|---------|----------|
| Property Managers | Multi-property portfolios |
| Estate Agents | Rental listings and tenant placement |
| Landlords (Direct) | Self-managed properties |
| Facility Managers | Commercial property operations |

### Secondary User: Tenants 🟡

Tenants may:
- View lease details
- Pay rent online
- Submit maintenance requests
- Access receipts

---

## 3️⃣ CAPABILITY MAPPING TABLE

### Legend
- **Source**: `NEW` = Requires new model, `REUSE` = Existing module
- **Schema Impact**: `ADDITIVE` = New tables, `NONE` = Config only

---

### 🧩 Property Management

| # | Capability | Source | Schema Impact | Reuse From | Notes |
|---|------------|--------|---------------|------------|-------|
| 1 | **Property CRUD** | NEW | ADDITIVE | - | Create, read, update, delete properties |
| 2 | **Property Types** | NEW | ADDITIVE | - | Residential, Commercial, Mixed |
| 3 | **Property Address** | NEW | ADDITIVE | - | Nigerian address format |
| 4 | **Property Media** | REUSE | NONE | Sites & Funnels | Photos, documents |
| 5 | **Property Status** | NEW | ADDITIVE | - | Available, Occupied, Maintenance |
| 6 | **Property Amenities** | NEW | ADDITIVE | - | Metadata field |
| 7 | **Property Owner Link** | REUSE | NONE | CRM | Contact as owner |

### 🧩 Unit Management

| # | Capability | Source | Schema Impact | Reuse From | Notes |
|---|------------|--------|---------------|------------|-------|
| 8 | **Unit CRUD** | NEW | ADDITIVE | - | Units within properties |
| 9 | **Unit Types** | NEW | ADDITIVE | - | Flat, Room, Shop, Office |
| 10 | **Unit Specifications** | NEW | ADDITIVE | - | Bedrooms, bathrooms, size |
| 11 | **Unit Pricing** | NEW | ADDITIVE | - | Monthly rent, service charge |
| 12 | **Unit Status** | NEW | ADDITIVE | - | Vacant, Occupied, Reserved |
| 13 | **Unit Media** | REUSE | NONE | Sites & Funnels | Photos |

### 🧩 Lease Management

| # | Capability | Source | Schema Impact | Reuse From | Notes |
|---|------------|--------|---------------|------------|-------|
| 14 | **Lease CRUD** | NEW | ADDITIVE | - | Lease agreements |
| 15 | **Lease Duration** | NEW | ADDITIVE | - | Start/end dates |
| 16 | **Lease Terms** | NEW | ADDITIVE | - | Deposit, notice period |
| 17 | **Lease Status** | NEW | ADDITIVE | - | Active, Expired, Terminated |
| 18 | **Tenant Assignment** | REUSE | NONE | CRM | Link to Contact |
| 19 | **Lease Documents** | REUSE | NONE | Sites & Funnels | PDF storage |
| 20 | **Lease Renewal** | NEW | ADDITIVE | - | Renewal workflow |

### 🧩 Rent Collection

| # | Capability | Source | Schema Impact | Reuse From | Notes |
|---|------------|--------|---------------|------------|-------|
| 21 | **Rent Schedule** | NEW | ADDITIVE | - | Payment schedule per lease |
| 22 | **Rent Due Dates** | NEW | ADDITIVE | - | Monthly/quarterly/annual |
| 23 | **Rent Tracking** | NEW | ADDITIVE | - | Paid, Overdue, Partial |
| 24 | **Service Charges** | NEW | ADDITIVE | - | Additional fees |
| 25 | **Payment Processing** | REUSE | NONE | Payments | NGN transfers |
| 26 | **Receipt Generation** | REUSE | NONE | Billing | Automated receipts |
| 27 | **Payment Reminders** | REUSE | NONE | CRM/Marketing | SMS/Email |
| 28 | **Late Payment Fees** | NEW | ADDITIVE | - | Penalty calculations |

### 🧩 Maintenance Requests

| # | Capability | Source | Schema Impact | Reuse From | Notes |
|---|------------|--------|---------------|------------|-------|
| 29 | **Maintenance Request** | NEW | ADDITIVE | - | Tenant-submitted requests |
| 30 | **Request Categories** | NEW | ADDITIVE | - | Plumbing, Electrical, etc. |
| 31 | **Request Status** | NEW | ADDITIVE | - | Open, In Progress, Resolved |
| 32 | **Priority Levels** | NEW | ADDITIVE | - | Low, Medium, High, Emergency |
| 33 | **Technician Assignment** | REUSE | NONE | Logistics | Dispatch to jobs |
| 34 | **Cost Tracking** | REUSE | NONE | Accounting | Expense recording |
| 35 | **Completion Photos** | REUSE | NONE | Sites & Funnels | Before/after |

### 🧩 Reporting & Analytics

| # | Capability | Source | Schema Impact | Reuse From | Notes |
|---|------------|--------|---------------|------------|-------|
| 36 | **Occupancy Rate** | NEW | NONE | - | Calculated metric |
| 37 | **Rent Collection Rate** | NEW | NONE | - | Calculated metric |
| 38 | **Vacancy Report** | NEW | NONE | - | Available units |
| 39 | **Maintenance Costs** | REUSE | NONE | Accounting | Aggregated |
| 40 | **Tenant Directory** | REUSE | NONE | CRM | Contact list |

---

## 4️⃣ CAPABILITY SUMMARY

### Overall Coverage

| Category | Capabilities | New | Reuse | Coverage |
|----------|-------------|-----|-------|----------|
| Property Management | 7 | 5 | 2 | Full |
| Unit Management | 6 | 5 | 1 | Full |
| Lease Management | 7 | 5 | 2 | Full |
| Rent Collection | 8 | 4 | 4 | Full |
| Maintenance | 7 | 4 | 3 | Full |
| Reporting | 5 | 3 | 2 | Full |
| **TOTAL** | **40** | **26** | **14** | **100%** |

### Reuse Matrix

| Existing Module | Reused For | Integration Type |
|-----------------|------------|------------------|
| **CRM** | Tenants, Landlords, Owners | Contact linking |
| **Billing** | Rent invoices, Receipts | Invoice generation |
| **Payments** | Rent collection (NGN) | Payment processing |
| **Logistics** | Maintenance dispatch | Job assignment |
| **Accounting** | Expense tracking | Cost recording |
| **Sites & Funnels** | Media, Documents | File storage |
| **Marketing** | Payment reminders | SMS/Email |

**Effective Reuse: 35%** (14 of 40 capabilities)

---

## 5️⃣ GAP REGISTER

### Gaps Identified: NONE (For Scope)

All required capabilities are covered through:
- New additive models (26 capabilities)
- Existing module reuse (14 capabilities)

### Explicitly Excluded (Per Guardrails)

| Excluded | Reason |
|----------|--------|
| ❌ Mortgages | Regulated financial product |
| ❌ Land Registry | Government integration |
| ❌ Utility Metering | IoT/hardware dependency |
| ❌ Property Valuation | Requires external data |
| ❌ Escrow | Banking regulation |

---

## 6️⃣ PROPOSED PRISMA SCHEMA (FOR REVIEW)

### ⚠️ SCHEMA CHANGES — AWAITING APPROVAL

The following models are proposed. **No migration will occur until explicitly approved.**

```prisma
// ============================================================================
// REAL ESTATE MANAGEMENT — PROPOSED SCHEMA
// Phase 7A, Domain 1
// ============================================================================

// Property Types Enum
enum PropertyType {
  RESIDENTIAL
  COMMERCIAL
  MIXED
  LAND
}

enum PropertyStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
  UNLISTED
}

enum UnitType {
  FLAT
  ROOM
  SHOP
  OFFICE
  WAREHOUSE
  PARKING
}

enum UnitStatus {
  VACANT
  OCCUPIED
  RESERVED
  MAINTENANCE
}

enum LeaseStatus {
  DRAFT
  ACTIVE
  EXPIRED
  TERMINATED
  RENEWED
}

enum RentFrequency {
  MONTHLY
  QUARTERLY
  BIANNUALLY
  ANNUALLY
}

enum RentPaymentStatus {
  PENDING
  PAID
  PARTIAL
  OVERDUE
  WAIVED
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  STRUCTURAL
  HVAC
  CLEANING
  SECURITY
  OTHER
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

enum MaintenanceStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ============================================================================
// CORE MODELS
// ============================================================================

model Property {
  id                String          @id @default(cuid())
  tenantId          String
  platformInstanceId String
  
  // Basic Info
  name              String
  propertyType      PropertyType
  status            PropertyStatus  @default(AVAILABLE)
  
  // Address (Nigerian format)
  address           String
  city              String
  state             String
  lga               String?         // Local Government Area
  landmark          String?         // Nigerian convention
  
  // Details
  description       String?
  yearBuilt         Int?
  totalUnits        Int             @default(1)
  amenities         Json?           // Flexible metadata
  
  // Media
  photos            String[]        @default([])
  documents         String[]        @default([])
  
  // Owner (linked to CRM Contact)
  ownerId           String?
  ownerName         String?
  ownerPhone        String?
  ownerEmail        String?
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  createdBy         String?
  
  // Relations
  units             Unit[]
  maintenanceRequests MaintenanceRequest[]
  
  @@index([tenantId])
  @@index([platformInstanceId])
  @@index([status])
  @@index([propertyType])
}

model Unit {
  id                String          @id @default(cuid())
  tenantId          String
  propertyId        String
  
  // Basic Info
  unitNumber        String          // e.g., "Flat 5", "Shop A3"
  unitType          UnitType
  status            UnitStatus      @default(VACANT)
  
  // Specifications
  bedrooms          Int?
  bathrooms         Int?
  sizeSqm           Float?
  floor             Int?
  
  // Pricing (NGN)
  monthlyRent       Float
  serviceCharge     Float           @default(0)
  cautionDeposit    Float           @default(0)
  
  // Features
  features          String[]        @default([])
  photos            String[]        @default([])
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Relations
  property          Property        @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  leases            Lease[]
  
  @@unique([propertyId, unitNumber])
  @@index([tenantId])
  @@index([status])
  @@index([propertyId])
}

model Lease {
  id                String          @id @default(cuid())
  tenantId          String
  unitId            String
  
  // Lease Number
  leaseNumber       String          @unique
  
  // Tenant Info (linked to CRM Contact)
  tenantContactId   String?
  tenantName        String
  tenantPhone       String
  tenantEmail       String?
  
  // Lease Terms
  startDate         DateTime
  endDate           DateTime
  status            LeaseStatus     @default(DRAFT)
  
  // Financial Terms (NGN)
  monthlyRent       Float
  serviceCharge     Float           @default(0)
  securityDeposit   Float           @default(0)
  depositPaid       Boolean         @default(false)
  
  // Terms
  rentFrequency     RentFrequency   @default(ANNUALLY)
  noticePeriodDays  Int             @default(30)
  
  // Documents
  documents         String[]        @default([])
  notes             String?
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  createdBy         String?
  
  // Relations
  unit              Unit            @relation(fields: [unitId], references: [id])
  rentSchedules     RentSchedule[]
  
  @@index([tenantId])
  @@index([unitId])
  @@index([status])
  @@index([tenantContactId])
}

model RentSchedule {
  id                String              @id @default(cuid())
  tenantId          String
  leaseId           String
  
  // Schedule Details
  dueDate           DateTime
  amount            Float               // NGN
  description       String?             // e.g., "January 2026 Rent"
  
  // Payment Status
  status            RentPaymentStatus   @default(PENDING)
  paidAmount        Float               @default(0)
  paidDate          DateTime?
  
  // Late Fees
  lateFee           Float               @default(0)
  lateFeeApplied    Boolean             @default(false)
  
  // Payment Reference (links to Payments module)
  paymentReference  String?
  receiptNumber     String?
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Relations
  lease             Lease               @relation(fields: [leaseId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@index([leaseId])
  @@index([status])
  @@index([dueDate])
}

model MaintenanceRequest {
  id                String              @id @default(cuid())
  tenantId          String
  propertyId        String
  unitId            String?
  leaseId           String?
  
  // Request Details
  requestNumber     String              @unique
  category          MaintenanceCategory
  priority          MaintenancePriority @default(MEDIUM)
  status            MaintenanceStatus   @default(OPEN)
  
  // Description
  title             String
  description       String
  
  // Requester (Tenant)
  requesterName     String
  requesterPhone    String
  requesterEmail    String?
  
  // Assignment (links to Logistics)
  assignedTo        String?
  assignedName      String?
  scheduledDate     DateTime?
  completedDate     DateTime?
  
  // Cost (links to Accounting)
  estimatedCost     Float?
  actualCost        Float?
  costNotes         String?
  
  // Media
  photosBefore      String[]            @default([])
  photosAfter       String[]            @default([])
  
  // Resolution
  resolutionNotes   String?
  
  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Relations
  property          Property            @relation(fields: [propertyId], references: [id])
  
  @@index([tenantId])
  @@index([propertyId])
  @@index([status])
  @@index([priority])
  @@index([category])
}
```

---

## 7️⃣ SCHEMA IMPACT ASSESSMENT

### New Tables (5)

| Table | Purpose | Rows Expected |
|-------|---------|---------------|
| `Property` | Property portfolio | 100s per tenant |
| `Unit` | Units within properties | 1000s per tenant |
| `Lease` | Tenant agreements | 100s per tenant |
| `RentSchedule` | Payment tracking | 1000s per tenant |
| `MaintenanceRequest` | Service requests | 100s per tenant |

### New Enums (10)

All enums are additive and do not affect existing tables.

### Foreign Keys

| From | To | Type |
|------|------|------|
| Unit | Property | CASCADE delete |
| Lease | Unit | Standard |
| RentSchedule | Lease | CASCADE delete |
| MaintenanceRequest | Property | Standard |

### Existing Tables Affected: NONE

No changes to existing Commerce, CRM, or other suite tables.

---

## 8️⃣ NIGERIA-FIRST DEFAULTS

| Feature | Default | Notes |
|---------|---------|-------|
| Currency | NGN | All amounts in Naira |
| Address | State + LGA + Landmark | Nigerian format |
| Rent Frequency | Annual | Common in Nigeria |
| States | Nigerian states | Dropdown values |
| Phone Format | Nigerian mobile | 080/081/090/070/091 |

---

## 9️⃣ EXPLICITLY EXCLUDED (NON-GOALS)

| Excluded | Reason |
|----------|--------|
| ❌ Mortgages & Financing | Regulated financial product |
| ❌ Land Registry Integration | Government API dependency |
| ❌ Property Valuation | Requires market data |
| ❌ Utility Metering | IoT hardware |
| ❌ Escrow Services | Banking regulation |
| ❌ Multi-currency | Nigeria-first |

---

## 📌 AUTHORIZATION REQUEST

### What This Document Establishes

1. ✅ Real Estate Management capability scope is defined
2. ✅ 40 capabilities mapped (26 new, 14 reused)
3. ✅ 35% reuse from existing modules
4. ✅ Schema is additive-only (no breaking changes)
5. ✅ 5 new tables, 10 new enums proposed
6. ✅ Nigeria-first defaults applied

### Approval Required For

1. **Capability Scope** — Approve the 40 capabilities as defined
2. **Proposed Schema** — Approve the 5 new Prisma models
3. **Proceed to S2** — Authorization to create migrations and implement

---

## 📎 NEXT STEPS (AFTER APPROVAL)

Upon approval:
1. Generate Prisma migration (reversible)
2. Implement core services (S2)
3. Create API routes (S3)
4. Build Admin UI (S4)
5. Add demo data (S5)
6. Verification & Freeze (S6)

---

*Document submitted for approval. Awaiting authorization to proceed with schema migration.*
