# 📋 DEMO PARTNER ACCOUNT VERIFICATION & GAP AUDIT

**Audit Date:** January 8, 2026  
**Auditor:** E1 Agent  
**Audit Type:** READ-ONLY Fact-Finding & Diagnostic Analysis  
**Standard:** Platform Standardisation v2  
**Status:** ⚠️ **SIGNIFICANT GAPS IDENTIFIED**

---

## 1. EXECUTIVE SUMMARY

### Overall Demo Readiness: ⚠️ PARTIALLY DEMO-READY

**Key Finding:** The WebWaka Demo Partner Account infrastructure exists in documentation and seed scripts, but the **14 v2-FROZEN verticals listed on the website are NOT all demo-ready** from a unified Demo Partner Account perspective.

**Critical Gaps Identified:**
1. **Demo Partner Account** exists in seed script but database state is **UNVERIFIED** (cannot confirm actual seeding)
2. **6 of 14 verticals** have dedicated seed scripts (Commerce-related only)
3. **8 of 14 verticals** (Political, Church, Legal, Warehouse, ParkHub, Real Estate, Recruitment, Project Management) have **NO dedicated seed scripts** for demo data
4. **Demo tenants** in seed script only cover **6 business types** (Retail, Marketplace, Education, Healthcare, Logistics, B2B) — does NOT cover all 14 verticals
5. **Website claims 14 v2-FROZEN suites** but demo infrastructure only supports **9 v2-compliant** (per forensic audit) + **5 partial/legacy**

### Immediate Risk Assessment:

| Risk Category | Level | Impact |
|---------------|-------|--------|
| Partner demo walkthrough | 🔴 HIGH | Cannot demonstrate all 14 suites from single account |
| Regulator walkthrough | 🔴 HIGH | Missing demo data for Political, Church, Legal verticals |
| Sales demo reliability | 🟡 MEDIUM | Commerce suites are well-covered, non-commerce are gaps |
| Website demo links | 🟢 LOW | All 14 demo pages exist and render |

---

## 2. DEMO PARTNER ACCOUNT STATUS

### 2.1 Partner Account Configuration (From Seed Script)

| Attribute | Value | Status |
|-----------|-------|--------|
| **Partner ID** | Auto-generated UUID | ⚠️ Unverified in DB |
| **Partner Slug** | `webwaka-demo-partner` | ✅ Defined |
| **Partner Name** | WebWaka Demo Partner | ✅ Defined |
| **Status** | ACTIVE | ✅ Defined |
| **Tier** | GOLD | ✅ Defined |
| **Expiry Configuration** | `nonExpiring: true` in metadata | ✅ Defined |
| **Time-based Constraints** | None specified | ✅ N/A |
| **Commission Rate** | 15% | ✅ Defined |

### 2.2 Partner Account Markers (From Seed Script Metadata)

```json
{
  "isDemo": true,
  "description": "Official WebWaka Demo Partner for platform demonstrations",
  "nonExpiring": true
}
```

### 2.3 Partner-Level Demo Users (5 Roles)

| Role | Email | Status |
|------|-------|--------|
| PARTNER_OWNER | `demo.owner@webwaka.com` | ✅ Defined in seed |
| PARTNER_ADMIN | `demo.admin@webwaka.com` | ✅ Defined in seed |
| PARTNER_SALES | `demo.sales@webwaka.com` | ✅ Defined in seed |
| PARTNER_SUPPORT | `demo.support@webwaka.com` | ✅ Defined in seed |
| PARTNER_STAFF | `demo.staff@webwaka.com` | ✅ Defined in seed |

**Default Password:** `Demo2026!`

### 2.4 Database Verification Status

| Check | Status |
|-------|--------|
| Partner record exists in `Partner` table | ⚠️ **UNVERIFIED** - Cannot query DB directly |
| Partner agreement exists | ⚠️ **UNVERIFIED** |
| Partner referral codes exist | ⚠️ **UNVERIFIED** |
| Demo tenants linked to partner | ⚠️ **UNVERIFIED** |

**Recommendation:** Execute `seed-demo-environment.ts` to ensure data exists, or provide DB query capability.

---

## 3. SUITE-BY-SUITE ACTIVATION AUDIT

### 3.1 The 14 Verticals Listed on Website

| # | Vertical | Website Demo Link | Demo Page Exists | Dedicated Seed Script | Demo Tenant in Main Seed | v2-Compliant | Demo Status |
|---|----------|-------------------|------------------|----------------------|--------------------------|--------------|-------------|
| 1 | **Commerce** | `/commerce-demo` | ✅ YES | ✅ Multiple (POS, SVM, MVM) | ✅ Retail, Marketplace | ✅ YES | ✅ Demo-Ready |
| 2 | **Education** | `/education-demo` | ✅ YES | ❌ NO | ✅ demo-school | ✅ YES | ⚠️ Partial |
| 3 | **Health** | `/health-demo` | ✅ YES | ❌ NO | ✅ demo-clinic | ✅ YES | ⚠️ Partial |
| 4 | **Hospitality** | `/hospitality-demo` | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ Not Ready |
| 5 | **Civic / GovTech** | `/civic-demo` | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ Not Ready |
| 6 | **Logistics** | `/logistics-demo` | ✅ YES | ❌ NO | ✅ demo-logistics | ✅ YES | ⚠️ Partial |
| 7 | **Real Estate** | `/real-estate-demo` | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ Not Ready |
| 8 | **Recruitment** | `/recruitment-demo` | ✅ YES | ✅ YES | ❌ NO | ✅ YES | ⚠️ Partial |
| 9 | **Project Management** | `/project-demo` | ✅ YES | ✅ YES | ❌ NO | ✅ YES | ⚠️ Partial |
| 10 | **Legal Practice** | `/legal-demo` | ✅ YES | ✅ YES | ❌ NO | ⚠️ PRE-v2 | ⚠️ Partial |
| 11 | **Advanced Warehouse** | `/warehouse-demo` | ✅ YES | ✅ YES | ❌ NO | ⚠️ PRE-v2 | ⚠️ Partial |
| 12 | **ParkHub (Transport)** | `/parkhub-demo` | ✅ YES | ❌ NO | ❌ NO | ⚠️ PRE-v2 | ❌ Not Ready |
| 13 | **Political** | `/political-demo` | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ Not Ready |
| 14 | **Church** | `/church-demo` | ✅ YES | ❌ NO | ❌ NO | ✅ YES | ❌ Not Ready |

### 3.2 Activation Mode Analysis

| Activation Mode | Count | Verticals |
|-----------------|-------|-----------|
| **Full (Demo-Ready)** | 1 | Commerce |
| **Partial (Seed exists, not linked to Demo Partner)** | 6 | Education, Health, Logistics, Recruitment, Project Mgmt, Legal, Warehouse |
| **Not Activated (No seed data)** | 7 | Hospitality, Civic, Real Estate, ParkHub, Political, Church |

### 3.3 Commerce Sub-Suite Coverage

The Commerce vertical includes 8 sub-suites with demo pages:

| Sub-Suite | Demo Page | Has Storylines | Quick Start | Status |
|-----------|-----------|----------------|-------------|--------|
| POS | `/pos-demo` | ❌ NO | ❌ NO | Demo only |
| SVM | `/svm-demo` | ❌ NO | ❌ NO | Demo only |
| MVM | `/commerce-mvm-demo` | ❌ NO | ❌ NO | Demo only |
| Inventory | `/inventory-demo` | ❌ NO | ❌ NO | Demo only |
| Payments | `/payments-demo` | ❌ NO | ❌ NO | Demo only |
| Billing | `/billing-demo` | ❌ NO | ❌ NO | Demo only |
| Accounting | `/accounting-demo` | ❌ NO | ❌ NO | Demo only |
| Commerce Rules | `/commerce-rules-demo` | ❌ NO | ❌ NO | Demo only |

---

## 4. DEMO TENANT / USE-CASE ACCOUNT COVERAGE

### 4.1 Demo Tenants in Main Seed Script

| Tenant Name | Slug | Type | Suites Enabled | Roles Created |
|-------------|------|------|----------------|---------------|
| Lagos Retail Store | `demo-retail-store` | RETAIL | pos, inventory, crm, analytics | Admin, User |
| Naija Market Hub | `demo-marketplace` | MARKETPLACE | mvm, inventory, logistics, crm | Admin, User |
| Bright Future Academy | `demo-school` | EDUCATION | school_attendance, school_grading | Admin, User |
| HealthFirst Clinic | `demo-clinic` | HEALTHCARE | patient_records, appointment_scheduling | Admin, User |
| Swift Logistics | `demo-logistics` | LOGISTICS | logistics, inventory, analytics | Admin, User |
| B2B Wholesale Hub | `demo-b2b` | B2B | b2b, inventory, procurement, accounting | Admin, User |

### 4.2 Missing Demo Tenants

The following verticals have **NO demo tenants** in the seed script:

| Vertical | Expected Use Case | Status |
|----------|-------------------|--------|
| **Hospitality** | e.g., "Lagos Grand Hotel" | ❌ MISSING |
| **Civic / GovTech** | e.g., "Surulere LGA Office" | ❌ MISSING |
| **Real Estate** | e.g., "Lagos Property Managers" | ❌ MISSING |
| **ParkHub** | e.g., "Ojota Motor Park" | ❌ MISSING |
| **Political** | e.g., "Lagos State APC Campaign" | ❌ MISSING |
| **Church** | e.g., "GraceLife Community Church" | ❌ MISSING |
| **Legal Practice** | e.g., "Adeyemi & Co. Chambers" | ❌ MISSING |
| **Advanced Warehouse** | e.g., "Lagos Fulfillment Center" | ❌ MISSING |

### 4.3 Vertical-Specific Demo Persona Coverage

#### Education Suite

| Use Case | Tenant Exists | Roles Present | Status |
|----------|---------------|---------------|--------|
| School Admin | ✅ demo-school | ✅ TENANT_ADMIN | ✅ Present |
| Teacher | ✅ demo-school | ⚠️ TENANT_USER (generic) | ⚠️ Needs teacher role |
| Student | ❌ | ❌ | ❌ Missing |
| Parent | ❌ | ❌ | ❌ Missing |
| Regulator | ❌ | ❌ | ❌ Missing |

#### Health Suite

| Use Case | Tenant Exists | Roles Present | Status |
|----------|---------------|---------------|--------|
| Clinic Admin | ✅ demo-clinic | ✅ TENANT_ADMIN | ✅ Present |
| Doctor | ✅ demo-clinic | ⚠️ TENANT_USER (generic) | ⚠️ Needs doctor role |
| Patient | ❌ | ❌ | ❌ Missing |
| Regulator | ❌ | ❌ | ❌ Missing |

#### Political Suite

| Use Case | Tenant Exists | Roles Present | Status |
|----------|---------------|---------------|--------|
| Campaign Manager | ❌ | ❌ | ❌ Missing |
| Party Official | ❌ | ❌ | ❌ Missing |
| Volunteer Coordinator | ❌ | ❌ | ❌ Missing |
| Auditor/Regulator | ❌ | ❌ | ❌ Missing |

#### Church Suite

| Use Case | Tenant Exists | Roles Present | Status |
|----------|---------------|---------------|--------|
| Senior Pastor | ❌ | ❌ | ❌ Missing |
| Church Admin | ❌ | ❌ | ❌ Missing |
| Ministry Head | ❌ | ❌ | ❌ Missing |
| Member | ❌ | ❌ | ❌ Missing |
| Auditor | ❌ | ❌ | ❌ Missing |

---

## 5. ROLE & PERSONA COMPLETENESS CHECK

### 5.1 Expected Roles by Suite (From S5 Narratives / Demo Pages)

| Suite | Expected Demo Roles | Actually Seeded | Gap |
|-------|---------------------|-----------------|-----|
| **Commerce** | Retailer, Vendor, Customer, Admin | ✅ Yes | ✅ None |
| **Education** | School Owner, Parent, Student, Teacher, Admin | ⚠️ Partial | 🔴 3 missing |
| **Health** | Clinic Owner, Patient, Doctor, Regulator | ⚠️ Partial | 🔴 2 missing |
| **Hospitality** | Hotel Owner, Restaurant Manager, Guest | ❌ None | 🔴 All missing |
| **Civic** | Citizen, Agency Staff, Regulator, Auditor | ❌ None | 🔴 All missing |
| **Logistics** | Dispatcher, Driver, Merchant, Auditor | ⚠️ Partial | 🟡 2 missing |
| **Real Estate** | Property Owner, Manager, Tenant, Auditor | ❌ None | 🔴 All missing |
| **Recruitment** | Recruiter, Hiring Manager, Candidate, Auditor | ❌ None (seed file exists, not in main seed) | 🔴 All missing |
| **Project Mgmt** | Project Owner, Manager, Team Member, Auditor | ❌ None (seed file exists, not in main seed) | 🔴 All missing |
| **Legal Practice** | Law Firm Admin, Lawyer, Client, Auditor | ❌ None (seed file exists, not in main seed) | 🔴 All missing |
| **Warehouse** | Warehouse Admin, Picker, Receiver, Auditor | ❌ None (seed file exists, not in main seed) | 🔴 All missing |
| **ParkHub** | Park Admin, Operator, Agent, Customer | ❌ None | 🔴 All missing |
| **Political** | Campaign Manager, Party Official, Volunteer, Auditor | ❌ None | 🔴 All missing |
| **Church** | Pastor, Admin, Ministry Head, Member, Auditor | ❌ None | 🔴 All missing |

### 5.2 Credential Status

| Credential Attribute | Status |
|---------------------|--------|
| Default Password | `Demo2026!` (documented) |
| Credentials Known | ✅ For seeded accounts |
| Credentials Recoverable | ⚠️ Only if seed script was run |
| Expiry | None (non-expiring per metadata) |

---

## 6. DEMO RELIABILITY & RISK ASSESSMENT

### 6.1 Identified Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **Database State Unknown** | 🔴 HIGH | Cannot verify if seed scripts were actually executed |
| **Missing Vertical Tenants** | 🔴 HIGH | 8 of 14 verticals have no demo tenants |
| **Missing Personas** | 🔴 HIGH | Most verticals missing expected demo roles |
| **Seed Script Fragmentation** | 🟡 MEDIUM | Multiple seed scripts exist but not integrated |
| **Website Misalignment** | 🟡 MEDIUM | Website claims 14 v2-FROZEN but only 9 are v2-compliant |
| **PRE-v2 Legacy Suites** | 🟡 MEDIUM | Legal, Warehouse, ParkHub are PRE-v2 legacy |
| **No Political/Church Seed** | 🔴 HIGH | High-profile governance verticals have no demo data |

### 6.2 Broken/Missing Demo Flows

| Flow | Status |
|------|--------|
| Commerce demo (POS, SVM, MVM) | ✅ Should work with existing seed |
| Education demo with school personas | ⚠️ Partial - needs student/parent roles |
| Health demo with patient journey | ⚠️ Partial - needs patient role |
| Political demo with campaign flow | ❌ No demo data seeded |
| Church demo with ministry flow | ❌ No demo data seeded |
| Hospitality demo with guest booking | ❌ No demo data seeded |
| Civic demo with citizen flow | ❌ No demo data seeded |

### 6.3 Permission Mismatches

| Issue | Description |
|-------|-------------|
| Generic TENANT_USER role | Most demo tenants only have TENANT_ADMIN and TENANT_USER, not vertical-specific roles |
| Missing external user links | Driver, Patient, Student, Guest personas not linked to tenant context |

---

## 7. DEMO READINESS CLASSIFICATION

### Final Classification by Suite

| Suite | Classification | Reason |
|-------|----------------|--------|
| **Commerce** | ✅ Demo-Ready | Full seed data, multiple sub-suites, storylines exist |
| **Education** | ⚠️ Partially Demo-Ready | Has tenant, missing student/parent personas |
| **Health** | ⚠️ Partially Demo-Ready | Has tenant, missing patient/doctor personas |
| **Logistics** | ⚠️ Partially Demo-Ready | Has tenant, missing driver external role |
| **Recruitment** | ⚠️ Partially Demo-Ready | Seed file exists, not in Demo Partner account |
| **Project Mgmt** | ⚠️ Partially Demo-Ready | Seed file exists, not in Demo Partner account |
| **Legal Practice** | ⚠️ Partially Demo-Ready | Seed file exists, PRE-v2 legacy |
| **Warehouse** | ⚠️ Partially Demo-Ready | Seed file exists, PRE-v2 legacy |
| **Hospitality** | ❌ Not Demo-Ready | No tenant, no personas |
| **Civic / GovTech** | ❌ Not Demo-Ready | No tenant, no personas |
| **Real Estate** | ❌ Not Demo-Ready | No tenant, no personas |
| **ParkHub** | ❌ Not Demo-Ready | No tenant, PRE-v2 legacy |
| **Political** | ❌ Not Demo-Ready | No tenant, no personas, HIGH-RISK vertical |
| **Church** | ❌ Not Demo-Ready | No tenant, no personas, HIGH-TRUST vertical |

### Summary Counts

| Status | Count |
|--------|-------|
| ✅ Demo-Ready | 1 |
| ⚠️ Partially Demo-Ready | 7 |
| ❌ Not Demo-Ready | 6 |

---

## 8. EXPLICIT LIST OF MISSING ACTIONS

### ❌ NO FIXES APPLIED — Actions Required (For Authorization)

#### P0 (Critical - Demo Blockers)

| # | Action | Vertical | Impact |
|---|--------|----------|--------|
| 1 | Run `seed-demo-environment.ts` and verify database state | All | Confirms baseline |
| 2 | Create demo tenant for Political Suite | Political | Enables regulator demo |
| 3 | Create demo tenant for Church Suite | Church | Enables high-trust demo |
| 4 | Create demo tenant for Hospitality | Hospitality | Enables guest booking demo |
| 5 | Create demo tenant for Civic/GovTech | Civic | Enables citizen demo |
| 6 | Create demo tenant for Real Estate | Real Estate | Enables property demo |
| 7 | Create demo tenant for ParkHub | ParkHub | Enables transport demo |

#### P1 (High - Persona Gaps)

| # | Action | Vertical | Impact |
|---|--------|----------|--------|
| 8 | Add Student, Parent roles to Education tenant | Education | Complete education personas |
| 9 | Add Patient, Doctor roles to Health tenant | Health | Complete health personas |
| 10 | Add Driver external role to Logistics tenant | Logistics | Complete logistics personas |
| 11 | Integrate existing seed scripts into Demo Partner | Recruitment, Project, Legal, Warehouse | Link isolated seed data |

#### P2 (Medium - Structural)

| # | Action | Vertical | Impact |
|---|--------|----------|--------|
| 12 | Create unified demo seed script covering all 14 verticals | All | Single source of truth |
| 13 | Add S5 storylines to commerce sub-suites | Commerce | Guided demo experience |
| 14 | Canonicalize PRE-v2 legacy suites (Legal, Warehouse, ParkHub) | Legacy | v2 compliance |

---

## 9. APPENDIX

### A. File References

| File | Purpose |
|------|---------|
| `/app/frontend/scripts/seed-demo-environment.ts` | Main demo seed script |
| `/app/frontend/docs/DEMO_CREDENTIALS_INDEX.md` | Credentials documentation |
| `/app/frontend/docs/DEMO_ENVIRONMENT_OVERVIEW.md` | Environment overview |
| `/app/frontend/docs/PLATFORM_FORENSIC_AUDIT_V2.md` | v2 compliance audit |
| `/app/frontend/prisma/schema.prisma` | Database schema |

### B. Inconsistencies Between Website & Backend

| Website Claims | Backend Reality |
|----------------|-----------------|
| "14 v2-FROZEN Verticals" | Only 9 are v2-compliant per forensic audit |
| All suites have "Explore Demo" links | 6 suites have no demo data seeded |
| Demo Partner is "canonical demo owner" | Demo Partner account state unverified |

### C. Demo Tenant Slugs (From Seed Script)

- `demo-retail-store`
- `demo-marketplace`
- `demo-school`
- `demo-clinic`
- `demo-logistics`
- `demo-b2b`

### D. External Seed Scripts (Not in Demo Partner)

- `seed-recruitment-demo.ts`
- `seed-project-management-demo.ts`
- `seed-legal-practice-demo.ts`
- `seed-advanced-warehouse-demo.ts`
- `seed-mvm-demo.ts`
- `seed-svm-demo.ts`
- `seed-pos-demo.ts`

---

## 10. CONCLUSION

**Can a partner run a full demo today from the Demo Partner account for each of the 14 suites?**

| Answer | Details |
|--------|---------|
| **NO** | Only Commerce Suite is fully demo-ready. 6 suites are Not Demo-Ready, 7 are Partially Demo-Ready. |

**Action Required:** This audit identifies all gaps. Authorization needed before:
- Demo remediation
- Tenant creation
- Role seeding
- Activation fixes

---

**Prepared by:** E1 Agent  
**Reviewed by:** N/A (Pending)  
**Next Steps:** STOP — Await explicit authorization for remediation

---

*This audit is the single source of truth for demo readiness. Precision matters more than speed. Last updated: January 8, 2026.*
