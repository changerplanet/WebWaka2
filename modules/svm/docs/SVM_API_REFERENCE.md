# SVM Module - API Reference

## Module Overview
The Single Vendor Marketplace (SVM) module provides e-commerce capabilities for a single vendor/tenant. It handles:
- Online orders and order lifecycle
- Shopping cart management
- Product catalog consumption (from Core)
- Promotions and discounts
- Module entitlements

## Base URL
All SVM API endpoints are prefixed with `/api/svm/`

---

## Orders API

### Create Order
**POST** `/api/svm/orders`

Creates a new order from cart items.

**Request Body:**
```json
{
  "tenantId": "string (required)",
  "customerId": "string (optional if guestEmail provided)",
  "guestEmail": "string (optional if customerId provided)",
  "items": [
    {
      "productId": "string (required)",
      "variantId": "string (optional)",
      "productName": "string (required)",
      "productSku": "string (optional)",
      "variantName": "string (optional)",
      "unitPrice": "number (required)",
      "quantity": "number (required)"
    }
  ],
  "shippingAddress": {
    "name": "string",
    "address1": "string",
    "address2": "string (optional)",
    "city": "string",
    "state": "string (optional)",
    "postalCode": "string",
    "country": "string",
    "phone": "string (optional)"
  },
  "shippingMethod": "string (optional)",
  "shippingTotal": "number (optional, default: 0)",
  "taxTotal": "number (optional, default: 0)",
  "discountTotal": "number (optional, default: 0)",
  "currency": "string (optional, default: USD)"
}
```

**Response (201):**
```json
{
  "success": true,
  "order": {
    "id": "order_xxx",
    "orderNumber": "ORD-20260101-1234",
    "status": "DRAFT",
    "tenantId": "string",
    "customerId": "string",
    "guestEmail": "string",
    "items": [...],
    "subtotal": 59.98,
    "shippingTotal": 0,
    "taxTotal": 0,
    "discountTotal": 0,
    "grandTotal": 59.98,
    "currency": "USD",
    "shippingAddress": {...},
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  },
  "events": [
    {
      "eventId": "evt_xxx",
      "eventType": "svm.order.created",
      "timestamp": "ISO timestamp"
    }
  ]
}
```

### List Orders
**GET** `/api/svm/orders?tenantId=xxx`

**Query Parameters:**
- `tenantId` (required)
- `customerId` (optional)
- `status` (optional)
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

### Get Order
**GET** `/api/svm/orders/:orderId`

### Update Order Status
**PUT** `/api/svm/orders/:orderId`

**Request Body:**
```json
{
  "tenantId": "string (required)",
  "action": "PLACE | MARK_PAID | START_PROCESSING | MARK_SHIPPED | MARK_DELIVERED | MARK_FULFILLED | REQUEST_REFUND | MARK_REFUNDED"
}
```

**Order State Machine:**
```
DRAFT → PLACED → PAID → PROCESSING → SHIPPED → DELIVERED → FULFILLED
   ↓       ↓       ↓         ↓           ↓          ↓
CANCELLED  CANCELLED CANCELLED/REFUNDED  REFUNDED   REFUNDED
```

### Cancel Order
**DELETE** `/api/svm/orders/:orderId?tenantId=xxx&reason=xxx&cancelledBy=CUSTOMER|MERCHANT|SYSTEM`

---

## Cart API

### Get Cart
**GET** `/api/svm/cart?tenantId=xxx&customerId=xxx` or `?tenantId=xxx&sessionId=xxx`

### Update Cart
**POST** `/api/svm/cart`

**Actions:**

**ADD_ITEM:**
```json
{
  "tenantId": "string",
  "customerId": "string (or sessionId)",
  "action": "ADD_ITEM",
  "productId": "string",
  "variantId": "string (optional)",
  "productName": "string",
  "unitPrice": "number",
  "quantity": "number"
}
```

**UPDATE_QUANTITY:**
```json
{
  "tenantId": "string",
  "customerId": "string (or sessionId)",
  "action": "UPDATE_QUANTITY",
  "productId": "string",
  "variantId": "string (optional)",
  "quantity": "number (0 to remove)"
}
```

**REMOVE_ITEM:**
```json
{
  "tenantId": "string",
  "customerId": "string (or sessionId)",
  "action": "REMOVE_ITEM",
  "productId": "string",
  "variantId": "string (optional)"
}
```

**APPLY_PROMO:**
```json
{
  "tenantId": "string",
  "customerId": "string (or sessionId)",
  "action": "APPLY_PROMO",
  "promotionCode": "string"
}
```

**REMOVE_PROMO:**
```json
{
  "tenantId": "string",
  "customerId": "string (or sessionId)",
  "action": "REMOVE_PROMO"
}
```

### Clear Cart
**DELETE** `/api/svm/cart?tenantId=xxx&customerId=xxx` or `?tenantId=xxx&sessionId=xxx`

---

## Products API

### List Products
**GET** `/api/svm/products?tenantId=xxx`

**Query Parameters:**
- `tenantId` (required)
- `q` or `search` (optional)
- `categoryId` (optional)
- `status` (optional: ACTIVE, DRAFT, ARCHIVED)
- `tags` (optional, comma-separated)
- `minPrice`, `maxPrice` (optional)
- `inStock` (optional: true/false)
- `sortBy` (optional: name, price, createdAt, updatedAt)
- `sortOrder` (optional: asc, desc)
- `limit` (optional, default: 24)
- `offset` (optional, default: 0)

### Get Product
**GET** `/api/svm/products/:productId?tenantId=xxx`

**Query Parameters:**
- `tenantId` (required)
- `includeInventory` (optional: true/false)

---

## Entitlements API

### Get SVM Entitlements
**GET** `/api/svm/entitlements?tenantId=xxx`

**Response:**
```json
{
  "success": true,
  "module": "SVM",
  "features": ["storefront", "cart", "checkout", "orders", "promotions", "reviews"],
  "limits": {
    "max_products": 100,
    "max_orders_per_month": 500,
    "max_storage_mb": 1024
  },
  "expiresAt": null
}
```

---

## Events API

### Process SVM Event
**POST** `/api/svm/events`

**Request Body:**
```json
{
  "eventId": "evt_xxx",
  "eventType": "svm.order.placed | svm.order.payment_requested | svm.order.cancelled | ...",
  "timestamp": "ISO timestamp",
  "idempotencyKey": "unique_key",
  "payload": { ... }
}
```

**Event Types:**
- `svm.order.created` - Order created (logged)
- `svm.order.placed` - Order submitted (triggers inventory reservation)
- `svm.order.payment_requested` - Payment requested (triggers payment intent)
- `svm.order.paid` - Payment confirmed (logged)
- `svm.order.processing` - Order being prepared (logged)
- `svm.order.shipped` - Order shipped (triggers notification)
- `svm.order.delivered` - Order delivered (logged)
- `svm.order.fulfilled` - Order completed (logged)
- `svm.order.cancelled` - Order cancelled (triggers inventory release, refund)
- `svm.order.refund_requested` - Refund requested (triggers refund processing)
- `svm.order.refunded` - Refund completed (logged)
- `svm.order.status_changed` - Status transition (logged)

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- 400 - Bad Request (missing or invalid parameters)
- 404 - Not Found
- 500 - Internal Server Error
