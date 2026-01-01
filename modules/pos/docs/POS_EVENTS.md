# POS Events Specification

## Version: pos-events-v1.0.0
## Phase 7 Complete

---

## Event Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   POS MODULE    │ ──────▶ │   EVENT BUS     │ ──────▶ SaaS Core
│                 │  emit   │  (pos-events)   │  relay  (handles)
└─────────────────┘         └─────────────────┘
```

**Principles:**
- POS emits events; Core subscribes and handles
- Events are module-scoped (`pos.*`)
- No analytics logic in POS module
- Idempotency via `eventId` and `idempotencyKey`

---

## Event Types

### 1. SALE_CREATED

Emitted when a new sale is started.

```typescript
{
  eventType: 'pos.sale.created',
  eventId: 'evt_abc123',
  timestamp: '2026-01-01T12:00:00.000Z',
  
  // Idempotency
  idempotencyKey: 'sale_{saleId}_created',
  
  // Payload
  payload: {
    saleId: 'sale_123',
    saleNumber: 'S-20260101-0001',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    registerId: 'register_001',
    sessionId: 'session_abc',
    shiftId: 'shift_xyz',
    customerId: 'customer_def' | null,
    offlineId: 'offline_123' | null,
    createdAt: '2026-01-01T12:00:00.000Z'
  }
}
```

---

### 2. SALE_COMPLETED

Emitted when a sale is fully paid and completed.

```typescript
{
  eventType: 'pos.sale.completed',
  eventId: 'evt_def456',
  timestamp: '2026-01-01T12:05:00.000Z',
  
  // Idempotency
  idempotencyKey: 'sale_{saleId}_completed',
  
  // Payload
  payload: {
    saleId: 'sale_123',
    saleNumber: 'S-20260101-0001',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    
    // Financials
    subtotal: 25.00,
    discountTotal: 5.00,
    taxTotal: 1.65,
    grandTotal: 21.65,
    
    // Line items (for inventory deduction)
    lineItems: [
      {
        lineItemId: 'li_001',
        productId: 'product_abc',
        variantId: 'variant_xyz' | null,
        quantity: 2,
        unitPrice: 12.50
      }
    ],
    
    // Payments
    payments: [
      {
        paymentId: 'pay_001',
        method: 'CASH',
        amount: 21.65
      }
    ],
    
    completedAt: '2026-01-01T12:05:00.000Z',
    offlineId: 'offline_123' | null
  }
}
```

**Core Actions on Receipt:**
- Deduct inventory for each line item
- Record revenue
- Update staff metrics

---

### 3. SALE_CANCELLED (VOIDED)

Emitted when a sale is voided before completion.

```typescript
{
  eventType: 'pos.sale.cancelled',
  eventId: 'evt_ghi789',
  timestamp: '2026-01-01T12:03:00.000Z',
  
  // Idempotency
  idempotencyKey: 'sale_{saleId}_cancelled',
  
  // Payload
  payload: {
    saleId: 'sale_123',
    saleNumber: 'S-20260101-0001',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    voidedByStaffId: 'staff_manager',
    reason: 'Customer changed mind',
    
    // Items that were in cart (for inventory release if reserved)
    lineItems: [
      {
        lineItemId: 'li_001',
        productId: 'product_abc',
        quantity: 2
      }
    ],
    
    cancelledAt: '2026-01-01T12:03:00.000Z'
  }
}
```

**Core Actions on Receipt:**
- Release any reserved inventory
- Log void for audit

---

### 4. PAYMENT_CAPTURED

Emitted when a payment is successfully processed.

```typescript
{
  eventType: 'pos.payment.captured',
  eventId: 'evt_jkl012',
  timestamp: '2026-01-01T12:04:30.000Z',
  
  // Idempotency
  idempotencyKey: 'payment_{paymentId}_captured',
  
  // Payload
  payload: {
    paymentId: 'pay_001',
    saleId: 'sale_123',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    
    // Payment details
    method: 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'SPLIT',
    amount: 21.65,
    tipAmount: 2.00,
    totalAmount: 23.65,
    currency: 'USD',
    
    // For cash
    cashReceived: 25.00,
    changeGiven: 1.35,
    
    // For card (reference to Core payment)
    corePaymentId: 'core_pay_abc' | null,
    cardLastFour: '4242' | null,
    cardBrand: 'Visa' | null,
    
    processedAt: '2026-01-01T12:04:30.000Z',
    offlineId: 'offline_pay_123' | null
  }
}
```

**Core Actions on Receipt:**
- Record payment in financial system
- Update daily cash totals (for cash)
- Reconcile with payment processor (for card)

---

## Additional Events (Non-Required)

### REFUND_CREATED

```typescript
{
  eventType: 'pos.refund.created',
  eventId: 'evt_mno345',
  timestamp: '2026-01-01T14:00:00.000Z',
  idempotencyKey: 'refund_{refundId}_created',
  
  payload: {
    refundId: 'refund_001',
    refundNumber: 'R-20260101-0001',
    originalSaleId: 'sale_123',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    approvedByStaffId: 'staff_manager' | null,
    
    totalRefunded: 12.50,
    refundMethod: 'CASH',
    reason: 'Defective product',
    
    // Items refunded (for inventory restore)
    items: [
      {
        lineItemId: 'li_001',
        productId: 'product_abc',
        quantity: 1,
        refundAmount: 12.50,
        restock: true
      }
    ],
    
    processedAt: '2026-01-01T14:00:00.000Z'
  }
}
```

### REGISTER_OPENED / REGISTER_CLOSED

```typescript
{
  eventType: 'pos.register.opened',
  eventId: 'evt_pqr678',
  idempotencyKey: 'session_{sessionId}_opened',
  
  payload: {
    sessionId: 'session_abc',
    registerId: 'register_001',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    openingCash: 100.00,
    openedAt: '2026-01-01T08:00:00.000Z'
  }
}

{
  eventType: 'pos.register.closed',
  eventId: 'evt_stu901',
  idempotencyKey: 'session_{sessionId}_closed',
  
  payload: {
    sessionId: 'session_abc',
    registerId: 'register_001',
    tenantId: 'tenant_456',
    staffId: 'staff_789',
    closedByStaffId: 'staff_789',
    closingCash: 350.00,
    expectedCash: 345.00,
    cashDifference: 5.00,
    closedAt: '2026-01-01T18:00:00.000Z'
  }
}
```

---

## Idempotency Rules

### Rule 1: Unique Event ID

Every event has a globally unique `eventId`:
```
evt_{timestamp}_{random}
```

### Rule 2: Idempotency Key

Every event has a domain-specific `idempotencyKey`:
```
{entity}_{entityId}_{action}
```

Examples:
- `sale_123_created`
- `sale_123_completed`
- `payment_456_captured`
- `refund_789_created`

### Rule 3: Core Deduplication

SaaS Core MUST:
1. Check `idempotencyKey` before processing
2. If key exists and was successful → return previous result
3. If key exists and failed → allow retry
4. Store idempotency keys with TTL (e.g., 7 days)

### Rule 4: Offline Handling

For events generated offline:
1. Include `offlineId` in payload
2. `eventId` is generated at creation (offline)
3. `idempotencyKey` prevents duplicates on sync
4. Timestamp reflects original action time, not sync time

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        POS MODULE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [User Action]                                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ POS Logic   │───▶│ Event       │───▶│ Offline Queue       │  │
│  │ (sale-engine)│   │ Emitter     │    │ (if offline)        │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                            │                      │              │
│                            │ (if online)          │ (when online)│
│                            ▼                      ▼              │
└────────────────────────────┼──────────────────────┼──────────────┘
                             │                      │
                             ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SaaS CORE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ Event Listener   │                                           │
│  │ (idempotent)     │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │ Inventory        │   │ Analytics        │                    │
│  │ Service          │   │ Service          │                    │
│  └──────────────────┘   └──────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### POS Module Responsibilities:
- Generate events with correct schema
- Ensure idempotency keys are consistent
- Queue events when offline
- Replay events on reconnection

### POS Module Does NOT:
- Process analytics
- Aggregate metrics
- Store event history (beyond sync queue)
- Know what Core does with events

### SaaS Core Responsibilities:
- Subscribe to `pos.*` events
- Deduplicate via idempotency key
- Route to appropriate handlers
- Store event history for audit
- Calculate analytics/metrics

---

## Verification Checklist

- [x] Events are module-scoped (`pos.*`)
- [x] No analytics logic in module
- [x] Idempotency keys defined for all events
- [x] Offline-generated events include `offlineId`
- [x] Event payloads are self-contained
- [x] Core actions documented but not implemented in POS

---

## Ready for Phase 8 - Module Entitlements
