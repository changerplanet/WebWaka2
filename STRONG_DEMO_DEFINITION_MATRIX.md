# Strong Demo Definition Matrix

**Phase:** D7.1  
**Purpose:** Define objective criteria for "strong demoable" status per suite  
**Date:** January 14, 2026

---

## Definition: Strong Demo (🟢)

A suite is **Strong Demo** when:
- A salesperson can walk through it without apologies or explanations
- All core screens show meaningful, realistic data
- At least one complete workflow can be demonstrated end-to-end
- Data reflects Nigerian business context where applicable
- No empty states appear for primary demo personas

---

## Suite-by-Suite Strong Demo Requirements

### 1. Commerce / POS

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Store Manager / Cashier |
| **Secondary Persona** | Store Owner |
| **Core Workflows** | 1) Open shift → Ring up sale → Close shift 2) View sales report |
| **Required Screens** | Products list, POS terminal, Shift summary, Sales report |
| **Minimum Data** | 20+ products, 2+ shifts, 15+ sales with items |
| **Current Status** | ✅ Already Strong |

---

### 2. Online Store (SVM)

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | End Customer |
| **Secondary Persona** | Store Admin |
| **Core Workflows** | 1) Browse → Add to cart → Place order 2) View order history |
| **Required Screens** | Product catalog, Product detail, Cart, Order confirmation, Order history |
| **Minimum Data** | 20+ products, 5+ orders with line items, 3+ customers |
| **Current Status** | 🟡 Needs orders/cart data |

---

### 3. Marketplace (MVM)

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Marketplace Admin |
| **Secondary Persona** | Vendor |
| **Core Workflows** | 1) Vendor onboarding → Product listing 2) Order → Commission → Payout |
| **Required Screens** | Vendor list, Vendor dashboard, Order splits, Commission report, Payout history |
| **Minimum Data** | 5+ vendors, 10+ products mapped, 5+ orders with sub-orders, 3+ payouts |
| **Current Status** | 🟡 Needs orders/payouts |

---

### 4. Education

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | School Administrator |
| **Secondary Persona** | Teacher |
| **Core Workflows** | 1) Enroll student → Assign class → Record attendance 2) Record grades → Generate report card |
| **Required Screens** | Student list, Class roster, Attendance sheet, Gradebook, Report card |
| **Minimum Data** | 30+ students, 10+ staff, 5+ classes, 100+ attendance records, 50+ grades |
| **Current Status** | 🟡 Needs attendance/grades data |

---

### 5. Health

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Doctor / Clinician |
| **Secondary Persona** | Front Desk |
| **Core Workflows** | 1) Patient check-in → Appointment → Encounter → Prescription 2) View patient history |
| **Required Screens** | Patient list, Appointment calendar, Encounter form, Prescription pad, Patient history |
| **Minimum Data** | 15+ patients, 10+ appointments, 10+ encounters, 15+ prescriptions |
| **Current Status** | 🟡 Needs encounters/prescriptions |

---

### 6. Hospitality

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Front Desk Agent |
| **Secondary Persona** | Hotel Manager |
| **Core Workflows** | 1) Reservation → Check-in → Stay → Check-out 2) Room availability overview |
| **Required Screens** | Room grid, Reservation list, Guest profile, Check-in form, Billing summary |
| **Minimum Data** | 10+ rooms, 8+ guests, 8+ reservations (mix of upcoming/past), 5+ stays |
| **Current Status** | 🟡 Needs reservations/stays |

---

### 7. Civic

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Case Officer |
| **Secondary Persona** | Citizen (portal view) |
| **Core Workflows** | 1) Citizen request → Case created → Processing → Resolution 2) Case status lookup |
| **Required Screens** | Citizen registry, Service catalog, Case queue, Case detail, Resolution history |
| **Minimum Data** | 10+ citizens, 8+ services, 10+ cases (various statuses), 5+ resolutions |
| **Current Status** | 🟡 Needs cases |

---

### 8. Logistics

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Dispatch Manager |
| **Secondary Persona** | Driver |
| **Core Workflows** | 1) Create shipment → Assign driver → Track delivery → Confirm POD 2) Driver route view |
| **Required Screens** | Shipment list, Assignment board, Driver dashboard, Tracking map, POD gallery |
| **Minimum Data** | 8+ agents, 8+ zones, 10+ shipments, 10+ assignments |
| **Current Status** | 🟡 Needs shipments/assignments |

---

### 9. Real Estate

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Property Manager |
| **Secondary Persona** | Landlord |
| **Core Workflows** | 1) List property → Lease signing → Rent collection 2) Tenant communication |
| **Required Screens** | Property portfolio, Unit list, Lease management, Payment tracker, Tenant directory |
| **Minimum Data** | 3+ properties, 10+ units, 6+ leases, 10+ payments |
| **Current Status** | 🟢 Already Strong (needs payment verification) |

---

### 10. Church

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Church Administrator |
| **Secondary Persona** | Pastor |
| **Core Workflows** | 1) Member registration → Group assignment → Event attendance 2) Donation tracking |
| **Required Screens** | Member directory, Group list, Event calendar, Attendance sheet, Giving report |
| **Minimum Data** | 30+ members, 5+ groups, 5+ events, 50+ attendance records, 20+ donations |
| **Current Status** | 🔴 Needs all data |

---

### 11. Political

| Attribute | Definition |
|-----------|------------|
| **Primary Persona** | Campaign Manager |
| **Secondary Persona** | Volunteer Coordinator |
| **Core Workflows** | 1) Volunteer signup → Event assignment → Canvassing 2) Donation tracking |
| **Required Screens** | Volunteer roster, Event schedule, Canvass map, Donation dashboard, Expense report |
| **Minimum Data** | 30+ members, 20+ volunteers, 5+ events, 20+ donations |
| **Current Status** | 🔴 Needs all data |

---

## Summary: Data Reinforcement Required

| Suite | Status | Reinforcement Needed |
|-------|--------|---------------------|
| Commerce/POS | ✅ Done | None |
| Online Store (SVM) | 🟡 Partial | Orders, carts |
| Marketplace (MVM) | 🟡 Partial | Parent orders, sub-orders, payouts |
| Education | 🟡 Partial | Attendance, grades/results |
| Health | 🟡 Partial | Encounters, prescriptions |
| Hospitality | 🟡 Partial | Reservations, stays |
| Civic | 🟡 Partial | Cases with lifecycle |
| Logistics | 🟡 Partial | Shipments, assignments |
| Real Estate | 🟢 Near-Done | Verify payments exist |
| Church | 🔴 Empty | Members, groups, events, donations |
| Political | 🔴 Empty | Members, volunteers, events, donations |

---

*Matrix Complete - Proceeding to D7.2*
