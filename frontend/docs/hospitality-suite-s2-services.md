# Hospitality Suite — S2 Services

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S2 — Services  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the domain services for the Hospitality Suite, implementing pure business logic without API or UI dependencies.

---

## 📊 Service Summary

| Service | Methods | Description |
|---------|---------|-------------|
| VenueService | 15 | Venues, floors, tables, rooms |
| GuestService | 10 | Guest profiles and history |
| ReservationService | 15 | Table and room reservations |
| StayService | 12 | Hotel stays and check-in/out |
| OrderService | 18 | Food & beverage orders |
| StaffShiftService | 14 | Staff and shift management |
| ChargeFactService | 15 | Billing facts (Commerce boundary) |
| **Total** | **99** | |

---

## 🏨 VenueService

`/lib/hospitality/services/venue-service.ts`

### Venue Operations
| Method | Description |
|--------|-------------|
| `createVenue(input)` | Create new venue |
| `getVenue(tenantId, venueId)` | Get venue with floors |
| `listVenues(tenantId, options)` | List venues by type |
| `updateVenue(tenantId, venueId, data)` | Update venue details |

### Floor Operations
| Method | Description |
|--------|-------------|
| `createFloor(input)` | Create floor/area |
| `listFloors(tenantId, venueId)` | List floors with counts |

### Table Operations
| Method | Description |
|--------|-------------|
| `createTable(input)` | Create table |
| `getTable(tenantId, tableId)` | Get table details |
| `listTables(tenantId, venueId, options)` | List tables by status/capacity |
| `updateTableStatus(tenantId, tableId, status)` | Update table status |
| `getAvailableTables(tenantId, venueId, partySize)` | Get available tables for party |

### Room Operations
| Method | Description |
|--------|-------------|
| `createRoom(input)` | Create room |
| `getRoom(tenantId, roomId)` | Get room details |
| `listRooms(tenantId, venueId, options)` | List rooms by type/status |
| `updateRoomStatus(tenantId, roomId, status)` | Update room status |
| `getAvailableRooms(tenantId, venueId, options)` | Get available rooms for dates |

### Stats
| Method | Description |
|--------|-------------|
| `getVenueStats(tenantId, venueId)` | Get occupancy and availability stats |

---

## 👤 GuestService

`/lib/hospitality/services/guest-service.ts`

### Guest Operations
| Method | Description |
|--------|-------------|
| `createGuest(input)` | Create guest profile |
| `getGuest(tenantId, guestId)` | Get guest with counts |
| `getGuestByNumber(tenantId, guestNumber)` | Find by guest number |
| `getGuestByPhone(tenantId, phone)` | Find by phone |
| `listGuests(tenantId, options)` | Search/list guests |
| `updateGuest(tenantId, guestId, data)` | Update profile |
| `setVipStatus(tenantId, guestId, isVip, notes)` | Set VIP status |

### Guest History
| Method | Description |
|--------|-------------|
| `getGuestHistory(tenantId, guestId)` | Get stays, orders, reservations |
| `mergeGuests(tenantId, primaryId, secondaryId)` | Merge duplicate guests |

---

## 📅 ReservationService

`/lib/hospitality/services/reservation-service.ts`

### Table Reservations
| Method | Description |
|--------|-------------|
| `createTableReservation(input)` | Create table booking |
| `checkTableAvailability(...)` | Check table availability |
| `getTodayTableReservations(tenantId, venueId)` | Today's table bookings |

### Room Reservations
| Method | Description |
|--------|-------------|
| `createRoomReservation(input)` | Create room booking |
| `checkRoomAvailability(...)` | Check room availability |
| `getTodayArrivals(tenantId, venueId)` | Today's expected arrivals |
| `getTodayDepartures(tenantId, venueId)` | Today's departures |

### Common Operations
| Method | Description |
|--------|-------------|
| `getReservation(tenantId, reservationId)` | Get reservation details |
| `getReservationByNumber(tenantId, number)` | Find by reservation number |
| `listReservations(tenantId, options)` | Search/list reservations |
| `confirmReservation(tenantId, reservationId)` | Confirm reservation |
| `cancelReservation(tenantId, reservationId, reason)` | Cancel with reason |
| `markNoShow(tenantId, reservationId)` | Mark as no-show |
| `markDepositPaid(tenantId, reservationId)` | Mark deposit paid |

---

## 🛏️ StayService

`/lib/hospitality/services/stay-service.ts`

### Stay Operations
| Method | Description |
|--------|-------------|
| `createStay(input)` | Create stay record |
| `getStay(tenantId, stayId)` | Get stay with all relations |
| `getStayByNumber(tenantId, stayNumber)` | Find by stay number |
| `listStays(tenantId, options)` | Search/list stays |

### Check-in/Check-out
| Method | Description |
|--------|-------------|
| `checkIn(tenantId, stayId)` | Guest check-in |
| `checkOut(tenantId, stayId)` | Guest check-out |
| `markInHouse(tenantId, stayId)` | Mark as in-house |

### Stay Modifications
| Method | Description |
|--------|-------------|
| `extendStay(tenantId, stayId, newCheckOutDate)` | Extend stay |
| `changeRoom(tenantId, stayId, newRoomId)` | Change room |

### Queries
| Method | Description |
|--------|-------------|
| `getInHouseGuests(tenantId, venueId)` | Get current in-house guests |
| `getStayFolio(tenantId, stayId)` | Get stay charges summary |

---

## 🍽️ OrderService

`/lib/hospitality/services/order-service.ts`

### Order Operations
| Method | Description |
|--------|-------------|
| `createOrder(input)` | Create new order |
| `getOrder(tenantId, orderId)` | Get order with items |
| `getOrderByNumber(tenantId, orderNumber)` | Find by order number |
| `listOrders(tenantId, options)` | Search/list orders |

### Order Items
| Method | Description |
|--------|-------------|
| `addOrderItem(input)` | Add item to order |
| `updateOrderItemStatus(tenantId, itemId, status)` | Update item status |
| `removeOrderItem(tenantId, itemId)` | Remove pending item |

### Status Transitions
| Method | Description |
|--------|-------------|
| `confirmOrder(tenantId, orderId)` | Confirm order |
| `markOrderPreparing(tenantId, orderId)` | Mark preparing |
| `markOrderReady(tenantId, orderId)` | Mark ready |
| `markOrderServed(tenantId, orderId)` | Mark served |
| `completeOrder(tenantId, orderId)` | Complete order |
| `cancelOrder(tenantId, orderId)` | Cancel order |

### Kitchen & Display
| Method | Description |
|--------|-------------|
| `getKitchenQueue(tenantId, venueId, station)` | Kitchen display queue |
| `getActiveOrders(tenantId, venueId)` | Active orders |
| `calculateOrderTotal(tenantId, orderId)` | Calculate total (display only) |

### Split Bills
| Method | Description |
|--------|-------------|
| `setSplitBill(tenantId, orderId, splitCount)` | Enable split bill |
| `assignItemToSplit(tenantId, itemId, splitNumber)` | Assign item to split |
| `getSplitBillTotals(tenantId, orderId)` | Get split totals |

---

## 👥 StaffShiftService

`/lib/hospitality/services/staff-shift-service.ts`

### Staff Operations
| Method | Description |
|--------|-------------|
| `createStaff(input)` | Create staff profile |
| `getStaff(tenantId, staffId)` | Get staff with shifts |
| `listStaff(tenantId, options)` | List staff by role |
| `updateStaff(tenantId, staffId, data)` | Update profile |
| `deactivateStaff(tenantId, staffId)` | Deactivate staff |
| `getStaffByRole(tenantId, venueId, role)` | Get staff by role |

### Shift Operations
| Method | Description |
|--------|-------------|
| `createShift(input)` | Schedule shift |
| `getShift(tenantId, shiftId)` | Get shift details |
| `listShifts(tenantId, options)` | List shifts |
| `updateShift(tenantId, shiftId, data)` | Update shift |
| `startShift(tenantId, shiftId)` | Clock in |
| `endShift(tenantId, shiftId)` | Clock out |
| `cancelShift(tenantId, shiftId)` | Cancel shift |
| `markNoShowShift(tenantId, shiftId)` | Mark no-show |

### Schedule Views
| Method | Description |
|--------|-------------|
| `getTodayShifts(tenantId, venueId)` | Today's shifts |
| `getActiveStaff(tenantId, venueId)` | Currently on duty |
| `getWeekSchedule(tenantId, venueId, weekStart)` | Weekly schedule |
| `getAvailableStaff(...)` | Staff availability |

---

## 💰 ChargeFactService

`/lib/hospitality/services/charge-fact-service.ts`

### COMMERCE BOUNDARY
This service emits billing facts ONLY. It never:
- Creates invoices
- Calculates VAT
- Records payments
- Touches accounting

### Charge Fact Operations
| Method | Description |
|--------|-------------|
| `createChargeFact(input)` | Create billing fact |
| `getChargeFact(tenantId, factId)` | Get fact details |
| `listChargeFacts(tenantId, options)` | List/search facts |

### Commerce Boundary Methods
| Method | Description |
|--------|-------------|
| `markAsBilled(tenantId, factId, invoiceId)` | Mark as billed by Commerce |
| `markMultipleAsBilled(tenantId, factIds, invoiceId)` | Batch mark as billed |
| `getPendingChargeFacts(tenantId, guestId?, stayId?)` | Get pending for billing |

### Waiver Operations
| Method | Description |
|--------|-------------|
| `waiveChargeFact(tenantId, factId, waivedBy, reason)` | Waive charge |
| `cancelChargeFact(tenantId, factId)` | Cancel charge |

### Charge Generation
| Method | Description |
|--------|-------------|
| `generateRoomNightCharges(tenantId, stayId)` | Generate room night charges |
| `generateOrderCharges(tenantId, orderId)` | Generate order charges |
| `generateServiceEventCharge(tenantId, eventId)` | Generate service charge |

### Billing Summary
| Method | Description |
|--------|-------------|
| `getGuestBillingSummary(tenantId, guestId)` | Guest billing summary |
| `getStayBillingSummary(tenantId, stayId)` | Stay folio summary |

---

## 🇳🇬 Nigeria-First Design

### Walk-in Support
- All services support walk-in guests without prior reservation
- Guest profiles optional for walk-ins
- Quick guest creation during service

### Split Bills
- First-class split bill support in OrderService
- Item-level split assignment
- Common in Nigerian dining

### Multi-Shift Staffing
- Morning, Afternoon, Night shifts
- Full-day and split shifts
- Active duty tracking

### Cash-Friendly
- No payment logic in services
- All financial operations via Commerce
- Supports cash-heavy operations

---

## 🔒 Service Principles

1. **Pure Domain Logic**: No API calls, no UI logic
2. **Tenant-Scoped**: All operations scoped to tenant
3. **Deterministic**: Same input produces same output
4. **Commerce Boundary**: Billing facts only, never money
5. **Type-Safe**: Full TypeScript typing

---

*This document follows Platform Standardisation v2 requirements.*
