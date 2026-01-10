# Billing → Accounting Integration — S1: Detailed Mapping & Accounting Semantics

**Phase**: Phase 2 — Operational Integrity
**Track**: B (Cross-Suite Integration)
**Status**: S1 SUBMITTED
**Depends On**: S0 Intent Document (APPROVED)

---

## 1. Overview

This document provides the **final, authoritative journal entry mappings** for all billing events. These mappings are LOCKED once approved and form the contract between Billing and Accounting suites.

---

## 2. Account Code Reference (Nigeria SME Chart of Accounts)

### Asset Accounts (1xxx)
| Code | Name | Normal Side | Purpose |
|------|------|-------------|---------|
| 1110 | Cash on Hand | DEBIT | Physical cash in drawer/safe |
| 1120 | Cash in Bank (GTBank) | DEBIT | Primary bank account |
| 1121 | Cash in Bank (Access) | DEBIT | Secondary bank account |
| 1122 | Cash in Bank (Zenith) | DEBIT | Alternative bank account |
| 1130 | Mobile Money (OPay) | DEBIT | OPay wallet balance |
| 1131 | Mobile Money (PalmPay) | DEBIT | PalmPay wallet balance |
| 1132 | Mobile Money (Moniepoint) | DEBIT | Moniepoint balance |
| 1140 | POS Terminal Float | DEBIT | Card terminal pending settlement |
| 1210 | Accounts Receivable | DEBIT | Customer amounts owed |

### Liability Accounts (2xxx)
| Code | Name | Normal Side | Purpose |
|------|------|-------------|---------|
| 2120 | VAT Payable (7.5%) | CREDIT | Output VAT collected |

### Revenue Accounts (4xxx)
| Code | Name | Normal Side | Purpose |
|------|------|-------------|---------|
| 4110 | POS Sales | CREDIT | Walk-in retail sales |
| 4120 | Online Sales | CREDIT | E-commerce/SVM sales |
| 4130 | Marketplace Sales | CREDIT | MVM platform fees |
| 4200 | Service Revenue | CREDIT | B2B/consulting services |

---

## 3. Payment Method → Cash Account Mapping

| Payment Method | Account Code | Account Name |
|----------------|--------------|--------------|
| `CASH` | 1110 | Cash on Hand |
| `BANK_TRANSFER` | 1120 | Cash in Bank (GTBank) |
| `CARD` | 1140 | POS Terminal Float |
| `MOBILE_MONEY` | 1130 | Mobile Money (OPay) |
| `USSD` | 1120 | Cash in Bank (GTBank) |

**Note**: For bank transfers, use the default bank (GTBank/1120). Multi-bank support can be added in Phase 3.

---

## 4. Journal Entry Mappings

### 4.1 INVOICE_ISSUED Event

**Trigger**: Invoice status changes from DRAFT → SENT

**Business Meaning**: Customer now owes money; revenue is recognized.

#### Standard Invoice (VAT Applicable)

**Example**: Invoice ₦100,000 + ₦7,500 VAT = ₦107,500 total

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1210 | Accounts Receivable | ₦107,500 | - |
| 2 | 4200 | Service Revenue | - | ₦100,000 |
| 3 | 2120 | VAT Payable (7.5%) | - | ₦7,500 |
| | | **TOTAL** | **₦107,500** | **₦107,500** |

#### VAT-Exempt Invoice (NGO/Educational)

**Example**: Invoice ₦100,000 (VAT exempt)

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1210 | Accounts Receivable | ₦100,000 | - |
| 2 | 4200 | Service Revenue | - | ₦100,000 |
| | | **TOTAL** | **₦100,000** | **₦100,000** |

#### VAT-Inclusive Invoice

**Example**: Invoice ₦107,500 VAT-inclusive (₦100,000 net + ₦7,500 VAT)

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1210 | Accounts Receivable | ₦107,500 | - |
| 2 | 4200 | Service Revenue | - | ₦100,000 |
| 3 | 2120 | VAT Payable (7.5%) | - | ₦7,500 |
| | | **TOTAL** | **₦107,500** | **₦107,500** |

**VAT Extraction Formula**: `VAT = Inclusive Amount × (7.5 / 107.5)`

---

### 4.2 PAYMENT_RECORDED Event

**Trigger**: Payment recorded against invoice (full or partial)

**Business Meaning**: Cash received; receivable reduced.

#### Full Payment via Bank Transfer

**Example**: ₦107,500 received via bank transfer

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1120 | Cash in Bank (GTBank) | ₦107,500 | - |
| 2 | 1210 | Accounts Receivable | - | ₦107,500 |
| | | **TOTAL** | **₦107,500** | **₦107,500** |

#### Partial Payment via Cash

**Example**: ₦50,000 partial payment in cash (₦57,500 remaining)

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1110 | Cash on Hand | ₦50,000 | - |
| 2 | 1210 | Accounts Receivable | - | ₦50,000 |
| | | **TOTAL** | **₦50,000** | **₦50,000** |

#### Payment via Mobile Money

**Example**: ₦30,000 via OPay

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1130 | Mobile Money (OPay) | ₦30,000 | - |
| 2 | 1210 | Accounts Receivable | - | ₦30,000 |
| | | **TOTAL** | **₦30,000** | **₦30,000** |

#### Payment via Card (POS)

**Example**: ₦75,000 via card payment

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 1140 | POS Terminal Float | ₦75,000 | - |
| 2 | 1210 | Accounts Receivable | - | ₦75,000 |
| | | **TOTAL** | **₦75,000** | **₦75,000** |

---

### 4.3 CREDIT_NOTE_APPLIED Event

**Trigger**: Credit note applied to reduce invoice balance

**Business Meaning**: Revenue reversal; receivable reduced.

#### Credit Note (Standard - with VAT reversal)

**Example**: ₦10,750 credit note (₦10,000 + ₦750 VAT)

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 4200 | Service Revenue | ₦10,000 | - |
| 2 | 2120 | VAT Payable (7.5%) | ₦750 | - |
| 3 | 1210 | Accounts Receivable | - | ₦10,750 |
| | | **TOTAL** | **₦10,750** | **₦10,750** |

#### Credit Note (VAT Exempt)

**Example**: ₦5,000 credit note (no VAT)

| Line | Account | Account Name | Debit | Credit |
|------|---------|--------------|-------|--------|
| 1 | 4200 | Service Revenue | ₦5,000 | - |
| 2 | 1210 | Accounts Receivable | - | ₦5,000 |
| | | **TOTAL** | **₦5,000** | **₦5,000** |

---

## 5. Partial Payment Handling

### Scenario: Invoice ₦100,000 paid in 3 installments

| Event | Amount | Running A/R Balance |
|-------|--------|---------------------|
| Invoice Issued | - | ₦100,000 (Debit) |
| Payment 1 (Bank) | ₦40,000 | ₦60,000 |
| Payment 2 (Cash) | ₦35,000 | ₦25,000 |
| Payment 3 (Mobile) | ₦25,000 | ₦0 |

**Result**: 4 journal entries created, one per event. Each payment entry is independent and idempotent.

---

## 6. VAT Handling Rules

### VAT Rate
- **Standard Rate**: 7.5% (Nigerian VAT)
- **Calculation**: `VAT = Subtotal × 0.075`

### VAT Exemption Categories
| Code | Category | Example |
|------|----------|---------|
| `BASIC_FOOD` | Basic food items | Rice, beans, garri |
| `MEDICAL` | Medical services | Hospital services |
| `EDUCATION` | Educational services | School fees |
| `EXPORTS` | Export services | Offshore consulting |
| `AGRICULTURAL` | Agricultural inputs | Fertilizers, seeds |
| `NGO_ACTIVITIES` | Registered NGO services | Charity programs |
| `GOVERNMENT` | Government contracts | Federal ministry work |

### VAT Inclusive vs Exclusive
| Mode | Input | Subtotal | VAT | Total |
|------|-------|----------|-----|-------|
| **Exclusive** | ₦100,000 | ₦100,000 | ₦7,500 | ₦107,500 |
| **Inclusive** | ₦107,500 | ₦100,000 | ₦7,500 | ₦107,500 |

**Inclusive Extraction**: `Subtotal = Total / 1.075` then `VAT = Total - Subtotal`

---

## 7. Journal Entry Metadata

Each journal entry created from a billing event MUST include:

```typescript
{
  journalNumber: 'JE-{YYMM}-{XXXXX}',
  date: event.timestamp,
  description: 'Auto-generated from billing event',
  sourceType: 'BILLING_INTEGRATION',
  sourceEventType: event.eventType,       // e.g., 'INVOICE_ISSUED'
  sourceEventId: event.eventId,           // UUID for idempotency
  sourceReference: event.invoiceNumber,   // e.g., 'INV-2501-00001'
  tenantId: event.tenantId,
  status: 'POSTED',                        // Auto-post by default
  lines: [...],                            // Debit/Credit lines
  totalDebit: number,
  totalCredit: number,
  createdAt: Date.now(),
  createdBy: 'SYSTEM:billing-integration'
}
```

---

## 8. Edge Cases & Rules

### Rule 1: Zero-Amount Events
- **Skip**: Do not create journal for ₦0 events
- **Log**: Record skip in integration log

### Rule 2: Already Processed
- **Skip**: If `sourceEventId` already exists, return existing journal
- **No Error**: This is expected behavior for retries

### Rule 3: Balance Validation
- **MUST**: `totalDebit === totalCredit` (enforced in adapter)
- **FAIL**: Throw error if unbalanced; do not persist

### Rule 4: Currency
- **ONLY**: NGN (Nigerian Naira)
- **FAIL**: Reject any non-NGN events

### Rule 5: Tenant Isolation
- **ALWAYS**: Include `tenantId` in every journal entry
- **NEVER**: Allow cross-tenant journal creation

---

## 9. Sample Event → Journal Transformation

### Input Event
```json
{
  "eventType": "INVOICE_ISSUED",
  "eventId": "evt-123e4567-e89b-12d3",
  "timestamp": "2026-01-07T10:30:00Z",
  "tenantId": "tenant-abc",
  "invoiceId": "inv-001",
  "invoiceNumber": "INV-2601-00001",
  "customerId": "cust-001",
  "customerName": "Dangote Industries Ltd",
  "subtotal": 500000,
  "vatAmount": 37500,
  "grandTotal": 537500,
  "currency": "NGN",
  "vatExempt": false,
  "vatInclusive": false
}
```

### Output Journal
```json
{
  "journalNumber": "JE-2601-00089",
  "date": "2026-01-07T10:30:00Z",
  "description": "Invoice INV-2601-00001 - Dangote Industries Ltd",
  "sourceType": "BILLING_INTEGRATION",
  "sourceEventType": "INVOICE_ISSUED",
  "sourceEventId": "evt-123e4567-e89b-12d3",
  "sourceReference": "INV-2601-00001",
  "tenantId": "tenant-abc",
  "status": "POSTED",
  "lines": [
    {
      "lineNumber": 1,
      "accountCode": "1210",
      "accountName": "Accounts Receivable",
      "debit": 537500,
      "credit": 0,
      "description": "Invoice INV-2601-00001"
    },
    {
      "lineNumber": 2,
      "accountCode": "4200",
      "accountName": "Service Revenue",
      "debit": 0,
      "credit": 500000,
      "description": "Revenue - INV-2601-00001"
    },
    {
      "lineNumber": 3,
      "accountCode": "2120",
      "accountName": "VAT Payable (7.5%)",
      "debit": 0,
      "credit": 37500,
      "description": "Output VAT - INV-2601-00001"
    }
  ],
  "totalDebit": 537500,
  "totalCredit": 537500,
  "createdAt": "2026-01-07T10:30:00Z",
  "createdBy": "SYSTEM:billing-integration"
}
```

---

## 10. Definition of Done (S1)

- [x] All event types mapped to journal entries
- [x] Account codes finalized (Nigeria SME COA)
- [x] Payment method → Cash account mapping complete
- [x] VAT handling rules documented
- [x] Partial payment handling documented
- [x] Edge cases and rules defined
- [x] Sample transformation provided
- [x] Journal metadata structure defined

---

## 🛑 STOP POINT B1

**Status**: SUBMITTED FOR APPROVAL

**Next Phase**: S2-S3 (Event Emission + Journal Adapter Implementation)

**Approval Required Before**:
- Creating event types in `/lib/accounting/integrations/types.ts`
- Implementing `BillingJournalAdapter`
- Modifying Billing services to emit events

---

**Document Version**: 1.0
**Created**: January 7, 2026
**Author**: E1 Agent
**Track**: B (Billing → Accounting Integration)
