# POS Inventory Interaction (READ-ONLY)

## Version: pos-v1.0.0
## Phase 4 Complete

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│                     INVENTORY FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   POS MODULE                         SAAS CORE               │
│  ┌──────────────┐                  ┌──────────────┐         │
│  │              │ ──── READ ────► │              │         │
│  │  Inventory   │                  │  Inventory   │         │
│  │  Consumer    │ ◄─── DATA ───── │  Service     │         │
│  │              │                  │              │         │
│  │              │ ── EVENTS ────► │              │         │
│  │              │ (deduct/restore) │  (reconcile) │         │
│  └──────────────┘                  └──────────────┘         │
│                                                              │
│  ❌ POS NEVER WRITES INVENTORY DIRECTLY                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Inventory Read Patterns

### 1. Single Product Lookup

```typescript
// Get inventory for one product
const inventory = await posInventory.getInventory(
  tenantId,
  'prod-123',
  'variant-456',  // optional
  { locationId: 'store-1' }
)

// Response
{
  productId: 'prod-123',
  variantId: 'variant-456',
  sku: 'SKU-001',
  name: 'Coffee Mug - Blue',
  quantityOnHand: 50,
  quantityReserved: 5,
  quantityAvailable: 45,
  lowStockThreshold: 10,
  isInStock: true,
  isLowStock: false,
  trackInventory: true,
  lastUpdated: '2026-01-01T12:00:00Z'
}
```

### 2. Availability Check

```typescript
// Check if can sell quantity
const result = await posInventory.canSell(
  tenantId,
  'prod-123',
  10,  // quantity
  'variant-456'
)

// Response
{
  productId: 'prod-123',
  requestedQuantity: 10,
  availableQuantity: 45,
  canFulfill: true,
  shortfall: 0,
  status: 'IN_STOCK',
  message: 'Available'
}
```

### 3. Cart Batch Check

```typescript
// Check entire cart at once
const result = await posInventory.canSellCart(tenantId, [
  { productId: 'prod-1', quantity: 2 },
  { productId: 'prod-2', quantity: 5 },
  { productId: 'prod-3', quantity: 1 }
])

// Response
{
  allAvailable: false,
  results: [...],
  unavailableItems: [
    { productId: 'prod-2', shortfall: 3, status: 'LOW_STOCK' }
  ]
}
```

### 4. Product Search

```typescript
// Search with inventory
const products = await posInventory.searchProducts(
  tenantId,
  'coffee mug',
  { inStockOnly: true, limit: 20 }
)
```

### 5. Offline Cache Refresh

```typescript
// Refresh cache when coming online
await posInventory.refreshCache(tenantId, {
  locationId: 'store-1'
})
```

---

## Inventory Delta Events

### Events POS Emits → Core Processes

| Event | Trigger | Core Action |
|-------|---------|-------------|
| `pos.inventory.deduct` | Sale completed | Deduct from inventory |
| `pos.inventory.restore` | Refund/Void | Add back to inventory |
| `pos.inventory.reserve` | Layaway created | Reserve (reduce available) |
| `pos.inventory.release_reservation` | Layaway completed/cancelled | Release reservation |
| `pos.inventory.snapshot_request` | Cache refresh | Send inventory snapshot |

### Event: Deduct (Sale Completed)

```typescript
// When sale completes, POS emits:
await posInventory.emitDeduction(
  tenantId,
  'sale-123',
  'staff-456',
  [
    { productId: 'prod-1', quantity: 2 },
    { productId: 'prod-2', variantId: 'var-1', quantity: 1, serialNumber: 'SN001' }
  ],
  'store-1'
)

// Event payload
{
  eventId: 'inv_1704067200000_abc123',
  eventType: 'pos.inventory.deduct',
  timestamp: '2026-01-01T12:00:00Z',
  tenantId: 'tenant-123',
  locationId: 'store-1',
  sourceModule: 'POS',
  sourceAction: 'SALE_COMPLETE',
  sourceId: 'sale-123',
  staffId: 'staff-456',
  items: [
    { productId: 'prod-1', quantity: 2, reason: 'SALE' },
    { productId: 'prod-2', variantId: 'var-1', quantity: 1, reason: 'SALE', serialNumber: 'SN001' }
  ]
}
```

### Event: Restore (Refund/Void)

```typescript
// When refund processed, POS emits:
await posInventory.emitRestore(
  tenantId,
  'refund-789',
  'staff-456',
  [
    { productId: 'prod-1', quantity: 1, condition: 'SELLABLE' },
    { productId: 'prod-2', quantity: 1, condition: 'DAMAGED' }  // Won't go back to sellable stock
  ],
  'REFUND',
  'store-1'
)

// Event payload
{
  eventType: 'pos.inventory.restore',
  sourceAction: 'REFUND',
  items: [
    { productId: 'prod-1', quantity: 1, reason: 'REFUND', condition: 'SELLABLE' },
    { productId: 'prod-2', quantity: 1, reason: 'REFUND', condition: 'DAMAGED' }
  ]
}
```

### Event: Reserve (Layaway)

```typescript
// When layaway created, POS emits:
await posInventory.emitReservation(
  tenantId,
  'res-001',       // reservationId
  'layaway-123',   // sourceId
  'staff-456',
  [
    { productId: 'prod-1', quantity: 1 }
  ],
  'LAYAWAY',
  new Date('2026-02-01'),  // expiresAt
  'store-1'
)

// Event payload
{
  eventType: 'pos.inventory.reserve',
  reservationId: 'res-001',
  items: [
    { productId: 'prod-1', quantity: 1, reason: 'LAYAWAY', expiresAt: '2026-02-01' }
  ]
}
```

### Event: Release Reservation

```typescript
// When layaway completed/cancelled:
await posInventory.emitReleaseReservation(
  tenantId,
  'res-001',
  'staff-456',
  'COMPLETED',  // or 'CANCELLED', 'EXPIRED'
  'store-1'
)
```

---

## Cache Strategy

### Online Mode
```
1. Read from Core API
2. Update local cache
3. Return fresh data
```

### Offline Mode
```
1. Read from local cache
2. Return with "stale" warning
3. Optimistic updates on actions
4. Sync when online
```

### Cache Refresh Triggers
- App startup
- Coming back online
- Manual refresh
- Periodic (configurable)
- After sync completion

---

## Read Patterns Summary

| Pattern | Method | Online | Offline |
|---------|--------|--------|---------|
| Single product | `getInventory()` | API call | Cache lookup |
| Check availability | `canSell()` | API call | Cache check |
| Batch check | `canSellCart()` | API call | Cache check |
| Search | `searchProducts()` | API call | Cache search |
| Refresh cache | `refreshCache()` | API call | N/A |

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SALE COMPLETION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. POS: Sale finalized                                     │
│     │                                                        │
│     ▼                                                        │
│  2. POS: emitDeduction(items)                               │
│     │                                                        │
│     │  ┌────────────────────────────────────┐               │
│     └─►│ pos.inventory.deduct               │               │
│        │ { items: [...], reason: 'SALE' }   │               │
│        └────────────────┬───────────────────┘               │
│                         │                                    │
│                         ▼                                    │
│  3. Core: Receives event                                    │
│     │                                                        │
│     ▼                                                        │
│  4. Core: Validates & deducts inventory                     │
│     │                                                        │
│     ▼                                                        │
│  5. Core: Emits core.inventory.updated                      │
│     │                                                        │
│     ▼                                                        │
│  6. POS: Updates local cache (optional listener)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛑 VERIFICATION

### POS never writes inventory directly ✅

```typescript
// ❌ POS DOES NOT DO THIS:
await db.inventory.update({
  where: { productId },
  data: { quantity: quantity - soldQty }
})

// ✅ POS DOES THIS:
await posInventory.emitDeduction(tenantId, saleId, staffId, items)
// Core receives event and handles actual write
```

### Responsibilities

| Action | POS | Core |
|--------|-----|------|
| Read inventory | ✅ | Provider |
| Cache inventory | ✅ | N/A |
| Emit deduction event | ✅ | N/A |
| Write to inventory | ❌ | ✅ |
| Reconcile conflicts | ❌ | ✅ |
| Handle oversells | ❌ | ✅ |

---

## Ready for MODULE 1 · PHASE 5 — STAFF & PERMISSIONS
