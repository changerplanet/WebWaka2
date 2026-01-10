# Hospitality Suite — S2 Schema

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S2 — Schema  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the Prisma schema for the Hospitality Suite, implementing Nigeria-first hotel and restaurant operations.

---

## 📊 Schema Summary

| Category | Models | Enums |
|----------|--------|-------|
| Configuration | 1 | 0 |
| Venue & Layout | 4 | 3 |
| Guest | 1 | 0 |
| Reservations | 1 | 2 |
| Stays | 1 | 1 |
| Orders | 2 | 4 |
| Service Events | 1 | 2 |
| Staff & Shifts | 2 | 3 |
| Billing Facts | 1 | 2 |
| **Total** | **14** | **17** |

---

## 🗃️ Models

### Configuration

#### `hospitality_config`
Tenant-level hospitality settings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `tenantId` | String | Unique tenant identifier |
| `venueName` | String? | Default venue name |
| `venueType` | HospitalityVenueType? | Default venue type |
| `guestIdPrefix` | String | Guest ID prefix (default: GST) |
| `reservationPrefix` | String | Reservation number prefix |
| `orderPrefix` | String | Order number prefix |
| `stayNumberPrefix` | String | Stay number prefix |
| `defaultTableReservationDuration` | Int | Minutes (default: 120) |
| `defaultCheckInTime` | String | Check-in time (default: 14:00) |
| `defaultCheckOutTime` | String | Check-out time (default: 12:00) |
| `allowWalkIns` | Boolean | Allow walk-ins (default: true) |
| `defaultServiceChargePercent` | Int | Service charge % (default: 10) |
| `autoAddServiceCharge` | Boolean | Auto-add service charge |
| `allowSplitBills` | Boolean | Allow split bills (default: true) |
| `autoCreateChargeFacts` | Boolean | Auto-create billing facts |

---

### Venue & Layout

#### `hospitality_venue`
Hotels, restaurants, and other hospitality venues.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `tenantId` | String | Tenant identifier |
| `name` | String | Venue name |
| `code` | String? | Unique code |
| `type` | HospitalityVenueType | RESTAURANT, HOTEL, etc. |
| `phone` | String? | Contact phone |
| `email` | String? | Contact email |
| `address` | Json? | Address details |
| `operatingHours` | Json? | Operating hours by day |
| `totalTables` | Int | Table count |
| `totalRooms` | Int | Room count |
| `totalSeats` | Int | Total seating capacity |

#### `hospitality_floor`
Floor/area organization within venues.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `venueId` | String | Parent venue |
| `name` | String | Floor name (e.g., "VIP Section") |
| `code` | String? | Floor code |
| `floorNumber` | Int? | Numeric floor level |

#### `hospitality_table`
Restaurant tables.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `venueId` | String | Parent venue |
| `floorId` | String? | Floor assignment |
| `tableNumber` | String | Table identifier |
| `capacity` | Int | Maximum seats |
| `minCapacity` | Int | Minimum party size |
| `location` | String? | Location description |
| `status` | HospitalityTableStatus | AVAILABLE, OCCUPIED, etc. |

#### `hospitality_room`
Hotel rooms.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `venueId` | String | Parent venue |
| `floorId` | String? | Floor assignment |
| `roomNumber` | String | Room identifier |
| `roomType` | HospitalityRoomType | STANDARD, DELUXE, SUITE, etc. |
| `bedCount` | Int | Number of beds |
| `bedType` | String? | Bed configuration |
| `maxOccupancy` | Int | Maximum guests |
| `baseRate` | Decimal | Base nightly rate (NGN) |
| `amenities` | Json? | Room amenities array |
| `status` | HospitalityRoomStatus | AVAILABLE, OCCUPIED, DIRTY, etc. |

---

### Guest Management

#### `hospitality_guest`
Guest profiles (operational, not CRM).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `tenantId` | String | Tenant identifier |
| `guestNumber` | String | Unique guest ID (GST-YYYY-NNNNN) |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `title` | String? | Mr., Mrs., Chief, Dr. |
| `phone` | String? | Phone number (+234) |
| `email` | String? | Email address |
| `nationalId` | String? | NIN number |
| `idType` | String? | ID type (NIN, Passport, etc.) |
| `nationality` | String | Nationality (default: Nigerian) |
| `address` | Json? | Address details |
| `preferences` | Json? | Guest preferences |
| `isVip` | Boolean | VIP status |
| `vipNotes` | String? | VIP notes |

---

### Reservations

#### `hospitality_reservation`
Table and room reservations.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `reservationNumber` | String | Unique reservation ID |
| `reservationType` | HospitalityReservationType | TABLE or ROOM |
| `guestId` | String? | Guest profile link |
| `guestName` | String | Guest name (for walk-ins) |
| `guestPhone` | String? | Contact phone |
| `partySize` | Int | Number of guests |
| `tableId` | String? | Table assignment |
| `roomId` | String? | Room assignment |
| `checkInDate` | DateTime? | Room check-in date |
| `checkOutDate` | DateTime? | Room check-out date |
| `reservationDate` | DateTime? | Table reservation date |
| `reservationTime` | String? | Table reservation time |
| `status` | HospitalityReservationStatus | PENDING, CONFIRMED, etc. |
| `depositRequired` | Boolean | Deposit required flag |
| `depositAmount` | Decimal | Deposit amount |
| `depositPaid` | Boolean | Deposit paid flag |

---

### Stays

#### `hospitality_stay`
Hotel stays (check-in to check-out).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `stayNumber` | String | Unique stay ID |
| `guestId` | String | Guest profile |
| `roomId` | String | Room assignment |
| `reservationId` | String? | Linked reservation |
| `checkInDate` | DateTime | Scheduled check-in |
| `checkOutDate` | DateTime | Scheduled check-out |
| `actualCheckIn` | DateTime? | Actual check-in time |
| `actualCheckOut` | DateTime? | Actual check-out time |
| `nights` | Int | Number of nights |
| `nightlyRate` | Decimal | Rate per night |
| `status` | HospitalityStayStatus | RESERVED, CHECKED_IN, etc. |
| `extensionCount` | Int | Number of extensions |

---

### Orders

#### `hospitality_order`
Food & beverage orders.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `orderNumber` | String | Unique order ID |
| `orderType` | HospitalityOrderType | DINE_IN, TAKEAWAY, ROOM_SERVICE |
| `guestId` | String? | Guest profile |
| `tableId` | String? | Table assignment |
| `stayId` | String? | Stay link (for room service) |
| `covers` | Int | Number of diners |
| `status` | HospitalityOrderStatus | PLACED, PREPARING, SERVED, etc. |
| `serverId` | String? | Assigned server |
| `isSplitBill` | Boolean | Split bill flag |
| `splitCount` | Int | Number of splits |

#### `hospitality_order_item`
Individual order items.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `orderId` | String | Parent order |
| `itemName` | String | Item name |
| `itemCode` | String? | Menu item code |
| `category` | String? | Item category |
| `quantity` | Int | Quantity |
| `unitPrice` | Decimal | Price per unit |
| `modifiers` | Json? | Modifiers array |
| `status` | HospitalityOrderItemStatus | PENDING, PREPARING, SERVED |
| `prepStation` | String? | Kitchen station |
| `splitAssignment` | Int | Split bill assignment |

---

### Service Events

#### `hospitality_service_event`
Housekeeping, maintenance, and other service events.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `roomId` | String? | Room reference |
| `stayId` | String? | Stay reference |
| `eventType` | HospitalityServiceEventType | HOUSEKEEPING, LAUNDRY, etc. |
| `description` | String? | Event description |
| `priority` | String | LOW, NORMAL, HIGH, URGENT |
| `assignedToId` | String? | Assigned staff |
| `status` | HospitalityServiceEventStatus | REQUESTED, IN_PROGRESS, etc. |
| `isChargeable` | Boolean | Chargeable flag |
| `chargeAmount` | Decimal | Charge amount |

---

### Staff & Shifts

#### `hospitality_staff`
Operational staff profiles.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `venueId` | String | Venue assignment |
| `userId` | String? | User account link |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `phone` | String? | Contact phone |
| `role` | HospitalityStaffRole | MANAGER, WAITER, CHEF, etc. |
| `department` | String? | Department |
| `employeeId` | String? | Employee ID |
| `hireDate` | DateTime? | Hire date |

#### `hospitality_shift`
Staff shift management.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `staffId` | String | Staff member |
| `shiftType` | HospitalityShiftType | MORNING, AFTERNOON, NIGHT |
| `shiftDate` | DateTime | Shift date |
| `scheduledStart` | DateTime | Scheduled start time |
| `scheduledEnd` | DateTime | Scheduled end time |
| `actualStart` | DateTime? | Actual clock-in |
| `actualEnd` | DateTime? | Actual clock-out |
| `status` | HospitalityShiftStatus | SCHEDULED, ACTIVE, COMPLETED |
| `station` | String? | Work station assignment |

---

### Billing Facts (Commerce Boundary)

#### `hospitality_charge_fact`
Billing facts emitted to Commerce (NEVER handles money).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `tenantId` | String | Tenant identifier |
| `guestId` | String? | Guest reference |
| `stayId` | String? | Stay reference |
| `orderId` | String? | Order reference |
| `factType` | HospitalityChargeFactType | ROOM_NIGHT, FOOD_BEVERAGE, etc. |
| `description` | String | Charge description |
| `quantity` | Int | Quantity |
| `unitAmount` | Decimal | Unit price |
| `amount` | Decimal | Total amount |
| `serviceDate` | DateTime | Service date |
| `status` | HospitalityChargeFactStatus | PENDING, BILLED, WAIVED |
| `billingInvoiceId` | String? | Commerce invoice link |
| `billedAt` | DateTime? | Billed timestamp |
| `waivedBy` | String? | Waiver authority |
| `waiverReason` | String? | Waiver reason |

---

## 📋 Enums

### Venue Types
```prisma
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
```prisma
enum HospitalityRoomType {
  STANDARD
  DELUXE
  EXECUTIVE
  SUITE
  PRESIDENTIAL
  STUDIO
  APARTMENT
  DORMITORY
}
```

### Status Enums
- `HospitalityTableStatus`: AVAILABLE, OCCUPIED, RESERVED, CLEANING, OUT_OF_SERVICE
- `HospitalityRoomStatus`: AVAILABLE, OCCUPIED, DIRTY, CLEANING, MAINTENANCE, OUT_OF_ORDER, BLOCKED
- `HospitalityReservationStatus`: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW
- `HospitalityStayStatus`: RESERVED, CHECKED_IN, IN_HOUSE, CHECKED_OUT, NO_SHOW, CANCELLED, EXTENDED
- `HospitalityOrderStatus`: PLACED, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
- `HospitalityOrderItemStatus`: PENDING, PREPARING, READY, SERVED, CANCELLED
- `HospitalityShiftStatus`: SCHEDULED, ACTIVE, COMPLETED, CANCELLED, NO_SHOW

### Charge Fact Types
```prisma
enum HospitalityChargeFactType {
  ROOM_NIGHT
  FOOD_BEVERAGE
  ROOM_SERVICE
  SERVICE_CHARGE
  MINIBAR
  LAUNDRY
  PARKING
  SPA
  LATE_CHECKOUT
  EARLY_CHECKIN
  CANCELLATION_FEE
  DAMAGE
  OTHER
}
```

---

## 💰 Commerce Boundary

### Flow
```
Hospitality [Charge Facts] → Billing [Invoice] → Payments → Accounting
```

### Hospitality NEVER:
- ❌ Calculates VAT
- ❌ Creates invoices
- ❌ Records payments
- ❌ Touches accounting journals

---

*This document follows Platform Standardisation v2 requirements.*
