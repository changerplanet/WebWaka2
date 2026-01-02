# SVM Events Documentation

## Overview

The Single Vendor Marketplace (SVM) module emits events to communicate with the SaaS Core. All events are **module-scoped** with the `svm.` prefix and follow strict schemas for consistency.

**Important Rules:**
- ✅ Events are module-scoped (`svm.*`)
- ✅ No analytics logic inside module
- ✅ Core handles inventory, payments, notifications
- ✅ Idempotency enforced via unique keys

---

## Event Types

### Order Lifecycle Events

| Event Type | Trigger | Core Action |
|------------|---------|-------------|
| `svm.order.created` | Order initialized from cart | Log, no action |
| `svm.order.placed` | Customer submits order | Reserve inventory, audit log |
| `svm.order.payment_requested` | Payment initiated | Create payment intent |
| `svm.order.paid` | Payment confirmed | Confirm inventory, send receipt |
| `svm.order.processing` | Merchant starts preparation | Log status change |
| `svm.order.shipped` | Order shipped | Send tracking email |
| `svm.order.delivered` | Delivery confirmed | Log, trigger review request |
| `svm.order.fulfilled` | Order complete | Finalize order, close |
| `svm.order.cancelled` | Order cancelled | Release inventory, process refund |
| `svm.order.refund_requested` | Refund initiated | Process refund |
| `svm.order.refunded` | Refund completed | Log refund confirmation |
| `svm.order.status_changed` | Any status transition | Audit log |

### Cart Events

| Event Type | Trigger | Core Action |
|------------|---------|-------------|
| `svm.cart.item_added` | Item added to cart | Analytics tracking |
| `svm.cart.item_removed` | Item removed from cart | Analytics tracking |
| `svm.cart.item_updated` | Quantity changed | Analytics tracking |
| `svm.cart.cleared` | Cart emptied | Analytics tracking |
| `svm.cart.abandoned` | Cart abandoned (timeout) | Trigger abandoned cart email |

### Product Events

| Event Type | Trigger | Core Action |
|------------|---------|-------------|
| `svm.product.viewed` | Product page viewed | Analytics tracking |
| `svm.product.searched` | Product search performed | Analytics tracking |

### Promotion Events

| Event Type | Trigger | Core Action |
|------------|---------|-------------|
| `svm.promotion.applied` | Coupon/promo applied | Log usage |
| `svm.promotion.removed` | Promo removed from cart | Log removal |
| `svm.promotion.validation_failed` | Invalid coupon used | Log attempt |

### Review Events

| Event Type | Trigger | Core Action |
|------------|---------|-------------|
| `svm.review.submitted` | Customer submits review | Queue for moderation |
| `svm.review.approved` | Review approved | Publish, update ratings |
| `svm.review.rejected` | Review rejected | Notify customer |

### Storefront Events

| Event Type | Trigger | Core Action |
|------------|---------|-------------|
| `svm.storefront.page_viewed` | Page view tracked | Analytics tracking |
| `svm.storefront.checkout_started` | Checkout initiated | Analytics funnel |
| `svm.storefront.checkout_completed` | Checkout complete | Analytics conversion |

---

## Event Payload Schemas

### Base Event Structure

All events include these base fields:

```typescript
interface SVMEventBase {
  eventId: string           // Unique event ID (evt_xxx)
  eventType: string         // Event type (svm.*)
  timestamp: string         // ISO 8601 timestamp
  idempotencyKey: string    // Deduplication key
  tenantId: string          // Tenant identifier
  version: '1.0'            // Schema version
}
```

### ORDER_PLACED

```typescript
interface OrderPlacedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string       // Null for guest checkout
  guestEmail?: string
  items: Array<{
    productId: string
    variantId?: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  currency: string
  shippingAddress: {
    name: string
    address1: string
    address2?: string
    city: string
    state?: string
    postalCode: string
    country: string
    phone?: string
  }
  shippingMethod?: string
  promotionCode?: string
}
```

### ORDER_PAID

```typescript
interface OrderPaidPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  corePaymentId: string     // Payment ID from Core
  amount: number
  currency: string
  paidAt: string            // ISO 8601 timestamp
}
```

### ORDER_FULFILLED

```typescript
interface OrderFulfilledPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  fulfilledAt: string       // ISO 8601 timestamp
  deliveryConfirmed: boolean
}
```

### ORDER_CANCELLED

```typescript
interface OrderCancelledPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  reason: string
  cancelledBy: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
  cancelledByUserId?: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
  wasPaymentCaptured: boolean
  corePaymentId?: string
  refundAmount?: number
}
```

### CART_ITEM_ADDED

```typescript
interface CartItemAddedPayload {
  tenantId: string
  cartId?: string
  sessionId?: string
  customerId?: string
  productId: string
  variantId?: string
  productName: string
  quantity: number
  unitPrice: number
}
```

### CART_ABANDONED

```typescript
interface CartAbandonedPayload {
  tenantId: string
  cartId: string
  customerId?: string
  sessionId?: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  abandonedAt: string
  lastActivityAt: string
}
```

### PRODUCT_VIEWED

```typescript
interface ProductViewedPayload {
  tenantId: string
  productId: string
  productName: string
  categoryId?: string
  customerId?: string
  sessionId?: string
  source?: 'search' | 'category' | 'direct' | 'recommendation'
}
```

### PROMOTION_APPLIED

```typescript
interface PromotionAppliedPayload {
  tenantId: string
  promotionId: string
  promotionCode?: string
  promotionName: string
  discountType: string
  discountAmount: number
  orderId?: string
  cartId?: string
  customerId?: string
}
```

### REVIEW_SUBMITTED

```typescript
interface ReviewSubmittedPayload {
  tenantId: string
  reviewId: string
  productId: string
  customerId: string
  rating: number            // 1-5
  title?: string
  verifiedPurchase: boolean
}
```

---

## Idempotency Rules

### Purpose

Idempotency keys ensure that the same event is not processed multiple times, even if:
- Network issues cause retries
- Client sends duplicate requests
- Events are replayed from a queue

### Key Generation Rules

| Event Type | Key Format | Time Bucket |
|------------|------------|-------------|
| `svm.order.*` | `{eventType}_{orderId}_{action}_{uniqueId}` | None (unique) |
| `svm.cart.item_added` | `{eventType}_{cartId}_{productId}_add_{bucket}` | 5 minutes |
| `svm.product.viewed` | `{eventType}_{sessionId}_{productId}_view_{bucket}` | 15 minutes |
| `svm.promotion.applied` | `{eventType}_{promotionId}_{orderId}_{uniqueId}` | None (unique) |

### Examples

```typescript
// Order placed - unique per order
idempotencyKey: "svm.order.placed_order_abc123_placed_lx8j2k4m9n"

// Cart item added - 5 minute dedup window
idempotencyKey: "svm.cart.item_added_cart_xyz_prod_123_add_45678"

// Product viewed - 15 minute dedup window
idempotencyKey: "svm.product.viewed_session_abc_prod_456_view_12345"
```

### Processing Rules

1. **Before Processing**: Check if idempotency key exists in processed events
2. **If Exists**: Return success without re-processing
3. **If New**: Process event and store idempotency key
4. **Key Expiry**: Keys expire after 24 hours (configurable)

---

## Usage Example

```typescript
import { 
  SVMEventEmitter, 
  SVM_EVENT_TYPES,
  createOrderPlacedEvent 
} from '@/lib/event-bus'

// Initialize emitter
const emitter = new SVMEventEmitter({
  coreEventsUrl: '/api/svm/events',
  tenantId: 'tenant_123'
})

// Create and emit order placed event
const { eventType, payload, idempotencyKey } = createOrderPlacedEvent({
  orderId: 'order_abc',
  orderNumber: 'ORD-20240101-0001',
  tenantId: 'tenant_123',
  items: [
    {
      productId: 'prod_1',
      productName: 'Widget',
      quantity: 2,
      unitPrice: 29.99,
      lineTotal: 59.98
    }
  ],
  subtotal: 59.98,
  shippingTotal: 5.99,
  taxTotal: 5.40,
  discountTotal: 0,
  grandTotal: 71.37,
  currency: 'USD',
  shippingAddress: {
    name: 'John Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postalCode: '90210',
    country: 'US'
  }
})

await emitter.emit(eventType, payload, idempotencyKey)
```

---

## Core Event Handlers

The SaaS Core processes SVM events via handlers in `/saas-core/src/lib/svm-event-handlers.ts`:

| Event | Handler | Action |
|-------|---------|--------|
| `svm.order.placed` | `handleOrderPlaced()` | Reserve inventory, create audit log |
| `svm.order.payment_requested` | `handlePaymentRequested()` | Create payment intent (Stripe) |
| `svm.order.cancelled` | `handleOrderCancelled()` | Release inventory, process refund |
| `svm.order.refund_requested` | `handleRefundRequested()` | Process refund via payment provider |
| `svm.order.shipped` | `handleOrderShipped()` | Send shipping notification email |

---

## Event API

### POST /api/svm/events

Receive events from SVM module.

**Request:**
```json
{
  "eventId": "evt_abc123",
  "eventType": "svm.order.placed",
  "timestamp": "2024-01-01T12:00:00Z",
  "idempotencyKey": "svm.order.placed_order_abc_placed_xxx",
  "tenantId": "tenant_123",
  "version": "1.0",
  "payload": {
    "orderId": "order_abc",
    "orderNumber": "ORD-20240101-0001",
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt_abc123",
  "processed": true
}
```

---

## Module Isolation Verification

✅ All events prefixed with `svm.`
✅ No direct Core table writes
✅ No analytics computation in module
✅ Events are fire-and-forget (async)
✅ Core handles all side effects
