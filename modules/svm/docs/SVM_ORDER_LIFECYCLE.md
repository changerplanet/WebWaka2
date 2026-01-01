# SVM Order Lifecycle

## Version: svm-v1.0.0
## Phase 3 Complete

---

## State Machine

```
                    ┌─────────────┐
                    │    DRAFT    │
                    └──────┬──────┘
                           │ place()
                           ▼
                    ┌─────────────┐
           ┌────────│   PLACED    │────────┐
           │        └──────┬──────┘        │
           │               │ markPaid()    │ cancel()
           │               ▼               │
           │        ┌─────────────┐        │
           │   ┌────│    PAID     │────┐   │
           │   │    └──────┬──────┘    │   │
           │   │           │ process() │   │
           │   │           ▼           │   │
           │   │    ┌─────────────┐    │   │
           │   │ ┌──│ PROCESSING  │──┐ │   │
           │   │ │  └──────┬──────┘  │ │   │
           │   │ │         │ ship()  │ │   │
           │   │ │         ▼         │ │   │
           │   │ │  ┌─────────────┐  │ │   │
           │   │ │  │   SHIPPED   │──┼─┼───┤
           │   │ │  └──────┬──────┘  │ │   │
           │   │ │         │ deliver()│ │   │
           │   │ │         ▼         │ │   │
           │   │ │  ┌─────────────┐  │ │   │
           │   │ │  │  DELIVERED  │──┼─┘   │
           │   │ │  └──────┬──────┘  │     │
           │   │ │         │ fulfill()    │
           │   │ │         ▼         │     │
           │   │ │  ┌─────────────┐  │     │
           │   │ └──│  FULFILLED  │──┘     │
           │   │    └─────────────┘        │
           │   │           │ refund()      │
           │   │           ▼               │
           │   │    ┌─────────────┐        │
           │   └───▶│  REFUNDED   │◀───────┘
           │        └─────────────┘
           │
           │        ┌─────────────┐
           └───────▶│  CANCELLED  │
                    └─────────────┘
```

---

## State Definitions

| State | Description | Can Cancel | Can Refund |
|-------|-------------|------------|------------|
| `DRAFT` | Cart converted, not submitted | ✅ | ❌ |
| `PLACED` | Submitted, awaiting payment | ✅ | ❌ |
| `PAID` | Payment confirmed | ✅ | ✅ |
| `PROCESSING` | Being prepared | ✅ | ✅ |
| `SHIPPED` | With carrier | ❌ | ✅ |
| `DELIVERED` | Customer received | ❌ | ✅ |
| `FULFILLED` | Complete | ❌ | ✅ |
| `CANCELLED` | Cancelled (terminal) | ❌ | ❌ |
| `REFUNDED` | Fully refunded (terminal) | ❌ | ❌ |

---

## Events Emitted

### At Each Stage

| Transition | Events Emitted |
|------------|----------------|
| Create order | `svm.order.created` |
| Place order | `svm.order.placed`, `svm.order.payment_requested`, `svm.order.status_changed` |
| Payment confirmed | `svm.order.paid`, `svm.order.status_changed` |
| Start processing | `svm.order.status_changed` |
| Ship order | `svm.order.shipped`, `svm.order.status_changed` |
| Deliver order | `svm.order.delivered`, `svm.order.status_changed` |
| Fulfill order | `svm.order.status_changed` |
| Cancel order | `svm.order.cancelled`, `svm.order.status_changed` |
| Request refund | `svm.order.refund_requested` |
| Refund complete | `svm.order.refunded`, `svm.order.status_changed` |

---

## Event Payloads

### svm.order.placed

```typescript
{
  eventId: "evt_abc123",
  eventType: "svm.order.placed",
  timestamp: "2026-01-01T12:00:00Z",
  idempotencyKey: "order_xyz_placed",
  
  payload: {
    orderId: "order_xyz",
    orderNumber: "ORD-20260101-0001",
    tenantId: "tenant_123",
    customerId: "cust_456",
    
    items: [
      { productId: "prod_1", variantId: "var_1", quantity: 2, unitPrice: 29.99 }
    ],
    
    subtotal: 59.98,
    shippingTotal: 5.99,
    taxTotal: 4.95,
    discountTotal: 0,
    grandTotal: 70.92,
    currency: "USD",
    
    shippingAddress: {
      name: "John Doe",
      address1: "123 Main St",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "US"
    },
    
    reservationId: "res_789"
  }
}
```

### svm.order.payment_requested

```typescript
{
  eventType: "svm.order.payment_requested",
  payload: {
    orderId: "order_xyz",
    orderNumber: "ORD-20260101-0001",
    tenantId: "tenant_123",
    amount: 70.92,
    currency: "USD",
    metadata: { orderNumber: "ORD-20260101-0001" }
  }
}
```

Core handles this by creating a payment intent (Stripe, etc.)

### svm.order.cancelled

```typescript
{
  eventType: "svm.order.cancelled",
  payload: {
    orderId: "order_xyz",
    tenantId: "tenant_123",
    reason: "Customer requested cancellation",
    cancelledBy: "CUSTOMER",
    
    items: [
      { productId: "prod_1", variantId: "var_1", quantity: 2 }
    ],
    
    wasPaymentCaptured: true,
    corePaymentId: "pay_abc",
    refundAmount: 70.92
  }
}
```

Core handles: releases inventory, processes refund if paid.

### svm.order.refund_requested

```typescript
{
  eventType: "svm.order.refund_requested",
  payload: {
    orderId: "order_xyz",
    tenantId: "tenant_123",
    corePaymentId: "pay_abc",
    
    refundType: "PARTIAL",
    refundAmount: 29.99,
    reason: "Item damaged",
    
    items: [
      { productId: "prod_1", variantId: "var_1", quantity: 1, restockItem: true }
    ],
    
    requestedBy: "staff_123"
  }
}
```

Core handles: processes refund, restores inventory if `restockItem: true`.

---

## Usage Examples

### Create and Place Order

```typescript
import { OrderEngine } from '@svm/lib/order-engine'

// Create order from cart
const engine = OrderEngine.create({
  customerId: 'cust_123',
  items: [
    {
      productId: 'prod_1',
      productName: 'Blue Widget',
      unitPrice: 29.99,
      quantity: 2
    }
  ],
  shippingTotal: 5.99,
  taxTotal: 4.95,
  shippingAddress: {
    name: 'John Doe',
    address1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  }
}, {
  tenantId: 'tenant_123',
  eventEmitter: myEventEmitter
})

// Place order (emits placed + payment_requested events)
await engine.place(reservationId)
```

### Handle Payment Confirmation

```typescript
// When Core confirms payment (webhook or callback)
const engine = OrderEngine.load(existingOrder, config)

await engine.markPaid('pay_abc123')
// Emits: svm.order.paid, svm.order.status_changed
```

### Ship Order

```typescript
await engine.markShipped('FedEx', '123456789', {
  trackingUrl: 'https://fedex.com/track/123456789',
  estimatedDelivery: new Date('2026-01-05'),
  notifyCustomer: true
})
// Emits: svm.order.shipped, svm.order.status_changed
// Core sends tracking notification to customer
```

### Cancel Order

```typescript
await engine.cancel(
  'Customer requested cancellation',
  'CUSTOMER',
  'cust_123'
)
// Emits: svm.order.cancelled, svm.order.status_changed
// Core: releases inventory, issues refund if paid
```

---

## Core Event Handlers

| SVM Event | Core Action |
|-----------|-------------|
| `svm.order.placed` | Reserve inventory |
| `svm.order.payment_requested` | Create payment intent |
| `svm.order.paid` | Convert reservation → committed |
| `svm.order.shipped` | Send tracking notification |
| `svm.order.cancelled` | Release inventory, refund if paid |
| `svm.order.refund_requested` | Process refund via payment provider |
| `svm.order.refunded` | Restore inventory if applicable |

---

## Verification Checklist

- [x] No payment capture logic in module
- [x] Events emitted, not actions taken
- [x] State machine enforces valid transitions
- [x] All events have idempotency keys
- [x] Payment handled via `payment_requested` event
- [x] Refund handled via `refund_requested` event
- [x] Inventory released via `cancelled` event

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/order-engine.ts` | Order state machine and events |
| `docs/SVM_ORDER_LIFECYCLE.md` | This document |

---

## Ready for Phase 4 - Shipping Logic
