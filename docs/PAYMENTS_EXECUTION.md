# Payment Execution Layer

**Phase E1.2: Transaction Execution**

This document describes the platform-wide payment execution layer that enables all suites to process payments through a unified interface.

## Architecture Overview

The payment system is organized into three distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     SUITE LAYER                              │
│  (SVM, POS, Forms, etc.)                                     │
│  Uses PaymentExecutionService to initiate/verify payments   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               PAYMENT EXECUTION (E1.2)                       │
│  • PaymentExecutionService - Orchestrates transactions      │
│  • TransactionService - Persists transaction records        │
│  • Demo mode support - Testing without real payments        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               PAYMENT PROVIDER (E1.1)                        │
│  • PaymentCapabilityService - Checks availability           │
│  • PaystackAdapter - Provider-specific implementation       │
│  • Credential management - Encrypted storage                │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### PaymentExecutionService

The main entry point for all payment operations.

```typescript
import { PaymentExecutionService } from '@/lib/payment-execution'

// Check if payments are available
const availability = await PaymentExecutionService.isAvailable(partnerId)
// Returns: { available: boolean, provider: string | null, reason?: string }

// Initiate a payment
const result = await PaymentExecutionService.initiatePayment({
  tenantId: 'tenant-123',
  partnerId: 'partner-456',
  amount: 5000,
  currency: 'NGN',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  sourceModule: 'svm',
  sourceType: 'order',
  sourceId: 'order-789'
})

// Verify a payment
const verification = await PaymentExecutionService.verifyPayment({
  tenantId: 'tenant-123',
  partnerId: 'partner-456',
  reference: result.reference
})

// List transactions
const transactions = await PaymentExecutionService.listTransactions({
  tenantId: 'tenant-123',
  status: 'SUCCESS',
  limit: 20
})
```

### TransactionService

Low-level service for direct transaction record management.

```typescript
import { TransactionService } from '@/lib/payment-execution'

// Get transaction by reference
const tx = await TransactionService.getByReference('TXN-ABC123')

// Get transaction summary
const summary = await TransactionService.getSummary('tenant-123')
// Returns: { totalCount, totalAmount, successCount, successAmount, ... }
```

## API Endpoints

### Check Availability

```
GET /api/payments/availability?partnerId=xxx
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "provider": "paystack",
  "reason": null
}
```

### Initiate Payment

```
POST /api/payments/initiate
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "partnerId": "partner-456",
  "amount": 5000,
  "currency": "NGN",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "sourceModule": "svm",
  "sourceType": "order",
  "sourceId": "order-789",
  "callbackUrl": "https://app.example.com/payment/callback",
  "metadata": { "orderId": "order-789" }
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid",
  "reference": "TXN-ABC123-XYZ",
  "status": "PENDING",
  "authorizationUrl": "https://checkout.paystack.com/xxx",
  "accessCode": "xxx",
  "provider": "paystack",
  "isDemo": false
}
```

### Verify Payment

```
POST /api/payments/verify
```

**Request Body:**
```json
{
  "tenantId": "tenant-123",
  "partnerId": "partner-456",
  "reference": "TXN-ABC123-XYZ"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "uuid",
  "reference": "TXN-ABC123-XYZ",
  "status": "SUCCESS",
  "amount": 5000,
  "currency": "NGN",
  "fee": 50,
  "netAmount": 4950,
  "channel": "card",
  "paidAt": "2026-01-14T12:00:00Z",
  "provider": "paystack",
  "isDemo": false
}
```

### List Transactions

```
GET /api/payments/transactions?tenantId=xxx&status=SUCCESS&limit=20
```

**Query Parameters:**
- `tenantId` (required): Tenant ID
- `partnerId`: Filter by partner
- `status`: Filter by status (PENDING, SUCCESS, FAILED, etc.)
- `provider`: Filter by provider
- `customerEmail`: Filter by customer email
- `sourceModule`: Filter by source module (svm, pos, forms)
- `sourceType`: Filter by source type (order, invoice)
- `sourceId`: Filter by source ID
- `fromDate`: Filter by date range start (ISO date)
- `toDate`: Filter by date range end (ISO date)
- `includeDemo`: Include demo transactions (default: false)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### Complete Demo Payment (Testing Only)

```
POST /api/payments/demo/complete
```

**Request Body:**
```json
{
  "reference": "TXN-ABC123-XYZ",
  "success": true
}
```

## Transaction States

| Status | Description |
|--------|-------------|
| `PENDING` | Transaction initiated, awaiting customer action |
| `PROCESSING` | Payment in progress with provider |
| `SUCCESS` | Payment completed successfully |
| `FAILED` | Payment failed |
| `ABANDONED` | Customer abandoned payment flow |
| `EXPIRED` | Transaction expired before completion |
| `CANCELLED` | Transaction cancelled |

## Demo Mode

When a partner has Paystack enabled but hasn't configured credentials, the system operates in **demo mode**:

1. Transactions are created with `isDemo: true`
2. A simulated authorization URL is generated
3. Payments can be completed via `/api/payments/demo/complete`
4. No real money is moved

This allows:
- Testing the full payment flow during development
- Demonstrating payment capabilities to potential users
- Validating suite integrations before going live

## Database Schema

### PaymentTransaction Model

```prisma
model PaymentTransaction {
  id                   String                    @id @default(uuid())
  tenantId             String
  partnerId            String
  
  reference            String                    @unique
  providerReference    String?
  
  type                 PaymentTransactionType    @default(PAYMENT)
  status               PaymentTransactionStatus  @default(PENDING)
  provider             String
  
  amount               Decimal                   @db.Decimal(12, 2)
  currency             String                    @default("NGN")
  fee                  Decimal?
  netAmount            Decimal?
  
  customerEmail        String
  customerName         String?
  customerId           String?
  
  sourceModule         String?
  sourceType           String?
  sourceId             String?
  
  authorizationUrl     String?
  accessCode           String?
  channel              String?
  gatewayResponse      String?
  
  initiatedAt          DateTime                  @default(now())
  verifiedAt           DateTime?
  completedAt          DateTime?
  expiredAt            DateTime?
  
  metadata             Json?
  providerMetadata     Json?
  
  errorCode            String?
  errorMessage         String?
  
  isDemo               Boolean                   @default(false)
  
  createdAt            DateTime                  @default(now())
  updatedAt            DateTime                  @updatedAt
}
```

## Suite Integration Guide

### For SVM (Store & Vendor Manager)

```typescript
import { PaymentExecutionService } from '@/lib/payment-execution'

async function processOrderPayment(order: Order) {
  // Check availability first
  const availability = await PaymentExecutionService.isAvailable(order.partnerId)
  
  if (!availability.available) {
    // Show alternative payment methods or message
    return { paymentRequired: true, onlinePaymentAvailable: false }
  }
  
  // Initiate payment
  const result = await PaymentExecutionService.initiatePayment({
    tenantId: order.tenantId,
    partnerId: order.partnerId,
    amount: order.total,
    currency: order.currency,
    customerEmail: order.customer.email,
    customerName: order.customer.name,
    sourceModule: 'svm',
    sourceType: 'order',
    sourceId: order.id,
    callbackUrl: `${process.env.APP_URL}/orders/${order.id}/payment-callback`
  })
  
  if (result.success) {
    // Redirect customer to payment page
    return { paymentUrl: result.authorizationUrl }
  }
  
  return { error: result.error }
}
```

### For Forms (Lead Capture with Payment)

```typescript
import { PaymentExecutionService } from '@/lib/payment-execution'

async function processPaymentForm(submission: FormSubmission) {
  const result = await PaymentExecutionService.initiatePayment({
    tenantId: submission.tenantId,
    partnerId: submission.partnerId,
    amount: submission.paymentAmount,
    currency: 'NGN',
    customerEmail: submission.email,
    customerName: submission.name,
    sourceModule: 'forms',
    sourceType: 'form_submission',
    sourceId: submission.id
  })
  
  return result
}
```

## Security Considerations

1. **Tenant Isolation**: All transactions are scoped to tenantId
2. **Partner Control**: Payments only work when Partner has Paystack enabled
3. **No Direct Provider Access**: Suites use the execution layer, never direct provider APIs
4. **Credential Encryption**: Provider credentials are encrypted (see PAYSTACK_INTEGRATION.md)
5. **Demo Mode Separation**: Demo transactions are clearly marked and excluded by default

## What's NOT Included (Phase E1.2)

The following are explicitly out of scope for this phase:

- ❌ Webhooks for real-time payment notifications
- ❌ Settlement and reconciliation
- ❌ Revenue splitting between platform and partners
- ❌ Partner payouts
- ❌ Refund processing
- ❌ Subscription/recurring payments

These will be addressed in future phases.

## Related Documentation

- [Paystack Integration (E1.1)](./PAYSTACK_INTEGRATION.md) - Provider setup and credentials
