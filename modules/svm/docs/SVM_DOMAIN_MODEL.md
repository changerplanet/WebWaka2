# SVM Domain Model

## Version: svm-v1.0.0
## Phase 1 Complete

---

## Model Ownership

### ✅ SVM OWNS (Defined in Schema)

| Model | Purpose | Core References |
|-------|---------|-----------------|
| **OnlineOrder** | Customer purchase record | `tenantId`, `customerId`, `corePaymentId` |
| **OnlineOrderItem** | Line items in order | `productId`, `variantId` |
| **OrderStatusHistory** | Order status tracking | - |
| **ShippingZone** | Geographic shipping regions | `tenantId` |
| **ShippingRate** | Shipping costs per zone | - |
| **Promotion** | Coupons & discounts | `tenantId`, `productIds[]`, `customerIds[]` |
| **PromotionUsage** | Tracks promo redemptions | `customerId` |
| **Review** | Product reviews | `tenantId`, `productId`, `customerId`, `orderId` |
| **StorefrontPage** | CMS pages | `tenantId` |
| **StorefrontBanner** | Promotional banners | `tenantId` |
| **StorefrontSettings** | Store configuration | `tenantId` |
| **Cart** | Shopping cart | `tenantId`, `customerId` |
| **CartItem** | Cart line items | `productId`, `variantId` |
| **Wishlist** | Customer wishlists | `tenantId`, `customerId` |
| **WishlistItem** | Wishlist items | `productId`, `variantId` |

---

### ❌ SVM DOES NOT OWN (References Only)

| Entity | Owner | SVM Field | Usage |
|--------|-------|-----------|-------|
| Tenant | Core | `tenantId: String` | Multi-tenancy isolation |
| Customer | Core | `customerId: String` | Order ownership |
| Product | Core | `productId: String` | Line item reference |
| ProductVariant | Core | `variantId: String` | Specific SKU |
| Payment | Core | `corePaymentId: String` | Payment processing link |
| Inventory | Core | (none) | Read via events |
| User/Staff | Core | `changedBy: String` | Audit trail |

---

## Model Details

### OnlineOrder

```
Purpose: Records a customer's online purchase
Lifecycle: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED

Key Fields:
- orderNumber: Human-readable identifier (S-20260101-0001)
- customerId: Links to Core Customer (null for guest checkout)
- guestEmail/guestPhone: For guest orders
- status: Current order state
- corePaymentId: Links to Core payment record
- shippingAddress: Delivery destination
- trackingNumber: Carrier tracking
```

### OnlineOrderItem

```
Purpose: Individual products in an order
Key Fields:
- productId/variantId: Core product references
- productName/productSku: SNAPSHOT at order time (prices change)
- quantity: Units ordered
- unitPrice/lineTotal: Pricing at order time
- fulfilledQty: Items shipped
```

### ShippingZone + ShippingRate

```
Purpose: Define where and how much shipping costs
Key Fields:
- countries/states/postalCodes: Geographic scope
- rateType: FLAT, WEIGHT_BASED, PRICE_BASED
- freeAbove: Free shipping threshold
- minDays/maxDays: Delivery estimate
```

### Promotion

```
Purpose: Discount codes and automatic promotions
Types: COUPON (requires code), AUTOMATIC, FLASH_SALE
Discount Types: PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BUY_X_GET_Y
Key Fields:
- code: Coupon code (null for automatic)
- discountValue: Amount or percentage
- minOrderTotal: Minimum spend requirement
- productIds[]: Restrict to specific products
- usageLimit/perCustomerLimit: Prevent abuse
```

### Review

```
Purpose: Customer product reviews
Key Fields:
- rating: 1-5 stars
- verifiedPurchase: Linked to order
- status: PENDING → APPROVED/REJECTED
- storeReply: Seller response
- helpfulCount: Community voting
```

### StorefrontPage / StorefrontBanner / StorefrontSettings

```
Purpose: CMS and store customization
Key Fields:
- Pages: slug, content (JSON blocks), SEO fields
- Banners: imageUrl, placement, scheduling
- Settings: store info, social links, checkout options
```

### Cart / Wishlist

```
Purpose: Shopping state persistence
Key Fields:
- customerId OR sessionId: Owner identity
- promotionCode: Applied discount
- expiresAt: Cleanup expired carts
```

---

## Reference Pattern

All Core references follow this pattern:

```prisma
model SomeModel {
  // Core references - ID ONLY, no @relation
  tenantId    String   // Links to Core Tenant
  customerId  String?  // Links to Core Customer
  productId   String   // Links to Core Product
  
  // NO @relation decorators to Core models
  // NO tenant Tenant @relation(...)
}
```

---

## Event Flow (SVM → Core)

```
SVM Action              →  Event Emitted           →  Core Handler
─────────────────────────────────────────────────────────────────
Order placed            →  svm.order.placed        →  Deduct inventory
Order cancelled         →  svm.order.cancelled     →  Restore inventory
Payment requested       →  svm.payment.requested   →  Process payment
Refund requested        →  svm.refund.requested    →  Process refund
Review submitted        →  svm.review.submitted    →  (notification)
```

---

## Indexes

All models include appropriate indexes for:
- `tenantId` - Multi-tenant queries
- `customerId` - Customer-specific queries
- `productId` - Product-related queries
- `status` - Status filtering
- `createdAt` - Date range queries

---

## Verification Checklist

- [x] No Core entities redefined (Product, Customer, etc.)
- [x] All shared entities referenced by ID only
- [x] No `@relation` to Core models
- [x] Tenant isolation via `tenantId` on all models
- [x] Proper indexes for common queries
- [x] Status enums for order lifecycle
- [x] Snapshot fields for price/name at order time

---

## Table Names (PostgreSQL)

All SVM tables prefixed with `svm_`:
- `svm_online_orders`
- `svm_online_order_items`
- `svm_order_status_history`
- `svm_shipping_zones`
- `svm_shipping_rates`
- `svm_promotions`
- `svm_promotion_usages`
- `svm_reviews`
- `svm_storefront_pages`
- `svm_storefront_banners`
- `svm_storefront_settings`
- `svm_carts`
- `svm_cart_items`
- `svm_wishlists`
- `svm_wishlist_items`

---

## Ready for Phase 2 - Ordering Engine
