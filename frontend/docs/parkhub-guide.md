# ParkHub - Motor Park Marketplace Guide

## Overview

ParkHub is a **Transport configuration of the Multi-Vendor Marketplace (MVM)**. It enables motor parks to operate as digital marketplaces where multiple transport companies can sell tickets.

> **KEY PRINCIPLE**: ParkHub uses existing MVM, Logistics, and Payments capabilities. No new database schemas were created.

---

## Architecture: Capability Composition

```
┌─────────────────────────────────────────────────────────────┐
│                        PARKHUB                              │
│            (Transport Marketplace Solution)                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│      MVM      │   │   Logistics   │   │   Payments    │
│  (Products,   │   │   (Drivers,   │   │  (Commission, │
│   Orders)     │   │    Trips)     │   │   Wallets)    │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Mapping: MVM → ParkHub

| MVM Concept | ParkHub Concept | Description |
|-------------|-----------------|-------------|
| Marketplace Owner | Motor Park | The tenant operating the park |
| Vendor | Transport Company | Companies providing bus services |
| Product | Route | A trip between two cities |
| Inventory | Seats | Available seats on a bus |
| Order | Ticket | A passenger's booking |
| Commission | Park Commission | Percentage taken by the park |

---

## User Roles

### 1. Park Administrator (Tenant Admin)
- Manages all transport companies
- Approves/suspends operators
- Sets commission rates
- Views park-wide analytics
- **Dashboard**: `/parkhub/park-admin`

### 2. Transport Company Operator (Vendor)
- Manages own routes and schedules
- Manages own drivers
- Views own tickets and earnings
- **Dashboard**: `/parkhub/operator`

### 3. Park Agent (POS User)
- Sells tickets at the counter
- Processes walk-in passengers
- Prints tickets
- **POS**: `/parkhub/pos`

### 4. Passenger (Customer)
- Searches routes
- Books tickets online
- **Booking**: `/parkhub/booking`

---

## Trip Lifecycle

```
SCHEDULED → BOARDING → DEPARTED → IN_TRANSIT → ARRIVED → COMPLETED
     │                                                        │
     └──────────────── CANCELLED ────────────────────────────┘
```

### Status Descriptions

| Status | Description | Actions |
|--------|-------------|---------|
| SCHEDULED | Trip scheduled, not yet boarding | Assign driver, Cancel |
| BOARDING | Passengers boarding the bus | Start trip |
| DEPARTED | Bus has left the park | Update status |
| IN_TRANSIT | Bus en route to destination | Track location |
| ARRIVED | Bus arrived at destination | Mark complete |
| COMPLETED | Trip finished | View summary |
| CANCELLED | Trip cancelled | - |

---

## Driver Assignment Flow

1. **Create Trip**: Route scheduled for specific date/time
2. **Assign Driver**: Park admin or operator assigns available driver
3. **Driver Notified**: Driver receives trip details
4. **Pre-trip Check**: Driver confirms readiness
5. **Start Trip**: Driver starts the journey
6. **Real-time Updates**: Status updates during trip
7. **Complete Trip**: Driver marks arrival

---

## Commission Calculation

```
Ticket Price: ₦15,000
Commission Rate: 10%
─────────────────────
Park Commission: ₦1,500
Operator Earnings: ₦13,500
```

### Commission Types
- **Per-ticket**: Commission on each ticket sold
- **Fixed monthly**: Fixed fee regardless of sales
- **Tiered**: Rate changes based on volume

---

## Pages & Routes

| Page | Route | Access |
|------|-------|--------|
| Park Admin Dashboard | `/parkhub/park-admin` | Tenant Admin |
| Trip Management | `/parkhub/park-admin/trips` | Tenant Admin |
| Operator Dashboard | `/parkhub/operator` | Vendor (Company) |
| Passenger Booking | `/parkhub/booking` | Public |
| Agent POS | `/parkhub/pos` | POS Agent |

---

## API Endpoints

### ParkHub Configuration
```
GET /api/parkhub?action=config
GET /api/parkhub?action=solution-package
GET /api/parkhub?action=demo-data
```

### Activation (Partner Only)
```
POST /api/parkhub
{
  "action": "activate",
  "tenantId": "...",
  "parkName": "Jibowu Motor Park",
  "parkAddress": "Lagos",
  "parkPhone": "080...",
  "tier": "starter"
}
```

---

## Partner Activation Checklist

### Pre-Activation
1. ✅ Verify partner agreement
2. ✅ Create/select tenant
3. ✅ Verify capability access (MVM, Logistics, Payments)

### Activation
4. ✅ Activate capability bundle
5. ✅ Configure MVM profile (labels, product types)
6. ✅ Set commission rate

### Post-Activation
7. ✅ Create admin account
8. ⬜ Seed demo data (optional)
9. ✅ Training & handover

---

## Demo Data

### Motor Park
- **Name**: Jibowu Motor Park
- **Location**: Yaba, Lagos

### Transport Companies (3)
1. **ABC Transport** - Luxury buses, Lagos-Abuja routes
2. **Peace Mass Transit** - Standard buses, Eastern routes
3. **GUO Transport** - Economy buses, Southern routes

### Sample Data
- 15 Routes total (5 per company)
- 6 Buses (2 per company)
- 7 Drivers (2-3 per company)
- 15 Sample tickets

---

## Offline Support

ParkHub inherits offline-first capabilities from the core platform:

- ✅ Ticket sales work offline (POS)
- ✅ Trip status updates sync when online
- ✅ Driver assignments cached locally
- ✅ Passenger manifest available offline

---

## Best Practices

### For Park Administrators
1. Set clear commission rates upfront
2. Approve operators promptly
3. Monitor trip status regularly
4. Review daily sales reports

### For Transport Companies
1. Keep routes and prices updated
2. Assign drivers ahead of time
3. Update trip status in real-time
4. Respond to passenger queries quickly

### For Partners
1. Use the activation checklist
2. Provide training to park staff
3. Configure commission correctly
4. Enable demo data for testing

---

## Support

For technical support, contact your partner representative or raise a ticket through the partner portal.

---

*Last updated: January 2026*
*Version: 1.0.0*
