# Partner Attribution & Tenant Linking

## Version
**Document Version:** 1.0.0  
**Date:** 2025-01-01  
**Status:** Implemented

---

## Overview

This document describes the Partner-to-Tenant attribution system and Partner-assisted tenant creation flow.

### Key Principles

1. **Immutability**: Attribution cannot be changed once created
2. **No Retroactive Reassignment**: Tenants cannot be reassigned to different partners
3. **Explicit Rules**: Attribution windows are clearly defined (lifetime vs time-bound)
4. **Audit Trail**: All attribution actions are logged

---

## Attribution Model

### What is Attribution?

Attribution is the permanent link between a Partner and a Tenant that determines commission eligibility.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ATTRIBUTION LIFECYCLE                        │
│                                                                  │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   │
│  │   CREATED   │ ───▶  │   ACTIVE    │ ───▶  │   LOCKED    │   │
│  │             │       │             │       │             │   │
│  │  Immutable  │       │  Immutable  │       │  PERMANENT  │   │
│  │  from start │       │  but not    │       │  Cannot     │   │
│  │             │       │  locked yet │       │  modify or  │   │
│  │             │       │             │       │  delete     │   │
│  └─────────────┘       └─────────────┘       └─────────────┘   │
│                                                                  │
│  Trigger: Creation       Trigger: N/A       Trigger: First      │
│                                             successful billing   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Attribution Methods

| Method | Description | Trigger |
|--------|-------------|---------|
| `PARTNER_CREATED` | Partner directly created the tenant | Partner Portal API |
| `REFERRAL_LINK` | Tenant signed up via referral code/link | Signup with code |
| `MANUAL_ASSIGNMENT` | Super Admin manually assigned | Admin action (rare) |

---

## Data Constraints

### Database Schema

```prisma
model PartnerReferral {
  id                String    @id @default(uuid())
  partnerId         String
  tenantId          String    @unique  // ONE tenant = ONE attribution
  referralCodeId    String?
  
  // Attribution method
  attributionMethod AttributionMethod @default(REFERRAL_LINK)
  
  // Timestamps - IMMUTABLE
  referredAt        DateTime  @default(now())
  
  // Attribution window
  attributionWindowDays Int?       // null = lifetime
  attributionExpiresAt  DateTime?  // Calculated expiry
  
  // Lock flag - PERMANENT once set
  attributionLocked Boolean @default(false)
  lockedAt          DateTime?
  
  // NO updatedAt - intentionally immutable
}
```

### Key Constraints

| Constraint | Enforcement Level | Description |
|------------|-------------------|-------------|
| One attribution per tenant | Database (@@unique) | `tenantId` has unique constraint |
| No partner change | Application | Reassignment blocked and logged |
| No modification after lock | Application | All updates blocked after `attributionLocked = true` |
| No deletion | Database (onDelete: Restrict) | Referral cannot be deleted |

---

## Validation Logic

### Attribution Creation

```typescript
// Validation checks performed:
1. Tenant exists
2. Tenant does NOT already have attribution
3. Partner exists
4. Partner status is ACTIVE
5. If referral code provided:
   - Code exists
   - Code belongs to this partner
   - Code is active
   - Code has not exceeded usage limit
   - Code has not expired
```

### Attribution Lock Protection

```typescript
// Before any modification attempt:
async function assertAttributionModifiable(tenantId: string): Promise<void> {
  const referral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { attributionLocked: true, lockedAt: true }
  })
  
  if (referral?.attributionLocked) {
    // Log the attempted modification
    await prisma.auditLog.create({
      data: {
        action: 'ATTRIBUTION_LOCK_ATTEMPTED',
        // ... details
      }
    })
    
    throw new AttributionLockedError(
      `Attribution is locked and cannot be modified.`
    )
  }
}
```

### Reassignment Prevention

```typescript
// Before any partner change:
async function assertNoReassignment(tenantId: string, newPartnerId: string): Promise<void> {
  const existingReferral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { partnerId: true }
  })
  
  if (existingReferral && existingReferral.partnerId !== newPartnerId) {
    // Log blocked reassignment
    await prisma.auditLog.create({
      data: {
        action: 'ATTRIBUTION_REASSIGN_BLOCKED',
        // ... details
      }
    })
    
    throw new AttributionReassignmentError(
      `Reassignment is not allowed.`
    )
  }
}
```

---

## Attribution Window Rules

### Lifetime Attribution (Default)

- `attributionWindowDays = null`
- Partner earns commissions for the lifetime of the tenant
- Most common for standard partnerships

### Time-Bound Attribution

- `attributionWindowDays = N` (e.g., 365 for 1 year)
- `attributionExpiresAt` calculated at creation time
- Partner earns commissions only within the window
- After expiry, no new earnings are generated
- Existing earnings are NOT affected

```typescript
// Checking if attribution is valid for earnings:
async function isAttributionValidForEarnings(tenantId: string): Promise<boolean> {
  const referral = await prisma.partnerReferral.findUnique({
    where: { tenantId },
    select: { 
      attributionExpiresAt: true,
      partner: { select: { status: true } }
    }
  })
  
  if (!referral) return false
  if (referral.partner.status !== 'ACTIVE') return false
  
  // Check attribution window
  if (referral.attributionExpiresAt && referral.attributionExpiresAt < new Date()) {
    return false  // Attribution expired
  }
  
  return true
}
```

---

## Partner-Assisted Tenant Creation

### Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│              PARTNER-ASSISTED TENANT CREATION                    │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ 1. Partner      │                                            │
│  │    Portal       │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     Tenant: PENDING_ACTIVATION             │
│  │ 2. Create       │     Attribution: PARTNER_CREATED           │
│  │    Tenant       │     Modules: requestedModules[]            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     Email sent to contactEmail             │
│  │ 3. Invitation   │     Contains signup link                   │
│  │    Sent         │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     Tenant completes profile               │
│  │ 4. Tenant       │     Selects subscription plan              │
│  │    Signup       │     Makes payment                          │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     Tenant: ACTIVE                         │
│  │ 5. Activation   │     Modules: activatedModules[]            │
│  │                 │     Attribution: LOCKED                    │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Partner Creates Tenant

```typescript
POST /api/partners/{partnerId}/tenants

{
  "name": "Acme Corporation",
  "slug": "acme",
  "contactEmail": "admin@acme.com",
  "contactName": "John Doe",
  "requestedModules": ["POS", "SVM"],
  "branding": {
    "appName": "Acme App",
    "primaryColor": "#4F46E5"
  },
  "attributionWindowDays": null  // lifetime
}
```

**Response:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Acme Corporation",
    "slug": "acme",
    "status": "PENDING_ACTIVATION",
    "requestedModules": ["POS", "SVM"]
  },
  "attribution": {
    "id": "uuid",
    "method": "PARTNER_CREATED",
    "isLifetime": true
  },
  "invitationUrl": "https://app.example.com/signup/complete?tenant=acme&email=..."
}
```

### Step 2-4: Tenant Completes Signup

- Tenant receives email with invitation link
- Opens signup flow, creates account
- Selects subscription plan
- Makes payment

### Step 5: System Activates Tenant

```typescript
// Called by subscription system after payment
await activateTenant({
  tenantId: "uuid",
  userId: "user-uuid",  // User who completed signup
  activatedModules: ["POS", "SVM"],
  paymentReference: "sub_xxx"
})
```

**Effects:**
1. Tenant status → `ACTIVE`
2. `activatedModules` populated
3. `activatedAt` timestamp set
4. User gets `TENANT_ADMIN` role
5. Attribution gets `LOCKED`

---

## API Reference

### Attribution APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attribution` | POST | Create attribution via referral code |
| `/api/attribution?tenantId=xxx` | GET | Get attribution for tenant |
| `/api/attribution/lock` | POST | Lock attribution (internal) |

### Partner Tenant APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/partners/{id}/tenants` | POST | Create tenant in PENDING state |
| `/api/partners/{id}/tenants` | GET | List partner's tenants |

---

## Audit Actions

| Action | When Logged |
|--------|-------------|
| `ATTRIBUTION_CREATED` | New attribution link created |
| `ATTRIBUTION_LOCKED` | Attribution locked after first billing |
| `ATTRIBUTION_LOCK_ATTEMPTED` | Failed attempt to modify locked attribution |
| `ATTRIBUTION_REASSIGN_BLOCKED` | Blocked attempt to reassign tenant |
| `PARTNER_TENANT_CREATED` | Partner created tenant in PENDING state |
| `PARTNER_TENANT_ACTIVATED` | Tenant completed signup and activated |

---

## Constraints Summary

### What Partners CAN Do
- ✅ Create tenants in PENDING_ACTIVATION state
- ✅ Select modules for tenant to request
- ✅ Set attribution window (lifetime or time-bound)
- ✅ View their created tenants and status

### What Partners CANNOT Do
- ❌ Bypass subscription/payment requirements
- ❌ Activate modules without tenant payment
- ❌ Access tenant internal data after creation
- ❌ Change attribution after creation
- ❌ Delete or modify locked attributions

### Tenant Ownership
After activation:
- Tenant is **first-class owner** of their workspace
- Tenant controls all settings, users, data
- Partner has **zero access** to tenant internals
- Partner only sees limited metadata (name, status, signup date)

---

## Implementation Files

| File | Description |
|------|-------------|
| `/src/lib/partner-attribution.ts` | Attribution service |
| `/src/lib/partner-tenant-creation.ts` | Partner tenant creation service |
| `/src/app/api/attribution/route.ts` | Attribution API |
| `/src/app/api/attribution/lock/route.ts` | Lock API (internal) |
| `/src/app/api/partners/[partnerId]/tenants/route.ts` | Partner tenant API |

---

## Verification Checklist

### Attribution Immutability ✅

- [x] Attribution cannot be changed after creation
- [x] No silent changes - all attempts logged
- [x] No retroactive reassignment
- [x] Locked attributions are permanent

### Partner-Assisted Creation ✅

- [x] Partner cannot bypass subscription rules
- [x] Partner cannot activate modules without payment
- [x] Tenant is first-class owner after creation
- [x] Attribution set immediately at creation

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial implementation |
