# Commerce Suite: Billing & Subscriptions
## S2: Schema Additions

**Suite Code**: `COM-BILL`  
**Phase**: S2 (Schema Additions)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. S2 Objective

Add canonical invoice tables to the database schema while preserving all existing `billing_*` tables. This is additive only with zero breaking changes.

**Constraints Enforced:**
- ✅ Additive only (no modifications to existing tables)
- ✅ Tenant-scoped
- ✅ NGN default currency
- ✅ No UI
- ✅ No APIs

---

## 2. Schema Changes Summary

### 2.1 New Tables (4)

| Table | Purpose | Records |
|-------|---------|---------|
| `bill_invoices` | Canonical invoice records | Main invoice |
| `bill_invoice_items` | Invoice line items | Line items |
| `bill_invoice_payments` | Payment tracking | Partial payments |
| `bill_credit_notes` | Credit notes & adjustments | Credits |

### 2.2 New Enums (5)

| Enum | Values | Purpose |
|------|--------|---------|
| `BillInvoiceStatus` | DRAFT, SENT, VIEWED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, VOID, DISPUTED | Invoice lifecycle |
| `BillCustomerType` | INDIVIDUAL, BUSINESS, GOVERNMENT, NGO | Customer classification |
| `BillPaymentStatus` | PENDING, CONFIRMED, FAILED, REFUNDED | Payment tracking |
| `BillCreditReason` | RETURN, PRICING_ERROR, SERVICE_ISSUE, DUPLICATE_CHARGE, GOODWILL, OTHER | Credit categorization |
| `BillCreditStatus` | DRAFT, APPROVED, APPLIED, CANCELLED, EXPIRED | Credit lifecycle |

---

## 3. Table Details

### 3.1 `bill_invoices` — Main Invoice Table

**Core Fields:**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | String | @id | Primary key |
| tenantId | String | - | Tenant scope |
| invoiceNumber | String | - | INV-{YYMM}-{XXXXX} |
| status | BillInvoiceStatus | DRAFT | Lifecycle state |
| currency | String | "NGN" | Nigeria-first |

**Customer Fields (Denormalized for permanence):**
| Field | Type | Notes |
|-------|------|-------|
| customerId | String? | Reference |
| customerType | BillCustomerType | INDIVIDUAL default |
| customerName | String | Required |
| customerEmail | String? | For sending |
| customerPhone | String? | Nigerian format |
| customerAddress | String? | Billing address |
| customerCity | String? | City |
| customerState | String? | Nigerian state |
| customerTIN | String? | Tax ID (optional) |

**Amount Fields (NGN):**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| subtotal | Decimal(12,2) | - | Before tax |
| discountTotal | Decimal(12,2) | 0 | Discounts applied |
| taxTotal | Decimal(12,2) | 0 | VAT amount |
| grandTotal | Decimal(12,2) | - | Final total |
| amountPaid | Decimal(12,2) | 0 | Payments received |
| amountDue | Decimal(12,2) | - | Outstanding |

**VAT Fields (Nigeria 7.5%):**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| vatRate | Decimal(5,2) | 7.5 | Nigerian VAT |
| vatInclusive | Boolean | false | Price includes VAT |
| vatExempt | Boolean | false | VAT exempt flag |
| vatExemptReason | String? | - | Exemption justification |

**Date Fields:**
| Field | Type | Notes |
|-------|------|-------|
| invoiceDate | DateTime | Creation date |
| dueDate | DateTime | Payment due |
| paidDate | DateTime? | Full payment date |
| sentAt | DateTime? | When sent |
| viewedAt | DateTime? | When viewed |

**Payment Terms:**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| paymentTerms | String? | - | "Net 30" |
| paymentTermDays | Int | 30 | Days until due |

**References:**
| Field | Type | Notes |
|-------|------|-------|
| orderId | String? | From order |
| orderNumber | String? | Display reference |
| subscriptionId | String? | From subscription |
| paymentIntentId | String? | Links to Payments |

**Indexes:**
- `@@unique([tenantId, invoiceNumber])`
- `@@index([customerId])`
- `@@index([dueDate])`
- `@@index([orderId])`
- `@@index([status])`
- `@@index([tenantId])`
- `@@index([subscriptionId])`

### 3.2 `bill_invoice_items` — Line Items

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | String | @id | Primary key |
| invoiceId | String | - | Parent invoice |
| lineNumber | Int | 1 | Display order |
| description | String | - | Item description |
| quantity | Decimal(10,2) | - | Quantity |
| unitPrice | Decimal(12,2) | - | Price per unit |
| lineTotal | Decimal(12,2) | - | Calculated total |
| taxRate | Decimal(5,2) | 0 | Item-level tax |
| taxAmount | Decimal(12,2) | 0 | Tax on item |
| taxExempt | Boolean | false | Exempt flag |
| discountAmount | Decimal(12,2) | 0 | Line discount |
| discountPercent | Decimal(5,2) | 0 | Discount % |
| productId | String? | - | Product reference |
| productName | String? | - | Product name |
| sku | String? | - | SKU |

**Cascade Delete:** Items deleted when invoice deleted.

### 3.3 `bill_invoice_payments` — Payment Tracking

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | String | @id | Primary key |
| invoiceId | String | - | Parent invoice |
| amount | Decimal(12,2) | - | Payment amount |
| paymentMethod | String | - | BANK_TRANSFER, CARD, etc. |
| paymentReference | String? | - | Transfer ref |
| transactionId | String? | - | Links to pay_payment_transactions |
| status | BillPaymentStatus | PENDING | Payment state |
| paidAt | DateTime? | - | Payment time |
| confirmedAt | DateTime? | - | Confirmation time |
| confirmedBy | String? | - | Who confirmed |

**Cascade Delete:** Payments deleted when invoice deleted.

### 3.4 `bill_credit_notes` — Credit Notes

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | String | @id | Primary key |
| tenantId | String | - | Tenant scope |
| creditNoteNumber | String | - | CN-{YYMM}-{XXXXX} |
| invoiceId | String? | - | Original invoice |
| invoiceNumber | String? | - | Invoice reference |
| customerId | String? | - | Customer |
| customerName | String | - | Customer name |
| amount | Decimal(12,2) | - | Credit amount |
| currency | String | "NGN" | Currency |
| reason | BillCreditReason | OTHER | Why issued |
| description | String? | - | Details |
| status | BillCreditStatus | DRAFT | Lifecycle |
| appliedAt | DateTime? | - | When applied |
| appliedToInvoice | String? | - | Applied to |

---

## 4. Existing Tables Preserved

All 11 existing `billing_*` tables remain unchanged:

| Table | Status |
|-------|--------|
| billing_configurations | ✅ Preserved |
| billing_bundles | ✅ Preserved |
| billing_bundle_items | ✅ Preserved |
| billing_addons | ✅ Preserved |
| billing_addon_subscriptions | ✅ Preserved |
| billing_usage_metrics | ✅ Preserved |
| billing_usage_records | ✅ Preserved |
| billing_adjustments | ✅ Preserved |
| billing_discount_rules | ✅ Preserved |
| billing_grace_policies | ✅ Preserved |
| billing_event_logs | ✅ Preserved |

---

## 5. Breaking Changes

| Category | Count | Notes |
|----------|-------|-------|
| Tables Removed | 0 | None |
| Tables Modified | 0 | None |
| Fields Removed | 0 | None |
| Enums Changed | 0 | None |

**✅ ZERO BREAKING CHANGES**

---

## 6. Nigeria-First Alignment

| Requirement | Implementation |
|-------------|----------------|
| NGN default currency | `currency String @default("NGN")` |
| Nigerian VAT (7.5%) | `vatRate Decimal @default(7.5)` |
| VAT inclusive/exclusive | `vatInclusive Boolean` |
| VAT exemption (NGOs) | `vatExempt Boolean`, `vatExemptReason String?` |
| Customer TIN (optional) | `customerTIN String?` — not mandatory |
| Nigerian states | `customerState String?` |
| Payment terms flexibility | `paymentTermDays Int @default(30)` |

---

## 7. S3 Readiness

With S2 complete, the schema now supports:
- Full invoice lifecycle (DRAFT → SENT → PAID)
- Partial payments tracking
- VAT calculation (inclusive/exclusive)
- Credit notes
- Payment method flexibility

**Ready for S3 (Service Layer) authorization.**

---

## 8. Files Modified

| File | Changes |
|------|---------|
| `/app/frontend/prisma/schema.prisma` | +4 tables, +5 enums (~180 lines) |

---

*Document prepared under PC-SCP guidelines*  
*S2 Schema Additions — COMPLETE*
