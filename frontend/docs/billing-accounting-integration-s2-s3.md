# Billing → Accounting Integration — S2-S3: Event Emission + Adapter Implementation

**Phase**: Phase 2 — Operational Integrity
**Track**: B (Cross-Suite Integration)
**Status**: S2-S3 SUBMITTED
**Depends On**: S1 Mapping Document (APPROVED)

---

## 1. Overview

This document summarizes the implementation of the Billing → Accounting integration:
- Event type definitions
- Account code mappings
- BillingJournalAdapter class
- Idempotent event processing

---

## 2. Files Created

| File | Purpose |
|------|---------|
| `/lib/accounting/integrations/types.ts` | Event types, journal types, account mappings |
| `/lib/accounting/integrations/billing-adapter.ts` | BillingJournalAdapter implementation |
| `/lib/accounting/integrations/index.ts` | Barrel export |

---

## 3. Event Types Implemented

### 3.1 BillingEventType Union
```typescript
type BillingEventType = 
  | 'INVOICE_ISSUED'
  | 'PAYMENT_RECORDED'
  | 'CREDIT_NOTE_APPLIED'
```

### 3.2 Event Interfaces

**InvoiceIssuedEvent**:
- Invoice identifiers (id, number)
- Customer information (id, name)
- Financial amounts (subtotal, vatAmount, grandTotal)
- VAT handling flags (vatExempt, vatInclusive)

**PaymentRecordedEvent**:
- Invoice reference
- Payment details (id, amount, method, reference)
- Partial payment tracking (isPartialPayment, remainingBalance)

**CreditNoteAppliedEvent**:
- Credit note identifiers
- Invoice reference
- Credit amounts (creditAmount, vatPortion, netPortion)
- Reason and VAT exempt status

---

## 4. Account Code Mappings

### Assets (1xxx)
| Code | Name | Purpose |
|------|------|---------|
| 1110 | Cash on Hand | Physical cash |
| 1120 | Cash in Bank (GTBank) | Primary bank |
| 1130 | Mobile Money (OPay) | Mobile money |
| 1140 | POS Terminal Float | Card payments |
| 1210 | Accounts Receivable | Customer balances |

### Liabilities (2xxx)
| Code | Name | Purpose |
|------|------|---------|
| 2120 | VAT Payable (7.5%) | Output VAT |

### Revenue (4xxx)
| Code | Name | Purpose |
|------|------|---------|
| 4200 | Service Revenue | B2B services |

### Payment Method → Account Mapping
| Method | Account Code |
|--------|--------------|
| CASH | 1110 |
| BANK_TRANSFER | 1120 |
| CARD | 1140 |
| MOBILE_MONEY | 1130 |
| USSD | 1120 |

---

## 5. BillingJournalAdapter Implementation

### 5.1 Core Method
```typescript
async handle(event: BillingEvent): Promise<AdapterResult>
```

### 5.2 Processing Flow
1. **Validate event** - Check required fields (eventId, tenantId, currency)
2. **Check idempotency** - Skip if eventId already processed
3. **Build journal** - Transform event to journal entry
4. **Validate balance** - Ensure totalDebit === totalCredit
5. **Persist journal** - Store in database (mock for now)
6. **Record for idempotency** - Cache eventId

### 5.3 Journal Builders

**buildInvoiceIssuedJournal**:
- DR: Accounts Receivable (grandTotal)
- CR: Service Revenue (subtotal)
- CR: VAT Payable (vatAmount) — if not exempt

**buildPaymentRecordedJournal**:
- DR: Cash/Bank/Mobile (based on payment method)
- CR: Accounts Receivable

**buildCreditNoteAppliedJournal**:
- DR: Service Revenue (net portion)
- DR: VAT Payable (vat portion) — if not exempt
- CR: Accounts Receivable

---

## 6. Idempotency Implementation

### Strategy
- Every event has a unique `eventId` (UUID)
- Before processing, check if `eventId` exists in journal entries
- If exists: return existing journal (no duplicate)
- If new: process and store

### In-Memory Cache (Demo)
```typescript
const processedEvents = new Map<string, { journalId: string; journalNumber: string }>()
```

### Production Implementation
```typescript
const existing = await prisma.acct_journal_entries.findFirst({
  where: { 
    tenantId,
    sourceEventId: event.eventId 
  }
})
```

---

## 7. Validation Rules

### Event Validation
- `eventId` is required (for idempotency)
- `tenantId` is required (for isolation)
- `currency` must be 'NGN'

### Journal Validation
- `totalDebit === totalCredit` (balanced)
- Zero-amount events are skipped (not errors)

### Locked Decisions (From S0)
- ❌ Billing never writes to ledger directly
- ❌ No retroactive journal mutation
- ✅ Append-only journal entries only
- ✅ Event-based (not synchronous)

---

## 8. Journal Entry Metadata

Each journal entry includes:
```typescript
{
  journalNumber: 'JE-{YYMM}-{XXXXX}',
  sourceType: 'BILLING_INTEGRATION',
  sourceEventType: event.eventType,
  sourceEventId: event.eventId,      // Idempotency key
  sourceReference: event.invoiceNumber,
  createdBy: 'SYSTEM:billing-integration'
}
```

---

## 9. Sample Usage

```typescript
import { billingJournalAdapter, InvoiceIssuedEvent } from '@/lib/accounting/integrations'

// After invoice is sent
const event: InvoiceIssuedEvent = {
  eventType: 'INVOICE_ISSUED',
  eventId: 'evt-' + crypto.randomUUID(),
  timestamp: new Date(),
  tenantId: tenant.id,
  invoiceId: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  customerId: customer.id,
  customerName: customer.name,
  subtotal: 100000,
  vatAmount: 7500,
  grandTotal: 107500,
  currency: 'NGN',
  vatExempt: false,
  vatInclusive: false
}

const result = await billingJournalAdapter.handle(event)

if (result.success) {
  console.log(`Journal created: ${result.journalNumber}`)
}
```

---

## 10. What's NOT Implemented (Phase 3)

| Feature | Reason |
|---------|--------|
| Async message queue | v1 is synchronous |
| Real database persistence | Using mock/console for demo |
| Retry infrastructure | Manual retry via idempotency |
| Event emission in Billing services | Needs separate task |

---

## 11. Definition of Done (S2-S3)

- [x] Event type definitions created
- [x] Account code mappings defined
- [x] BillingJournalAdapter implemented
- [x] Idempotency strategy implemented
- [x] Balance validation enforced
- [x] Journal builders for all 3 event types
- [x] Barrel export created

---

## 🛑 STOP POINT B3

**Status**: SUBMITTED FOR APPROVAL

**Next Phase**: S4-S6 (Integration Testing & Verification)

**Approval Required Before**:
- Adding event emission to Billing services
- End-to-end testing with real database
- Integration v1 FREEZE declaration

**What S4-S6 Will Add**:
- Event emission hooks in invoice-service.ts
- Event emission hooks in payment-service.ts
- Event emission hooks in credit-note-service.ts
- Full integration tests

---

**Document Version**: 1.0
**Created**: January 7, 2026
**Author**: E1 Agent
**Track**: B (Billing → Accounting Integration)
