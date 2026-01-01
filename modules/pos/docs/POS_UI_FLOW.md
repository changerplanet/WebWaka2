# POS UI Flow & Offline UX Design

## Version: pos-ui-v1.0.0
## Phase 6 Complete

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Touch-first** | Large tap targets (min 48px), swipe gestures, no hover states |
| **Fast checkout** | ≤3 taps from product to payment |
| **Works offline** | All core flows functional without network |
| **Minimal depth** | Max 2 levels of navigation |

---

## Screen Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      POS APPLICATION                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   REGISTER   │    │    SALE      │    │   SETTINGS   │   │
│  │   SCREEN     │───▶│   SCREEN     │    │   SCREEN     │   │
│  │ (Open/Close) │    │   (Main)     │    │  (Manager)   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                    │           │
│         ▼                   ▼                    ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │    SHIFT     │    │   PAYMENT    │    │   REPORTS    │   │
│  │   SCREEN     │    │    MODAL     │    │    MODAL     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                             │                                │
│                             ▼                                │
│                      ┌──────────────┐                        │
│                      │   RECEIPT    │                        │
│                      │   SCREEN     │                        │
│                      └──────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Flows

### Flow 1: Start Shift & Open Register

```
[App Launch]
    │
    ▼
┌─────────────────┐     No active     ┌─────────────────┐
│  Check Active   │────────────────▶ │  Open Register  │
│     Shift       │     shift        │     Screen      │
└─────────────────┘                   └─────────────────┘
    │                                        │
    │ Has active shift                       │ Enter opening cash
    ▼                                        ▼
┌─────────────────┐                   ┌─────────────────┐
│   Sale Screen   │◀─────────────────│  Start Shift    │
│     (Main)      │                   │     Button      │
└─────────────────┘                   └─────────────────┘
```

**Offline Behavior:**
- ✅ Can open register offline (queued for sync)
- ✅ Opening cash stored locally
- ⚠️ Shows "Offline" indicator

---

### Flow 2: Quick Sale (Happy Path)

```
[Sale Screen]
    │
    │ Tap product / Scan barcode / Search
    ▼
┌─────────────────┐
│  Product Added  │──▶ Cart updates instantly
│    to Cart      │    (optimistic UI)
└─────────────────┘
    │
    │ Tap "Pay" button
    ▼
┌─────────────────┐
│ Payment Method  │──▶ Cash / Card / Split
│    Selection    │
└─────────────────┘
    │
    │ Process payment
    ▼
┌─────────────────┐
│    Receipt      │──▶ Print / Email / Skip
│    Screen       │
└─────────────────┘
    │
    │ Auto-return (3s) or tap
    ▼
[Sale Screen - Ready for next customer]
```

**Tap Count: 3** (Product → Pay → Payment Method)

**Offline Behavior:**
- ✅ Products loaded from IndexedDB cache
- ✅ Cart persisted locally
- ✅ Cash payments work offline
- ⚠️ Card payments queued (show warning)
- ✅ Receipt generated locally

---

### Flow 3: Cart Management

```
┌─────────────────────────────────────────────────────────┐
│                     SALE SCREEN                          │
├────────────────────────┬────────────────────────────────┤
│                        │                                 │
│   PRODUCT GRID         │         CART                   │
│   ┌─────┐ ┌─────┐     │   ┌─────────────────────────┐  │
│   │ 🍕 │ │ 🍔 │     │   │ Pizza      $12.99  x1  │  │
│   └─────┘ └─────┘     │   │ [−] [qty] [+] [🗑️]    │  │
│   ┌─────┐ ┌─────┐     │   ├─────────────────────────┤  │
│   │ 🥤 │ │ 🍟 │     │   │ Burger     $9.99   x2  │  │
│   └─────┘ └─────┘     │   │ [−] [qty] [+] [🗑️]    │  │
│                        │   └─────────────────────────┘  │
│   [🔍 Search]         │                                 │
│   [📷 Scan]           │   Subtotal:     $32.97         │
│                        │   Tax (8.25%):   $2.72         │
│                        │   ─────────────────────        │
│                        │   TOTAL:        $35.69         │
│                        │                                 │
│   [≡ Menu]            │   [HOLD] [DISCOUNT] [PAY →]    │
│                        │                                 │
└────────────────────────┴────────────────────────────────┘
```

**Touch Interactions:**
- Tap product → Add to cart (qty 1)
- Long press product → Qty picker modal
- Swipe cart item left → Delete
- Tap qty → Edit quantity inline

---

### Flow 4: Payment Processing

```
┌─────────────────────────────────────────────────────────┐
│                   PAYMENT SCREEN                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              Amount Due: $35.69                          │
│                                                          │
│   ┌───────────────────────────────────────────────┐     │
│   │                                               │     │
│   │     💵 CASH          💳 CARD                 │     │
│   │                                               │     │
│   │     📱 MOBILE        🔀 SPLIT                │     │
│   │                                               │     │
│   └───────────────────────────────────────────────┘     │
│                                                          │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Quick Cash:                                    │   │
│   │  [$20] [$40] [$50] [$100] [EXACT]              │   │
│   └─────────────────────────────────────────────────┘   │
│                                                          │
│                    [← BACK]                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Cash Payment Sub-flow:**
```
[Select Cash] → [Enter/Select Amount] → [Show Change] → [Complete]
```

**Offline Behavior:**
- ✅ Cash: Fully functional
- ⚠️ Card: Shows "Offline - Payment will process when online"
- ⚠️ Mobile: Shows "Requires connection"
- ✅ Split (cash portion): Functional

---

### Flow 5: Suspend/Resume Sale

```
[Sale in progress]
    │
    │ Tap "HOLD" button
    ▼
┌─────────────────┐
│  Enter Note     │──▶ Optional: "Customer went to ATM"
│   (Optional)    │
└─────────────────┘
    │
    ▼
[Sale suspended - saved locally]
[New sale screen ready]

...later...

[Tap "Held Sales" button]
    │
    ▼
┌─────────────────┐
│  Held Sales     │──▶ List of suspended sales
│     List        │    Shows note, time, total
└─────────────────┘
    │
    │ Tap to resume
    ▼
[Sale restored to cart]
```

**Offline Behavior:**
- ✅ Suspend works offline
- ✅ Resume works offline
- ✅ Held sales persist in IndexedDB

---

## Offline UX Patterns

### 1. Connection Status Indicator

```
┌─────────────────────────────────────────┐
│ ● Online                    [Connected] │  ← Green dot
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ○ Offline - Sales will sync when online │  ← Yellow dot
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️ Offline (12 pending) [Retry]         │  ← Red when items queued
└─────────────────────────────────────────┘
```

**Placement:** Top-right corner, always visible, non-blocking

---

### 2. Optimistic UI Updates

| Action | UI Behavior | Sync Behavior |
|--------|-------------|---------------|
| Add item | Instant add | Queue for sync |
| Update qty | Instant update | Queue for sync |
| Remove item | Instant remove | Queue for sync |
| Apply discount | Instant apply | Queue for sync |
| Complete sale | Instant receipt | Queue for sync |

**Conflict Resolution:**
- Last-write-wins for qty changes
- Server-authoritative for inventory counts
- Show "Syncing..." indicator on pending items

---

### 3. Offline-Safe vs Online-Required Actions

```
┌─────────────────────────────────────────────────────────┐
│                    OFFLINE-SAFE ✅                       │
├─────────────────────────────────────────────────────────┤
│ • Create sale                                           │
│ • Add/remove items                                      │
│ • Apply preset discounts                                │
│ • Cash payments                                         │
│ • Suspend/resume sales                                  │
│ • Open register                                         │
│ • Start/end shift                                       │
│ • View product catalog (cached)                         │
│ • Generate receipt                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  ONLINE-REQUIRED ⚠️                      │
├─────────────────────────────────────────────────────────┤
│ • Card payment processing                               │
│ • Real-time inventory check                             │
│ • Customer lookup (new customers)                       │
│ • Custom discount approval                              │
│ • Refund without receipt                                │
│ • Price override > threshold                            │
│ • Manager approval requests                             │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Offline Queue Visualization

When offline with pending actions:

```
┌─────────────────────────────────────────────────────────┐
│  ⏳ Pending Sync (3 items)                    [Details] │
├─────────────────────────────────────────────────────────┤
│  ✓ Sale #001 - $35.69 - Ready to sync                  │
│  ✓ Sale #002 - $12.50 - Ready to sync                  │
│  ⚠️ Sale #003 - $89.00 - Card pending                   │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Graceful Degradation Messages

| Scenario | Message |
|----------|---------|
| Go offline | "Working offline. Sales will sync when connected." |
| Card payment offline | "Card payments require connection. Use cash or hold sale." |
| Come back online | "Back online! Syncing 3 sales..." |
| Sync complete | "All sales synced ✓" (auto-dismiss 3s) |
| Sync conflict | "Sale #001 needs review" (tap for details) |
| Inventory warning | "Stock may have changed. Verify after sync." |

---

## Component Architecture

```
src/
├── app/
│   └── pos/                    # POS pages (Next.js App Router)
│       ├── page.tsx            # Main POS screen
│       ├── register/
│       │   └── page.tsx        # Register open/close
│       ├── shift/
│       │   └── page.tsx        # Shift management
│       └── settings/
│           └── page.tsx        # POS settings (manager)
│
├── components/
│   └── pos/                    # POS UI components
│       ├── ProductGrid.tsx     # Product selection grid
│       ├── Cart.tsx            # Shopping cart
│       ├── CartItem.tsx        # Individual cart item
│       ├── PaymentModal.tsx    # Payment flow
│       ├── ReceiptView.tsx     # Receipt display
│       ├── QuickCash.tsx       # Cash denomination buttons
│       ├── HeldSales.tsx       # Suspended sales list
│       ├── ConnectionStatus.tsx # Online/offline indicator
│       ├── SyncQueue.tsx       # Pending sync display
│       └── NumPad.tsx          # Touch numpad for qty/price
│
├── hooks/
│   └── pos/
│       ├── useCart.ts          # Cart state management
│       ├── useOfflineQueue.ts  # Offline queue management
│       ├── useProducts.ts      # Product data (cached)
│       ├── useConnectionStatus.ts # Network status
│       └── usePOSSession.ts    # Register/shift state
│
└── lib/
    └── pos/
        ├── offline-store.ts    # IndexedDB operations
        ├── sync-service.ts     # Background sync
        └── receipt-generator.ts # Local receipt generation
```

---

## Responsive Breakpoints

| Device | Layout |
|--------|--------|
| Tablet Portrait (768px) | Products top, cart bottom (stacked) |
| Tablet Landscape (1024px) | Products left 60%, cart right 40% |
| Desktop (1280px+) | Products left 65%, cart right 35% |

**Touch Target Sizes:**
- Minimum: 48px × 48px
- Recommended: 64px × 64px for primary actions
- Product tiles: 100px × 100px minimum

---

## Accessibility

- High contrast mode support
- Screen reader labels on all actions
- Keyboard navigation (Tab, Enter, Escape)
- Focus indicators visible
- Error states announced

---

## Verification Checklist

- [x] UI does NOT assume online availability
- [x] All core flows work offline
- [x] Touch targets ≥ 48px
- [x] Max 3 taps to complete sale
- [x] Max 2 navigation levels
- [x] Offline indicator always visible
- [x] Graceful degradation for online-required actions

---

## Ready for Implementation
