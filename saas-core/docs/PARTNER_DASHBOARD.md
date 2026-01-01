# Partner Dashboard System

## Version
**Document Version:** 1.0.0  
**Date:** 2025-01-01  
**Status:** Implemented

---

## Overview

This document describes the Partner Dashboard system providing read-only visibility into partner data.

### Key Principles

1. **Partner sees ONLY their data** - Strict partner-scoping
2. **NO tenant internals** - Limited tenant data only
3. **NO module internals** - No module-specific data
4. **Read-only visibility** - No write operations
5. **Aggregated metrics** - Performance data is summarized

---

## Data Visibility Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                     PARTNER DASHBOARD                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PARTNER CAN SEE                             │    │
│  │                                                          │    │
│  │   ✅ Own partner profile                                │    │
│  │   ✅ Own agreement terms                                │    │
│  │   ✅ Own referrals (limited tenant data)               │    │
│  │   ✅ Own earnings (aggregated)                          │    │
│  │   ✅ Own performance metrics                            │    │
│  │   ✅ Own payout status                                  │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ════════════════════════ HARD BOUNDARY ═════════════════════   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PARTNER CANNOT SEE                          │    │
│  │                                                          │    │
│  │   ❌ Other partners' data                               │    │
│  │   ❌ Tenant users or members                            │    │
│  │   ❌ Tenant settings or branding                        │    │
│  │   ❌ Tenant domains                                     │    │
│  │   ❌ Module data (POS, SVM, MVM internals)             │    │
│  │   ❌ Platform-wide metrics                              │    │
│  │   ❌ Other tenants (not referred by them)               │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Data Contracts

### Overview Response

```typescript
interface PartnerDashboardOverview {
  partner: PartnerInfo
  summary: DashboardSummary
  earnings: EarningsSummary
  referrals: ReferralsSummary
  recentActivity: ActivityItem[]
}
```

### Partner Info (Safe to Display)

```typescript
interface PartnerInfo {
  id: string
  name: string
  slug: string
  status: string
  tier: string
  joinedAt: Date
  currentAgreement: {
    version: number
    commissionRate: number
    commissionType: string
    effectiveFrom: Date
  } | null
}
```

### Dashboard Summary

```typescript
interface DashboardSummary {
  totalReferrals: number
  activeReferrals: number
  pendingReferrals: number
  
  totalEarnings: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  
  currentBalance: number
  pendingClearance: number
  
  currency: string
}
```

### Referred Tenant Info (LIMITED DATA)

```typescript
interface ReferredTenantInfo {
  referralId: string
  
  // LIMITED tenant data only
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantStatus: string  // ACTIVE, PENDING, etc.
  
  // Attribution info
  referredAt: Date
  attributionMethod: string
  isLifetime: boolean
  attributionExpiresAt: Date | null
  
  // Revenue (aggregated)
  totalRevenue: number
  lastPaymentDate: Date | null
  
  // ❌ NOT included:
  // - tenantUsers
  // - tenantSettings
  // - tenantDomains
  // - moduleData
}
```

---

## API Endpoints

### Dashboard Overview

```
GET /api/partners/{partnerId}/dashboard
```

**Response:**
```json
{
  "partner": {
    "id": "partner_001",
    "name": "Acme Partners",
    "status": "ACTIVE",
    "tier": "GOLD"
  },
  "summary": {
    "totalReferrals": 25,
    "activeReferrals": 20,
    "totalEarnings": 5000.00,
    "currentBalance": 750.00
  },
  "earnings": { ... },
  "referrals": { ... },
  "recentActivity": [ ... ]
}
```

### Performance Metrics

```
GET /api/partners/{partnerId}/dashboard/performance?start=2025-01-01&end=2025-12-31
```

**Response:**
```json
{
  "partnerId": "partner_001",
  "period": { "start": "2025-01-01", "end": "2025-12-31" },
  "conversionRate": 80.0,
  "totalRevenue": 5000.00,
  "averageRevenuePerReferral": 200.00,
  "retentionRate": 85.0,
  "churnRate": 15.0,
  "growthRate": 25.0,
  "monthlyRevenue": [ ... ],
  "monthlyReferrals": [ ... ]
}
```

### Referrals List

```
GET /api/partners/{partnerId}/dashboard/referrals?status=ACTIVE&limit=20&offset=0
```

**Response:**
```json
{
  "tenants": [
    {
      "referralId": "ref_001",
      "tenantId": "tenant_001",
      "tenantName": "Acme Corp",
      "tenantSlug": "acme",
      "tenantStatus": "ACTIVE",
      "referredAt": "2025-01-15",
      "totalRevenue": 250.00
    }
  ],
  "total": 25,
  "_notice": "Limited tenant data only - no internal details exposed"
}
```

---

## UI Outline (No Styling)

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Partner Dashboard                                    [Profile ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Total       │ │ Active      │ │ This Month  │ │ Balance     ││
│  │ Referrals   │ │ Referrals   │ │ Earnings    │ │             ││
│  │     25      │ │     20      │ │   $750.00   │ │   $550.00   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Earnings Overview                                                │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ [Chart: Monthly Earnings Trend - Last 6 Months]           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Pending: $200.00 | Cleared: $250.00 | Paid: $4,500.00          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Recent Referrals                                    [View All →] │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Name          │ Status │ Referred    │ Revenue            │   │
│ ├───────────────┼────────┼─────────────┼────────────────────┤   │
│ │ Acme Corp     │ Active │ Jan 15 2025 │ $250.00            │   │
│ │ Beta Inc      │ Active │ Jan 10 2025 │ $180.00            │   │
│ │ Gamma LLC     │ Pending│ Jan 05 2025 │ $0.00              │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Recent Activity                                                  │
│ • Commission Earned - Acme Corp - $25.00         2 hours ago    │
│ • New Referral - Delta Co                        Yesterday      │
│ • Payout Approved - Batch PO-2025-000001         3 days ago     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Referrals Page

```
┌─────────────────────────────────────────────────────────────────┐
│ My Referrals                                                     │
├─────────────────────────────────────────────────────────────────┤
│ Filter: [All ▼] [Active ▼] [Sort: Recent ▼]        Total: 25    │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Tenant        │ Status  │ Referred   │ Attribution │Revenue│   │
│ ├───────────────┼─────────┼────────────┼─────────────┼───────┤   │
│ │ Acme Corp     │ Active  │ Jan 15     │ Lifetime    │ $250  │   │
│ │ Beta Inc      │ Active  │ Jan 10     │ Lifetime    │ $180  │   │
│ │ Gamma LLC     │ Pending │ Jan 05     │ 12 months   │ $0    │   │
│ │ Delta Co      │ Active  │ Dec 20     │ Lifetime    │ $320  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [← Prev] Page 1 of 3 [Next →]                                   │
│                                                                  │
│ ⚠️ Note: Only basic tenant information is shown.                │
│    Tenant internal data is not accessible.                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Earnings Page

```
┌─────────────────────────────────────────────────────────────────┐
│ My Earnings                                                      │
├─────────────────────────────────────────────────────────────────┤
│ Balance Summary                                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Pending     │ │ Cleared     │ │ Approved    │ │ Paid (All)  ││
│ │ $200.00     │ │ $250.00     │ │ $100.00     │ │ $4,500.00   ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ Earnings History                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Date       │ Tenant    │ Amount  │ Status  │ Paid Date    │   │
│ ├────────────┼───────────┼─────────┼─────────┼──────────────┤   │
│ │ Jan 15     │ Acme Corp │ $25.00  │ Pending │ -            │   │
│ │ Jan 01     │ Beta Inc  │ $18.00  │ Cleared │ -            │   │
│ │ Dec 15     │ Delta Co  │ $32.00  │ Paid    │ Dec 31       │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

### Partner Sees ONLY Their Data ✅

- [x] Dashboard queries are partner-scoped
- [x] No cross-partner data leakage
- [x] Authorization checked on every request

### No Tenant Internals ✅

- [x] Only limited tenant fields exposed
- [x] No tenant users/members
- [x] No tenant settings/branding
- [x] No tenant domains

### No Module Internals ✅

- [x] No POS transaction data
- [x] No SVM inventory data
- [x] No MVM vendor data
- [x] Only aggregated revenue

---

## Implementation Files

| File | Description |
|------|-------------|
| `/src/lib/partner-dashboard.ts` | Dashboard data service |
| `/src/app/api/partners/[partnerId]/dashboard/route.ts` | Dashboard API |
| `/src/app/api/partners/[partnerId]/dashboard/performance/route.ts` | Metrics API |
| `/src/app/api/partners/[partnerId]/dashboard/referrals/route.ts` | Referrals API |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial implementation |
