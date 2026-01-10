# Billing → Accounting Integration — S0: Intent & Boundaries

**Phase**: Phase 2 — Operational Integrity
**Track**: B (Cross-Suite Integration)
**Status**: S0 SUBMITTED
**Risk Level**: MEDIUM
**Touches Frozen Suites**: ⚠️ YES (additive only)

---

## 1. Executive Summary

This integration establishes the **canonical financial data flow** between the Billing & Subscriptions suite and the Accounting (Light) suite. It ensures that every financial event in billing automatically creates corresponding, auditable journal entries in accounting.

### Core Principle

> **Billing emits facts. Accounting records truth.**

Billing is the source of commercial transactions. Accounting is the system of record for financial truth. This integration bridges them through an **event-based, idempotent, append-only** architecture.

---

## 2. Strategic Importance

| Stakeholder | Value |
|-------------|-------|
| **Partners** | "Your books are always up to date" — zero manual reconciliation |
| **Regulators** | Complete audit trail from invoice to ledger |
| **Investors** | Enterprise-grade financial integrity |
| **SMEs** | Automatic compliance with Nigerian accounting standards |

### Nigeria-First Compliance
- 7.5% VAT automatically tracked in VAT Payable account
- NGN currency throughout
- NGO VAT exemption handling
- Cash-heavy economy support (Cash, Bank, Mobile Money)

---

## 3. Architecture Decision: Event-Based Integration

### Why Events (Not Synchronous Calls)

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Synchronous** | Immediate consistency | Coupling, failure cascades, hard to audit | ❌ REJECTED |
| **Event-Based** | Loose coupling, auditable, idempotent | Eventual consistency | ✅ SELECTED |

### Key Constraints

| Constraint | Rationale |
|------------|-----------|
| **Billing does not post journals** | Separation of concerns |
| **Accounting subscribes to events** | Loose coupling |
| **Idempotent processing** | Safe retries, no duplicates |
| **Append-only journals** | Audit integrity (no mutations) |
| **Sync, not async** | Simple v1, no message queue yet |

---

## 4. Domain Events Defined

### 4.1 INVOICE_ISSUED

**Trigger**: Invoice transitions from DRAFT → SENT
**Contains**:
```typescript
{
  eventType: 'INVOICE_ISSUED',
  eventId: string,           // UUID for idempotency
  timestamp: Date,
  tenantId: string,
  invoiceId: string,
  invoiceNumber: string,
  customerId: string,
  customerName: string,
  subtotal: number,          // Before VAT
  vatAmount: number,         // 7.5% VAT (or 0 if exempt)
  grandTotal: number,        // Subtotal + VAT
  currency: 'NGN',
  vatExempt: boolean,
  vatInclusive: boolean
}
```

**Accounting Action**: Create journal entry for Receivable + Revenue + VAT

---

### 4.2 INVOICE_PAID

**Trigger**: Invoice status → PAID (full payment)
**Contains**:
```typescript
{
  eventType: 'INVOICE_PAID',
  eventId: string,
  timestamp: Date,
  tenantId: string,
  invoiceId: string,
  invoiceNumber: string,
  amountPaid: number,
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY',
  paymentReference: string,
  currency: 'NGN'
}
```

**Accounting Action**: Create journal entry for Cash/Bank debit, Receivable credit

---

### 4.3 PAYMENT_RECORDED

**Trigger**: Partial payment recorded on invoice
**Contains**:
```typescript
{
  eventType: 'PAYMENT_RECORDED',
  eventId: string,
  timestamp: Date,
  tenantId: string,
  invoiceId: string,
  paymentId: string,
  amountPaid: number,
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY',
  paymentReference: string,
  isPartialPayment: boolean,
  remainingBalance: number,
  currency: 'NGN'
}
```

**Accounting Action**: Create journal entry for partial Cash/Bank debit, Receivable credit

---

### 4.4 CREDIT_NOTE_APPLIED

**Trigger**: Credit note applied to invoice
**Contains**:
```typescript
{
  eventType: 'CREDIT_NOTE_APPLIED',
  eventId: string,
  timestamp: Date,
  tenantId: string,
  creditNoteId: string,
  creditNoteNumber: string,
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  reason: string,
  currency: 'NGN'
}
```

**Accounting Action**: Create reversal journal entry (Revenue debit, Receivable credit)

---

## 5. Journal Mapping Table

### 5.1 Invoice Issued

| Component | Debit Account | Credit Account | Amount |
|-----------|---------------|----------------|--------|
| Revenue | 1210 (Accounts Receivable) | 4120 (Sales Revenue) | Subtotal |
| VAT | 1210 (Accounts Receivable) | 2120 (VAT Payable) | VAT Amount |

**Example**: Invoice for ₦100,000 + ₦7,500 VAT
- Debit: 1210 Accounts Receivable → ₦107,500
- Credit: 4120 Sales Revenue → ₦100,000
- Credit: 2120 VAT Payable → ₦7,500

---

### 5.2 Payment Received

| Payment Method | Debit Account | Credit Account | Amount |
|----------------|---------------|----------------|--------|
| Cash | 1110 (Cash on Hand) | 1210 (Accounts Receivable) | Amount Paid |
| Bank Transfer | 1120 (Cash in Bank) | 1210 (Accounts Receivable) | Amount Paid |
| Card | 1120 (Cash in Bank) | 1210 (Accounts Receivable) | Amount Paid |
| Mobile Money | 1130 (Mobile Money) | 1210 (Accounts Receivable) | Amount Paid |

**Example**: ₦50,000 Bank Transfer received
- Debit: 1120 Cash in Bank → ₦50,000
- Credit: 1210 Accounts Receivable → ₦50,000

---

### 5.3 Credit Note Applied

| Component | Debit Account | Credit Account | Amount |
|-----------|---------------|----------------|--------|
| Revenue Reversal | 4120 (Sales Revenue) | 1210 (Accounts Receivable) | Credit Amount |
| VAT Reversal (if applicable) | 2120 (VAT Payable) | 1210 (Accounts Receivable) | VAT Portion |

**Example**: ₦10,000 credit note (with VAT reversal of ₦750)
- Debit: 4120 Sales Revenue → ₦9,302 (approx)
- Debit: 2120 VAT Payable → ₦698 (7.5% of credit)
- Credit: 1210 Accounts Receivable → ₦10,000

---

## 6. Nigeria SME Chart of Accounts Reference

| Code | Account Name | Type | Normal Side |
|------|--------------|------|-------------|
| 1110 | Cash on Hand | ASSET | DEBIT |
| 1120 | Cash in Bank (GTBank) | ASSET | DEBIT |
| 1130 | Mobile Money (OPay) | ASSET | DEBIT |
| 1210 | Accounts Receivable | ASSET | DEBIT |
| 2120 | VAT Payable (7.5%) | LIABILITY | CREDIT |
| 4120 | Online Sales / Service Revenue | REVENUE | CREDIT |

---

## 7. Idempotency Strategy

### Event ID as Idempotency Key
Each event carries a unique `eventId` (UUID). Before processing:

```typescript
// Check if already processed
const existing = await prisma.acct_journal_entries.findFirst({
  where: { 
    tenantId,
    sourceEventId: event.eventId 
  }
})

if (existing) {
  return { status: 'ALREADY_PROCESSED', journalId: existing.id }
}
```

### Benefits
- Safe to retry on failure
- No duplicate journal entries
- Audit trail of event processing

---

## 8. Technical Architecture

### 8.1 Component Diagram

```
┌─────────────────────┐     ┌──────────────────────────┐
│   Billing Suite     │     │    Accounting Suite      │
│                     │     │                          │
│  ┌───────────────┐  │     │  ┌────────────────────┐  │
│  │InvoiceService │──┼──┬──┼─▶│BillingJournalAdapter│  │
│  └───────────────┘  │  │  │  └────────────────────┘  │
│                     │  │  │            │             │
│  ┌───────────────┐  │  │  │            ▼             │
│  │PaymentService │──┼──┤  │  ┌────────────────────┐  │
│  └───────────────┘  │  │  │  │  JournalService    │  │
│                     │  │  │  └────────────────────┘  │
│  ┌───────────────┐  │  │  │            │             │
│  │CreditNoteServ │──┼──┘  │            ▼             │
│  └───────────────┘  │     │  ┌────────────────────┐  │
│                     │     │  │ acct_journal_entries│  │
└─────────────────────┘     │  └────────────────────┘  │
                            └──────────────────────────┘
```

### 8.2 Flow Sequence

```
1. Billing Service completes action (e.g., sendInvoice)
2. Billing emits domain event (INVOICE_ISSUED)
3. Integration layer calls BillingJournalAdapter.handle(event)
4. Adapter checks idempotency (has eventId been processed?)
5. If new: Adapter maps event → journal lines
6. Adapter calls JournalService.createJournal()
7. Journal entry created with sourceEventId for audit
8. Success response returned
```

---

## 9. File Structure (Proposed)

```
/app/frontend/src/lib/accounting/
├── integrations/
│   ├── index.ts                      # Barrel export
│   ├── types.ts                      # Event types
│   ├── billing-adapter.ts            # BillingJournalAdapter
│   └── account-mappings.ts           # Account code mappings
└── [existing services unchanged]
```

### New Files Only
| File | Purpose |
|------|---------|
| `types.ts` | Domain event type definitions |
| `billing-adapter.ts` | Event → Journal transformation |
| `account-mappings.ts` | Centralized account code constants |

### Existing Files (Additive Changes Only)
| File | Change |
|------|--------|
| `invoice-service.ts` | Emit event after sendInvoice |
| `invoice-payment-service.ts` | Emit event after recordPayment |
| `credit-note-service.ts` | Emit event after applyCreditNote |

---

## 10. What We Are NOT Building (Guardrails)

| Exclusion | Rationale |
|-----------|-----------|
| ❌ Async message queue | v1 is synchronous; queue is Phase 3 |
| ❌ Retry infrastructure | Manual retry via idempotency |
| ❌ Saga / compensation | Append-only; no rollbacks needed |
| ❌ Real-time webhooks | Internal integration only |
| ❌ Accounting → Billing flow | One-way integration |
| ❌ Multi-currency | NGN only per Nigeria-first |
| ❌ Schema changes to frozen suites | Additive code only |

---

## 11. Testing Strategy

### Unit Tests
- Event → Journal line mapping accuracy
- Idempotency check behavior
- VAT calculation correctness
- Account code selection by payment method

### Integration Tests
- End-to-end: Create invoice → Journal exists
- End-to-end: Record payment → Journal updated
- End-to-end: Apply credit note → Reversal entry

### Verification Criteria
- Trial balance remains balanced after all events
- VAT Payable reflects correct liability
- Accounts Receivable reflects correct outstanding

---

## 12. Rollout Plan

| Phase | Action |
|-------|--------|
| **S0** | Intent document (this document) |
| **S1** | Detailed mapping document |
| **S2** | Event emission in Billing services |
| **S3** | BillingJournalAdapter implementation |
| **S4** | Integration testing |
| **S5** | Demo verification |
| **S6** | Freeze integration v1 |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Journal entry errors | Financial misstatement | Idempotency + audit trail |
| Event lost in transit | Missing journal | Synchronous call (v1); queue in v2 |
| Account code mismatch | Wrong ledger entries | Centralized mapping constants |
| Performance degradation | Slow invoice creation | Async event emission (if needed) |
| Breaking frozen suite | Phase boundary violation | Additive changes only, no service refactors |

---

## 14. Definition of Done (S0)

- [x] Integration intent documented
- [x] Core principle established ("Billing emits facts, Accounting records truth")
- [x] Event-based architecture selected
- [x] 4 domain events defined
- [x] Journal mapping table complete
- [x] Nigeria-first considerations (VAT, payment methods)
- [x] Idempotency strategy defined
- [x] Technical architecture documented
- [x] Guardrails (what we're NOT building) clear
- [x] Testing strategy outlined
- [x] Risks identified and mitigated

---

## 🛑 STOP POINT B0

**Status**: SUBMITTED FOR APPROVAL

**Next Phase**: S1 (Detailed Mapping & Accounting Semantics)

**Approval Required Before**:
- Creating `/lib/accounting/integrations/` namespace
- Modifying Billing services to emit events
- Implementing BillingJournalAdapter

---

**Document Version**: 1.0
**Created**: January 7, 2026
**Author**: E1 Agent
**Track**: B (Billing → Accounting Integration)
