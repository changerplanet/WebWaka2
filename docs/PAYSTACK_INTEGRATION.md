# Paystack Integration (Phase E1.1)

## Overview

This document describes the platform-wide Paystack integration implemented as a capability layer. Paystack is the first payment provider implementation, but the system is designed to support multiple providers (Flutterwave, manual payments, etc.).

## Key Principles

### 1. Capability-Based, Not Vendor-Hardcoded
- Generic payment capability layer
- Paystack is one provider implementation
- Suites call generic `createPaymentIntent()` interface

### 2. Three-Level Control Model

| Level | Control | Description |
|-------|---------|-------------|
| Super Admin | Enable Paystack for Partner | Platform trust gate |
| Partner | Configure Paystack credentials | Partner-owned keys |
| Tenant | Use payments if available | Inherits partner setting |

### 3. Credential-Deferred by Design
- No Paystack keys required at implementation time
- No API calls to Paystack until:
  - Super Admin enables Paystack for Partner
  - Partner saves valid credentials
  - A transaction is attempted

### 4. Safe Defaults
- If Paystack is not enabled:
  - UI shows "Payments not enabled"
  - APIs return clear, non-error responses
  - No crashes, no silent failures

## How It Works

### Super Admin Flow

1. Navigate to Admin → Payment Providers
2. View list of all partners with payment status
3. Click "Enable Paystack" for a partner
4. Partner's status changes to "Awaiting Configuration"

**API Endpoint:** `POST /api/admin/payment-providers`
```json
{
  "partnerId": "partner-uuid"
}
```

### Partner Setup Flow

1. Partner logs into Partner Portal
2. Navigate to Settings → Payments
3. If Paystack is enabled by Super Admin:
   - Enter Paystack Public Key (pk_...)
   - Enter Paystack Secret Key (sk_...)
   - Optionally enter Webhook Secret
   - Choose Test Mode or Live Mode
4. Save credentials
5. Click "Test Connection" (stub in Phase E1.1)

**API Endpoint:** `POST /api/partner/payment-config`
```json
{
  "publicKey": "pk_test_...",
  "secretKey": "sk_test_...",
  "webhookSecret": "whsec_...",
  "testMode": true
}
```

### Tenant Behavior

Tenants automatically inherit payment capability from their Partner:

- **If Partner has Paystack configured:** Payments work seamlessly
- **If Partner hasn't configured:** UI shows "Payments not enabled"
- **If Super Admin disabled:** Same as unconfigured

## Using Payment Capability in Code

### Check Payment Availability

```typescript
import { PaymentCapabilityService } from '@/lib/payment-providers'

// For a tenant
const result = await PaymentCapabilityService.checkAvailability(tenantId)
if (!result.available) {
  console.log('Reason:', result.reason)
}

// For a partner directly
const status = await PaymentCapabilityService.getDisplayStatus(partnerId)
// Returns: { enabled, configured, provider, statusLabel, statusColor }
```

### Initiate a Payment (Stub in Phase E1.1)

```typescript
const result = await PaymentCapabilityService.initiatePayment(tenantId, {
  amount: 5000,
  currency: 'NGN',
  email: 'customer@example.com',
  reference: 'ORDER-001'
})

if (!result.success) {
  // Handle gracefully - show appropriate message
  console.log('Error:', result.error, result.errorCode)
}
```

## Payment Status States

| Status | Description | UI Display |
|--------|-------------|------------|
| `DISABLED` | Super Admin has not enabled | Gray badge |
| `ENABLED_NO_KEYS` | Enabled but no credentials | Yellow badge |
| `ENABLED_CONFIGURED` | Fully configured and ready | Green badge |
| `ENABLED_INVALID` | Keys configured but invalid | Red badge |

## Security: Credential Encryption

Paystack secret keys are encrypted using AES-256-GCM before storage.

### Environment Variable Required

Set the `PAYMENT_ENCRYPTION_KEY` environment variable with a strong, random key:

```bash
PAYMENT_ENCRYPTION_KEY=your-secure-random-key-at-least-32-characters
```

**Important:** 
- **This environment variable is REQUIRED** - the application will throw an error if credentials are configured without it
- This key must be kept secret and backed up securely
- Losing this key means stored credentials cannot be decrypted
- Use a different key for each environment (dev, staging, production)
- The key must be at least 32 characters long

### Encryption Details
- Algorithm: AES-256-GCM (authenticated encryption)
- Key derivation: scrypt with per-encryption salt
- Stored format: base64(salt + iv + authTag + ciphertext)

## Database Schema

### PartnerPaymentConfig

```prisma
model PartnerPaymentConfig {
  id                   String    @id @default(uuid())
  partnerId            String
  provider             String    // 'paystack' | 'flutterwave' | 'manual' | 'none'
  enabledBySuperAdmin  Boolean   @default(false)
  enabledAt            DateTime?
  enabledByUserId      String?
  publicKey            String?
  secretKeyEncrypted   String?   // Encrypted secret key
  webhookSecret        String?
  testMode             Boolean   @default(true)
  configuredAt         DateTime?
  lastValidatedAt      DateTime?
  validationStatus     String?   // 'valid' | 'invalid' | 'pending'
  validationError      String?
  metadata             Json?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@unique([partnerId, provider])
}
```

## Cross-Suite Compatibility

All payment-touching suites have been audited to ensure they:
- Do NOT assume payments are always available
- Handle "payments not enabled" gracefully
- Call the central payment capability service

### Affected Suites
- POS (Point of Sale)
- SVM (Single Vendor Marketplace / Online Store)
- MVM (Multi-Vendor Marketplace)
- Education (Fee management)
- Health (Billing)
- Hospitality (Bookings, Folios)
- Sites & Funnels (Payment forms)

## Future Extension Points (Post E1.1)

### Phase E1.2 - Paystack Transaction Execution
- Live payment initiation
- Transaction verification

### Phase E1.3 - Webhooks
- Webhook receiver endpoint
- Signature verification
- Event processing

### Phase E1.4 - Partner Earnings & Splits
- Revenue tracking per transaction
- Commission calculation
- Payout automation

## Files Changed in Phase E1.1

### New Files
- `frontend/src/lib/payment-providers/types.ts` - Type definitions
- `frontend/src/lib/payment-providers/capability-service.ts` - Central service
- `frontend/src/lib/payment-providers/paystack-adapter.ts` - Paystack adapter
- `frontend/src/lib/payment-providers/admin-service.ts` - Admin functions
- `frontend/src/lib/payment-providers/index.ts` - Module exports
- `frontend/src/app/api/admin/payment-providers/route.ts` - Super Admin API
- `frontend/src/app/api/partner/payment-config/route.ts` - Partner API
- `frontend/src/app/api/partner/payment-config/test/route.ts` - Test connection
- `docs/PAYSTACK_INTEGRATION.md` - This documentation

### Modified Files
- `frontend/prisma/schema.prisma` - Added PartnerPaymentConfig model

## What's NOT Implemented in Phase E1.1

- ❌ Live Paystack charges
- ❌ Webhooks
- ❌ Settlements
- ❌ Payout automation
- ❌ Partner revenue splits
- ❌ Hardcoded Paystack UI in suites

These come in subsequent phases.
