# Wave B2 — Customer & Identity Coherence Report

**Date:** January 16, 2026  
**Scope:** System-wide coherence analysis of customer identity handling across SVM, MVM, and ParkHub  
**Mode:** READ-ONLY ANALYSIS — No code changes, no fixes, no refactors

---

## Executive Summary

**Overall Coherence Rating: MEDIUM**

The WebWaka platform implements a well-designed canonical customer identity system (`Wave J.2`) that provides read-only aggregation across commerce systems. However, several coherence gaps exist:

- ParkHub uses phone-only identity (no email), creating cross-system identity fragmentation
- SVM and MVM lack receipt linkage (order→receipt traversal impossible)
- No persistent customer ID storage—identity derived at query time from order data
- Privacy infrastructure is incomplete: no consent tracking, no GDPR/NDPR deletion capability

The canonical identity abstraction successfully unifies customers across systems for read operations, but the underlying data model has fundamental gaps that prevent complete identity coherence.

---

## 1. Canonical Customer Identity Usage

### 1.1 Implementation Location

**File:** `frontend/src/lib/commerce/canonical-customer/`
- `identity-resolution.ts` - Deterministic identity rules
- `canonical-customer-service.ts` - High-level aggregation service
- `adapters.ts` - Source system extractors (SVM, MVM, ParkHub)
- `types.ts` - CanonicalCustomer interface

### 1.2 Identity Resolution Logic

**Priority Order:**
1. Email (primary) - case-insensitive, normalized
2. Phone (secondary) - normalized to Nigerian format (+234)
3. Source reference (fallback) - hash of system:id

**Canonical ID Generation:**
```
hash = SHA256(email:normalized) → cust_<16chars>
OR
hash = SHA256(phone:normalized) → cust_<16chars>
OR  
hash = SHA256(source:system:id) → cust_<16chars>
```

### 1.3 Phone Normalization (Nigerian Format)

```
+234XXXXXXXXXX → +234XXXXXXXXXX (pass-through)
234XXXXXXXXXX  → +234XXXXXXXXXX (add plus)
0XXXXXXXXXX    → +234XXXXXXXXX  (replace 0 with +234)
XXXXXXXXXX     → +234XXXXXXXXXX (assume mobile, 7/8/9 prefix)
```

**GAP:** Best-effort normalization with edge cases where different inputs could resolve to same phone or same phone could resolve differently.

### 1.4 Ambiguity Detection

The system explicitly detects and flags:
- Same email with different phones
- Same phone with different emails
- Name variations for same contact info

**Behavior:** Returns multiple CanonicalCustomer entries + ambiguity flag; does NOT merge.

### 1.5 Places Where CanonicalCustomer IS Used

| Location | Usage |
|----------|-------|
| `GET /api/customers/canonical` | Resolve customer by email/phone |
| `GET /api/customers/canonical/from-order` | Resolve customer from order reference |
| `GET /api/orders/canonical` | List orders by customer identifier |
| `GET /api/proofs/by-order` | Get proof chain with customer verification |
| `GET /api/proofs/by-ticket` | Get proof chain with passenger verification |
| `resolveCustomerFromOrder()` | Internal order→customer resolution |

### 1.6 Places Where CanonicalCustomer IS NOT Used (But Should Logically Apply)

| Location | Issue |
|----------|-------|
| `VendorDashboardService` | Uses raw sub-order customer fields, not canonical |
| `OrderSplitService` | Creates orders with raw customer data, no canonical reference |
| `WhatsApp notifications` | Uses raw customerPhone/customerEmail from orders |
| Receipt generation | Uses raw customer fields from source orders |
| Payment webhook handlers | Reference orders by ID, not canonical customer |
| Order recovery service | Uses raw order data, no canonical customer linkage |

---

## 2. Order → Customer Resolution Paths

### 2.1 SVM Path

**Data Source:** `svm_orders`

| Field | Type | Notes |
|-------|------|-------|
| `customerEmail` | String | Required - primary identifier |
| `customerPhone` | String? | Optional - secondary identifier |
| `customerName` | String? | Display name |
| `customerId` | String? | **Always NULL** - no customer table exists |

**Resolution Flow:**
```
svm_orders.customerEmail → normalizeEmail() → generateCanonicalId()
                                           ↓
                          CanonicalCustomer { email, phone?, name? }
```

**GAP:** No dedicated `svm_customers` table. Identity derived entirely from order records. Multiple orders from same customer are linked only by email/phone match at query time.

### 2.2 MVM Path

**Data Source:** `mvm_parent_order`

| Field | Type | Notes |
|-------|------|-------|
| `customerEmail` | String | Required - primary identifier |
| `customerPhone` | String? | Optional - secondary identifier |
| `customerName` | String? | Display name |
| `customerId` | String? | **Always NULL** - no customer table exists |

**Resolution Flow:**
```
mvm_parent_order.customerEmail → normalizeEmail() → generateCanonicalId()
                                               ↓
                              CanonicalCustomer { email, phone?, name? }
```

**Sub-Order Vendor Visibility:**
```
mvm_sub_order {
  customerName     → Visible to vendor
  shippingCity     → Visible (coarse location)
  shippingState    → Visible (coarse location)
  shippingCountry  → Visible (NG default)
  
  // NOT visible to vendor:
  // customerEmail, customerPhone, full shippingAddress
}
```

**CONFIRMED STRENGTH:** Vendors see sanitized customer info. Full PII (email, phone, address) only on parent order.

**GAP:** `customerId` field exists but is always NULL. No persistent customer records.

### 2.3 ParkHub Path

**Data Source:** `park_ticket`

| Field | Type | Notes |
|-------|------|-------|
| `passengerPhone` | String? | **PRIMARY IDENTIFIER** - no email |
| `passengerName` | String | Required - display name |

**Resolution Flow:**
```
park_ticket.passengerPhone → normalizePhone() → generateCanonicalId()
                                            ↓
                          CanonicalCustomer { phone, name, email: undefined }
```

**CRITICAL GAP:** ParkHub has NO email field. Passengers are identified by phone only.

**Identity Mismatch Scenario:**
```
SVM Order: customer@email.com, +234801234567, "John Doe"
           → canonicalId: cust_abc123... (based on email)

ParkHub Ticket: +234801234567, "John Doe"  
           → canonicalId: cust_xyz789... (based on phone)

Result: Same person, DIFFERENT canonical IDs
```

The `getByPhone()` method will aggregate both, but `getByEmail()` will miss ParkHub entirely.

---

## 3. Customer → Proof → Order Traversal

### 3.1 Traversal Matrix

| Direction | SVM | MVM | ParkHub |
|-----------|-----|-----|---------|
| Order → Receipt | ❌ No FK | ❌ No FK | ✅ via sourceType/sourceId |
| Order → Ticket | N/A | N/A | ✅ via trip |
| Ticket → Receipt | N/A | N/A | ✅ via sourceType=PARKHUB_TICKET |
| Receipt → Order | ❌ Manual | ❌ Manual | ✅ via sourceId |
| Ticket → Manifest | N/A | N/A | ✅ via tripId |
| Manifest → Tickets | N/A | N/A | ✅ via tripId |

### 3.2 Proof Coverage (From Code)

```typescript
// frontend/src/lib/commerce/canonical-proof/canonical-proof-service.ts
getCoverageMatrix(): [
  { system: 'SVM', 
    canResolveReceipt: false, 
    canResolveTicket: false, 
    canResolveManifest: false,
    notes: ['SVM orders have no direct FK to receipts',
            'Receipt linkage requires sourceType=SVM_ORDER match (not implemented)'] },
  { system: 'MVM', 
    canResolveReceipt: false, 
    canResolveTicket: false, 
    canResolveManifest: false,
    notes: ['MVM orders have no direct FK to receipts'] },
  { system: 'PARKHUB', 
    canResolveReceipt: true, 
    canResolveTicket: true, 
    canResolveManifest: true,
    notes: ['Full proof chain: Ticket → Receipt + Manifest'] }
]
```

### 3.3 Orphaned Proof Risk

**SVM/MVM:** Receipts are generated but NOT linked back to orders. If a receipt exists, finding its source order requires:
1. Matching `receipt.sourceType` (e.g., "SVM_ORDER")
2. Matching `receipt.sourceId` to `svm_orders.id`

However, this linkage is NOT created during order processing for SVM/MVM.

**ParkHub:** Full proof chain exists. Tickets link to receipts via `PARKHUB_TICKET` sourceType.

### 3.4 Cross-Tenant Leakage

**CONFIRMED SAFE:** All queries include `tenantId` filter. No cross-tenant data access possible through documented APIs.

---

## 4. Public & Semi-Public Identity Exposure

### 4.1 Public APIs Analyzed

| Endpoint | Security Model | Data Exposed |
|----------|----------------|--------------|
| `GET /api/customers/canonical` | tenantSlug required | email, phone, name (filtered by search param) |
| `GET /api/customers/canonical/from-order` | email/phone match required for live tenants | customer identity |
| `GET /api/orders/canonical` | Demo: all; Live: email/phone filter | order details, customer info |
| `GET /api/proofs/by-order` | email/phone match for live tenants | proof documents |
| `GET /api/proofs/by-ticket` | phone match for live tenants | ticket + proof chain |
| `GET /api/proofs/by-manifest` | No customer verification | manifest data |

### 4.2 Security Models

**Demo Tenants:**
- `tenant.slug.startsWith('demo')` OR `tenant.name.includes('demo')`
- Full access to all orders, customers, proofs without verification
- No rate limiting observed

**Live Tenants:**
- Require email or phone that matches the order/ticket customer
- Prevents enumeration of arbitrary orders
- Order number alone is NOT sufficient (good)

### 4.3 Inference Risks

| Risk | Description | Severity |
|------|-------------|----------|
| Customer existence | Querying by email reveals if customer has orders | Low |
| Order frequency | List orders by email shows purchase history | Medium |
| Ticket travel patterns | Phone lookup reveals travel history | Medium |
| Demo tenant exposure | Demo data may contain realistic-looking PII | Low |

### 4.4 Demo vs Live Behavior Differences

| Behavior | Demo Tenant | Live Tenant |
|----------|-------------|-------------|
| Order listing | All orders visible | Filtered by email/phone |
| Customer lookup | Full access | email/phone match required |
| Proof access | Full access | Customer verification required |
| Order detail by ref | Direct access | Direct access (order number = token) |

**GAP:** Order number acts as a bearer token. Anyone with the order number can view order details regardless of customer verification.

---

## 5. Privacy, NDPR, and GDPR Risk Documentation

### 5.1 PII Inventory

| Table | PII Fields | Sensitivity |
|-------|------------|-------------|
| `svm_orders` | customerEmail, customerPhone, customerName, shippingAddress | High |
| `mvm_parent_order` | customerEmail, customerPhone, customerName, shippingAddress | High |
| `mvm_sub_order` | customerName, shippingCity, shippingState | Medium |
| `park_ticket` | passengerPhone, passengerName | High |
| `receipt` | customerName, customerPhone, customerEmail | Medium |

### 5.2 Consent Status

| Requirement | Status |
|-------------|--------|
| Explicit consent collection | ❌ Not implemented |
| Consent timestamps | ❌ Not implemented |
| Consent scope tracking | ❌ Not implemented |
| Consent withdrawal mechanism | ❌ Not implemented |

**GAP:** All PII is stored without explicit consent tracking. Consent is implied through order placement.

### 5.3 Retention Rules

| Requirement | Status |
|-------------|--------|
| Data retention policy | ❌ Not defined |
| Automatic data expiry | ❌ Not implemented |
| Retention period configuration | ❌ Not implemented |
| Archive vs active data separation | ❌ Not implemented |

**GAP:** No retention policy exists. All data persists indefinitely.

### 5.4 Right to Be Forgotten

| Requirement | Status |
|-------------|--------|
| Customer data deletion | ❌ Not possible |
| PII anonymization | ❌ Not implemented |
| Deletion request tracking | ❌ Not implemented |
| Cascading deletion | ❌ Not implemented |

**GAP:** Cannot fulfill GDPR Article 17 (Right to Erasure). Customer identity is embedded in order records with no deletion or anonymization path.

### 5.5 Identity Derivation Without Awareness

| Scenario | Risk |
|----------|------|
| Phone normalization | Phone variants resolve to same identity without user knowledge |
| Cross-system linking | Same phone links SVM/MVM/ParkHub orders without explicit consent |
| Canonical ID generation | Deterministic hash creates persistent identity without user awareness |

---

## 6. Explicit Gap List

### GAP-1: ParkHub Phone-Only Identity
- **Description:** ParkHub tickets have no email field, using phone as primary identifier
- **Affected Systems:** ParkHub, Canonical Customer resolution
- **Risk Level:** HIGH
- **Why it CANNOT be fixed in Wave B2:** Schema changes forbidden; would require adding email field to `park_ticket`

### GAP-2: No Persistent Customer Records
- **Description:** `customerId` fields exist but are always NULL; identity derived from order data at query time
- **Affected Systems:** SVM, MVM, all customer-related queries
- **Risk Level:** MEDIUM
- **Why it CANNOT be fixed in Wave B2:** Would require new `customer` table and migration of existing orders

### GAP-3: SVM/MVM Order-Receipt Linkage Missing
- **Description:** Orders have no FK to receipts; proof traversal impossible for SVM/MVM
- **Affected Systems:** SVM, MVM, Receipt resolution
- **Risk Level:** MEDIUM
- **Why it CANNOT be fixed in Wave B2:** Would require schema changes and new receipt creation logic

### GAP-4: Cross-System Identity Fragmentation
- **Description:** Same customer with email+phone gets different canonicalId for ParkHub (phone-only) vs SVM/MVM (email)
- **Affected Systems:** All commerce systems when queried by email
- **Risk Level:** HIGH
- **Why it CANNOT be fixed in Wave B2:** Fundamental architecture gap; requires ParkHub email support

### GAP-5: Order Number as Bearer Token
- **Description:** Anyone with order number can view order details without customer verification
- **Affected Systems:** Public order pages, `resolveOrderByRef()`
- **Risk Level:** MEDIUM
- **Why it CANNOT be fixed in Wave B2:** Would require adding order-level access control or verification codes

### GAP-6: No Consent Tracking
- **Description:** PII stored without explicit consent timestamps or scope tracking
- **Affected Systems:** All commerce systems
- **Risk Level:** HIGH (for NDPR/GDPR compliance)
- **Why it CANNOT be fixed in Wave B2:** Would require new consent tables and UI

### GAP-7: No Right-to-Erasure Capability
- **Description:** Cannot delete or anonymize customer data; identity embedded in order records
- **Affected Systems:** All commerce systems
- **Risk Level:** HIGH (for GDPR compliance)
- **Why it CANNOT be fixed in Wave B2:** Would require anonymization logic and cascade deletion

### GAP-8: Phone Normalization Edge Cases
- **Description:** Best-effort normalization may produce collisions or inconsistencies for non-Nigerian numbers
- **Affected Systems:** Canonical Customer resolution, ParkHub
- **Risk Level:** LOW
- **Why it CANNOT be fixed in Wave B2:** Would require extended phone validation library

---

## 7. Invariants Confirmed (Safe and Should Not Be Changed)

### INV-1: Tenant Isolation
All queries include `tenantId` filter. Cross-tenant data access is not possible through any documented path.

### INV-2: Vendor Data Sanitization
MVM vendors see only `customerName`, `shippingCity`, `shippingState`. No email, phone, or full address exposed.

### INV-3: Live Tenant Customer Verification
Public APIs for live tenants require email/phone that matches the order customer before returning data.

### INV-4: Deterministic Canonical ID
Same normalized email/phone always produces same canonicalId. No randomness in identity resolution.

### INV-5: Ambiguity Detection
System explicitly flags when multiple customers match a query, rather than silently merging or picking one.

### INV-6: ParkHub Full Proof Chain
Ticket → Receipt → Manifest traversal works correctly for ParkHub with proper foreign key relationships.

---

## 8. No-Assumption Confirmation

This report is based entirely on:
- Direct code analysis of source files
- Prisma schema inspection
- API endpoint implementation review
- Service layer implementation review

**No assumptions were made about:**
- Missing functionality that "should" exist
- Intended behavior not reflected in code
- Future plans or roadmap items
- External system integrations not visible in codebase

All findings reflect **what the code explicitly does**, not what it might intend to do.

---

## Wave B2 Complete

**Status:** Analysis complete. Report saved to repository root.  
**Next Wave:** B3 (if authorized)  
**Constraint Compliance:** ✅ No code changes made. Analysis only.
