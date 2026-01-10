# Hospitality Suite — S5 Narrative Integration

**Suite**: Hospitality  
**Standard**: Platform Standardisation v2  
**Phase**: S5 — Narrative Integration (Demo Mode + Quick Start)  
**Completed**: January 7, 2026  
**Status**: COMPLETE

---

## Overview

This document details the narrative integration for the Hospitality Suite, enabling partner-ready and investor-ready demo experiences through guided storylines and Quick Start roles.

---

## 📚 Storylines Registered

### 1. Hotel Owner / GM (`hotelOwner`)

**Intent**: Demonstrate the complete hotel management workflow from venue setup to commerce boundary.

**Persona**: Hotel Owner, General Manager, or Hospitality Director

**Duration**: 10 minutes

**Steps**:
| # | Title | Description | Nigeria Note |
|---|-------|-------------|--------------|
| 1 | Venue & Rooms | Hotel layout and room inventory | Standard, Deluxe, Executive, Suite — NGN pricing |
| 2 | Guest Registry | Guest profiles and VIP tracking | Nigerian names, phone formats |
| 3 | Reservations & Walk-ins | Bookings and spontaneous arrivals | Walk-in support is critical |
| 4 | Check-in to Check-out | Complete stay lifecycle | Default check-in 2pm, check-out 12pm |
| 5 | Staff & Shifts | Multi-shift scheduling | Morning, Afternoon, Night, Split shifts |
| 6 | Charge Facts | Room nights and services billed | VAT 7.5% by Commerce |
| 7 | Commerce Boundary | Hospitality → Billing → Payments | Full traceability |

---

### 2. Restaurant Manager (`restaurantManager`)

**Intent**: Demonstrate restaurant operations with POS, kitchen display, and split bills.

**Persona**: Restaurant Manager, F&B Director, or Outlet Manager

**Duration**: 8 minutes

**Steps**:
| # | Title | Description | Nigeria Note |
|---|-------|-------------|--------------|
| 1 | Table Layout | Floor with table status | 2-8 seater tables |
| 2 | Walk-in Guests | No reservation required | Walk-in first design |
| 3 | Order Taking | Dine-in orders with tracking | Nigerian menu items |
| 4 | Kitchen Display | Orders by prep station | Hot Kitchen, Grill, Bar |
| 5 | Split Bills | Divide bills among guests | Essential for Nigerian group dining |
| 6 | Shift Accountability | Server performance tracking | Multi-shift support |
| 7 | Charge Facts | F&B orders become billing facts | VAT 7.5% by Commerce |

---

### 3. Hotel / Restaurant Guest (`hospitalityGuest`)

**Intent**: Show bill transparency and service quality from the guest perspective.

**Persona**: Hotel Guest, Restaurant Diner, or Corporate Traveler

**Duration**: 6 minutes

**Steps**:
| # | Title | Description | Nigeria Note |
|---|-------|-------------|--------------|
| 1 | Your Profile | Guest recognition across visits | Nigerian names and phone formats |
| 2 | Make a Reservation | Book room or table (optional) | Walk-ins welcome |
| 3 | Check-in Experience | Smooth arrival process | Standard check-in at 2pm |
| 4 | Dining at Restaurant | Order food and beverages | Jollof Rice ₦3,500, Chapman ₦1,500 |
| 5 | Bill Transparency | Know exactly what you owe | All charges in NGN, VAT shown |
| 6 | Check-out & Settlement | Smooth departure with final bill | Cash-friendly, bank transfer POP |

---

## 🚀 Quick Start Roles

### Configured Roles

| Role | Storyline | URL Parameter | Description |
|------|-----------|---------------|-------------|
| `owner` | hotelOwner | `?quickstart=owner` | Rooms → stays → shifts → charge facts → commerce |
| `manager` | restaurantManager | `?quickstart=manager` | Tables → orders (POS) → split bills → shifts |
| `guest` | hospitalityGuest | `?quickstart=guest` | Reservation → stay/dining → bill transparency |

### Quick Start URLs

```
/hospitality-demo?quickstart=owner
/hospitality-demo?quickstart=manager
/hospitality-demo?quickstart=guest
```

### Invalid Role Handling

- Invalid roles fail safely and show the standard demo page
- No error messages — graceful fallback to selector

---

## 🎨 UI Integration

### Demo Mode Provider

The `/hospitality-demo` page is wrapped with `DemoModeProvider`:
- URL is the single source of truth
- Stateless by default
- Clean exit → `/commerce-demo`

### Quick Start Banner

When `?quickstart=` is present:
- Role-specific banner renders at top
- Copy Demo Link functionality available
- Exit button returns to standard demo

### Demo Overlay

When in partner demo mode:
- Step-by-step guidance overlay
- Progress bar with storyline name
- Navigation (next/back/exit)

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `/lib/demo/types.ts` | Added `hotelOwner`, `restaurantManager`, `hospitalityGuest` to StorylineId |
| `/lib/demo/storylines.ts` | Added 3 new storylines with 20 steps total |
| `/lib/demo/quickstart.ts` | Added `owner`, `manager`, `guest` role mappings |
| `/app/hospitality-demo/page.tsx` | Wrapped with DemoModeProvider, added QuickStartBanner, Quick Start links |
| `/docs/hospitality-suite-s5-narrative.md` | This documentation |

---

## ✅ Verification Checklist

- [x] `/hospitality-demo?quickstart=owner` shows Hotel Owner banner
- [x] `/hospitality-demo?quickstart=manager` shows Restaurant Manager banner
- [x] `/hospitality-demo?quickstart=guest` shows Guest banner
- [x] Invalid `?quickstart=invalid` fails safely (no banner, standard page)
- [x] Copy Demo Link works for all roles
- [x] Exit button returns to standard demo
- [x] DemoModeProvider wraps the page
- [x] Storylines registered in registry
- [x] Quick Start roles map correctly to storylines
- [x] Nigeria-first notes included in all steps

---

## 🇳🇬 Nigeria-First Narrative Elements

### Walk-in First
- "Nigeria runs on walk-ins" — explicit in storylines
- No mandatory reservations
- Quick guest creation

### Cash-Friendly
- Split bills essential for group dining
- Bank transfer with POP verification
- NGN currency throughout

### Multi-Shift Operations
- Morning, Afternoon, Night shifts
- Split shift support for 24/7 operations
- Clock-in/out accountability

### Commerce Boundary
- "Hospitality emits charge facts only"
- VAT 7.5% handled by Commerce, not Hospitality
- Clean separation reinforced in every storyline

---

## 🚫 Out of Scope (S5)

- Payments UI (Commerce handles)
- Accounting UI (Commerce handles)
- Loyalty programs
- OTA integrations
- Schema changes

---

*This document follows Platform Standardisation v2 requirements.*
