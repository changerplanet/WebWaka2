# Demo Seed Script Plan

**Document Type:** Design Document (READ-ONLY)  
**Date:** January 14, 2026  
**Scope:** Demo Partner Only  
**Status:** DESIGN ONLY - NO EXECUTION

---

## Existing Seed Scripts Inventory

| Script | Path | Size | Target Suite | Executed |
|--------|------|------|--------------|----------|
| seed-demo-partner-master.ts | `/scripts/` | 45KB | Partner Infrastructure | YES |
| seed-pos-demo.ts | `/scripts/` | 11KB | Commerce/POS | NO |
| seed-svm-demo.ts | `/scripts/` | 13KB | Commerce/SVM | NO |
| seed-mvm-demo.ts | `/scripts/` | 24KB | Commerce/MVM | NO |
| seed-recruitment-demo.ts | `/scripts/` | 15KB | Recruitment | NO |
| seed-project-management-demo.ts | `/scripts/` | 17KB | Project Mgmt | NO |
| seed-legal-practice-demo.ts | `/scripts/` | 51KB | Legal Practice | NO |
| seed-advanced-warehouse-demo.ts | `/scripts/` | 22KB | Warehouse | NO |
| seed-pos-capability.ts | `/scripts/` | 2KB | Capability Registry | UNKNOWN |
| seed-svm-capability.ts | `/scripts/` | 4KB | Capability Registry | UNKNOWN |
| seed-demo-environment.ts | `/scripts/` | 34KB | General | UNKNOWN |

---

## Required New Seed Scripts

### Priority 1: Commerce Foundation

#### seed-products-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Commerce/Inventory |
| Target Tenant | demo-retail-store, demo-marketplace |
| Dependencies | None (foundation script) |
| Entities to Seed | Product, ProductCategory, ProductVariant, InventoryLevel |
| Record Counts | 50 products, 10 categories, 100 variants, 200 stock levels |
| Use Cases Supported | UC-C1, UC-C2, UC-C3, UC-C4, UC-C5 |

**Sample Data Design:**
- Categories: Electronics, Fashion, Groceries, Home, Beauty, etc.
- Products: Mix of African-relevant items (phone, ankara, rice, etc.)
- Pricing: Nigerian Naira ranges (₦500 - ₦500,000)
- Stock: Varied levels (some low, some high)

---

### Priority 2: Core Verticals

#### seed-education-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Education |
| Target Tenant | demo-school (Bright Future Academy) |
| Dependencies | Products for fee items |
| Entities to Seed | Students, Classes, Subjects, Teachers, Terms, Fees, Grades, Attendance |
| Record Counts | 100 students, 10 classes, 20 subjects, 15 staff |
| Use Cases Supported | UC-E1 through UC-E5 |

**Sample Data Design:**
- Classes: JSS1-3, SS1-3 (Nigerian secondary structure)
- Subjects: Mathematics, English, Science, etc.
- Students: Nigerian names, varied performance levels
- Fees: Term fees, exam fees, uniform fees

---

#### seed-health-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Health |
| Target Tenant | demo-clinic (HealthFirst Clinic) |
| Dependencies | None |
| Entities to Seed | Patients, Providers, Appointments, Encounters, Prescriptions, Lab Orders |
| Record Counts | 50 patients, 10 providers, 100 appointments, 50 encounters |
| Use Cases Supported | UC-H1 through UC-H5 |

**Sample Data Design:**
- Patients: Nigerian demographics, varied ages
- Providers: Doctors, Nurses with specializations
- Diagnoses: Common conditions (malaria, typhoid, hypertension)
- Medications: Common African market drugs

---

#### seed-hospitality-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Hospitality |
| Target Tenant | demo-hotel (PalmView Suites Lagos) |
| Dependencies | None |
| Entities to Seed | Rooms, Floors, Guests, Reservations, Stays, Housekeeping |
| Record Counts | 50 rooms, 5 floors, 100 guests, 200 reservations |
| Use Cases Supported | UC-HO1 through UC-HO5 |

**Sample Data Design:**
- Rooms: Standard, Deluxe, Suite, Presidential
- Rates: Nigerian Naira pricing
- Guests: Mix of local and international
- Reservations: Past, current, future dates

---

#### seed-civic-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Civic |
| Target Tenant | demo-civic (Lagos State Lands Bureau) |
| Dependencies | None |
| Entities to Seed | Citizens, Services, Requests, Cases, Staff, Inspections |
| Record Counts | 100 citizens, 20 services, 50 requests, 30 cases |
| Use Cases Supported | UC-CV1 through UC-CV5 |

**Sample Data Design:**
- Services: Land registration, Building permits, Certificates
- Citizens: Lagos residents with LGA assignments
- Cases: Varied statuses (pending, in-progress, resolved)

---

### Priority 3: Community Suites

#### seed-church-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Church |
| Target Tenant | demo-church (GraceLife Community Church) |
| Dependencies | None |
| Entities to Seed | Members, Ministries, Cells, Giving, Attendance, Events |
| Record Counts | 200 members, 10 ministries, 20 cells |
| Use Cases Supported | UC-CH1 through UC-CH4 |

---

#### seed-political-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Political |
| Target Tenant | demo-political (Lagos Campaign HQ) |
| Dependencies | None |
| Entities to Seed | Members, Campaigns, Candidates, Donations, Events |
| Record Counts | 100 members, 5 campaigns, 10 candidates |
| Use Cases Supported | UC-PO1 through UC-PO4 |

---

### Priority 4: Support Suites

#### seed-logistics-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Logistics |
| Target Tenant | demo-logistics (Swift Logistics) |
| Entities | Zones, Agents, Jobs, Assignments |
| Record Counts | 10 zones, 20 agents, 100 jobs |

---

#### seed-real-estate-demo.ts (NEW)
| Attribute | Value |
|-----------|-------|
| Target Suite | Real Estate |
| Target Tenant | demo-real-estate (Lagos Property Managers) |
| Entities | Properties, Units, Leases, Tenants |
| Record Counts | 10 properties, 50 units, 30 leases |

---

## Execution Order & Dependencies

```
Phase 0: Infrastructure (DONE)
└── seed-demo-partner-master.ts ✓

Phase 1: Commerce Foundation
├── 1.1 seed-products-demo.ts (NEW - foundation)
├── 1.2 seed-pos-demo.ts (exists)
├── 1.3 seed-svm-demo.ts (exists)
└── 1.4 seed-mvm-demo.ts (exists)

Phase 2: Core Verticals
├── 2.1 seed-education-demo.ts (NEW)
├── 2.2 seed-health-demo.ts (NEW)
├── 2.3 seed-hospitality-demo.ts (NEW)
└── 2.4 seed-civic-demo.ts (NEW)

Phase 3: Specialized
├── 3.1 seed-recruitment-demo.ts (exists)
├── 3.2 seed-project-management-demo.ts (exists)
├── 3.3 seed-legal-practice-demo.ts (exists)
└── 3.4 seed-advanced-warehouse-demo.ts (exists)

Phase 4: Community
├── 4.1 seed-church-demo.ts (NEW)
└── 4.2 seed-political-demo.ts (NEW)

Phase 5: Support
├── 5.1 seed-logistics-demo.ts (NEW)
└── 5.2 seed-real-estate-demo.ts (NEW)
```

---

## Script Template Structure

Each seed script should follow this pattern:

```typescript
/**
 * Demo Seed: [Suite Name]
 * Target Tenant: [tenant slug]
 * Run: npx ts-node scripts/seed-[suite]-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Demo Partner and Tenant IDs
const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const TARGET_TENANT_ID = '[from tenant table]'

async function main() {
  console.log('Starting [Suite] demo seeding...')
  
  // 1. Verify tenant exists and belongs to Demo Partner
  const tenant = await prisma.tenant.findFirst({
    where: { id: TARGET_TENANT_ID, partnerId: DEMO_PARTNER_ID }
  })
  if (!tenant) throw new Error('Demo tenant not found')
  
  // 2. Seed configuration data
  await seedConfigurations()
  
  // 3. Seed operational data
  await seedOperationalData()
  
  // 4. Seed transaction/history data
  await seedTransactionData()
  
  console.log('[Suite] demo seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## Data Volume Guidelines

| Suite | Minimal (L1) | Functional (L2) | Narrative (L3) |
|-------|--------------|-----------------|----------------|
| Commerce/POS | 10 products, 5 sales | 50 products, 50 sales | 100 products, 500 sales |
| Education | 20 students | 100 students, grades | 100 students, 3 terms history |
| Health | 10 patients | 50 patients, appts | 50 patients, encounter history |
| Hospitality | 10 rooms | 50 rooms, reservations | Full hotel with history |
| Civic | 10 services | 50 requests | 100 cases with lifecycle |

---

## Cleanup Script Design

```typescript
/**
 * Demo Data Cleanup
 * Run: npx ts-node scripts/cleanup-demo-data.ts
 */

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'

// Get all demo tenant IDs
const demoTenants = await prisma.tenant.findMany({
  where: { partnerId: DEMO_PARTNER_ID },
  select: { id: true }
})

const demoTenantIds = demoTenants.map(t => t.id)

// Delete in reverse dependency order
// (transactions before entities before config)
```

---

## Execution Checklist (Design Only)

### Pre-Execution
- [ ] Verify Demo Partner exists
- [ ] Verify all 16 Demo Tenants exist
- [ ] Verify database connectivity
- [ ] Backup current state (optional)

### Per-Script Execution
- [ ] Run script
- [ ] Verify record counts
- [ ] Test role access
- [ ] Validate relationships
- [ ] Check dashboard displays

### Post-Execution
- [ ] All use cases testable
- [ ] No orphan records
- [ ] Role permissions work
- [ ] Cross-suite links work

---

*End of Demo Seed Script Plan*
