# Commerce Suite: Billing & Subscriptions
## S0–S1: Intent + Capability Mapping

**Suite Code**: `COM-BILL`  
**Canonicalization Type**: HARDENING (Infrastructure exists, needs promotion)  
**Document Version**: 1.0.0  
**Created**: January 2025  
**Status**: DRAFT — Awaiting Approval for S2

---

## 1. Suite Intent

### 1.1 Purpose
The **Billing & Subscriptions Suite** is a tenant-level billing orchestration layer that:

- Generates invoices (one-time & recurring)
- Manages subscriptions and billing cycles
- Applies Nigerian VAT correctly (7.5%)
- Integrates with Payments for collection
- Feeds Accounting (Light) with clean records

### 1.2 What It IS NOT
```
❌ NOT a payment gateway
❌ NOT a full accounting system
❌ NOT an ERP billing engine
❌ NOT tax filing or remittance
❌ NOT a revenue recognition engine
```

**Mental Model**: "What Nigerian businesses actually use to bill customers today — but done properly."

### 1.3 Core Principle
```
🚨 CRITICAL — BILLING IS ORCHESTRATION, NOT EXECUTION

1. Invoices are RECORDS, not payment triggers
2. Subscriptions REQUEST payments, not execute them
3. All collections flow through Payments & Collections Suite
4. VAT is CALCULATED, not remitted
5. Adjustments are append-only (audit trail)
```

---

## 2. Nigeria-First Design Positioning

### 2.1 Priority Order (Critical)

| Priority | Domain | Rationale |
|----------|--------|-----------|
| **P0** | One-time Invoicing | Dominant in Nigeria (WhatsApp + PDF culture) |
| **P1** | Recurring Subscriptions | Growing but often informal |
| **P2** | Usage-based Charges | Telecoms/tech only (light) |
| **P3** | Trials & Grace Periods | Optional, controlled |

### 2.2 Nigerian Business Reality
- Most businesses invoice manually (WhatsApp + PDF)
- Collections via bank transfer, POS, POD
- Subscriptions exist but often informal
- Payment delays are common → grace periods essential
- Manual overrides frequently needed

---

## 3. Existing Infrastructure Audit

### 3.1 Current Services (`/app/frontend/src/lib/billing/`)

| File | Purpose | Lines | Quality | Reuse? |
|------|---------|-------|---------|--------|
| `config-service.ts` | Billing configuration | 324 | ⭐⭐⭐⭐⭐ | ✅ FULL REUSE |
| `usage-service.ts` | Usage-based billing | 363 | ⭐⭐⭐⭐ | ✅ FULL REUSE |
| `grace-service.ts` | Grace periods | 356 | ⭐⭐⭐⭐⭐ | ✅ FULL REUSE |
| `adjustment-service.ts` | Credits, discounts | 300 | ⭐⭐⭐⭐ | ✅ FULL REUSE |
| `event-service.ts` | Billing events | ~100 | ⭐⭐⭐⭐ | ✅ FULL REUSE |
| `bundle-service.ts` | Plan bundles | ~200 | ⭐⭐⭐ | ✅ FULL REUSE |
| `addon-service.ts` | Add-on subscriptions | ~200 | ⭐⭐⭐ | ✅ FULL REUSE |
| `discount-service.ts` | Discount rules | ~150 | ⭐⭐⭐ | ✅ FULL REUSE |
| `entitlements-service.ts` | Billing entitlements | ~100 | ⭐⭐⭐⭐ | ✅ FULL REUSE |

**Assessment**: Core billing infrastructure is SOLID. Well-architected with Nigeria-first defaults (grace periods, manual overrides). ~90% reuse expected.

### 3.2 B2B Invoice Service (`/app/frontend/src/lib/b2b/invoice-service.ts`)

| Feature | Status | Notes |
|---------|--------|-------|
| Invoice creation | ✅ EXISTS | RECORD-ONLY, no payment execution |
| Invoice numbering | ✅ EXISTS | INV-{YYMM}-{XXXXX} format |
| Credit terms | ✅ EXISTS | Net 30 default |
| Line items | ✅ EXISTS | Full support |
| Credit ledger | ✅ EXISTS | Append-only |

**Assessment**: B2B invoicing is production-ready. Needs PROMOTION to canonical Billing suite.

### 3.3 Database Schema (Prisma)

| Model | Purpose | Canonical? |
|-------|---------|------------|
| `billing_configurations` | Tenant billing settings | ✅ Yes |
| `billing_bundles` | Plan bundles | ✅ Yes |
| `billing_bundle_items` | Bundle line items | ✅ Yes |
| `billing_addons` | Add-on products | ✅ Yes |
| `billing_addon_subscriptions` | Active add-ons | ✅ Yes |
| `billing_usage_metrics` | Usage metric definitions | ✅ Yes |
| `billing_usage_records` | Usage data (immutable) | ✅ Yes |
| `billing_adjustments` | Credits, discounts (append-only) | ✅ Yes |
| `billing_discount_rules` | Discount configurations | ✅ Yes |
| `billing_grace_policies` | Grace period rules | ✅ Yes |
| `billing_event_logs` | Billing audit trail | ✅ Yes |

**Schema Status**: 11 tables already exist with `billing_` prefix. Minor additions needed for invoices.

---

## 4. Gap Register

### 4.1 Schema Gaps

| ID | Gap | Priority | Resolution Path |
|----|-----|----------|-----------------|
| GAP-001 | No canonical `bill_invoices` table | P0 | Add invoice table (promote from B2B) |
| GAP-002 | No `bill_invoice_items` table | P0 | Add line items table |
| GAP-003 | No `bill_subscriptions` table | P1 | Add subscription tracking table |
| GAP-004 | No `bill_subscription_cycles` table | P1 | Add billing cycle history |
| GAP-005 | No `bill_credit_notes` table | P1 | Add credit note support |

### 4.2 Service Gaps

| ID | Gap | Priority | Resolution Path |
|----|-----|----------|-----------------|
| SVC-001 | No canonical InvoiceService | P0 | Promote B2BInvoiceService |
| SVC-002 | No SubscriptionService | P1 | Create minimal wrapper |
| SVC-003 | No ProrationService | P2 | Create simple proration logic |
| SVC-004 | No CreditNoteService | P1 | Create credit note lifecycle |

### 4.3 API Gaps

| ID | Gap | Priority | Resolution Path |
|----|-----|----------|-----------------|
| API-001 | No `/api/commerce/billing` routes | P0 | Create canonical endpoints |
| API-002 | Capability guard missing | P0 | Add `checkCapabilityForSession('billing')` |

---

## 5. Capability Definition

### 5.1 Capability Domains (~52 capabilities)

#### A. Invoice Management (P0) — 12 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Create invoice (manual) | 🆕 NEW | From scratch or template |
| Create invoice (from order) | ✅ EXISTS | B2B service |
| Draft → Sent → Paid lifecycle | ✅ EXISTS | B2B service |
| Invoice numbering (tenant-scoped) | ✅ EXISTS | INV-{YYMM}-{XXXXX} |
| Partial payments tracking | 🆕 EXTEND | Link to Payments suite |
| PDF generation | 🆕 NEW | Basic template |
| Email/WhatsApp share (link-based) | 🆕 NEW | URL-based sharing |
| Overdue detection | 🆕 NEW | Background check |
| Invoice search & filter | 🆕 NEW | By status, date, customer |
| Invoice cancellation | ✅ EXISTS | With audit |
| Invoice cloning | 🆕 NEW | Duplicate for recurring |
| Invoice reminder | 🆕 NEW | Manual trigger |

#### B. Subscription Management (P1) — 10 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Fixed-price subscriptions | ✅ EXISTS | Via bundles |
| Monthly/Quarterly/Annual | ✅ EXISTS | BillingInterval enum |
| Start subscription | ✅ EXISTS | Addon service |
| Pause subscription | 🆕 EXTEND | Add pause state |
| Resume subscription | 🆕 EXTEND | Add resume logic |
| Cancel subscription | ✅ EXISTS | With end date |
| Grace period (Nigeria-first) | ✅ EXISTS | Default 7 days |
| Failed payment handling | ✅ EXISTS | Soft, not punitive |
| Manual renewal (Nigeria) | ✅ EXISTS | manualRenewalsAllowed |
| Upgrade/downgrade | ✅ EXISTS | informalUpgradesAllowed |

#### C. Billing Schedules & Cycles (P0) — 6 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Billing anchors (1st of month) | 🆕 NEW | Configurable |
| Proration (simple) | 🆕 NEW | Pro-rata calculation |
| Manual override | ✅ EXISTS | Nigeria-first |
| Cycle history | 🆕 NEW | Track billing periods |
| Next billing date | 🆕 NEW | Calculate next charge |
| Billing preview | 🆕 NEW | Show upcoming charges |

#### D. Tax & Charges (P0) — 6 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Nigerian VAT (7.5%) | 🆕 NEW | Standard calculation |
| VAT inclusive pricing | 🆕 NEW | Price includes VAT |
| VAT exclusive pricing | 🆕 NEW | VAT added on top |
| VAT exemption | 🆕 NEW | NGOs, exports |
| Service charges | 🆕 NEW | Non-tax fees |
| Tax breakdown display | 🆕 NEW | Clear itemization |

#### E. Customer Billing Profiles (P0) — 5 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Business vs individual | ✅ EXISTS | B2B profiles |
| Nigerian address format | ✅ EXISTS | State/LGA |
| TIN (optional) | 🆕 NEW | Not mandatory |
| Multiple billing contacts | ✅ EXISTS | B2B support |
| Billing preferences | 🆕 NEW | Invoice frequency, format |

#### F. Collections Integration (P0 - Reuse-heavy) — 5 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Link invoice → Payment intent | 🆕 NEW | Bridge to Payments |
| Bank transfer references | ✅ EXISTS | Via Payments |
| POD eligibility check | ✅ EXISTS | Via Payments |
| Partial settlement tracking | ✅ EXISTS | Via Payments |
| Payment confirmation update | 🆕 NEW | Status sync |

#### G. Credits, Adjustments & Notes (P1) — 5 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Credit notes | 🆕 NEW | Formal credit issuance |
| Debit notes | 🆕 NEW | Additional charges |
| Write-offs (admin only) | 🆕 NEW | Controlled write-off |
| Adjustment approval workflow | ✅ EXISTS | PENDING → APPROVED |
| Adjustment balance tracking | ✅ EXISTS | Per tenant |

#### H. Reporting & Controls (P1) — 3 capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| Outstanding invoices report | 🆕 NEW | By age, amount |
| Aging report (30/60/90) | 🆕 NEW | Standard aging buckets |
| Billing audit log | ✅ EXISTS | billing_event_logs |

### 5.2 Capability Registration (Proposed)

```typescript
{
  key: 'billing',
  module: 'Billing & Subscriptions',
  displayName: 'Billing & Subscriptions',
  description: 'Invoice generation, subscriptions, and billing management',
  defaultEnabled: true,
  dependencies: ['payments'], // Requires Payments
  tier: 'STARTER', // Not free tier
  subCapabilities: [
    { key: 'billing.invoices', displayName: 'Invoicing' },
    { key: 'billing.subscriptions', displayName: 'Subscriptions' },
    { key: 'billing.usage', displayName: 'Usage Billing', tier: 'PROFESSIONAL' },
    { key: 'billing.credits', displayName: 'Credits & Adjustments' },
    { key: 'billing.reports', displayName: 'Billing Reports' }
  ]
}
```

---

## 6. Reuse Analysis

### 6.1 Direct Reuse (No Changes) — ~90%

| Component | Source | Justification |
|-----------|--------|---------------|
| `BillingConfigService` | `/lib/billing/config-service.ts` | Production-grade |
| `UsageBillingService` | `/lib/billing/usage-service.ts` | Immutable records |
| `GraceService` | `/lib/billing/grace-service.ts` | Nigeria-first |
| `AdjustmentService` | `/lib/billing/adjustment-service.ts` | Append-only |
| `EventService` | `/lib/billing/event-service.ts` | Audit trail |
| `BundleService` | `/lib/billing/bundle-service.ts` | Plan management |
| `AddonService` | `/lib/billing/addon-service.ts` | Add-on lifecycle |
| `DiscountService` | `/lib/billing/discount-service.ts` | Discount rules |
| Schema models | `prisma/schema.prisma` | 11 tables ready |

### 6.2 Promote to Canonical

| Component | Source | Target | Changes Needed |
|-----------|--------|--------|----------------|
| B2BInvoiceService | `/lib/b2b/invoice-service.ts` | `/lib/billing/invoice-service.ts` | Generalize for all tenants |

### 6.3 New Services (Additive)

| Component | Purpose | Effort |
|-----------|---------|--------|
| VATService | Nigerian VAT calculation | LOW |
| CreditNoteService | Credit note lifecycle | MEDIUM |
| SubscriptionCycleService | Billing cycle tracking | MEDIUM |

---

## 7. Schema Proposal (S2 Preview)

### 7.1 New Tables (Additive Only)

```prisma
// Canonical invoice table
model bill_invoices {
  id               String             @id
  tenantId         String
  invoiceNumber    String
  customerId       String?
  customerName     String
  customerEmail    String?
  customerPhone    String?
  customerAddress  String?
  customerTIN      String?
  subtotal         Decimal            @db.Decimal(12, 2)
  discountTotal    Decimal            @default(0) @db.Decimal(12, 2)
  taxTotal         Decimal            @default(0) @db.Decimal(12, 2)
  grandTotal       Decimal            @db.Decimal(12, 2)
  amountPaid       Decimal            @default(0) @db.Decimal(12, 2)
  amountDue        Decimal            @db.Decimal(12, 2)
  currency         String             @default("NGN")
  vatRate          Decimal            @default(7.5) @db.Decimal(5, 2)
  vatInclusive     Boolean            @default(false)
  vatExempt        Boolean            @default(false)
  invoiceDate      DateTime           @default(now())
  dueDate          DateTime
  paidDate         DateTime?
  status           BillInvoiceStatus  @default(DRAFT)
  notes            String?
  orderId          String?
  orderNumber      String?
  paymentIntentId  String?
  createdBy        String?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime
  items            bill_invoice_items[]
  
  @@unique([tenantId, invoiceNumber])
  @@index([status])
  @@index([dueDate])
}

model bill_invoice_items {
  id          String        @id
  invoiceId   String
  description String
  quantity    Decimal       @db.Decimal(10, 2)
  unitPrice   Decimal       @db.Decimal(12, 2)
  lineTotal   Decimal       @db.Decimal(12, 2)
  taxRate     Decimal       @default(0) @db.Decimal(5, 2)
  taxAmount   Decimal       @default(0) @db.Decimal(12, 2)
  productId   String?
  sku         String?
  metadata    Json?
  invoice     bill_invoices @relation(fields: [invoiceId], references: [id])
  
  @@index([invoiceId])
}

enum BillInvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  VOID
}
```

---

## 8. Guardrails for S2–S6

### 8.1 Schema Phase (S2)
- [ ] Add `bill_invoices` and `bill_invoice_items` tables
- [ ] Add `BillInvoiceStatus` enum
- [ ] Add VAT fields to invoice
- [ ] No breaking changes to existing `billing_*` tables

### 8.2 Services Phase (S3)
- [ ] Promote B2B invoice logic to canonical location
- [ ] Create VATService for Nigerian VAT
- [ ] Create CreditNoteService
- [ ] Maintain event-driven integration

### 8.3 API Phase (S4)
- [ ] Add capability guards (`billing`)
- [ ] Create `/api/commerce/billing/*` endpoints
- [ ] Document OpenAPI spec

### 8.4 UI Phase (S5)
- [ ] Create billing demo page
- [ ] Nigeria-first demo data (₦ amounts)
- [ ] Invoice preview/PDF mock

### 8.5 Verification Phase (S6)
- [ ] Run validation checks
- [ ] Verify capability guards
- [ ] FREEZE suite

---

## 9. Summary & Recommendation

### 9.1 Overall Assessment

| Aspect | Score | Notes |
|--------|-------|-------|
| Architecture | ⭐⭐⭐⭐⭐ | Event-driven, append-only |
| Code Quality | ⭐⭐⭐⭐ | Well-typed, documented |
| Schema Design | ⭐⭐⭐⭐ | 11 tables already prefixed |
| Nigeria-First | ⭐⭐⭐⭐⭐ | Grace periods, manual overrides |
| Capability Guards | ⭐⭐⭐ | Need upgrade to canonical |
| Invoice Support | ⭐⭐⭐ | B2B exists, needs promotion |

### 9.2 Recommendation

**CANONICALIZATION TYPE: HARDENING (~90% reuse)**

The existing billing infrastructure is architecturally sound with excellent Nigeria-first defaults. The S2–S6 phases should focus on:

1. **S2 (Schema)**: Add invoice tables only
2. **S3 (Services)**: Promote B2B invoice service, add VAT service
3. **S4 (API)**: Create canonical endpoints with capability guards
4. **S5 (UI)**: Demo page with Nigerian invoice examples
5. **S6 (Freeze)**: Verify and lock

### 9.3 Estimated Effort

| Phase | Effort | Description |
|-------|--------|-------------|
| S2 | LOW | 2 new tables, 1 enum |
| S3 | MEDIUM | Invoice + VAT services |
| S4 | LOW | Capability guard + endpoints |
| S5 | MEDIUM | Demo page |
| S6 | LOW | Verification |

---

## 10. Approval Gate

**S0-S1 Status**: ✅ COMPLETE

**Awaiting Approval For**:
- [ ] Proceed to S2 (Schema additions)
- [ ] Gap register accepted
- [ ] Nigeria-first priorities confirmed
- [ ] Reuse analysis approved

---

*Document prepared under PC-SCP guidelines*  
*Nigeria-First • Audit-First • Capability-Guarded*
