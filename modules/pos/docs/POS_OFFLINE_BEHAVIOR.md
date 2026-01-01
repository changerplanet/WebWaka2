# POS Offline Behavior

## Version: pos-v1.0.0
## Phase 3 Complete

---

## Offline-Safe Action List

### ✅ SAFE OFFLINE (Immediate Execution)

| Action | Offline Behavior | Sync Requirement |
|--------|------------------|------------------|
| `SALE_CREATE` | Creates draft locally | Sync on completion |
| `SALE_ADD_ITEM` | Adds to local cart | Sync on completion |
| `SALE_REMOVE_ITEM` | Removes from cart | Sync on completion |
| `SALE_UPDATE_QUANTITY` | Updates locally | Sync on completion |
| `SALE_APPLY_DISCOUNT` | Applies locally | Sync on completion |
| `SALE_REMOVE_DISCOUNT` | Removes locally | Sync on completion |
| `SALE_SUSPEND` | Parks sale locally | Queued for sync |
| `SALE_RESUME` | Resumes locally | Queued for sync |
| `SALE_VOID` | Voids locally | Queued for sync |
| `REGISTER_OPEN` | Opens locally | Queued for sync |
| `SHIFT_START` | Starts locally | Queued for sync |
| `SHIFT_END` | Ends locally | Queued for sync |

### 💰 PAYMENT HANDLING

| Method | Offline Allowed | Behavior |
|--------|-----------------|----------|
| `CASH` | ✅ YES | Process immediately, queue for sync |
| `CARD` | ❌ NO | Fail gracefully with message |
| `MOBILE_PAYMENT` | ❌ NO | Fail gracefully with message |
| `STORE_CREDIT` | ❌ NO | Requires balance check |
| `GIFT_CARD` | ❌ NO | Requires balance check |

### ⚠️ REQUIRE NETWORK

| Action | Why |
|--------|-----|
| Card Payment | Requires payment processor |
| Store Credit | Requires balance validation |
| Gift Card | Requires balance validation |
| Inventory Check | Real-time stock (cache may be stale) |

---

## Queue Strategy

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     POS APPLICATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Sale Engine  │───►│Offline Queue │───►│ Sync Service │  │
│  │  (Actions)   │    │ (IndexedDB)  │    │  (to Core)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Local State  │    │ Persist to   │    │ Core API     │  │
│  │   (Memory)   │    │   Storage    │    │  (Online)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Queue States

```
PENDING ─────► SYNCING ─────► SYNCED
    │              │
    │              ▼
    │         CONFLICT ─────► PENDING (after resolution)
    │              │
    │              ▼
    │          REJECTED (cancelled)
    │
    ▼
  FAILED ─────► PENDING (retry)
    │
    ▼
  REJECTED (max attempts)
```

### Idempotency

Every offline action has an `offlineId` (idempotency key):

```typescript
// Same action with same parameters = same offlineId
const key = generateIdempotencyKey(
  'SALE_ADD_ITEM',
  { productId: 'prod-123', quantity: 2 },
  { saleId: 'sale-456', staffId: 'staff-789' }
)
// Result: "idem_abc123xyz"

// Duplicate submissions return existing action
const existing = queue.getByOfflineId(key)
if (existing) return existing // No duplicate
```

### Retry Strategy

```typescript
const action = {
  attemptCount: 0,
  maxAttempts: 5,
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  nextRetryDelay: Math.pow(2, attemptCount) * 1000
}
```

---

## Conflict Resolution

### Conflict Types

| Type | Cause | Resolution Options |
|------|-------|-------------------|
| `INVENTORY_INSUFFICIENT` | Product out of stock | Accept server / Cancel item |
| `PRODUCT_UNAVAILABLE` | Product deleted | Remove from sale |
| `PRICE_CHANGED` | Price differs from cache | Accept new price / Manager override |
| `CUSTOMER_INVALID` | Customer not found | Remove customer / Create new |
| `DUPLICATE_SALE` | Sale already synced | Accept server version |
| `SESSION_CLOSED` | Register closed | Reassign to new session |

### Resolution Flow

```
1. Action syncs to Core
2. Core detects conflict
3. Core returns conflict data:
   {
     type: 'INVENTORY_INSUFFICIENT',
     serverState: { productId: 'prod-123', available: 0 },
     localState: { productId: 'prod-123', requested: 5 }
   }
4. POS marks action as CONFLICT
5. Staff/Manager reviews and resolves:
   - ACCEPT_SERVER: Remove item or adjust quantity
   - ACCEPT_LOCAL: Manager override (audit logged)
   - CANCEL: Void the sale
6. Action re-queued with resolution
7. Core processes with resolution context
```

### Resolution Example

```typescript
// Conflict detected
const conflict = {
  type: 'INVENTORY_INSUFFICIENT',
  serverState: { available: 2 },
  localState: { requested: 5 }
}

// Staff chooses resolution
await queue.resolveConflict(
  actionId,
  'ACCEPT_SERVER', // Reduce to available quantity
  'staff-123'
)

// Re-sync with resolution
// Core adjusts quantity to 2
```

---

## Offline Sales Flow

### Creating a Sale Offline

```typescript
// 1. Check if offline
const isOnline = navigator.onLine

// 2. Create sale with offline flag
const engine = SaleEngine.create({
  tenantId: 'tenant-123',
  staffId: 'staff-456',
  offlineId: generateOfflineId() // Mark as offline
}, saleNumber, eventEmitter)

// 3. Add items (uses cached inventory)
await engine.addItem({
  productId: 'prod-123',
  productName: 'Coffee', // Cached
  unitPrice: 4.99,       // Cached
  quantity: 2
})

// 4. Local inventory deducted optimistically
offlineManager.deductFromCache('prod-123', 2)

// 5. Cash payment (allowed offline)
await engine.addPayment({
  method: 'CASH',
  amount: 9.98,
  cashReceived: 10.00
})

// 6. Finalize (queued for sync)
await engine.finalize()

// 7. Queue action for sync
await offlineManager.createOfflineAction(
  'SALE_COMPLETE',
  { saleId: engine.getState().id },
  { tenantId, staffId, saleId, events: engine.getEvents() }
)
```

### Syncing When Online

```typescript
// Network comes back
window.addEventListener('online', async () => {
  const result = await syncService.syncAll()
  
  console.log(`Synced: ${result.synced}`)
  console.log(`Conflicts: ${result.conflicts}`)
  console.log(`Failed: ${result.failed}`)
  
  // Handle conflicts
  const conflicts = queue.getConflicts()
  for (const action of conflicts) {
    showConflictDialog(action)
  }
})
```

---

## Inventory Handling

### ⚠️ CRITICAL: Offline Sales May Oversell

```
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE INVENTORY                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LOCAL CACHE (may be stale)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Product A: 10 units (actual: 5)                      │  │
│  │ Product B: 3 units  (actual: 0 - sold elsewhere)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  OFFLINE SALE                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Sell 8 units of Product A                            │  │
│  │ Cache shows: 10 - 8 = 2 remaining                    │  │
│  │ Reality: 5 - 8 = -3 (OVERSOLD!)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ON SYNC: Core detects and creates CONFLICT                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Resolution: Sync Defers to Core

```typescript
// POS DOES NOT:
// - Block sales due to stale cache
// - Guarantee inventory accuracy offline
// - Reject oversells locally

// CORE HANDLES:
// - Final inventory validation
// - Conflict detection
// - Backorder creation
// - Customer notification
```

### Inventory Cache Updates

```typescript
// Core pushes inventory updates when online
coreEventBus.on('core.inventory.updated', (event) => {
  offlineManager.updateInventoryCache(
    event.productId,
    event.newQuantity
  )
})

// Cache refreshed on sync completion
syncService.on('sync.completed', async () => {
  await refreshInventoryCache()
})
```

---

## 🛑 VERIFICATION

### Offline sales do not oversell inventory ✅

**Clarification:** Offline sales CAN oversell because cache may be stale.

**Mitigation:**
- Local cache used for UI warnings only
- Core detects oversells on sync
- Conflicts created for resolution
- Business decides: backorder, cancel, or fulfill

### Sync logic defers to SaaS Core ✅

| Responsibility | Owner |
|----------------|-------|
| Queue persistence | POS (IndexedDB) |
| Action validation | Core |
| Inventory updates | Core |
| Conflict detection | Core |
| Final state of truth | Core |

```typescript
// POS syncs action
const result = await coreApi.syncPOSAction(action)

// Core validates and responds
if (result.conflict) {
  // POS shows conflict UI
  // Staff resolves
  // Core applies resolution
}
```

---

## Summary

| Requirement | Implementation |
|-------------|----------------|
| Sales work offline | ✅ Local state + queue |
| Cash payments offline | ✅ Immediate processing |
| Card payments graceful fail | ✅ Clear error message |
| Idempotent actions | ✅ `offlineId` key |
| No oversell guarantee | ⚠️ Cache-based (conflicts on sync) |
| Sync defers to Core | ✅ Core validates all |

---

## Ready for MODULE 1 · PHASE 4 — INVENTORY INTERACTION (READ-ONLY)
