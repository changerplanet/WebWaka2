# Multi-Vendor Marketplace (MVM) Suite — S2 Schema & Currency Canonicalization

## Document Info
- **Suite**: Multi-Vendor Marketplace (Commerce Sub-Suite 3 of 8)
- **Phase**: S2 (Schema & Currency Canonicalization)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: December 2025
- **Author**: E1 Agent
- **Reference**: SVM Suite S2 (Pattern Reference)

---

## 1️⃣ SCHEMA CHANGES

### New Database Models (10 Tables)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `mvm_vendor` | Core vendor/seller entity | name, email, status, tierId, commissionOverride, bankDetails |
| `mvm_vendor_tier` | Performance-based commission tiers | commissionRate, minMonthlySales, minRating, benefits |
| `mvm_vendor_staff` | Staff members per vendor | email, role, permissions |
| `mvm_product_mapping` | Maps Core products to vendors | vendorPrice, allocatedStock, commissionOverride |
| `mvm_parent_order` | Customer's original order | orderNumber, grandTotal, paymentStatus |
| `mvm_parent_order_item` | Line items with vendor attribution | vendorId, productId, lineTotal |
| `mvm_sub_order` | Vendor-specific order portion | subOrderNumber, commissionAmount, vendorPayout |
| `mvm_sub_order_item` | Vendor sub-order line items | quantity, unitPrice, fulfilledQuantity |
| `mvm_commission` | Commission tracking per sub-order | saleAmount, vatAmount, commissionRate, status |
| `mvm_payout` | Batch payouts to vendors | payoutNumber, netAmount, status, bankDetails |
| `mvm_marketplace_config` | Tenant-level marketplace settings | defaultCommissionRate, vatRate, payoutCycleDays |

### New Enums (6)

| Enum | Values |
|------|--------|
| `MvmVendorStatus` | PENDING_APPROVAL, APPROVED, SUSPENDED, REJECTED, CHURNED |
| `MvmOnboardingStep` | REGISTERED, PROFILE_COMPLETED, BANK_INFO_ADDED, PRODUCTS_ADDED, AGREEMENT_SIGNED, COMPLETED |
| `MvmVendorStaffRole` | OWNER, MANAGER, STAFF, VIEWER |
| `MvmSubOrderStatus` | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `MvmCommissionStatus` | PENDING, PROCESSING, CLEARED, PAID, DISPUTED, REVERSED |
| `MvmPayoutStatus` | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED |
| `MvmPayoutMethod` | BANK_TRANSFER, MOBILE_MONEY, WALLET |

---

## 2️⃣ NIGERIA-FIRST CURRENCY RULES

### All NGN Defaults

Every monetary field defaults to Nigerian Naira:

```prisma
currency String @default("NGN")
```

### Tables with NGN Defaults

| Table | Currency Fields |
|-------|-----------------|
| `mvm_parent_order` | currency, subtotal, grandTotal, shippingTotal, taxTotal |
| `mvm_sub_order` | currency, subtotal, grandTotal, commissionAmount, vendorPayout |
| `mvm_commission` | saleAmount, vatAmount, commissionAmount, vendorPayout |
| `mvm_payout` | currency, grossAmount, deductions, netAmount |
| `mvm_marketplace_config` | minPayoutAmount (default ₦5,000) |

### VAT Configuration

Nigerian VAT (7.5%) is the default:

```prisma
vatRate Decimal @default(7.50) @db.Decimal(5, 2)  // 7.5% Nigerian VAT
```

---

## 3️⃣ KEY SCHEMA DESIGN DECISIONS

### 1. Vendor Isolation

Vendors are **NOT tenants**. They operate within a tenant's marketplace:

```
Tenant
  └── Marketplace (mvm_marketplace_config)
       └── Vendors (mvm_vendor)
            └── Product Mappings (mvm_product_mapping)
            └── Sub-Orders (mvm_sub_order)
            └── Commissions (mvm_commission)
            └── Payouts (mvm_payout)
```

### 2. Order Split Architecture

Parent Order → Sub-Orders pattern:

```
Customer Order (mvm_parent_order)
    │
    ├── mvm_parent_order_item (vendorId=A, product=Phone)
    ├── mvm_parent_order_item (vendorId=B, product=Case)
    └── mvm_parent_order_item (vendorId=A, product=Charger)
         │
         ▼ SPLIT
    ┌────────────────────┬────────────────────┐
    │                    │                    │
    ▼                    ▼                    
mvm_sub_order       mvm_sub_order
(vendorId=A)        (vendorId=B)
  - Phone             - Case
  - Charger
```

### 3. Commission Flow

```
Sale Amount (₦10,000)
    │
    ├─ VAT 7.5% (₦750) → Platform Tax Liability
    │
    └─ Net Amount (₦9,250)
        │
        ├─ Commission 15% (₦1,387.50) → Platform Revenue
        │
        └─ Vendor Payout (₦7,862.50) → mvm_commission.vendorPayout
                                         → Clears after delivery
                                         → Paid in mvm_payout batch
```

### 4. Tier-Based Commission

Vendors graduate through tiers based on performance:

| Tier | Commission | Min Monthly Sales | Min Rating |
|------|------------|-------------------|------------|
| Bronze (Default) | 15% | ₦0 | N/A |
| Silver | 12% | ₦500,000 | 4.0 |
| Gold | 10% | ₦2,000,000 | 4.5 |
| Platinum | 8% | ₦10,000,000 | 4.8 |

### 5. Payout Configuration

Nigerian settlement patterns:

| Setting | Default | Notes |
|---------|---------|-------|
| Payout Cycle | 14 days | Bi-weekly payouts |
| Minimum Payout | ₦5,000 | Prevents micro-transactions |
| Clearance Days | 7 | After delivery confirmation |
| Payment Methods | Bank Transfer, Mobile Money, Wallet | Nigerian rails |

---

## 4️⃣ SCHEMA VALIDATION

### Prisma Generate Status

```bash
✔ Generated Prisma Client (v5.22.0) in 1.79s
```

**Schema is valid and compiles successfully.**

### Index Strategy

All tables have indexes on:
- `tenantId` — For tenant isolation
- `platformInstanceId` — For platform instance scoping (where applicable)
- Status fields — For efficient filtering
- Foreign keys — For join performance
- Date fields — For temporal queries

### Unique Constraints

| Constraint | Purpose |
|------------|---------|
| `[tenantId, slug]` on mvm_vendor | Unique vendor slugs per tenant |
| `[tenantId, email]` on mvm_vendor | Unique vendor emails per tenant |
| `[tenantId, code]` on mvm_vendor_tier | Unique tier codes per tenant |
| `[vendorId, email]` on mvm_vendor_staff | Unique staff emails per vendor |
| `[vendorId, productId, variantId]` on mvm_product_mapping | Unique product mappings |
| `orderNumber` on mvm_parent_order | Globally unique order numbers |
| `subOrderNumber` on mvm_sub_order | Globally unique sub-order numbers |
| `payoutNumber` on mvm_payout | Globally unique payout references |
| `subOrderId` on mvm_commission | One commission per sub-order |

---

## 5️⃣ MIGRATION STRATEGY

### Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Schema size | LOW | 10 new tables, ~150 new columns |
| Breaking changes | NONE | All additive, no existing table modifications |
| Data migration | NONE | New tables start empty |
| Index overhead | LOW | Selective indexes on query patterns |

### Migration Command (When Approved)

```bash
cd /app/frontend
npx prisma migrate dev --name add_mvm_suite_schema
```

**Note**: Migration NOT executed yet. Awaiting S2 approval.

---

## 6️⃣ RELATION MAP

```
mvm_marketplace_config (1)
         │
         │ tenantId
         │
         ▼
   mvm_vendor (N)
         │
    ┌────┴────┬────────────┬────────────┬────────────┐
    │         │            │            │            │
    ▼         ▼            ▼            ▼            ▼
mvm_vendor  mvm_product  mvm_sub    mvm_        mvm_
_tier       _mapping     _order     commission  payout
    │                        │            │
    │                        │            │
    │                   mvm_sub_      (linked via
    │                   order_item    payoutId)
    │
    │
    └── mvm_vendor_staff

mvm_parent_order
    │
    ├── mvm_parent_order_item
    │
    └── mvm_sub_order (split by vendorId)
```

---

## 7️⃣ REUSE FROM EXISTING MODULES

### Currency Utilities (Already Exists)

Located at `/app/frontend/src/lib/currency.ts`:

- `formatNGN()` — Format as ₦1,234.56
- `formatCurrency()` — Multi-currency support
- `parseCurrencyString()` — Parse back to number
- `formatCompact()` — ₦1.5M for large amounts

### Tax Utilities (Already Exists)

Located at `/app/frontend/src/lib/tax.ts`:

- `calculateVAT()` — 7.5% Nigerian VAT
- `getTaxConfig()` — Tenant tax configuration

### These utilities will be reused by MVM services in S3.

---

## 8️⃣ WHAT'S NEXT (S3 Preview)

Upon S2 approval, the following services will be implemented:

| Service | Responsibility |
|---------|---------------|
| `VendorService` | Vendor CRUD, status transitions, onboarding |
| `VendorTierService` | Tier CRUD, automatic tier assignment |
| `ProductMappingService` | Map/unmap products, pricing validation |
| `OrderSplitService` | Split parent orders into vendor sub-orders |
| `CommissionService` | Calculate, track, clear commissions |
| `PayoutService` | Batch payouts, bank transfer integration |

---

## 9️⃣ APPROVAL CHECKLIST

- [x] Schema compiles without errors
- [x] All tables use `mvm_` prefix
- [x] All monetary fields default to NGN
- [x] VAT rate defaults to 7.5%
- [x] Proper tenant scoping (`tenantId` on all tables)
- [x] Proper indexing for query performance
- [x] No breaking changes to existing schema
- [x] Commission and payout workflow modeled
- [x] Vendor isolation enforced (not tenants)
- [x] Nigerian bank details fields included

---

## 🔟 CONCLUSION

S2 delivers a **production-ready schema** for the Multi-Vendor Marketplace suite, following the canonical patterns established by POS and SVM.

Key achievements:
- **10 new tables** covering complete MVM functionality
- **7 new enums** for type safety
- **100% NGN currency defaults**
- **7.5% VAT built-in**
- **Nigerian settlement patterns** (bi-weekly payouts, ₦5,000 minimum)
- **Zero breaking changes**

**Recommendation**: Approve S2 and proceed to S3 (Core Services).

---

**Submitted for Approval**: December 2025
**Author**: E1 Agent
**Program**: PC-SCP

---

### APPROVAL SECTION

- [ ] S2 Schema Approved
- [ ] Proceed to S3 (Core Services)

**User Approval Date**: ___________
**Approved By**: ___________
