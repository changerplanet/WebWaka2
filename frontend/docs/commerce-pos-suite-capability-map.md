# POS & Retail Operations Suite — S0–S1 Capability Mapping

## Document Info
- **Suite**: POS & Retail Operations (Commerce Sub-Suite 1 of 8)
- **Phase**: S0–S1 (Re-Canonicalization Audit)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: December 2025
- **Author**: E1 Agent
- **Baseline**: Existing Non-Standard Implementation

---

## 1️⃣ SUITE INTENT (S0)

### Purpose Statement

The **POS & Retail Operations Suite** is a specialized Point-of-Sale solution designed for Nigerian retail businesses operating in diverse environments—from bustling open markets and roadside kiosks to structured supermarkets and chain stores.

### Who This Suite Is For (Nigeria-First)

| Customer Segment | Description | Size Range |
|------------------|-------------|------------|
| **Market Traders** | Open market stalls, table-top sellers | 1-2 staff |
| **Retail Shops** | Provision stores, pharmacies, boutiques | 1-10 staff |
| **Supermarkets** | Self-service retail with multiple registers | 5-50 staff |
| **Chain Stores** | Multi-location retail operations | 10-500 staff |
| **Kiosks** | Small-format retail, container shops | 1-3 staff |
| **Quick Service** | Fast food, takeaway, grab-and-go | 2-20 staff |

### Core Problems It Solves

1. **Sales Transaction Processing** — Fast, reliable checkout for walk-in customers
2. **Cash Management** — Track cash flow, drawer reconciliation, shift handovers
3. **Payment Flexibility** — Accept cash, POS terminal, bank transfer, mobile money
4. **Inventory Deduction** — Real-time stock updates upon sale
5. **Customer Tracking** — Optional loyalty and repeat customer identification
6. **Offline Resilience** — Continue sales during network/power outages
7. **Staff Accountability** — Track who sold what, when, and how much

### Nigerian Retail Context

| Context | POS Consideration |
|---------|-------------------|
| **Power instability** | Offline-first architecture with sync |
| **Network unreliability** | Local storage, batch sync |
| **Cash-dominant economy** | Strong cash handling features |
| **Bank transfer culture** | Transfer confirmation workflow |
| **Mixed literacy** | Simple UI, visual product selection |
| **High staff turnover** | Quick training, PIN-based login |
| **Informal receipts** | SMS/WhatsApp receipt sharing |

### What This Suite Explicitly Does NOT Solve

| Excluded Scope | Reason |
|----------------|--------|
| ❌ **E-commerce storefront** | Handled by SVM (Single Vendor Marketplace) |
| ❌ **Marketplace vendor management** | Handled by MVM (Multi-Vendor Marketplace) |
| ❌ **Warehouse operations** | Handled by Advanced Warehouse Suite |
| ❌ **Full accounting/ERP** | Handled by Accounting Suite |
| ❌ **Staff payroll** | Handled by HR Module |
| ❌ **Customer engagement campaigns** | Handled by CRM Suite |
| ❌ **Table service/hospitality POS** | Handled by Hospitality Suite |

---

## 2️⃣ CAPABILITY MAPPING (S1)

### Legend

- **Priority**: P0 (Must have), P1 (Should have), P2 (Nice to have)
- **Reuse**: `REUSE` = From existing module, `POS-SPECIFIC` = New for POS
- **Status**:
  - `COMPLIANT` ✅ — Fully implemented and meets canonical standard
  - `PARTIAL` 🟡 — Implemented but incomplete or non-standard
  - `MISSING` ❌ — Not implemented
  - `NON-COMPLIANT` ⚠️ — Implemented but violates canonical standards

---

### A. SALES TRANSACTIONS (10 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Product lookup by name** | P0 | REUSE (Inventory) | ✅ COMPLIANT | `/api/pos/products` via `coreInventoryService.searchProducts` |
| 2 | **Product lookup by SKU** | P0 | REUSE (Inventory) | ✅ COMPLIANT | SKU search in product lookup |
| 3 | **Barcode scanning** | P0 | REUSE (Inventory) | 🟡 PARTIAL | Barcode field exists, scanner integration not documented |
| 4 | **Quick product grid** | P1 | POS-SPECIFIC | ✅ COMPLIANT | `QuickProductCard` component, first 20 products |
| 5 | **Cart management (add/remove/modify)** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `POSCart.tsx`, `addToCart`, `updateCartItem`, `removeFromCart` |
| 6 | **Line-item quantity adjustment** | P0 | POS-SPECIFIC | ✅ COMPLIANT | +/- buttons, direct input |
| 7 | **Line-item discount application** | P1 | POS-SPECIFIC | ✅ COMPLIANT | `applyDiscount` method in POSProvider |
| 8 | **Cart-level discount** | P1 | POS-SPECIFIC | ❌ MISSING | Only line-item discounts implemented |
| 9 | **Tax calculation** | P0 | REUSE (Billing) | 🟡 PARTIAL | Hardcoded 8% tax rate, should use tenant config |
| 10 | **Sale completion/finalization** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `checkout` function posts to `/api/pos/events` |

**Sales Transactions: 7/10 Compliant (70%)**

---

### B. PAYMENT HANDLING (8 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 11 | **Cash payment** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `PaymentScreen.tsx` - CASH method |
| 12 | **Card payment** | P0 | REUSE (Payments) | 🟡 PARTIAL | UI exists, no actual card processing |
| 13 | **Mobile payment (USSD/Mobile Money)** | P1 | REUSE (Payments) | 🟡 PARTIAL | UI exists as "Mobile Pay", no integration |
| 14 | **Bank transfer payment** | P0 | POS-SPECIFIC | ❌ MISSING | Not in payment methods list |
| 15 | **Split payment (multiple methods)** | P2 | POS-SPECIFIC | ❌ MISSING | No split payment UI or logic |
| 16 | **Cash received & change calculation** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `cashReceived` state, change display |
| 17 | **Payment confirmation workflow** | P1 | POS-SPECIFIC | 🟡 PARTIAL | Immediate success, no async confirmation |
| 18 | **Store credit/wallet payment** | P2 | REUSE (Payments) | 🟡 PARTIAL | UI exists as "Store Credit", no wallet integration |

**Payment Handling: 2/8 Compliant (25%)**

---

### C. REGISTERS & SHIFTS (6 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 19 | **Register/terminal selection** | P1 | POS-SPECIFIC | 🟡 PARTIAL | `registerId` in state, no selection UI |
| 20 | **Staff login/PIN entry** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `LocationSelect.tsx` staff selection |
| 21 | **Shift open (cash drawer open)** | P1 | POS-SPECIFIC | ❌ MISSING | No shift management |
| 22 | **Shift close (end-of-day reconciliation)** | P1 | POS-SPECIFIC | ❌ MISSING | No shift management |
| 23 | **Cash drawer operations** | P1 | POS-SPECIFIC | ❌ MISSING | No drawer management |
| 24 | **Shift handover** | P2 | POS-SPECIFIC | ❌ MISSING | No handover workflow |

**Registers & Shifts: 1/6 Compliant (17%)**

---

### D. DISCOUNTS & PROMOTIONS (6 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 25 | **Manual line-item discount (%)** | P0 | POS-SPECIFIC | 🟡 PARTIAL | Amount only, no % calculation |
| 26 | **Manual line-item discount (₦)** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `applyDiscount(itemId, discount)` |
| 27 | **Promotion code entry** | P1 | REUSE (SVM) | ❌ MISSING | No promo code input |
| 28 | **Automatic promotions** | P2 | REUSE (SVM) | ❌ MISSING | No auto-apply promotions |
| 29 | **Staff discount authorization** | P2 | POS-SPECIFIC | ❌ MISSING | No approval workflow |
| 30 | **Discount limits/caps** | P2 | POS-SPECIFIC | ❌ MISSING | No max discount enforcement |

**Discounts & Promotions: 1/6 Compliant (17%)**

---

### E. RETURNS & REFUNDS (5 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 31 | **Sale void (before payment)** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `clearCart` function |
| 32 | **Return/refund initiation** | P0 | POS-SPECIFIC | 🟡 PARTIAL | Event handler exists, no UI |
| 33 | **Refund to original payment method** | P1 | REUSE (Payments) | ❌ MISSING | No refund processing |
| 34 | **Cash refund** | P1 | POS-SPECIFIC | ❌ MISSING | No cash refund workflow |
| 35 | **Exchange (return + new sale)** | P2 | POS-SPECIFIC | ❌ MISSING | No exchange workflow |

**Returns & Refunds: 1/5 Compliant (20%)**

---

### F. OFFLINE TOLERANCE (6 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 36 | **Offline sale processing** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `STORAGE_KEYS.PENDING_TRANSACTIONS` |
| 37 | **Offline product cache** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `STORAGE_KEYS.PRODUCTS_CACHE` |
| 38 | **Offline customer lookup** | P1 | POS-SPECIFIC | ❌ MISSING | No customer cache |
| 39 | **Online/offline status indicator** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `isOnline` state, `POSStatusBar` |
| 40 | **Pending transaction count** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `pendingTransactions` counter |
| 41 | **Auto-sync on reconnection** | P0 | POS-SPECIFIC | ✅ COMPLIANT | `syncOfflineTransactions` on online event |

**Offline Tolerance: 5/6 Compliant (83%)**

---

### G. RECONCILIATION & REPORTING (6 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 42 | **X-report (mid-shift summary)** | P1 | POS-SPECIFIC | ❌ MISSING | No reporting |
| 43 | **Z-report (end-of-day summary)** | P0 | POS-SPECIFIC | ❌ MISSING | No reporting |
| 44 | **Sales by staff report** | P1 | POS-SPECIFIC | ❌ MISSING | No reporting |
| 45 | **Sales by payment method** | P1 | POS-SPECIFIC | ❌ MISSING | No reporting |
| 46 | **Cash variance tracking** | P1 | POS-SPECIFIC | ❌ MISSING | No cash reconciliation |
| 47 | **Transaction history view** | P1 | POS-SPECIFIC | ❌ MISSING | No history UI |

**Reconciliation & Reporting: 0/6 Compliant (0%)**

---

### H. RECEIPTS & CUSTOMER COMMUNICATION (5 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 48 | **On-screen receipt display** | P0 | POS-SPECIFIC | 🟡 PARTIAL | Success message only, no itemized receipt |
| 49 | **Print receipt** | P1 | POS-SPECIFIC | ❌ MISSING | No print functionality |
| 50 | **Email receipt** | P2 | REUSE (CRM) | ❌ MISSING | No email integration |
| 51 | **SMS receipt** | P1 | REUSE (CRM) | ❌ MISSING | No SMS integration |
| 52 | **WhatsApp receipt** | P2 | POS-SPECIFIC | ❌ MISSING | No WhatsApp integration |

**Receipts & Communication: 0/5 Compliant (0%)**

---

## 3️⃣ REUSE ANALYSIS

### Reuse from Existing Modules

| Source Module | Capabilities Reused | Reuse Status |
|---------------|---------------------|--------------|
| **Inventory** | Product lookup, stock levels | ✅ Good |
| **Payments** | Payment types, wallet | 🟡 Partial (UI only) |
| **Billing** | Tax calculation | 🟡 Partial (hardcoded) |
| **SVM** | Promotions engine | ❌ Not integrated |
| **CRM** | Customer profiles, receipts | ❌ Not integrated |

### Where Logic Is Duplicated

| Duplication | Location | Issue |
|-------------|----------|-------|
| **Cart calculation** | `POSProvider.tsx` | Should reuse billing calculation service |
| **Tax rate** | `POSProvider.tsx:346` | Hardcoded 8%, should read from tenant config |
| **Demo products** | `POSProvider.tsx:303-324` | Should use centralized demo data service |
| **Session storage** | `POSProvider.tsx:126-141` | Should use platform session service |

### Where Coupling Is Excessive

| Coupling Issue | Impact |
|----------------|--------|
| `POSProvider` handles ALL state | 580+ lines, hard to maintain |
| Payment methods hardcoded in UI | Can't add new methods without code change |
| Location/staff tied to localStorage | Not portable across devices |

### Where Abstractions Are Missing

| Missing Abstraction | Recommendation |
|---------------------|----------------|
| **POS Service Layer** | Create `/lib/pos/` service files |
| **POS Config Service** | Centralize POS settings |
| **Receipt Service** | Abstract receipt generation |
| **Shift Service** | Handle shift management |
| **Report Service** | Handle POS reporting |

---

## 4️⃣ GAP REGISTER

### Critical Gaps (P0 — Must Fix for Compliance)

| Gap ID | Capability | Current State | Fix Required |
|--------|------------|---------------|--------------|
| GAP-POS-001 | Bank transfer payment | Missing | Add transfer confirmation workflow |
| GAP-POS-002 | Z-report (EOD summary) | Missing | Implement shift reporting |
| GAP-POS-003 | Tax configuration | Hardcoded 8% | Use tenant tax settings |
| GAP-POS-004 | Receipt display | Minimal | Show itemized receipt |

### Major Gaps (P1 — Should Fix)

| Gap ID | Capability | Current State | Fix Required |
|--------|------------|---------------|--------------|
| GAP-POS-005 | Shift management | Missing | Implement open/close shift |
| GAP-POS-006 | Cash drawer ops | Missing | Implement drawer tracking |
| GAP-POS-007 | Promotion codes | Missing | Integrate with SVM promotions |
| GAP-POS-008 | Print receipt | Missing | Add print functionality |
| GAP-POS-009 | SMS receipt | Missing | Integrate Termii SMS |
| GAP-POS-010 | Return/refund UI | Missing | Create refund workflow |
| GAP-POS-011 | Transaction history | Missing | Add sales history view |
| GAP-POS-012 | X-report | Missing | Mid-shift summary |
| GAP-POS-013 | Cart-level discount | Missing | Implement order discount |

### Minor Gaps (P2 — Acceptable for Later)

| Gap ID | Capability | Current State | Fix Required |
|--------|------------|---------------|--------------|
| GAP-POS-014 | Split payment | Missing | Multi-method checkout |
| GAP-POS-015 | Discount limits | Missing | Max discount enforcement |
| GAP-POS-016 | Exchange workflow | Missing | Return + new sale |
| GAP-POS-017 | WhatsApp receipt | Missing | WhatsApp integration |
| GAP-POS-018 | Shift handover | Missing | Handover workflow |

---

## 5️⃣ SCHEMA IMPACT ASSESSMENT (PROPOSAL ONLY)

⚠️ **NO SCHEMA CHANGES IMPLEMENTED** — Proposal only for S2+ phases.

### Existing Schema Used

| Table | Usage | Impact |
|-------|-------|--------|
| `Entitlement` | POS module entitlements | ✅ NONE |
| `AuditLog` | POS event logging | ✅ NONE |
| `Customer` | Customer lookup | ✅ NONE |
| `Product` / `SvmProduct` | Product catalog | ✅ NONE |

### Proposed New Tables (Additive Only)

| Table | Purpose | Impact |
|-------|---------|--------|
| `pos_shift` | Track shift open/close | LOW - Additive |
| `pos_register` | Multiple terminal support | LOW - Additive |
| `pos_cash_movement` | Drawer operations | LOW - Additive |
| `pos_sale` | Local sale records | MEDIUM - Core POS data |
| `pos_sale_item` | Line items | MEDIUM - Core POS data |

### Proposed New Enums

| Enum | Values | Impact |
|------|--------|--------|
| `POSPaymentMethod` | CASH, CARD, TRANSFER, MOBILE_MONEY, WALLET, SPLIT | LOW - Additive |
| `POSShiftStatus` | OPEN, CLOSED, RECONCILED | LOW - Additive |
| `POSCashMovementType` | OPEN_FLOAT, SALE, REFUND, PAYOUT, ADJUSTMENT | LOW - Additive |

---

## 6️⃣ NIGERIA-FIRST DESIGN VALIDATION

### Currency Support

| Requirement | Status | Evidence |
|-------------|--------|----------|
| NGN as primary currency | ⚠️ NON-COMPLIANT | UI shows `$` symbols |
| ₦ symbol display | ❌ MISSING | Should use `₦` throughout |
| Nigerian number formatting | ❌ MISSING | Should use `1,234.00` format |

### Payment Methods

| Method | Nigerian Context | Status |
|--------|------------------|--------|
| **Cash** | Primary method (60-70% of retail) | ✅ Implemented |
| **POS Terminal** | Common (card swipe) | 🟡 UI only |
| **Bank Transfer** | Very common, instant verification | ❌ MISSING |
| **USSD** | Common for unbanked | 🟡 UI only |
| **Mobile Money** | Growing (OPay, PalmPay) | 🟡 UI only |

### Informal Receipt Support

| Requirement | Status | Notes |
|-------------|--------|-------|
| SMS receipt | ❌ MISSING | Critical for informal retail |
| WhatsApp share | ❌ MISSING | Popular customer preference |
| No-receipt option | ✅ COMPLIANT | Sale completes without receipt |

### Offline Tolerance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Works during NEPA/power outage | ✅ COMPLIANT | Local storage |
| Works during network outage | ✅ COMPLIANT | Offline queue |
| Auto-sync when restored | ✅ COMPLIANT | Reconnection sync |
| Visual offline indicator | ✅ COMPLIANT | Status bar |

### Mixed Literacy Environment

| Requirement | Status | Notes |
|-------------|--------|-------|
| Visual product selection | ✅ COMPLIANT | Quick product grid |
| Minimal text entry | ✅ COMPLIANT | Tap-to-add |
| Clear icons | ✅ COMPLIANT | Lucide icons |
| Large touch targets | ✅ COMPLIANT | Touch-manipulation class |

---

## 7️⃣ GUARDRAILS (EXPLICIT CONSTRAINTS)

### What POS Suite MUST NOT Do

| Constraint | Rationale |
|------------|-----------|
| ❌ **NO warehouse management** | Use Advanced Warehouse Suite |
| ❌ **NO purchase orders** | Use Procurement Module |
| ❌ **NO vendor management** | Use MVM Suite |
| ❌ **NO online storefront** | Use SVM Suite |
| ❌ **NO table service/hospitality** | Use Hospitality Suite |
| ❌ **NO staff scheduling** | Use HR Module |
| ❌ **NO payroll processing** | Use HR Module |
| ❌ **NO full accounting** | Use Accounting Suite |
| ❌ **NO customer campaigns** | Use CRM Suite |

### What POS Suite MUST NOT Expand Into

| Expansion | Rationale |
|-----------|-----------|
| ❌ **Kitchen display systems** | Hospitality-specific |
| ❌ **Delivery tracking** | Logistics-specific |
| ❌ **Appointment booking** | Service-industry specific |
| ❌ **Membership management** | CRM-specific |
| ❌ **Loyalty points engine** | CRM-specific (can read, not manage) |

### What POS Suite MUST NEVER Absorb From Other Suites

| Capability | Owner Suite |
|------------|-------------|
| Product catalog management | Inventory |
| Customer profile management | CRM |
| Payment gateway integration | Payments Module |
| Promotion rule engine | SVM |
| Tax configuration | Billing/Compliance |
| Staff management | HR |

---

## 8️⃣ COMPLIANCE SUMMARY

### Overall Status

| Domain | Capabilities | Compliant | Partial | Missing | Score |
|--------|-------------|-----------|---------|---------|-------|
| Sales Transactions | 10 | 7 | 2 | 1 | 70% |
| Payment Handling | 8 | 2 | 4 | 2 | 25% |
| Registers & Shifts | 6 | 1 | 1 | 4 | 17% |
| Discounts & Promotions | 6 | 1 | 1 | 4 | 17% |
| Returns & Refunds | 5 | 1 | 1 | 3 | 20% |
| Offline Tolerance | 6 | 5 | 0 | 1 | 83% |
| Reconciliation & Reporting | 6 | 0 | 0 | 6 | 0% |
| Receipts & Communication | 5 | 0 | 1 | 4 | 0% |
| **TOTAL** | **52** | **17** | **10** | **25** | **33%** |

### Compliance Verdict

| Metric | Value |
|--------|-------|
| **Total Capabilities** | 52 |
| **Fully Compliant** | 17 (33%) |
| **Partially Compliant** | 10 (19%) |
| **Missing** | 25 (48%) |
| **Non-Compliant** | 0 (0%) |
| **Overall Compliance** | 🟡 **PARTIAL (33%)** |

### Key Strengths

1. ✅ **Offline-first architecture** — Industry-leading offline support
2. ✅ **Core sales flow** — Product lookup, cart, checkout working
3. ✅ **Nigeria-friendly UI** — Touch-optimized, visual product grid
4. ✅ **Event-driven architecture** — Clean event handling

### Key Weaknesses

1. ❌ **No shift management** — Critical for retail accountability
2. ❌ **No reporting** — Cannot reconcile or audit
3. ❌ **No bank transfer** — Missing key Nigerian payment method
4. ❌ **Wrong currency symbol** — Shows `$` instead of `₦`
5. ❌ **No receipt generation** — Critical for customer communication

---

## 9️⃣ PATH TO COMPLIANCE

### Phase 1: Critical Fixes (P0)

| Task | Effort | Impact |
|------|--------|--------|
| Fix currency to NGN (₦) | Low | High |
| Add bank transfer payment | Medium | High |
| Implement Z-report | Medium | High |
| Use tenant tax config | Low | Medium |
| Itemized receipt display | Medium | High |

### Phase 2: Core Enhancement (P1)

| Task | Effort | Impact |
|------|--------|--------|
| Shift management system | High | High |
| Cash drawer operations | Medium | Medium |
| Promotion code integration | Medium | Medium |
| Print receipt | Medium | High |
| SMS receipt (Termii) | Medium | High |
| Refund workflow | High | High |
| Transaction history | Medium | Medium |

### Phase 3: Polish (P2)

| Task | Effort | Impact |
|------|--------|--------|
| Split payments | High | Low |
| WhatsApp receipt | Medium | Medium |
| Discount limits | Low | Low |
| Exchange workflow | Medium | Low |

---

## 📌 AUTHORIZATION REQUEST

### What This Document Establishes

1. ✅ **Complete audit** of existing POS implementation
2. ✅ **52 capabilities** mapped across 8 domains
3. ✅ **33% compliance** score (partial)
4. ✅ **18 gaps** identified and prioritized
5. ✅ **Nigeria-first validation** completed
6. ✅ **Clear guardrails** defined
7. ✅ **Path to compliance** outlined

### Existing Implementation Files Audited

```
/app/frontend/src/
├── app/
│   ├── api/pos/                    # 6 API route files
│   │   ├── customers/route.ts      # Customer lookup
│   │   ├── entitlements/route.ts   # Feature entitlements
│   │   ├── events/route.ts         # Event processing
│   │   ├── inventory/route.ts      # Stock lookup
│   │   ├── locations/route.ts      # Location management
│   │   └── products/route.ts       # Product lookup
│   └── pos/                        # 2 UI files
│       ├── layout.tsx              # Auth wrapper
│       └── page.tsx                # Main POS screen
├── components/pos/                 # 7 component files
│   ├── index.ts                    # Exports
│   ├── LocationSelect.tsx          # Location picker
│   ├── PaymentScreen.tsx           # Payment UI
│   ├── POSCart.tsx                 # Cart UI
│   ├── POSProvider.tsx             # State management
│   ├── POSStatusBar.tsx            # Status bar
│   └── ProductSearch.tsx           # Search UI
└── lib/
    └── pos-event-handlers.ts       # Event handlers
```

### Request

> **Approve POS & Retail Operations Suite S0–S1 Capability Mapping**

Upon approval:
- S0–S1 will be **LOCKED** for this sub-suite
- Agent will **STOP** and await explicit authorization for S2
- No schema changes, services, APIs, or UI will be implemented until approved

---

## 📎 APPENDIX: IMPLEMENTATION RECOMMENDATIONS

### Recommended Service Structure for S2+

```
/app/frontend/src/lib/pos/
├── config.ts                 # POS configuration service
├── shift-service.ts          # Shift management
├── sale-service.ts           # Sale processing
├── drawer-service.ts         # Cash drawer operations
├── receipt-service.ts        # Receipt generation
├── report-service.ts         # X/Z reports
├── demo-data.ts              # Nigerian demo data
└── index.ts                  # Exports
```

### Recommended API Structure for S3+

```
/app/frontend/src/app/api/pos/
├── shifts/route.ts           # Shift CRUD
├── drawer/route.ts           # Drawer operations
├── sales/route.ts            # Sale records
├── receipts/route.ts         # Receipt generation
├── reports/route.ts          # X/Z reports
└── [existing routes]         # Keep existing
```

### Recommended UI Pages for S4+

```
/app/frontend/src/app/pos/
├── page.tsx                  # Main POS (existing)
├── shifts/page.tsx           # Shift management
├── history/page.tsx          # Transaction history
├── reports/page.tsx          # Reports dashboard
└── settings/page.tsx         # POS settings
```

---

*S0–S1 Capability Mapping Complete. Awaiting explicit approval to proceed to S2.*

**🛑 AGENT WILL STOP HERE AND AWAIT APPROVAL**
