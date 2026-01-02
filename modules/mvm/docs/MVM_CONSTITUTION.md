# MVM Module Constitution

## Multi Vendor Marketplace — Module Definition

### Module Identity

| Property | Value |
|----------|-------|
| Name | Multi Vendor Marketplace |
| Code | MVM |
| Version | `mvm-v1.0.0` |
| Type | Extension Module |
| Extends | Single Vendor Marketplace (SVM) |
| Status | IN DEVELOPMENT |

---

## How MVM Extends SVM

The Multi Vendor Marketplace (MVM) module **extends** the Single Vendor Marketplace (SVM) module to support multiple vendors selling through a single storefront.

### Extension Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      SaaS Core                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Products │ │Inventory │ │Customers │ │ Payments │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Single Vendor Marketplace (SVM)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Storefront│ │  Orders  │ │ Shipping │ │Promotions│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ EXTENDS
┌─────────────────────────────────────────────────────────────┐
│              Multi Vendor Marketplace (MVM)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Vendors  │ │  Order   │ │Commission│ │  Vendor  │       │
│  │          │ │ Splitting│ │  Rules   │ │Dashboard │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### What MVM Adds to SVM

| SVM Capability | MVM Extension |
|----------------|---------------|
| Single merchant orders | Multi-vendor order splitting |
| Direct fulfillment | Vendor-specific fulfillment |
| Single payout destination | Per-vendor commission & payout tracking |
| Merchant dashboard | Vendor dashboards with isolation |
| Flat shipping | Vendor-specific shipping options |

### Key Integration Points

1. **Order Flow**: MVM intercepts SVM orders to split by vendor
2. **Product Display**: MVM adds vendor attribution to SVM product views
3. **Checkout**: MVM calculates per-vendor shipping and totals
4. **Fulfillment**: MVM tracks per-vendor fulfillment status

---

## Module Ownership

### MVM OWNS (8 domains)

| Domain | Models | Description |
|--------|--------|-------------|
| **Vendors** | `Vendor` | Vendor profiles and status |
| **Vendor Staff** | `VendorStaff` | Vendor team members |
| **Product Mapping** | `VendorProductMapping` | Vendor-to-product assignments |
| **Commission Rules** | `VendorCommissionRule` | Platform commission configuration |
| **Order Splitting** | `VendorSubOrder`, `VendorSubOrderItem` | Per-vendor order breakdown |
| **Payout Records** | `VendorPayoutRecord` | Payout tracking (no money movement) |
| **Vendor Tiers** | `VendorTier` | Vendor classification system |
| **Vendor Dashboard** | Data contracts | Vendor-specific analytics |

### MVM DOES NOT OWN (Uses from SVM/Core)

| Domain | Owner | MVM Access |
|--------|-------|------------|
| **Storefront UI** | SVM | Uses as-is, adds vendor attribution |
| **Order Creation** | SVM | Intercepts post-creation for splitting |
| **Shipping Rules** | SVM | Uses SVM shipping, may add vendor overrides |
| **Promotions** | SVM | Uses SVM promotions as-is |
| **Reviews** | SVM | Uses SVM reviews, filters by vendor |
| **Products** | Core | Read-only via mapping |
| **Inventory** | Core | Read-only, no mutations |
| **Customers** | Core | Read-only reference by ID |
| **Payments** | Core | Event-driven, no capture logic |
| **Wallets** | Core | No direct access |
| **Billing** | Core | No access whatsoever |

---

## Non-Negotiable Rules

### ✅ MVM MUST

1. Be independently subscribable
2. Extend SVM behavior without duplicating it
3. Reference Core entities by ID only
4. Use event-driven communication with Core
5. Maintain strict vendor data isolation
6. Prefix all database tables with `mvm_`
7. Prefix all events with `mvm.`

### ❌ MVM MUST NOT

1. **Duplicate storefront logic** — Use SVM storefront
2. **Duplicate order creation** — Extend SVM orders
3. **Execute payments** — Core handles all payment capture
4. **Move money** — Only calculate commissions
5. **Modify Core schemas** — No changes to Core Prisma
6. **Modify SVM schemas** — No changes to SVM Prisma
7. **Contain billing logic** — No subscription/plan awareness
8. **Treat vendors as tenants** — Vendors are a different entity type
9. **Own customers** — Customers belong to Core/Tenant

---

## Vendor vs Tenant Distinction

| Aspect | Tenant | Vendor |
|--------|--------|--------|
| Definition | Platform subscriber | Seller on tenant's marketplace |
| Owns products | Yes (in Core) | No (maps to tenant products) |
| Owns customers | Yes (in Core) | No |
| Receives payments | Yes (via Core) | Yes (via tenant payout) |
| Has staff | Yes (via Core) | Yes (via MVM VendorStaff) |
| Database scope | Separate schema | Within tenant's MVM tables |
| Subscription | Has SaaS subscription | No subscription (agreement with tenant) |

---

## Database Tables (MVM-owned)

All tables prefixed with `mvm_`:

| Table | Purpose |
|-------|---------|
| `mvm_vendors` | Vendor profiles |
| `mvm_vendor_staff` | Vendor team members |
| `mvm_vendor_tiers` | Vendor classification |
| `mvm_vendor_product_mappings` | Product assignments |
| `mvm_vendor_commission_rules` | Commission configuration |
| `mvm_vendor_sub_orders` | Split orders per vendor |
| `mvm_vendor_sub_order_items` | Line items per vendor order |
| `mvm_vendor_payout_records` | Payout tracking |
| `mvm_vendor_settings` | Vendor-specific settings |

---

## Event Scoping

All MVM events prefixed with `mvm.`:

| Category | Events |
|----------|--------|
| Vendor Lifecycle | `mvm.vendor.created`, `mvm.vendor.approved`, `mvm.vendor.suspended` |
| Vendor Onboarding | `mvm.vendor.onboarding_started`, `mvm.vendor.onboarding_completed` |
| Order Processing | `mvm.order.split`, `mvm.suborder.created`, `mvm.suborder.fulfilled` |
| Commissions | `mvm.commission.calculated`, `mvm.commission.adjusted` |
| Payouts | `mvm.payout.scheduled`, `mvm.payout.ready` |

---

## Verification Checklist

### Module Constitution Verified

- [x] Module is independently subscribable
- [x] Module extends SVM (not duplicates)
- [x] No storefront duplication
- [x] No order creation duplication
- [x] No payment execution logic
- [x] No Core schema modifications
- [x] No SVM schema modifications
- [x] Vendors are not tenants
- [x] Vendors do not own customers
- [x] All tables prefixed with `mvm_`
- [x] All events prefixed with `mvm.`

---

## Dependencies

```json
{
  "requires": {
    "saas-core": ">=1.0.0",
    "svm": ">=1.0.0"
  },
  "extends": "svm",
  "conflicts": []
}
```

---

## File Structure

```
/app/modules/mvm/
├── prisma/
│   └── schema.prisma          # MVM-owned models
├── src/
│   ├── app/
│   │   └── api/               # MVM API routes
│   ├── lib/
│   │   ├── vendor-engine.ts   # Vendor management
│   │   ├── order-splitter.ts  # Order splitting logic
│   │   ├── commission-engine.ts # Commission calculation
│   │   ├── event-bus.ts       # MVM events
│   │   ├── entitlements.ts    # MVM entitlements
│   │   └── index.ts           # Public exports
│   └── components/
│       └── vendor-dashboard/  # Vendor UI components
├── docs/
│   ├── MVM_CONSTITUTION.md    # This document
│   ├── MVM_DOMAIN_MODEL.md
│   ├── MVM_ORDER_SPLITTING.md
│   └── ...
└── package.json
```

---

**Module Constitution Status: ✅ VERIFIED**

Proceed to Phase 1: Vendor Domain Model
