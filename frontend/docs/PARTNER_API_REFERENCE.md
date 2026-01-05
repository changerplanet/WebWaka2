# Partner System API Reference

## Version: saas-core-v1.7.0-partners
## Status: STABLE ✅
## Release Date: 2026-01-01

---

## API Stability Guarantee

All APIs marked as **STABLE** in this document:
- Will not have breaking changes in minor versions
- Will follow semantic versioning for any changes
- Are safe for module consumption

---

## Partner Management APIs

### GET /api/partners/me
**Status:** STABLE ✅

Returns the current user's partner membership.

**Response:**
```json
{
  "success": true,
  "partnerId": "uuid",
  "partner": {
    "id": "uuid",
    "name": "Partner Name",
    "slug": "partner-slug",
    "status": "ACTIVE",
    "tier": "GOLD"
  },
  "role": "PARTNER_OWNER"
}
```

---

## Partner Dashboard APIs

### GET /api/partners/{partnerId}/dashboard
**Status:** STABLE ✅

Returns complete dashboard overview.

**Response:**
```json
{
  "partner": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "status": "ACTIVE|PENDING|SUSPENDED",
    "tier": "BRONZE|SILVER|GOLD|PLATINUM",
    "joinedAt": "ISO8601",
    "currentAgreement": {
      "version": 1,
      "commissionRate": 0.15,
      "commissionType": "PERCENTAGE|FIXED|TIERED|HYBRID",
      "effectiveFrom": "ISO8601"
    }
  },
  "summary": {
    "totalReferrals": 0,
    "activeReferrals": 0,
    "pendingReferrals": 0,
    "totalEarnings": 0.00,
    "thisMonthEarnings": 0.00,
    "lastMonthEarnings": 0.00,
    "currentBalance": 0.00,
    "pendingClearance": 0.00,
    "currency": "USD"
  },
  "earnings": { ... },
  "referrals": { ... },
  "recentActivity": [ ... ]
}
```

### GET /api/partners/{partnerId}/dashboard/performance
**Status:** STABLE ✅

Returns performance metrics for a date range.

**Query Parameters:**
- `start` (required): ISO8601 date
- `end` (required): ISO8601 date

**Response:**
```json
{
  "partnerId": "uuid",
  "period": { "start": "ISO8601", "end": "ISO8601" },
  "conversionRate": 0.0,
  "totalRevenue": 0.00,
  "averageRevenuePerReferral": 0.00,
  "retentionRate": 0.0,
  "churnRate": 0.0,
  "newReferralsThisPeriod": 0,
  "growthRate": 0.0,
  "monthlyRevenue": [
    { "month": "YYYY-MM", "amount": 0.00 }
  ]
}
```

### GET /api/partners/{partnerId}/dashboard/referrals
**Status:** STABLE ✅

Returns paginated list of referred tenants.

**Query Parameters:**
- `status` (optional): Filter by tenant status
- `sortBy` (optional): "referredAt" | "revenue"
- `sortOrder` (optional): "asc" | "desc"
- `limit` (optional): default 20
- `offset` (optional): default 0

**Response:**
```json
{
  "tenants": [
    {
      "referralId": "uuid",
      "tenantId": "uuid",
      "tenantName": "string",
      "tenantSlug": "string",
      "tenantStatus": "ACTIVE|PENDING_ACTIVATION|SUSPENDED",
      "referredAt": "ISO8601",
      "attributionMethod": "PARTNER_CREATED|REFERRAL_LINK|MANUAL_ASSIGNMENT",
      "isLifetime": true,
      "attributionExpiresAt": "ISO8601|null",
      "totalRevenue": 0.00,
      "lastPaymentDate": "ISO8601|null"
    }
  ],
  "total": 0,
  "limit": 20,
  "offset": 0,
  "note": "Limited tenant data only - no internal details exposed"
}
```

### GET /api/partners/{partnerId}/audit
**Status:** STABLE ✅

Returns audit logs for the partner.

**Query Parameters:**
- `start` (optional): ISO8601 date
- `end` (optional): ISO8601 date
- `report` (optional): "activity" for activity report
- `limit` (optional): default 50
- `offset` (optional): default 0

**Response (list mode):**
```json
{
  "entries": [
    {
      "id": "uuid",
      "action": "string",
      "actorId": "uuid",
      "actorEmail": "string",
      "targetType": "string|null",
      "targetId": "string|null",
      "metadata": {},
      "createdAt": "ISO8601"
    }
  ],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

---

## Partner Tenant Management APIs

### POST /api/partners/{partnerId}/tenants
**Status:** STABLE ✅

Create a tenant in PENDING_ACTIVATION state.

**Request Body:**
```json
{
  "name": "string (required)",
  "slug": "string (required)",
  "adminEmail": "string (required)",
  "requestedModules": ["POS", "SVM", "MVM"]
}
```

**Response:**
```json
{
  "success": true,
  "tenant": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "status": "PENDING_ACTIVATION"
  },
  "referral": {
    "id": "uuid",
    "attributionMethod": "PARTNER_CREATED"
  },
  "message": "Tenant created. Awaiting activation after payment."
}
```

### GET /api/partners/{partnerId}/tenants
**Status:** STABLE ✅

List tenants created/referred by this partner.

**Response:**
```json
{
  "success": true,
  "tenants": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "status": "string",
      "referral": {
        "id": "uuid",
        "attributionMethod": "string",
        "referredAt": "ISO8601",
        "isLifetime": true
      }
    }
  ],
  "total": 0
}
```

---

## Library Interfaces (For Module Consumption)

### Entitlements (USE THIS)

**File:** `@/lib/entitlements`

```typescript
// Check if tenant has module access
async function hasModuleAccess(
  tenantId: string, 
  module: 'POS' | 'SVM' | 'MVM'
): Promise<EntitlementCheck>

interface EntitlementCheck {
  hasAccess: boolean
  module: string
  status: EntitlementStatus | null
  validUntil: Date | null
  limits: Record<string, any> | null
  source: string | null
}

// Get all entitlements for a tenant
async function getAllEntitlements(
  tenantId: string
): Promise<ModuleEntitlements>

// Validate feature access within a module
async function checkFeatureLimit(
  tenantId: string,
  module: string,
  feature: string,
  currentUsage: number
): Promise<boolean>
```

---

## DO NOT USE (Internal APIs)

The following are internal to SaaS Core and should NOT be imported by modules:

- `partner-attribution.ts` - Internal attribution logic
- `partner-audit.ts` - Internal audit logging
- `partner-authorization.ts` - Partner access control
- `commission-engine.ts` - Commission calculation
- `earnings-ledger.ts` - Earnings tracking
- `payout-readiness.ts` - Payout preparation
- `subscription.ts` - Subscription management

**Modules should ONLY use `entitlements.ts` for access checks.**

---

## Schema Version

**Current:** v1.7.0

### Partner-Related Models

| Model | Version | Status |
|-------|---------|--------|
| Partner | 1.0 | STABLE |
| PartnerUser | 1.0 | STABLE |
| PartnerAgreement | 1.0 | STABLE |
| PartnerReferralCode | 1.0 | STABLE |
| PartnerReferral | 1.0 | STABLE |
| PartnerEarning | 1.0 | STABLE |
| PartnerPayoutSettings | 1.0 | STABLE |
| PayoutBatch | 1.0 | STABLE |

### Subscription-Related Models

| Model | Version | Status |
|-------|---------|--------|
| SubscriptionPlan | 1.0 | STABLE |
| Subscription | 1.0 | STABLE |
| SubscriptionItem | 1.0 | STABLE |
| Entitlement | 1.0 | STABLE |
| SubscriptionEvent | 1.0 | STABLE |
| Invoice | 1.0 | STABLE |

---

## Breaking Changes Policy

1. **Major version (X.0.0):** May contain breaking changes
2. **Minor version (x.Y.0):** Backward compatible features
3. **Patch version (x.y.Z):** Bug fixes only

Before any breaking change:
- 2-week deprecation notice
- Migration guide provided
- Backward compatibility layer for 1 minor version
