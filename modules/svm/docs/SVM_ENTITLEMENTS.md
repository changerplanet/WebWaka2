# SVM Entitlements Documentation

## Overview

The SVM Entitlement Service enforces subscription-based limits and feature access for the Single Vendor Marketplace module.

**Important Rules:**
- ✅ Module checks entitlements ONLY
- ✅ Module does NOT know plan names (Free, Pro, Enterprise)
- ✅ Module does NOT contain billing logic
- ✅ All limits come from SaaS Core

---

## Features

Features are boolean flags that can be enabled or disabled per tenant.

| Feature | Description | Free | Pro* | Enterprise* |
|---------|-------------|------|------|-------------|
| `storefront` | Basic storefront UI | ✅ | ✅ | ✅ |
| `cart` | Shopping cart | ✅ | ✅ | ✅ |
| `checkout` | Checkout flow | ✅ | ✅ | ✅ |
| `orders` | Order management | ✅ | ✅ | ✅ |
| `promotions` | Coupon codes & discounts | ❌ | ✅ | ✅ |
| `reviews` | Product reviews | ❌ | ✅ | ✅ |
| `wishlist` | Customer wishlists | ❌ | ✅ | ✅ |
| `cms` | Custom pages & banners | ❌ | ✅ | ✅ |
| `seo` | SEO meta tags | ❌ | ✅ | ✅ |
| `analytics` | Sales analytics | ❌ | ✅ | ✅ |
| `api` | REST API access | ❌ | ❌ | ✅ |
| `custom_domain` | Custom domain support | ❌ | ❌ | ✅ |
| `multi_currency` | Multi-currency pricing | ❌ | ❌ | ✅ |
| `advanced_shipping` | Weight/zone-based shipping | ❌ | ✅ | ✅ |
| `abandoned_cart` | Abandoned cart emails | ❌ | ✅ | ✅ |

*Plan names are illustrative. Module only sees feature flags.*

---

## Limits

Limits are numeric thresholds that constrain usage.

| Limit Key | Description | Free | Pro* | Enterprise* |
|-----------|-------------|------|------|-------------|
| `max_products` | Product catalog size | 50 | 500 | ∞ |
| `max_orders_per_month` | Monthly order limit | 100 | 1,000 | ∞ |
| `max_storage_mb` | Media storage | 256 MB | 5 GB | ∞ |
| `max_promotions` | Active promotions | 5 | 50 | ∞ |
| `max_banners` | Homepage banners | 3 | 20 | ∞ |
| `max_pages` | CMS pages | 5 | 50 | ∞ |
| `max_reviews` | Total reviews | 100 | 5,000 | ∞ |
| `max_images_per_product` | Images per product | 5 | 20 | ∞ |
| `max_variants_per_product` | Variants per product | 3 | 50 | ∞ |
| `max_shipping_zones` | Shipping zones | 3 | 20 | ∞ |

*`∞` = `null` in the API (unlimited)*

---

## Usage Examples

### Initialize Service

```typescript
import { initEntitlementService, SVMEntitlementService } from '@/lib/entitlements'

const entitlements = initEntitlementService({
  coreEntitlementsUrl: '/api/svm/entitlements',
  tenantId: 'tenant_123',
  cacheTimeMs: 60000 // 1 minute cache
})
```

### Check Feature Access

```typescript
import { getEntitlementService, SVM_ENTITLEMENT_FEATURES } from '@/lib/entitlements'

// Check if promotions feature is available
const service = getEntitlementService()
const result = await service.hasFeature(SVM_ENTITLEMENT_FEATURES.PROMOTIONS)

if (!result.allowed) {
  console.log(result.reason) // "Feature 'promotions' is not included in your plan"
  // Show upgrade prompt
}
```

### Check Limit Before Action

```typescript
import { 
  getEntitlementService, 
  SVM_ENTITLEMENT_LIMITS 
} from '@/lib/entitlements'

const service = getEntitlementService()

// Check if can add more products
const currentProductCount = 48
const result = await service.checkLimit(
  SVM_ENTITLEMENT_LIMITS.MAX_PRODUCTS, 
  currentProductCount
)

if (!result.allowed) {
  console.log(result.reason) // "Limit reached: 48/50 products"
  console.log(result.remaining) // 2
  console.log(result.upgradeRequired) // true
}
```

### Check Monthly Limit (Orders)

```typescript
import { 
  getEntitlementService, 
  SVM_ENTITLEMENT_LIMITS 
} from '@/lib/entitlements'

const service = getEntitlementService()

// Check and increment monthly order counter
const result = await service.canIncrementMonthly(
  SVM_ENTITLEMENT_LIMITS.MAX_ORDERS_PER_MONTH,
  'orders' // Counter key
)

if (!result.allowed) {
  // Reject order placement
  throw new Error('Monthly order limit reached')
}

// Order counter automatically incremented
```

### Require Feature (Throws on Failure)

```typescript
import { 
  getEntitlementService, 
  SVM_ENTITLEMENT_FEATURES,
  EntitlementError 
} from '@/lib/entitlements'

async function createPromotion(data: any) {
  const service = getEntitlementService()
  
  try {
    // This throws if feature not available
    await service.requireFeature(SVM_ENTITLEMENT_FEATURES.PROMOTIONS)
    
    // Create promotion...
  } catch (error) {
    if (error instanceof EntitlementError) {
      return {
        success: false,
        error: error.message,
        upgradeRequired: error.upgradeRequired
      }
    }
    throw error
  }
}
```

### Get Usage Summary for UI

```typescript
import { getEntitlementService, getUsageColor } from '@/lib/entitlements'

const service = getEntitlementService()
const summary = await service.getSummary()

// Display feature availability
console.log('Promotions enabled:', summary.features.promotions)
console.log('Reviews enabled:', summary.features.reviews)

// Display limit usage
const productLimit = summary.limits.max_products
console.log('Product limit:', productLimit.label) // "50" or "Unlimited"

// Get usage percentage for progress bar
const currentProducts = 45
const usagePercent = await service.getUsagePercent(
  SVM_ENTITLEMENT_LIMITS.MAX_PRODUCTS, 
  currentProducts
)
console.log('Usage:', usagePercent + '%') // "90%"
console.log('Color:', getUsageColor(usagePercent)) // "red"
```

---

## API Integration

### GET /api/svm/entitlements

Returns entitlements for a tenant.

**Request:**
```
GET /api/svm/entitlements?tenantId=tenant_123
```

**Response:**
```json
{
  "success": true,
  "module": "SVM",
  "features": [
    "storefront",
    "cart",
    "checkout",
    "orders",
    "promotions",
    "reviews"
  ],
  "limits": {
    "max_products": 500,
    "max_orders_per_month": 1000,
    "max_storage_mb": 5120,
    "max_promotions": 50,
    "max_banners": 20,
    "max_pages": 50,
    "max_reviews": 5000,
    "max_images_per_product": 20,
    "max_variants_per_product": 50,
    "max_shipping_zones": 20
  },
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

## Failure Handling

### Feature Not Available

When a feature check fails:

```typescript
{
  allowed: false,
  feature: 'promotions',
  reason: "Feature 'promotions' is not included in your plan",
  upgradeRequired: true
}
```

**UI Response:**
- Disable the feature UI element
- Show "Upgrade to unlock" badge
- Link to upgrade page

### Limit Reached

When a limit check fails:

```typescript
{
  allowed: false,
  limitKey: 'max_products',
  currentValue: 50,
  limitValue: 50,
  remaining: 0,
  reason: "Limit reached: 50/50 products",
  upgradeRequired: true
}
```

**UI Response:**
- Disable "Add" button
- Show "X/Y used" indicator
- Show "Upgrade for more" message

### Approaching Limit (Warning)

When usage is high but not at limit:

```typescript
const percent = await service.getUsagePercent('max_products', 45)
// 90%

if (percent >= 80) {
  showWarning('You are approaching your product limit')
}
```

---

## Default Entitlements

When no subscription is found, these defaults apply:

```typescript
{
  module: 'SVM',
  features: ['storefront', 'cart', 'checkout', 'orders'],
  limits: {
    max_products: 50,
    max_orders_per_month: 100,
    max_storage_mb: 256,
    max_promotions: 5,
    max_banners: 3,
    max_pages: 5,
    max_reviews: 100,
    max_images_per_product: 5,
    max_variants_per_product: 3,
    max_shipping_zones: 3
  },
  expiresAt: null
}
```

---

## Module Isolation Verification

✅ No billing logic in module
✅ No plan names in module code
✅ All limits fetched from Core
✅ Graceful degradation on fetch failure
✅ Feature flags abstracted (module doesn't know why)
