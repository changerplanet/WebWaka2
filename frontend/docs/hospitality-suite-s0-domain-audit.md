# Hospitality Suite — S0 Domain Audit

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S0 — Domain Audit  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document defines the domain scope, boundaries, and Nigeria-first assumptions for the Hospitality Suite under Platform Standardisation v2.

---

## 🎯 Domain Definition

The Hospitality Suite covers **customer-facing service operations** where Commerce is central but operational context matters:

- Restaurants, Cafés, Bars
- Hotels, Short-let Apartments, Guest Houses
- Table / Room management
- Orders, stays, reservations
- Staff shifts & service lifecycle
- Guest profiles (non-CRM, operational only)
- Billing facts only (never money)

---

## ✅ In Scope

### Venue Operations
| Entity | Description |
|--------|-------------|
| Venues | Hotels, restaurants, cafés, bars |
| Floors / Areas | Physical layout organization |
| Tables | Restaurant seating with capacity |
| Rooms | Hotel rooms with types, amenities |
| Service Stations | Kitchen, bar, housekeeping |

### Guest Management
| Entity | Description |
|--------|-------------|
| Guest Profiles | Operational guest data (not CRM) |
| Guest Visits | Restaurant visits |
| Guest Stays | Hotel check-in to check-out |
| Preferences | Dietary, room preferences |

### Reservations
| Entity | Description |
|--------|-------------|
| Table Reservations | Restaurant bookings |
| Room Reservations | Hotel bookings |
| Waitlist | Queue management |
| No-shows | Tracking and policies |

### Orders & Service
| Entity | Description |
|--------|-------------|
| Food Orders | Restaurant orders |
| Room Service | In-room dining |
| Service Requests | Housekeeping, maintenance |
| Order Lifecycle | Placed → Preparing → Ready → Served |

### Stays
| Entity | Description |
|--------|-------------|
| Check-in | Guest arrival |
| Check-out | Guest departure |
| Extensions | Stay modifications |
| Room Status | Clean, dirty, occupied, maintenance |

### Staff Operations
| Entity | Description |
|--------|-------------|
| Staff Profiles | Operational staff data |
| Shifts | Shift assignment and tracking |
| Active Duty | Currently working staff |
| Service Assignment | Table/room assignments |

### Billing Facts
| Entity | Description |
|--------|-------------|
| Room Charges | Nightly rate facts |
| Food & Beverage | Meal charge facts |
| Service Charges | Additional service facts |
| **Never**: Invoices, payments, accounting |

---

## ❌ Explicitly Out of Scope (Phase 2+)

| Feature | Reason |
|---------|--------|
| Online Travel Agencies | Booking.com, Airbnb sync — external integration |
| Loyalty Programs | Marketing/CRM territory |
| Advanced Revenue Management | Yield pricing, dynamic rates — complex finance |
| Kitchen Inventory | Handled by Inventory Suite |
| Payroll / HR | Handled by HR Suite |
| Government Levies | Handled by Accounting Suite |
| Telemedicine | Health Suite territory |
| Event Management | Events Suite territory |

---

## 🇳🇬 Nigeria-First Assumptions

### Payment Realities
| Assumption | Impact |
|------------|--------|
| Cash-heavy operations | POS terminals everywhere, cash drawers |
| Frequent power interruptions | Offline-first design considerations |
| Network instability | Local-first with sync |
| Walk-in guests common | No mandatory reservations |
| Split bills normal | Easy bill splitting |
| Partial payments | Pay-as-you-go support |
| Tips informal | Not payroll, not tracked |

### Operational Realities
| Assumption | Impact |
|------------|--------|
| Multi-shift staff | Morning, afternoon, night shifts |
| High staff turnover | Simple onboarding |
| Family-run businesses | Owner-operator model |
| Mixed service levels | From budget to premium |
| Power outages | Generator changeover awareness |

### Regulatory Context
| Assumption | Impact |
|------------|--------|
| VAT applies | 7.5% VAT on hospitality (unlike Health/Education) |
| Tourism levies | State-specific, handled by Accounting |
| Health inspections | Compliance tracking |
| Fire safety | Room capacity compliance |

### Cultural Context
| Assumption | Impact |
|------------|--------|
| Pepper soup | Nigerian cuisine support |
| Local drinks | Palm wine, zobo tracking |
| Owambe culture | Large party support |
| Extended family stays | Group booking common |

---

## 💰 Commerce Boundary

### Canonical Flow
```
Hospitality [Charge Facts] 
    → Commerce Billing [Invoice] 
        → Commerce Payments 
            → Commerce Accounting
```

### Hospitality CAN:
- ✅ Emit billing facts (room nights, meals, services)
- ✅ Track service delivery
- ✅ Reference billing IDs
- ✅ Query payment status

### Hospitality CANNOT:
- ❌ Calculate VAT
- ❌ Create invoices
- ❌ Record payments
- ❌ Create journal entries
- ❌ Perform financial calculations

---

## 🔗 Suite Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Commerce Billing | Required | Invoice creation |
| Commerce Payments | Required | Payment processing |
| Commerce Accounting | Required | Journal entries |
| Inventory | Optional | Kitchen stock (Phase 2) |
| HR | Optional | Payroll (Phase 2) |

---

## 📊 Key Metrics (Demo Focus)

| Metric | Description |
|--------|-------------|
| Occupancy Rate | Rooms occupied / total rooms |
| Covers | Meals served (restaurant) |
| ADR | Average Daily Rate |
| RevPAR | Revenue per available room |
| Table Turnover | Seatings per table per day |
| Service Time | Order to delivery |

---

## 🎭 Demo Intent (Declared Early)

### Demo Route
```
/hospitality-demo
```

### Demo Facility Options
- **Restaurant**: "Mama Put Delight, Lagos"
- **Hotel**: "Sunshine Guest House, Ikeja"

### Demo Data Themes
- Nigerian names and phone numbers
- Nigerian dishes (jollof rice, suya, pepper soup)
- Nigerian drinks (Chapman, zobo, palm wine)
- Naira pricing (NGN)
- Lagos locations

---

## 🛑 Phase Boundaries

| What | S0 Status |
|------|-----------|
| Domain boundaries | ✅ Defined |
| Nigeria-first scope | ✅ Documented |
| Commerce boundary | ✅ Identified |
| Exclusions | ✅ Listed |
| Schema | ❌ Not created |
| Services | ❌ Not created |
| APIs | ❌ Not created |
| UI | ❌ Not created |

---

*This document follows Platform Standardisation v2 requirements.*
