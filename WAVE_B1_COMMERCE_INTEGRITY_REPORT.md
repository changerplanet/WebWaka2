# Wave B1: Commerce Integrity Analysis Report

**Date:** January 16, 2026  
**Analyst:** Replit Agent (Claude 4.5 Opus)  
**Scope:** READ-ONLY analysis of order flows, payment consistency, and inventory management  
**Constraint:** No code changes or fixes - analysis only

---

## Executive Summary

Wave B1 conducted a comprehensive read-only integrity analysis of WebWaka's commerce systems across three channels: SVM (Single-Vendor Marketplace), MVM (Multi-Vendor Marketplace), and ParkHub (Motor Park Ticketing). The analysis identified **2 critical gaps**, **1 moderate risk**, and confirmed **5 areas with robust integrity controls**.

### Critical Findings Requiring Immediate Attention:

1. **CRITICAL:** Inventory-Payment Timing Gap (MVM) - Inventory deducted before payment confirmation
2. **CRITICAL:** ParkHub Seat Selection Race Condition - No atomic lock on seat reservation

---

## 1. Order Lifecycle Integrity

### 1.1 MVM Order State Machine (PASS)

**Parent Order States:**
```
PENDING → CONFIRMED → PARTIALLY_FULFILLED → COMPLETED
         ↓
       CANCELLED / EXPIRED
```

**Sub-Order States:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓           ↓           ↓
  CANCELLED CANCELLED  CANCELLED   CANCELLED
                                      ↓
                                   REFUNDED
```

**Finding:** State transitions are well-defined in `sub-order-service.ts` with explicit valid transition rules. Terminal states (`DELIVERED`, `CANCELLED`, `REFUNDED`) properly block further transitions.

**Evidence:** `frontend/src/lib/mvm/sub-order-service.ts:30-38`
```typescript
const VALID_TRANSITIONS: Record<MvmSubOrderStatus, MvmSubOrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: []
}
```

### 1.2 SVM Order Flow (PASS)

SVM uses a session-based checkout with three phases:
1. `summary` - Calculate totals
2. `validate` - Check inventory and addresses  
3. `finalize` - Create order

**Finding:** SVM checkout properly validates inventory before finalization.

### 1.3 ParkHub Ticket Lifecycle (PASS with NOTE)

Ticket states: `QUEUED → SYNCED` (offline-first model)

**Finding:** ParkHub uses client-side ticket IDs for idempotency, preventing duplicate tickets on retry.

**Evidence:** `frontend/src/lib/commerce/parkhub/parkhub-pos-service.ts:159-169`

---

## 2. Payment-Order Consistency

### 2.1 Webhook Idempotency (PASS)

**Finding:** Payment webhooks correctly check transaction status before processing.

**Evidence:** `frontend/src/lib/payment-execution/webhook-processor.ts:124-132`
```typescript
if (transaction.status === 'CAPTURED' || transaction.status === 'PAID') {
  return {
    success: true,
    message: 'Transaction already processed',
    alreadyProcessed: true
  }
}
```

**Behavior:** Duplicate webhook events return `{alreadyProcessed: true}` without re-processing.

### 2.2 Payment Failure Handling (PASS)

**Finding:** When payment initiation fails, the order is properly cancelled.

**Evidence:** `frontend/src/app/api/mvm/checkout/route.ts:256-266`
```typescript
if (!paymentResponse.success) {
  await OrderSplitService.cancelOrder(orderResult.parentOrderId, 'Payment initiation failed')
  return NextResponse.json({ error: paymentResponse.error || 'Payment initiation failed.' })
}
```

### 2.3 COD Payment Flow (PASS)

**Finding:** Cash on Delivery orders correctly bypass payment initiation and set status to `PENDING`.

---

## 3. Inventory Integrity

### 3.1 CRITICAL: Inventory-Payment Timing Gap (MVM)

**Severity:** CRITICAL  
**Risk:** Financial loss / overselling

**Finding:** Inventory is deducted AFTER payment is initiated but BEFORE webhook confirms payment success. If a customer abandons payment after initiation, inventory remains deducted but no payment is received.

**Evidence:** `frontend/src/app/api/mvm/checkout/route.ts:268`
```typescript
// This happens AFTER initiatePayment but BEFORE webhook confirmation
await deductInventory(ctx.tenantId, checkoutData.cart.items)
```

**Further Evidence:** `frontend/src/lib/payment-execution/webhook-processor.ts:168-169`
```typescript
// GAP: On payment failure or timeout, inventory is NOT automatically restored
// This is documented as a known gap requiring manual intervention or future enhancement
```

**Impact Analysis:**
- Customer initiates payment, inventory deducted
- Customer closes browser / payment fails at gateway
- Inventory remains deducted, order may stay in PENDING forever
- Order recovery service (24-hour expiry) does NOT restore inventory

**Recommended Remediation:**
1. Move inventory deduction to webhook success handler
2. OR implement "reserved" inventory that releases after timeout
3. Add inventory restoration on payment failure webhook

### 3.2 Inventory Validation Before Checkout (PASS)

**Finding:** Inventory sufficiency is validated before order creation.

**Evidence:** `frontend/src/app/api/mvm/checkout/route.ts:123-136`

### 3.3 Cross-Channel Inventory Sync (PASS)

**Finding:** `InventorySyncEngine` properly handles inventory events across POS, SVM, MVM, and ParkHub channels with conflict detection.

---

## 4. ParkHub Specific Integrity

### 4.1 CRITICAL: Seat Selection Race Condition

**Severity:** CRITICAL  
**Risk:** Double-booking of seats

**Finding:** Seat availability is checked by reading booked seats AND queued seats, but there is no atomic lock between the check and the queue insertion. Two concurrent agents selecting the same seat in a brief window could both succeed.

**Evidence:** `frontend/src/lib/commerce/parkhub/parkhub-pos-service.ts:102-156`
```typescript
// Step 1: Read booked seats
const bookedSeatNumbers = trip.tickets.map(t => t.seatNumber)

// Step 2: Read queued seats
const queuedSeats = await prisma.parkhub_pos_queue.findMany({...})

// Step 3: Build seat map
// NO LOCK between steps 1-2 and actual queue insertion
```

**Race Window:** Between `getTripSeats()` returning available seats to agent and `queueTicket()` being called, another agent could queue the same seat.

**Impact:** Low frequency due to offline-first nature (agents work mostly disconnected), but possible during sync bursts.

**Recommended Remediation:**
1. Use database-level unique constraint on (tripId, seatNumber) in queue table
2. OR implement optimistic locking with version checks
3. Add conflict detection during sync with auto-seat-reassignment

### 4.2 Client Ticket ID Idempotency (PASS)

**Finding:** ParkHub uses `clientTicketId` with unique constraint to prevent duplicate ticket creation on retry.

---

## 5. MVM Partial Fulfillment

### 5.1 Parent Status Aggregation (PASS)

**Finding:** `FulfillmentService.recalculateParentStatus()` correctly aggregates sub-order states to determine parent order status.

**Evidence:** `frontend/src/lib/mvm/fulfillment-service.ts:152-209`

**Logic:**
- All sub-orders terminal → `COMPLETED`
- Any delivered, others not terminal → `PARTIALLY_FULFILLED`
- All cancelled → `CANCELLED`
- Payment confirmed, none delivered → `CONFIRMED`

### 5.2 Commission Clearing (PASS)

**Finding:** Commissions are only created when sub-order reaches `DELIVERED` status, with a configurable clearance period (default 7 days).

**Evidence:** `frontend/src/lib/mvm/sub-order-service.ts:222-225`

---

## 6. Refund Intent Safety

### 6.1 No Automatic Money Movement (PASS)

**Finding:** RefundIntentService explicitly documents that it does NOT execute refunds - it only tracks customer intent for operator visibility.

**Evidence:** `frontend/src/lib/mvm/refund-intent-service.ts:4-9`
```typescript
/**
 * IMPORTANT: This service tracks refund INTENT only.
 * It does NOT initiate actual refunds or money movement.
 * Operators use this to see refund requests and handle them manually.
 */
```

**Behavior:**
- `APPROVED` status does NOT trigger payout reversal
- Only operator-facing visibility
- Actual refunds require manual intervention

---

## 7. Order Recovery Mechanisms

### 7.1 Payment Retry Safety (PASS)

**Finding:** Order recovery service reuses existing order ID - does not create duplicates.

**Evidence:** `frontend/src/lib/mvm/order-recovery-service.ts:146-147`
```typescript
// Does NOT create a new order - reuses existing order
```

### 7.2 Order Expiration (PASS with GAP)

**Finding:** Orders expire after 24 hours without payment, but **inventory is NOT restored** on expiration.

**Evidence:** The `expireOrder()` function sets status to `EXPIRED` but does not call inventory restoration.

---

## 8. Cross-System Consistency

### 8.1 Canonical Order Service (PASS)

**Finding:** `CanonicalOrderService` provides unified order view across SVM, MVM, and legacy channels with proper status mapping.

### 8.2 Canonical Customer Service (PASS)

**Finding:** Identity resolution across channels prevents duplicate customer records.

---

## Summary of Findings

| Area | Status | Severity | Notes |
|------|--------|----------|-------|
| MVM Order State Machine | PASS | - | Well-defined transitions |
| SVM Order Flow | PASS | - | Session-based with validation |
| ParkHub Ticket Lifecycle | PASS | - | Idempotent via clientTicketId |
| Webhook Idempotency | PASS | - | Prevents double-processing |
| Payment Failure Handling | PASS | - | Order cancelled on failure |
| **Inventory-Payment Timing** | **FAIL** | **CRITICAL** | Inventory deducted before confirmation |
| Inventory Validation | PASS | - | Checked before checkout |
| **ParkHub Seat Race** | **FAIL** | **CRITICAL** | No atomic lock on seats |
| Parent Status Aggregation | PASS | - | Correct state aggregation |
| Commission Clearing | PASS | - | Only on DELIVERED |
| RefundIntent Safety | PASS | - | No auto money movement |
| Payment Retry Safety | PASS | - | Reuses existing order |
| Order Expiration | PASS/GAP | MODERATE | No inventory restoration |

---

## Recommended Remediation Priority

### P0 - Critical (Before Real Money)

1. **Inventory-Payment Timing Gap**
   - Move inventory deduction to webhook success handler
   - Add inventory restoration on payment failure/expiration

2. **ParkHub Seat Race Condition**
   - Add unique constraint on (tripId, seatNumber) in queue table
   - Implement conflict resolution during sync

### P1 - Important (After Launch)

3. **Order Expiration Inventory**
   - Add inventory restoration when order expires

---

## Wave B1 Conclusion

WebWaka's commerce layer has strong foundational integrity with well-defined state machines, idempotent webhooks, and safe refund intent handling. However, **two critical gaps must be addressed before enabling real money transactions**:

1. The inventory-payment timing gap could cause inventory leakage
2. The ParkHub seat selection race could cause double-booking

**Recommendation:** Complete remediation of P0 items before declaring the platform safe for production financial transactions.

---

*Report generated by Wave B1 Commerce Integrity Analysis*  
*Wave B1 Constraint: READ-ONLY - No code changes applied*
