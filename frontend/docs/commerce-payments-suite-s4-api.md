# Commerce Suite: Payments & Collections
## S4: API Exposure & Guarding

**Suite Code**: `COM-PAY`  
**Phase**: S4 (API Layer)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. S4 Objective

Create canonical API endpoints that expose S3 services with proper capability guards. All routes are thin controllers that delegate to domain services.

**Constraints Enforced:**
- ✅ All routes capability-guarded with `payments` key
- ✅ Tenant-scoped, thin controllers
- ✅ No business logic in routes
- ✅ No gateway SDK calls
- ✅ No webhooks
- ✅ No background jobs
- ✅ No UI changes

---

## 2. API Routes Created

### 2.1 Route Summary

| Route | Methods | Purpose | Capability Guard |
|-------|---------|---------|------------------|
| `/api/commerce/payments` | GET, POST | Config status & initialization | ✅ `payments` |
| `/api/commerce/payments/methods` | GET, POST | Method availability & fee calculation | ✅ `payments` |
| `/api/commerce/payments/transfer` | GET, POST, PUT | Bank transfer flow | ✅ `payments` |
| `/api/commerce/payments/proof` | GET, POST, PUT | Proof-of-payment workflow | ✅ `payments` |
| `/api/commerce/payments/partial` | GET, POST | Partial payment tracking | ✅ `payments` |
| `/api/commerce/payments/status` | GET | Status resolution & display | ✅ `payments` |

**Total Routes: 6**
**Total Endpoints: 14**

---

## 3. Endpoint Details

### 3.1 Main Configuration (`/api/commerce/payments`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commerce/payments` | Get payment config status |
| POST | `/api/commerce/payments` | Initialize/update config |

**Sample Response (GET):**
```json
{
  "initialized": true,
  "config": {
    "paymentsEnabled": true,
    "defaultCurrency": "NGN",
    "cashEnabled": true,
    "bankTransferEnabled": true,
    "podEnabled": true,
    "podMaxAmount": 500000,
    "podFee": 500,
    "podExcludedStates": ["Borno", "Yobe", "Adamawa"]
  }
}
```

### 3.2 Payment Methods (`/api/commerce/payments/methods`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commerce/payments/methods` | List all methods |
| GET | `/api/commerce/payments/methods?amount=50000&state=Lagos` | Get available methods for amount |
| POST | `/api/commerce/payments/methods` | Check specific method & calculate total |

**Sample Response (GET with amount):**
```json
{
  "methods": [
    {
      "code": "BANK_TRANSFER",
      "name": "Bank Transfer",
      "isAvailable": true,
      "additionalFee": 0,
      "priority": "P0"
    },
    {
      "code": "PAY_ON_DELIVERY",
      "name": "Pay on Delivery",
      "isAvailable": true,
      "additionalFee": 500,
      "priority": "P0"
    }
  ],
  "transactionAmount": 50000,
  "currency": "NGN"
}
```

### 3.3 Bank Transfer (`/api/commerce/payments/transfer`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commerce/payments/transfer?action=banks` | Get Nigerian banks list |
| GET | `/api/commerce/payments/transfer?action=validate-reference&reference=WW-ABC123` | Validate reference format |
| POST | `/api/commerce/payments/transfer` | Initiate bank transfer |
| PUT | `/api/commerce/payments/transfer` | Validate/confirm transfer |

**Sample Response (POST - Initiate):**
```json
{
  "success": true,
  "intent": {
    "id": "...",
    "intentId": "pi_abc123",
    "status": "CREATED",
    "expiresAt": "2025-01-08T12:00:00Z"
  },
  "transfer": {
    "bankName": "GTBank",
    "accountNumber": "0123456789",
    "accountName": "WebWaka Payments",
    "reference": "WW-ABC123-XYZ",
    "amount": 50000,
    "amountFormatted": "₦50,000.00",
    "expiresAt": "2025-01-08T12:00:00Z"
  }
}
```

### 3.4 Proof of Payment (`/api/commerce/payments/proof`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commerce/payments/proof?paymentId=xxx` | Get proof details |
| GET | `/api/commerce/payments/proof?action=pending` | List pending verifications |
| POST | `/api/commerce/payments/proof` | Upload proof attachment |
| PUT | `/api/commerce/payments/proof` | Verify/reject proof (admin) |

**Sample Response (PUT - Verify):**
```json
{
  "success": true,
  "result": {
    "paymentId": "...",
    "status": "VERIFIED",
    "verifiedAt": "2025-01-07T10:30:00Z",
    "verifiedBy": "admin_user_id"
  }
}
```

### 3.5 Partial Payments (`/api/commerce/payments/partial`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commerce/payments/partial?action=status` | Check if enabled |
| GET | `/api/commerce/payments/partial?orderId=xxx` | Get payment summary |
| GET | `/api/commerce/payments/partial?action=chains` | List partial payment chains |
| POST | `/api/commerce/payments/partial` | Record partial payment |

**Sample Response (GET - Summary):**
```json
{
  "orderId": "order_123",
  "totalAmount": 100000,
  "paidAmount": 60000,
  "remainingAmount": 40000,
  "paymentCount": 2,
  "isFullyPaid": false,
  "minimumNextPayment": 4000,
  "payments": [...]
}
```

### 3.6 Payment Status (`/api/commerce/payments/status`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commerce/payments/status?status=CONFIRMED` | Get status display info |
| GET | `/api/commerce/payments/status?transactionNumber=PAY-2501-000001` | Get payment status |
| GET | `/api/commerce/payments/status?orderId=xxx` | Get order payment status |

**Sample Response (GET - by transaction):**
```json
{
  "payment": {
    "transactionNumber": "PAY-2501-000001",
    "amount": 50000,
    "status": "CONFIRMED"
  },
  "display": {
    "text": "Paid",
    "color": "green",
    "description": "Payment completed successfully",
    "icon": "check-circle",
    "customerText": "Paid",
    "badgeClass": "bg-green-100 text-green-800"
  },
  "canRefund": true,
  "canRetry": false,
  "isTerminal": true
}
```

---

## 4. Capability Guard Verification

### 4.1 Guard Implementation

All routes follow this pattern:
```typescript
const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
if (guardResult) return guardResult
```

### 4.2 Unauthorized Behavior (401)

**Request without session:**
```bash
curl https://example.com/api/commerce/payments
```

**Response:**
```json
{"error": "Unauthorized"}
```
Status: `401`

### 4.3 Capability Disabled Behavior (403)

**Request with session but capability disabled:**
```json
{
  "error": "Access denied",
  "capability": "payments",
  "message": "Payments & Wallets is not enabled for this tenant"
}
```
Status: `403`

---

## 5. Guardrails Confirmation

| Rule | Status |
|------|--------|
| All routes capability-guarded | ✅ |
| Tenant-scoped operations | ✅ |
| Thin controllers (delegate to S3) | ✅ |
| No gateway SDK calls | ✅ |
| No webhooks | ✅ |
| No background jobs | ✅ |
| No settlement/reconciliation | ✅ |
| No UI changes | ✅ |

---

## 6. Directory Structure (Final)

```
/app/frontend/src/app/api/commerce/payments/
├── route.ts                    # Main config (GET, POST)
├── methods/
│   └── route.ts               # Method availability (GET, POST)
├── transfer/
│   └── route.ts               # Bank transfer (GET, POST, PUT)
├── proof/
│   └── route.ts               # Proof-of-payment (GET, POST, PUT)
├── partial/
│   └── route.ts               # Partial payments (GET, POST)
└── status/
    └── route.ts               # Status resolution (GET)
```

---

## 7. S5 Readiness

With S4 complete, the API layer now exposes:
- Payment configuration management
- Payment method availability with Nigeria-first priorities
- Bank transfer initiation and validation
- Proof-of-payment workflow
- Partial payment tracking
- Status resolution and display

**Ready for S5 (Demo Page) authorization.**

---

## 8. Files Created

| File | Lines | Endpoints |
|------|-------|-----------|
| `route.ts` | ~150 | 2 |
| `methods/route.ts` | ~130 | 2 |
| `transfer/route.ts` | ~160 | 3 |
| `proof/route.ts` | ~150 | 3 |
| `partial/route.ts` | ~160 | 2 |
| `status/route.ts` | ~120 | 3 |

**Total New Lines: ~870**

---

*Document prepared under PC-SCP guidelines*  
*S4 API Exposure — COMPLETE*
