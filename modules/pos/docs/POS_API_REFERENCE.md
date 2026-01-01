# POS Module API Reference

## Version: pos-v1.0.0
## Module Phase 5 Complete

---

## Base URL

All POS APIs are prefixed with `/api/pos/` when integrated with SaaS Core.

---

## Authentication

All endpoints require authentication via SaaS Core. The staff context includes:
- `tenantId` - Current tenant
- `staffId` - Authenticated user
- `posRole` - One of `POS_CASHIER`, `POS_SUPERVISOR`, `POS_MANAGER`
- `coreRole` - One of `TENANT_ADMIN`, `TENANT_USER`

---

## Sales API

### Create Sale

```http
POST /api/pos/sales
```

Creates a new sale in DRAFT status.

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "registerId": "register-1",
  "sessionId": "session-789",
  "shiftId": "shift-xyz",
  "customerId": "customer-abc",
  "offlineId": "offline-123"
}
```

**Response:**
```json
{
  "success": true,
  "sale": {
    "id": "sale-123",
    "saleNumber": "S-20260101-0001",
    "status": "DRAFT",
    "tenantId": "tenant-123",
    "staffId": "staff-456",
    "subtotal": 0,
    "discountTotal": 0,
    "taxTotal": 0,
    "grandTotal": 0,
    "lineItems": [],
    "discounts": [],
    "payments": []
  },
  "events": [{"eventType": "pos.sale.created"}]
}
```

**Permission:** `pos.sale.create`

---

### List Sales

```http
GET /api/pos/sales?tenantId=xxx&status=DRAFT&limit=50
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `tenantId` | string | **Required** |
| `status` | string | Filter by status |
| `staffId` | string | Filter by staff |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset |

---

### Get Sale

```http
GET /api/pos/sales/:saleId
```

---

### Update Sale

```http
PUT /api/pos/sales/:saleId
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "posRole": "POS_CASHIER",
  "action": "ADD_ITEM|REMOVE_ITEM|UPDATE_QUANTITY|APPLY_DISCOUNT|REMOVE_DISCOUNT|SUSPEND"
}
```

---

### Void Sale

```http
DELETE /api/pos/sales/:saleId
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "reason": "Customer changed mind"
}
```

**Permission:** `pos.sale.void` or `pos.sale.void_others`

---

## Sale Line Items API

### Add Item to Sale

```http
POST /api/pos/sales/:saleId/items
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "productId": "prod-123",
  "variantId": "var-456",
  "productName": "Coffee Mug",
  "productSku": "MUG-001",
  "unitPrice": 15.99,
  "quantity": 2,
  "taxRate": 0.0825,
  "taxExempt": false
}
```

**Permission:** `pos.sale.add_item`

---

### List Sale Items

```http
GET /api/pos/sales/:saleId/items
```

---

## Sale Payments API

### Add Payment

```http
POST /api/pos/sales/:saleId/payments
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "method": "CASH|CARD|MOBILE_PAYMENT|STORE_CREDIT|GIFT_CARD|SPLIT|OTHER",
  "amount": 25.00,
  "tipAmount": 5.00,
  "cashReceived": 30.00
}
```

**Permissions:**
- CASH: `pos.payment.cash`
- CARD: `pos.payment.card`
- SPLIT: `pos.payment.split`
- Other: `pos.payment.other`

---

### Complete Sale

```http
POST /api/pos/sales/:saleId/complete
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456"
}
```

**Permission:** `pos.sale.complete`

**Events Emitted:**
- `pos.sale.completed`
- `pos.inventory.deduction_requested`

---

## Registers API

### Create Register

```http
POST /api/pos/registers
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "name": "Front Counter",
  "code": "FC1",
  "defaultTaxRate": 0.0825,
  "receiptHeader": "Welcome!",
  "receiptFooter": "Thank you!"
}
```

**Permission:** `pos.settings.registers`

---

### List Registers

```http
GET /api/pos/registers?tenantId=xxx&activeOnly=true
```

---

## Register Sessions API

### Open Session

```http
POST /api/pos/registers/:registerId/sessions
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "openingCash": 100.00,
  "openingNotes": "Standard float"
}
```

**Permission:** `pos.register.open`

---

### Close Session

```http
POST /api/pos/registers/:registerId/sessions/:sessionId/close
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "closingCash": 350.00,
  "closingNotes": "End of day",
  "blindClose": false
}
```

**Permissions:**
- Own session: `pos.register.close`
- Others' session: `pos.register.close_others`
- Blind close: `pos.register.blind_close`

---

## Shifts API

### Start Shift

```http
POST /api/pos/shifts
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "sessionId": "session-789",
  "notes": "Morning shift"
}
```

**Permission:** `pos.shift.start`

---

### List Shifts

```http
GET /api/pos/shifts?tenantId=xxx&staffId=yyy&status=ACTIVE
```

---

### End Shift

```http
POST /api/pos/shifts/:shiftId/end
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "shiftStaffId": "staff-789",
  "notes": "Good day"
}
```

**Permissions:**
- Own shift: `pos.shift.end`
- Others' shift: `pos.shift.end_others`

---

## Refunds API

### Create Refund

```http
POST /api/pos/refunds
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "originalSaleId": "sale-789",
  "items": [
    {
      "lineItemId": "li-123",
      "quantity": 1,
      "refundAmount": 15.99,
      "reason": "Defective"
    }
  ],
  "refundMethod": "CASH|CARD|STORE_CREDIT",
  "reason": "Product defective",
  "restockItems": true
}
```

**Permissions:**
- With receipt: `pos.refund.create`
- Without receipt: `pos.refund.without_receipt`

**Events Emitted:**
- `pos.refund.created`
- `pos.inventory.restore_requested` (if restockItems: true)

---

### List Refunds

```http
GET /api/pos/refunds?tenantId=xxx&originalSaleId=yyy
```

---

## Settings API

### Get Settings

```http
GET /api/pos/settings?tenantId=xxx
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "defaultTaxRate": 0.0825,
    "taxInclusive": false,
    "allowNegativeInventory": false,
    "requireCustomerForSale": false,
    "maxDiscountPercent": 50,
    "requireManagerApprovalAbove": 100,
    "layawayEnabled": false,
    "offlineEnabled": true,
    "offlineMaxTransactions": 100
  }
}
```

---

### Update Settings

```http
PUT /api/pos/settings
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "staffId": "staff-456",
  "defaultTaxRate": 0.0850,
  "maxDiscountPercent": 40
}
```

**Permission:** `pos.settings.edit`

---

## Error Responses

### Permission Denied

```json
{
  "success": false,
  "error": "Permission 'pos.sale.void' not granted to POS_CASHIER",
  "requiresApproval": true,
  "approverRole": "POS_SUPERVISOR"
}
```

### Validation Error

```json
{
  "success": false,
  "error": "tenantId and staffId are required"
}
```

### Not Found

```json
{
  "success": false,
  "error": "Sale sale-123 not found"
}
```

---

## Event Types

| Event | Trigger | Core Action |
|-------|---------|-------------|
| `pos.sale.created` | Create sale | - |
| `pos.sale.item_added` | Add item | - |
| `pos.sale.item_removed` | Remove item | - |
| `pos.sale.payment_added` | Add payment | Record revenue |
| `pos.sale.completed` | Complete sale | - |
| `pos.sale.voided` | Void sale | - |
| `pos.inventory.deduction_requested` | Sale completed | Deduct inventory |
| `pos.inventory.release_requested` | Sale voided | Release inventory |
| `pos.inventory.restore_requested` | Refund created | Restore inventory |

---

## Summary

| Resource | Endpoints |
|----------|-----------|
| Sales | 5 |
| Line Items | 2 |
| Payments | 2 |
| Registers | 2 |
| Sessions | 3 |
| Shifts | 4 |
| Refunds | 2 |
| Settings | 2 |
| **Total** | **22** |

---

## Ready for MODULE 1 · PHASE 6 — POS UI & UX (PWA)
