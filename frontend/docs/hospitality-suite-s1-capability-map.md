# Hospitality Suite — S1 Capability Map

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S1 — Capability Mapping  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document defines the capability structure, entity relationships, and API surface for the Hospitality Suite under Platform Standardisation v2.

---

## 🔐 Capability Registration

```typescript
// /lib/capabilities/registry.ts
{
  key: 'hospitality',
  name: 'Hospitality Suite',
  description: 'Restaurant, hotel, and guest service operations',
  category: 'vertical',
  dependencies: ['billing', 'payments'],
  isCore: false
}
```

---

## 📦 Capability Categories

### 1. Venue & Layout
| Capability | Description |
|------------|-------------|
| `hospitality.venues` | Manage venues (hotels, restaurants) |
| `hospitality.floors` | Floor/area organization |
| `hospitality.tables` | Table management with capacity |
| `hospitality.rooms` | Room management with types, amenities |
| `hospitality.stations` | Service stations (kitchen, bar, housekeeping) |

### 2. Guest Management
| Capability | Description |
|------------|-------------|
| `hospitality.guests` | Guest profiles (operational, not CRM) |
| `hospitality.visits` | Restaurant guest visits |
| `hospitality.stays` | Hotel guest stays |
| `hospitality.preferences` | Guest preferences |

### 3. Reservations
| Capability | Description |
|------------|-------------|
| `hospitality.reservations.table` | Table bookings |
| `hospitality.reservations.room` | Room bookings |
| `hospitality.waitlist` | Queue management |
| `hospitality.noshow` | No-show tracking |

### 4. Orders & Service
| Capability | Description |
|------------|-------------|
| `hospitality.orders` | Food/beverage orders |
| `hospitality.room-service` | In-room dining |
| `hospitality.service-requests` | Housekeeping, maintenance |
| `hospitality.kitchen` | Kitchen order management |

### 5. Stay Lifecycle
| Capability | Description |
|------------|-------------|
| `hospitality.checkin` | Guest arrival |
| `hospitality.checkout` | Guest departure |
| `hospitality.extensions` | Stay modifications |
| `hospitality.room-status` | Room state management |

### 6. Staff & Shifts
| Capability | Description |
|------------|-------------|
| `hospitality.staff` | Staff profiles |
| `hospitality.shifts` | Shift management |
| `hospitality.duty` | Active duty tracking |
| `hospitality.assignments` | Table/room assignments |

### 7. Billing Facts
| Capability | Description |
|------------|-------------|
| `hospitality.billing-facts` | Charge facts emission |
| `hospitality.charges` | Service charge tracking |
| **Never**: Invoice creation, payment recording |

### 8. Reporting
| Capability | Description |
|------------|-------------|
| `hospitality.reports.occupancy` | Room occupancy |
| `hospitality.reports.covers` | Meal covers |
| `hospitality.reports.revenue` | Revenue metrics |
| `hospitality.reports.service` | Service performance |

---

## 🗃️ Entity Relationships

```
Venue (Hotel/Restaurant)
├── Floors/Areas
│   ├── Tables (capacity, status)
│   └── Rooms (type, amenities, rate)
├── Staff
│   ├── Shifts
│   └── Assignments
├── Guests
│   ├── Visits (restaurant)
│   │   └── Orders
│   │       └── Order Items
│   │           └── Billing Facts
│   └── Stays (hotel)
│       ├── Room Assignment
│       ├── Service Requests
│       └── Billing Facts
└── Reservations
    ├── Table Reservations
    └── Room Reservations
```

---

## 🔌 API Surface

### Venue & Layout

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/venues` | GET, POST, PATCH | Venue CRUD |
| `/api/hospitality/floors` | GET, POST, PATCH | Floor management |
| `/api/hospitality/tables` | GET, POST, PATCH | Table management |
| `/api/hospitality/rooms` | GET, POST, PATCH | Room management |
| `/api/hospitality/stations` | GET, POST, PATCH | Service stations |

### Guest Management

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/guests` | GET, POST, PATCH | Guest profiles |
| `/api/hospitality/visits` | GET, POST, PATCH | Restaurant visits |
| `/api/hospitality/stays` | GET, POST, PATCH | Hotel stays |

### Reservations

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/reservations/tables` | GET, POST, PATCH | Table reservations |
| `/api/hospitality/reservations/rooms` | GET, POST, PATCH | Room reservations |
| `/api/hospitality/waitlist` | GET, POST, PATCH | Waitlist management |

### Orders & Service

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/orders` | GET, POST, PATCH | Food orders |
| `/api/hospitality/room-service` | GET, POST, PATCH | Room service orders |
| `/api/hospitality/service-requests` | GET, POST, PATCH | Service requests |
| `/api/hospitality/kitchen` | GET, PATCH | Kitchen display |

### Stay Lifecycle

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/checkin` | POST | Guest check-in |
| `/api/hospitality/checkout` | POST | Guest check-out |
| `/api/hospitality/room-status` | GET, PATCH | Room status |

### Staff & Shifts

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/staff` | GET, POST, PATCH | Staff profiles |
| `/api/hospitality/shifts` | GET, POST, PATCH | Shift management |
| `/api/hospitality/duty` | GET, POST | Active duty |

### Billing Facts

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/billing-facts` | GET, POST, PATCH | Billing facts |

### Demo

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/hospitality/demo` | POST | Seed/clear demo data |

---

## 💰 Commerce Reuse Boundary (MANDATORY)

```
Hospitality [Charge Facts] 
    → Billing [Invoice] 
        → Payments 
            → Accounting
```

### Billing Facts Emitted

| Fact Type | Description | Example |
|-----------|-------------|---------|
| `ROOM_NIGHT` | Nightly room charge | ₦25,000/night |
| `FOOD_BEVERAGE` | Restaurant charges | Jollof Rice ₦3,500 |
| `ROOM_SERVICE` | In-room dining | Room Service ₦5,000 |
| `SERVICE_CHARGE` | Service fees | Service 10% |
| `MINIBAR` | Minibar consumption | Drinks ₦2,000 |
| `LAUNDRY` | Laundry services | Laundry ₦3,000 |
| `PARKING` | Parking charges | Parking ₦1,000/day |

### Hospitality NEVER:
- ❌ Calculates VAT (7.5% — done by Billing)
- ❌ Records payments
- ❌ Creates journal entries
- ❌ Issues invoices

---

## 🎭 Demo & Narrative Intent

### Demo Route
```
/hospitality-demo
```

### Proposed Quick Start Roles

| Role | URL | Storyline Focus |
|------|-----|-----------------|
| Owner | `?quickstart=owner` | End-to-end operations |
| Manager | `?quickstart=manager` | Day-to-day management |
| Guest | `?quickstart=guest` | Customer experience |
| Auditor | `?quickstart=auditor` | Compliance & traceability |

### Storyline Themes

**Owner / Operator**
> "From guest arrival to revenue clarity"

- Venue setup → Reservations → Service → Billing facts → Commerce

**Operations Manager**
> "High-volume service without chaos"

- Shift management → Table/room assignment → Order flow → Service delivery

**Guest / Customer**
> "Know what you're paying for"

- Reservation → Check-in → Service → Transparent billing

**Regulator / Auditor**
> "Every charge traceable, every payment accountable"

- Audit trail → Billing facts → Commerce boundary → Accounting

---

## 🇳🇬 Nigeria-First API Design

### Venue Types
```typescript
enum HospitalityVenueType {
  RESTAURANT
  HOTEL
  GUEST_HOUSE
  SHORT_LET
  CAFE
  BAR
  LOUNGE
  BEACH_RESORT
  EVENT_CENTER
}
```

### Room Types
```typescript
enum HospitalityRoomType {
  STANDARD
  DELUXE
  EXECUTIVE
  SUITE
  PRESIDENTIAL
  STUDIO
  APARTMENT
}
```

### Order Status
```typescript
enum HospitalityOrderStatus {
  PLACED
  CONFIRMED
  PREPARING
  READY
  SERVED
  CANCELLED
}
```

### Stay Status
```typescript
enum HospitalityStayStatus {
  RESERVED
  CHECKED_IN
  IN_HOUSE
  CHECKED_OUT
  NO_SHOW
  CANCELLED
}
```

### Room Status
```typescript
enum HospitalityRoomStatus {
  AVAILABLE
  OCCUPIED
  DIRTY
  CLEANING
  MAINTENANCE
  OUT_OF_ORDER
}
```

---

## 📋 S1 Checklist

| Requirement | Status |
|-------------|--------|
| Capability registered | ✅ Defined |
| Entity relationships mapped | ✅ Documented |
| API surface defined | ✅ 20+ endpoints |
| Commerce boundary explicit | ✅ Facts only |
| Demo intent declared | ✅ 4 roles |
| Nigeria-first types | ✅ Enums defined |
| Schema | ❌ Not created (S2) |
| Services | ❌ Not created (S2) |
| APIs | ❌ Not created (S3) |

---

## 🛑 Phase Boundaries

This is **analysis and intent only**.

| What | S1 Status |
|------|-----------|
| Capability structure | ✅ Defined |
| API surface | ✅ Mapped |
| Entity relationships | ✅ Documented |
| Commerce reuse | ✅ Explicit |
| Schema creation | ❌ S2 |
| Service implementation | ❌ S2 |
| API implementation | ❌ S3 |
| Demo UI | ❌ S4 |
| Narrative wiring | ❌ S5 |

---

*This document follows Platform Standardisation v2 requirements.*
