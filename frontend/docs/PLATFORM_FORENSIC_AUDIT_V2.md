# 🔍 FORENSIC PLATFORM STANDARDISATION v2 COVERAGE AUDIT

**Audit Date**: January 7, 2026  
**Auditor**: E1 Agent  
**Standard**: Platform Standardisation v2  
**Audit Type**: READ-ONLY Ground-Truth Analysis

---

## CONSOLIDATED SUITE INVENTORY

| Suite / Domain Name | Evidence Found | Classification | S0 | S1 | S2 | S3 | S4 | S5 | S6 | v2-Compliant? | Notes |
|---------------------|----------------|----------------|----|----|----|----|----|----|----|----|-------|
| **Commerce** | `/app/commerce-demo`, `/lib/commerce/*`, `commerce_*` models, `/api/commerce/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | Constitutional foundation |
| **Education** | `/app/education-demo`, `/lib/education/*`, `edu_*` models, `/api/education/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Health** | `/app/health-demo`, `/lib/health/*`, `health_*` models, `/api/health/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Hospitality** | `/app/hospitality-demo`, `/lib/hospitality/*`, `hospitality_*` models, `/api/hospitality/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Civic / GovTech** | `/app/civic-demo`, `/lib/civic/*`, `civic_*` models, `/api/civic/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Logistics** | `/app/logistics-demo`, `/lib/logistics/*`, `logistics_*` models, `/api/logistics/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Real Estate** | `/app/real-estate-demo`, `/lib/real-estate/*`, `re_*` models, `/api/real-estate/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Project Management** | `/app/project-demo`, `/lib/project-management/*`, `project_*` models, `/api/project-management/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Recruitment** | `/app/recruitment-demo`, `/lib/recruitment/*`, `recruit_*` models, `/api/recruitment/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** | v2-FROZEN |
| **Sites & Funnels** | `/app/sites-funnels-suite/*`, `/lib/sites-funnels/*`, `sf_*` models, `/api/sites-funnels/*` | Tooling | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | **EXEMPT** | Partner Tooling, NOT v2 |
| **Legal Practice** | `/app/legal-practice-suite/*`, `/lib/legal-practice/*`, `leg_*` models, `/api/legal-practice/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ PRE-v2 LEGACY |
| **Advanced Warehouse** | `/app/advanced-warehouse-suite/*`, `/lib/advanced-warehouse/*`, `wh_*` models, `/api/advanced-warehouse/*` | Vertical | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ PRE-v2 LEGACY |
| **ParkHub (Transport)** | `/app/parkhub/*`, `/lib/parkhub/*`, `/api/parkhub` | Vertical | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | **NO** | ⚠️ PRE-v2 LEGACY, Uses MVM/Logistics |
| **HR** | `/lib/hr/*`, `hr_*` models, `/api/hr/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal module, No demo |
| **CRM** | `/lib/crm/*`, `crm_*` models, `/api/crm/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal module, No demo |
| **B2B** | `/lib/b2b/*`, `b2b_*` models, `/api/b2b/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal module, No demo |
| **Procurement** | `/lib/procurement/*`, `proc_*` models, `/api/procurement/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal module, No demo |
| **Marketing** | `/lib/marketing/*`, `mkt_*` models, `/api/marketing/*` | Internal | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal module, Partial API |
| **Analytics** | `/lib/analytics/*`, `analytics_*` models, `/api/analytics/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal platform service |
| **Compliance** | `/lib/compliance/*`, `compliance_*` models, `/api/compliance/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal platform service |
| **AI** | `/lib/ai/*`, `ai_*` models, `/api/ai/*` | Internal | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | ⚠️ Internal platform service |
| **Billing** | `/app/billing-demo`, `/lib/billing/*`, `bill_*`/`billing_*` models, `/api/billing/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **Accounting** | `/app/accounting-demo`, `/lib/accounting/*`, `acct_*` models, `/api/accounting/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **Inventory** | `/app/inventory-demo`, `/lib/inventory/*`, `inv_*` models, `/api/inventory/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **POS** | `/app/pos-demo`, `/lib/pos/*`, `pos_*` models, `/api/pos/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **Payments** | `/app/payments-demo`, `/lib/payments/*`, `pay_*` models, `/api/payments/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **SVM** | `/app/svm-demo`, `/lib/svm/*`, `svm_*` models, `/api/svm/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **MVM** | `/app/commerce-mvm-demo`, `/lib/mvm/*`, `mvm_*` models, `/api/mvm/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **Commerce Rules** | `/app/commerce-rules-demo`, `/lib/rules/*` | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **PARTIAL** | Commerce child, has demo but no storylines |
| **Wallets** | `/api/wallets/*`, `commerce_wallets` model, `Wallet` model | Commerce Sub | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **NO** | Commerce internal, API only |

---

## PRISMA MODEL PREFIX ANALYSIS

| Prefix | Count | Associated Suite |
|--------|-------|------------------|
| `civic_*` | 18 | Civic / GovTech |
| `edu_*` | 16 | Education |
| `health_*` | 14 | Health |
| `hospitality_*` | 14 | Hospitality |
| `logistics_*` | 7 | Logistics |
| `re_*` | 5 | Real Estate |
| `project_*` | 4 | Project Management |
| `recruit_*` | 5 | Recruitment |
| `leg_*` | 9 | Legal Practice |
| `wh_*` | 8 | Advanced Warehouse |
| `hr_*` | 9 | HR (Internal) |
| `crm_*` | 7 | CRM (Internal) |
| `b2b_*` | 9 | B2B (Internal) |
| `proc_*` | 9 | Procurement (Internal) |
| `mkt_*` | 5 | Marketing (Internal) |
| `analytics_*` | 9 | Analytics (Internal) |
| `compliance_*` | 3 | Compliance (Internal) |
| `ai_*` | 3 | AI (Internal) |
| `sf_*` | 8 | Sites & Funnels (Tooling) |
| `bill_*`/`billing_*` | 14 | Billing (Commerce) |
| `acct_*` | 6 | Accounting (Commerce) |
| `inv_*` | 6 | Inventory (Commerce) |
| `pos_*` | 4 | POS (Commerce) |
| `pay_*` | 10 | Payments (Commerce) |
| `svm_*` | 8 | SVM (Commerce) |
| `mvm_*` | 10 | MVM (Commerce) |
| `commerce_*` | 3 | Commerce (Wallets/Payouts) |

---

## DEMO PAGES INVENTORY

| Demo Route | Suite | Has Storylines | Has Quick Start | Status |
|------------|-------|----------------|-----------------|--------|
| `/commerce-demo` | Commerce | ✅ | ✅ | v2 COMPLETE |
| `/education-demo` | Education | ✅ | ✅ | v2 COMPLETE |
| `/health-demo` | Health | ✅ | ✅ | v2 COMPLETE |
| `/hospitality-demo` | Hospitality | ✅ | ✅ | v2 COMPLETE |
| `/civic-demo` | Civic | ✅ | ✅ | v2 COMPLETE |
| `/logistics-demo` | Logistics | ✅ | ✅ | v2 COMPLETE |
| `/real-estate-demo` | Real Estate | ✅ | ✅ | v2 COMPLETE |
| `/project-demo` | Project Management | ✅ | ✅ | v2 COMPLETE |
| `/recruitment-demo` | Recruitment | ✅ | ✅ | v2 COMPLETE |
| `/billing-demo` | Billing | ❌ | ❌ | Demo only, no narrative |
| `/accounting-demo` | Accounting | ❌ | ❌ | Demo only, no narrative |
| `/inventory-demo` | Inventory | ❌ | ❌ | Demo only, no narrative |
| `/pos-demo` | POS | ❌ | ❌ | Demo only, no narrative |
| `/payments-demo` | Payments | ❌ | ❌ | Demo only, no narrative |
| `/svm-demo` | SVM | ❌ | ❌ | Demo only, no narrative |
| `/commerce-mvm-demo` | MVM | ❌ | ❌ | Demo only, no narrative |
| `/commerce-rules-demo` | Commerce Rules | ❌ | ❌ | Demo only, no narrative |
| ❌ MISSING | Legal Practice | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | Advanced Warehouse | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | ParkHub | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | HR | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | CRM | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | B2B | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | Procurement | ❌ | ❌ | **NO DEMO PAGE** |
| ❌ MISSING | Marketing | ❌ | ❌ | **NO DEMO PAGE** |

---

## STORYLINES & QUICK START INVENTORY

### Registered Storylines (34 total)
- Commerce: `retailStoryline`, `marketplaceStoryline`, `smeStoryline`, `fullTourStoryline`, `cfoFinanceStoryline`, `regulatorAuditorStoryline`
- Education: `schoolOwnerStoryline`, `parentGuardianStoryline`
- Health: `clinicOwnerStoryline`, `healthPatientStoryline`, `healthRegulatorStoryline`
- Hospitality: `hotelOwnerStoryline`, `restaurantManagerStoryline`, `hospitalityGuestStoryline`
- Civic: `civicCitizenStoryline`, `civicAgencyStaffStoryline`, `civicRegulatorStoryline`, `civicAuditorStoryline`
- Logistics: `logisticsDispatcherStoryline`, `logisticsDriverStoryline`, `logisticsMerchantStoryline`, `logisticsAuditorStoryline`
- Real Estate: `propertyOwnerStoryline`, `propertyManagerStoryline`, `tenantStoryline`, `realEstateAuditorStoryline`
- Project Management: `projectOwnerStoryline`, `projectManagerStoryline`, `teamMemberStoryline`, `projectAuditorStoryline`
- Recruitment: `recruiterStoryline`, `hiringManagerStoryline`, `candidateStoryline`, `recruitmentAuditorStoryline`

### Registered Quick Start Roles (37 total)
All 9 v2-FROZEN verticals have registered Quick Start roles.

---

## ⚠️ GOVERNANCE RISKS IDENTIFIED

### 1. PRE-v2 LEGACY VERTICALS (Missing S4-S6)

| Suite | Has Schema | Has API | Has Services | Has Demo | Has Storylines | Risk Level |
|-------|-----------|---------|--------------|----------|----------------|------------|
| **Legal Practice** | ✅ | ✅ | ✅ | ❌ | ❌ | 🔴 HIGH |
| **Advanced Warehouse** | ✅ | ✅ | ✅ | ❌ | ❌ | 🔴 HIGH |
| **ParkHub (Transport)** | ✅ | ✅ | ✅ | ❌ | ❌ | 🔴 HIGH |

### 2. COMMERCE SUB-MODULES (Demo exists, no S5 narrative)

| Suite | Has Demo | Has Storylines | Commerce Boundary | Risk Level |
|-------|----------|----------------|-------------------|------------|
| Billing | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| Accounting | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| Inventory | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| POS | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| Payments | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| SVM | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| MVM | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |
| Commerce Rules | ✅ | ❌ | N/A (IS Commerce) | 🟡 MEDIUM |

### 3. INTERNAL MODULES (No external demo required, but no Commerce boundary defined)

| Module | Schema | API | Services | Commerce Boundary Defined | Risk Level |
|--------|--------|-----|----------|--------------------------|------------|
| HR | ✅ | ✅ | ✅ | ❌ | 🟡 MEDIUM |
| CRM | ✅ | ✅ | ✅ | ❌ | 🟡 MEDIUM |
| B2B | ✅ | ✅ | ✅ | ❌ | 🟡 MEDIUM |
| Procurement | ✅ | ✅ | ✅ | ❌ | 🟡 MEDIUM |
| Marketing | ✅ | ✅ | ✅ | ❌ | 🟠 LOW |
| Analytics | ✅ | ✅ | ✅ | N/A (Platform) | 🟢 N/A |
| Compliance | ✅ | ✅ | ✅ | N/A (Platform) | 🟢 N/A |
| AI | ✅ | ✅ | ✅ | N/A (Platform) | 🟢 N/A |

---

## SPECIAL INVESTIGATION: TRANSPORT/FLEET/MOBILITY

### ParkHub Analysis
- **Location**: `/app/parkhub/*`, `/lib/parkhub/*`, `/api/parkhub`
- **Evidence**: Contains `booking`, `operator`, `park-admin`, `pos` folders
- **Prisma Models**: None with `parkhub_`, `transport_`, `fleet_`, `booking_`, or `ride_` prefix
- **Architecture**: Uses **MVM** and **Logistics** services via composition
- **Status**: PRE-v2 LEGACY — Has S0-S2, missing S3-S6
- **Commerce Boundary**: ⚠️ NOT EXPLICITLY DEFINED

### Fleet References in Logistics
- **Location**: `/lib/logistics/fleet-service.ts`, `/api/logistics/fleet/*`, `/api/logistics-suite/fleet/*`
- **Status**: Part of Logistics Suite (v2-FROZEN)
- **Conclusion**: Fleet is NOT separate — it's a Logistics sub-component

---

## FINAL SUMMARY

### 1. Total Number of Suites Found: **28**

| Category | Count |
|----------|-------|
| v2-FROZEN Verticals | 9 |
| PRE-v2 Legacy Verticals | 3 |
| Commerce Sub-modules | 8 |
| Internal Platform Modules | 7 |
| Partner Tooling (Exempt) | 1 |

### 2. Suites Missing from Prior Platform Summaries

| Suite | Evidence | Previous Status |
|-------|----------|-----------------|
| **Legal Practice** | Full schema + API + services | Mentioned in PRD as "S0-S6 COMPLETE" but NO DEMO/NARRATIVE |
| **Advanced Warehouse** | Full schema + API + services | Mentioned in PRD as "S0-S6 COMPLETE" but NO DEMO/NARRATIVE |
| **ParkHub** | Full schema + API + services | Mentioned in PRD as "Transport & Logistics Suite" but INCOMPLETE |
| **HR** | Full schema + API + services | NOT MENTIONED in v2 governance |
| **CRM** | Full schema + API + services | NOT MENTIONED in v2 governance |
| **B2B** | Full schema + API + services | NOT MENTIONED in v2 governance |
| **Procurement** | Full schema + API + services | NOT MENTIONED in v2 governance |
| **Marketing** | Services + partial models | NOT MENTIONED in v2 governance |

### 3. Suites That MUST Be Canonicalized (S4-S6)

| Suite | Priority | Reason |
|-------|----------|--------|
| **Legal Practice** | 🔴 P0 | Has full S0-S3, PRD claims S6 but no demo exists |
| **Advanced Warehouse** | 🔴 P0 | Has full S0-S3, PRD claims S6 but no demo exists |
| **ParkHub** | 🟡 P1 | Has partial implementation, requires architecture decision |

### 4. Suites That Should Be Reclassified as Tooling

| Suite | Recommendation | Reason |
|-------|----------------|--------|
| **Sites & Funnels** | Already Tooling | ✅ Correctly classified |
| **Marketing** | Consider Tooling | Platform acquisition tool, not domain-of-record |
| **Analytics** | Platform Service | Cross-cutting infrastructure, not vertical |
| **Compliance** | Platform Service | Cross-cutting infrastructure, not vertical |
| **AI** | Platform Service | Cross-cutting infrastructure, not vertical |

### 5. Suites That Should Be Deprecated or Archived

| Suite | Recommendation | Reason |
|-------|----------------|--------|
| None identified | - | All discovered suites have active usage or clear purpose |

---

## ⚠️ CRITICAL FINDINGS

1. **PRD DISCREPANCY**: Legal Practice and Advanced Warehouse are marked as "S0-S6 COMPLETE" in PRD but have **NO DEMO PAGES** and **NO STORYLINES**. This is a governance violation.

2. **MISSING GOVERNANCE**: HR, CRM, B2B, Procurement, Marketing are fully implemented modules with schema, services, and APIs but are **NOT INCLUDED** in Platform Standardisation v2 governance.

3. **PARKHUB INCOMPLETE**: ParkHub is a transport/booking vertical that was started but never completed. It lacks S3 (full API), S4 (demo), S5 (narrative), and S6 (freeze).

4. **COMMERCE SUB-MODULES**: 8 Commerce sub-modules have demo pages but lack S5 narrative integration. Governance decision needed: Are they part of Commerce FREEZE or separate canonicalization?

---

*This audit is the single source of truth for platform governance. Last updated: January 7, 2026.*
