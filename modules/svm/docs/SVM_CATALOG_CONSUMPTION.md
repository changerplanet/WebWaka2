# SVM Product & Inventory Consumption

## Version: svm-v1.0.0
## Phase 2 Complete

---

## Core Principle

```
┌─────────────────┐         ┌─────────────────┐
│   SVM MODULE    │ ──────▶ │   SaaS CORE     │
│   (read-only)   │  read   │  (owns data)    │
└─────────────────┘         └─────────────────┘
        │                           │
        │ events                    │ handles
        ▼                           ▼
  svm.order.placed  ──────▶  Deduct Inventory
```

**SVM NEVER writes to inventory directly.**

All inventory changes happen via events that Core processes.

---

## Read Patterns

### Product Catalog

```typescript
import { SVMProductService } from '@svm/lib/product-consumer'

// Get single product
const product = await productService.getProduct(tenantId, productId)

// Get by URL slug
const product = await productService.getProductBySlug(tenantId, 'blue-widget')

// List with filters
const result = await productService.listProducts(tenantId, {
  categoryId: 'electronics',
  inStock: true,
  sortBy: 'price',
  limit: 24
})

// Search
const result = await productService.searchProducts(tenantId, 'wireless headphones')
```

### Inventory Availability

```typescript
import { SVMInventoryService } from '@svm/lib/inventory-consumer'

// For display (cached)
const display = await inventoryService.getInventoryForDisplay(
  tenantId, productId, variantId
)
// Returns: { available: 5, status: 'LOW_STOCK', canPurchase: true }

// For checkout (never cached - real-time)
const result = await inventoryService.checkCartAvailability(tenantId, [
  { productId: 'prod_1', variantId: 'var_1', quantity: 2 },
  { productId: 'prod_2', quantity: 1 }
])
// Returns: { allAvailable: true/false, unavailableItems: [...] }
```

---

## Caching Strategy

### Product Cache

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Product details | 5 minutes | Changes infrequently |
| Product lists | 1 minute | May include new products |
| Search results | No cache | Always fresh |
| Inventory | 30 seconds | Changes frequently |

### Cache Layers

```
┌─────────────────────────────────────────────────┐
│                   SVM CLIENT                     │
├─────────────────────────────────────────────────┤
│  1. In-Memory Cache (fastest, short TTL)        │
│  2. IndexedDB (offline, longer TTL)             │
│  3. Core API (source of truth)                  │
└─────────────────────────────────────────────────┘
```

### Cache Invalidation

```typescript
// When product updated (via Core webhook)
productCache.invalidateProduct(productId)

// When inventory changes (via Core event)
inventoryService.invalidateCache(productId, variantId)

// Full refresh
productCache.invalidateAll()
```

---

## Offline Behavior

### What Works Offline

| Feature | Behavior |
|---------|----------|
| Browse products | ✅ Shows cached catalog |
| View product details | ✅ From cache |
| Add to cart | ✅ Local cart storage |
| Check inventory | ⚠️ Shows cached (stale) data |
| Complete checkout | ❌ Requires connection |

### Offline Display

```typescript
// Inventory display when offline
{
  available: 5,
  status: 'IN_STOCK',
  canPurchase: true,
  message: 'Cached data (15m old)',
  isStale: true  // UI shows warning
}
```

### Checkout Blocking

```typescript
// Attempting checkout while offline
{
  allAvailable: false,
  error: 'Cannot verify availability while offline. Please connect to complete your order.'
}
```

---

## Failure Handling

### API Errors

| Scenario | Behavior |
|----------|----------|
| Core API down | Return cached data with `isStale: true` |
| No cached data | Return `status: 'UNKNOWN'`, `canPurchase: false` |
| Partial failure | Return available data, mark missing as unknown |

### User-Facing Messages

```typescript
// Stock status messages
'IN_STOCK'     → 'In Stock'
'LOW_STOCK'    → 'Only 3 left'
'OUT_OF_STOCK' → 'Out of Stock'
'BACKORDER'    → 'Available for Backorder'
'UNKNOWN'      → 'Check Availability'
```

### Graceful Degradation

```typescript
// Product list with some failures
const result = await productService.listProducts(tenantId, options)
// If Core fails but cache exists → return cached list
// If no cache → throw error (UI shows error state)
```

---

## Inventory Reservation Flow

### During Checkout

```
Customer starts checkout
         │
         ▼
┌─────────────────────┐
│ Check Availability  │ ← Real-time check, no cache
└─────────────────────┘
         │
         │ All items available
         ▼
┌─────────────────────┐
│ Reserve Inventory   │ ← Core creates temporary hold
└─────────────────────┘
         │
         │ Returns reservationId (expires in 15min)
         ▼
┌─────────────────────┐
│ Complete Payment    │
└─────────────────────┘
         │
         │ Payment success
         ▼
┌─────────────────────┐
│ Emit: order.placed  │ ← SVM emits event
└─────────────────────┘
         │
         ▼
Core deducts inventory (reservation → committed)
```

### Reservation Expiry

```
┌─────────────────────┐
│ Reservation Created │
└─────────────────────┘
         │
         │ 15 minutes pass, no order
         ▼
┌─────────────────────┐
│ Core Auto-Releases  │ ← Inventory available again
└─────────────────────┘
```

### Cart Abandonment

```typescript
// When cart is abandoned or cleared
await inventoryService.releaseReservation(tenantId, reservationId)
```

---

## Integration Points

### Core Service Interface

```typescript
interface CoreCatalogService {
  // Products
  getProduct(tenantId, productId): Promise<Product>
  getProductBySlug(tenantId, slug): Promise<Product>
  listProducts(tenantId, options): Promise<ProductList>
  searchProducts(tenantId, query): Promise<ProductList>
  
  // Inventory
  getInventory(tenantId, productId, variantId?): Promise<InventoryLevel>
  checkAvailability(tenantId, items): Promise<AvailabilityResult[]>
  reserveInventory(tenantId, orderId, items): Promise<ReservationResult>
  releaseReservation(tenantId, reservationId): Promise<{ success: boolean }>
}
```

### Event Flow (SVM → Core)

| SVM Action | Event | Core Handler |
|------------|-------|--------------|
| Order placed | `svm.order.placed` | Convert reservation → committed |
| Order cancelled | `svm.order.cancelled` | Release committed → available |
| Item returned | `svm.return.completed` | Restore to available |

---

## Verification Checklist

- [x] SVM never writes to Product table
- [x] SVM never writes to Inventory table
- [x] Inventory updates via events only
- [x] Real-time availability check at checkout
- [x] Cached data marked as stale when offline
- [x] Graceful fallback when Core unavailable
- [x] Reservation pattern for checkout flow

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/product-consumer.ts` | Product catalog read service |
| `src/lib/inventory-consumer.ts` | Inventory read service |
| `docs/SVM_CATALOG_CONSUMPTION.md` | This document |

---

## Ready for Phase 3 - Ordering Engine
