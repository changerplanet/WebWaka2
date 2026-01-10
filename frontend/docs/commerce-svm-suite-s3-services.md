# SVM Suite — S3 Core Services Canonicalization

## Document Info
- **Suite**: Single Vendor Marketplace (Commerce Sub-Suite 2 of 8)
- **Phase**: S3 (Core Services Canonicalization)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: COMPLETE
- **Date**: December 2025
- **Author**: E1 Agent
- **Reference**: S2 Schema & Currency Canonicalization (APPROVED)

---

## 1️⃣ S3 SCOPE (Per Authorization)

| Service | Status |
|---------|--------|
| Shipping Service (Nigerian zones, local pickup) | ✅ DONE |
| Payment Logic Service (POD, bank transfer) | ✅ DONE |
| Order Lifecycle Service (state transitions, cancellation) | ✅ DONE |
| Checkout Orchestration Service (composition) | ✅ DONE |

### Explicitly NOT In S3 Scope
- ❌ No UI work
- ❌ No payment gateway SDKs
- ❌ No logistics automation
- ❌ No notifications (SMS/WhatsApp)
- ❌ No refunds processing (logic only)

---

## 2️⃣ SERVICES CREATED

### Service Architecture
```
/app/frontend/src/lib/svm/
├── index.ts                    # Barrel exports (all types + functions)
├── shipping-service.ts         # Nigerian shipping zones & rates
├── payment-service.ts          # POD, bank transfer, payment methods
├── order-lifecycle-service.ts  # State machine, cancellation, refunds
└── checkout-service.ts         # Orchestration, validation, finalization
```

---

## 3️⃣ SHIPPING SERVICE

**File**: `/app/frontend/src/lib/svm/shipping-service.ts`

### Features
- **37 Nigerian states** (36 states + FCT) with geopolitical regions
- **7 regional shipping zones** (Lagos Metro, South West, South East, South South, North Central, North West, North East)
- **Local pickup** support with enable/disable
- **Flat rate shipping** with free-above thresholds
- **Express and standard options** per zone

### Nigerian Shipping Zones
| Zone | States | Standard Rate | Express Rate | Free Above |
|------|--------|--------------|--------------|------------|
| Lagos Metro | Lagos | ₦1,500 | ₦2,500 | ₦50,000 |
| South West | Ogun, Oyo, Osun, Ondo, Ekiti | ₦2,000 | ₦3,500 | ₦75,000 |
| South East | Enugu, Anambra, Imo, Abia, Ebonyi | ₦2,500 | ₦4,500 | ₦100,000 |
| South South | Rivers, Delta, Cross River, Akwa Ibom, Bayelsa, Edo | ₦2,500 | ₦4,500 | ₦100,000 |
| North Central | FCT, Kogi, Kwara, Nasarawa, Niger, Benue, Plateau | ₦2,500 | ₦4,500 | ₦100,000 |
| North West | Kaduna, Kano, Katsina, Kebbi, Sokoto, Zamfara, Jigawa | ₦3,000 | ₦5,500 | ₦150,000 |
| North East | Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe | ₦3,500 | ₦6,500 | ₦150,000 |

### Key Functions
```typescript
// Zone discovery
getRegionForState(state: string): string | null
isValidNigerianState(state: string): boolean
findZoneForState(tenantId, state): Promise<NigerianShippingZone | null>

// Shipping calculation
calculateShipping(tenantId, state, subtotal, includeLocalPickup): Promise<ShippingCalculation[]>
getCheapestShipping(tenantId, state, subtotal): Promise<ShippingCalculation | null>
getFastestShipping(tenantId, state, subtotal): Promise<ShippingCalculation | null>

// Zone management
seedNigerianShippingZones(tenantId): Promise<NigerianShippingZone[]>
getShippingZones(tenantId): Promise<NigerianShippingZone[]>

// Local pickup
isLocalPickupAvailable(tenantId): Promise<boolean>
enableLocalPickup(tenantId): Promise<void>
disableLocalPickup(tenantId): Promise<void>
```

---

## 4️⃣ PAYMENT LOGIC SERVICE

**File**: `/app/frontend/src/lib/svm/payment-service.ts`

### Features
- **6 payment methods** (Card, Bank Transfer, POD, USSD, Mobile Money, Wallet)
- **Pay-on-Delivery (POD)** with amount limits and state restrictions
- **Bank transfer** reference generation and validation
- **Payment method availability** rules per tenant
- **Payment fee calculation** (fixed or percentage)

### Default Payment Methods (Nigeria-First)
| Method | Description | Min | Max | Fee |
|--------|-------------|-----|-----|-----|
| Card | Visa, Mastercard, Verve | ₦100 | - | ₦0 |
| Bank Transfer | Direct bank transfer | ₦1,000 | - | ₦0 |
| POD | Cash on delivery | ₦1,000 | ₦500,000 | ₦500 |
| USSD | *737#, *919#, etc. | ₦100 | ₦100,000 | ₦0 |
| Mobile Money | OPay, PalmPay | ₦100 | - | ₦0 |
| Wallet | Store wallet | - | - | ₦0 |

### POD Configuration
```typescript
const DEFAULT_POD_CONFIG = {
  isEnabled: true,
  maxAmount: 500000,           // ₦500,000 limit
  additionalFee: 500,          // ₦500 POD fee
  requiresPhoneVerification: true,
  allowedStates: [],           // Empty = all states
  excludedStates: ['Borno', 'Yobe', 'Adamawa']  // Security-affected areas
}
```

### Key Functions
```typescript
// Payment methods
getPaymentMethods(tenantId): Promise<PaymentMethod[]>
getPaymentMethod(tenantId, code): Promise<PaymentMethod | null>
checkPaymentMethodAvailability(tenantId, code, amount, state): Promise<PaymentMethodAvailability>
getAvailablePaymentMethods(tenantId, amount, state): Promise<PaymentMethodAvailability[]>

// POD
getPODConfig(tenantId): Promise<PODConfig>
isPODAvailable(tenantId, amount, state): Promise<{ available: boolean; reason?: string }>
calculatePODFee(tenantId, amount): Promise<number>

// Bank transfer
generateTransferReference(orderId): string  // "WW-XXXXX-XXXX"
createBankTransferDetails(tenantId, orderId, amount): Promise<BankTransferDetails>
isValidTransferReference(reference): boolean

// Calculation
calculatePaymentTotal(tenantId, subtotal, shipping, tax, discount, method): Promise<PaymentTotals>
```

---

## 5️⃣ ORDER LIFECYCLE SERVICE

**File**: `/app/frontend/src/lib/svm/order-lifecycle-service.ts`

### Features
- **8 order statuses** with defined state machine
- **Valid transitions** enforced by actor (Customer, Merchant, System)
- **Cancellation eligibility** with refund calculation
- **Refund eligibility** with return window enforcement
- **Status display helpers** with icons and colors

### Order State Machine
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
    ↓         ↓           ↓
CANCELLED  CANCELLED   CANCELLED                              → RETURNED
```

### Cancellation Rules
| Order Status | Customer Can Cancel | Refund | Fee |
|--------------|---------------------|--------|-----|
| PENDING | ✅ Yes | 100% | ₦0 |
| CONFIRMED | ✅ Yes | 100% | ₦0 |
| PROCESSING | ✅ Yes | 95% | 5% processing fee |
| SHIPPED | ❌ No (contact support) | Shipping non-refundable | - |
| DELIVERED | ❌ No | - | - |

### Refund Rules
- **Return window**: 7 days from delivery
- **Shipping**: Non-refundable after delivery
- **Requirements**: Return of items for delivered orders

### Key Functions
```typescript
// State machine
isValidTransition(from, to, actor): boolean
getAllowedTransitions(currentStatus, actor): OrderStatus[]
updateOrderStatus(orderId, newStatus, actor, metadata): Promise<Result>

// Cancellation
checkCancellationEligibility(orderId): Promise<CancellationEligibility>
cancelOrder(orderId, reason, cancelledBy, notes): Promise<Result>

// Refunds
checkRefundEligibility(orderId): Promise<RefundEligibility>

// Display
getOrderStatusDisplay(status): OrderStatusDisplay
getOrderTimeline(status): OrderStatusDisplay[]
```

---

## 6️⃣ CHECKOUT ORCHESTRATION SERVICE

**File**: `/app/frontend/src/lib/svm/checkout-service.ts`

### Features
- **Unified checkout summary** composing all fees
- **Multi-step validation** with detailed errors
- **Session management** for checkout flow
- **Order finalization** with transaction support

### Checkout Summary Structure
```typescript
interface CheckoutSummary {
  items: CartItem[]
  itemCount: number
  subtotal: number              // ₦
  discountTotal: number         // ₦
  taxRate: number               // 0.075 (7.5%)
  taxName: string               // "VAT"
  taxTotal: number              // ₦
  shippingTotal: number         // ₦
  paymentFee: number            // ₦
  grandTotal: number            // ₦
  currency: 'NGN'
}
```

### Validation Rules
- Cart must have items
- Shipping address required (name, phone, address, city, state)
- Nigerian phone format validation (warning, not blocking)
- Shipping method required
- Payment method required and available for amount/state

### Key Functions
```typescript
// Calculation
calculateCheckoutSummary(tenantId, items, options): Promise<CheckoutSummary>

// Validation
validateCheckout(tenantId, items, address, shipping, payment): Promise<CheckoutValidation>

// Session
createCheckoutSession(tenantId, sessionId, items, options): Promise<CheckoutSession>
updateCheckoutShipping(session, shippingOption): Promise<CheckoutSession>
updateCheckoutPayment(session, paymentMethod): Promise<CheckoutSession>

// Finalization
finalizeCheckout(session, email, notes): Promise<{ success, orderId, orderNumber, error }>

// Helpers
getCheckoutShippingOptions(tenantId, state, subtotal): Promise<ShippingCalculation[]>
getCheckoutPaymentMethods(tenantId, amount, state): Promise<PaymentMethodAvailability[]>
```

---

## 7️⃣ GAP RESOLUTION STATUS

| Gap ID | Description | S3 Status |
|--------|-------------|-----------|
| GAP-SVM-005 | Nigerian shipping zones | ✅ RESOLVED |
| GAP-SVM-009 | Bank transfer flow | ✅ LOGIC DONE |
| GAP-SVM-014 | Local pickup | ✅ RESOLVED |
| GAP-SVM-POD | Pay-on-Delivery | ✅ RESOLVED |

### Remaining for S4+
- GAP-SVM-006: Product sorting UI (S5)
- GAP-SVM-007: Order cancellation UI (S5)
- GAP-SVM-008: Order refund UI (S5)
- GAP-SVM-013: SMS notification (Integration)

---

## 8️⃣ FILES CREATED

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/svm/index.ts` | 100 | Barrel exports |
| `src/lib/svm/shipping-service.ts` | 520 | Nigerian shipping zones |
| `src/lib/svm/payment-service.ts` | 380 | Payment methods & POD |
| `src/lib/svm/order-lifecycle-service.ts` | 350 | State machine & eligibility |
| `src/lib/svm/checkout-service.ts` | 540 | Orchestration & finalization |

**Total**: ~1,890 lines of canonical services

---

## 9️⃣ VERIFICATION

### TypeScript Compilation
```bash
✅ npx tsc --noEmit src/lib/svm/index.ts
# No errors
```

### Service Integration
- ✅ Shipping service uses `svm_shipping_zones` and `svm_shipping_rates` tables
- ✅ Payment service uses entitlement-based configuration
- ✅ Order lifecycle uses `svm_orders` table
- ✅ Checkout service composes tax (7.5% VAT), shipping, and payment

### Nigeria-First Compliance
- ✅ 37 Nigerian states mapped to 7 regions
- ✅ NGN currency throughout
- ✅ 7.5% VAT default
- ✅ POD with ₦500,000 limit
- ✅ Security-affected states excluded from POD

---

## 📌 S3 COMPLETE — AWAITING S4 AUTHORIZATION

### What S3 Achieved
1. ✅ **Shipping Service**: Nigerian zones, local pickup, rate calculation
2. ✅ **Payment Service**: POD, bank transfer, method availability
3. ✅ **Order Lifecycle**: State machine, cancellation, refund eligibility
4. ✅ **Checkout Orchestration**: Tax + shipping + payment composition

### What Remains for S4+
- **S4**: API layer exposing these services via REST endpoints
- **S5**: UI updates to consume new services
- **S6**: Verification and freeze

---

**🛑 AGENT WILL STOP HERE AND AWAIT S4 APPROVAL**
