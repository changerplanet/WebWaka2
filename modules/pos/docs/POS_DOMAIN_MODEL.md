# POS Module Domain Model

## Version: pos-v1.0.0
## Status: PHASE 1 COMPLETE

---

## Ownership Matrix

### ✅ POS OWNS (Full Control)

| Model | Description | Why POS Owns |
|-------|-------------|--------------|
| `Sale` | Sales transactions | Core POS functionality |
| `SaleLineItem` | Items in a sale | Part of sale, snapshots product data |
| `SaleDiscount` | Discounts applied | Sale-level business logic |
| `POSPayment` | Payment intents | POS-side payment tracking |
| `Refund` | Return transactions | POS reversal logic |
| `RefundItem` | Items being refunded | Part of refund |
| `Layaway` | Layaway records | POS-specific payment plan |
| `LayawayItem` | Items on layaway | Part of layaway |
| `LayawayPayment` | Layaway payments | Installment tracking |
| `POSRegister` | Register configuration | POS hardware/station |
| `RegisterSession` | Cash drawer sessions | POS cash management |
| `Shift` | Staff shifts | POS scheduling |
| `POSSettings` | Module settings | Tenant POS config |
| `DiscountRule` | Discount definitions | POS promo logic |

### ❌ POS DOES NOT OWN (Reference Only)

| Entity | Owner | How POS References |
|--------|-------|-------------------|
| `Tenant` | SaaS Core | `tenantId: String` (ID only) |
| `User/Staff` | SaaS Core | `staffId: String` (ID only) |
| `Customer` | SaaS Core | `customerId: String` (ID only) |
| `Product` | SaaS Core | `productId: String` (ID only) |
| `ProductVariant` | SaaS Core | `variantId: String` (ID only) |
| `Inventory` | SaaS Core | Events only, no direct access |
| `Payment (processing)` | SaaS Core | `corePaymentId: String` (ID only) |
| `StoreCredit` | SaaS Core | `storeCreditId: String` (ID only) |
| `Wallet` | SaaS Core | Not accessed |
| `Subscription` | SaaS Core | Via `hasModuleAccess()` only |

---

## Foreign Key Usage Rules

### Rule 1: ID-Only References
```prisma
// ✅ CORRECT - Reference by ID only
model Sale {
  customerId    String?     // FK to Core.Customer (optional)
  staffId       String      // FK to Core.User
  // NO @relation to Core models
}

// ❌ WRONG - No Prisma relations to Core
model Sale {
  customer      Customer    @relation(...)  // FORBIDDEN
}
```

### Rule 2: Snapshot Critical Data
```prisma
// ✅ CORRECT - Snapshot product data at sale time
model SaleLineItem {
  productId       String    // Reference for linking
  productName     String    // Snapshot (products can change)
  productSku      String?   // Snapshot
  unitPrice       Decimal   // Price at time of sale
}
```

### Rule 3: Validate at Application Layer
```typescript
// ✅ CORRECT - Validate Core entities exist before use
async function createSale(data: CreateSaleInput) {
  // 1. Validate customer exists in Core
  const customer = await coreClient.customer.findUnique({ 
    where: { id: data.customerId } 
  })
  if (!customer) throw new Error('Customer not found')
  
  // 2. Validate products exist and get current prices
  for (const item of data.items) {
    const product = await coreClient.product.findUnique({
      where: { id: item.productId }
    })
    if (!product) throw new Error(`Product ${item.productId} not found`)
  }
  
  // 3. Create sale with validated data
  return posClient.sale.create({ ... })
}
```

### Rule 4: Emit Events for Cross-Module Sync
```typescript
// ✅ CORRECT - Emit events, don't modify Core directly
async function completeSale(saleId: string) {
  const sale = await posClient.sale.update({
    where: { id: saleId },
    data: { status: 'COMPLETED' }
  })
  
  // Emit event for Core to handle inventory
  await emitEvent('pos.sale.completed', {
    saleId: sale.id,
    tenantId: sale.tenantId,
    items: sale.lineItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  })
  
  // Core will listen and deduct inventory
}
```

---

## Model Details

### Sale (Transaction Header)
```
┌─────────────────────────────────────────────────────────────┐
│ Sale                                                         │
├─────────────────────────────────────────────────────────────┤
│ id              UUID       Primary key                       │
│ tenantId        String     → Core.Tenant (ID only)          │
│ saleNumber      String     Human-readable reference          │
│ status          Enum       DRAFT → COMPLETED lifecycle       │
│ customerId      String?    → Core.Customer (optional)       │
│ staffId         String     → Core.User (cashier)            │
│ subtotal        Decimal    Before discounts/tax              │
│ discountTotal   Decimal    Total discounts applied           │
│ taxTotal        Decimal    Total tax                         │
│ grandTotal      Decimal    Final amount                      │
│ amountPaid      Decimal    Payments received                 │
│ amountDue       Decimal    Remaining balance                 │
│ offlineId       String?    For offline sync                  │
└─────────────────────────────────────────────────────────────┘
```

### SaleLineItem (Products in Sale)
```
┌─────────────────────────────────────────────────────────────┐
│ SaleLineItem                                                 │
├─────────────────────────────────────────────────────────────┤
│ productId       String     → Core.Product (ID only)         │
│ productName     String     SNAPSHOT at sale time            │
│ productSku      String?    SNAPSHOT at sale time            │
│ unitPrice       Decimal    SNAPSHOT at sale time            │
│ quantity        Decimal    Supports fractional              │
│ inventoryDeducted Boolean  Event emitted flag               │
└─────────────────────────────────────────────────────────────┘
```

### POSPayment (Payment Intent)
```
┌─────────────────────────────────────────────────────────────┐
│ POSPayment                                                   │
├─────────────────────────────────────────────────────────────┤
│ method          Enum       CASH, CARD, MOBILE, etc.         │
│ status          Enum       PENDING → COMPLETED              │
│ amount          Decimal    Payment amount                    │
│ corePaymentId   String?    → Core.Payment (if processed)    │
│ cardLastFour    String?    For card payments                │
│ offlineId       String?    For offline sync                  │
└─────────────────────────────────────────────────────────────┘
```

### Layaway (Payment Plan)
```
┌─────────────────────────────────────────────────────────────┐
│ Layaway                                                      │
├─────────────────────────────────────────────────────────────┤
│ customerId      String     → Core.Customer (REQUIRED)       │
│ totalAmount     Decimal    Full price                        │
│ depositAmount   Decimal    Initial payment                   │
│ amountPaid      Decimal    Total paid so far                │
│ nextPaymentDue  DateTime   Next installment date            │
│ finalPaymentDue DateTime   Must complete by                  │
│ status          Enum       ACTIVE → COMPLETED/CANCELLED     │
└─────────────────────────────────────────────────────────────┘
```

---

## Event Contracts

### Events POS Emits

| Event | Payload | Core Action |
|-------|---------|-------------|
| `pos.sale.completed` | `{ saleId, tenantId, items[] }` | Deduct inventory |
| `pos.refund.processed` | `{ refundId, items[] }` | Restore inventory |
| `pos.layaway.created` | `{ layawayId, items[] }` | Reserve inventory |
| `pos.layaway.cancelled` | `{ layawayId }` | Release inventory |
| `pos.payment.received` | `{ paymentId, amount }` | Record revenue |

### Events POS Listens To

| Event | Source | POS Action |
|-------|--------|------------|
| `core.product.updated` | Core | Refresh product cache |
| `core.product.deleted` | Core | Mark items unavailable |
| `core.inventory.low` | Core | Show stock warning |
| `core.customer.updated` | Core | Refresh customer cache |

---

## Verification Checklist

- [x] No `@relation` to Core models
- [x] All Core references use `String` ID fields
- [x] Product data snapshotted in line items
- [x] Customer data not duplicated (ID reference only)
- [x] Inventory changes via events, not direct modification
- [x] Offline support fields (`offlineId`, `syncedAt`)
- [x] Tenant isolation via `tenantId` on all models
- [x] Decimal precision for money fields (12,2)
- [x] Enum statuses for lifecycle management
- [x] Indexes on foreign keys and query fields

---

## 🛑 STOP & VERIFY

**No duplication of Core entities:** ✅
- Products: Referenced by `productId`, data snapshotted
- Customers: Referenced by `customerId`, no duplication
- Staff: Referenced by `staffId`, no duplication
- Inventory: Event-driven, no direct access

**Only references via IDs:** ✅
- All Core entity references are `String` type
- No Prisma `@relation` to Core models
- Validation at application layer

---

## Ready for MODULE 1 · PHASE 2 — POS TRANSACTION ENGINE
