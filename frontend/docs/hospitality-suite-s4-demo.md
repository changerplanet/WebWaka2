# Hospitality Suite — S4 Demo UI

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S4 — Demo UI + Nigerian Demo Data  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the Hospitality Suite demo page and Nigerian demo data seeder, built for sales readiness and partner demonstrations.

---

## 📱 Demo Page

**Route**: `/hospitality-demo`

### Features

| Feature | Description |
|---------|-------------|
| Hero Section | PalmView Suites & Grill branding, stats cards, Nigeria-first badges |
| Module Cards | 6 capability modules with highlights |
| Floor Plan View | Real-time table and room status grid |
| Guest Registry | Guest profiles with VIP tracking |
| In-House Guests | Currently checked-in stays |
| Active Orders | Orders in progress with type icons |
| Charge Facts | Pending billing facts (Commerce boundary) |
| Architecture Diagram | 4-layer visualization with Commerce boundary |
| Nigeria-First Section | Walk-in first, cash-friendly, multi-shift features |

### States

1. **Unauthenticated**: Preview mode banner, module cards only
2. **Authenticated, Not Initialized**: Seed button displayed
3. **Authenticated, Initialized**: Full demo data displayed

---

## 🇳🇬 Demo Data Seeder

**Route**: `/api/hospitality/demo`  
**Method**: `POST { action: 'seed' }`

### Seeded Entities

| Entity | Count | Details |
|--------|-------|---------|
| Config | 1 | PalmView Suites settings |
| Venue | 1 | PalmView Suites & Grill, Lekki, Lagos |
| Floors | 3 | Ground Floor, First Floor, Second Floor |
| Tables | 6 | T1-T6 (2-8 capacity) |
| Rooms | 7 | 101-104 (Standard/Deluxe), 201-203 (Deluxe/Executive/Suite) |
| Guests | 4 | Nigerian names, 2 VIPs |
| Staff | 5 | Manager, Receptionist, Waiter, Housekeeping, Chef |
| Stays | 2 | Active check-ins |
| Orders | 1 | Active dine-in with 3 items |
| Order Items | 3 | Jollof Rice, Grilled Chicken, Chapman |
| Charge Facts | 2 | Room night + Minibar |
| Shifts | 3 | Today's active shifts |

### Nigerian Demo Data

**Venue**: PalmView Suites & Grill
- **Address**: 15 Admiralty Way, Lekki Phase 1, Lagos
- **Phone**: +234 812 345 6789
- **Email**: reservations@palmviewsuites.ng
- **Type**: HOTEL (Restaurant + Rooms)

**Guests**:
- Chinedu Okonkwo (VIP, regular corporate)
- Aisha Mohammed
- Dr. Oluwaseun Adeyemi (VIP)
- Jennifer Smith (International)

**Staff**:
- Adebayo Oluwole (Manager)
- Ngozi Eze (Receptionist)
- Ibrahim Musa (Waiter)
- Grace Obi (Housekeeping)
- Emeka Nwosu (Chef)

**Room Rates (NGN)**:
- Standard: ₦35,000/night
- Deluxe: ₦50,000-55,000/night
- Executive: ₦75,000/night
- Suite: ₦120,000/night

**Menu Items**:
- Jollof Rice: ₦3,500
- Grilled Chicken: ₦4,000
- Chapman: ₦1,500

---

## 🏗️ Architecture Diagram

Displayed on the demo page:

```
┌─────────────────────────────────────────────────────────────┐
│                    HOSPITALITY SUITE                        │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Venue Layer  │ Guest Layer  │ Operations   │ Commerce      │
│              │              │    Layer     │ Boundary      │
├──────────────┼──────────────┼──────────────┼───────────────┤
│ • Venues     │ • Profiles   │ • Orders     │ • Charge Facts│
│ • Floors     │ • Reservat.  │ • Kitchen    │ • → Billing   │
│ • Tables     │ • Stays      │ • Split Bills│ • → Payments  │
│ • Rooms      │ • History    │ • Shifts     │ • → Accounting│
└──────────────┴──────────────┴──────────────┴───────────────┘
```

**Commerce Boundary Notice**:
> Hospitality Suite emits **charge facts only**. It never creates invoices, calculates VAT (7.5% for hospitality), records payments, or touches accounting journals.

---

## 🔒 Demo Guardrails

| Guardrail | Implementation |
|-----------|----------------|
| Demo Preview Mode | Banner shown when unauthenticated |
| Sample Data Notice | Clear "Sample Nigerian Data" banner |
| No Destructive Actions | Read-only display, seeder is idempotent |
| No Billing/Payments UI | Charge facts display only |
| Seeder Idempotent | Re-running returns "already exists" |

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `/app/hospitality-demo/page.tsx` | Demo UI page |
| `/api/hospitality/demo/route.ts` | Demo seeder (created in S3) |
| `/docs/hospitality-suite-s4-demo.md` | This documentation |

---

## ✅ Verification Checklist

- [x] Demo page renders without authentication (preview mode)
- [x] Demo page shows seed button when authenticated
- [x] Seeder creates all demo entities
- [x] Seeder is idempotent (safe to re-run)
- [x] Module cards display correctly
- [x] Floor plan view shows tables and rooms
- [x] Guest registry displays with VIP badges
- [x] In-house guests section shows active stays
- [x] Active orders section shows orders in progress
- [x] Charge facts section shows pending facts
- [x] Architecture diagram renders
- [x] Nigeria-first section displays features
- [x] Commerce boundary is clearly marked
- [x] Navigation links work

---

## 🚫 Out of Scope (S4)

- Demo Mode wiring (S5)
- Quick Start wiring (S5)
- Payments UI
- Accounting UI
- Loyalty programs
- OTA integrations

---

## 📋 Known Limitations

1. **Webpack caching issue**: Seeder script changes may not hot-reload. Use the API endpoint for testing.
2. **No real-time updates**: Floor plan is static snapshot, refresh to update.
3. **Limited order items**: Demo shows 3 items; production would have full menu.

---

*This document follows Platform Standardisation v2 requirements.*
