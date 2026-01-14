# Demo Data Coverage Matrix

**Audit Date:** January 14, 2026  
**Auditor:** Replit Agent (Read-Only Audit)  
**Scope:** Demo data existence per suite, module, and role

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Infrastructure Seeded | YES |
| Partner Data Seeded | YES |
| Module Data Seeded | NO |
| Overall Demo Readiness | BLOCKED |

---

## Infrastructure Layer (SEEDED)

| Entity | Record Count | Status |
|--------|--------------|--------|
| Partner | 1 | SEEDED |
| PartnerUser | 5 | SEEDED |
| Tenant | 16 | SEEDED |
| User | 96 | SEEDED |
| PlatformInstance | 16 | SEEDED |

**Roles Covered:** PARTNER_OWNER, PARTNER_ADMIN, PARTNER_STAFF, PARTNER_SALES, PARTNER_SUPPORT

---

## Suite-Level Demo Data Coverage

### Commerce Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| POS | pos_sale | 0 | NONE | Sales, Shifts, Cash movements |
| POS | pos_shift | 0 | NONE | Shifts, Register data |
| SVM | svm_orders | 0 | NONE | Orders, Carts, Promotions |
| SVM | svm_carts | 0 | NONE | Active carts |
| MVM | mvm_vendor | 0 | NONE | Vendors, Commissions, Payouts |
| Inventory | InventoryLevel | 0 | NONE | Stock levels, Movements |
| Inventory | Product | 0 | NONE | Products, Categories, Variants |
| Accounting | acct_* | 0 | NONE | Chart of accounts, Journals |
| Payments | pay_* | 0 | NONE | Transactions, Wallets, Settlements |
| CRM | crm_* | 0 | NONE | Campaigns, Segments, Loyalty |
| Billing | bill_* | 0 | NONE | Invoices, Payments |

**Commerce Suite Status:** NOT SEEDED

---

### Education Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Students | edu_student | 0 | NONE | Student records |
| Classes | edu_class | 0 | NONE | Classes, Subjects |
| Assessments | edu_assessment | 0 | NONE | Tests, Exams |
| Attendance | edu_attendance | 0 | NONE | Attendance records |
| Fees | edu_fee_* | 0 | NONE | Fee structures, Payments |
| Grades | edu_result | 0 | NONE | Grades, Report cards |
| Staff | edu_staff | 0 | NONE | Teachers, Administrators |
| Guardians | edu_guardian | 0 | NONE | Parent/Guardian records |

**Education Suite Status:** NOT SEEDED

---

### Health Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Patients | health_patient | 0 | NONE | Patient records |
| Providers | health_provider | 0 | NONE | Doctors, Nurses |
| Appointments | health_appointment | 0 | NONE | Scheduled appointments |
| Encounters | health_encounter | 0 | NONE | Visit records |
| Prescriptions | health_prescription | 0 | NONE | Medication orders |
| Lab Orders | health_lab_* | 0 | NONE | Lab tests, Results |
| Facilities | health_facility | 0 | NONE | Clinics, Departments |
| Visits | health_visit | 0 | NONE | Visit history |

**Health Suite Status:** NOT SEEDED

---

### Civic Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Citizens | civic_citizen | 0 | NONE | Citizen profiles |
| Cases | civic_case | 0 | NONE | Case management |
| Services | civic_service | 0 | NONE | Service catalog |
| Requests | civic_request | 0 | NONE | Service requests |
| Voting | civic_* | 0 | NONE | Polls, Votes |
| Inspections | civic_inspection | 0 | NONE | Inspection records |
| Staff | civic_staff | 0 | NONE | Government staff |
| Departments | civic_department | 0 | NONE | Org structure |

**Civic Suite Status:** NOT SEEDED

---

### Hospitality Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Rooms | hospitality_room | 0 | NONE | Room inventory |
| Guests | hospitality_guest | 0 | NONE | Guest profiles |
| Reservations | hospitality_reservation | 0 | NONE | Bookings |
| Stays | hospitality_stay | 0 | NONE | Check-ins |
| Orders | hospitality_order | 0 | NONE | F&B orders |
| Staff | hospitality_staff | 0 | NONE | Hotel staff |
| Venues | hospitality_venue | 0 | NONE | Event spaces |
| Housekeeping | hospitality_* | 0 | NONE | Cleaning tasks |

**Hospitality Suite Status:** NOT SEEDED

---

### Logistics Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Agents | logistics_delivery_agents | 0 | NONE | Delivery personnel |
| Jobs | logistics_* | 0 | NONE | Delivery jobs |
| Fleet | logistics_* | 0 | NONE | Vehicles |
| Zones | logistics_delivery_zones | 0 | NONE | Delivery areas |

**Logistics Suite Status:** NOT SEEDED

---

### Church Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Churches | chu_church | 0 | NONE | Church entities |
| Members | chu_member | 0 | NONE | Congregation |
| Ministries | chu_ministry | 0 | NONE | Ministry groups |
| Giving | chu_giving_* | 0 | NONE | Tithes, Offerings |
| Events | chu_event | 0 | NONE | Church events |
| Cells | chu_cell_* | 0 | NONE | Small groups |
| Attendance | chu_attendance_fact | 0 | NONE | Service attendance |
| Governance | chu_governance_* | 0 | NONE | Leadership records |

**Church Suite Status:** NOT SEEDED

---

### Political Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Parties | pol_party | 0 | NONE | Political parties |
| Members | pol_member | 0 | NONE | Party members |
| Campaigns | pol_campaign | 0 | NONE | Election campaigns |
| Candidates | pol_candidate | 0 | NONE | Candidate profiles |
| Elections | pol_* | 0 | NONE | Election data |
| Fundraising | pol_donation_* | 0 | NONE | Donations |
| Volunteers | pol_volunteer | 0 | NONE | Volunteer records |
| Governance | pol_governance_* | 0 | NONE | Party governance |

**Political Suite Status:** NOT SEEDED

---

### Real Estate Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Properties | re_property | 0 | NONE | Property listings |
| Units | re_unit | 0 | NONE | Rental units |
| Leases | re_lease | 0 | NONE | Lease agreements |
| Rent | re_rent_schedule | 0 | NONE | Rent schedules |
| Maintenance | re_maintenance_request | 0 | NONE | Work orders |

**Real Estate Suite Status:** NOT SEEDED

---

### Recruitment Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Jobs | recruit_job | 0 | NONE | Job postings |
| Applications | recruit_application | 0 | NONE | Candidate applications |
| Interviews | recruit_interview | 0 | NONE | Interview schedules |
| Offers | recruit_offer | 0 | NONE | Job offers |
| Onboarding | recruit_onboarding_task | 0 | NONE | Onboarding tasks |

**Recruitment Suite Status:** NOT SEEDED

---

### Project Management Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Projects | project_project | 0 | NONE | Projects |
| Tasks | project_task | 0 | NONE | Task items |
| Milestones | project_milestone | 0 | NONE | Milestones |
| Team | project_team_member | 0 | NONE | Team assignments |
| Budget | project_budget_item | 0 | NONE | Budget tracking |

**Project Management Suite Status:** NOT SEEDED

---

### Legal Practice Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Matters | leg_matter | 0 | NONE | Legal matters/cases |
| Parties | leg_matter_party | 0 | NONE | Case parties |
| Documents | leg_document | 0 | NONE | Legal documents |
| Time Entries | leg_time_entry | 0 | NONE | Billable hours |
| Retainers | leg_retainer | 0 | NONE | Client retainers |
| Filings | leg_filing | 0 | NONE | Court filings |
| Deadlines | leg_deadline | 0 | NONE | Case deadlines |

**Legal Practice Suite Status:** NOT SEEDED

---

### HR Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Employees | hr_employee_profiles | 0 | NONE | Employee records |
| Attendance | hr_attendance_records | 0 | NONE | Time tracking |
| Leave | hr_leave_* | 0 | NONE | Leave management |
| Payroll | hr_payroll_* | 0 | NONE | Salary processing |
| Payslips | hr_payslips | 0 | NONE | Pay statements |

**HR Suite Status:** NOT SEEDED

---

### Sites & Funnels Suite

| Module | Entity | Record Count | Roles Covered | Data Types Missing |
|--------|--------|--------------|---------------|-------------------|
| Sites | sf_sites | 0 | NONE | Website builders |
| Pages | sf_pages | 0 | NONE | Landing pages |
| Funnels | sf_funnels | 0 | NONE | Sales funnels |
| Templates | sf_templates | 0 | NONE | Page templates |
| Analytics | sf_analytics_* | 0 | NONE | Traffic data |

**Sites & Funnels Suite Status:** NOT SEEDED

---

## Role-Based Coverage Summary

| Role | Infrastructure Access | Module Data Access |
|------|----------------------|-------------------|
| PARTNER_OWNER | Full | NO DATA TO ACCESS |
| PARTNER_ADMIN | Full | NO DATA TO ACCESS |
| PARTNER_STAFF | Filtered | NO DATA TO ACCESS |
| PARTNER_SALES | Full | NO DATA TO ACCESS |
| PARTNER_SUPPORT | Full | NO DATA TO ACCESS |

---

## Critical Gaps Summary

| Gap Type | Count | Impact |
|----------|-------|--------|
| Suites with no demo data | ALL (15+) | BLOCKING |
| Modules with no records | 100+ | BLOCKING |
| Role-specific test scenarios | 0 | BLOCKING |
| Historical/trend data | 0 | BLOCKING |
| Transaction samples | 0 | BLOCKING |

---

## Conclusion

**Demo Data Readiness: BLOCKED**

The platform has:
- Fully functional infrastructure (Partner, Users, Tenants)
- Complete API layer for all suites
- Database schema for all modules
- Role-based access control working

The platform lacks:
- ANY module-level demo data
- Sample transactions or activities
- Historical data for trends/analytics
- Role-specific test scenarios

---

*End of Demo Data Coverage Matrix*
