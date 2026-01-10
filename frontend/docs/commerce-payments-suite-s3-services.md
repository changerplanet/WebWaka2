# Commerce Suite: Payments & Collections
## S3: Core Services Canonicalization

**Suite Code**: `COM-PAY`  
**Phase**: S3 (Core Services)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. S3 Objective

Consolidate and canonicalize payment logic from SVM into the central `/lib/payments/` module. Create deterministic, ledger-first services that all suites (POS, SVM, MVM) consume.

**Constraints Enforced:**
- ✅ No API routes
- ✅ No UI
- ✅ No gateway SDKs
- ✅ No settlement/reconciliation engines
- ✅ No background jobs
- ✅ Pure domain logic only

---

## 2. Services Created

### 2.1 New Canonical Services

| Service | File | Methods | Purpose |
|---------|------|---------|---------|
| **PaymentMethodAvailabilityService** | `methods-service.ts` | 5 | Payment method selection, availability checking, fee calculation |
| **PODService** | `methods-service.ts` | 4 | Pay-on-Delivery config, availability, risk assessment |
| **BankTransferService** | `transfer-service.ts` | 5 | Reference generation, validation, bank list |
| **PaymentProofService** | `proof-service.ts` | 4 | Proof attachment, verification workflow |
| **PartialPaymentService** | `partial-payment-service.ts` | 5 | Partial payment tracking, summary, recording |
| **PaymentStatusResolver** | `status-resolver.ts` | 7 | Status display, transitions, order status resolution |

**Total New Services: 6**
**Total New Methods: 30**

### 2.2 Existing Services (Reused, No Changes)

| Service | File | Status |
|---------|------|--------|
| PaymentService | `payment-service.ts` | ✅ REUSED |
| WalletService | `wallet-service.ts` | ✅ REUSED |
| RefundService | `refund-service.ts` | ✅ REUSED |
| PaymentConfigService | `config-service.ts` | ✅ REUSED |
| PaymentEntitlementsService | `entitlements-service.ts` | ✅ REUSED |

**Total Reused Services: 5**

---

## 3. Logic Extracted from SVM

| Component | Source | Target | Notes |
|-----------|--------|--------|-------|
| Payment Method Types | `svm/payment-service.ts` | `payments/methods-service.ts` | Promoted with Nigeria-first priorities |
| POD Config & Logic | `svm/payment-service.ts` | `payments/methods-service.ts` | Generalized to tenant-level |
| Bank Transfer Logic | `svm/payment-service.ts` | `payments/transfer-service.ts` | Extracted with validation |
| Payment Status Display | `svm/payment-service.ts` | `payments/status-resolver.ts` | Centralized with transitions |

---

## 4. Service Details

### 4.1 PaymentMethodAvailabilityService

**Purpose**: Single source of truth for payment method configuration and availability.

**Methods**:
| Method | Purpose |
|--------|---------|
| `getPaymentMethods()` | Get all methods for a tenant |
| `getPaymentMethod()` | Get specific method |
| `checkAvailability()` | Check if method available for amount/context |
| `getAvailableMethods()` | Get all available methods for a transaction |
| `calculateTotalWithFee()` | Calculate total including payment fee |

**Nigeria-First Features**:
- Payment methods sorted by Nigeria priority (P0 > P1 > P2)
- NGN amount validation
- State-based POD restrictions
- Local bank/mobile money support

### 4.2 PODService

**Purpose**: Pay-on-Delivery business rules and risk management.

**Methods**:
| Method | Purpose |
|--------|---------|
| `getConfig()` | Get tenant POD configuration |
| `checkAvailability()` | Validate POD for order/state |
| `calculateFee()` | Get POD fee |
| `getRiskAssessment()` | Assess POD risk level |

**Nigeria-First Features**:
- Excluded states: Borno, Yobe, Adamawa (security-affected)
- Max amount: ₦500,000
- Default fee: ₦500
- Risk scoring for high-value/border-state orders

### 4.3 BankTransferService

**Purpose**: Bank transfer payment flow management.

**Methods**:
| Method | Purpose |
|--------|---------|
| `generateReference()` | Create unique WW-{TIMESTAMP}-{RANDOM} reference |
| `isValidReferenceFormat()` | Validate reference format |
| `createTransferDetails()` | Generate transfer instructions |
| `validateTransfer()` | Validate reference and amount |
| `getNigerianBanks()` | Get list of Nigerian banks |

**Nigeria-First Features**:
- 26 Nigerian banks including digital banks (OPay, PalmPay, Moniepoint, Kuda)
- 24-hour default expiry
- Partial payment support

### 4.4 PaymentProofService

**Purpose**: Proof-of-payment attachment and verification workflow.

**Methods**:
| Method | Purpose |
|--------|---------|
| `attachProof()` | Attach proof image to payment |
| `getProof()` | Get proof details |
| `verifyProof()` | Admin verify/reject proof |
| `getPendingVerifications()` | List payments awaiting verification |

**Workflow**:
1. Customer uploads proof → Status: PROCESSING
2. Admin reviews → VERIFIED or REJECTED
3. If VERIFIED → Payment CONFIRMED

### 4.5 PartialPaymentService

**Purpose**: Track partial payments for bank transfers.

**Methods**:
| Method | Purpose |
|--------|---------|
| `isEnabled()` | Check if partial payments enabled |
| `getPaymentSummary()` | Get paid/remaining amounts for order |
| `recordPartialPayment()` | Record a partial payment |
| `getPartialPaymentChains()` | List orders with partial payments |
| `calculateMinimumPartialPayment()` | Get minimum allowed (10% or ₦1,000) |

**Business Rules**:
- Minimum partial: 10% of remaining or ₦1,000 (whichever is greater)
- Parent-child payment linking
- Summary tracks total/paid/remaining

### 4.6 PaymentStatusResolver

**Purpose**: Deterministic status display and transitions.

**Methods**:
| Method | Purpose |
|--------|---------|
| `getPaymentStatusDisplay()` | Get UI display for status |
| `getIntentStatusDisplay()` | Get UI display for intent status |
| `canRefund()` | Check if payment can be refunded |
| `canRetry()` | Check if payment can be retried |
| `isTerminal()` | Check if status is terminal |
| `getNextStatus()` | Get next status after action |
| `resolveOrderPaymentStatus()` | Resolve status from multiple payments |

**Helper Functions**:
- `formatPaymentStatusForCustomer()` - Customer-friendly status text
- `getStatusBadgeClass()` - Tailwind badge classes

---

## 5. Canonical Index Exports

**File**: `/app/frontend/src/lib/payments/index.ts`

```typescript
// Core Services (Existing)
export { PaymentService, WalletService, RefundService, ... }

// S3 Canonical Services (New)
export { PaymentMethodAvailabilityService, PODService, ... }
export { BankTransferService }
export { PaymentProofService }
export { PartialPaymentService }
export { PaymentStatusResolver, formatPaymentStatusForCustomer, getStatusBadgeClass }

// Types
export type { PaymentMethodCode, PaymentMethodDefinition, ... }
```

---

## 6. Nigeria-First Alignment

| Requirement | Implementation |
|-------------|----------------|
| NGN currency | All amounts in Naira |
| Bank Transfer priority | P0 payment method |
| POD culture | Full POD service with risk assessment |
| USSD payments | Method defined, ready for gateway |
| Mobile money | OPay, PalmPay, Moniepoint support |
| Security states | Automatic POD exclusion |
| Local banks | 26 Nigerian banks listed |

---

## 7. Guardrails Confirmation

| Rule | Status |
|------|--------|
| No API routes created | ✅ |
| No UI components created | ✅ |
| No gateway SDKs imported | ✅ |
| No settlement logic | ✅ |
| No background jobs | ✅ |
| Pure domain logic only | ✅ |
| Ledger-first design | ✅ |
| Deterministic operations | ✅ |

---

## 8. Directory Structure (Final)

```
/app/frontend/src/lib/payments/
├── index.ts                      # 🆕 Canonical exports
├── config-service.ts             # ✅ Existing
├── entitlements-service.ts       # ✅ Existing
├── payment-service.ts            # ✅ Existing
├── wallet-service.ts             # ✅ Existing
├── refund-service.ts             # ✅ Existing
├── methods-service.ts            # 🆕 Payment methods + POD
├── transfer-service.ts           # 🆕 Bank transfer logic
├── proof-service.ts              # 🆕 Proof-of-payment
├── partial-payment-service.ts    # 🆕 Partial payments
└── status-resolver.ts            # 🆕 Status display + transitions
```

---

## 9. S4 Readiness

With S3 complete, the service layer now provides:
- All Nigeria-first payment methods with availability logic
- POD with state restrictions and risk assessment
- Bank transfer with reference generation and validation
- Proof-of-payment verification workflow
- Partial payment tracking
- Deterministic status resolution

**Ready for S4 (API Layer) authorization.**

---

## 10. Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| `methods-service.ts` | Created | ~350 |
| `transfer-service.ts` | Created | ~170 |
| `proof-service.ts` | Created | ~170 |
| `partial-payment-service.ts` | Created | ~190 |
| `status-resolver.ts` | Created | ~220 |
| `index.ts` | Created | ~70 |

**Total New Lines: ~1,170**

---

*Document prepared under PC-SCP guidelines*  
*S3 Core Services — COMPLETE*
