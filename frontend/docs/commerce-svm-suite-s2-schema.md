# SVM Suite — S2 Schema & Currency Canonicalization

## Document Info
- **Suite**: Single Vendor Marketplace (Commerce Sub-Suite 2 of 8)
- **Phase**: S2 (Schema & Currency Canonicalization)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: COMPLETE
- **Date**: December 2025
- **Author**: E1 Agent
- **Reference**: S0-S1 Capability Map (APPROVED)

---

## 1️⃣ S2 SCOPE (Per Authorization)

| Task | Status |
|------|--------|
| Currency default → NGN | ✅ DONE |
| Monetary formatting helpers (₦, Nigerian separators) | ✅ DONE |
| Tax logic → tenant-configured VAT (7.5%) | ✅ DONE |
| Additive schema changes for above | ✅ DONE |

### Explicitly NOT In S2 Scope
- ❌ No UI changes
- ❌ No new payment gateways
- ❌ No logistics automation

---

## 2️⃣ SCHEMA CHANGES

### A. Currency Default Changes

**File**: `/app/frontend/prisma/schema.prisma`

| Model | Field | Old Default | New Default |
|-------|-------|-------------|-------------|
| `svm_carts` | `currency` | `"USD"` | `"NGN"` |
| `svm_orders` | `currency` | `"USD"` | `"NGN"` |

**Impact**: LOW — Default value change only, existing data unaffected

---

## 3️⃣ NEW SERVICES CREATED

### A. Currency Formatting Service

**File**: `/app/frontend/src/lib/currency.ts`

```typescript
// Core exports:
export const DEFAULT_CURRENCY = 'NGN'
export function formatCurrency(amount, currency = 'NGN'): string
export function formatNGN(amount): string  // Convenience function
export function formatAmount(amount): string  // No symbol
export function getCurrencySymbol(currency): string
export function parseCurrencyString(value): number
export function formatPriceRange(min, max): string
export function formatDiscount(value, type): string
export function formatFreeShippingMessage(threshold, current): string | null
export function formatCompact(amount): string  // "₦1.5M"
```

**Features**:
- Nigeria-first with `₦` as primary symbol
- Full Intl.NumberFormat for proper locale formatting
- Support for NGN, USD, GBP, EUR
- Compact notation for large amounts
- Price range and discount formatters
- Currency parsing for form inputs

### B. Tax Configuration Service

**File**: `/app/frontend/src/lib/tax.ts`

```typescript
// Core exports:
export const NIGERIA_VAT_RATE = 0.075  // 7.5%
export const DEFAULT_TAX_CONFIG = { taxRate: 0.075, taxName: 'VAT', ... }
export async function getTaxConfig(tenantId): Promise<TaxConfig>
export async function calculateTax(tenantId, subtotal): Promise<TaxCalculation>
export function calculateTaxSync(subtotal, rate = 0.075): number
export async function calculateCartTax(tenantId, items): Promise<TaxCalculation>
export function formatTaxRate(rate): string  // "7.5%"
export function getTaxLabel(name, rate): string  // "VAT (7.5%)"
```

**Features**:
- Nigerian VAT (7.5%) as default
- Tenant-configurable tax rates via settings
- In-memory caching with 1-hour TTL
- Tax-exempt categories/products support
- Tax-inclusive price support
- Async and sync calculation methods

---

## 4️⃣ API CHANGES

### A. Cart API Tax Update

**File**: `/app/frontend/src/app/api/svm/cart/route.ts`

**Before**:
```typescript
const taxTotal = (subtotal - discountTotal) * 0.08 // 8% tax
```

**After**:
```typescript
import { NIGERIA_VAT_RATE } from '@/lib/tax'
// ...
function calculateCartTotals(items, discountRate = 0, taxRate = NIGERIA_VAT_RATE) {
  // ...
  const taxTotal = (subtotal - discountTotal) * taxRate // Nigerian VAT 7.5%
}
```

### B. Orders API Currency Update

**File**: `/app/frontend/src/app/api/svm/orders/route.ts`

**Before**:
```typescript
currency = 'USD'
```

**After**:
```typescript
currency = 'NGN'
```

---

## 5️⃣ VERIFICATION

### Tax Rate Verification
| Scenario | Expected | Status |
|----------|----------|--------|
| Default tax rate | 7.5% (0.075) | ✅ |
| ₦10,000 subtotal | ₦750 tax | ✅ |
| ₦100,000 subtotal | ₦7,500 tax | ✅ |

### Currency Formatting Verification
| Input | Expected Output | Status |
|-------|-----------------|--------|
| `formatNGN(1234.56)` | `₦1,234.56` | ✅ |
| `formatNGN(1000000)` | `₦1,000,000.00` | ✅ |
| `formatCompact(1500000)` | `₦1.5M` | ✅ |
| `getCurrencySymbol('NGN')` | `₦` | ✅ |

---

## 6️⃣ FILES CHANGED

| File | Change Type | Lines |
|------|-------------|-------|
| `/app/frontend/prisma/schema.prisma` | MODIFIED | 2 lines |
| `/app/frontend/src/lib/currency.ts` | NEW | 230 lines |
| `/app/frontend/src/lib/tax.ts` | NEW | 235 lines |
| `/app/frontend/src/app/api/svm/cart/route.ts` | MODIFIED | 5 lines |
| `/app/frontend/src/app/api/svm/orders/route.ts` | MODIFIED | 1 line |

---

## 7️⃣ MIGRATION NOTES

### For Existing Data
- Existing carts and orders retain their original currency values
- New carts and orders will default to NGN
- Tax calculations now use 7.5% instead of 8%

### Backward Compatibility
- All currency services accept currency parameter, defaulting to NGN
- USD and other currencies still fully supported
- Tax service falls back to Nigerian defaults if tenant config missing

---

## 8️⃣ GAP RESOLUTION STATUS

| Gap ID | Description | S2 Status |
|--------|-------------|-----------|
| GAP-SVM-001 | Currency shows `$` USD | ✅ Backend ready (UI in S5) |
| GAP-SVM-002 | No locale formatting | ✅ RESOLVED |
| GAP-SVM-003 | Hardcoded 8% tax | ✅ RESOLVED |
| GAP-SVM-004 | Default currency USD | ✅ RESOLVED |

---

## 📌 S2 COMPLETE — AWAITING S3 AUTHORIZATION

### What S2 Achieved
1. ✅ Schema currency defaults changed to NGN
2. ✅ Currency formatting service created (`/lib/currency.ts`)
3. ✅ Tax configuration service created (`/lib/tax.ts`)
4. ✅ Cart API updated to use Nigerian VAT (7.5%)
5. ✅ Orders API updated to default to NGN
6. ✅ Prisma client regenerated

### What Remains for S3+
- S3: Core services for Nigerian shipping zones, payment method expansion
- S4: API layer for POD, local pickup, bank transfer confirmation
- S5: UI updates to use formatNGN() throughout components
- S6: Verification and freeze

---

**🛑 AGENT WILL STOP HERE AND AWAIT S3 APPROVAL**
