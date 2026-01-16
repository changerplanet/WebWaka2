# Wave J.3 Gap Documentation

## Overview

This document records all gaps, inconsistencies, and limitations discovered during the implementation of Wave J.3 (Receipt & Proof Linking). These gaps are documented per spec requirements and are NOT fixed in Wave J.3.

---

## GAP 1: Missing Foreign Key Relationships

**What is missing:**
- No direct FK from `svm_orders` to `receipt`
- No direct FK from `mvm_parent_order` to `receipt`
- Receipt-to-order linkage relies on `sourceType` + `sourceId` string matching

**Impact:**
- Cannot guarantee referential integrity
- Orphan receipts possible
- Query performance degraded (no indexed FK joins)

**Current workaround:**
- Match via `sourceType` and `sourceId` fields
- Document that linkage may fail if sourceId doesn't match

**Structural debt:** High priority for future schema normalization

---

## GAP 2: Receipt ↔ Order Mismatches

**What is missing:**
- SVM orders use `svm_orders.id` as identifier
- POS receipts use `pos_sale.id` as sourceId
- These are different tables with different IDs

**Impact:**
- `SVM_ORDER` → receipt resolution likely returns empty results
- No direct path from SVM order to its receipt

**Current workaround:**
- Attempt match via sourceType='SVM_ORDER' + orderId
- Document expected failure in proof metadata

**Root cause:** Receipt was designed for POS/ParkHub, not integrated with SVM order flow

---

## GAP 3: ParkHub vs Commerce Receipt Differences

**What is missing:**
- ParkHub receipts have transport-specific fields (routeId, tripId, seatNumbers)
- Commerce receipts have product-oriented structure
- No unified receipt model

**Impact:**
- Canonical receipt must accommodate both structures
- Some fields are nullable/meaningless depending on source

**Current workaround:**
- Generic CanonicalReceipt type with optional fields
- Source-specific data in metadata

**Architectural note:** Consider separate receipt types in future

---

## GAP 4: Manifest → Receipt Ambiguity

**What is missing:**
- Manifest links to trip via `tripId`
- Receipts link to tickets via `sourceId`
- No direct manifest → receipt relationship

**Impact:**
- Must traverse: Manifest → Trip → Tickets → Receipts
- Multiple queries required for full proof chain
- Performance cost scales with ticket count

**Current workaround:**
- Iterate through all tickets on the manifest's trip
- Collect receipts for each ticket

---

## GAP 5: Multi-Receipt Per Order Inconsistencies

**What is missing:**
- An order may have 0, 1, or many receipts
- No constraint on receipt-per-order relationship
- Duplicate receipts possible (reprints, corrections)

**Impact:**
- Proof chain may return multiple receipts
- No way to identify "primary" receipt
- Verification URL may differ across receipts

**Current workaround:**
- Return all matched receipts in array
- Let consumer determine which is authoritative

---

## GAP 6: Legacy Data Edge Cases

**What is missing:**
- Old orders created before receipt system have no receipts
- Historical ParkHub tickets may lack receipt linkage
- Migration path for backfilling receipts not defined

**Impact:**
- Proof chain returns empty for legacy data
- Cannot verify old transactions

**Current workaround:**
- Return empty arrays when no receipts found
- Document that legacy data may have gaps

---

## GAP 7: Verification URL Inconsistencies

**What is missing:**
- Receipts use `verificationQrCode` (not `verificationUrl`)
- QR code contains verification URL but requires parsing
- Not all receipts have verification QR codes

**Impact:**
- Cannot guarantee verification capability
- QR code format may vary

**Current workaround:**
- Use `verificationQrCode` field directly
- Return in verificationUrls array (may be empty)

---

## GAP 8: sourceType Value Inconsistencies

**What is missing:**
- `sourceType` is a string field, not an enum
- Known values: POS_SALE, PARKHUB_QUEUE, PARKHUB_TICKET
- SVM_ORDER and MVM_ORDER may not be used in practice

**Impact:**
- New source types may be added without schema change
- Typos in sourceType are not caught
- Query matching is fragile

**Current workaround:**
- Document known sourceType values
- Use string matching for resolution

---

## GAP 9: No Pagination for Proof Traversal

**What is missing:**
- Manifest with many tickets returns all receipts in one query
- No limit on receipt collection
- Large manifests may cause performance issues

**Impact:**
- Memory pressure for large result sets
- No cursor-based pagination

**Current workaround:**
- Return all results (unbounded)
- Document performance concern

---

## GAP 10: Tenant Isolation in Receipt sourceId

**What is missing:**
- `sourceId` references IDs from other tables
- No guarantee that sourceId belongs to same tenant
- Cross-tenant reference theoretically possible

**Impact:**
- Security vulnerability if sourceId from different tenant
- Must validate tenant match on source lookup

**Current workaround:**
- Filter by tenantId in all queries
- Return null if tenant mismatch detected

---

## GAP 11: Manifest generatedAt Nullable

**What is missing:**
- `park_manifest.generatedAt` is nullable
- Manifests may exist without generation timestamp

**Impact:**
- Temporal ordering may be inaccurate for manifests without timestamp
- Consumer must handle undefined generatedAt

**Current workaround:**
- Return undefined if null (no data fabrication)
- CanonicalManifest.generatedAt is optional field

---

## GAP 12: No Receipt for MVM Sub-Orders

**What is missing:**
- MVM parent orders split into sub-orders per vendor
- Receipts may be generated at sub-order level, not parent
- No clear receipt-to-suborder mapping

**Impact:**
- Parent order proof may miss vendor-specific receipts
- Cannot track per-vendor fulfillment receipts

**Current workaround:**
- Only search for parent order receipts
- Document sub-order receipt gap

---

## GAP 13: Proof API Security Gating

**Security model implemented:**
- Demo tenants: Full access (no email/phone required)
- Live tenants: Require email/phone that MATCHES the order/ticket/receipt customer
- Tenant isolation enforced via tenantId filtering
- Verification performed against actual customer data before returning proof

**What is still missing:**
- No true customer authentication (email/phone is self-asserted, not verified)
- No session-based access control
- Manifest access grants visibility to all passengers on trip

**Impact:**
- Attacker must know BOTH reference AND customer identifier
- Still vulnerable to email/phone harvesting attacks

**Current workaround:**
- Validate provided email/phone against stored customer data
- Deny access if identifier doesn't match order owner
- Combined with tenant isolation for defense in depth

**Deferred to:** Post-Wave J - requires true customer auth infrastructure with email/phone verification

---

## Resolver Coverage Matrix

| System | Receipt Resolution | Ticket Resolution | Manifest Resolution | Notes |
|--------|-------------------|-------------------|---------------------|-------|
| SVM | ❌ Likely fails | ❌ N/A | ❌ N/A | No FK to receipt; sourceType mismatch |
| MVM | ❌ Likely fails | ❌ N/A | ❌ N/A | No FK to receipt; sub-order complexity |
| ParkHub | ✅ Works | ✅ Works | ✅ Works | Full chain via tripId linkage |

---

## Summary

| Gap # | Description | Severity | Impact Area |
|-------|-------------|----------|-------------|
| 1 | Missing foreign key relationships | High | Data integrity |
| 2 | Receipt ↔ order ID mismatches | High | SVM/MVM resolution |
| 3 | ParkHub vs commerce receipt structure | Medium | Data model |
| 4 | Manifest → receipt traversal | Medium | Performance |
| 5 | Multi-receipt per order | Low | Data clarity |
| 6 | Legacy data gaps | Medium | Historical data |
| 7 | Verification URL format | Low | Verification |
| 8 | sourceType string fragility | Medium | Query reliability |
| 9 | No pagination | Low | Performance |
| 10 | Tenant isolation in sourceId | High | Security |
| 11 | Manifest generatedAt nullable | Low | Data quality |
| 12 | MVM sub-order receipts | Medium | MVM completeness |
| 13 | Reference-as-token security model | Medium | Security |

---

## Document Metadata

- **Wave:** J.3 - Receipt & Proof Linking
- **Created:** Wave J.3 Implementation
- **Status:** Complete - gaps documented per spec
- **Next Steps:** Review gaps, await approval, prepare Wave J.4
