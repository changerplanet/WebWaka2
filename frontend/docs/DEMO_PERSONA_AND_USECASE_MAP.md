# Demo Persona and Use Case Map

**Document Type:** Design Document (READ-ONLY)  
**Date:** January 14, 2026  
**Scope:** Demo Partner Only  
**Status:** DESIGN ONLY - NO EXECUTION

---

## Partner-Level Personas

### Demo Partner: WebWaka Demo Partner

| Persona | Role | Email | Suites Accessible | Primary Use Cases |
|---------|------|-------|-------------------|-------------------|
| Emeka (Owner) | PARTNER_OWNER | demo.owner@webwaka.com | ALL | Dashboard overview, Earnings reports, Client management |
| Adaeze (Admin) | PARTNER_ADMIN | demo.admin@webwaka.com | ALL | Staff management, Client operations, Package assignment |
| Chidera (Sales) | PARTNER_SALES | demo.sales@webwaka.com | ALL | Sales pipeline, Lead conversion, Client onboarding |
| Tunde (Support) | PARTNER_SUPPORT | demo.support@webwaka.com | ALL | Support tickets, Client issues, Troubleshooting |
| Ngozi (Staff) | PARTNER_STAFF | demo.staff@webwaka.com | ASSIGNED ONLY | Limited client view, Self-service |

---

## Partner Use Cases

### UC-P1: Partner Dashboard Overview
| Attribute | Value |
|-----------|-------|
| Persona | Emeka (Owner) |
| Description | View partner dashboard with client count, revenue, earnings |
| Preconditions | Logged in as Partner Owner |
| Demo Flow | Login → Dashboard → View widgets → Drill into details |
| Data Required | Clients, Earnings, Subscriptions |

### UC-P2: Client Portfolio Management
| Attribute | Value |
|-----------|-------|
| Persona | Emeka (Owner), Adaeze (Admin) |
| Description | View and manage all client tenants |
| Preconditions | At least 5 clients with varied status |
| Demo Flow | Clients list → Filter by status → View client details → Actions |
| Data Required | PlatformInstances with varied statuses |

### UC-P3: Staff Management
| Attribute | Value |
|-----------|-------|
| Persona | Adaeze (Admin) |
| Description | Add, edit, manage partner staff |
| Preconditions | Multiple staff members exist |
| Demo Flow | Staff list → Add staff → Assign role → Assign clients |
| Data Required | PartnerUser records with varied roles |

### UC-P4: Earnings & Payouts
| Attribute | Value |
|-----------|-------|
| Persona | Emeka (Owner) |
| Description | View earnings, commissions, payout history |
| Preconditions | Historical earnings data exists |
| Demo Flow | Earnings → Filter by period → View breakdown → Request payout |
| Data Required | PartnerEarning, PartnerInstanceEarning records |

### UC-P5: Limited Staff View
| Attribute | Value |
|-----------|-------|
| Persona | Ngozi (Staff) |
| Description | Demonstrate role-based filtering |
| Preconditions | Staff has assigned clients |
| Demo Flow | Login as Staff → See only assigned clients → Cannot see all earnings |
| Data Required | PartnerUser with assignedTenantIds |

---

## Tenant-Level Personas by Suite

### Commerce Suite (demo-retail-store)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Olu (Store Manager) | Tenant Admin | Full store access | Inventory, Reports, Staff |
| Bola (Cashier) | POS Staff | POS operations | Sales, Cash handling |
| Kemi (Stock Clerk) | Inventory Staff | Stock management | Receiving, Transfers |
| Ade (Customer) | End User | Online shopper | Browse, Order, Pay |

#### Commerce Use Cases

| ID | Use Case | Persona | Demo Tenant | Data Required |
|----|----------|---------|-------------|---------------|
| UC-C1 | Process POS Sale | Bola | demo-retail-store | Products, Shift |
| UC-C2 | End of Day Close | Olu | demo-retail-store | Sales, Cash movements |
| UC-C3 | Receive Inventory | Kemi | demo-retail-store | Products, Suppliers |
| UC-C4 | Online Purchase | Ade | demo-retail-store | Cart, Order |
| UC-C5 | Vendor Onboarding | Olu | demo-marketplace | Vendor application |
| UC-C6 | Commission Report | Olu | demo-marketplace | MVM orders, Payouts |

---

### Education Suite (demo-school)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Mrs. Okonkwo (Principal) | Tenant Admin | School management | Reports, Staff, Settings |
| Mr. Abubakar (Teacher) | Staff | Class teacher | Attendance, Grades |
| Mrs. Adeyemi (Bursar) | Finance Staff | Fee management | Fees, Payments |
| Chidi (Student) | End User | Secondary student | View grades, Timetable |
| Mr. Okafor (Parent) | Guardian | Parent access | View child progress |

#### Education Use Cases

| ID | Use Case | Persona | Data Required |
|----|----------|---------|---------------|
| UC-E1 | Mark Attendance | Mr. Abubakar | Classes, Students, Sessions |
| UC-E2 | Enter Grades | Mr. Abubakar | Assessments, Students |
| UC-E3 | Record Fee Payment | Mrs. Adeyemi | Fee structures, Students |
| UC-E4 | View Report Card | Mr. Okafor | Results, Grading scale |
| UC-E5 | Generate Analytics | Mrs. Okonkwo | Historical data |

---

### Health Suite (demo-clinic)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Dr. Nnamdi (Medical Director) | Tenant Admin | Clinic management | Reports, Protocols |
| Dr. Chukwu (Doctor) | Provider | Physician | Consultations, Prescriptions |
| Nurse Amaka (Nurse) | Staff | Nursing | Vitals, Triage |
| Mrs. Ibrahim (Receptionist) | Front Desk | Scheduling | Appointments, Check-in |
| Fatima (Patient) | End User | Patient | View records, Book appts |

#### Health Use Cases

| ID | Use Case | Persona | Data Required |
|----|----------|---------|---------------|
| UC-H1 | Book Appointment | Mrs. Ibrahim | Providers, Schedules |
| UC-H2 | Record Vitals | Nurse Amaka | Patients, Encounters |
| UC-H3 | Conduct Consultation | Dr. Chukwu | Encounters, Diagnoses |
| UC-H4 | Write Prescription | Dr. Chukwu | Medications, Patients |
| UC-H5 | View Patient History | Fatima | Encounters, Prescriptions |

---

### Hospitality Suite (demo-hotel)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Mr. Eze (GM) | Tenant Admin | Hotel management | Reports, Revenue |
| Mrs. Okwu (Front Desk) | Staff | Reception | Check-in, Reservations |
| Johnson (Housekeeping) | Staff | Room service | Cleaning tasks |
| Mr. Chen (Guest) | End User | Hotel guest | Booking, Check-in |

#### Hospitality Use Cases

| ID | Use Case | Persona | Data Required |
|----|----------|---------|---------------|
| UC-HO1 | Make Reservation | Mr. Chen | Rooms, Rates |
| UC-HO2 | Check-in Guest | Mrs. Okwu | Reservations, Rooms |
| UC-HO3 | Assign Housekeeping | Johnson | Rooms, Tasks |
| UC-HO4 | Room Service Order | Mr. Chen | Menu, Orders |
| UC-HO5 | Revenue Report | Mr. Eze | Stays, Charges |

---

### Civic Suite (demo-civic)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Alhaji Musa (Director) | Tenant Admin | Bureau management | Reports, Approvals |
| Mrs. Bello (Case Officer) | Staff | Case handling | Cases, Inspections |
| Mr. Adamu (Citizen) | End User | Service requester | Submit requests |

#### Civic Use Cases

| ID | Use Case | Persona | Data Required |
|----|----------|---------|---------------|
| UC-CV1 | Submit Service Request | Mr. Adamu | Services, Citizens |
| UC-CV2 | Process Request | Mrs. Bello | Requests, Staff |
| UC-CV3 | Conduct Inspection | Mrs. Bello | Cases, Inspections |
| UC-CV4 | Issue Certificate | Alhaji Musa | Approvals, Certificates |
| UC-CV5 | Public Voting | Mr. Adamu | Polls, Votes |

---

### Church Suite (demo-church)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Pastor Adebayo | Tenant Admin | Senior Pastor | Oversight, Reports |
| Deacon Obi | Staff | Administrator | Members, Events |
| Sister Mary | Member | Congregant | Giving, Events |

#### Church Use Cases

| ID | Use Case | Persona | Data Required |
|----|----------|---------|---------------|
| UC-CH1 | Record Giving | Deacon Obi | Members, Giving facts |
| UC-CH2 | Track Attendance | Deacon Obi | Services, Attendance |
| UC-CH3 | Manage Cell Groups | Deacon Obi | Cells, Members |
| UC-CH4 | Governance Report | Pastor Adebayo | Financials, Compliance |

---

### Political Suite (demo-political)

| Persona | Role | Description | Key Use Cases |
|---------|------|-------------|---------------|
| Chief Amadi (Chairman) | Tenant Admin | Party leader | Strategy, Reports |
| Mr. Okeke (Secretary) | Staff | Administration | Members, Events |
| Mrs. Uche (Volunteer) | Member | Party worker | Campaigns, Donations |

#### Political Use Cases

| ID | Use Case | Persona | Data Required |
|----|----------|---------|---------------|
| UC-PO1 | Register Member | Mr. Okeke | Members, Parties |
| UC-PO2 | Record Donation | Mr. Okeke | Donations, Members |
| UC-PO3 | Campaign Management | Chief Amadi | Campaigns, Events |
| UC-PO4 | Primary Election | Chief Amadi | Candidates, Votes |

---

## Cross-Suite Use Cases

### UC-X1: Commerce to Logistics
| Flow | Description |
|------|-------------|
| Trigger | Online order placed in SVM |
| Suite 1 | Commerce/SVM → Order created |
| Suite 2 | Logistics → Delivery job created |
| Tenants | demo-retail-store → demo-logistics |

### UC-X2: CRM to Commerce
| Flow | Description |
|------|-------------|
| Trigger | CRM campaign targets customer segment |
| Suite 1 | CRM → Campaign sent |
| Suite 2 | Commerce → Orders from campaign |
| Tenants | Shared CRM data |

### UC-X3: HR to Payroll
| Flow | Description |
|------|-------------|
| Trigger | End of month payroll |
| Suite 1 | HR → Attendance aggregated |
| Suite 2 | HR → Payroll calculated |
| Tenants | demo-recruitment |

---

## Persona Count Summary

| Level | Persona Type | Count |
|-------|--------------|-------|
| Partner | Owner, Admin, Sales, Support, Staff | 5 |
| Commerce | Manager, Cashier, Stock, Customer | 4+ per tenant |
| Education | Principal, Teacher, Bursar, Student, Parent | 5+ |
| Health | Director, Doctor, Nurse, Receptionist, Patient | 5+ |
| Hospitality | GM, Front Desk, Housekeeping, Guest | 4+ |
| Civic | Director, Case Officer, Citizen | 3+ |
| Church | Pastor, Deacon, Member | 3+ |
| Political | Chairman, Secretary, Volunteer | 3+ |
| **Total** | | ~40+ conceptual personas |

---

*End of Demo Persona and Use Case Map*
