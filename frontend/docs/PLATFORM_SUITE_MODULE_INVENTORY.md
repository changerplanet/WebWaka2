# Platform Suite & Module Inventory

**Audit Date:** January 14, 2026  
**Auditor:** Replit Agent (Read-Only Audit)  
**Scope:** Full platform suite and module hierarchy

---

## Summary

| Metric | Count |
|--------|-------|
| Official Suites (from config) | 7 |
| Active Suites | 1 (Commerce) |
| Coming Soon Suites | 6 |
| Additional API Domains | 15+ |
| Total Database Tables | 300+ |

---

## Official Suites (from `/src/config/suites.ts`)

### 1. Commerce Suite (ACTIVE)

**Status:** `active`  
**ID:** `commerce`  
**Description:** Complete business management for retail, wholesale, and e-commerce businesses

| Module Key | API Path | Database Prefix | UI Path |
|------------|----------|-----------------|---------|
| pos | `/api/pos`, `/api/commerce/pos` | `pos_*` | `/pos` |
| svm | `/api/svm`, `/api/commerce/svm` | `svm_*` | `/svm` |
| mvm | `/api/mvm`, `/api/commerce/mvm` | `mvm_*` | `/mvm` |
| inventory | `/api/inventory` | `inv_*` | `/inventory` |
| accounting | `/api/accounting` | `acct_*` | `/accounting` |
| payments_wallets | `/api/commerce/payments` | `pay_*`, `commerce_wallet*` | `/payments` |
| crm | `/api/crm` | `crm_*` | `/crm` |
| billing | `/api/commerce/billing`, `/api/billing` | `bill_*`, `billing_*` | `/billing` |
| rules | `/api/commerce/rules` | N/A | N/A |

---

### 2. Education Suite (COMING SOON)

**Status:** `coming_soon`  
**ID:** `education`

| Module Key | API Path | Database Prefix |
|------------|----------|-----------------|
| school_attendance | `/api/education/attendance` | `edu_*` |
| school_grading | `/api/education/grades` | `edu_*` |
| fee_management | `/api/education/fees` | `edu_*` |
| student_records | `/api/education/students` | `edu_*` |
| timetable | `/api/education/academic` | `edu_*` |

**API Modules Found:** 11 (academic, assessments, attendance, demo, enrollments, fees, grades, guardians, report-cards, staff, students)

---

### 3. Health Suite (COMING SOON)

**Status:** `coming_soon`  
**ID:** `health`

| Module Key | API Path | Database Prefix |
|------------|----------|-----------------|
| patient_records | `/api/health/patients` | `health_*` |
| appointment_scheduling | `/api/health/appointments` | `health_*` |
| pharmacy_pos | N/A | N/A |
| lab_management | `/api/health/lab-orders` | `health_*` |

**API Modules Found:** 11 (appointments, billing-facts, demo, encounters, facilities, guardians, lab-orders, patients, prescriptions, providers, visits)

---

### 4. Civic Suite (COMING SOON)

**Status:** `coming_soon`  
**ID:** `civic`

| Module Key | API Path | Database Prefix |
|------------|----------|-----------------|
| community_finance | `/api/civic/dues` | `civic_*` |
| member_management | `/api/civic/citizens` | `civic_*` |
| voting_polls | `/api/civic/voting` | `civic_*` |
| project_tracking | `/api/civic/requests` | `civic_*` |

**API Modules Found:** 21 (agencies, approvals, audit, billing-facts, cases, certificates, citizens, constituents, demo, departments, dues, events, inspections, organizations, public, requests, service-requests, services, staff, units, voting)

---

### 5. Hospitality Suite (COMING SOON)

**Status:** `coming_soon`  
**ID:** `hospitality`

| Module Key | API Path | Database Prefix |
|------------|----------|-----------------|
| hotel_rooms | `/api/hospitality/rooms` | `hospitality_*` |
| hotel_reservations | `/api/hospitality/reservations` | `hospitality_*` |
| restaurant_pos | `/api/hospitality/orders` | `hospitality_*` |
| event_booking | `/api/hospitality/venues` | `hospitality_*` |

**API Modules Found:** 14 (charge-facts, demo, floors, folio, guests, housekeeping, orders, reservations, rooms, shifts, staff, stays, tables, venues)

---

### 6. Logistics Suite (COMING SOON)

**Status:** `coming_soon`  
**ID:** `logistics`

| Module Key | API Path | Database Prefix |
|------------|----------|-----------------|
| order_fulfillment | `/api/logistics/jobs` | `logistics_*` |
| fleet_management | `/api/logistics/fleet` | `logistics_*` |
| driver_app | `/api/logistics/drivers` | `logistics_*` |
| route_optimization | `/api/logistics/zones` | `logistics_*` |

**API Modules Found:** 10 (agents, assignments, drivers, events, fleet, jobs, offline, utils, validate, zones)

---

### 7. Community Suite (COMING SOON)

**Status:** `coming_soon`  
**ID:** `community`

| Module Key | API Path | Database Prefix |
|------------|----------|-----------------|
| resident_management | N/A | N/A |
| facility_booking | N/A | N/A |
| dues_collection | N/A | N/A |
| announcements | N/A | N/A |

**Note:** No dedicated API routes found. May share with Civic suite.

---

## Additional Domain APIs (Not in Official Suites Config)

These API domains exist in the codebase but are NOT listed in the official suites registry:

### Church Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/church/*` | `chu_*` | 23 modules: assignments, attendance, audit, cells, churches, compliance, departments, events, evidence, giving, governance, guardians, members, ministries, regulator-access, roles, schedules, services, speakers, training, transparency, units, volunteer-logs |

---

### Political Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/political/*` | `pol_*` | 10 modules: audit, campaigns, candidates, elections, events, fundraising, governance, members, parties, volunteers |

---

### Real Estate Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/real-estate/*` | `re_*` | 5 modules: leases, maintenance-requests, properties, rent-schedules, units |

---

### Recruitment Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/recruitment/*` | `recruit_*` | 6 modules: applications, dashboard, interviews, jobs, offers, onboarding |

---

### Project Management Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/project-management/*` | `project_*` | 6 modules: budget, dashboard, milestones, projects, tasks, team |

---

### Legal Practice Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/legal-practice/*` | `leg_*` | 10 modules: dashboard, deadlines, disbursements, documents, filings, matters, parties, retainers, templates, time-entries |

---

### HR Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/hr/*` | `hr_*` | 6 modules: attendance, employees, leave, payroll, payslips |

---

### Sites & Funnels Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/sites-funnels/*` | `sf_*` | 6 modules: ai-content, analytics, domains, funnels, seed, sites |

---

### Advanced Warehouse Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/advanced-warehouse/*` | `wh_*` | Multiple modules for warehouse operations |

---

### Marketing Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/marketing/*` | `mkt_*` | Automation workflows and campaigns |

---

### Procurement Suite

| API Path | Database Prefix | Modules |
|----------|-----------------|---------|
| `/api/procurement/*` | `proc_*` | Purchase orders, requests, goods receipts |

---

## Infrastructure APIs (Not Vertical Suites)

| API Path | Purpose |
|----------|---------|
| `/api/auth` | Authentication (magic link, sessions) |
| `/api/partner` | Partner portal management |
| `/api/admin` | Super admin operations |
| `/api/tenants` | Tenant management |
| `/api/capabilities` | Capability registry |
| `/api/analytics` | Analytics engine |
| `/api/integrations` | Third-party integrations |
| `/api/ai` | AI assistant features |
| `/api/b2b` | B2B commerce features |

---

## Observations

1. **Suite Registry Gap:** Only 7 suites defined in config, but 15+ vertical domains exist in API layer
2. **Missing from Registry:** Church, Political, Real Estate, Recruitment, Project Management, Legal Practice, HR, Sites & Funnels, Advanced Warehouse, Marketing, Procurement
3. **Overlapping Domains:** Some modules appear in multiple suites (e.g., CRM, Billing)
4. **Database Coverage:** 300+ tables exist covering all domains
5. **API Coverage:** Full API routes exist for all domains

---

*End of Platform Suite & Module Inventory*
