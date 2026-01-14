# Demo Partner Assignment Matrix

**Audit Date:** January 14, 2026  
**Auditor:** Replit Agent (Read-Only Audit)  
**Scope:** Demo Partner module visibility and assignment status

---

## Demo Partner Overview

| Property | Value |
|----------|-------|
| Partner Name | WebWaka Demo Partner |
| Partner ID | `63a86a6a-b40d-4825-8d44-cce8aa893c42` |
| Total Users | 5 |
| Total Tenants | 16 |
| Total Platform Instances | 16 |

---

## Demo Partner Users

| Email | Role | Permissions |
|-------|------|-------------|
| demo.owner@webwaka.com | PARTNER_OWNER | Full access |
| demo.admin@webwaka.com | PARTNER_ADMIN | Manage staff, clients, packages |
| demo.staff@webwaka.com | PARTNER_STAFF | Assigned clients only, self record only |
| demo.sales@webwaka.com | PARTNER_SALES | Sales-focused permissions |
| demo.support@webwaka.com | PARTNER_SUPPORT | Support-focused permissions |

---

## Suite Assignment to Demo Partner

### Official Suites (from config)

| Suite | Status | Assigned to Demo Partner | Visible in Partner UI | Notes |
|-------|--------|-------------------------|----------------------|-------|
| Commerce | active | YES | YES | Primary demo suite |
| Education | coming_soon | YES (via tenants) | PARTIAL | API exists, no demo data |
| Health | coming_soon | YES (via tenants) | PARTIAL | API exists, no demo data |
| Civic | coming_soon | YES (via tenants) | PARTIAL | API exists, no demo data |
| Hospitality | coming_soon | YES (via tenants) | PARTIAL | API exists, no demo data |
| Logistics | coming_soon | YES (via tenants) | PARTIAL | API exists, no demo data |
| Community | coming_soon | NO | NO | No dedicated API |

---

### Additional Suites (Not in Official Config)

| Suite | Assigned to Demo Partner | Visible in Partner UI | Notes |
|-------|-------------------------|----------------------|-------|
| Church | YES (via tenants) | PARTIAL | Full API, no demo data |
| Political | YES (via tenants) | PARTIAL | Full API, no demo data |
| Real Estate | YES (via tenants) | PARTIAL | Full API, no demo data |
| Recruitment | YES (via tenants) | PARTIAL | Full API, no demo data |
| Project Management | YES (via tenants) | PARTIAL | Full API, no demo data |
| Legal Practice | YES (via tenants) | PARTIAL | Full API, no demo data |
| HR | YES (via tenants) | PARTIAL | Full API, no demo data |
| Sites & Funnels | YES (via tenants) | PARTIAL | Full API, no demo data |
| Advanced Warehouse | YES (via tenants) | PARTIAL | Full API, no demo data |
| Marketing | YES (via tenants) | PARTIAL | Full API, no demo data |
| Procurement | YES (via tenants) | PARTIAL | Full API, no demo data |

---

## Demo Tenant Breakdown

The Demo Partner has 16 tenants created, likely representing different business types:

| Tenant Type | Count | Purpose |
|-------------|-------|---------|
| Demo Tenants | 16 | Multi-vertical demonstration |

**Note:** Tenant capability assignments require further inspection via the capabilities API.

---

## Module-Level Assignment Details

### Commerce Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| POS | YES | YES | NO (0 records) |
| SVM | YES | YES | NO (0 records) |
| MVM | YES | YES | NO (0 records) |
| Inventory | YES | YES | NO (0 records) |
| Accounting | YES | YES | NO (0 records) |
| Payments | YES | YES | NO (0 records) |
| CRM | YES | YES | NO (0 records) |
| Billing | YES | YES | NO (0 records) |

---

### Education Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Students | YES | YES | NO (0 records) |
| Classes | YES | YES | NO (0 records) |
| Assessments | YES | YES | NO (0 records) |
| Attendance | YES | YES | NO (0 records) |
| Fees | YES | YES | NO (0 records) |
| Grades | YES | YES | NO (0 records) |

---

### Health Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Patients | YES | YES | NO (0 records) |
| Providers | YES | YES | NO (0 records) |
| Appointments | YES | YES | NO (0 records) |
| Encounters | YES | YES | NO (0 records) |
| Prescriptions | YES | YES | NO (0 records) |
| Lab Orders | YES | YES | NO (0 records) |

---

### Civic Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Citizens | YES | YES | NO (0 records) |
| Cases | YES | YES | NO (0 records) |
| Services | YES | YES | NO (0 records) |
| Voting | YES | YES | NO (0 records) |
| Inspections | YES | YES | NO (0 records) |

---

### Hospitality Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Rooms | YES | YES | NO (0 records) |
| Guests | YES | YES | NO (0 records) |
| Reservations | YES | YES | NO (0 records) |
| Orders | YES | YES | NO (0 records) |
| Staff | YES | YES | NO (0 records) |

---

### Logistics Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Delivery Agents | YES | YES | NO (0 records) |
| Jobs | YES | YES | NO (0 records) |
| Fleet | YES | YES | NO (0 records) |
| Zones | YES | YES | NO (0 records) |

---

### Church Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Churches | YES | YES | NO (0 records) |
| Members | YES | YES | NO (0 records) |
| Ministries | YES | YES | NO (0 records) |
| Giving | YES | YES | NO (0 records) |
| Events | YES | YES | NO (0 records) |

---

### Political Suite Modules

| Module | API Available | Demo Partner Access | Demo Data Exists |
|--------|---------------|--------------------|--------------------|
| Parties | YES | YES | NO (0 records) |
| Members | YES | YES | NO (0 records) |
| Campaigns | YES | YES | NO (0 records) |
| Elections | YES | YES | NO (0 records) |
| Fundraising | YES | YES | NO (0 records) |

---

## Access Control Verification

### Partner API Read Filtering (Recently Fixed)

| Endpoint | OWNER | ADMIN | STAFF | Status |
|----------|-------|-------|-------|--------|
| GET /api/partner/clients | All | All | Assigned only | FIXED |
| GET /api/partner/staff | All | All | Self only | FIXED |
| GET /api/partner/earnings | Full | Full | Summary only | FIXED |
| GET /api/partner/dashboard | Full | Full | Full | OK |

### Write Permission Enforcement

| Endpoint | OWNER | ADMIN | STAFF | Status |
|----------|-------|-------|-------|--------|
| POST /api/partner/staff | ALLOWED | ALLOWED | BLOCKED | OK |
| POST /api/partner/clients | ALLOWED | BLOCKED | BLOCKED | OK |

---

## Summary

| Category | Status |
|----------|--------|
| Demo Partner Created | YES |
| Partner Users Created | YES (5 roles) |
| Demo Tenants Created | YES (16) |
| Module APIs Available | YES (all suites) |
| Module Demo Data | NO (all empty) |
| Role-Based Access Control | VERIFIED |

---

*End of Demo Partner Assignment Matrix*
