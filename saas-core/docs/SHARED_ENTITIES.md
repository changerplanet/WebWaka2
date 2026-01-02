# SaaS Core - Shared Business Entities

## Overview

These entities are **owned by SaaS Core** and **used by all modules** (POS, SVM, MVM). Modules reference these via ID only and do NOT mutate them directly. All mutations happen through Core APIs or Core event handlers.

---

## Entity Ownership Summary

| Entity | Core Owns | Modules Use | Notes |
|--------|-----------|-------------|-------|
| BusinessProfile | ✅ | Read | Tenant business details |
| Location | ✅ | Read | Branches, warehouses |
| ProductCategory | ✅ | Read | Product categorization |
| Product | ✅ | Read | Master catalog |
| ProductVariant | ✅ | Read | Size, color variations |
| InventoryLevel | ✅ | Read | Stock per location |
| Customer | ✅ | Read | Customer data |
| CustomerAddress | ✅ | Read | Shipping/billing addresses |
| StaffMember | ✅ | Read | Employees |
| Supplier | ✅ | Read | Vendor relationships |
| Wallet | ✅ | Via Events | Store credit, gift cards |
| WalletTransaction | ✅ | Via Events | Immutable ledger |
| TaxRule | ✅ | Read | Tax configuration |
| TaxRate | ✅ | Read | Category-specific rates |
| PricingRule | ✅ | Read | Dynamic pricing |
| Notification | ✅ | Via Events | Communication |
| NotificationPreference | ✅ | Read | User preferences |

---

## Module Integration Rules

### Products & Inventory

```
┌─────────────────────────────────────────┐
│              SaaS Core                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Product │  │ Variant │  │Inventory│  │
│  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────┘
        │              │            │
        ▼              ▼            ▼
   ┌─────────┐   ┌─────────┐  ┌─────────┐
   │   POS   │   │   SVM   │  │   MVM   │
   │ (read)  │   │ (read)  │  │ (read)  │
   └─────────┘   └─────────┘  └─────────┘
```

**Modules:**
- Read product catalog via Core APIs
- Reference by `productId` only
- Do NOT create/update/delete products
- Inventory changes via events only

### Customer Data

```
┌─────────────────────────────────────────┐
│              SaaS Core                  │
│  ┌─────────┐  ┌─────────────────────┐  │
│  │Customer │  │  CustomerAddress    │  │
│  └─────────┘  └─────────────────────┘  │
└─────────────────────────────────────────┘
        │                    │
        ▼                    ▼
   ┌─────────────────────────────────┐
   │     All Modules (read-only)    │
   │  - POS: customerId on Sale     │
   │  - SVM: customerId on Order    │
   │  - MVM: No customer ownership  │
   └─────────────────────────────────┘
```

### Wallet Operations

```
┌─────────────────────────────────────────┐
│              SaaS Core                  │
│  ┌─────────┐  ┌─────────────────────┐  │
│  │ Wallet  │──│ WalletTransaction   │  │
│  └─────────┘  └─────────────────────┘  │
└─────────────────────────────────────────┘
        ▲                    ▲
        │   Events only      │
   ┌─────────────────────────────────┐
   │     Modules emit events:       │
   │  - pos.sale.completed          │
   │  - svm.order.refunded          │
   │  Core handles balance updates  │
   └─────────────────────────────────┘
```

---

## Entity Details

### BusinessProfile

Extended business details for a tenant.

```prisma
model BusinessProfile {
  tenantId          String    @unique
  legalName         String?
  tradingName       String?
  taxId             String?
  businessType      String?
  timezone          String    @default("UTC")
  currency          String    @default("USD")
  // ... address fields
}
```

**Used by:** All modules for display, tax calculations, localization

### Location

Physical or virtual business locations.

```prisma
model Location {
  tenantId          String
  name              String    // "Main Store"
  type              String    // STORE, WAREHOUSE, OFFICE
  status            LocationStatus
  isDefaultLocation Boolean
  // ... address, operating hours
}
```

**Used by:**
- POS: Staff assignment, inventory location
- SVM: Pickup locations, shipping origin
- MVM: Vendor fulfillment locations (via mapping)

### Product / ProductVariant

Master product catalog.

```prisma
model Product {
  tenantId          String
  name              String
  sku               String?
  price             Decimal
  trackInventory    Boolean   @default(true)
  status            ProductStatus
  // ... variants, categories, media
}
```

**Used by:**
- POS: Add to sale by SKU/barcode
- SVM: Display in storefront
- MVM: Vendor product mapping

### InventoryLevel

Single source of truth for stock.

```prisma
model InventoryLevel {
  productId         String
  variantId         String?
  locationId        String
  quantityOnHand    Int
  quantityReserved  Int
  quantityAvailable Int       // Computed
}
```

**Mutation rules:**
- ONLY Core mutates inventory
- Modules emit events: `pos.sale.completed`, `svm.order.placed`
- Core event handlers reserve/release stock

### Customer

Unified customer data.

```prisma
model Customer {
  tenantId          String
  email             String?
  phone             String?
  firstName         String?
  lastName          String?
  totalOrders       Int       @default(0)
  totalSpent        Decimal
  loyaltyPoints     Int       @default(0)
}
```

**Used by:** All modules for customer identification and history

### Wallet / WalletTransaction

Store credit, gift cards, loyalty points.

```prisma
model Wallet {
  tenantId          String
  customerId        String?
  type              WalletType // STORE_CREDIT, GIFT_CARD, etc.
  balance           Decimal
  status            WalletStatus
}

model WalletTransaction {
  walletId          String
  type              WalletTransactionType
  amount            Decimal
  balanceAfter      Decimal
  sourceModule      String?   // Which module triggered this
  idempotencyKey    String?   @unique
}
```

**Mutation rules:**
- Modules emit payment events
- Core processes events and creates transactions
- Idempotency prevents duplicate transactions

### TaxRule / TaxRate

Tax configuration per jurisdiction.

```prisma
model TaxRule {
  tenantId          String
  country           String
  state             String?
  rate              Decimal   // 0.0825 for 8.25%
  appliesToShipping Boolean
}
```

**Used by:** All modules for tax calculation

### PricingRule

Dynamic pricing rules.

```prisma
model PricingRule {
  tenantId          String
  type              PricingRuleType // PERCENTAGE_DISCOUNT, etc.
  scope             PricingRuleScope // ALL_PRODUCTS, CATEGORY, etc.
  value             Decimal
  startsAt          DateTime?
  endsAt            DateTime?
}
```

**Used by:** All modules for price calculation

### Notification / NotificationPreference

System communications.

```prisma
model Notification {
  tenantId          String?
  userId            String?
  channel           NotificationChannel // IN_APP, EMAIL, SMS, PUSH
  status            NotificationStatus
  sourceModule      String?   // Which module triggered
}
```

**Mutation rules:**
- Modules emit events
- Core creates notifications
- Respects user preferences

---

## Event-Driven Updates

Modules do NOT directly mutate shared entities. Instead:

1. **Module emits event** (e.g., `pos.sale.completed`)
2. **Core event handler processes** (e.g., `handlePOSSaleCompleted`)
3. **Core updates entities** (e.g., reserves inventory, creates wallet transaction)

Example flow:

```typescript
// POS Module (sale-engine.ts)
emit('pos.sale.completed', {
  saleId: 'sale_123',
  items: [...],
  paymentMethod: 'STORE_CREDIT',
  walletId: 'wallet_456',
  amount: 50.00
})

// Core Event Handler (pos-event-handlers.ts)
async function handlePOSSaleCompleted(event) {
  // Debit wallet
  await prisma.walletTransaction.create({
    data: {
      walletId: event.walletId,
      type: 'DEBIT',
      amount: event.amount,
      sourceModule: 'POS',
      sourceId: event.saleId,
      idempotencyKey: `pos_sale_${event.saleId}`
    }
  })
  
  // Update inventory
  for (const item of event.items) {
    await prisma.inventoryLevel.update({
      where: { productId_locationId: {...} },
      data: { quantityOnHand: { decrement: item.quantity } }
    })
  }
}
```

---

## Module Isolation Enforcement

✅ Modules reference Core entities by ID only
✅ Modules do NOT import Core Prisma client directly
✅ Modules do NOT define duplicate models
✅ All mutations via Core event handlers
✅ Idempotency keys prevent duplicate operations
