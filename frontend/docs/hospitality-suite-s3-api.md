# Hospitality Suite — S3 API Layer

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S3 — API Layer  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the capability-guarded REST API for the Hospitality Suite, built on top of the S2 domain services.

---

## 📊 API Summary

| Route Group | Endpoints | Capability Guard |
|-------------|-----------|------------------|
| `/api/hospitality` | 2 | `hospitality_guests` |
| `/api/hospitality/venues` | 3 | `hospitality_guests` |
| `/api/hospitality/floors` | 2 | `hospitality_guests` |
| `/api/hospitality/tables` | 3 | `hospitality_guests` |
| `/api/hospitality/rooms` | 3 | `hospitality_rooms` |
| `/api/hospitality/guests` | 3 | `hospitality_guests` |
| `/api/hospitality/reservations` | 3 | `hospitality_reservations` |
| `/api/hospitality/stays` | 3 | `hospitality_rooms` |
| `/api/hospitality/orders` | 4 | `hospitality_pos` |
| `/api/hospitality/staff` | 3 | `hospitality_guests` |
| `/api/hospitality/shifts` | 3 | `hospitality_guests` |
| `/api/hospitality/charge-facts` | 3 | `hospitality_folio` |
| `/api/hospitality/demo` | 1 | `hospitality_guests` |
| **Total** | **36** | |

---

## 🔒 Security

### Authentication
All routes require:
- Valid session via `getCurrentSession()`
- Active tenant via `session.activeTenantId`

**Returns**: `401 Unauthorized` if not authenticated

### Capability Guards
Each route group is protected by capability checks:
- `checkCapabilityForSession(tenantId, capabilityKey)`

**Returns**: `403 Forbidden` if capability is not active

---

## 📡 API Routes

### Main Route: `/api/hospitality`

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=config` | Get hospitality configuration |
| GET | `?action=stats` | Get hospitality statistics |
| POST | `action: initialize` | Initialize hospitality suite |

---

### Venues: `/api/hospitality/venues`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get venue by ID |
| GET | `?type={type}` | List venues by type |
| POST | `{name, type, ...}` | Create venue |
| PATCH | `{id, name, ...}` | Update venue |

---

### Floors: `/api/hospitality/floors`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?venueId={id}` | List floors for venue |
| POST | `{venueId, name, ...}` | Create floor |

---

### Tables: `/api/hospitality/tables`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get table by ID |
| GET | `?venueId={id}` | List tables for venue |
| GET | `?action=available&venueId={id}&partySize={n}` | Get available tables |
| POST | `{venueId, tableNumber, ...}` | Create table |
| PATCH | `{id, status}` | Update table status |

---

### Rooms: `/api/hospitality/rooms`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get room by ID |
| GET | `?venueId={id}` | List rooms for venue |
| GET | `?action=available&venueId={id}&checkInDate=...&checkOutDate=...` | Get available rooms |
| POST | `{venueId, roomNumber, ...}` | Create room |
| PATCH | `{id, status}` | Update room status |

---

### Guests: `/api/hospitality/guests`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get guest by ID |
| GET | `?id={id}&action=history` | Get guest history |
| GET | `?guestNumber={num}` | Get guest by number |
| GET | `?phone={phone}` | Get guest by phone |
| GET | `?search={term}` | Search/list guests |
| POST | `{firstName, lastName, ...}` | Create guest |
| POST | `{action: 'merge', primaryGuestId, secondaryGuestId}` | Merge guests |
| PATCH | `{id, ...}` | Update guest |
| PATCH | `{id, action: 'setVip', isVip, vipNotes}` | Set VIP status |

---

### Reservations: `/api/hospitality/reservations`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get reservation by ID |
| GET | `?reservationNumber={num}` | Get by reservation number |
| GET | `?action=todayTables&venueId={id}` | Today's table reservations |
| GET | `?action=todayArrivals&venueId={id}` | Today's arrivals |
| GET | `?action=todayDepartures&venueId={id}` | Today's departures |
| GET | `?action=checkTableAvailability&...` | Check table availability |
| GET | `?action=checkRoomAvailability&...` | Check room availability |
| GET | `?venueId={id}&status={status}` | List reservations |
| POST | `{reservationType: 'TABLE', ...}` | Create table reservation |
| POST | `{reservationType: 'ROOM', ...}` | Create room reservation |
| PATCH | `{id, action: 'confirm'}` | Confirm reservation |
| PATCH | `{id, action: 'cancel', reason}` | Cancel reservation |
| PATCH | `{id, action: 'noShow'}` | Mark no-show |
| PATCH | `{id, action: 'depositPaid'}` | Mark deposit paid |

---

### Stays: `/api/hospitality/stays`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get stay by ID |
| GET | `?id={id}&action=folio` | Get stay folio |
| GET | `?stayNumber={num}` | Get by stay number |
| GET | `?action=inHouse&venueId={id}` | Get in-house guests |
| GET | `?venueId={id}&status={status}` | List stays |
| POST | `{venueId, guestId, roomId, ...}` | Create stay |
| PATCH | `{id, action: 'checkIn'}` | Check-in guest |
| PATCH | `{id, action: 'checkOut'}` | Check-out guest |
| PATCH | `{id, action: 'inHouse'}` | Mark in-house |
| PATCH | `{id, action: 'extend', newCheckOutDate}` | Extend stay |
| PATCH | `{id, action: 'changeRoom', newRoomId}` | Change room |

---

### Orders: `/api/hospitality/orders`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get order by ID |
| GET | `?id={id}&action=total` | Get order total |
| GET | `?id={id}&action=splitTotals` | Get split bill totals |
| GET | `?orderNumber={num}` | Get by order number |
| GET | `?action=kitchenQueue&venueId={id}` | Kitchen display queue |
| GET | `?action=active&venueId={id}` | Active orders |
| GET | `?venueId={id}&status={status}` | List orders |
| POST | `{venueId, orderType, ...}` | Create order |
| POST | `{action: 'addItem', orderId, itemName, unitPrice, ...}` | Add item to order |
| PATCH | `{orderId, action: 'confirm'}` | Confirm order |
| PATCH | `{orderId, action: 'preparing'}` | Mark preparing |
| PATCH | `{orderId, action: 'ready'}` | Mark ready |
| PATCH | `{orderId, action: 'served'}` | Mark served |
| PATCH | `{orderId, action: 'complete'}` | Complete order |
| PATCH | `{orderId, action: 'cancel'}` | Cancel order |
| PATCH | `{action: 'updateItemStatus', itemId, status}` | Update item status |
| PATCH | `{action: 'setSplitBill', orderId, splitCount}` | Enable split bill |
| PATCH | `{action: 'assignItemToSplit', itemId, splitNumber}` | Assign item to split |
| DELETE | `?itemId={id}` | Remove order item |

---

### Staff: `/api/hospitality/staff`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get staff by ID |
| GET | `?action=byRole&venueId={id}&role={role}` | Get staff by role |
| GET | `?venueId={id}&role={role}` | List staff |
| POST | `{venueId, firstName, lastName, role, ...}` | Create staff |
| PATCH | `{id, ...}` | Update staff |
| PATCH | `{id, action: 'deactivate'}` | Deactivate staff |

---

### Shifts: `/api/hospitality/shifts`

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get shift by ID |
| GET | `?action=today&venueId={id}` | Today's shifts |
| GET | `?action=active&venueId={id}` | Active staff on duty |
| GET | `?action=weekSchedule&venueId={id}&weekStart=...` | Week schedule |
| GET | `?action=available&venueId={id}&...` | Available staff |
| GET | `?staffId={id}&dateFrom=...&dateTo=...` | List shifts |
| POST | `{staffId, shiftType, shiftDate, ...}` | Create shift |
| PATCH | `{id, action: 'start'}` | Clock in |
| PATCH | `{id, action: 'end'}` | Clock out |
| PATCH | `{id, action: 'cancel'}` | Cancel shift |
| PATCH | `{id, action: 'noShow'}` | Mark no-show |
| PATCH | `{id, ...}` | Update shift |

---

### Charge Facts: `/api/hospitality/charge-facts`

**⚠️ COMMERCE BOUNDARY**: This route handles billing facts only.

| Method | Parameters | Description |
|--------|------------|-------------|
| GET | `?id={id}` | Get charge fact by ID |
| GET | `?action=guestSummary&guestId={id}` | Guest billing summary |
| GET | `?action=staySummary&stayId={id}` | Stay billing summary |
| GET | `?action=pending&guestId={id}` | Pending facts for billing |
| GET | `?guestId={id}&status={status}` | List charge facts |
| POST | `{factType, description, unitAmount, ...}` | Create charge fact |
| POST | `{action: 'generateRoomCharges', stayId}` | Generate room night charges |
| POST | `{action: 'generateOrderCharges', orderId}` | Generate order charges |
| POST | `{action: 'generateServiceEventCharge', eventId}` | Generate service charge |
| PATCH | `{action: 'markBilled', factId, billingInvoiceId}` | Mark as billed |
| PATCH | `{action: 'waive', factId, waivedBy, reason}` | Waive charge |
| PATCH | `{action: 'cancel', factId}` | Cancel charge |

---

### Demo: `/api/hospitality/demo`

| Method | Parameters | Description |
|--------|------------|-------------|
| POST | `{action: 'seed'}` | Seed Nigerian demo data |

---

## 💰 Commerce Boundary

### Flow
```
Hospitality [Charge Facts] → Billing [Invoice] → Payments → Accounting
```

### What Hospitality API Does:
- ✅ Creates charge facts (billing events)
- ✅ Lists pending charges for billing
- ✅ Generates room night, order, and service charges
- ✅ Marks facts as billed (when called by Commerce)
- ✅ Waives and cancels charges

### What Hospitality API NEVER Does:
- ❌ Creates invoices
- ❌ Calculates VAT
- ❌ Records payments
- ❌ Touches accounting journals
- ❌ Handles money transactions

---

## 🇳🇬 Nigeria-First Features

### Demo Data Seeder
The `/api/hospitality/demo` endpoint seeds:
- **PalmView Suites** - Boutique hotel in Lekki, Lagos
- 3 floors, 6 tables, 7 rooms
- 4 guests with Nigerian names
- 5 staff members
- 2 active stays
- 1 active order
- Nigerian pricing in NGN

### Walk-in Support
- Guest profiles are optional
- Quick guest creation during service
- No mandatory reservations

### Split Bills
- First-class split bill support
- Item-level split assignment
- Multiple bill totals

---

## 🔒 Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `Unauthorized` | Missing or invalid session |
| 403 | `CAPABILITY_INACTIVE` | Capability not activated |
| 400 | `Bad Request` | Missing required fields |
| 404 | `Not Found` | Resource not found |
| 500 | `Internal Server Error` | Unexpected error |

---

*This document follows Platform Standardisation v2 requirements.*
