# Commerce Suite: Payments & Collections
## S0–S1: Audit + Capability Mapping

**Suite Code**: `COM-PAY`  
**Canonicalization Type**: HARDENING (Infrastructure exists, needs standardization)  
**Document Version**: 1.0.0  
**Created**: January 2025  
**Status**: DRAFT — Awaiting Approval for S2

---

## 1. Suite Intent

### 1.1 Purpose
The **Payments & Collections Suite** is the SINGLE AUTHORITY for all money movement within the platform. This is a Nigeria-first payment infrastructure designed to handle the unique payment patterns of Nigerian commerce:

- **Cash-heavy economy** (70%+ retail transactions are cash)
- **Bank transfer dominance** (manual transfers with reference verification)
- **Pay-on-Delivery culture** (COD/POD as trust mechanism)
- **Unreliable internet** (offline-capable, sync-friendly)
- **Multiple payment touchpoints** (POS terminals, USSD, mobile money)

### 1.2 Core Principle (MONEY RULES)
```
🚨 CRITICAL — THE SINGLE MONEY AUTHORITY

1. ONLY this module mutates wallet balances
2. ONLY this module executes payments
3. All other modules REQUEST payment, never ACT
4. Every mutation is AUDITABLE (append-only ledger)
5. LEDGER-FIRST, wallet-second (balance derived from transactions)
6. IDEMPOTENCY enforced (no double charges possible)
```

### 1.3 Scope Boundaries

**This Suite OWNS:**
- Payment Intents & Transactions
- Wallets & Wallet Transactions
- Refunds & Reversals
- Payment Configuration
- Gateway Abstraction Layer
- Payout Requests (to external banks)
- Settlement Calculations
- Payment Event Logs

**This Suite DOES NOT OWN (Uses by Reference Only):**
- Orders (owned by POS/SVM/MVM suites)
- Customers (owned by Core)
- Vendors (owned by MVM suite)
- Accounting Journals (owned by Accounting suite)
- Bank Account Verification (owned by Integrations Hub)

---

## 2. Nigeria-First Payment Method Priorities

### 2.1 P0 — Must Be First-Class

| Method | Status | Implementation Quality | Notes |
|--------|--------|------------------------|-------|
| **Bank Transfer (Manual)** | ✅ EXISTS | HIGH | Full implementation in SVM with reference generation, expiry, validation |
| **Card Payments (Gateway-Agnostic)** | ✅ EXISTS | MEDIUM | Config ready for Paystack/Flutterwave, needs abstraction layer |
| **Pay-on-Delivery (POD)** | ✅ EXISTS | HIGH | Amount limits, state restrictions, risk flags, fee calculation |

### 2.2 P1 — Strong Nigeria Coverage

| Method | Status | Implementation Quality | Notes |
|--------|--------|------------------------|-------|
| **USSD** | ⚠️ TYPE ONLY | LOW | Type defined in SVM, no execution logic |
| **Mobile Money** | ⚠️ TYPE ONLY | LOW | Type defined (OPay, PalmPay, Moniepoint), no execution |
| **POS Terminal** | ✅ EXISTS | HIGH | Full POS module with terminal support, external confirmation |

### 2.3 P2 — Light / Internal

| Method | Status | Implementation Quality | Notes |
|--------|--------|------------------------|-------|
| **Internal Wallet** | ✅ EXISTS | HIGH | Full wallet service with credits, debits, holds |

### 2.4 Explicitly Excluded (Per User Directive)
- ❌ Settlement engine
- ❌ Gateway SDK logic (handled by Integrations Hub)
- ❌ Banking / ledger system
- ❌ Reconciliation with banks

---

## 3. Existing Infrastructure Audit

### 3.1 Core Payment Services (`/app/frontend/src/lib/payments/`)

| File | Purpose | Lines | Quality | Reuse? |
|------|---------|-------|---------|--------|
| `payment-service.ts` | Payment Intents & Execution | 509 | ⭐⭐⭐⭐ | ✅ FULL REUSE |
| `wallet-service.ts` | Wallet Management & Transactions | 557 | ⭐⭐⭐⭐⭐ | ✅ FULL REUSE |
| `refund-service.ts` | Refund Lifecycle | 342 | ⭐⭐⭐⭐ | ✅ FULL REUSE |
| `config-service.ts` | Payment Configuration | 273 | ⭐⭐⭐⭐ | ✅ FULL REUSE |
| `entitlements-service.ts` | Tier Limits & Validation | 183 | ⭐⭐⭐⭐ | ✅ FULL REUSE |

**Assessment**: Core payment infrastructure is SOLID. Well-architected with ledger-first design, idempotency keys, and Nigeria-first defaults. No rebuild needed.

### 3.2 Suite-Specific Payment Logic

| Suite | File | Purpose | Quality | Action |
|-------|------|---------|---------|--------|
| **SVM** | `payment-service.ts` | Payment method selection, POD logic, bank transfer | ⭐⭐⭐⭐⭐ | PROMOTE to canonical |
| **POS** | `sale-service.ts` | Cash/card/terminal payments | ⭐⭐⭐⭐ | REFERENCE only |
| **MVM** | `payout-service.ts` | Vendor payout calculations | ⭐⭐⭐⭐ | REFERENCE only |

### 3.3 Database Schema (Prisma)

| Model | Records | Purpose | Canonical? |
|-------|---------|---------|------------|
| `pay_configurations` | Config | Tenant payment settings | ✅ Yes |
| `pay_payment_intents` | Intents | Payment requests before execution | ✅ Yes |
| `pay_payment_transactions` | Transactions | Completed payments | ✅ Yes |
| `pay_wallets` | Wallets | Balance containers | ✅ Yes |
| `pay_wallet_transactions` | Ledger | Immutable transaction log | ✅ Yes |
| `pay_refunds` | Refunds | Refund lifecycle | ✅ Yes |
| `pay_settlements` | Settlements | Settlement batches | ✅ Yes |
| `pay_payout_requests` | Payouts | External bank payouts | ✅ Yes |
| `pay_event_logs` | Events | Audit trail | ✅ Yes |

**Assessment**: Schema is canonical. All tables properly prefixed with `pay_`. No changes needed.

### 3.4 API Routes

| Route | Methods | Purpose | Has Capability Guard? |
|-------|---------|---------|----------------------|
| `/api/payments` | GET, POST, PUT | Main payment API | ✅ Session-based |
| `/api/commerce/svm/payments/transfer` | GET, POST | Bank transfer initiation | ✅ Capability guarded |

### 3.5 Payment Method Enum (Current)

```prisma
enum PayPaymentMethod {
  CASH
  CARD
  BANK_TRANSFER
  MOBILE_MONEY
  WALLET
  POS_TERMINAL
}
```

**Gap Analysis**: Missing explicit `USSD` type. Currently grouped under `MOBILE_MONEY`.

---

## 4. Gap Register

### 4.1 Architecture Gaps

| ID | Gap | Priority | Resolution Path |
|----|-----|----------|-----------------|
| GAP-001 | No explicit USSD payment method enum | P1 | Add `USSD` to `PayPaymentMethod` enum |
| GAP-002 | Missing POD state restrictions config | P0 | Already exists in SVM, needs promotion |
| GAP-003 | No partial payment tracking for bank transfer | P1 | Add `partialPayments` support |
| GAP-004 | Missing proof-of-payment attachment | P2 | Add `proofAttachmentUrl` field |

### 4.2 Capability Guard Gaps

| ID | Gap | Priority | Resolution Path |
|----|-----|----------|-----------------|
| CAP-001 | Main `/api/payments` uses session, not capability | P0 | Add `checkCapabilityGuard(request, 'payments')` |

### 4.3 Documentation Gaps

| ID | Gap | Priority | Resolution Path |
|----|-----|----------|-----------------|
| DOC-001 | No payment flow diagrams | P2 | Create during S5 |
| DOC-002 | Missing integration playbook for gateways | P2 | Defer to Integrations Hub |

---

## 5. Reuse Analysis

### 5.1 Direct Reuse (No Changes)

| Component | Source | Justification |
|-----------|--------|---------------|
| `WalletService` | `/lib/payments/wallet-service.ts` | Production-grade, ledger-first |
| `PaymentService` | `/lib/payments/payment-service.ts` | Intent-based, idempotent |
| `RefundService` | `/lib/payments/refund-service.ts` | Append-only, auditable |
| Schema models | `prisma/schema.prisma` | Properly prefixed, normalized |

### 5.2 Promote to Canonical

| Component | Source | Target | Changes Needed |
|-----------|--------|--------|----------------|
| Payment Methods Types | `/lib/svm/payment-service.ts` | `/lib/payments/methods.ts` | Export for all suites |
| POD Config & Logic | `/lib/svm/payment-service.ts` | `/lib/payments/pod-service.ts` | Generalize tenant-level |
| Bank Transfer Logic | `/lib/svm/payment-service.ts` | `/lib/payments/transfer-service.ts` | Extract from SVM |

### 5.3 Reference Only (Keep in Place)

| Component | Location | Reason |
|-----------|----------|--------|
| POS Sale Service | `/lib/pos/sale-service.ts` | Domain-specific, calls core payment |
| MVM Payout Service | `/lib/mvm/payout-service.ts` | Vendor-specific, calls core payment |

---

## 6. Capability Definition

### 6.1 Capability Registration

```typescript
{
  key: 'payments',
  module: 'Payments & Collections',
  displayName: 'Payments & Collections',
  description: 'Nigeria-first payment processing: cash, bank transfer, card, POD, mobile money',
  defaultEnabled: true,
  dependencies: [], // No module dependencies
  tier: 'FREE', // Core payment available on all tiers
  subCapabilities: [
    { key: 'payments.cash', displayName: 'Cash Payments' },
    { key: 'payments.bank_transfer', displayName: 'Bank Transfer' },
    { key: 'payments.card', displayName: 'Card Payments', tier: 'STARTER' },
    { key: 'payments.pod', displayName: 'Pay on Delivery' },
    { key: 'payments.mobile_money', displayName: 'Mobile Money', tier: 'STARTER' },
    { key: 'payments.ussd', displayName: 'USSD Payments', tier: 'STARTER' },
    { key: 'payments.wallet', displayName: 'Internal Wallet' },
    { key: 'payments.refunds', displayName: 'Refunds', tier: 'STARTER' },
    { key: 'payments.settlements', displayName: 'Vendor Settlements', tier: 'PROFESSIONAL' }
  ]
}
```

### 6.2 Entitlement Tiers

| Tier | Features |
|------|----------|
| **FREE** | Cash, Bank Transfer, POD, Wallet (₦100K daily limit) |
| **STARTER** | + Card, Mobile Money, USSD, Refunds (₦1M daily limit) |
| **PROFESSIONAL** | + Vendor Settlements, Gateways (₦10M daily limit) |
| **ENTERPRISE** | Full access, unlimited volume |

---

## 7. Guardrails for S2–S6

### 7.1 Schema Phase (S2)
- [ ] Add `USSD` to `PayPaymentMethod` enum
- [ ] Add `proofAttachmentUrl` to `pay_payment_transactions`
- [ ] Add `partialPaymentsEnabled` to `pay_configurations`
- [ ] No breaking changes to existing tables

### 7.2 Services Phase (S3)
- [ ] Extract payment method logic from SVM to canonical location
- [ ] Create `PODService` with generalized state restrictions
- [ ] Create `BankTransferService` for reference-based payments
- [ ] Maintain backward compatibility with existing service calls

### 7.3 API Phase (S4)
- [ ] Add capability guards to `/api/payments` route
- [ ] Create `/api/commerce/payments/` canonical endpoints
- [ ] Document all endpoints with OpenAPI spec

### 7.4 UI Phase (S5)
- [ ] Create payments demo page
- [ ] Add payment method selector component
- [ ] Nigeria-first demo data (₦ amounts, Nigerian banks)

### 7.5 Verification Phase (S6)
- [ ] Run validation checks
- [ ] Verify capability guards on all routes
- [ ] Create S6 verification document
- [ ] FREEZE suite

---

## 8. Canonical Directory Structure (Target State)

```
/app/frontend/src/lib/
└── payments/
    ├── index.ts                 # Re-exports
    ├── config-service.ts        # ✅ EXISTS
    ├── payment-service.ts       # ✅ EXISTS
    ├── wallet-service.ts        # ✅ EXISTS
    ├── refund-service.ts        # ✅ EXISTS
    ├── entitlements-service.ts  # ✅ EXISTS
    ├── methods.ts               # 🆕 Payment method types & constants
    ├── pod-service.ts           # 🆕 Pay-on-Delivery logic (from SVM)
    └── transfer-service.ts      # 🆕 Bank transfer logic (from SVM)

/app/frontend/src/app/api/
└── commerce/
    └── payments/                # 🆕 Canonical payment endpoints
        ├── route.ts
        ├── transfer/
        │   └── route.ts
        ├── pod/
        │   └── route.ts
        └── methods/
            └── route.ts
```

---

## 9. Test Coverage Requirements

### 9.1 Unit Tests
- [ ] Payment intent creation
- [ ] Payment confirmation (all methods)
- [ ] Wallet credit/debit operations
- [ ] Refund lifecycle
- [ ] POD availability checks
- [ ] Bank transfer reference validation

### 9.2 Integration Tests
- [ ] End-to-end payment flow (POS)
- [ ] End-to-end payment flow (SVM)
- [ ] Wallet balance consistency
- [ ] Capability guard enforcement

---

## 10. Summary & Recommendation

### 10.1 Overall Assessment

| Aspect | Score | Notes |
|--------|-------|-------|
| Architecture | ⭐⭐⭐⭐⭐ | Ledger-first, single authority |
| Code Quality | ⭐⭐⭐⭐ | Well-typed, documented |
| Schema Design | ⭐⭐⭐⭐⭐ | Properly prefixed, normalized |
| Nigeria-First | ⭐⭐⭐⭐⭐ | NGN default, local methods |
| Capability Guards | ⭐⭐⭐ | Session-based, needs upgrade |

### 10.2 Recommendation

**CANONICALIZATION TYPE: HARDENING**

The existing payment infrastructure is architecturally sound and should NOT be rebuilt. The S2–S6 phases should focus on:

1. **S2 (Schema)**: Minor enum additions only
2. **S3 (Services)**: Extract and promote SVM payment logic to canonical location
3. **S4 (API)**: Add capability guards, create canonical endpoints
4. **S5 (UI)**: Create demo page with Nigeria-first data
5. **S6 (Freeze)**: Verify and lock

### 10.3 Estimated Effort

| Phase | Effort | Description |
|-------|--------|-------------|
| S2 | LOW | 1-2 enum additions |
| S3 | MEDIUM | Service extraction and promotion |
| S4 | LOW | Capability guard additions |
| S5 | MEDIUM | Demo page creation |
| S6 | LOW | Verification |

---

## 11. Approval Gate

**S0-S1 Status**: ✅ COMPLETE

**Awaiting Approval For**:
- [ ] Proceed to S2 (Schema hardening)
- [ ] Gap register accepted
- [ ] Guardrails confirmed

---

*Document prepared under PC-SCP guidelines*  
*Nigeria-First • Audit-First • Capability-Guarded*
