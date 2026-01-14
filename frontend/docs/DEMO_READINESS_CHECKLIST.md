# Demo Readiness Checklist

**Document Type:** Design Document (READ-ONLY)  
**Date:** January 14, 2026  
**Scope:** Demo Partner Only  
**Status:** DESIGN ONLY - NO EXECUTION

---

## Overview

This checklist defines what must be true for the WebWaka platform to be "demo-ready" at various levels.

---

## Readiness Levels

| Level | Name | Definition |
|-------|------|------------|
| L0 | Infrastructure Ready | Partner, Tenants, Users exist |
| L1 | Minimal Demo | At least one suite has walkthrough data |
| L2 | Sales Demo | Core suites have functional workflows |
| L3 | Full Demo | All suites demo-ready with narratives |
| L4 | Public Demo | Production-quality, any audience |

---

## Current State Assessment

| Check | Status | Notes |
|-------|--------|-------|
| Demo Partner exists | ✅ PASS | WebWaka Demo Partner |
| Demo Partner Users exist | ✅ PASS | 5 roles configured |
| Demo Tenants exist | ✅ PASS | 16 tenants across suites |
| User authentication works | ✅ PASS | Magic link functional |
| Role-based filtering works | ✅ PASS | STAFF filtering fixed |
| Any module has data | ❌ FAIL | All module tables empty |

**Current Readiness Level: L0 (Infrastructure Ready)**

---

## L1: Minimal Demo Checklist

### Requirements
At least ONE suite has enough data to demonstrate a complete workflow.

| Item | Suite | Check | Status |
|------|-------|-------|--------|
| Products exist | Commerce | 10+ products in catalog | ⬜ NOT DONE |
| POS sale can be made | Commerce/POS | Complete sale transaction | ⬜ NOT DONE |
| Order can be placed | Commerce/SVM | Full checkout flow | ⬜ NOT DONE |
| Dashboard shows data | Partner | Widgets have values | ⬜ NOT DONE |

### To Achieve L1
```bash
# Execute these scripts (in order):
cd frontend
npx ts-node scripts/seed-products-demo.ts  # NEW (needs creation)
npx ts-node scripts/seed-pos-demo.ts
```

---

## L2: Sales Demo Checklist

### Requirements
Core suites (Commerce, Education, Health) have functional end-to-end workflows.

### Commerce Suite
| Check | Description | Status |
|-------|-------------|--------|
| POS workflow | Open shift → Sale → Close shift | ⬜ |
| SVM workflow | Browse → Cart → Checkout → Order | ⬜ |
| MVM workflow | Vendor signup → List product → Order → Commission | ⬜ |
| Inventory workflow | Receive → Stock → Transfer | ⬜ |
| Reports work | Daily sales, inventory reports show data | ⬜ |

### Education Suite
| Check | Description | Status |
|-------|-------------|--------|
| Student enrollment | Add student to class | ⬜ |
| Attendance | Mark daily attendance | ⬜ |
| Grades | Enter and view grades | ⬜ |
| Fees | Record fee payment | ⬜ |
| Report cards | Generate report card | ⬜ |

### Health Suite
| Check | Description | Status |
|-------|-------------|--------|
| Patient registration | Create patient record | ⬜ |
| Appointment booking | Schedule appointment | ⬜ |
| Consultation | Record encounter | ⬜ |
| Prescription | Write prescription | ⬜ |
| Patient history | View medical history | ⬜ |

### To Achieve L2
```bash
# Execute these scripts (in order):
cd frontend
# Phase 1: Commerce
npx ts-node scripts/seed-products-demo.ts
npx ts-node scripts/seed-pos-demo.ts
npx ts-node scripts/seed-svm-demo.ts
npx ts-node scripts/seed-mvm-demo.ts

# Phase 2: Core Verticals
npx ts-node scripts/seed-education-demo.ts
npx ts-node scripts/seed-health-demo.ts
```

---

## L3: Full Demo Checklist

### Requirements
All suites have demo data appropriate to their priority level.

### P0 Suites (REQUIRED)
| Suite | Workflow Tests | Historical Data | Analytics | Status |
|-------|---------------|-----------------|-----------|--------|
| Commerce/POS | ⬜ | ⬜ | ⬜ | ⬜ |
| Commerce/SVM | ⬜ | ⬜ | ⬜ | ⬜ |
| Commerce/MVM | ⬜ | ⬜ | ⬜ | ⬜ |
| Inventory | ⬜ | ⬜ | ⬜ | ⬜ |
| Education | ⬜ | ⬜ | ⬜ | ⬜ |
| Health | ⬜ | ⬜ | ⬜ | ⬜ |

### P1 Suites (HIGH PRIORITY)
| Suite | Workflow Tests | Status |
|-------|---------------|--------|
| Hospitality | ⬜ | ⬜ |
| Civic | ⬜ | ⬜ |
| Recruitment | ⬜ | ⬜ |
| Project Mgmt | ⬜ | ⬜ |
| Legal Practice | ⬜ | ⬜ |
| Warehouse | ⬜ | ⬜ |

### P2 Suites (OPTIONAL)
| Suite | Minimal Data | Status |
|-------|-------------|--------|
| Church | ⬜ | ⬜ |
| Political | ⬜ | ⬜ |
| Real Estate | ⬜ | ⬜ |
| Logistics | ⬜ | ⬜ |

---

## Cross-Suite Validation

| Integration | Flow | Status |
|-------------|------|--------|
| Commerce → CRM | Customer from sale appears in CRM | ⬜ |
| SVM → Logistics | Order creates delivery job | ⬜ |
| HR → Payroll | Attendance feeds payroll | ⬜ |
| Partner → Tenant | Partner sees all tenant data | ⬜ |

---

## Role-Based Access Validation

### Partner Level
| Role | Check | Status |
|------|-------|--------|
| PARTNER_OWNER | Sees all clients, full earnings | ✅ PASS |
| PARTNER_ADMIN | Can manage staff and clients | ✅ PASS |
| PARTNER_STAFF | Sees only assigned clients | ✅ PASS |
| PARTNER_SALES | Sees sales-relevant data | ⬜ NEEDS DATA |
| PARTNER_SUPPORT | Sees support-relevant data | ⬜ NEEDS DATA |

### Tenant Level (Per Suite)
| Suite | Admin Role | Staff Role | End User | Status |
|-------|------------|------------|----------|--------|
| Commerce | ⬜ | ⬜ | ⬜ | ⬜ |
| Education | ⬜ | ⬜ | ⬜ | ⬜ |
| Health | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Demo Script Execution Order

### Phase 0: Verify Infrastructure
```bash
# Already complete - verify only
curl http://localhost:5000/api/partner/dashboard
# Should return partner data
```

### Phase 1: Commerce Foundation
```bash
cd frontend
# 1. Create products (foundation for all commerce)
npx ts-node scripts/seed-products-demo.ts  # NEEDS CREATION

# 2. Seed POS data
npx ts-node scripts/seed-pos-demo.ts

# 3. Seed SVM data  
npx ts-node scripts/seed-svm-demo.ts

# 4. Seed MVM data
npx ts-node scripts/seed-mvm-demo.ts
```

### Phase 2: Core Verticals
```bash
# 5. Education
npx ts-node scripts/seed-education-demo.ts  # NEEDS CREATION

# 6. Health
npx ts-node scripts/seed-health-demo.ts  # NEEDS CREATION
```

### Phase 3: Additional Suites
```bash
# 7-10. Run remaining existing scripts
npx ts-node scripts/seed-recruitment-demo.ts
npx ts-node scripts/seed-project-management-demo.ts
npx ts-node scripts/seed-legal-practice-demo.ts
npx ts-node scripts/seed-advanced-warehouse-demo.ts
```

---

## Post-Seeding Verification

### Quick Health Check
```bash
# Verify record counts
psql $DATABASE_URL -c "SELECT 'pos_sale' as t, COUNT(*) FROM pos_sale UNION ALL SELECT 'svm_orders', COUNT(*) FROM svm_orders UNION ALL SELECT 'edu_student', COUNT(*) FROM edu_student;"
```

### UI Verification
1. Login as demo.owner@webwaka.com
2. Check Partner Dashboard - widgets show data
3. Navigate to Clients - see 16 tenants
4. Open each tenant dashboard - verify data appears

### Role Verification
1. Login as demo.staff@webwaka.com
2. Confirm limited client view
3. Login as tenant admin for each seeded suite
4. Confirm tenant-specific data visible

---

## Readiness Sign-Off

### L1 Sign-Off
- [ ] At least one complete workflow demonstrated
- [ ] Partner dashboard shows real data
- [ ] No critical errors in console

### L2 Sign-Off
- [ ] Commerce suite fully functional
- [ ] Education suite fully functional
- [ ] Health suite fully functional
- [ ] All role-based access verified

### L3 Sign-Off
- [ ] All P0 suites complete
- [ ] All P1 suites complete
- [ ] P2 suites have minimal data
- [ ] Cross-suite integrations work
- [ ] Historical data enables analytics

### L4 Sign-Off
- [ ] All L3 criteria met
- [ ] Performance tested under load
- [ ] Edge cases handled gracefully
- [ ] Documentation complete
- [ ] Demo scripts prepared

---

## Approval Gates

**This checklist requires explicit approval before execution.**

| Gate | Approver | Status |
|------|----------|--------|
| Seeding Strategy Approved | TBD | ⬜ PENDING |
| Script Creation Approved | TBD | ⬜ PENDING |
| Execution Approved | TBD | ⬜ PENDING |
| L1 Verified | TBD | ⬜ PENDING |
| L2 Verified | TBD | ⬜ PENDING |
| L3 Verified | TBD | ⬜ PENDING |

---

*End of Demo Readiness Checklist*
