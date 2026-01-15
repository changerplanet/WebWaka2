# Nigeria-First Modular Commerce Enhancement Blueprint

## Document Info
- **Date**: January 2026
- **Status**: DESIGN REVIEW ONLY
- **Scope**: POS, SVM, MVM, ParkHub
- **Author**: E1 Agent
- **Phase**: Enhancement Design & Strategic Analysis

---

## SECTION A — EXECUTIVE SUMMARY

### Strategic Importance

WebWaka's commerce modules (POS, SVM, MVM, ParkHub) have the potential to become the definitive digital commerce infrastructure for Nigerian SMEs. However, realizing this potential requires a fundamental shift from Silicon Valley assumptions to Nigeria-first design principles.

**Current Reality:**
- 60%+ of Nigerian businesses operate informally or semi-formally
- 70%+ of retail transactions are cash-based
- Average mobile data speed: 8-15 Mbps (highly variable)
- Power outages: 8-12 hours daily in many regions
- Smartphone penetration: 40%, but predominantly low-end Android devices

### Key Insights

1. **Modular Commerce is the Killer Feature**: Nigerian businesses don't fit neat categories. A roadside vendor may need POS today, SVM tomorrow, and MVM next year. The ability to mix-and-match commerce channels is a massive competitive advantage—if designed correctly.

2. **Offline-First is Non-Negotiable**: Any commerce solution that fails during a power outage or network drop is unusable. Current implementation has UI patterns but lacks robust offline data layer.

3. **Product Sync is Broken by Design**: Current architecture assumes single-channel operation. Multi-channel vendors cannot selectively sync products, pricing, or inventory across POS ↔ SVM ↔ MVM.

4. **Trust Gaps Exist**: Nigerian commerce requires proof—proof of payment, proof of delivery, proof of transaction. The platform needs stronger audit trails, receipt systems, and verification workflows.

### Biggest Opportunities

| Opportunity | Impact | Effort |
|-------------|--------|--------|
| **Vendor-Controlled Product Sync** | Unlocks all multi-channel scenarios | High |
| **Offline-First Data Layer** | 10x reliability for real-world usage | High |
| **Cash-First Workflows** | Aligns with 70% of market reality | Medium |
| **Camera-First UX** | Reduces typing, increases speed | Medium |
| **PWA Optimization** | Reduces app size, enables home screen usage | Low |

---

## SECTION B — MODULE-BY-MODULE ANALYSIS

---

### B1. POS (Point of Sale)

#### Current Strengths

1. **Solid Schema Design**: `pos_shift`, `pos_sale`, `pos_sale_item`, `pos_cash_movement` models are well-structured
2. **Nigerian Currency (NGN)**: Default currency correctly set
3. **Shift-Based Operations**: Proper accountability model for cash handling
4. **Cash Movement Tracking**: Explicit tracking of cash in/out with balances
5. **Receipt Number Generation**: Customer-facing receipt numbers for accountability
6. **Multi-Location Support**: Location-based inventory integration

#### Hidden Assumptions (Problems)

| Assumption | Nigerian Reality |
|------------|------------------|
| Stable internet during transactions | Internet drops mid-sale |
| One device per register | Shared devices, multiple users |
| Digital payment dominance | Cash is 70%+ of transactions |
| Staff has dedicated devices | Personal phones used for work |
| Power is always available | Generator or nothing |
| Staff is tech-savvy | Low digital literacy |

#### Modular Sync Challenges

**Current State:**
- POS operates in isolation from SVM/MVM
- No mechanism to flag which products are "POS-only"
- Inventory deductions are local—no cross-channel awareness
- Offline sales create potential stock conflicts with online channels

**What Breaks Today:**
1. Vendor sells item in-store (POS) while same item is in SVM cart → oversell
2. Vendor wants different pricing for walk-in vs online → impossible
3. Vendor has POS + MVM (no SVM) → product sync undefined
4. POS offline sales queue syncs → no conflict resolution with SVM orders

#### Nigeria-Specific Gaps

| Gap | Description | Severity |
|-----|-------------|----------|
| **No Offline Transaction Queue** | Sales fail during network drops | Critical |
| **No Receipt Printing** | Thermal printer integration missing | High |
| **No Quick Cash Rounding** | NGN cash rarely exact, needs rounding | Medium |
| **No Daily Cash Target** | Staff incentive tracking missing | Low |
| **No Shared Device Mode** | No quick user switching | High |
| **No Bank Transfer Confirmation** | Common payment method unsupported | High |
| **No USSD/Bank Code Display** | Customer needs bank transfer details | Medium |

#### Proposed Enhancements

**P0 - Critical (Must Have)**

1. **Offline Transaction Queue**
   - IndexedDB-backed sale persistence
   - Visual sync status indicator
   - Conflict detection on sync
   - Manual conflict resolution UI

2. **Cash Rounding Module**
   - Round to nearest ₦5, ₦10, ₦50
   - Display rounding in receipt
   - Track cumulative rounding adjustments

3. **Bank Transfer Workflow**
   - Display bank account details
   - Transfer confirmation button
   - Reference number capture
   - Timeout auto-marking

**P1 - Should Have**

4. **Quick User Switch**
   - PIN-based fast authentication
   - Maintain open shift
   - Per-user transaction attribution

5. **Receipt Printing Integration**
   - Web Bluetooth for thermal printers
   - SMS/WhatsApp receipt fallback
   - QR code for digital verification

6. **Daily Cash Reconciliation**
   - Expected vs actual cash
   - Variance explanation capture
   - Manager approval for discrepancies

**P2 - Nice to Have**

7. **Voice Search for Products**
   - Nigerian accent optimization
   - Product name fuzzy matching

8. **Dual Currency Display**
   - NGN + USD equivalent
   - For businesses with foreign suppliers

#### Mobile/Offline Strategy

```
┌─────────────────────────────────────────┐
│         POS OFFLINE ARCHITECTURE        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │     IndexedDB (Local Cache)         │ │
│ │  • Products (full catalog)          │ │
│ │  • Customers (recent 500)           │ │
│ │  • Pending Sales (queue)            │ │
│ │  • Shift State                      │ │
│ └─────────────────────────────────────┘ │
│                  │                      │
│                  ▼                      │
│ ┌─────────────────────────────────────┐ │
│ │     Sync Engine (Service Worker)    │ │
│ │  • On reconnect: push pending sales │ │
│ │  • Pull: price updates, new products│ │
│ │  • Conflict: flag for manual review │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Priority Matrix

| Enhancement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Offline Transaction Queue | P0 | High | Critical |
| Cash Rounding | P0 | Low | High |
| Bank Transfer Workflow | P0 | Medium | High |
| Quick User Switch | P1 | Medium | Medium |
| Receipt Printing | P1 | High | High |
| Daily Reconciliation | P1 | Medium | Medium |

---

### B2. Single Vendor Marketplace (SVM)

#### Current Strengths

1. **Comprehensive Cart System**: Persistent carts, guest checkout, session recovery
2. **Full Checkout Flow**: 4-step wizard with shipping, delivery, payment, review
3. **Promotions Engine**: Percentage, fixed, free shipping, BOGO—all implemented
4. **Shipping Zones**: Weight-based, price-based, flat rate shipping
5. **Order Management**: Status tracking, event logging, order numbers
6. **Nigerian Context Awareness**: Cash-on-delivery mentioned in capability map
7. **~90% Capability Compliance**: Mostly feature-complete

#### Hidden Assumptions (Problems)

| Assumption | Nigerian Reality |
|------------|------------------|
| Credit card payment | Bank transfer, USSD, cash-on-delivery |
| Precise addresses | "Beside the yellow building" |
| Reliable delivery tracking | Manual status updates |
| Customer has email | WhatsApp preferred |
| International shipping | 99% domestic |
| Desktop browsing | 85%+ mobile users |

#### Modular Sync Challenges

**Current State:**
- SVM owns its product catalog view but relies on Core `Product` model
- No concept of "channel visibility" for products
- No pricing divergence between POS and SVM
- No inventory partitioning (POS vs SVM stock)

**What Breaks Today:**
1. Vendor uses POS + SVM → same product, same price, no channel control
2. Vendor wants in-store-only deals → impossible to hide from SVM
3. Vendor sells on SVM while POS is offline → inventory conflict
4. Vendor disables SVM temporarily → no graceful channel toggle

#### Nigeria-Specific Gaps

| Gap | Description | Severity |
|-----|-------------|----------|
| **No Bank Transfer Flow** | Dominant payment method unsupported | Critical |
| **No USSD Payment** | Required for non-smartphone users | High |
| **No WhatsApp Order Confirmation** | Email ignored, WhatsApp trusted | High |
| **No Address Landmark Input** | "Near the market" is valid | Medium |
| **No Cash-on-Delivery Workflow** | Just a payment option, no operational flow | High |
| **No Order Negotiation** | Price haggling is cultural norm | Low |
| **No Social Sharing** | WhatsApp product links | Medium |

#### Proposed Enhancements

**P0 - Critical**

1. **Bank Transfer Payment Flow**
   - Display merchant bank details on checkout
   - Reference number generation
   - Transfer confirmation upload (proof)
   - Admin verification dashboard
   - Timeout auto-cancel with notification

2. **WhatsApp Integration**
   - Order confirmation via WhatsApp
   - Shipping updates via WhatsApp
   - Click-to-WhatsApp for support
   - Product share to WhatsApp

3. **Cash-on-Delivery Workflow**
   - COD order flagging
   - Delivery confirmation capture
   - COD collection tracking
   - Failed delivery handling

**P1 - Should Have**

4. **Landmark-Based Addressing**
   - Free-text landmark field
   - Popular landmark suggestions
   - LGA/State hierarchy
   - Saved addresses with landmarks

5. **Mobile-First Checkout Redesign**
   - Single-page checkout (accordion)
   - 44px minimum tap targets
   - Thumb-zone action buttons
   - Minimal keyboard input

6. **Offline Cart Persistence**
   - Cart survives app close
   - Cart recovers after network drop
   - Checkout resume capability

**P2 - Nice to Have**

7. **Social Proof Integration**
   - Recent purchases ticker
   - Customer reviews
   - Trust badges

8. **Installment Payment Display**
   - "₦5,000/month for 4 months"
   - Partner with Nigerian BNPL providers

#### Mobile/Offline Strategy

**PWA Improvements:**
- Compress product images (WebP, 50KB max)
- Lazy load below-fold content
- Cache recently viewed products
- Persist cart in IndexedDB
- Clear "You're offline" banner with retry

**One-Hand Usage:**
- Bottom navigation bar
- Floating "View Cart" button (bottom-right)
- Swipe-to-add-to-cart on product cards
- Pull-down to refresh

#### Priority Matrix

| Enhancement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Bank Transfer Flow | P0 | Medium | Critical |
| WhatsApp Integration | P0 | Medium | High |
| COD Workflow | P0 | Medium | High |
| Landmark Addressing | P1 | Low | Medium |
| Mobile Checkout Redesign | P1 | Medium | High |
| Offline Cart | P1 | Medium | Medium |

---

### B3. Multi-Vendor Marketplace (MVM)

#### Current Strengths

1. **Tier Engine Logic**: Commission rates, qualification rules, tier assignment
2. **Vendor Performance Scoring**: Algorithm exists for vendor evaluation
3. **Data Isolation Patterns**: `VendorDataAccess.sanitizeCustomerData()` implemented
4. **Period Comparison Analytics**: MoM calculation logic exists
5. **Product Mapping Concept**: Vendor-to-product mapping types defined

#### Hidden Assumptions (Problems)

| Assumption | Nigerian Reality |
|------------|------------------|
| Vendors are formal businesses | Informal traders, no business registration |
| Bank details readily available | Bank verification complex |
| Commission paid monthly | Daily/weekly payouts expected |
| Vendors manage own inventory | Shared stock, consignment common |
| Disputes resolved online | In-person resolution preferred |

#### Current State: Mostly MOCKED

**Critical Finding:** MVM is only ~20% implemented. Most capabilities exist as UI components with demo data, but lack API backends and database persistence.

**Implemented (3/68 capabilities):**
- Vendor slug generation
- Vendor profile validation
- Tier-based commission logic

**Mocked (40+ capabilities):**
- Vendor dashboard (demo data)
- Order management (demo orders)
- Commission tracking (demo calculations)
- Product mapping UI (no persistence)

**Missing (25+ capabilities):**
- Vendor registration flow
- Order splitting (parent → sub-orders)
- Payout processing
- Admin marketplace management
- Multi-vendor storefront

#### Modular Sync Challenges

**This is the Core Problem:**

MVM is designed to source products from Core catalog, but there's no mechanism for:
1. Vendors to opt products in/out of marketplace
2. Vendors to set marketplace-specific pricing
3. Inventory allocation between vendor's own channels and marketplace
4. Stock conflicts when vendor sells via POS while MVM order comes in

**What Breaks Today:**
1. Vendor has POS + MVM (no SVM) → undefined how products appear in MVM
2. Vendor disables MVM temporarily → no lifecycle handling
3. Vendor's POS sale depletes stock → MVM doesn't know
4. MVM order comes in → vendor's POS inventory not updated

#### Nigeria-Specific Gaps

| Gap | Description | Severity |
|-----|-------------|----------|
| **No Informal Vendor Onboarding** | No BVN, CAC optional | Critical |
| **No Daily Payout Option** | Cash flow sensitivity | High |
| **No Mobile Money Payout** | Not everyone has bank | High |
| **No Vendor WhatsApp Notifications** | Email ignored | High |
| **No Consignment Model** | Marketplace holds stock | Medium |
| **No Market Day Scheduling** | Different availability by day | Low |
| **No Vendor Location Mapping** | "Stall 23, Computer Village" | Medium |

#### Proposed Enhancements

**P0 - Critical (Before MVM is usable)**

1. **Complete Vendor Registration API**
   - Self-serve registration form
   - Phone number verification (OTP)
   - Optional BVN/CAC
   - Bank details collection
   - Admin approval workflow

2. **Order Splitting Implementation**
   - Parent order → vendor sub-orders
   - Sub-order status isolation
   - Vendor fulfillment tracking
   - Customer unified view

3. **Payout Execution Engine**
   - Daily, weekly, monthly options
   - Minimum threshold configuration
   - Bank transfer integration
   - Payout history for vendors

4. **Multi-Vendor Storefront**
   - Unified product catalog
   - Vendor filter
   - Vendor profile pages
   - Add-to-cart with vendor attribution

**P1 - Should Have**

5. **Vendor WhatsApp Notifications**
   - New order alerts
   - Daily summary
   - Payout confirmation

6. **Vendor Mobile Dashboard**
   - Mobile-first order management
   - One-tap status updates
   - Earnings visibility

7. **Informal Vendor Support**
   - Phone-only registration
   - Mobile money payouts
   - No email required

**P2 - Nice to Have**

8. **Vendor Rating System**
   - Customer reviews
   - Order fulfillment score
   - Response time tracking

9. **Marketplace Analytics**
   - Top vendors
   - Category performance
   - Revenue trends

#### Mobile/Offline Strategy

**Vendor Dashboard:**
- Card-based order list (not tables)
- Swipe gestures for status updates
- Offline order viewing (cached)
- Sync status indicator
- Background order notifications

**Marketplace Storefront:**
- Infinite scroll product grid
- Skeleton loading states
- Image lazy loading
- Vendor logo caching

#### Priority Matrix

| Enhancement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Vendor Registration API | P0 | High | Critical |
| Order Splitting | P0 | High | Critical |
| Payout Execution | P0 | High | Critical |
| Multi-Vendor Storefront | P0 | High | Critical |
| Vendor WhatsApp Notifications | P1 | Medium | High |
| Vendor Mobile Dashboard | P1 | Medium | High |
| Informal Vendor Support | P1 | Medium | High |

---

### B4. ParkHub

#### Current Strengths

1. **Capability Composition**: Built on MVM + Logistics + Payments—no schema duplication
2. **Clear Concept Mapping**: MVM Vendor = Transport Company, Product = Route, Order = Ticket
3. **Multi-Role Architecture**: Park Admin, Operator, Agent, Passenger
4. **Trip Lifecycle**: Full status workflow defined
5. **Commission Model**: Transparent platform fee structure
6. **Offline Mention**: Documentation mentions offline POS capability

#### Hidden Assumptions (Problems)

| Assumption | Nigerian Reality |
|------------|------------------|
| Online booking dominance | Walk-up purchases dominate |
| Reliable bus schedules | Buses leave when full |
| Driver has smartphone | Feature phones common |
| GPS tracking works | Network dead zones |
| Passenger has email | Phone number only |

#### Current State: Configuration Layer

ParkHub is primarily a "configuration" of MVM for transport. It defines:
- UI labels (Vendor → Transport Company)
- Routes for park-specific dashboards
- Activation workflow for partners

**What's Actually Implemented:**
- API endpoints for config and activation
- Demo data seeding
- Route definitions

**What's Missing:**
- POS Agent interface for walk-up sales
- Driver mobile app
- Real-time trip tracking
- Cash reconciliation for parks
- Multi-park management

#### Modular Sync Challenges

**ParkHub + POS Interaction:**

Parks have a unique pattern: they need POS for walk-up ticket sales, but tickets aren't "inventory" in the traditional sense. A bus route has:
- Scheduled departure time
- Seat capacity (dynamic inventory)
- Price (may vary by demand)

**What Breaks Today:**
1. Agent sells ticket at counter (POS mode) → needs to deduct from route capacity
2. Passenger books online → same seat capacity affected
3. Bus leaves → remaining capacity becomes zero (trip closes)
4. Different buses on same route → capacity is per-trip, not per-route

#### Nigeria-Specific Gaps

| Gap | Description | Severity |
|-----|-------------|----------|
| **No "Leave When Full" Model** | Scheduled departure unrealistic | Critical |
| **No Walk-Up POS Interface** | Agents need fast ticket sales | Critical |
| **No Cash Collection Tracking** | Park agents handle cash | High |
| **No Driver Feature Phone Support** | SMS-based status updates | High |
| **No Manifest Printing** | Paper manifest for checkpoints | High |
| **No Park Levy Calculation** | Loading fees, NURTW dues | Medium |
| **No Luggage Fee Handling** | Extra bags cost extra | Medium |

#### Proposed Enhancements

**P0 - Critical**

1. **Walk-Up POS Interface**
   - Fast ticket sale (≤3 taps)
   - Route search by destination
   - Next available bus display
   - Seat selection visual
   - Receipt printing
   - Cash/transfer toggle

2. **Dynamic Departure Model**
   - "Leaves when full" status
   - Seat threshold for departure
   - Live seat count display
   - Auto-trigger boarding when threshold met

3. **Cash Reconciliation**
   - Per-agent cash tracking
   - Shift open/close with float
   - Commission deduction at source
   - Daily cash handover workflow

**P1 - Should Have**

4. **SMS-Based Driver Updates**
   - Trip assignment via SMS
   - Status update via SMS reply
   - No app required
   - Fallback for offline areas

5. **Manifest Generation**
   - Printable passenger list
   - Checkpoint verification
   - QR code for digital validation

6. **Park Agent Dashboard**
   - Today's trips overview
   - Quick access to active routes
   - Earnings summary
   - Commission visibility

**P2 - Nice to Have**

7. **Multi-Park Operator View**
   - Operators with buses in multiple parks
   - Consolidated earnings
   - Fleet distribution

8. **Passenger SMS Ticket**
   - Booking confirmation via SMS
   - Ticket code for boarding
   - Trip status updates

#### Mobile/Offline Strategy

**Agent POS (Critical Path):**
- Must work 100% offline
- Cache today's trips and routes
- Queue ticket sales
- Sync on reconnect
- Print to Bluetooth thermal printer
- Show offline indicator clearly

**Passenger Booking:**
- Progressive loading
- Optimistic seat selection
- Timeout with retry for slow networks

#### Priority Matrix

| Enhancement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Walk-Up POS Interface | P0 | High | Critical |
| Dynamic Departure Model | P0 | Medium | Critical |
| Cash Reconciliation | P0 | Medium | High |
| SMS Driver Updates | P1 | Medium | High |
| Manifest Generation | P1 | Low | High |
| Park Agent Dashboard | P1 | Medium | Medium |

---

## SECTION C — CROSS-MODULE SYNC ARCHITECTURE (DESIGN ONLY)

### The Fundamental Problem

Current architecture assumes:
```
Product (Core) → One Price → One Inventory Level → All Channels
```

Nigeria-first reality requires:
```
Product (Core) → Channel-Specific Config → Channel-Specific Price → Channel-Specific Stock
```

### Product Master Strategy

**Proposed: Core Product Remains Master**

```
┌─────────────────────────────────────────────────────────────┐
│                    Product (Core Master)                    │
│  • SKU, Name, Description, Images, Cost                     │
│  • Base Price (reference only)                              │
│  • Total Inventory (sum of all channels)                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ ChannelConfig │   │ ChannelConfig │   │ ChannelConfig │
│     (POS)     │   │     (SVM)     │   │     (MVM)     │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ isVisible     │   │ isVisible     │   │ isVisible     │
│ channelPrice  │   │ channelPrice  │   │ channelPrice  │
│ allocatedStock│   │ allocatedStock│   │ allocatedStock│
│ syncInventory │   │ syncInventory │   │ syncInventory │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Channel Visibility Model

**Proposed Data Structure:**

```typescript
interface ProductChannelConfig {
  productId: string;
  tenantId: string;
  channel: 'POS' | 'SVM' | 'MVM';
  
  // Visibility
  isVisible: boolean;           // Show in this channel?
  
  // Pricing
  useBasePrice: boolean;        // Use Core product price?
  channelPrice?: Decimal;       // Override price for this channel
  
  // Inventory
  inventoryMode: 'SHARED' | 'ALLOCATED' | 'UNLIMITED';
  allocatedQuantity?: number;   // If ALLOCATED, how many?
  
  // Sync Rules
  syncInventory: boolean;       // Sync with other channels?
  syncPrice: boolean;           // Sync price changes?
  
  // Channel-Specific
  minOrderQuantity?: number;    // Minimum per order
  maxOrderQuantity?: number;    // Maximum per order
}
```

**Visibility Rules:**

| Scenario | POS | SVM | MVM | Behavior |
|----------|-----|-----|-----|----------|
| Vendor has POS only | ✅ | - | - | Product in POS catalog |
| Vendor has SVM only | - | ✅ | - | Product in storefront |
| Vendor has POS + SVM | ✅ | ✅ | - | Product in both, inventory synced |
| Vendor has POS + MVM | ✅ | - | ✅ | Product in POS and marketplace |
| Vendor hides from MVM | ✅ | ✅ | ❌ | Not available to resellers |

### Inventory Synchronization Rules

**Proposed Modes:**

1. **SHARED Mode** (Default)
   - All channels draw from same pool
   - Real-time sync across channels
   - Conflict: last-write-wins with audit log

2. **ALLOCATED Mode**
   - Fixed quantity reserved per channel
   - No cross-channel deduction
   - Manual reallocation required

3. **UNLIMITED Mode** (Services)
   - No inventory tracking
   - Suitable for digital products, services

**Sync Behavior:**

```
┌─────────────────────────────────────────┐
│         Inventory Sync Engine           │
├─────────────────────────────────────────┤
│ 1. Sale Event (any channel)             │
│    ↓                                    │
│ 2. Check inventoryMode                  │
│    ↓                                    │
│ 3. If SHARED:                           │
│    - Deduct from Core inventory         │
│    - Broadcast to other channels        │
│    - Update channel displays            │
│                                         │
│ 4. If ALLOCATED:                        │
│    - Deduct from channel allocation     │
│    - No cross-channel update            │
│                                         │
│ 5. If UNLIMITED:                        │
│    - No inventory update                │
└─────────────────────────────────────────┘
```

### Pricing Divergence Model

**Proposed Rules:**

1. **Base Price** in Core Product is reference
2. **Channel Price** can override per-channel
3. **MVM Vendor Price** can further override within MVM constraints

```
Core Product Base Price: ₦10,000
  │
  ├── POS: ₦10,000 (uses base)
  ├── SVM: ₦12,000 (marked up for delivery margin)
  └── MVM: ₦11,000 (marketplace price)
        └── Vendor A Price: ₦10,500 (within MVM min/max)
```

### Offline Conflict Resolution

**Scenario: POS Offline Sale + SVM Order**

1. POS sells 3 units offline (queued)
2. SVM receives order for 2 units (processed)
3. POS comes online, syncs 3-unit sale
4. Inventory: started with 5, now -0 (should be 0)

**Resolution Strategy:**

| Conflict Type | Resolution | User Experience |
|---------------|------------|-----------------|
| Mild oversell (1-2 units) | Auto-accept, flag for review | Order proceeds, vendor notified |
| Severe oversell (>2 units) | Hold for manual review | Latest order paused, vendor decides |
| Price mismatch | Use order-time price | Honor customer's quoted price |
| Channel disabled during offline | Auto-enable, process sale | Sale completes, re-disable channel |

### Channel Enable/Disable Lifecycle

**Proposed States:**

```
INACTIVE → ACTIVE → PAUSED → ACTIVE
     ↓                  ↓
   NEVER              PENDING (sync queue)
   ENABLED
```

**Behavior When Disabled:**

| Channel State | New Sales | Pending Orders | Visibility |
|---------------|-----------|----------------|------------|
| ACTIVE | ✅ Allowed | ✅ Processing | Visible |
| PAUSED | ❌ Blocked | ✅ Processing | Hidden |
| INACTIVE | ❌ Blocked | ❌ Cancelled | Hidden |

---

## SECTION D — PRIORITIZED ENHANCEMENT BACKLOG

| # | Enhancement | Module(s) | Priority | Effort | Impact | Dependencies |
|---|-------------|-----------|----------|--------|--------|--------------|
| 1 | **Product Channel Config System** | All | P0 | High | Critical | Core schema |
| 2 | **Offline Transaction Queue** | POS | P0 | High | Critical | IndexedDB |
| 3 | **Bank Transfer Payment Flow** | SVM, POS | P0 | Medium | Critical | None |
| 4 | **Vendor Registration API** | MVM | P0 | High | Critical | None |
| 5 | **Order Splitting Engine** | MVM | P0 | High | Critical | Vendor API |
| 6 | **Walk-Up POS Interface** | ParkHub | P0 | High | Critical | POS base |
| 7 | **Cash Rounding Module** | POS | P0 | Low | High | None |
| 8 | **WhatsApp Integration** | SVM, MVM | P0 | Medium | High | WhatsApp API |
| 9 | **COD Workflow** | SVM | P0 | Medium | High | None |
| 10 | **Payout Execution Engine** | MVM | P0 | High | Critical | Bank API |
| 11 | **Dynamic Departure Model** | ParkHub | P0 | Medium | Critical | None |
| 12 | **Multi-Vendor Storefront** | MVM | P0 | High | Critical | Product sync |
| 13 | **Quick User Switch** | POS | P1 | Medium | Medium | Auth |
| 14 | **Receipt Printing** | POS | P1 | High | High | Bluetooth |
| 15 | **Landmark Addressing** | SVM | P1 | Low | Medium | None |
| 16 | **Mobile Checkout Redesign** | SVM | P1 | Medium | High | None |
| 17 | **Vendor WhatsApp Notifications** | MVM | P1 | Medium | High | WhatsApp API |
| 18 | **SMS Driver Updates** | ParkHub | P1 | Medium | High | SMS API |
| 19 | **Manifest Generation** | ParkHub | P1 | Low | High | None |
| 20 | **Cash Reconciliation** | ParkHub | P0 | Medium | High | POS base |
| 21 | **Daily Cash Reconciliation** | POS | P1 | Medium | Medium | Shift model |
| 22 | **Offline Cart Persistence** | SVM | P1 | Medium | Medium | IndexedDB |
| 23 | **Vendor Mobile Dashboard** | MVM | P1 | Medium | High | None |
| 24 | **Informal Vendor Support** | MVM | P1 | Medium | High | Registration |
| 25 | **Voice Product Search** | POS | P2 | Medium | Low | Speech API |
| 26 | **Social Proof Integration** | SVM | P2 | Low | Low | None |
| 27 | **Installment Display** | SVM | P2 | Low | Medium | BNPL partner |
| 28 | **Vendor Rating System** | MVM | P2 | Medium | Medium | Orders |
| 29 | **Multi-Park View** | ParkHub | P2 | High | Medium | MVM base |
| 30 | **SMS Ticket** | ParkHub | P2 | Medium | Medium | SMS API |

---

## SECTION E — PHASED ROLLOUT RECOMMENDATION

### Phase N1: Quick Wins (0–4 Weeks)

**Objective**: Immediate usability improvements without schema changes

| Enhancement | Module | Effort | Why Now? |
|-------------|--------|--------|----------|
| Cash Rounding Module | POS | Low | Immediate UX improvement |
| Bank Transfer Display | SVM | Low | Just UI, no backend change |
| Landmark Input Field | SVM | Low | Form field addition |
| Mobile Checkout Improvements | SVM | Medium | CSS + layout changes |
| Product Channel Visibility Toggle | All | Medium | Feature flag approach |

**Deliverables:**
- Cash rounding in POS sale flow
- Bank details display in SVM checkout
- Landmark text field in SVM addresses
- Improved mobile checkout layout
- Admin toggle for "Show in POS/SVM/MVM"

### Phase N2: Structural Improvements (1–3 Months)

**Objective**: Core architecture for multi-channel commerce

| Enhancement | Module | Effort | Why Now? |
|-------------|--------|--------|----------|
| Product Channel Config Schema | All | High | Foundation for all sync |
| Offline Transaction Queue | POS | High | Reliability requirement |
| Bank Transfer Payment Flow | SVM, POS | Medium | Revenue enablement |
| Vendor Registration API | MVM | High | MVM is non-functional without it |
| Order Splitting Engine | MVM | High | Core MVM capability |
| Walk-Up POS Interface | ParkHub | High | ParkHub is unusable without it |

**Deliverables:**
- New `ProductChannelConfig` model
- IndexedDB-backed offline queue for POS
- Full bank transfer workflow with verification
- Vendor self-registration and approval
- Parent order → sub-order splitting
- ParkHub agent ticket sale interface

### Phase N3: Platform Differentiators (3–6 Months)

**Objective**: Features that make WebWaka uniquely powerful in Nigeria

| Enhancement | Module | Effort | Why Now? |
|-------------|--------|--------|----------|
| WhatsApp Integration | All | High | Customer expectation |
| Payout Execution Engine | MVM | High | Vendor retention |
| Receipt Printing | POS | High | Formal business requirement |
| SMS Driver Updates | ParkHub | Medium | Driver accessibility |
| Inventory Sync Engine | All | High | Multi-channel reliability |
| Vendor Mobile Dashboard | MVM | Medium | Vendor self-service |

**Deliverables:**
- WhatsApp Business API integration
- Automated vendor payouts
- Bluetooth thermal printer support
- SMS-based trip status for drivers
- Real-time cross-channel inventory sync
- Mobile-optimized vendor dashboard

---

## SECTION F — EXPLICIT CONFIRMATIONS

I explicitly confirm:

- ❌ **No code written** — This document contains design proposals only
- ❌ **No schema changes** — All schema proposals are for future consideration
- ❌ **No API changes** — All API proposals are for future consideration  
- ❌ **No deployments** — This is a design review document

---

## 🛑 HARD STOP

This design review is complete.

**No implementation will proceed without explicit approval per enhancement group.**

Awaiting review and prioritization decisions.

---

*Document prepared with Nigeria-first mindset: designed for market traders with poor network, roadside vendors with one phone, supermarkets with POS + online sales, resellers on marketplaces, and park operators managing daily cash flow.*
