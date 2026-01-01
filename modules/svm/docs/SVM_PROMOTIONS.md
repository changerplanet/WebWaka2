# SVM Module - Promotions & Discounts Documentation

## Phase 5 Overview

The Promotions & Discounts feature provides flexible coupon codes and automatic discounts for the Single Vendor Marketplace module.

## Key Principles

1. **Promotions apply ONLY to SVM module** - No global pricing mutation
2. **Final payable amount sent to Core** - SVM does NOT process payments
3. **Module isolation** - Promotion data is owned by SVM, uses tenant ID references

## Discount Types

### PERCENTAGE
- Percentage off eligible items/order
- Optional `maxDiscount` cap
- Example: 15% off (max $50 discount)

### FIXED_AMOUNT
- Fixed dollar amount off the order total
- Cannot exceed subtotal
- Example: $20 off orders over $75

### FIXED_PER_ITEM
- Fixed dollar amount off each eligible item
- Example: $5 off each shirt

### FREE_SHIPPING
- Removes shipping cost
- Often combined with minimum order total
- Example: Free shipping on orders over $50

### BUY_X_GET_Y
- Buy X items, get Y items at discount
- `buyQuantity` + `getQuantity` = deal size
- `getDiscountPercent`: 100 = free, 50 = half price
- Example: Buy 2 Get 1 Free

## Promotion Types

| Type | Behavior |
|------|----------|
| COUPON | Requires code entry by customer |
| AUTOMATIC | Applied automatically when conditions met |
| FLASH_SALE | Time-limited automatic promotion |

## API Endpoints

### List Promotions
```
GET /api/svm/promotions?tenantId=xxx&activeOnly=true&type=COUPON
```

### Create Promotion
```
POST /api/svm/promotions
{
  "tenantId": "xxx",
  "action": "CREATE",
  "name": "Summer Sale",
  "code": "SUMMER20",
  "type": "COUPON",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "maxDiscount": 50,
  "minOrderTotal": 50,
  "stackable": false
}
```

### Validate Coupon Code
```
POST /api/svm/promotions
{
  "tenantId": "xxx",
  "action": "VALIDATE",
  "code": "SUMMER20",
  "subtotal": 100,
  "items": [...],
  "customerId": "cust_xxx",
  "isFirstOrder": false
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "promotion": { ... },
  "potentialDiscount": {
    "discountAmount": 20,
    "message": "20% off"
  }
}
```

### Calculate All Discounts
```
POST /api/svm/promotions
{
  "tenantId": "xxx",
  "action": "CALCULATE",
  "subtotal": 150,
  "shippingTotal": 9.99,
  "couponCodes": ["FREESHIP"],
  "customerId": "cust_xxx",
  "isFirstOrder": false,
  "items": [
    { "productId": "p1", "productName": "Widget", "unitPrice": 50, "quantity": 3 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "appliedPromotions": [
    { "promotionName": "Summer Sale", "discountAmount": 22.50, "message": "15% off" },
    { "promotionName": "Free Shipping", "freeShipping": true, "message": "Free shipping" }
  ],
  "subtotal": 150,
  "discountTotal": 22.50,
  "shippingDiscount": 9.99,
  "finalSubtotal": 127.50,
  "shippingTotal": 0
}
```

### Update Promotion
```
PUT /api/svm/promotions/:promotionId
{
  "tenantId": "xxx",
  "isActive": false,
  "endDate": "2026-12-31T23:59:59Z"
}
```

### Delete Promotion
```
DELETE /api/svm/promotions/:promotionId?tenantId=xxx
```

## Validation Rules

| Rule | Error Code |
|------|------------|
| Promotion not found | NOT_FOUND |
| Promotion inactive | INACTIVE |
| Not yet started | NOT_STARTED |
| Expired | EXPIRED |
| Global usage limit reached | USAGE_LIMIT_REACHED |
| Per-customer limit reached | CUSTOMER_LIMIT_REACHED |
| Minimum order not met | MIN_ORDER_NOT_MET |
| Minimum quantity not met | MIN_QUANTITY_NOT_MET |
| No eligible items in cart | NO_ELIGIBLE_ITEMS |
| Customer not in allowed list | CUSTOMER_NOT_ELIGIBLE |
| Not first order (when required) | FIRST_ORDER_ONLY |
| Not stackable with existing | NOT_STACKABLE |
| Already applied | ALREADY_APPLIED |

## Stacking Logic

1. Promotions are sorted by `priority` (higher first)
2. If `stackable: true`, promotion can combine with others
3. If `stackable: false`, stops processing after applied
4. Automatic promotions apply before coupon codes
5. Total discount cannot exceed subtotal

## Default Promotions

When a tenant first uses the API, sample promotions are created:

| Name | Code | Type | Value | Conditions |
|------|------|------|-------|------------|
| Welcome Discount | WELCOME10 | COUPON | 10% off | First order only |
| Summer Sale | (auto) | AUTOMATIC | 15% (max $50) | Orders >$100, stackable |
| Free Shipping | FREESHIP | COUPON | Free shipping | Orders >$50, stackable |
| Buy 2 Get 1 Free | BOGO | COUPON | B2G1 | All items |
| $20 Off | SAVE20 | COUPON | $20 off | Orders >$75, limit 100 uses |

## Product/Category Restrictions

```json
{
  "productIds": ["p1", "p2"],           // Only these products
  "categoryIds": ["cat_electronics"],   // Only these categories
  "excludeProductIds": ["p_sale_item"]  // Never apply to these
}
```

- Empty arrays = all products eligible
- `excludeProductIds` takes precedence

## Customer Restrictions

```json
{
  "customerIds": ["vip_1", "vip_2"],  // Only these customers
  "firstOrderOnly": true,             // New customers only
  "perCustomerLimit": 3               // Max uses per customer
}
```

## Integration with Order Flow

1. Customer adds items to cart
2. Frontend calls `CALCULATE` to show potential discounts
3. Customer enters coupon code
4. Frontend calls `VALIDATE` to check code
5. If valid, frontend calls `CALCULATE` with coupon code
6. Discounts shown in cart summary
7. Order created with `discountTotal` and `finalSubtotal`
8. Core receives final payable amount for payment processing

## Files Reference

- `/saas-core/src/lib/promotions-storage.ts` - Shared globalThis storage
- `/saas-core/src/app/api/svm/promotions/route.ts` - List, create, validate, calculate
- `/saas-core/src/app/api/svm/promotions/[promotionId]/route.ts` - Get, update, delete
- `/modules/svm/src/lib/promotions-engine.ts` - Business logic classes
- `/modules/svm/prisma/schema.prisma` - Promotion & PromotionUsage models

## Testing Verified

- ✅ Percentage discounts with max cap
- ✅ Fixed amount discounts
- ✅ Fixed per-item discounts
- ✅ Free shipping
- ✅ Buy X Get Y (BOGO)
- ✅ Automatic promotions
- ✅ Coupon validation
- ✅ First order only restriction
- ✅ Minimum order total validation
- ✅ Stacking logic
- ✅ CRUD operations (create, read, update, delete)

## Current Limitations

- Storage is in-memory (globalThis, not persisted to database)
- Usage tracking not persisted between restarts
- No per-product discount display in cart items
