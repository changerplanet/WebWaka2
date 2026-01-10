# Commerce Suite: Billing & Subscriptions
## S4: API Layer Canonicalization

**Suite Code**: `COM-BILL`  
**Phase**: S4 (API Layer)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. S4 Objective

Expose S3 domain services via RESTful API routes under `/api/commerce/billing/*`, protected by capability guards.

**Constraints Enforced:**
- ✅ All routes under `/api/commerce/billing/*`
- ✅ Capability guard: `checkCapabilityForSession(tenantId, 'billing')`
- ✅ Tenant-scoped operations only
- ✅ No UI components
- ✅ No payment gateway integration
- ✅ No background jobs

---

## 2. API Routes Implemented

### 2.1 Main Route

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commerce/billing` | Get billing config and statistics |
| POST | `/api/commerce/billing` | Refresh billing (update overdue invoices) |

### 2.2 Invoice Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commerce/billing/invoices` | List invoices with filters |
| POST | `/api/commerce/billing/invoices` | Create new invoice |
| GET | `/api/commerce/billing/invoices/[id]` | Get invoice by ID |
| POST | `/api/commerce/billing/invoices/[id]` | Invoice actions (send, view, cancel) |

**List Query Parameters:**
- `customerId` - Filter by customer
- `status` - Comma-separated status list (DRAFT,SENT,PAID,etc.)
- `overdue` - true/false - show only overdue
- `fromDate` - ISO date string
- `toDate` - ISO date string
- `page` - Page number (default 1)
- `limit` - Items per page (default 20)

**Invoice Actions:**
- `send` - DRAFT → SENT transition
- `view` - Mark as viewed
- `cancel` - Cancel invoice (requires reason)

### 2.3 Payment Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commerce/billing/payments` | List payments for invoice |
| POST | `/api/commerce/billing/payments` | Record a payment |
| GET | `/api/commerce/billing/payments/[id]` | Get payment by ID |
| POST | `/api/commerce/billing/payments/[id]` | Payment actions (reverse, link) |

**List Query Parameters:**
- `invoiceId` - Required - Filter by invoice

**Payment Actions:**
- `reverse` - Refund/reverse payment (requires reason)
- `link` - Link to Payments suite transaction (requires transactionId)

### 2.4 Credit Note Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commerce/billing/credit-notes` | List credit notes with filters |
| POST | `/api/commerce/billing/credit-notes` | Create new credit note |
| GET | `/api/commerce/billing/credit-notes/[id]` | Get credit note by ID |
| POST | `/api/commerce/billing/credit-notes/[id]` | Credit note actions (approve, apply, cancel) |

**List Query Parameters:**
- `customerId` - Filter by customer
- `invoiceId` - Filter by original invoice
- `status` - Comma-separated status list
- `page` - Page number (default 1)
- `limit` - Items per page (default 20)

**Credit Note Actions:**
- `approve` - DRAFT → APPROVED workflow
- `apply` - Apply to target invoice (requires targetInvoiceId)
- `cancel` - Cancel credit note

### 2.5 Statistics Route

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commerce/billing/statistics` | Get billing statistics and aging report |

**Query Parameters:**
- `type` - 'summary' | 'aging' | 'all' (default 'all')

---

## 3. Request/Response Examples

### Create Invoice

```bash
POST /api/commerce/billing/invoices
Content-Type: application/json

{
  "customerName": "Chukwuma Enterprises Ltd",
  "customerEmail": "accounts@chukwuma.ng",
  "customerTIN": "12345678-0001",
  "customerType": "BUSINESS",
  "currency": "NGN",
  "vatInclusive": false,
  "paymentTermDays": 30,
  "items": [
    {
      "description": "Consulting Services - January 2025",
      "quantity": 40,
      "unitPrice": 25000
    },
    {
      "description": "Software License (Annual)",
      "quantity": 1,
      "unitPrice": 500000,
      "taxExempt": false
    }
  ],
  "notes": "Thank you for your business"
}
```

Response:
```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-2501-00001",
    "customerName": "Chukwuma Enterprises Ltd",
    "subtotal": 1500000,
    "taxTotal": 112500,
    "grandTotal": 1612500,
    "amountDue": 1612500,
    "status": "DRAFT",
    "items": [...]
  }
}
```

### Record Payment

```bash
POST /api/commerce/billing/payments
Content-Type: application/json

{
  "invoiceId": "uuid",
  "amount": 800000,
  "paymentMethod": "BANK_TRANSFER",
  "paymentReference": "GTB-20250107-123456"
}
```

Response:
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "amount": 800000,
    "status": "CONFIRMED"
  },
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-2501-00001",
    "status": "PARTIALLY_PAID",
    "amountPaid": 800000,
    "amountDue": 812500
  }
}
```

### Apply Credit Note

```bash
POST /api/commerce/billing/credit-notes/{id}
Content-Type: application/json

{
  "action": "apply",
  "targetInvoiceId": "invoice-uuid"
}
```

Response:
```json
{
  "success": true,
  "message": "Credit note applied to invoice",
  "creditNote": {
    "id": "uuid",
    "status": "APPLIED",
    "appliedAt": "2025-01-07T05:30:00Z"
  },
  "invoice": {
    "id": "invoice-uuid",
    "amountPaid": 850000,
    "amountDue": 762500,
    "status": "PARTIALLY_PAID"
  }
}
```

---

## 4. Error Handling

All endpoints return consistent error responses:

| Status | Meaning |
|--------|---------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - No valid session |
| 403 | Forbidden - Missing billing capability |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

Error response format:
```json
{
  "error": "Human-readable error message"
}
```

---

## 5. Capability Guard

All routes are protected by:

```typescript
const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
if (guardResult) return guardResult
```

This ensures:
- User must be authenticated
- User must have an active tenant
- Tenant must have the 'billing' capability enabled

---

## 6. File Locations

```
/app/frontend/src/app/api/commerce/billing/
├── route.ts                      # Main billing endpoint
├── invoices/
│   ├── route.ts                  # List/Create invoices
│   └── [id]/
│       └── route.ts              # Get/Action on invoice
├── payments/
│   ├── route.ts                  # List/Record payments
│   └── [id]/
│       └── route.ts              # Get/Action on payment
├── credit-notes/
│   ├── route.ts                  # List/Create credit notes
│   └── [id]/
│       └── route.ts              # Get/Action on credit note
└── statistics/
    └── route.ts                  # Billing statistics
```

---

## 7. Integration Points

### With Payments & Collections Suite

Invoice payments can be linked to Payments suite transactions:

```bash
POST /api/commerce/billing/payments/{id}
{
  "action": "link",
  "transactionId": "pay_txn_uuid"
}
```

### With SVM/MVM Suites

Invoices can reference orders:

```json
{
  "orderId": "order-uuid",
  "orderNumber": "ORD-2501-00001"
}
```

---

## 8. Breaking Changes

| Category | Count | Notes |
|----------|-------|-------|
| Existing APIs | 0 | All preserved |
| Type changes | 0 | None |
| Route conflicts | 0 | New namespace |

**✅ ZERO BREAKING CHANGES**

---

## 9. Next Phase

**S5 — UI Demo Page** (AWAITING AUTHORIZATION)
- Create `/billing-demo` page
- Showcase invoice creation, payments, credit notes
- Nigeria-first demo data
- Interactive capability demonstration

**STOP POINT**: User approval required before proceeding to S5.

---

*Document prepared under PC-SCP guidelines*  
*S4 API Layer — COMPLETE*
