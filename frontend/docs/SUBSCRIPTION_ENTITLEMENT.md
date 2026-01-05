# Subscription & Entitlement System

## Version
**Document Version:** 1.0.0  
**Date:** 2025-01-01  
**Status:** Implemented

---

## Overview

This document describes the Subscription and Entitlement system for the SaaS Core.

### Key Principles

1. **Subscriptions have OPTIONAL Partner attribution** - Not all subscriptions have partners
2. **Modules check entitlements, NOT subscriptions** - Clean abstraction
3. **Partner/commission logic does NOT leak into modules** - Separation of concerns
4. **Events are module-agnostic** - They don't know about specific modules

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUBSCRIPTION LAYER                           │
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │  Subscription   │────▶│ SubscriptionPlan│                    │
│  │                 │     │                 │                    │
│  │  - tenantId     │     │  - modules[]    │                    │
│  │  - planId       │     │  - pricing      │                    │
│  │  - status       │     │                 │                    │
│  │  - partnerRef?  │     └─────────────────┘                    │
│  └────────┬────────┘                                            │
│           │                                                      │
│           │ creates                                              │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │  Entitlement    │     │ SubscriptionEvent│                   │
│  │                 │     │                 │                    │
│  │  - module       │     │  - eventType    │                    │
│  │  - status       │     │  - partnerId?   │                    │
│  │  - validUntil   │     │  - modules[]    │                    │
│  │  - limits       │     │  - amount       │                    │
│  └─────────────────┘     └─────────────────┘                    │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ emits events to
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COMMISSION ENGINE (Phase 4)                  │
│                                                                  │
│  Listens to: SUBSCRIPTION_ACTIVATED, SUBSCRIPTION_RENEWED       │
│  Calculates: Partner commissions based on billingAmount         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     MODULE LAYER (Clean!)                        │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │      POS        │  │      SVM        │  │      MVM        │ │
│  │                 │  │                 │  │                 │ │
│  │  Only checks:   │  │  Only checks:   │  │  Only checks:   │ │
│  │  hasModuleAccess│  │  hasModuleAccess│  │  hasModuleAccess│ │
│  │                 │  │                 │  │                 │ │
│  │  NO knowledge   │  │  NO knowledge   │  │  NO knowledge   │ │
│  │  of:            │  │  of:            │  │  of:            │ │
│  │  - Subscriptions│  │  - Subscriptions│  │  - Subscriptions│ │
│  │  - Partners     │  │  - Partners     │  │  - Partners     │ │
│  │  - Commissions  │  │  - Commissions  │  │  - Commissions  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema

### Subscription Plan

```prisma
model SubscriptionPlan {
  id              String   @id
  name            String   // "Starter", "Professional"
  slug            String   @unique
  priceMonthly    Decimal
  priceYearly     Decimal
  includedModules String[] // ["POS", "SVM", "MVM"]
  maxUsers        Int?
  trialDays       Int      @default(14)
}
```

### Subscription

```prisma
model Subscription {
  id                 String             @id
  tenantId           String             @unique  // One per tenant
  planId             String
  status             SubscriptionStatus
  billingInterval    BillingInterval
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  amount             Decimal
  partnerReferralId  String?            // OPTIONAL - may be null
}
```

### Entitlement

```prisma
model Entitlement {
  id             String            @id
  tenantId       String
  subscriptionId String?
  module         String            // "POS", "SVM", "MVM"
  status         EntitlementStatus // ACTIVE, SUSPENDED, EXPIRED
  validUntil     DateTime?
  limits         Json?
  source         String            // "subscription", "addon", "promo"
  
  @@unique([tenantId, module])
}
```

### Subscription Event

```prisma
model SubscriptionEvent {
  id              String                @id
  subscriptionId  String
  eventType       SubscriptionEventType
  tenantId        String
  partnerId       String?               // OPTIONAL - null if no partner
  modules         String[]
  billingAmount   Decimal?
  billingCurrency String?
  billingInterval BillingInterval?
  periodStart     DateTime?
  periodEnd       DateTime?
  metadata        Json?
  occurredAt      DateTime
}
```

---

## Entitlement API

### Module Access Check (USE THIS IN MODULES)

```typescript
import { hasModuleAccess } from '@/lib/entitlements'

// In your module:
export async function processTransaction(tenantId: string, data: any) {
  // Check entitlement - ONE LINE
  const access = await hasModuleAccess(tenantId, 'POS')
  
  if (!access.hasAccess) {
    throw new Error('POS module not available')
  }
  
  // Process transaction...
}
```

### Multiple Module Check

```typescript
import { getModuleAccess } from '@/lib/entitlements'

const access = await getModuleAccess(tenantId, ['POS', 'SVM'])

if (access.POS.hasAccess && access.SVM.hasAccess) {
  // Has both modules
}
```

### Require Module (Throws on Failure)

```typescript
import { requireModuleAccess } from '@/lib/entitlements'

export async function POST(request: Request) {
  const tenantId = getTenantId(request)
  
  // Throws ModuleNotEntitledError if not entitled
  await requireModuleAccess(tenantId, 'POS')
  
  // ... rest of handler
}
```

### Check Limits

```typescript
import { getModuleLimit } from '@/lib/entitlements'

const maxTransactions = await getModuleLimit(tenantId, 'POS', 'maxTransactions')

if (currentCount >= maxTransactions) {
  throw new Error('Transaction limit reached')
}
```

---

## Subscription Lifecycle Events

### Required Events

| Event | When Emitted | Required Fields |
|-------|--------------|-----------------|
| `SUBSCRIPTION_CREATED` | After subscription created | tenantId, modules, billingAmount |
| `SUBSCRIPTION_ACTIVATED` | After first payment | tenantId, modules, billingAmount |
| `SUBSCRIPTION_RENEWED` | After renewal payment | tenantId, modules, billingAmount, periodStart, periodEnd |
| `SUBSCRIPTION_CANCELLED` | After cancellation | tenantId, modules |

### Event Schema

```typescript
interface SubscriptionEventPayload {
  eventType: SubscriptionEventType
  subscriptionId: string
  
  // Core identifiers
  tenantId: string
  partnerId: string | null  // OPTIONAL
  
  // Module info (module-agnostic)
  modules: string[]
  
  // Billing info
  billingAmount: number | null
  billingCurrency: string | null
  billingInterval: BillingInterval | null
  
  // Period info
  periodStart: Date | null
  periodEnd: Date | null
  
  // Additional context
  metadata?: Record<string, any>
}
```

### Event Emission Points

```
Subscription Created
        │
        ▼
 emit SUBSCRIPTION_CREATED
        │
        │ (tenant makes payment)
        ▼
 emit SUBSCRIPTION_ACTIVATED
        │
        │ (period ends, payment succeeds)
        ▼
 emit SUBSCRIPTION_RENEWED ─────────────┐
        │                               │
        │ (OR cancellation)             │ (loop)
        ▼                               │
 emit SUBSCRIPTION_CANCELLED            │
                                        │
 ◀──────────────────────────────────────┘
```

---

## Partner Attribution in Subscriptions

### How It Works

1. When subscription is created, system checks if tenant has partner referral
2. If referral exists, `partnerReferralId` is set on subscription
3. All events include `partnerId` from the referral (or `null`)
4. Commission Engine (Phase 4) listens to events and calculates earnings

### Partner ID is OPTIONAL

```typescript
// Event with partner
{
  eventType: 'SUBSCRIPTION_RENEWED',
  tenantId: 'tenant-123',
  partnerId: 'partner-456',  // Has partner
  billingAmount: 99.00,
  // ...
}

// Event without partner
{
  eventType: 'SUBSCRIPTION_RENEWED',
  tenantId: 'tenant-789',
  partnerId: null,  // No partner - that's fine!
  billingAmount: 99.00,
  // ...
}
```

### No Partner Logic in Modules

```typescript
// ❌ WRONG - Module knows about partners
async function processTransaction(tenantId: string) {
  const partner = await getPartnerForTenant(tenantId)  // DON'T DO THIS
  if (partner) {
    await trackCommission(partner, amount)  // DON'T DO THIS
  }
}

// ✅ CORRECT - Module only checks entitlement
async function processTransaction(tenantId: string) {
  const access = await hasModuleAccess(tenantId, 'POS')
  if (!access.hasAccess) {
    throw new Error('Not entitled')
  }
  // Just process the transaction
}
```

---

## Event Listening (For Commission Engine)

```typescript
import { 
  onSubscriptionEvent, 
  COMMISSION_TRIGGERING_EVENTS 
} from '@/lib/subscription-events'

// In Commission Engine (Phase 4):
onSubscriptionEvent('SUBSCRIPTION_RENEWED', async (event) => {
  if (!event.partnerId) return  // No partner, skip
  
  await calculateCommission({
    partnerId: event.partnerId,
    amount: event.billingAmount,
    tenantId: event.tenantId,
    period: {
      start: event.periodStart,
      end: event.periodEnd
    }
  })
})
```

---

## API Reference

### Subscription Service

| Function | Description |
|----------|-------------|
| `createSubscription(input)` | Create new subscription |
| `activateSubscription(id)` | Activate after payment |
| `renewSubscription(id)` | Renew for new period |
| `cancelSubscription(id, options)` | Cancel subscription |
| `getSubscription(tenantId)` | Get tenant's subscription |
| `getActivePlans()` | List available plans |

### Entitlement Service

| Function | Description |
|----------|-------------|
| `hasModuleAccess(tenantId, module)` | Check single module access |
| `getModuleAccess(tenantId, modules[])` | Check multiple modules |
| `requireModuleAccess(tenantId, module)` | Require access (throws) |
| `getModuleLimit(tenantId, module, key)` | Get limit value |
| `getAllEntitlements(tenantId)` | Get all active entitlements |
| `getActiveModules(tenantId)` | Get list of active modules |

### Event Service

| Function | Description |
|----------|-------------|
| `emitSubscriptionEvent(payload)` | Emit an event |
| `onSubscriptionEvent(type, listener)` | Register listener |
| `getSubscriptionEvents(subscriptionId)` | Query events |
| `getPartnerEvents(partnerId, options)` | Get partner's events |
| `getBillableEvents(partnerId, start, end)` | Get billable events |

---

## Verification Checklist

### Modules Only Read Entitlements ✅

- [x] Entitlement service provides clean abstraction
- [x] `hasModuleAccess()` is the only function modules need
- [x] Modules have no access to subscription internals
- [x] Modules have no access to partner information

### No Commission Logic in Modules ✅

- [x] Commission calculation is NOT in module code
- [x] Modules don't know about partner relationships
- [x] Events are emitted for commission engine (Phase 4)

### Events are Module-Agnostic ✅

- [x] Events contain `modules[]` array, not specific module logic
- [x] Same event structure for all modules
- [x] Events don't trigger module-specific behavior

### Partner ID is Optional ✅

- [x] `partnerId` can be `null` in events
- [x] System works without any partner attribution
- [x] No errors when subscription has no partner

---

## Implementation Files

| File | Description |
|------|-------------|
| `/prisma/schema.prisma` | Subscription & Entitlement models |
| `/src/lib/entitlements.ts` | Entitlement service (for modules) |
| `/src/lib/subscription.ts` | Subscription service |
| `/src/lib/subscription-events.ts` | Event definitions & emission |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial implementation |
