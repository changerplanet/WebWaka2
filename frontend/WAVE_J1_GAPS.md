# Wave J.1 Gap Documentation

## Overview

This document records all gaps, inconsistencies, and limitations discovered during the implementation of Wave J.1 (Unified Order Abstraction). These gaps are documented per spec requirements and are NOT solved or worked around in Wave J.1.

---

## GAP 1: No Unified Customer Identity

**What is missing:**
- Customers exist as disconnected entities across SVM (email), MVM (email/phone), and ParkHub (phone/name)
- No unified customer ID links purchases across order types
- Same person may have different identifiers in each system

**Impact:**
- Cannot reliably aggregate all orders for a single customer
- Customer history is fragmented by order type
- Loyalty/rewards programs would be difficult to implement

**Current workaround:**
- Query each system separately using email OR phone as the linking key
- May miss orders if customer used different contact info

**Deferred to:** Wave J.2 (Canonical Customer Identity Layer)

---

## GAP 2: Inconsistent Status Enums

**What is missing:**
- SVM uses `SvmOrderStatus` enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- MVM uses string status: PENDING, SPLIT, COMPLETED, CANCELLED
- ParkHub uses string status: VALID, USED, CANCELLED, EXPIRED

**Semantic differences:**
- SVM "REFUNDED" has no MVM/ParkHub equivalent
- MVM "SPLIT" represents internal order decomposition, not a customer-visible state
- ParkHub "EXPIRED" is time-based, not action-based
- ParkHub "USED" means service was consumed, unlike "DELIVERED" for goods

**Current workaround:**
- Map to canonical statuses with best-effort matching
- Store original status in metadata for audit/debugging

**Deferred to:** Post-Wave J - may require business decision on status unification

---

## GAP 3: Payment Status Inconsistency

**What is missing:**
- SVM uses `SvmPaymentStatus` enum: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
- MVM uses string: PENDING, PAID, FAILED
- ParkHub uses string: PAID, PENDING, REFUNDED

**Differences:**
- SVM supports PARTIALLY_REFUNDED; others do not
- Refund handling varies by system
- No unified refund model exists

**Current workaround:**
- Map to canonical statuses; treat REFUNDED as CANCELLED
- PARTIALLY_REFUNDED mapped to PAID (order still valid)

**Deferred to:** Post-Wave J - requires refund abstraction work

---

## GAP 4: ParkHub Tickets Are Not Traditional Orders

**What is missing:**
- ParkHub "tickets" represent purchased travel, not physical goods
- Lifecycle is fundamentally different:
  - No shipping, no fulfillment
  - "USED" means passenger traveled, not "item received"
  - Time-bound validity (expiration)
  - Single-item only (one ticket = one seat)

**Structural differences:**
- No `customerEmail` field (only `passengerPhone`)
- `soldAt` instead of `createdAt`
- `seatNumber` instead of product variants
- `tripId` links to travel context

**Current workaround:**
- Ticket is treated as single-item order
- Seat info in item name
- Travel metadata preserved separately

**Deferred to:** May require explicit "service order" vs "goods order" distinction in future

---

## GAP 5: Missing Receipt Linkage

**What is missing:**
- Orders and receipts are not explicitly linked
- Receipt records may exist separately with reference numbers
- No guaranteed `orderId → receiptId` or `receiptId → orderId` relationship

**Impact:**
- Cannot show "View Receipt" directly from order view
- Receipt verification requires separate lookup

**Current workaround:**
- Metadata includes `reference` which may match receipt reference
- No receipt data included in canonical order response

**Deferred to:** Wave J.3 (Receipt ↔ Order Universal Linking)

---

## GAP 6: MVM Sub-Order Visibility

**What is missing:**
- MVM parent orders split into vendor-specific sub-orders
- Sub-orders have their own status, fulfillment, and tracking
- Canonical order only represents parent order

**Impact:**
- Cannot see per-vendor fulfillment status
- Cannot track individual vendor shipments
- Order status is aggregate, may not reflect individual vendor delays

**Current workaround:**
- Sub-order summary included in metadata
- Parent order status used as canonical status

**Deferred to:** Future MVM enhancement - sub-order visibility in customer portal

---

## GAP 7: No Pagination Architecture

**What is missing:**
- No cursor-based pagination implemented
- Simple `limit` parameter with no offset/cursor
- Cannot efficiently page through large order histories

**Impact:**
- Limited to 50 orders per request
- Older orders not accessible without increasing limit

**Current workaround:**
- Fixed limit of 50 orders
- Orders sorted by date descending (most recent first)

**Deferred to:** Post-Wave J - requires pagination abstraction

---

## GAP 8: Tenant ID Exposure

**What is missing:**
- Tenant ID is passed explicitly to API endpoints
- No server-side tenant resolution from session/domain

**Impact:**
- API callers must know and provide tenantSlug
- No implicit tenant context from authentication

**Current workaround:**
- Require tenantSlug query parameter
- Validate tenant exists before processing

**Deferred to:** Wave J.4 (Tenant-Opaque API Boundary)

---

## GAP 9: No Authentication Layer

**What is missing:**
- No customer authentication for order access
- Demo tenants allow open access
- Live tenants use email/phone as weak identity

**Security concerns:**
- Email/phone enumeration possible
- No proof of ownership for order access
- Reference number acts as implicit token

**Current workaround:**
- Demo tenants: full visibility
- Live tenants: require customer identifier
- Order detail accessible via reference (implicit token)

**Deferred to:** Post-Wave J - requires customer auth infrastructure

---

## GAP 10: Currency Assumption

**What is missing:**
- All orders assume NGN currency
- No multi-currency support in canonical model
- Currency conversion not handled

**Current workaround:**
- Hardcoded `currency: 'NGN'` in canonical money type
- Actual currency from source preserved in amount

**Deferred to:** Post-Wave J - requires multi-currency strategy

---

## Summary

| Gap # | Description | Severity | Deferred To |
|-------|-------------|----------|-------------|
| 1 | No unified customer identity | High | Wave J.2 |
| 2 | Inconsistent status enums | Medium | Post-Wave J |
| 3 | Payment status inconsistency | Medium | Post-Wave J |
| 4 | ParkHub structural differences | Medium | Future |
| 5 | Missing receipt linkage | High | Wave J.3 |
| 6 | MVM sub-order visibility | Medium | Future |
| 7 | No pagination architecture | Low | Post-Wave J |
| 8 | Tenant ID exposure | High | Wave J.4 |
| 9 | No authentication layer | High | Post-Wave J |
| 10 | Currency assumption | Low | Post-Wave J |

---

## Document Metadata

- **Wave:** J.1 - Unified Order Abstraction
- **Created:** Wave J.1 Implementation
- **Status:** Complete - gaps documented per spec
- **Next Steps:** Review gaps, decide Wave J.2 scope
