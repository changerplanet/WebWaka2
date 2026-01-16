# Wave B3: Gap Inventory

**Date:** 2026-01-16  
**Status:** DOCUMENTED  
**Total Gaps:** 12

---

## Gap Summary by Severity

| Severity | Count | IDs |
|----------|-------|-----|
| HIGH | 5 | B3-G1, B3-G2, B3-G3, B3-G4, B3-G5 |
| MEDIUM | 4 | B3-G6, B3-G7, B3-G8, B3-G9 |
| LOW | 3 | B3-G10, B3-G11, B3-G12 |

---

## Gap Details

### B3-G1: SVM Orders Have No Receipt Generation

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G1 |
| **Affected Suite(s)** | SVM |
| **Severity** | HIGH |
| **Risk Type** | Compliance / Audit |
| **Description** | SVM orders do not generate receipts. Customers have no verifiable proof of purchase beyond email confirmation. |
| **Why It Exists** | Receipt system was built for POS/ParkHub; SVM e-commerce was added later without receipt integration. Schema has no receipt linkage field. |
| **Why NOT Fixed in Wave B3** | Requires schema changes (add receiptId to svm_orders, add SVM_ORDER source type to receipt system). Wave B3 is read-only. |
| **Future Wave Owner** | Wave C (E-Commerce Receipt Integration) |

---

### B3-G2: MVM Orders Have No Receipt Generation

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G2 |
| **Affected Suite(s)** | MVM |
| **Severity** | HIGH |
| **Risk Type** | Compliance / Audit |
| **Description** | MVM parent orders and sub-orders do not generate receipts. Neither customers nor vendors have verifiable proof of transactions. |
| **Why It Exists** | Receipt system was built for POS/ParkHub; MVM marketplace was added later without receipt integration. No receipt linkage in schema. |
| **Why NOT Fixed in Wave B3** | Requires schema changes (add receiptId to mvm_parent_order, mvm_sub_order, add MVM_ORDER source type). Wave B3 is read-only. |
| **Future Wave Owner** | Wave C (Marketplace Receipt Integration) |

---

### B3-G3: No Audit Trail for Order Status Changes

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G3 |
| **Affected Suite(s)** | SVM, MVM, ParkHub (tickets) |
| **Severity** | HIGH |
| **Risk Type** | Audit / Compliance / Dispute Resolution |
| **Description** | Order status changes are not logged. Cannot prove when status changed, who changed it, or what it was before. Only `updatedAt` timestamp exists. |
| **Why It Exists** | No order_status_history table exists. Status is a mutable field with no revision tracking. |
| **Why NOT Fixed in Wave B3** | Requires schema changes (new order_status_history table, triggers or application logic). Wave B3 is read-only. |
| **Future Wave Owner** | Wave D (Order Audit Trail Implementation) |

---

### B3-G4: No Hash Verification for Orders

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G4 |
| **Affected Suite(s)** | SVM, MVM |
| **Severity** | HIGH |
| **Risk Type** | Security / Audit |
| **Description** | Orders have no verification hash. Order data can be modified without detection. Only ParkHub manifests have hash verification. |
| **Why It Exists** | Hash verification was implemented only for manifests due to regulatory requirements for transport. E-commerce orders were not considered. |
| **Why NOT Fixed in Wave B3** | Requires schema changes (add verificationHash field to orders) and application logic changes. Wave B3 is read-only. |
| **Future Wave Owner** | Wave D (Order Integrity Verification) |

---

### B3-G5: Orders Are Mutable Without Revision History

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G5 |
| **Affected Suite(s)** | SVM, MVM, ParkHub (tickets) |
| **Severity** | HIGH |
| **Risk Type** | Audit / Compliance / Legal |
| **Description** | Orders can be silently altered (amounts, items, customer data). No revision history tracks what changed, when, or by whom. |
| **Why It Exists** | No order_revision table exists. Orders use simple update semantics. |
| **Why NOT Fixed in Wave B3** | Requires schema changes (order_revision table, immutable core fields, revision tracking logic). Wave B3 is read-only. |
| **Future Wave Owner** | Wave D (Order Immutability / Revision Tracking) |

---

### B3-G6: Receipt Verification Lacks Tenant Isolation

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G6 |
| **Affected Suite(s)** | All (Receipt System) |
| **Severity** | MEDIUM |
| **Risk Type** | Security |
| **Description** | Public receipt verification endpoint (`/verify/receipt/[id]`) does not enforce tenant isolation. Any valid receipt ID can be verified regardless of tenant. |
| **Why It Exists** | Receipt verification is designed to work with QR codes that contain the receipt ID directly. Tenant context is not required for basic validity check. |
| **Why NOT Fixed in Wave B3** | Design decision - receipt IDs are opaque CUIDs, enumeration is impractical. Acceptable for current use case. |
| **Future Wave Owner** | Wave E (Receipt Security Hardening) - Optional |

---

### B3-G7: ParkHub Tickets Have Optional Receipts

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G7 |
| **Affected Suite(s)** | ParkHub |
| **Severity** | MEDIUM |
| **Risk Type** | Compliance / UX |
| **Description** | Not all ParkHub tickets have receipts. Receipt generation is optional and depends on staff action or system integration. |
| **Why It Exists** | Receipt generation is user-triggered, not automatic. Some ticket sales may skip receipt generation (especially offline). |
| **Why NOT Fixed in Wave B3** | Would require mandatory receipt generation workflow changes. Wave B3 is analysis only. |
| **Future Wave Owner** | Wave C (Mandatory Receipt Generation) |

---

### B3-G8: No Public Manifest Verification Endpoint

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G8 |
| **Affected Suite(s)** | ParkHub |
| **Severity** | MEDIUM |
| **Risk Type** | Audit / Compliance |
| **Description** | Manifest verification is only available via authenticated API or offline QR scan. No public web endpoint for manifest verification. |
| **Why It Exists** | Manifests are internal documents for regulatory compliance. Public verification was not prioritized. |
| **Why NOT Fixed in Wave B3** | Would require new public route and security review. Wave B3 is analysis only. |
| **Future Wave Owner** | Wave E (Public Manifest Verification) - Optional |

---

### B3-G9: MVM Commission Calculations Not Auditable

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G9 |
| **Affected Suite(s)** | MVM |
| **Severity** | MEDIUM |
| **Risk Type** | Audit / Dispute Resolution |
| **Description** | Commission amounts are calculated at order time and stored, but the calculation logic/formula is not recorded. Cannot prove how commission was derived. |
| **Why It Exists** | Commission rate is stored but not the full calculation breakdown. Rate may change between order and audit. |
| **Why NOT Fixed in Wave B3** | Would require schema changes to store calculation details. Wave B3 is read-only. |
| **Future Wave Owner** | Wave D (Commission Audit Trail) |

---

### B3-G10: No Payment Status History

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G10 |
| **Affected Suite(s)** | SVM, MVM |
| **Severity** | LOW |
| **Risk Type** | Audit |
| **Description** | Payment status changes (PENDING -> PAID -> REFUNDED) are not logged. Only current status and `paidAt` timestamp exist. |
| **Why It Exists** | No payment_status_history table exists. Status is a mutable field. |
| **Why NOT Fixed in Wave B3** | Requires schema changes. Lower priority than order status history. Wave B3 is read-only. |
| **Future Wave Owner** | Wave D (Payment Audit Trail) |

---

### B3-G11: Receipt Delivery Failures Not Retried

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G11 |
| **Affected Suite(s)** | All (Receipt System) |
| **Severity** | LOW |
| **Risk Type** | Ops / UX |
| **Description** | Receipt delivery failures (WhatsApp, email) are logged but not automatically retried. Customers may not receive receipts. |
| **Why It Exists** | No retry mechanism implemented. Staff must manually re-send. |
| **Why NOT Fixed in Wave B3** | Would require background job implementation. Wave B3 is analysis only. |
| **Future Wave Owner** | Wave E (Delivery Reliability) |

---

### B3-G12: Cross-Suite Receipt Parity

| Field | Value |
|-------|-------|
| **Gap ID** | B3-G12 |
| **Affected Suite(s)** | SVM, MVM vs ParkHub |
| **Severity** | LOW |
| **Risk Type** | UX / Consistency |
| **Description** | ParkHub has full receipt capability (thermal print, WhatsApp, verification QR). SVM/MVM have no receipt capability at all. |
| **Why It Exists** | Receipt system was built for POS/ParkHub use cases. E-commerce was not included. |
| **Why NOT Fixed in Wave B3** | Duplicate of B3-G1/B3-G2 at UX level. Addressing those gaps would fix this. |
| **Future Wave Owner** | Wave C (E-Commerce Receipt Integration) |

---

## Gap Resolution Roadmap

| Wave | Gaps Addressed | Scope |
|------|----------------|-------|
| Wave C | B3-G1, B3-G2, B3-G7, B3-G12 | E-Commerce and Marketplace Receipt Integration |
| Wave D | B3-G3, B3-G4, B3-G5, B3-G9, B3-G10 | Order Audit Trail and Integrity |
| Wave E | B3-G6, B3-G8, B3-G11 | Receipt Security and Reliability (Optional) |

---

## Summary

**Total Gaps:** 12  
**HIGH Severity:** 5 (all require schema changes)  
**MEDIUM Severity:** 4 (mix of schema and logic changes)  
**LOW Severity:** 3 (lower priority)

**Key Blockers for Enterprise/Regulated Usage:**
1. B3-G1 + B3-G2: No receipts for e-commerce
2. B3-G3 + B3-G5: No audit trail for orders
3. B3-G4: No tamper detection for orders

**Recommended Priority:**
1. Wave C (Receipts) - Customer-facing, high visibility
2. Wave D (Audit) - Compliance-critical, enterprise blocker
3. Wave E (Security) - Nice-to-have hardening

---

*Gap inventory complete. All gaps documented with severity, cause, and future ownership.*
