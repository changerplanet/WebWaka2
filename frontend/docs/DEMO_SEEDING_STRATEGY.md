# Demo Seeding Strategy

**Document Type:** Design Document (READ-ONLY)  
**Date:** January 14, 2026  
**Scope:** Demo Partner Only - WebWaka Demo Partner  
**Status:** DESIGN ONLY - NO EXECUTION

---

## Executive Summary

This document defines the comprehensive demo seeding strategy for the WebWaka platform. All demo data is scoped exclusively to the **WebWaka Demo Partner** and its 16 assigned Demo Tenants.

---

## Demo Partner Context

### Single Demo Partner

| Property | Value |
|----------|-------|
| Partner Name | WebWaka Demo Partner |
| Partner ID | `63a86a6a-b40d-4825-8d44-cce8aa893c42` |
| Total Demo Tenants | 16 |
| Total Demo Users | 96 (platform) + 5 (partner) |

### Demo Partner Scope Rules

1. **All demo data belongs to ONE Demo Partner** - No multi-partner scenarios
2. **Every demo use case is explicitly assigned** to Demo Partner → Demo Tenant → User Role
3. **No demo data exists outside Demo Partner context** - No orphan records
4. **No production data mixing** - Complete isolation

---

## Demo Tenant Inventory

| Tenant Name | Slug | Suite | Purpose |
|-------------|------|-------|---------|
| Lagos Retail Store | demo-retail-store | Commerce/POS | Retail POS demo |
| Naija Market Hub | demo-marketplace | Commerce/MVM | Multi-vendor marketplace |
| B2B Wholesale Hub | demo-b2b | Commerce/B2B | B2B wholesale operations |
| Bright Future Academy | demo-school | Education | School management demo |
| HealthFirst Clinic | demo-clinic | Health | Healthcare/clinic demo |
| Swift Logistics | demo-logistics | Logistics | Delivery operations |
| PalmView Suites Lagos | demo-hotel | Hospitality | Hotel management |
| Lagos State Lands Bureau | demo-civic | Civic | Government services |
| Lagos Property Managers | demo-real-estate | Real Estate | Property management |
| Swift HR Solutions | demo-recruitment | Recruitment | Hiring & onboarding |
| BuildRight Projects Ltd | demo-project | Project Mgmt | Project tracking |
| Nwosu & Associates Chambers | demo-legal | Legal Practice | Law firm management |
| Lagos Fulfillment Center | demo-warehouse | Warehouse | Advanced warehouse ops |
| Ojota Motor Park | demo-parkhub | ParkHub | Transport hub |
| Lagos Campaign HQ | demo-political | Political | Political org management |
| GraceLife Community Church | demo-church | Church | Church administration |

---

## Seeding Philosophy

### Layered Approach

```
Layer 4: Narrative Data (Reports, Analytics, History)
Layer 3: Workflow Data (Transactions, Approvals, Events)
Layer 2: Operational Data (Customers, Products, Staff)
Layer 1: Configuration Data (Settings, Categories, Types)
Layer 0: Infrastructure (Partner, Tenants, Users) ← ALREADY SEEDED
```

### Seeding Principles

1. **Demo-First Design** - Every record supports a demonstrable use case
2. **Role-Aware Data** - Each role has data to view and actions to perform
3. **Realistic Scenarios** - Data reflects real African business contexts
4. **Narrative Coherence** - Related records tell a story
5. **Cross-Suite Linkage** - Commerce → CRM → Logistics flows work

---

## Partner Role Strategy

### Partner-Level Roles (Already Exist)

| Role | Email | Demo Purpose |
|------|-------|--------------|
| Partner Owner | demo.owner@webwaka.com | Full dashboard, all clients, all earnings |
| Partner Admin | demo.admin@webwaka.com | Staff management, client operations |
| Partner Sales | demo.sales@webwaka.com | Sales pipeline, client acquisition |
| Partner Support | demo.support@webwaka.com | Support tickets, client issues |
| Partner Staff | demo.staff@webwaka.com | Limited view, assigned clients only |

### Tenant-Level Roles (To Be Seeded Per Suite)

Each demo tenant should have role-appropriate users:

| Role Type | Purpose | Example |
|-----------|---------|---------|
| Tenant Admin | Full tenant access | School Principal, Clinic Manager |
| Tenant Staff | Operational access | Teacher, Nurse, Sales Rep |
| Tenant Viewer | Read-only access | Auditor, Parent |
| End User | Customer/patient | Student, Patient, Guest |

---

## Data Isolation Strategy

### Safeguards

1. **Tenant ID Enforcement** - All queries filter by tenantId
2. **Partner ID Validation** - Partner API validates partner ownership
3. **No Cross-Tenant Access** - Tenant isolation is absolute
4. **Demo Flag** - Demo tenants can be flagged for easy identification
5. **No Production Leakage** - Demo data never migrates to production

### Cleanup Strategy

```
Demo Data Cleanup:
- All demo records reference Demo Partner ID or Demo Tenant IDs
- Cleanup script can DELETE WHERE partnerId = 'demo-partner-id'
- Or DELETE WHERE tenantId IN (SELECT id FROM Tenant WHERE partnerId = 'demo-partner-id')
```

---

## Seeding Execution Plan (Design Only)

### Phase 1: Commerce Suite Priority

| Order | Suite/Module | Seed Script | Reason |
|-------|--------------|-------------|--------|
| 1.1 | Products/Inventory | seed-products.ts | Foundation for all commerce |
| 1.2 | POS | seed-pos-demo.ts (exists) | Core retail demo |
| 1.3 | SVM | seed-svm-demo.ts (exists) | Online store demo |
| 1.4 | MVM | seed-mvm-demo.ts (exists) | Marketplace demo |
| 1.5 | CRM | seed-crm-demo.ts | Customer data for commerce |

### Phase 2: Vertical Suites

| Order | Suite | Seed Script | Tenant |
|-------|-------|-------------|--------|
| 2.1 | Education | seed-education-demo.ts | demo-school |
| 2.2 | Health | seed-health-demo.ts | demo-clinic |
| 2.3 | Hospitality | seed-hospitality-demo.ts | demo-hotel |
| 2.4 | Civic | seed-civic-demo.ts | demo-civic |

### Phase 3: Specialized Suites

| Order | Suite | Seed Script | Tenant |
|-------|-------|-------------|--------|
| 3.1 | Recruitment | seed-recruitment-demo.ts (exists) | demo-recruitment |
| 3.2 | Project Mgmt | seed-project-management-demo.ts (exists) | demo-project |
| 3.3 | Legal Practice | seed-legal-practice-demo.ts (exists) | demo-legal |
| 3.4 | Warehouse | seed-advanced-warehouse-demo.ts (exists) | demo-warehouse |

### Phase 4: Community Suites

| Order | Suite | Seed Script | Tenant |
|-------|-------|-------------|--------|
| 4.1 | Church | seed-church-demo.ts | demo-church |
| 4.2 | Political | seed-political-demo.ts | demo-political |

### Phase 5: Support Suites

| Order | Suite | Seed Script | Tenant |
|-------|-------|-------------|--------|
| 5.1 | Logistics | seed-logistics-demo.ts | demo-logistics |
| 5.2 | Real Estate | seed-real-estate-demo.ts | demo-real-estate |
| 5.3 | HR | seed-hr-demo.ts | TBD |
| 5.4 | Sites & Funnels | seed-sites-funnels-demo.ts | TBD |

---

## Success Criteria

### Per-Suite Checklist

- [ ] At least 10 core entity records per module
- [ ] At least 3 transaction/activity records
- [ ] At least 2 roles can view different data
- [ ] At least 1 workflow can be completed end-to-end
- [ ] Dashboard widgets have data to display
- [ ] Reports/analytics have historical data

### Platform-Wide Checklist

- [ ] All 16 demo tenants have seeded data
- [ ] All 5 partner roles have differentiated views
- [ ] Cross-suite linkages work (e.g., Order → Delivery)
- [ ] No orphan records exist
- [ ] All demo data traces back to Demo Partner

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incomplete seeding | Demo fails | Prioritize core suites |
| Data inconsistency | Broken relationships | Use foreign key validation |
| Role permission gaps | Unauthorized access | Test each role after seeding |
| Performance issues | Slow demo | Limit record counts reasonably |

---

## Approval Gate

**This document requires explicit approval before any seeding execution.**

- [ ] Strategy reviewed
- [ ] Tenant assignments confirmed
- [ ] Role mapping validated
- [ ] Execution order approved
- [ ] Cleanup plan approved

---

*End of Demo Seeding Strategy*
