# SVM Suite — S4 API Layer Canonicalization

## Document Info
- **Suite**: Single Vendor Marketplace (Commerce Sub-Suite 2 of 8)
- **Phase**: S4 (API Layer Canonicalization)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: COMPLETE
- **Date**: December 2025
- **Author**: E1 Agent
- **Reference**: S3 Core Services (APPROVED)

---

## 1️⃣ S4 SCOPE (Per Authorization)

| API Domain | Status |
|------------|--------|
| Checkout APIs | ✅ DONE |
| Order APIs | ✅ DONE |
| Shipping APIs | ✅ DONE |
| Payment APIs | ✅ DONE |

### Explicitly NOT In S4 Scope
- ❌ No gateway calls
- ❌ No background jobs
- ❌ No notifications
- ❌ No UI

### Mandatory Rules Applied
- ✅ `checkCapabilityGuard(request, 'svm')` on ALL routes
- ✅ Tenant scoping on every query
- ✅ NGN currency formatting throughout

---

## 2️⃣ API STRUCTURE

```
/app/frontend/src/app/api/commerce/svm/
├── checkout/
│   └── route.ts              # Checkout orchestration
├── orders/
│   ├── route.ts              # List orders, create redirect
│   └── [orderId]/
│       ├── route.ts          # Get order details
│       ├── cancel/
│       │   └── route.ts      # Cancel order
│       └── status/
│           └── route.ts      # Update status
├── shipping/
│   ├── route.ts              # Zones & quotes
│   └── pickup/
│       └── route.ts          # Local pickup toggle
└── payments/
    ├── route.ts              # Payment methods
    └── transfer/
        └── route.ts          # Bank transfer initiation
```

---

## 3️⃣ CHECKOUT API

**Endpoint**: `/api/commerce/svm/checkout`

### POST - Checkout Operations

| Action | Description |
|--------|-------------|
| `?action=summary` | Calculate checkout totals (tax, shipping, fees) |
| `?action=validate` | Validate checkout data before submission |
| `?action=finalize` | Create order from checkout session |
| `?action=options` | Get shipping & payment options for address |

### Request Body
```typescript
{
  items: CartItem[]           // Required
  shippingAddress?: ShippingAddress
  shippingOption?: ShippingCalculation
  paymentMethod?: PaymentMethodCode
  promotionCode?: string
  discountTotal?: number
  customerEmail?: string      // Required for finalize
  customerNotes?: string
  sessionId?: string
  cartId?: string
  customerId?: string
}
```

### Response (summary)
```json
{
  "success": true,
  "data": {
    "items": [...],
    "itemCount": 3,
    "subtotal": 25000,
    "subtotalFormatted": "₦25,000.00",
    "discountTotal": 0,
    "taxRate": 0.075,
    "taxName": "VAT",
    "taxTotal": 1875,
    "taxFormatted": "₦1,875.00",
    "shippingTotal": 2000,
    "shippingFormatted": "₦2,000.00",
    "paymentFee": 500,
    "grandTotal": 29375,
    "grandTotalFormatted": "₦29,375.00",
    "currency": "NGN"
  }
}
```

---

## 4️⃣ ORDERS API

### List Orders
**GET** `/api/commerce/svm/orders`

| Param | Description |
|-------|-------------|
| `customerId` | Filter by customer |
| `customerEmail` | Filter by email |
| `status` | Filter by status |
| `page` | Page number (default: 1) |
| `limit` | Page size (max: 100) |

### Get Order Details
**GET** `/api/commerce/svm/orders/[orderId]`

Returns full order with:
- Items with pricing
- Status display & timeline
- Cancellation eligibility
- Refund eligibility
- All timestamps

### Cancel Order
**POST** `/api/commerce/svm/orders/[orderId]/cancel`

```json
{
  "reason": "CUSTOMER_REQUEST",
  "notes": "Optional cancellation notes"
}
```

**GET** - Check cancellation eligibility

### Update Status
**POST** `/api/commerce/svm/orders/[orderId]/status`

```json
{
  "status": "SHIPPED",
  "actor": "MERCHANT",
  "trackingNumber": "ABC123",
  "carrier": "GIG Logistics"
}
```

**GET** - Get allowed transitions

---

## 5️⃣ SHIPPING API

### Get Shipping Zones
**GET** `/api/commerce/svm/shipping`

| Action | Description |
|--------|-------------|
| `?action=zones` | List all shipping zones with rates |
| `?action=states` | List Nigerian states with regions |
| `?action=pickup` | Check local pickup availability |

### Calculate Shipping Quote
**POST** `/api/commerce/svm/shipping`

```json
{
  "state": "Lagos",
  "subtotal": 50000,
  "includeLocalPickup": true,
  "preferredOption": "all"  // "cheapest" | "fastest" | "all"
}
```

Response includes:
- All shipping options
- Cheapest & fastest recommendations
- Free shipping threshold info
- Local pickup availability

### Local Pickup Toggle
**POST** `/api/commerce/svm/shipping/pickup`

```json
{ "enabled": true }
```

---

## 6️⃣ PAYMENTS API

### Get Payment Methods
**GET** `/api/commerce/svm/payments`

| Action | Description |
|--------|-------------|
| `?action=list` | List all payment methods |
| `?action=pod-config` | Get POD configuration |

### Check Availability
**POST** `/api/commerce/svm/payments`

```json
{
  "amount": 75000,
  "state": "Lagos",
  "method": "POD"  // Optional - check specific method
}
```

Response groups methods by availability with reasons.

### Bank Transfer Initiation
**POST** `/api/commerce/svm/payments/transfer`

```json
{ "orderId": "order_xxx" }
```

Response:
```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderNumber": "ORD-20251206-1234",
    "transfer": {
      "bankName": "GTBank",
      "accountNumber": "0123456789",
      "accountName": "WebWaka Payments",
      "reference": "WW-XXXXX-XXXX",
      "amount": 29375,
      "amountFormatted": "₦29,375.00",
      "expiresAt": "2025-12-07T...",
      "expiresIn": "24 hours"
    },
    "instructions": [...]
  }
}
```

---

## 7️⃣ CAPABILITY GUARD

All routes enforce:

```typescript
const guardResult = await checkCapabilityGuard(request, 'svm')
if (!guardResult.allowed) {
  return NextResponse.json(
    { success: false, error: guardResult.reason, code: 'CAPABILITY_INACTIVE' },
    { status: 403 }
  )
}

const tenantId = guardResult.tenantId
// All queries scoped by tenantId
```

---

## 8️⃣ ERROR RESPONSES

| Code | Status | Description |
|------|--------|-------------|
| `CAPABILITY_INACTIVE` | 403 | SVM not enabled for tenant |
| (validation) | 400 | Missing/invalid parameters |
| (not found) | 404 | Resource not found |
| (server) | 500 | Internal server error |

All errors follow format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 9️⃣ FILES CREATED

| File | Lines | Purpose |
|------|-------|---------|
| `checkout/route.ts` | 200 | Checkout orchestration |
| `orders/route.ts` | 130 | List orders |
| `orders/[orderId]/route.ts` | 175 | Order details |
| `orders/[orderId]/cancel/route.ts` | 165 | Cancellation |
| `orders/[orderId]/status/route.ts` | 180 | Status transitions |
| `shipping/route.ts` | 200 | Zones & quotes |
| `shipping/pickup/route.ts` | 100 | Local pickup |
| `payments/route.ts` | 180 | Payment methods |
| `payments/transfer/route.ts` | 200 | Bank transfer |

**Total**: ~1,530 lines of API routes

---

## 🔟 VERIFICATION

### Capability Guard Test
```bash
curl "http://localhost:3000/api/commerce/svm/shipping?action=states"
# Returns: {"success":false,"code":"CAPABILITY_INACTIVE"}
```
✅ Guard correctly blocks unauthorized access

### TypeScript Compilation
✅ All routes compile without errors (Next.js module type warnings are expected)

### Hot Reload
✅ Frontend restarted and ready

---

## 📌 S4 COMPLETE — AWAITING S5 AUTHORIZATION

### What S4 Achieved
1. ✅ **Checkout API**: Summary, validation, finalization, options
2. ✅ **Orders API**: List, detail, cancel, status transitions
3. ✅ **Shipping API**: Zones, quotes, local pickup toggle
4. ✅ **Payments API**: Methods, availability, bank transfer initiation

### All Routes Canonical
- ✅ Capability guarded
- ✅ Tenant scoped
- ✅ NGN formatted
- ✅ Consistent error format
- ✅ Under `/api/commerce/svm/*`

### What Remains for S5+
- **S5**: UI updates to consume these APIs
- **S6**: Verification and freeze

---

**🛑 AGENT WILL STOP HERE AND AWAIT S5 APPROVAL**
