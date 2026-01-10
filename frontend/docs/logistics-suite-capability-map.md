# Logistics Suite — S0–S1 Capability Mapping

## Document Info
- **Phase**: S0–S1 (Capability Mapping Only)
- **Status**: AUTHORIZED
- **Date**: January 6, 2026
- **Implementation**: NOT YET AUTHORIZED

---

## 1️⃣ Logistics Suite Overview

### What is the Logistics Suite?

The **Logistics Suite** is a **broad, cross-industry operations platform** for any organization that moves goods, people, or assets. Unlike ParkHub (which is transport-specific), Logistics Suite is industry-agnostic and serves as the foundational layer for multiple vertical configurations.

> **Key Principle**: Logistics Suite is a FOUNDATION, not an end-user vertical.
> Vertical solutions (ParkHub, Courier, Fleet Management) are CONFIGURATIONS built on top of it.

### Target Customers

| Segment | Examples | Primary Use Cases |
|---------|----------|-------------------|
| **Courier & Delivery** | GIG Logistics, Kobo360, Kwik Delivery | Package pickup, last-mile delivery, tracking |
| **Fleet Operators** | Corporate fleets, rental companies | Vehicle management, driver assignment, maintenance |
| **3PLs & Fulfillment** | Warehousing companies, Amazon-style logistics | Multi-client fulfillment, inventory movement |
| **E-commerce Last-Mile** | Jumia, Konga logistics arms | Order-to-delivery workflows |
| **Construction Logistics** | Site material delivery, equipment tracking | Asset movement, site delivery scheduling |
| **NGO & Government** | Aid distribution, census logistics | Asset tracking, field team coordination |
| **Inter-city Transport** | Motor parks, bus companies | Passenger/freight movement (via ParkHub config) |
| **Intra-city Transport** | City buses, shuttle services | Route-based passenger movement |

### Problems Solved

1. **Fragmented Operations**: Consolidates dispatch, tracking, and billing into one platform
2. **Driver/Operator Visibility**: Know where assets and people are at all times
3. **Job Assignment Chaos**: Structured dispatch → assignment → completion workflow
4. **Proof of Delivery Gap**: Digital POD with signatures, photos, timestamps
5. **Settlement Delays**: Clear billing and payment workflows
6. **Multi-stakeholder Coordination**: Owner → Dispatcher → Driver → Customer visibility

### Why Broader Than Transport?

| Traditional Transport Systems | Logistics Suite |
|-------------------------------|-----------------|
| Passengers only | Goods, people, assets, equipment |
| Routes only | Jobs, trips, deliveries, pickups |
| Buses only | Any vehicle type (bikes, trucks, vans, etc.) |
| Motor parks only | Warehouses, hubs, pickup points, delivery zones |
| Tickets only | Orders, manifests, waybills, proof-of-delivery |

---

## 2️⃣ Capability Mapping Table

### Core Logistics Capabilities (FOUNDATIONAL)

| Capability Key | Display Name | Reuse % | Source Module | Description | Status |
|----------------|--------------|---------|---------------|-------------|--------|
| `logistics_fleet` | Fleet Management | 85% | Inventory + HR | Vehicle/asset registry, maintenance scheduling, fuel tracking | NEW |
| `logistics_drivers` | Driver & Operator Management | 90% | HR Module | Driver profiles, licensing, availability, performance | EXTEND |
| `logistics_dispatch` | Dispatch Management | 60% | NEW | Job assignment, auto-dispatch, manual dispatch, load balancing | NEW |
| `logistics_trips` | Trip & Job Management | 70% | Existing (basic) | Trip lifecycle: create → assign → start → complete → settle | EXTEND |
| `logistics_tracking` | Status & Tracking | 50% | NEW | Location updates, status transitions, milestone tracking | NEW |
| `logistics_pod` | Proof of Delivery | 0% | NEW | Digital signatures, photos, delivery confirmation, exceptions | NEW |
| `logistics_billing` | Logistics Billing | 90% | Billing Module | Job-based billing, settlements, commissions, disputes | EXTEND |
| `logistics_analytics` | Operations Analytics | 85% | Analytics | Delivery rates, driver performance, route efficiency, SLAs | EXTEND |

### Extended Logistics Capabilities

| Capability Key | Display Name | Reuse % | Source Module | Description | Status |
|----------------|--------------|---------|---------------|-------------|--------|
| `logistics_lastmile` | Last-Mile Delivery | 75% | Logistics Core + CRM | E-commerce integration, address validation, delivery windows | NEW CONFIG |
| `logistics_courier` | Courier & Parcel | 70% | Logistics Core | Waybills, parcel tracking, multi-stop, sender/receiver | NEW CONFIG |
| `logistics_warehouse` | Warehouse Movement | 80% | Inventory | Inbound/outbound, bin locations, pick-pack-ship | EXTEND |
| `logistics_routing` | Multi-Stop Routing | 40% | NEW | Logical route optimization, stop sequencing, time windows | NEW |
| `logistics_sla` | SLA & Exceptions | 60% | CRM Engagement | Delivery SLAs, exception handling, escalations | NEW CONFIG |

### Capability Reuse Summary

| Category | Count | Avg Reuse % |
|----------|-------|-------------|
| Core Logistics | 8 | 66% |
| Extended Logistics | 5 | 65% |
| **Overall** | **13** | **66%** |

### Dependency Graph

```
                    ┌─────────────────────────────────────┐
                    │         LOGISTICS SUITE             │
                    │         (Foundational)              │
                    └─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│    PARKHUB    │           │   COURIER     │           │   FLEET MGT   │
│  (Transport)  │           │  (Delivery)   │           │  (Corporate)  │
│               │           │               │           │               │
│ MVM + Logs    │           │ Logs + CRM    │           │ Logs + HR     │
└───────────────┘           └───────────────┘           └───────────────┘
```

---

## 3️⃣ Gap Register

### NEW Services Required (Demo-Only Implementation)

| Gap ID | Capability | Description | Priority | Demo Approach |
|--------|------------|-------------|----------|---------------|
| **GAP-LOG-001** | Dispatch Management | Job assignment engine with auto-dispatch rules, driver availability checking, load balancing | P0 | In-memory dispatch queue |
| **GAP-LOG-002** | Tracking Service | Status update API, milestone tracking, location logging (no GPS) | P0 | In-memory status store |
| **GAP-LOG-003** | Proof of Delivery | Digital signature capture, photo upload, delivery confirmation | P1 | In-memory POD records |
| **GAP-LOG-004** | Multi-Stop Routing | Logical stop sequencing, time window assignment, route grouping | P2 | Simple sorting algorithm |
| **GAP-LOG-005** | SLA Engine | SLA definition, breach detection, exception triggers | P2 | Timer-based checks |

### Services That Will NOT Be Built (Out of Scope)

| Feature | Reason |
|---------|--------|
| Real-time GPS tracking | Requires IoT integration, mobile SDK |
| Telematics integration | Hardware dependency |
| Route optimization (AI) | Complex ML, third-party API |
| Automated dispatch (ML) | Requires training data, ML infrastructure |
| Driver mobile app | Mobile development out of scope |
| Customer tracking portal | Public-facing, requires auth flows |

### Implementation Notes

All demo implementations will:
- ✅ Use in-memory storage (no schema changes)
- ✅ Follow existing service patterns
- ✅ Be clearly marked as DEMO-ONLY
- ❌ NOT persist data across restarts
- ❌ NOT connect to external APIs
- ❌ NOT implement real GPS/telematics

---

## 4️⃣ ParkHub Alignment Section

### ParkHub as a Logistics Configuration

ParkHub is **NOT a separate system**. It is a specialized **Transport Marketplace** configuration built using:

| Layer | Source | Purpose |
|-------|--------|---------|
| **Operations** | Logistics Suite | Drivers, trips, dispatch, tracking |
| **Marketplace** | MVM | Vendors, products (routes), orders (tickets) |
| **Financial** | Payments | Commissions, settlements, wallets |
| **Customer** | CRM | Passengers, loyalty, communications |

### Feature → Capability Mapping

| ParkHub Feature | Logistics Capability | MVM Capability | Other |
|-----------------|---------------------|----------------|-------|
| Driver Management | `logistics_drivers` | - | HR Module |
| Trip Assignment | `logistics_dispatch` | - | - |
| Trip Lifecycle | `logistics_trips` | - | - |
| Trip Status Updates | `logistics_tracking` | - | - |
| Transport Company | - | `mvm` (Vendor) | - |
| Routes | - | `mvm` (Product) | - |
| Seats/Inventory | - | `mvm` (Inventory) | Inventory |
| Ticket Sales | - | `mvm` (Order) | POS |
| Park Commission | - | `mvm` (Commission) | Payments |
| Passenger Profiles | - | - | CRM |

### Reuse Percentages

| ParkHub Component | Logistics Reuse | MVM Reuse | Other Reuse |
|-------------------|-----------------|-----------|-------------|
| Driver Management | 100% | - | - |
| Trip Lifecycle | 90% | - | - |
| Dispatch | 80% | - | - |
| Status Tracking | 70% | - | - |
| Vendor/Company | - | 100% | - |
| Routes/Products | - | 100% | - |
| Ticketing/Orders | - | 100% | - |
| Commission | - | 100% | - |
| **Overall ParkHub** | **~35%** | **~50%** | **~15%** |

### What ParkHub Adds (Beyond Logistics + MVM)

| ParkHub-Specific | Description |
|------------------|-------------|
| Motor Park Branding | Park-specific labels, Nigerian transport context |
| Trip Status Workflow | SCHEDULED → BOARDING → DEPARTED → IN_TRANSIT → ARRIVED → COMPLETED |
| Park Agent POS | Walk-in ticket sales with seat selection |
| Passenger Booking UI | Public booking interface |
| Park Admin Dashboard | Park-level analytics and management |

### Architectural Confirmation

> ✅ **ParkHub is a CONFIGURATION, not a fork.**
> 
> - ParkHub does NOT duplicate Logistics or MVM code
> - ParkHub uses Logistics capabilities for operations
> - ParkHub uses MVM capabilities for marketplace
> - ParkHub adds ONLY: label overrides, UI specialization, workflow config
> - Future changes to Logistics automatically benefit ParkHub

---

## 5️⃣ Capability Registry Updates Required

### New Capabilities to Add

```typescript
// LOGISTICS DOMAIN - FOUNDATIONAL
logistics_fleet: {
  key: 'logistics_fleet',
  displayName: 'Fleet Management',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Vehicle and asset registry, maintenance scheduling, fuel tracking, and fleet utilization',
  dependencies: ['inventory'],
  icon: 'truck',
  sortOrder: 3,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_dispatch: {
  key: 'logistics_dispatch',
  displayName: 'Dispatch Management',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Job assignment, auto-dispatch rules, driver availability, and load balancing',
  dependencies: ['logistics_fleet'],
  icon: 'clipboard-list',
  sortOrder: 4,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_tracking: {
  key: 'logistics_tracking',
  displayName: 'Status & Tracking',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Location updates, status transitions, milestone tracking, and delivery visibility',
  dependencies: ['logistics_dispatch'],
  icon: 'map-marker-alt',
  sortOrder: 5,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_pod: {
  key: 'logistics_pod',
  displayName: 'Proof of Delivery',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Digital signatures, photos, delivery confirmation, and exception handling',
  dependencies: ['logistics_tracking'],
  icon: 'signature',
  sortOrder: 6,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_lastmile: {
  key: 'logistics_lastmile',
  displayName: 'Last-Mile Delivery',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'E-commerce delivery integration, address validation, and delivery windows',
  dependencies: ['logistics_dispatch', 'logistics_pod'],
  icon: 'shipping-fast',
  sortOrder: 7,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_courier: {
  key: 'logistics_courier',
  displayName: 'Courier & Parcel',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Waybill generation, parcel tracking, multi-stop routing, and sender/receiver management',
  dependencies: ['logistics_dispatch', 'logistics_pod'],
  icon: 'box',
  sortOrder: 8,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_routing: {
  key: 'logistics_routing',
  displayName: 'Multi-Stop Routing',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Logical route optimization, stop sequencing, and time window management',
  dependencies: ['logistics_dispatch'],
  icon: 'route',
  sortOrder: 9,
  metadata: { version: '1.0.0', status: 'planned' },
},

logistics_sla: {
  key: 'logistics_sla',
  displayName: 'SLA & Exceptions',
  domain: CAPABILITY_DOMAINS.LOGISTICS,
  description: 'Delivery SLA definitions, breach detection, exception handling, and escalations',
  dependencies: ['logistics_tracking'],
  icon: 'exclamation-triangle',
  sortOrder: 10,
  metadata: { version: '1.0.0', status: 'planned' },
},
```

### Existing Capability Updates

| Capability | Current | Update Required |
|------------|---------|-----------------|
| `logistics` | Generic description | Rename to `logistics_core` as umbrella |
| `parkhub` | Dependencies: [mvm, logistics, payments] | Add dependency on `logistics_dispatch`, `logistics_tracking` |

---

## 6️⃣ Nigerian Context & Use Cases

### Primary Nigerian Logistics Patterns

| Pattern | Description | Example Companies |
|---------|-------------|-------------------|
| **Intra-city Courier** | Same-day package delivery within cities | Kwik, MAX, Gokada |
| **Inter-city Freight** | Long-haul cargo between cities | GIG Logistics, Kobo360 |
| **Motor Park Operations** | Bus terminals with multiple operators | Various parks (ParkHub) |
| **E-commerce Last-Mile** | Online order fulfillment | Jumia, Konga logistics |
| **Corporate Fleet** | Company-owned vehicle management | Banks, telcos, FMCGs |
| **3PL/Fulfillment** | Outsourced logistics | GIG, DHL, UPS Nigeria |

### Nigerian-First Features

| Feature | Nigeria Context |
|---------|-----------------|
| **Phone-based Tracking** | SMS status updates (not just app) |
| **Cash-on-Delivery** | COD is dominant payment method |
| **Address Handling** | Landmarks, not street addresses |
| **Multiple Payment Methods** | Cash, transfer, mobile money |
| **Driver Verification** | NIN, driver's license, guarantor |
| **Offline Operation** | Works without constant internet |

---

## 7️⃣ Summary & Next Steps

### S0-S1 Deliverables Complete

| Deliverable | Status |
|-------------|--------|
| ✅ Logistics Suite Overview | Complete |
| ✅ Capability Mapping Table | Complete (13 capabilities) |
| ✅ Gap Register | Complete (5 gaps identified) |
| ✅ ParkHub Alignment | Complete (confirmed as configuration) |
| ✅ Registry Updates Spec | Complete |
| ✅ Nigerian Context | Complete |

### Key Architectural Decisions Confirmed

1. **Logistics is foundational** — Not tied to any single vertical
2. **ParkHub is a configuration** — Not a separate codebase
3. **66% average reuse** — Sustainable without new schemas
4. **5 new demo services** — All in-memory, clearly bounded
5. **No real-time tracking** — GPS/IoT explicitly out of scope

### Awaiting Authorization For

| Phase | Scope |
|-------|-------|
| **S2** | Core service implementation (in-memory) |
| **S3** | API routes |
| **S4** | UI pages |
| **S5** | Demo data & documentation |
| **S6** | Verification & freeze |

---

## 8️⃣ Document Metadata

| Field | Value |
|-------|-------|
| **Document Version** | 1.0.0 |
| **Created** | January 6, 2026 |
| **Author** | E1 Agent |
| **Phase** | S0-S1 (Mapping Only) |
| **Implementation Status** | NOT STARTED |
| **Dependencies** | None (mapping only) |
| **Next Phase** | S2-S5 (Pending Authorization) |

---

*This document represents capability mapping only. Implementation requires explicit authorization.*
