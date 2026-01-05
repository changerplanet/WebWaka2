# Phase 3: Commercial Isolation (Partner-First)

> **Status**: COMPLETE ✅
> **Tag**: Commercial Isolation v1 (Partner-First)
> **Depends On**: Phase 2 (Platform Instances) ✅, Phase 4A (Partner-First) ✅
> **Blocks**: Phase 4B (Partner Monetization)

---

## Overview

Phase 3 introduces **commercial and financial separation** across Platform Instances, under Partner control. This enables Partners to operate multiple commercially independent platforms for a single client organization.

### Core Principle
> Phase 2 = Different platforms (UX boundary)
> Phase 3 = Different businesses (financial boundary)
> Phase 4A = Partners own those businesses (operational boundary)

---

## What Phase 3 Delivers

### 1. Per-Instance Subscriptions (Partner-Controlled)
- Subscriptions scoped to `platformInstanceId`
- Partners control client pricing
- Tenant core access remains active if one instance is suspended
- WebWaka tracks wholesale cost and usage

### 2. Per-Instance Partner Attribution (Authoritative)
- Each Platform Instance has immutable `partnerId`
- Attribution comes from partner who created the instance
- Partners can only see their own instances
- Tenant admins can see all instances

### 3. Soft Financial Isolation (Partner-Centric)
- Shared infrastructure, separate accounting trails
- Per-instance: revenue tracking, wallet balances, commission calculations
- All financial records include `platformInstanceId` + `partnerId`
- No cross-instance wallet mutation

### 4. Instance-Scoped Commissions (Partner Earnings)
- Commission rules defined per Platform Instance
- Earnings calculated per instance
- No automatic payouts (calculation only)
- Partner dashboards show earnings by instance

### 5. Instance-Level Reporting & Analytics
- Default view: Platform Instance level
- Tenant aggregate (tenant admin only)
- Partner aggregate (partner admin only)
- Read-only aggregation, no data duplication

### 6. Admin UX & Safety Controls
- Clear separation: tenant-level vs instance-level settings
- Explicit warnings for instance suspension
- Confirmation dialogs, audit logs
- Progressive disclosure for advanced controls

### 7. Backward Compatibility
- Existing tenants: one instance, one partner, one subscription
- No forced restructuring
- Rollback possible

---

## Database Schema Changes

### Subscription Model Extension
```prisma
model Subscription {
  // PHASE 3: Instance-scoped subscriptions
  platformInstanceId String?  // Optional for backward compat
  platformInstance   PlatformInstance? @relation(...)
  
  // Partner sets pricing for client
  partnerSetPrice    Decimal?  // Price partner charges client
  partnerMargin      Decimal?  // Difference from wholesale
}
```

### PartnerReferral Model Extension
```prisma
model PartnerReferral {
  // PHASE 3: Instance-level attribution
  platformInstanceId String?  // Tracks which instance this referral created
}
```

### New Models

#### InstanceFinancialSummary
```prisma
model InstanceFinancialSummary {
  id                  String   @id
  platformInstanceId  String   @unique
  partnerId           String
  
  // Revenue tracking
  totalRevenue        Decimal
  currentMonthRevenue Decimal
  
  // Commission tracking
  totalCommission     Decimal
  pendingCommission   Decimal
  paidCommission      Decimal
  
  // Balance tracking
  currentBalance      Decimal
  
  // Timestamps
  lastUpdated         DateTime
}
```

#### PartnerInstanceEarning
```prisma
model PartnerInstanceEarning {
  id                  String   @id
  partnerId           String
  platformInstanceId  String
  
  // Transaction reference
  transactionType     String   // "subscription", "transaction", "addon"
  transactionId       String
  
  // Amounts
  grossAmount         Decimal
  commissionRate      Decimal
  commissionAmount    Decimal
  
  // Status
  status              String   // "pending", "approved", "paid"
  
  // Timestamps
  createdAt           DateTime
  approvedAt          DateTime?
  paidAt              DateTime?
}
```

---

## API Endpoints

### Instance Subscriptions
- `GET /api/instances/{id}/subscription` - Get instance subscription
- `POST /api/instances/{id}/subscription` - Create/update subscription (Partner only)
- `PATCH /api/instances/{id}/subscription/suspend` - Suspend instance
- `PATCH /api/instances/{id}/subscription/resume` - Resume instance

### Instance Financials
- `GET /api/instances/{id}/financials` - Instance financial summary
- `GET /api/partner/earnings` - Partner earnings across all instances
- `GET /api/partner/earnings/{instanceId}` - Earnings for specific instance

### Instance Analytics
- `GET /api/instances/{id}/analytics` - Instance-level analytics
- `GET /api/tenant/{id}/analytics/aggregate` - Tenant aggregate (admin only)
- `GET /api/partner/analytics/aggregate` - Partner aggregate

---

## Validation Checklist

- [x] Schema updated with Phase 3 models (InstanceSubscription, InstanceFinancialSummary, PartnerInstanceEarning)
- [x] PlatformInstance extended with createdByPartnerId and suspension fields
- [x] Instance subscription service implemented (create, get, update, suspend, resume, cancel)
- [x] Instance financials service implemented (tracking, earnings, aggregation)
- [x] API endpoints created for subscriptions and financials
- [x] Partner earnings API implemented
- [x] Backward compatibility maintained (optional platformInstanceId)
- [x] No module logic touched
- [x] Offline sync preserved (no changes to sync layer)

---

## Exit Criteria

1. **One tenant runs multiple paid platforms** - Different subscriptions per instance
2. **Partners earn per platform** - Commission tracked per instance
3. **No regressions to Phase 2 UX** - Instance switching, branding work
4. **Phase 4A enforcement intact** - Partner-only operations

---

## Files to Create/Modify

### Schema
- `prisma/schema.prisma` - Add instance fields to Subscription, PartnerReferral

### Services
- `/lib/phase-3/instance-subscription.ts` - Subscription management
- `/lib/phase-3/instance-financials.ts` - Financial tracking
- `/lib/phase-3/partner-earnings.ts` - Commission calculations

### API Routes
- `/api/instances/[id]/subscription/route.ts`
- `/api/instances/[id]/financials/route.ts`
- `/api/partner/earnings/route.ts`

### UI Components
- `/components/partner/InstanceEarnings.tsx`
- `/components/partner/FinancialSummary.tsx`
- `/components/instance/SubscriptionManager.tsx`

---

## Freeze Marker

After validation: **Freeze as "Commercial Isolation v1 (Partner-First)"**
