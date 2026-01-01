# POS Transaction Engine - Sales Lifecycle

## Version: pos-v1.0.0
## Phase 2 Complete

---

## State Machine

```
                    ┌─────────────┐
                    │   DRAFT     │ ← Create Sale
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   SUSPENDED   │  │PENDING_PAYMENT│  │    VOIDED     │
│  (Parked)     │  │  (Checkout)   │  │  (Cancelled)  │
└───────┬───────┘  └───────┬───────┘  └───────────────┘
        │                  │
        │                  ▼
        │          ┌───────────────┐
        └─────────►│PARTIALLY_PAID │
                   │(Split Payment)│
                   └───────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────────┐  ┌───────────┐
    │ COMPLETED │  │   SUSPENDED   │  │  VOIDED   │
    │ (Success) │  │   (Parked)    │  │(Cancelled)│
    └─────┬─────┘  └───────────────┘  └───────────┘
          │
          ▼
    ┌───────────┐
    │ REFUNDED  │
    │ (Returned)│
    └───────────┘
```

---

## Valid State Transitions

| From | To | Trigger |
|------|-----|---------|
| `DRAFT` | `SUSPENDED` | `suspend()` |
| `DRAFT` | `PENDING_PAYMENT` | `addPayment()` |
| `DRAFT` | `VOIDED` | `void()` |
| `SUSPENDED` | `DRAFT` | `resume()` |
| `SUSPENDED` | `VOIDED` | `void()` |
| `PENDING_PAYMENT` | `PARTIALLY_PAID` | Payment < total |
| `PENDING_PAYMENT` | `COMPLETED` | `finalize()` (full payment) |
| `PENDING_PAYMENT` | `SUSPENDED` | `suspend()` |
| `PENDING_PAYMENT` | `VOIDED` | `void()` |
| `PARTIALLY_PAID` | `COMPLETED` | `finalize()` |
| `PARTIALLY_PAID` | `SUSPENDED` | `suspend()` |
| `PARTIALLY_PAID` | `VOIDED` | `void()` |
| `COMPLETED` | `REFUNDED` | Refund processed |

---

## Event Definitions

### Sale Lifecycle Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `pos.sale.created` | `SaleEngine.create()` | saleNumber, registerId, customerId |
| `pos.sale.item_added` | `addItem()` | productId, quantity, unitPrice |
| `pos.sale.item_removed` | `removeItem()` | productId, quantity |
| `pos.sale.item_updated` | `updateItemQuantity()` | productId, quantityDelta |
| `pos.sale.discount_applied` | `applyDiscount()` | name, type, calculatedAmount |
| `pos.sale.discount_removed` | `removeDiscount()` | name, calculatedAmount |
| `pos.sale.payment_added` | `addPayment()` | method, amount, isFullyPaid |
| `pos.sale.payment_failed` | Payment failure | method, reason |
| `pos.sale.suspended` | `suspend()` | reason, itemCount, grandTotal |
| `pos.sale.resumed` | `resume()` | suspendedDuration |
| `pos.sale.completed` | `finalize()` | Full sale details + items |
| `pos.sale.voided` | `void()` | reason, items for release |

### Inventory Events (For Core to Handle)

| Event | Trigger | Core Action |
|-------|---------|-------------|
| `pos.inventory.deduction_requested` | `finalize()` | Deduct inventory |
| `pos.inventory.release_requested` | `void()`, `removeItem()` | Release reserved |
| `pos.inventory.reservation_requested` | (Optional) | Reserve for draft |

---

## API Reference

### Create Sale
```typescript
const engine = SaleEngine.create({
  tenantId: 'tenant-123',
  staffId: 'staff-456',
  registerId: 'register-1',
  customerId: 'customer-789' // optional
}, 'S-20260101-0001', eventEmitter)
```

### Add Item
```typescript
await engine.addItem({
  productId: 'prod-123',
  productName: 'Coffee Mug',
  productSku: 'MUG-001',
  unitPrice: 15.99,
  quantity: 2,
  taxRate: 0.0825
})
```

### Apply Discount
```typescript
// Percentage discount on entire sale
await engine.applyDiscount({
  name: 'Summer Sale',
  code: 'SUMMER10',
  type: 'PERCENTAGE',
  scope: 'SALE',
  value: 10
})

// Fixed amount on specific item
await engine.applyDiscount({
  name: 'Manager Override',
  type: 'FIXED_AMOUNT',
  scope: 'LINE_ITEM',
  lineItemId: 'item-123',
  value: 5,
  reason: 'Damaged packaging',
  approvedByStaffId: 'manager-456'
})
```

### Add Payment (Split Payments Supported)
```typescript
// Cash payment
await engine.addPayment({
  method: 'CASH',
  amount: 20,
  cashReceived: 25 // Change calculated automatically
})

// Card payment
await engine.addPayment({
  method: 'CARD',
  amount: 15.99,
  cardLastFour: '4242',
  cardBrand: 'Visa',
  corePaymentId: 'pay_xxx' // From Core payment processor
})
```

### Suspend / Resume
```typescript
// Park sale for later
await engine.suspend({ reason: 'Customer getting more items' })

// Resume when ready
await engine.resume()
```

### Finalize Sale
```typescript
// Complete the sale (must be fully paid)
await engine.finalize()
// Emits: pos.sale.completed + pos.inventory.deduction_requested
```

### Void Sale
```typescript
await engine.void({
  reason: 'Customer changed mind',
  staffId: 'staff-456'
})
// Emits: pos.sale.voided + pos.inventory.release_requested
```

---

## Event Flow Examples

### Happy Path: Complete Sale
```
1. SaleEngine.create()     → pos.sale.created
2. addItem() x 3           → pos.sale.item_added (x3)
3. applyDiscount()         → pos.sale.discount_applied
4. addPayment(CASH)        → pos.sale.payment_added
5. finalize()              → pos.sale.completed
                           → pos.inventory.deduction_requested ⚡
```

### Split Payment Flow
```
1. SaleEngine.create()     → pos.sale.created
2. addItem() x 2           → pos.sale.item_added (x2)
3. addPayment(CARD, $50)   → pos.sale.payment_added (partial)
4. addPayment(CASH, $30)   → pos.sale.payment_added (full)
5. finalize()              → pos.sale.completed
                           → pos.inventory.deduction_requested ⚡
```

### Suspend and Resume
```
1. SaleEngine.create()     → pos.sale.created
2. addItem() x 2           → pos.sale.item_added (x2)
3. suspend()               → pos.sale.suspended
   ... time passes ...
4. resume()                → pos.sale.resumed
5. addItem()               → pos.sale.item_added
6. addPayment() + finalize()
```

### Void with Items
```
1. SaleEngine.create()     → pos.sale.created
2. addItem() x 2           → pos.sale.item_added (x2)
3. void()                  → pos.sale.voided
                           → pos.inventory.release_requested ⚡
```

---

## 🛑 VERIFICATION

### Inventory is NOT mutated here ✅

```typescript
// ❌ POS DOES NOT DO THIS:
await inventoryService.deduct(productId, quantity)

// ✅ POS DOES THIS INSTEAD:
this.emitEvent({
  eventType: 'pos.inventory.deduction_requested',
  payload: { items: [...] }
})
// Core listens and handles inventory
```

### Events are emitted, not actions taken ✅

| Operation | POS Action | Core Action |
|-----------|------------|-------------|
| Sale completed | Emit `deduction_requested` | Deduct inventory |
| Sale voided | Emit `release_requested` | Release inventory |
| Item removed | Emit `release_requested` | Release inventory |
| Payment | Emit `payment_added` | Record revenue |

---

## Ready for MODULE 1 · PHASE 3 — OFFLINE POS BEHAVIOR
