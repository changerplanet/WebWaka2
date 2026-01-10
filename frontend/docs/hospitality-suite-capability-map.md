# Hospitality Suite - Capability Mapping Document

## S0: Context Confirmation ✅
## S1: Capability Mapping (Design Only - NO CODE)

---

## Suite Overview

**Target Customers:**
- Hotels & Guest Houses
- Short-let Apartments / Airbnb-style Rentals
- Restaurants & Bars
- Event Centers & Conference Venues
- Resorts & Lodges
- Spas & Wellness Centers
- Cafes & Quick-Service Restaurants
- Catering Services

**Key Capabilities Required:**
1. Guest/Customer Management
2. Room/Table/Space Inventory
3. Reservations & Bookings
4. Point of Sale (F&B, Services)
5. Housekeeping & Maintenance
6. Billing & Payments
7. Staff Management
8. Reports & Analytics

---

## Nigerian Hospitality Context

### Common Hospitality Businesses in Nigeria

| Business Type | Examples | Primary Revenue Model |
|---------------|----------|----------------------|
| **Budget Hotels** | Guest houses, motels | Nightly room rate |
| **Business Hotels** | City center hotels | Room + F&B + Conference |
| **Short-let Apartments** | Airbnb, serviced apartments | Daily/Weekly rental |
| **Restaurants** | Sit-down, fine dining | F&B sales |
| **Quick-Service** | Fast food, cafes | High-volume F&B |
| **Event Centers** | Conference halls, banquet | Space rental + catering |
| **Bars/Lounges** | Nightclubs, beer parlors | Drinks + entertainment |
| **Resorts** | Beach resorts, lodges | Room + Activities + F&B |

### Nigerian Hospitality Specifics

| Aspect | Nigerian Context |
|--------|------------------|
| **Payment Methods** | Cash-heavy, POS, Transfer, Mobile Money |
| **Pricing** | Naira (₦), often rounded to thousands |
| **Check-in** | ID verification required by law |
| **Guest Types** | Walk-ins common, corporate accounts |
| **F&B** | High margin, often separate profit center |
| **Staffing** | Shifts, tips, service charge (10%) |
| **Seasonality** | December peaks, low Jan-Feb |

---

## Capability Mapping Matrix

### 1. GUEST/CUSTOMER MANAGEMENT

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Guest Profiles | **CRM Contacts** | Configure contact type = "GUEST" | ✅ REUSE |
| Corporate Accounts | **CRM Contacts** | Configure contact type = "CORPORATE" | ✅ REUSE |
| Loyalty Programs | **CRM Loyalty** | Already exists in CRM module | ✅ REUSE |
| Guest Preferences | **CRM Contact metadata** | Store preferences in metadata | ✅ REUSE |
| ID Verification | **CRM Contact fields** | Store ID info in contact | ✅ REUSE |
| Guest History | **CRM Engagement** | Track stays/visits as engagements | ✅ REUSE |
| VIP Flagging | **CRM Tags/Segments** | Use tags for VIP, blacklist, etc. | ✅ REUSE |

**Verdict: 100% REUSE** - CRM module fully applicable

**Guest Metadata Schema:**
```json
{
  "contactType": "GUEST",
  "guestId": "GST-2025-0001",
  "idType": "NIN",
  "idNumber": "12345678901",
  "nationality": "Nigerian",
  "preferredRoom": "DELUXE",
  "dietaryRestrictions": ["Vegetarian"],
  "corporateAccountId": "corp_001",
  "loyaltyTier": "GOLD",
  "loyaltyPoints": 5000,
  "lifetimeValue": 850000,
  "lastVisit": "2025-01-01",
  "totalVisits": 12,
  "notes": "Prefers quiet room, early check-in"
}
```

---

### 2. ROOM/TABLE/SPACE INVENTORY

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Room Types | **Products** | Configure product type = "ROOM" | ✅ REUSE |
| Room Instances | **Inventory** | Track individual rooms as inventory items | ✅ REUSE |
| Room Status | **Inventory Status** | Available, Occupied, Maintenance, Cleaning | ⚠️ PARTIAL |
| Room Amenities | **Product Attributes** | Store amenities as product attributes | ✅ REUSE |
| Table Inventory | **Products + Inventory** | Configure for restaurant tables | ✅ REUSE |
| Event Spaces | **Products** | Configure as space/venue products | ✅ REUSE |
| Rate Management | **Product Pricing** | Configure seasonal/dynamic rates | ✅ REUSE |
| Availability Calendar | - | Visual availability view | 🔴 GAP (UI) |

**Verdict: 85% REUSE** - Products + Inventory with hospitality configuration

**Room Product Schema:**
```json
{
  "productType": "ROOM",
  "name": "Deluxe Room",
  "sku": "RM-DLX-001",
  "basePrice": 25000,
  "currency": "NGN",
  "attributes": {
    "roomType": "DELUXE",
    "bedType": "KING",
    "maxOccupancy": 2,
    "floor": 3,
    "view": "POOL",
    "amenities": ["AC", "TV", "WiFi", "Minibar", "Safe"]
  },
  "inventory": {
    "totalRooms": 10,
    "availableTonight": 7
  }
}
```

**Room Status States:**
- `AVAILABLE` - Ready for check-in
- `OCCUPIED` - Currently in use
- `RESERVED` - Booked but not checked in
- `CLEANING` - Housekeeping in progress
- `MAINTENANCE` - Out of service
- `BLOCKED` - Administratively blocked

---

### 3. RESERVATIONS & BOOKINGS

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Reservation Records | **Orders** | Configure order type = "RESERVATION" | ⚠️ PARTIAL |
| Booking Creation | **Order Creation** | Create order with future start date | ⚠️ PARTIAL |
| Guest Selection | **Customer on Order** | Link to CRM Contact | ✅ REUSE |
| Date Range Selection | - | Check-in/Check-out dates | 🔴 GAP (SERVICE) |
| Availability Check | - | Query room availability for dates | 🔴 GAP (SERVICE) |
| Reservation Status | **Order Status** | Confirmed, Checked-in, Checked-out, Cancelled, No-show | ⚠️ PARTIAL |
| Deposit/Prepayment | **Payments** | Partial payment on order | ✅ REUSE |
| Confirmation Email/SMS | **CRM Campaigns** | Automated confirmation | ✅ REUSE |
| Walk-in Check-in | **POS Quick Sale** | Immediate reservation + check-in | ✅ REUSE |
| Group Bookings | **Orders with multiple items** | Multiple rooms on one order | ✅ REUSE |

**Verdict: 60% REUSE** - Requires new reservation service

**Reservation Metadata Schema:**
```json
{
  "orderType": "RESERVATION",
  "reservationNumber": "RES-2025-0001",
  "guestId": "guest_001",
  "roomId": "room_dlx_001",
  "roomType": "DELUXE",
  "checkInDate": "2025-01-15",
  "checkOutDate": "2025-01-17",
  "nights": 2,
  "adults": 2,
  "children": 0,
  "ratePerNight": 25000,
  "totalAmount": 50000,
  "depositPaid": 25000,
  "status": "CONFIRMED",
  "source": "WALK_IN",
  "specialRequests": "Late check-out requested",
  "arrivalTime": "14:00"
}
```

---

### 4. POINT OF SALE (F&B, Services)

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Menu Items | **Products** | Configure as F&B products | ✅ REUSE |
| Menu Categories | **Product Categories** | Starters, Mains, Drinks, Desserts | ✅ REUSE |
| Order Taking | **POS** | Already exists | ✅ REUSE |
| Table Assignment | **POS Order metadata** | Store table number in order | ✅ REUSE |
| Kitchen Display | - | Order queue for kitchen | 🔴 GAP (UI) |
| Bill Splitting | **POS** | Already supported | ✅ REUSE |
| Service Charge | **Order Add-ons** | Configure as automatic % | ✅ REUSE |
| Room Charge | **Order metadata** | Post to guest folio | ⚠️ PARTIAL |
| Bar Tab | **Orders** | Open order for bar service | ✅ REUSE |
| Waiter Assignment | **POS + HR** | Assign staff to orders | ✅ REUSE |

**Verdict: 85% REUSE** - POS module with hospitality configuration

---

### 5. HOUSEKEEPING & MAINTENANCE

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Room Status Board | - | Visual room status grid | 🔴 GAP (UI) |
| Cleaning Tasks | **CRM Engagement** | Configure as task type = "HOUSEKEEPING" | ⚠️ PARTIAL |
| Task Assignment | **HR Staff** | Assign to housekeeping staff | ✅ REUSE |
| Task Completion | **Engagement Status** | Track task progress | ✅ REUSE |
| Maintenance Requests | **CRM Engagement** | Configure as task type = "MAINTENANCE" | ✅ REUSE |
| Minibar Tracking | **Inventory** | Track minibar items | ✅ REUSE |
| Lost & Found | **CRM Engagement** | Configure as engagement type | ✅ REUSE |
| Inspection Checklists | - | Room inspection forms | 🔴 GAP (SERVICE) |

**Verdict: 65% REUSE** - CRM Engagement + HR with housekeeping service

**Housekeeping Task Schema:**
```json
{
  "engagementType": "HOUSEKEEPING",
  "taskId": "HK-2025-0001",
  "roomId": "room_101",
  "roomNumber": "101",
  "taskType": "CHECKOUT_CLEAN",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "assignedTo": "staff_hk_001",
  "scheduledTime": "10:00",
  "startedAt": "10:15",
  "completedAt": null,
  "inspectedBy": null,
  "notes": "Extra deep clean requested"
}
```

---

### 6. BILLING & PAYMENTS

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Guest Folio | **Invoice** | Track all charges for a stay | ✅ REUSE |
| Room Charges | **Invoice Line Items** | Daily room rate posting | ✅ REUSE |
| F&B Charges | **Invoice Line Items** | Post restaurant/bar charges | ✅ REUSE |
| Service Charges | **Invoice Add-ons** | Automatic service fee | ✅ REUSE |
| Deposits | **Payments** | Track partial payments | ✅ REUSE |
| Multiple Payments | **Payments** | Split payment methods | ✅ REUSE |
| Refunds | **Payments** | Process refunds | ✅ REUSE |
| Corporate Billing | **Invoice** | Bill to company, not guest | ✅ REUSE |
| Receipts | **Invoice/Receipt** | Already exists | ✅ REUSE |
| Daily Revenue Report | **Analytics** | Already exists | ✅ REUSE |

**Verdict: 100% REUSE** - Billing/Payments/Invoice fully applicable

---

### 7. STAFF MANAGEMENT

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Employee Profiles | **HR Staff** | Already exists | ✅ REUSE |
| Departments | **HR Departments** | Front Desk, Housekeeping, F&B, etc. | ✅ REUSE |
| Shift Scheduling | **HR Scheduling** | Already exists | ✅ REUSE |
| Attendance | **HR Attendance** | Clock in/out | ✅ REUSE |
| Tips Tracking | - | Track service charge distribution | 🔴 GAP (SERVICE) |
| Performance | **HR Performance** | Reviews and ratings | ✅ REUSE |

**Verdict: 90% REUSE** - HR module fully applicable

---

### 8. REPORTS & ANALYTICS

| Hospitality Need | Existing Capability | Reuse Strategy | Gap? |
|------------------|---------------------|----------------|------|
| Occupancy Report | **Analytics** | Daily/weekly occupancy % | ✅ REUSE |
| Revenue Report | **Analytics** | Room + F&B + Other revenue | ✅ REUSE |
| Guest Analysis | **CRM Analytics** | Guest demographics, repeat rate | ✅ REUSE |
| F&B Performance | **POS Reports** | Sales by category, item | ✅ REUSE |
| Staff Performance | **HR Reports** | Productivity metrics | ✅ REUSE |
| ADR (Avg Daily Rate) | **Analytics** | Revenue per available room | ⚠️ PARTIAL |
| RevPAR | **Analytics** | Revenue metric | ⚠️ PARTIAL |

**Verdict: 85% REUSE** - Analytics with hospitality KPIs

---

## Summary: Capability Reuse Analysis

| Capability Area | Reuse % | Primary Module | Notes |
|-----------------|---------|----------------|-------|
| Guest Management | 100% | CRM | Contact type configuration |
| Room/Space Inventory | 85% | Products + Inventory | Product type configuration |
| Reservations & Bookings | 60% | Orders + NEW Service | Reservation service needed |
| Point of Sale | 85% | POS | F&B configuration |
| Housekeeping | 65% | CRM Engagement + HR | Housekeeping service needed |
| Billing & Payments | 100% | Billing + Payments | Already complete |
| Staff Management | 90% | HR | Already complete |
| Reports & Analytics | 85% | Analytics | Hospitality KPIs needed |

**Overall Reuse: ~84%**

---

## Gap Register

### GAP-HOSP-001: Reservation Service

**Description:** Orders model doesn't natively handle date-range bookings with availability checks.

**Proposed Solution (Design Only):**
- Create `hospitality/reservation-service.ts` - Business logic only
- Store reservations in tenant-scoped in-memory storage (demo)
- Check availability before booking
- Link to Products (rooms) and CRM (guests)

**Data Model Approach (NO SCHEMA CHANGES):**
```typescript
interface Reservation {
  id: string;
  tenantId: string;
  reservationNumber: string;
  guestId: string;  // CRM Contact ID
  guestName: string;
  roomId: string;   // Product ID
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  ratePerNight: number;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  status: ReservationStatus;
  source: 'WALK_IN' | 'PHONE' | 'WEBSITE' | 'OTA' | 'CORPORATE';
  specialRequests?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  createdAt: string;
  updatedAt: string;
}

type ReservationStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';
```

**Core Impact:** NONE - In-memory demo storage

---

### GAP-HOSP-002: Housekeeping Service

**Description:** Need workflow for room cleaning tasks and status management.

**Proposed Solution (Design Only):**
- Create `hospitality/housekeeping-service.ts` - Business logic only
- Track room cleaning status and tasks
- Link to HR for staff assignment

**Data Model Approach (NO SCHEMA CHANGES):**
```typescript
interface HousekeepingTask {
  id: string;
  tenantId: string;
  roomId: string;
  roomNumber: string;
  taskType: 'CHECKOUT_CLEAN' | 'STAY_OVER' | 'DEEP_CLEAN' | 'TURNDOWN' | 'INSPECTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INSPECTED';
  assignedTo?: string;
  scheduledTime: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface RoomStatus {
  roomId: string;
  roomNumber: string;
  occupancyStatus: 'VACANT' | 'OCCUPIED' | 'DUE_OUT' | 'DUE_IN';
  cleaningStatus: 'CLEAN' | 'DIRTY' | 'INSPECTED' | 'OUT_OF_ORDER';
  currentGuest?: string;
  checkOutTime?: string;
  nextReservation?: string;
}
```

**Core Impact:** NONE - In-memory demo storage

---

### GAP-HOSP-003: Availability Calendar UI

**Description:** Visual calendar showing room availability by date.

**Proposed Solution (Design Only):**
- Create calendar UI component
- Query reservation service for date range
- Color-coded availability display

**Core Impact:** NONE - UI component only

---

### GAP-HOSP-004: Room Charge Posting

**Description:** Mechanism to post F&B charges to guest room/folio.

**Proposed Solution (Design Only):**
- Extend POS to allow "Charge to Room" payment method
- Link POS order to active reservation
- Accumulate charges on guest folio

**Core Impact:** NONE - Business logic extension

---

## Core Impact Assessment

| Question | Answer |
|----------|--------|
| New database tables required? | **NO** |
| Schema changes to existing tables? | **NO** |
| New Core primitives required? | **NO** |
| Cross-suite data dependencies? | **NO** |
| Partner-First compliance? | **YES** |

### Detailed Assessment:

1. **CRM Module Extension**
   - Add hospitality-specific contact types: GUEST, CORPORATE
   - Store guest preferences in existing `metadata` JSON field
   - **Impact: NONE** - Configuration only

2. **Products Module Extension**
   - Configure product types: ROOM, TABLE, SPACE, MENU_ITEM
   - Store hospitality attributes in product metadata
   - **Impact: NONE** - Data configuration only

3. **Inventory Module Extension**
   - Track individual rooms/tables as inventory items
   - Add hospitality-specific status values
   - **Impact: NONE** - Configuration only

4. **POS Module Extension**
   - Configure for restaurant/bar operations
   - Add table number to order metadata
   - **Impact: NONE** - Configuration only

5. **HR Module Extension**
   - Configure hospitality departments
   - Enable shift scheduling
   - **Impact: NONE** - Already supported

6. **New Services Required**
   - `hospitality/config.ts` - Labels, constants, enums
   - `hospitality/reservation-service.ts` - Booking management
   - `hospitality/room-service.ts` - Room inventory and status
   - `hospitality/housekeeping-service.ts` - Cleaning workflows
   - `hospitality/folio-service.ts` - Guest billing accumulator
   - **Impact: NONE** - New code, no schema changes

---

## What Will NOT Be Built

1. ❌ Custom reservation database table
2. ❌ Channel manager / OTA integrations (Booking.com, Expedia)
3. ❌ Revenue management / yield optimization
4. ❌ Property management system (PMS) migration tools
5. ❌ Key card / lock integrations
6. ❌ In-room entertainment control
7. ❌ Complex rate structures (BAR, corporate rates, packages)
8. ❌ Multi-property management
9. ❌ Online booking engine (external website)
10. ❌ Guest mobile app

---

## What Will Be Reused

1. ✅ **CRM Module** - Guest profiles, corporate accounts, loyalty
2. ✅ **Products Module** - Room types, menu items, services
3. ✅ **Inventory Module** - Room availability tracking
4. ✅ **POS Module** - Restaurant/bar sales
5. ✅ **Orders Module** - Base for reservations
6. ✅ **Billing Module** - Guest folios, invoicing
7. ✅ **Payments Module** - All payment methods
8. ✅ **HR Module** - Staff, shifts, departments
9. ✅ **Analytics Module** - Reports and dashboards
10. ✅ **CRM Campaigns** - Guest communications
11. ✅ **Capability Framework** - Module activation
12. ✅ **Partner-First Model** - Activation flow

---

## Architecture: Hospitality Suite Composition

```
┌─────────────────────────────────────────────────────────────┐
│                    HOSPITALITY SUITE                        │
│           (Hotel/Restaurant Management Solution)            │
└─────────────────────────────────────────────────────────────┘
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────────┐  ┌───────┐  ┌─────────┐
│  CRM  │  │Product│  │    POS    │  │Billing│  │   NEW   │
│       │  │+ Inv  │  │           │  │       │  │Services │
│Guests │  │ Rooms │  │   F&B     │  │ Folio │  │Reserv.  │
│Corp.  │  │Tables │  │  Sales    │  │Invoice│  │Housekp. │
└───────┘  └───────┘  └───────────┘  └───────┘  └─────────┘
    │           │           │           │           │
    └───────────┴───────────┴───────────┴───────────┘
                            │
              ┌─────────────┴─────────────┐
              │      HR + Analytics       │
              │  (Staff, Shifts, Reports) │
              └───────────────────────────┘
```

---

## Nigerian Hospitality Use Cases

### Use Case 1: Budget Hotel / Guest House

**Scenario:** Peace Hotel, Ikeja - 30-room guest house

| Function | Implementation |
|----------|----------------|
| Guest Check-in | CRM Contact + Reservation |
| Room Booking | Reservation service |
| Room Status | Housekeeping service |
| Payment | Billing + Payments (cash/POS/transfer) |
| Daily Report | Analytics (occupancy, revenue) |

### Use Case 2: Restaurant

**Scenario:** Mama Put's Kitchen - Sit-down restaurant

| Function | Implementation |
|----------|----------------|
| Menu Management | Products (MENU_ITEM type) |
| Order Taking | POS with table assignment |
| Kitchen Queue | Order status workflow |
| Bill Payment | POS checkout |
| Staff Tips | Service charge tracking |

### Use Case 3: Event Center

**Scenario:** Grand Ballroom - Conference/banquet venue

| Function | Implementation |
|----------|----------------|
| Space Inventory | Products (SPACE type) |
| Event Booking | Reservation service (date range) |
| Catering | POS for F&B add-ons |
| Corporate Billing | Invoice to company |
| Staff Assignment | HR scheduling |

### Use Case 4: Short-let Apartment

**Scenario:** Lagos Luxury Apartments - 10-unit serviced apartments

| Function | Implementation |
|----------|----------------|
| Unit Profiles | Products (ROOM type) |
| Daily/Weekly Booking | Reservation service |
| Guest Verification | CRM Contact with ID |
| Cleaning Schedule | Housekeeping service |
| Revenue Collection | Billing + Payments |

---

## Recommended Next Steps (S2-S5)

**S2: Core Services**
- Create `hospitality/config.ts` - Labels, constants, enums
- Create `hospitality/room-service.ts` - Room inventory and status
- Create `hospitality/reservation-service.ts` - Booking management
- Create `hospitality/housekeeping-service.ts` - Cleaning workflows
- Create `hospitality/folio-service.ts` - Guest billing accumulator
- Create `hospitality/demo-data.ts` - Demo hotel data

**S3: API Routes**
- `/api/hospitality` - Suite configuration
- `/api/hospitality/rooms` - Room inventory CRUD
- `/api/hospitality/reservations` - Booking management
- `/api/hospitality/housekeeping` - Task management
- `/api/hospitality/guests` - Guest management (wraps CRM)
- `/api/hospitality/folio` - Guest billing

**S4: UI Pages**
- Hospitality Admin Dashboard
- Room Grid / Availability View
- Reservations List & Calendar
- Front Desk (Check-in/Check-out)
- Housekeeping Board
- Restaurant POS (F&B)

**S5: Demo Data & Documentation**
- Demo hotel with rooms, reservations, guests
- Partner implementation guide

---

## Sign-off

| Item | Status |
|------|--------|
| Capability mapping complete | ✅ |
| Gap register documented | ✅ |
| Core impact assessment: NO CHANGES | ✅ |
| Partner-First compliance | ✅ |
| Ready for S2 (Services) | ✅ |

---

*Document Version: 1.0*
*Created: January 2026*
*Phase: S0-S1 Complete*
