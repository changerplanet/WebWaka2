# WEBWAKA DEMO CREDENTIALS & USE-CASE MASTER REPORT

**Document Version:** 1.0  
**Last Updated:** January 14, 2026  
**Purpose:** Sales Demos, Partner Onboarding, Internal QA, Support & Training

---

## TABLE OF CONTENTS

1. [Platform Overview](#section-1--platform-overview)
2. [Demo Partner Credentials](#section-2--demo-partner-credentials)
3. [Super Admin Credentials](#section-3--super-admin-credentials)
4. [Demo Tenant Matrix](#section-4--demo-tenant-matrix)
5. [Tenant-Level Demo Credentials](#section-5--tenant-level-demo-credentials)
6. [Suite-by-Suite Demo Use Cases](#section-6--suite-by-suite-demo-use-cases)
7. [Cross-Suite Demo Flows](#section-7--cross-suite-demo-flows)
8. [Demo Constraints & Notes](#section-8--demo-constraints--notes)
9. [Quick-Start Cheat Sheet](#section-9--quick-start-cheat-sheet)

---

## SECTION 1 — PLATFORM OVERVIEW

### What is WebWaka?

WebWaka is a multi-tenant SaaS platform designed for digital transformation partners in Nigeria and Africa. It enables partners to configure, brand, and deliver business solutions to their clients across 20+ industry verticals.

### Demo Partner Concept

The **WebWaka Demo Partner** is a fully configured partner organization used for demonstrations. It has:
- 5 partner-level users (Owner, Admin, Sales, Support, Staff)
- 16 demo tenants representing various Nigerian businesses
- Pre-seeded demo data across 11 business suites
- Realistic Nigerian business names, contacts, and workflows

### Demo Tenants (16 Total)

Each demo tenant represents a realistic Nigerian business:
- Has 5-7 users with appropriate roles
- Contains pre-seeded demo data for its industry
- Connected to the Demo Partner via referral

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER_ADMIN                                  │
│              (Platform Administrator - Full Access)              │
├─────────────────────────────────────────────────────────────────┤
│                     PARTNER LEVEL                                │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐      │
│  │   OWNER     │    ADMIN    │    SALES    │   SUPPORT   │      │
│  │  (Full)     │  (Admin)    │  (Sales)    │  (Support)  │      │
│  ├─────────────┴─────────────┴─────────────┴─────────────┤      │
│  │                       STAFF                            │      │
│  │                    (Limited)                           │      │
│  └────────────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                     TENANT LEVEL                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │   TENANT_ADMIN          │        TENANT_USER            │    │
│  │  (Full Tenant Access)   │    (Limited Tenant Access)    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### What Demo Data Represents

- **Realistic Nigerian business context** - Lagos-based businesses, Nigerian names, Naira currency
- **Complete workflows** - Not just static data, but interconnected records
- **Sales-ready data** - Enough depth to demonstrate value propositions
- **Multiple user perspectives** - See the same business from admin, staff, and customer views

---

## SECTION 2 — DEMO PARTNER CREDENTIALS

### Login URL
```
https://[your-domain]/login
```
or
```
https://[your-domain]/login-v2
```

### Partner: WebWaka Demo Partner

| Role | Email | Name | Primary Capabilities |
|------|-------|------|---------------------|
| **PARTNER_OWNER** | `demo.owner@webwaka.com` | Demo Partner Owner | Full partner portal access, tenant management, billing, user management |
| **PARTNER_ADMIN** | `demo.admin@webwaka.com` | Demo Partner Admin | Partner administration, tenant support, user management |
| **PARTNER_SALES** | `demo.sales@webwaka.com` | Demo Sales Rep | Lead management, demo scheduling, prospect tracking |
| **PARTNER_SUPPORT** | `demo.support@webwaka.com` | Demo Support Agent | Tenant support tickets, issue resolution |
| **PARTNER_STAFF** | `demo.staff@webwaka.com` | Demo Staff Member | Limited access, basic partner tasks |

### Password Authentication
All demo accounts use **magic link authentication** (OTP sent to email). For demo environments, OTPs may be logged to the console or use a development bypass.

### Partner Portal Access Matrix

| Feature | OWNER | ADMIN | SALES | SUPPORT | STAFF |
|---------|:-----:|:-----:|:-----:|:-------:|:-----:|
| Partner Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tenant List (Referred) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create New Tenants | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Partner Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing & Payments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Support Tickets | ✅ | ✅ | ❌ | ✅ | ❌ |
| Sales Pipeline | ✅ | ✅ | ✅ | ❌ | ❌ |

### Key Demo Use Cases by Partner Role

#### PARTNER_OWNER Demo Scenarios
1. View all 16 referred demo tenants
2. Access partner dashboard with revenue metrics
3. Manage partner team members
4. View billing and payout information
5. Demonstrate full partner lifecycle

#### PARTNER_SALES Demo Scenarios
1. View prospect pipeline
2. Schedule demos for leads
3. Access demo tenant information
4. Track conversion metrics

#### PARTNER_SUPPORT Demo Scenarios
1. View support tickets from tenants
2. Access tenant information for troubleshooting
3. Escalate issues to admin

---

## SECTION 3 — SUPER ADMIN CREDENTIALS

### Access Method
Super Admin access is controlled via the `globalRole` field in the User table. Users with `globalRole = 'SUPER_ADMIN'` have full platform access.

### Super Admin Capabilities

| Capability | Description |
|------------|-------------|
| **Global Oversight** | View all tenants, partners, and users across the platform |
| **Partner Management** | Create, edit, suspend, or delete partner organizations |
| **Tenant Management** | Access any tenant regardless of partner association |
| **User Management** | Manage all users, reset credentials, impersonation |
| **Platform Configuration** | System settings, feature flags, billing configuration |
| **Audit Logs** | View all platform activity logs |
| **Financial Reports** | Platform-wide revenue and billing reports |

### Restricted Areas (Super Admin Only)

| Route | Description |
|-------|-------------|
| `/admin` | Platform administration dashboard |
| `/admin/partners` | Partner organization management |
| `/admin/tenants` | All tenants management |
| `/admin/users` | Global user management |
| `/admin/audit-logs` | Platform activity logs |
| `/admin/financials` | Revenue and billing |
| `/api/admin/*` | All admin API endpoints |

### Creating Super Admin Access
Super Admin accounts are created by:
1. Setting `globalRole = 'SUPER_ADMIN'` in the database
2. Platform seeding scripts
3. Existing Super Admin invitation

**Note:** No Super Admin demo accounts are pre-seeded. For demo purposes, use Partner Owner accounts to demonstrate near-complete functionality.

---

## SECTION 4 — DEMO TENANT MATRIX

### Complete Demo Tenant List (16 Tenants)

| # | Tenant Name | Slug | Primary Suite(s) | Demo Purpose | Users |
|---|-------------|------|------------------|--------------|-------|
| 1 | **Lagos Retail Store** | `demo-retail-store` | POS, Commerce (SVM) | Retail business with products, sales, shifts | 5 |
| 2 | **Bright Future Academy** | `demo-school` | Education | Nigerian school with students, classes, grades | 6 |
| 3 | **HealthFirst Clinic** | `demo-clinic` | Health | Medical clinic with patients, appointments | 6 |
| 4 | **PalmView Suites Lagos** | `demo-hotel` | Hospitality | Hotel with rooms, reservations, guests | 7 |
| 5 | **Lagos State Lands Bureau** | `demo-civic` | Civic | Government office with cases, citizens | 6 |
| 6 | **Swift Logistics** | `demo-logistics` | Logistics | Delivery company with drivers, shipments | 6 |
| 7 | **Naija Market Hub** | `demo-marketplace` | Marketplace (MVM) | Multi-vendor marketplace | 5 |
| 8 | **GraceLife Community Church** | `demo-church` | Church | Church with members, events, giving | 6 |
| 9 | **Lagos Campaign HQ** | `demo-political` | Political | Political campaign with volunteers, donations | 6 |
| 10 | **Lagos Property Managers** | `demo-real-estate` | Real Estate | Property management with units, leases | 5 |
| 11 | **B2B Wholesale Hub** | `demo-b2b` | B2B Commerce | Wholesale business with orders | 5 |
| 12 | **BuildRight Projects Ltd** | `demo-project` | Projects | Construction company with projects, tasks | 5 |
| 13 | **Nwosu & Associates Chambers** | `demo-legal` | Legal | Law firm with matters, clients | 6 |
| 14 | **Ojota Motor Park** | `demo-parkhub` | Transport | Motor park with drivers, vehicles | 6 |
| 15 | **Swift HR Solutions** | `demo-recruitment` | Recruitment | HR agency with jobs, candidates | 5 |
| 16 | **Lagos Fulfillment Center** | `demo-warehouse` | Warehouse | Fulfillment center with inventory | 6 |

### Suite Coverage by Tenant

| Suite | Primary Demo Tenant | Demo Strength |
|-------|---------------------|---------------|
| POS | Lagos Retail Store | ✅ Strong |
| Commerce (SVM) | Lagos Retail Store | ✅ Strong |
| Marketplace (MVM) | Naija Market Hub | ✅ Strong |
| Education | Bright Future Academy | ✅ Strong |
| Health | HealthFirst Clinic | ✅ Strong |
| Hospitality | PalmView Suites Lagos | ✅ Strong |
| Logistics | Swift Logistics | ⚡ Medium |
| Civic | Lagos State Lands Bureau | ⚡ Medium |
| Real Estate | Lagos Property Managers | ✅ Strong |
| Church | GraceLife Community Church | ✅ Strong |
| Political | Lagos Campaign HQ | ✅ Strong |

---

## SECTION 5 — TENANT-LEVEL DEMO CREDENTIALS

### Login URL
```
https://[your-domain]/login
```

### Authentication
All tenant users authenticate via **magic link** (email OTP).

---

### 1. Lagos Retail Store (`demo-retail-store`)
**Suite:** POS + Commerce

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `owner@demo-retail-store.demo` | Chief Adebayo Okonkwo | Full access, reports, settings |
| TENANT_ADMIN | `manager@demo-retail-store.demo` | Mrs. Ngozi Eze | Staff management, inventory |
| TENANT_USER | `cashier@demo-retail-store.demo` | Amaka Obi | POS sales, shift operations |
| TENANT_USER | `stock@demo-retail-store.demo` | Chidi Nwosu | Inventory management |
| TENANT_USER | `auditor@demo-retail-store.demo` | Barr. Funmi Adeleke | View reports |

**Demo Data:** 25 products, 20 sales, 2 shifts, 8 categories, 25 inventory items

---

### 2. Bright Future Academy (`demo-school`)
**Suite:** Education

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `proprietor@demo-school.demo` | Chief Mrs. Adaeze Okafor | School administration |
| TENANT_ADMIN | `principal@demo-school.demo` | Mr. Emmanuel Adeyemi | Academic oversight |
| TENANT_USER | `teacher@demo-school.demo` | Mrs. Blessing Nwankwo | Classes, grades, attendance |
| TENANT_USER | `bursar@demo-school.demo` | Mr. Samuel Igwe | Fee collection |
| TENANT_USER | `parent@demo-school.demo` | Mrs. Yetunde Balogun | View child's records |
| TENANT_USER | `auditor@demo-school.demo` | Mr. Femi Olaniyan | Reports |

**Demo Data:** 35 students, 9 classes, 904 assessments, 525 attendance records

---

### 3. HealthFirst Clinic (`demo-clinic`)
**Suite:** Health

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `director@demo-clinic.demo` | Dr. Ngozi Eze | Clinic administration |
| TENANT_ADMIN | `admin@demo-clinic.demo` | Mrs. Funke Adebisi | Administrative tasks |
| TENANT_USER | `doctor@demo-clinic.demo` | Dr. Chukwudi Okonkwo | Patient encounters, prescriptions |
| TENANT_USER | `nurse@demo-clinic.demo` | Nurse Amina Yusuf | Patient intake, vitals |
| TENANT_USER | `patient@demo-clinic.demo` | Mr. Tunde Bakare | View own records |
| TENANT_USER | `auditor@demo-clinic.demo` | Dr. Olumide Fagbemi | Reports |

**Demo Data:** 15 patients, 12 encounters, 10 appointments, 15 prescriptions

---

### 4. PalmView Suites Lagos (`demo-hotel`)
**Suite:** Hospitality

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `owner@demo-hotel.demo` | Chief Adekunle Balogun | Hotel oversight |
| TENANT_ADMIN | `gm@demo-hotel.demo` | Mr. Olumide Adeyemi | Operations management |
| TENANT_USER | `frontdesk@demo-hotel.demo` | Miss Chidinma Eze | Check-in/out, reservations |
| TENANT_USER | `housekeeping@demo-hotel.demo` | Mrs. Comfort Nwachukwu | Room status |
| TENANT_USER | `restaurant@demo-hotel.demo` | Mr. Tunde Ogunleye | F&B orders |
| TENANT_USER | `guest@demo-hotel.demo` | Mr. Chidi Okonkwo | View own bookings |
| TENANT_USER | `auditor@demo-hotel.demo` | Mrs. Funmi Adeleke | Reports |

**Demo Data:** 14 rooms, 10 reservations, 10 guests

---

### 5. Lagos State Lands Bureau (`demo-civic`)
**Suite:** Civic

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `director@demo-civic.demo` | Engr. Babatunde Fashola | Bureau administration |
| TENANT_USER | `officer@demo-civic.demo` | Mr. Adewale Ogunbiyi | Process cases |
| TENANT_USER | `regulator@demo-civic.demo` | Barr. Folake Adeyemi | Regulatory oversight |
| TENANT_USER | `inspector@demo-civic.demo` | Mrs. Ngozi Okafor | Site inspections |
| TENANT_USER | `citizen@demo-civic.demo` | Chief Emeka Okafor | Submit requests |
| TENANT_USER | `auditor@demo-civic.demo` | Mr. Femi Olaniyan | Reports |

**Demo Data:** 10 citizens, 12 cases, 12 service requests

---

### 6. Swift Logistics (`demo-logistics`)
**Suite:** Logistics

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `owner@demo-logistics.demo` | Chief Emeka Obi | Company oversight |
| TENANT_ADMIN | `dispatch@demo-logistics.demo` | Mr. Kunle Bello | Dispatch management |
| TENANT_USER | `driver@demo-logistics.demo` | Mr. Musa Abdullahi | Accept/complete deliveries |
| TENANT_USER | `rider@demo-logistics.demo` | Ibrahim Danladi | Last-mile deliveries |
| TENANT_USER | `cs@demo-logistics.demo` | Mrs. Aisha Mohammed | Customer service |
| TENANT_USER | `auditor@demo-logistics.demo` | Mr. Femi Adesina | Reports |

**Demo Data:** 8 agents, 15+ shipments, driver assignments

---

### 7. Naija Market Hub (`demo-marketplace`)
**Suite:** Marketplace (MVM)

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `owner@demo-marketplace.demo` | Mr. Tunde Bakare | Marketplace administration |
| TENANT_ADMIN | `admin@demo-marketplace.demo` | Mrs. Bisi Adeyemi | Vendor management |
| TENANT_USER | `vendors@demo-marketplace.demo` | Emeka Okoro | Vendor operations |
| TENANT_USER | `support@demo-marketplace.demo` | Fatima Hassan | Customer support |
| TENANT_USER | `auditor@demo-marketplace.demo` | Mr. Olumide Fagbemi | Reports |

**Demo Data:** 10 vendors, 4 vendor tiers, marketplace config

---

### 8. GraceLife Community Church (`demo-church`)
**Suite:** Church

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `pastor@demo-church.demo` | Pastor Emmanuel Adeyemi | Church leadership |
| TENANT_ADMIN | `admin@demo-church.demo` | Deacon Samuel Igwe | Church administration |
| TENANT_USER | `ministry@demo-church.demo` | Pastor Grace Okonkwo | Ministry coordination |
| TENANT_USER | `finance@demo-church.demo` | Deaconess Bisi Adeyemi | Offering records |
| TENANT_USER | `member@demo-church.demo` | Bro. Chidi Okonkwo | Member view |
| TENANT_USER | `auditor@demo-church.demo` | Barr. Funmi Adeleke | Reports |

**Demo Data:** 45 members, 10 events, 37 donations, 57 attendance records

---

### 9. Lagos Campaign HQ (`demo-political`)
**Suite:** Political

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `manager@demo-political.demo` | Chief Adebayo Adeyemi | Campaign management |
| TENANT_ADMIN | `official@demo-political.demo` | Hon. Kunle Bakare | Political oversight |
| TENANT_USER | `volunteers@demo-political.demo` | Mrs. Ngozi Obi | Volunteer coordination |
| TENANT_USER | `field@demo-political.demo` | Mr. Emeka Nwankwo | Field operations |
| TENANT_USER | `finance@demo-political.demo` | Mr. Tunde Bakare | Campaign finance |
| TENANT_USER | `auditor@demo-political.demo` | Barr. Olumide Fagbemi | Reports |

**Demo Data:** 8 members, 6 donations, 6 events, 25+ volunteers

---

### 10. Lagos Property Managers (`demo-real-estate`)
**Suite:** Real Estate

| Role | Email | Name | Key Actions |
|------|-------|------|-------------|
| TENANT_ADMIN | `owner@demo-real-estate.demo` | Chief Adeola Odutola | Property oversight |
| TENANT_ADMIN | `manager@demo-real-estate.demo` | Mr. Kunle Abiodun | Property management |
| TENANT_USER | `tenant@demo-real-estate.demo` | Mrs. Amaka Eze | Tenant portal |
| TENANT_USER | `facility@demo-real-estate.demo` | Engr. Chidi Okonkwo | Maintenance |
| TENANT_USER | `auditor@demo-real-estate.demo` | Barr. Tunde Bakare | Reports |

**Demo Data:** 3 properties, 10 units, 6 leases, 8+ rent payments

---

### 11-16. Additional Demo Tenants

| Tenant | Slug | Admin Email | Suite |
|--------|------|-------------|-------|
| B2B Wholesale Hub | `demo-b2b` | `owner@demo-b2b.demo` | B2B Commerce |
| BuildRight Projects Ltd | `demo-project` | `owner@demo-project.demo` | Projects |
| Nwosu & Associates Chambers | `demo-legal` | `partner@demo-legal.demo` | Legal |
| Ojota Motor Park | `demo-parkhub` | `chairman@demo-parkhub.demo` | Transport |
| Swift HR Solutions | `demo-recruitment` | `director@demo-recruitment.demo` | Recruitment |
| Lagos Fulfillment Center | `demo-warehouse` | `owner@demo-warehouse.demo` | Warehouse |

---

## SECTION 6 — SUITE-BY-SUITE DEMO USE CASES

### 6.1 Commerce / POS Suite

**Demo Tenant:** Lagos Retail Store  
**Personas:** Owner, Manager, Cashier, Stock Keeper

#### Demo Data Available
- 25 products with prices in Naira
- 8 product categories
- 25 inventory items with stock levels
- 20 completed sales
- 2 POS shifts

#### Step-by-Step Demo Flows

**Flow 1: Open Shift & Make Sale**
1. Login as `cashier@demo-retail-store.demo`
2. Navigate to POS → Open New Shift
3. Enter opening cash float (e.g., ₦50,000)
4. Browse products by category
5. Add items to cart
6. Complete sale with cash/card
7. Print receipt

**Flow 2: View Sales Report**
1. Login as `manager@demo-retail-store.demo`
2. Navigate to Reports → Daily Sales
3. View sales by shift
4. Export report

**Flow 3: Check Inventory**
1. Login as `stock@demo-retail-store.demo`
2. Navigate to Inventory
3. View stock levels
4. Identify low-stock items

#### UI Routes
- `/dashboard/pos` - POS terminal
- `/dashboard/products` - Product catalog
- `/dashboard/inventory` - Stock management
- `/dashboard/reports` - Sales reports

---

### 6.2 Education Suite

**Demo Tenant:** Bright Future Academy  
**Personas:** Proprietor, Principal, Teacher, Bursar, Parent

#### Demo Data Available
- 35 students with Nigerian names
- 9 classes (JSS1-3, SSS1-3, Primary)
- 904 assessment records
- 525 attendance records
- 226 result entries

#### Step-by-Step Demo Flows

**Flow 1: Mark Attendance**
1. Login as `teacher@demo-school.demo`
2. Navigate to Classes → Select Class
3. Mark students present/absent
4. Submit attendance

**Flow 2: Enter Grades**
1. Login as `teacher@demo-school.demo`
2. Navigate to Assessments
3. Select subject and class
4. Enter scores for each student
5. Submit grades

**Flow 3: View Report Card (Parent)**
1. Login as `parent@demo-school.demo`
2. Navigate to My Children
3. Select child
4. View report card

**Flow 4: Collect Fees**
1. Login as `bursar@demo-school.demo`
2. Navigate to Finance → Fee Collection
3. Search student
4. Record payment
5. Print receipt

#### UI Routes
- `/dashboard/students` - Student records
- `/dashboard/classes` - Class management
- `/dashboard/attendance` - Attendance tracking
- `/dashboard/assessments` - Grade entry
- `/dashboard/fees` - Fee collection

---

### 6.3 Health Suite

**Demo Tenant:** HealthFirst Clinic  
**Personas:** Director, Admin, Doctor, Nurse, Patient

#### Demo Data Available
- 15 patients with medical records
- 12 clinical encounters
- 10 appointments
- 15 prescriptions

#### Step-by-Step Demo Flows

**Flow 1: Patient Check-In**
1. Login as `admin@demo-clinic.demo`
2. Navigate to Reception
3. Search existing patient or register new
4. Check in for appointment

**Flow 2: Clinical Encounter**
1. Login as `doctor@demo-clinic.demo`
2. Navigate to Consultations
3. Select checked-in patient
4. Record vitals, symptoms, diagnosis
5. Create prescription
6. Order lab tests if needed

**Flow 3: View My Records (Patient)**
1. Login as `patient@demo-clinic.demo`
2. Navigate to My Health
3. View visit history
4. View prescriptions

#### UI Routes
- `/dashboard/patients` - Patient records
- `/dashboard/appointments` - Scheduling
- `/dashboard/encounters` - Clinical notes
- `/dashboard/prescriptions` - Medication management

---

### 6.4 Hospitality Suite

**Demo Tenant:** PalmView Suites Lagos  
**Personas:** Owner, GM, Front Desk, Housekeeping, Restaurant, Guest

#### Demo Data Available
- 14 rooms (Standard, Deluxe, Suite)
- 10 reservations
- 10 registered guests

#### Step-by-Step Demo Flows

**Flow 1: Make Reservation**
1. Login as `frontdesk@demo-hotel.demo`
2. Navigate to Reservations → New
3. Check availability
4. Enter guest details
5. Confirm booking

**Flow 2: Check-In Guest**
1. Navigate to Reservations
2. Find reservation
3. Verify guest ID
4. Assign room
5. Issue key card
6. Complete check-in

**Flow 3: Room Status Update**
1. Login as `housekeeping@demo-hotel.demo`
2. Navigate to Rooms
3. Mark room cleaned/inspected

**Flow 4: Restaurant Order**
1. Login as `restaurant@demo-hotel.demo`
2. Navigate to F&B Orders
3. Create order for room
4. Add to guest folio

#### UI Routes
- `/dashboard/rooms` - Room management
- `/dashboard/reservations` - Booking system
- `/dashboard/guests` - Guest profiles
- `/dashboard/folio` - Guest billing

---

### 6.5 Marketplace (MVM) Suite

**Demo Tenant:** Naija Market Hub  
**Personas:** Owner, Admin, Vendor, Customer Support

#### Demo Data Available
- 10 vendors with profiles
- 4 vendor tiers (Bronze, Silver, Gold, Platinum)
- Marketplace configuration

#### Step-by-Step Demo Flows

**Flow 1: Vendor Onboarding**
1. Login as `admin@demo-marketplace.demo`
2. Navigate to Vendors → Add New
3. Enter vendor details
4. Assign tier
5. Activate vendor

**Flow 2: View Vendor Performance**
1. Navigate to Analytics
2. Select vendor
3. View sales, ratings, metrics

**Flow 3: Configure Commission**
1. Navigate to Settings → Commission
2. Set percentage by tier
3. Save configuration

#### UI Routes
- `/dashboard/vendors` - Vendor management
- `/dashboard/marketplace` - Platform settings
- `/dashboard/analytics` - Performance metrics

---

### 6.6 Church Suite

**Demo Tenant:** GraceLife Community Church  
**Personas:** Pastor, Admin, Ministry Leader, Finance, Member

#### Demo Data Available
- 45 registered members
- 10 church events
- 37 giving/donation records
- 57 attendance records

#### Step-by-Step Demo Flows

**Flow 1: Record Offering**
1. Login as `finance@demo-church.demo`
2. Navigate to Giving → Record Donation
3. Select member
4. Enter amount and category (tithe, offering, special)
5. Save record

**Flow 2: Mark Service Attendance**
1. Login as `admin@demo-church.demo`
2. Navigate to Attendance
3. Select service date
4. Mark members present
5. Submit count

**Flow 3: Plan Event**
1. Login as `ministry@demo-church.demo`
2. Navigate to Events → New Event
3. Enter event details
4. Assign ministry
5. Publish event

#### UI Routes
- `/dashboard/members` - Member directory
- `/dashboard/giving` - Donation tracking
- `/dashboard/attendance` - Service attendance
- `/dashboard/events` - Church calendar

---

### 6.7 Political Suite

**Demo Tenant:** Lagos Campaign HQ  
**Personas:** Manager, Official, Volunteer Coordinator, Field, Finance

#### Demo Data Available
- 8 registered members
- 6 campaign donations
- 6 campaign events
- 25+ volunteers

#### Step-by-Step Demo Flows

**Flow 1: Register Volunteer**
1. Login as `volunteers@demo-political.demo`
2. Navigate to Volunteers → Add New
3. Enter volunteer details
4. Assign to ward/LGA
5. Save record

**Flow 2: Record Donation**
1. Login as `finance@demo-political.demo`
2. Navigate to Donations
3. Record contribution
4. Issue acknowledgment

**Flow 3: Plan Campaign Event**
1. Login as `manager@demo-political.demo`
2. Navigate to Events
3. Create rally/town hall
4. Assign logistics

#### UI Routes
- `/dashboard/members` - Supporter database
- `/dashboard/volunteers` - Volunteer management
- `/dashboard/donations` - Campaign finance
- `/dashboard/events` - Campaign calendar

---

### 6.8 Real Estate Suite

**Demo Tenant:** Lagos Property Managers  
**Personas:** Owner, Manager, Tenant, Facility Manager

#### Demo Data Available
- 3 properties
- 10 rental units
- 6 active leases
- 8+ rent payment records

#### Step-by-Step Demo Flows

**Flow 1: Add Property & Units**
1. Login as `manager@demo-real-estate.demo`
2. Navigate to Properties → Add
3. Enter property details
4. Add units with rent amounts

**Flow 2: Tenant Onboarding**
1. Navigate to Tenants → Add
2. Enter tenant details
3. Assign to unit
4. Create lease agreement

**Flow 3: Record Rent Payment**
1. Navigate to Payments
2. Select tenant/unit
3. Record payment
4. Print receipt

**Flow 4: Maintenance Request**
1. Login as `tenant@demo-real-estate.demo`
2. Navigate to Maintenance
3. Submit request
4. Track status

#### UI Routes
- `/dashboard/properties` - Property management
- `/dashboard/units` - Unit listings
- `/dashboard/leases` - Lease tracking
- `/dashboard/payments` - Rent collection

---

### 6.9 Civic Suite

**Demo Tenant:** Lagos State Lands Bureau  
**Personas:** Director, Officer, Regulator, Inspector, Citizen

#### Demo Data Available
- 10 registered citizens
- 12 service cases
- 12 service requests

#### Step-by-Step Demo Flows

**Flow 1: Citizen Registration**
1. Login as `officer@demo-civic.demo`
2. Navigate to Citizens → Register
3. Verify ID documents
4. Create citizen profile

**Flow 2: Process Service Request**
1. Navigate to Requests
2. Select pending request
3. Review documents
4. Update status
5. Assign for inspection

**Flow 3: Citizen Portal**
1. Login as `citizen@demo-civic.demo`
2. View submitted requests
3. Check status
4. Download certificates

#### UI Routes
- `/dashboard/citizens` - Citizen registry
- `/dashboard/requests` - Service requests
- `/dashboard/cases` - Case management

---

### 6.10 Logistics Suite

**Demo Tenant:** Swift Logistics  
**Personas:** Owner, Dispatch, Driver, Rider, Customer Service

#### Demo Data Available
- 8 delivery agents
- 15+ shipments/assignments

#### Step-by-Step Demo Flows

**Flow 1: Create Shipment**
1. Login as `dispatch@demo-logistics.demo`
2. Navigate to Shipments → New
3. Enter pickup/delivery details
4. Calculate price
5. Assign driver

**Flow 2: Driver Accepts Job**
1. Login as `driver@demo-logistics.demo`
2. View assigned jobs
3. Accept/start delivery
4. Update status
5. Capture proof of delivery

**Flow 3: Track Shipment**
1. Login as `cs@demo-logistics.demo`
2. Search shipment ID
3. View real-time status
4. Contact driver if needed

#### UI Routes
- `/dashboard/shipments` - Shipment management
- `/dashboard/drivers` - Driver management
- `/dashboard/tracking` - Live tracking

---

## SECTION 7 — CROSS-SUITE DEMO FLOWS

### 7.1 Partner → Tenant Lifecycle

**Story:** Partner onboards a new client

1. **Partner Sales** (`demo.sales@webwaka.com`)
   - Logs into Partner Portal
   - Views existing demo tenants as reference
   - Explains tenant creation process

2. **Partner Admin** (`demo.admin@webwaka.com`)
   - Creates new tenant (show process)
   - Assigns suite capabilities
   - Invites tenant admin

3. **Tenant Admin** (demo tenant admin)
   - Receives invitation
   - Completes setup
   - Begins using suite

### 7.2 Commerce → Logistics Integration

**Story:** Retail store fulfills delivery order

1. **Lagos Retail Store** (`cashier@demo-retail-store.demo`)
   - Processes sale with delivery request
   - Creates delivery ticket

2. **Swift Logistics** (`dispatch@demo-logistics.demo`)
   - Receives delivery request
   - Assigns driver
   - Tracks delivery

### 7.3 Education → Parent Communication

**Story:** School communicates with parents

1. **Teacher** (`teacher@demo-school.demo`)
   - Marks attendance
   - Enters grades
   - Notes concern about student

2. **Principal** (`principal@demo-school.demo`)
   - Reviews class performance
   - Sends notification to parents

3. **Parent** (`parent@demo-school.demo`)
   - Views child's report
   - Sees attendance record

### 7.4 Hotel Guest Journey

**Story:** Complete hotel stay experience

1. **Reservation** (`frontdesk@demo-hotel.demo`)
   - Creates booking
   - Sends confirmation

2. **Check-In** (`frontdesk@demo-hotel.demo`)
   - Verifies guest
   - Assigns room
   - Opens folio

3. **During Stay** (`restaurant@demo-hotel.demo`)
   - Guest orders room service
   - Charges added to folio

4. **Housekeeping** (`housekeeping@demo-hotel.demo`)
   - Updates room status
   - Flags for inspection

5. **Check-Out** (`frontdesk@demo-hotel.demo`)
   - Presents final bill
   - Processes payment
   - Closes folio

---

## SECTION 8 — DEMO CONSTRAINTS & NOTES

### Known Demo Limitations

| Limitation | Explanation | Verbal Guidance |
|------------|-------------|-----------------|
| Magic link auth | Demo uses email OTP, not password | "In production, magic links are sent instantly via email/SMS" |
| No real SMS | OTPs logged to console | "Production integrates with Nigerian SMS providers" |
| No payment gateway | Payment amounts recorded, not processed | "Integrates with Paystack, Flutterwave in production" |
| Static demo data | Data doesn't accumulate | "Each demo starts fresh; production data persists" |
| Single partner | Only Demo Partner exists | "Real platform supports unlimited partners" |

### What to Explain Verbally

1. **Multi-tenancy**: "Each business gets their own isolated environment"
2. **Offline capability**: "POS works offline and syncs when connected"
3. **White-labeling**: "Partners can brand the platform for their clients"
4. **Nigerian context**: "Built for Nigerian businesses - Naira, local banks, Nigerian names"
5. **Scalability**: "Platform handles hundreds of tenants per partner"

### Intentionally Simplified Areas

- User permissions are broad (no granular permission UI in demo)
- Reporting is summary-level (detailed analytics coming soon)
- Integrations shown as placeholders (Paystack, Flutterwave, etc.)
- Some features are "Coming Soon" in demo

### Data Quality Notes

| Aspect | Demo Quality | Notes |
|--------|--------------|-------|
| Names | Realistic | Nigerian names appropriate to context |
| Amounts | Realistic | Naira amounts reflect actual Nigerian prices |
| Dates | Recent | Demo data dated within last 30 days |
| Phone numbers | Fictional | Nigerian format but not real |
| Emails | Functional | @demo domains, actual login works |

---

## SECTION 9 — QUICK-START CHEAT SHEET

### By Demo Audience

| If demoing for... | Start with... | Login as... |
|-------------------|---------------|-------------|
| **Partner prospects** | Partner Portal overview | `demo.owner@webwaka.com` |
| **Retail/POS business** | Lagos Retail Store | `manager@demo-retail-store.demo` |
| **School/Education** | Bright Future Academy | `principal@demo-school.demo` |
| **Healthcare/Clinic** | HealthFirst Clinic | `director@demo-clinic.demo` |
| **Hotel/Hospitality** | PalmView Suites Lagos | `gm@demo-hotel.demo` |
| **Logistics company** | Swift Logistics | `dispatch@demo-logistics.demo` |
| **Marketplace operator** | Naija Market Hub | `admin@demo-marketplace.demo` |
| **Church/Religious org** | GraceLife Community Church | `pastor@demo-church.demo` |
| **Political campaign** | Lagos Campaign HQ | `manager@demo-political.demo` |
| **Property manager** | Lagos Property Managers | `manager@demo-real-estate.demo` |
| **Government agency** | Lagos State Lands Bureau | `director@demo-civic.demo` |

### By Feature Focus

| If focusing on... | Show... | Key tenant |
|-------------------|---------|------------|
| **Point of Sale** | Opening shift, making sale | Lagos Retail Store |
| **Inventory** | Stock levels, categories | Lagos Retail Store |
| **Student management** | Attendance, grades | Bright Future Academy |
| **Patient records** | Encounters, prescriptions | HealthFirst Clinic |
| **Room booking** | Reservations, check-in | PalmView Suites Lagos |
| **Donation tracking** | Member giving, reports | GraceLife Community Church |
| **Volunteer management** | Volunteer registry | Lagos Campaign HQ |
| **Rent collection** | Payments, leases | Lagos Property Managers |
| **Service requests** | Citizen portal | Lagos State Lands Bureau |

### Partner-Focused Demo Flow

1. **Open**: Partner Portal as `demo.owner@webwaka.com`
2. **Show**: 16 demo tenants representing your future clients
3. **Explain**: Revenue sharing, white-labeling, support model
4. **Demo**: Pick 2-3 relevant tenants for prospect's industry
5. **Close**: "You could have 50+ clients like these within a year"

### Quick Login Reference

```
Partner Portal:     demo.owner@webwaka.com
Retail Demo:        manager@demo-retail-store.demo
School Demo:        principal@demo-school.demo
Clinic Demo:        director@demo-clinic.demo
Hotel Demo:         gm@demo-hotel.demo
Church Demo:        pastor@demo-church.demo
```

---

## DOCUMENT FOOTER

**Prepared for:** WebWaka Platform  
**Document Type:** Internal Reference  
**Classification:** Demo Use Only  
**Last Validated:** January 14, 2026

---

*This document is auto-generated from platform inspection. All credentials are for demo purposes only. Production environments will have different authentication and data.*
