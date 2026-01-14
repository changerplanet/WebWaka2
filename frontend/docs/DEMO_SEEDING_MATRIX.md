# Demo Seeding Matrix

**Audit Date:** January 14, 2026  
**Auditor:** Replit Agent (Read-Only Corrected Audit)  
**Scope:** Demo data seeding status verification

---

## Seeding Criteria

A suite is **DEMO-SEEDED** if:
- A seed script exists AND has been executed, OR
- Records exist in database tables for demo partner/tenants

**Note:** Lack of demo data does NOT indicate lack of implementation.

---

## Demo Seeding Matrix

| Suite | Demo Seeded | Seed Script Exists | Script Executed | Tables with Records |
|-------|-------------|-------------------|-----------------|---------------------|
| **Partner Infrastructure** | YES | YES | YES | Partner(1), PartnerUser(5), Tenant(16), User(96) |
| **Commerce/POS** | NOT SEEDED | YES | NO | pos_sale(0), pos_shift(0) |
| **Commerce/SVM** | NOT SEEDED | YES | NO | svm_orders(0), svm_carts(0) |
| **Commerce/MVM** | NOT SEEDED | YES | NO | mvm_vendor(0), mvm_commission(0) |
| **Commerce/Inventory** | NOT SEEDED | NO | N/A | InventoryLevel(0), Product(0) |
| **Commerce/Accounting** | NOT SEEDED | NO | N/A | acct_*(0) |
| **Commerce/Billing** | NOT SEEDED | NO | N/A | bill_*(0) |
| **Commerce/Payments** | NOT SEEDED | NO | N/A | pay_*(0) |
| **Commerce/CRM** | NOT SEEDED | NO | N/A | crm_*(0) |
| **Education** | NOT SEEDED | NO | N/A | edu_student(0), edu_class(0) |
| **Health** | NOT SEEDED | NO | N/A | health_patient(0), health_provider(0) |
| **Civic** | NOT SEEDED | NO | N/A | civic_citizen(0), civic_case(0) |
| **Hospitality** | NOT SEEDED | NO | N/A | hospitality_room(0), hospitality_guest(0) |
| **Logistics** | NOT SEEDED | NO | N/A | logistics_delivery_agents(0) |
| **Church** | NOT SEEDED | NO | N/A | chu_member(0), chu_church(0) |
| **Political** | NOT SEEDED | NO | N/A | pol_party(0), pol_member(0) |
| **Real Estate** | NOT SEEDED | NO | N/A | re_property(0), re_unit(0) |
| **Recruitment** | NOT SEEDED | YES | NO | recruit_job(0), recruit_application(0) |
| **Project Management** | NOT SEEDED | YES | NO | project_project(0), project_task(0) |
| **Sites & Funnels** | NOT SEEDED | NO | N/A | sf_sites(0), sf_pages(0) |
| **HR** | NOT SEEDED | NO | N/A | hr_employee_profiles(0) |
| **Legal Practice** | NOT SEEDED | YES | NO | leg_matter(0), leg_time_entry(0) |
| **Advanced Warehouse** | NOT SEEDED | YES | NO | wh_zone(0), wh_bin(0) |
| **Marketing** | NOT SEEDED | NO | N/A | mkt_*(0) |
| **Procurement** | NOT SEEDED | NO | N/A | proc_*(0) |
| **B2B Commerce** | NOT SEEDED | NO | N/A | b2b_*(0) |

---

## Existing Seed Scripts

| Script | Target Suite | File Size | Status |
|--------|--------------|-----------|--------|
| seed-demo-partner-master.ts | Partner Infrastructure | 44KB | EXECUTED |
| seed-pos-demo.ts | Commerce/POS | 11KB | NOT EXECUTED |
| seed-svm-demo.ts | Commerce/SVM | 13KB | NOT EXECUTED |
| seed-mvm-demo.ts | Commerce/MVM | 24KB | NOT EXECUTED |
| seed-recruitment-demo.ts | Recruitment | 15KB | NOT EXECUTED |
| seed-project-management-demo.ts | Project Management | 17KB | NOT EXECUTED |
| seed-legal-practice-demo.ts | Legal Practice | 51KB | NOT EXECUTED |
| seed-advanced-warehouse-demo.ts | Advanced Warehouse | 22KB | NOT EXECUTED |
| seed-pos-capability.ts | Capability Registry | 2KB | UNKNOWN |
| seed-svm-capability.ts | Capability Registry | 4KB | UNKNOWN |
| seed-demo-environment.ts | General | 34KB | UNKNOWN |

---

## Seeded vs Not Seeded Summary

### SEEDED (Infrastructure Layer)

| Entity | Record Count | Purpose |
|--------|--------------|---------|
| Partner | 1 | Demo Partner organization |
| PartnerUser | 5 | 5 demo roles (Owner, Admin, Staff, Sales, Support) |
| Tenant | 16 | Multi-tenant demo clients |
| User | 96 | Demo user accounts |
| PlatformInstance | 16 | Tenant platform instances |

### NOT SEEDED (All Business Modules)

| Category | Suites | Reason |
|----------|--------|--------|
| Has script, not executed | POS, SVM, MVM, Recruitment, Project Mgmt, Legal, Warehouse | Scripts exist but not run |
| No script exists | Education, Health, Civic, Hospitality, Logistics, Church, Political, Real Estate, HR, Sites & Funnels, Marketing, Procurement, B2B | Scripts need to be created |

---

## Quick Reference: What to Run

### Immediately Available (Scripts Exist)

```bash
cd frontend
npx ts-node scripts/seed-pos-demo.ts
npx ts-node scripts/seed-svm-demo.ts
npx ts-node scripts/seed-mvm-demo.ts
npx ts-node scripts/seed-recruitment-demo.ts
npx ts-node scripts/seed-project-management-demo.ts
npx ts-node scripts/seed-legal-practice-demo.ts
npx ts-node scripts/seed-advanced-warehouse-demo.ts
```

### Needs Script Creation

| Suite | Priority | Complexity |
|-------|----------|------------|
| Education | HIGH | MEDIUM |
| Health | HIGH | MEDIUM |
| Civic | HIGH | MEDIUM |
| Hospitality | HIGH | MEDIUM |
| Inventory | HIGH | LOW |
| Church | MEDIUM | MEDIUM |
| Political | MEDIUM | MEDIUM |
| Logistics | MEDIUM | LOW |
| Real Estate | MEDIUM | LOW |
| HR | MEDIUM | LOW |
| Sites & Funnels | LOW | MEDIUM |
| Marketing | LOW | LOW |
| Procurement | LOW | LOW |
| B2B | LOW | LOW |

---

## Conclusion

**Seeding Status:**
- Infrastructure: FULLY SEEDED
- Business Modules: 0% SEEDED (scripts exist for 7, executed for 0)

**Important:** Lack of demo seeding is a data population task, NOT a code implementation gap.

---

*End of Demo Seeding Matrix*
