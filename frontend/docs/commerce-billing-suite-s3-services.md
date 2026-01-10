# Commerce Suite: Billing & Subscriptions
## S3: Core Services Canonicalization

**Suite Code**: `COM-BILL`  
**Phase**: S3 (Core Services)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. S3 Objective

Implement canonical domain logic services for the Billing & Subscriptions Suite, promoting and adapting functionality from existing B2B invoice services to work with the new S2 schema tables.

**Constraints Enforced:**
- ✅ Domain logic only (no API routes)
- ✅ No UI components
- ✅ Tenant-scoped
- ✅ NGN-first (Nigerian Naira default)
- ✅ No payment gateway integration

---

## 2. Services Implemented

### 2.1 InvoiceService (`invoice-service.ts`)

**Purpose**: Complete invoice lifecycle management

| Method | Description |
|--------|-------------|
| `generateInvoiceNumber()` | Format: INV-{YYMM}-{XXXXX} |
| `createInvoice()` | Create invoice with line items, VAT calculation |
| `getInvoice()` | Get by ID with items |
| `getInvoiceByNumber()` | Get by invoice number |
| `sendInvoice()` | DRAFT → SENT transition |
| `markViewed()` | Track customer views |
| `cancelInvoice()` | Cancel with reason |
| `listInvoices()` | Filter by customer, status, dates |
| `updateOverdueInvoices()` | Batch update overdue status |
| `getStatistics()` | Dashboard metrics |
| `getAgingReport()` | 0-30, 31-60, 61-90, 90+ days |

**Key Features:**
- Automatic VAT calculation (inclusive/exclusive)
- Line item support with per-item tax
- Payment terms (default Net 30)
- Status lifecycle (DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID)
- Overdue detection and aging buckets

### 2.2 InvoicePaymentService (`invoice-payment-service.ts`)

**Purpose**: Track payments against invoices (record-keeping only)

| Method | Description |
|--------|-------------|
| `recordPayment()` | Record full/partial payment |
| `getInvoicePayments()` | List payments for invoice |
| `getPayment()` | Get single payment |
| `reversePayment()` | Refund/reverse a payment |
| `linkToTransaction()` | Link to Payments suite transaction |

**Key Features:**
- Partial payment support (Nigeria-critical)
- Automatic invoice status updates
- Links to `pay_payment_transactions` (Payments suite)
- Refund handling with audit trail

### 2.3 CreditNoteService (`credit-note-service.ts`)

**Purpose**: Credit note lifecycle management

| Method | Description |
|--------|-------------|
| `generateCreditNoteNumber()` | Format: CN-{YYMM}-{XXXXX} |
| `createCreditNote()` | Create credit note |
| `getCreditNote()` | Get by ID |
| `getCreditNoteByNumber()` | Get by number |
| `approveCreditNote()` | DRAFT → APPROVED |
| `applyCreditNote()` | Apply to invoice |
| `cancelCreditNote()` | Cancel draft/approved |
| `listCreditNotes()` | Filter and paginate |
| `getStatistics()` | Credit note metrics |

**Key Features:**
- Approval workflow (DRAFT → APPROVED → APPLIED)
- Application to invoices updates amountPaid/amountDue
- Reason categorization (RETURN, PRICING_ERROR, SERVICE_ISSUE, etc.)
- Automatic payment record creation when applied

### 2.4 VATService (`vat-service.ts`)

**Purpose**: Nigerian VAT (7.5%) calculations

| Method | Description |
|--------|-------------|
| `calculateVAT()` | VAT on exclusive amount |
| `extractVATFromInclusive()` | Extract VAT from inclusive price |
| `getExclusiveAmount()` | Net from gross |
| `getInclusiveAmount()` | Gross from net |
| `calculateBreakdown()` | Full VAT breakdown |
| `calculateItemsVAT()` | Multi-item VAT |
| `isExemptCategory()` | Check exemption |
| `getExemptionReason()` | Exemption display text |
| `formatVAT()` | Currency formatting |

**VAT Exempt Categories:**
- `BASIC_FOOD` - Basic food items
- `MEDICAL` - Medical & pharmaceutical products
- `EDUCATION` - Educational materials & services
- `EXPORTS` - Exported goods
- `AGRICULTURAL` - Agricultural equipment
- `NGO_ACTIVITIES` - NGO/charitable activities
- `GOVERNMENT` - Government services

---

## 3. Type Definitions

### 3.1 Invoice Types

```typescript
interface Invoice {
  id: string
  tenantId: string
  invoiceNumber: string
  customerId: string | null
  customerType: BillCustomerType
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  customerState: string | null
  customerTIN: string | null
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  amountPaid: number
  amountDue: number
  currency: string
  vatRate: number
  vatInclusive: boolean
  vatExempt: boolean
  invoiceDate: Date
  dueDate: Date
  paidDate: Date | null
  sentAt: Date | null
  viewedAt: Date | null
  status: BillInvoiceStatus
  paymentTerms: string | null
  paymentTermDays: number
  orderId: string | null
  orderNumber: string | null
  subscriptionId: string | null
  notes: string | null
  createdAt: Date
  items?: InvoiceItem[]
}
```

### 3.2 Payment Types

```typescript
interface InvoicePayment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: string
  paymentReference: string | null
  transactionId: string | null
  status: BillPaymentStatus
  paidAt: Date | null
  confirmedAt: Date | null
  confirmedBy: string | null
  notes: string | null
  createdAt: Date
}
```

### 3.3 Credit Note Types

```typescript
interface CreditNote {
  id: string
  tenantId: string
  creditNoteNumber: string
  invoiceId: string | null
  invoiceNumber: string | null
  customerId: string | null
  customerName: string
  amount: number
  currency: string
  reason: BillCreditReason
  description: string | null
  status: BillCreditStatus
  appliedAt: Date | null
  appliedToInvoice: string | null
  createdBy: string | null
  approvedBy: string | null
  approvedAt: Date | null
  createdAt: Date
}
```

---

## 4. Nigeria-First Implementation

| Requirement | Implementation |
|-------------|----------------|
| NGN default | All services default to 'NGN' currency |
| 7.5% VAT | `NIGERIAN_VAT_RATE = 7.5` constant |
| VAT inclusive pricing | `vatInclusive` flag + extraction logic |
| VAT exemptions (NGO) | `vatExempt` + exempt categories |
| Optional TIN | `customerTIN` nullable |
| Net 30 terms | `paymentTermDays @default(30)` |
| Partial payments | Full support in `InvoicePaymentService` |

---

## 5. Service Layer Architecture

```
/app/frontend/src/lib/billing/
├── index.ts                    # Barrel exports (NEW)
├── invoice-service.ts          # Invoice lifecycle (CANONICAL)
├── invoice-payment-service.ts  # Payment tracking (CANONICAL)
├── credit-note-service.ts      # Credit notes (CANONICAL)
├── vat-service.ts              # VAT calculations (CANONICAL)
├── config-service.ts           # Pre-existing
├── entitlements-service.ts     # Pre-existing
├── usage-service.ts            # Pre-existing
├── discount-service.ts         # Pre-existing
├── bundle-service.ts           # Pre-existing
├── addon-service.ts            # Pre-existing
├── adjustment-service.ts       # Pre-existing
├── grace-service.ts            # Pre-existing
└── event-service.ts            # Pre-existing
```

---

## 6. Integration Points

### 6.1 With Payments & Collections Suite

- `InvoicePaymentService.linkToTransaction()` links billing payments to `pay_payment_transactions`
- Invoice can reference `paymentIntentId` for payment tracking
- No direct gateway calls - all execution through Payments suite

### 6.2 With Orders (SVM/MVM)

- `Invoice.orderId` and `Invoice.orderNumber` for order references
- Invoices can be created from order data

### 6.3 With Subscriptions

- `Invoice.subscriptionId` for subscription billing
- Existing `billing_*` tables remain for subscription management

---

## 7. S4 Readiness

The canonical services are now ready for API exposure:

| Service | Ready for API |
|---------|---------------|
| InvoiceService | ✅ |
| InvoicePaymentService | ✅ |
| CreditNoteService | ✅ |
| VATService | ✅ (pure utility, may not need API) |

**Next Phase**: S4 — API Layer
- Expose services via `/api/commerce/billing/*`
- Apply capability guards (`checkCapabilityForSession`)
- Implement standard REST patterns

---

## 8. Files Created/Modified

| File | Status |
|------|--------|
| `/app/frontend/src/lib/billing/index.ts` | CREATED |
| `/app/frontend/src/lib/billing/invoice-service.ts` | VERIFIED COMPLETE |
| `/app/frontend/src/lib/billing/invoice-payment-service.ts` | VERIFIED COMPLETE |
| `/app/frontend/src/lib/billing/credit-note-service.ts` | VERIFIED COMPLETE |
| `/app/frontend/src/lib/billing/vat-service.ts` | VERIFIED COMPLETE |

---

## 9. Breaking Changes

| Category | Count | Notes |
|----------|-------|-------|
| Existing services | 0 | All preserved |
| Type changes | 0 | None |
| API changes | 0 | No APIs yet |

**✅ ZERO BREAKING CHANGES**

---

*Document prepared under PC-SCP guidelines*  
*S3 Core Services — COMPLETE*
