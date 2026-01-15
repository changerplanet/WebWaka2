# Wave 2.3: Vendor Payout Visibility - Completion Report

**Status:** COMPLETE  
**Date:** January 15, 2026  
**Scope:** Read-only Vendor Payout Visibility for MVM

---

## Overview

Wave 2.3 provides comprehensive read-only visibility into vendor earnings, commissions, and payment status across the MVM (Multi-Vendor Marketplace) commerce layer. This enables vendors to track their earnings transparently and partners to monitor platform-wide payout metrics.

**CRITICAL CONSTRAINTS ENFORCED:**
- NO payout execution (read-only financial visibility only)
- NO bank transfers (no money movement)
- NO background jobs (all operations are request-driven)
- NO automation (user-triggered queries only)

---

## APIs Created

### Vendor Payout Visibility API

| Endpoint | Method | View | Description |
|----------|--------|------|-------------|
| `/api/commerce/payout-visibility/vendor` | GET | `summary` | Vendor earnings summary with totals |
| `/api/commerce/payout-visibility/vendor` | GET | `orders` | Order-level earnings breakdown |
| `/api/commerce/payout-visibility/vendor` | GET | `pending` | Pending payout orders |
| `/api/commerce/payout-visibility/vendor` | GET | `recent` | Recently completed payouts |

**Authorization:**
- Vendors can only access their own payout data (enforced via mvm_vendor_staff link)
- Tenant Admins can access any vendor's data within their tenant
- Super Admins can access any vendor's data

### Partner Payout Overview API

| Endpoint | Method | View | Description |
|----------|--------|------|-------------|
| `/api/commerce/payout-visibility/partner` | GET | `overview` | Partner-level aggregate metrics |
| `/api/commerce/payout-visibility/partner` | GET | `breakdown` | Per-vendor earnings breakdown |
| `/api/commerce/payout-visibility/partner` | GET | `top-vendors` | Top vendors by earnings |
| `/api/commerce/payout-visibility/partner` | GET | `vendor-detail` | Specific vendor detail |
| `/api/commerce/payout-visibility/partner` | GET | `payment-methods` | Payment method breakdown |

**Authorization:**
- Only Tenant Admins and Super Admins can access
- Vendors are explicitly blocked from partner-level data

---

## Views/Dashboards Added

### Vendor Earnings Summary
- Total orders
- Gross sales (total order value)
- Total commissions deducted
- Net earnings (vendor payout)
- Pending vs eligible vs paid earnings
- Breakdown by payment method (Paystack/Bank Transfer/COD)
- Collected vs pending collection amounts

### Order-Level Earnings
- Order details (order number, date, status)
- Financial breakdown (gross, commission rate, commission amount, net)
- Payment method and verification status
- Collection status for COD/Bank Transfer orders
- Customer info (sanitized - city/state only)

### Partner Overview Metrics
- Total vendors / Active vendors
- Platform-wide gross sales
- Total commissions collected
- Total vendor earnings
- Payment method volume breakdown
- Collection status totals
- Eligible vs paid vs pending payouts

### Vendor Performance Breakdown
- Per-vendor earnings comparison
- Commission deductions per vendor
- Payout status per vendor
- Sortable by earnings

---

## Metrics Exposed

### Vendor-Level Metrics
| Metric | Description |
|--------|-------------|
| `totalOrders` | Number of sub-orders for vendor |
| `totalGrossSales` | Sum of order grand totals |
| `totalCommissions` | Sum of platform commission deductions |
| `totalNetEarnings` | Vendor payout total (gross - commissions) |
| `pendingEarnings` | Earnings awaiting payment confirmation |
| `eligibleEarnings` | Confirmed, ready for payout |
| `paidEarnings` | Already paid out (manual tracking) |
| `paystackEarnings` | Earnings from Paystack orders |
| `bankTransferEarnings` | Earnings from bank transfer orders |
| `codEarnings` | Earnings from COD orders |
| `collectedAmount` | COD/BT payments collected |
| `pendingCollectionAmount` | Awaiting collection |

### Partner-Level Metrics
| Metric | Description |
|--------|-------------|
| `totalVendors` | All vendors in tenant |
| `activeVendors` | Approved vendors |
| `totalGrossSales` | Platform-wide order value |
| `totalCommissionsCollected` | Platform revenue from commissions |
| `totalVendorEarnings` | Sum of all vendor payouts |
| `paystackVolume` | Paystack payment volume |
| `bankTransferVolume` | Bank transfer payment volume |
| `codVolume` | COD payment volume |
| `totalCollected` | Cash/BT payments verified |
| `totalPendingCollection` | Awaiting verification |
| `totalEligibleForPayout` | Ready for payout |
| `totalPaid` | Already paid (manual) |
| `totalPending` | Awaiting eligibility |

---

## Demo vs Live Behavior

| Mode | Behavior |
|------|----------|
| **Demo** | All visibility features work. Displays calculated earnings from demo order data. No external dependencies. Safe to demonstrate without real financial data. |
| **Live** | Same as demo - reads from actual sub-order commission data. Integrates with real Bank Transfer and COD payment records for collection status. |

### Data Sources
- **Order Splitting Engine**: `mvm_sub_order` with `commissionRate`, `commissionAmount`, `vendorPayout`
- **Bank Transfer Records**: `bank_transfer_payment` for verification status
- **COD Records**: `cod_payment` for collection and reconciliation status

---

## Integration with Existing Modules

| Module | Integration |
|--------|-------------|
| Order Splitting (Wave 1) | Reads commission data from `mvm_sub_order` |
| Bank Transfer (Wave 2.2) | Reads verification status for BT orders |
| COD (Wave 2.2) | Reads collection/reconciliation status |
| Vendor Registration (Wave 1) | Uses vendor identity for scoping |

---

## Time Filters Supported

| Period | Description |
|--------|-------------|
| `today` | Current day only |
| `7d` | Last 7 days |
| `30d` | Last 30 days (default) |
| `90d` | Last 90 days |
| `all` | All time |
| `custom` | Custom date range |

---

## Payout Status States

| Status | Description |
|--------|-------------|
| `PENDING` | Order placed, payment not confirmed |
| `ELIGIBLE` | Payment confirmed, delivered, ready for payout |
| `HOLD` | Temporarily held (dispute, verification) |
| `SCHEDULED` | Scheduled for future payout |
| `PAID` | Payout completed (manually recorded) |
| `CANCELLED` | Order cancelled, no payout |

---

## Constraints Verification

| Constraint | Status | Notes |
|------------|--------|-------|
| No payouts executed | ENFORCED | Read-only visibility only |
| No bank transfers | ENFORCED | No money movement |
| No background jobs | ENFORCED | All request-driven |
| No automation | ENFORCED | User-triggered queries only |
| Read-only visibility | ENFORCED | GET endpoints only, no mutations |
| Vendor-scoped views | ENFORCED | Via mvm_vendor_staff link |
| Partner-scoped views | ENFORCED | TENANT_ADMIN/SUPER_ADMIN only |
| Mobile-first API | ENFORCED | JSON API, UI-agnostic |
| Demo-safe | ENFORCED | No external dependencies |
| Tenant-isolated | ENFORCED | All queries scoped to tenantId |
| Session authentication | ENFORCED | All routes require session |

---

## Files Added

### Services
- `frontend/src/lib/commerce/payout-visibility/types.ts`
- `frontend/src/lib/commerce/payout-visibility/vendor-payout-service.ts`
- `frontend/src/lib/commerce/payout-visibility/partner-payout-service.ts`
- `frontend/src/lib/commerce/payout-visibility/index.ts`

### API Routes
- `frontend/src/app/api/commerce/payout-visibility/vendor/route.ts`
- `frontend/src/app/api/commerce/payout-visibility/partner/route.ts`

---

## Usage Examples

### Get Vendor Earnings Summary
```typescript
GET /api/commerce/payout-visibility/vendor?vendorId=vendor-123&view=summary&period=30d
```

Response:
```json
{
  "summary": {
    "vendorId": "vendor-123",
    "vendorName": "Amaka Fashions",
    "totalOrders": 45,
    "totalGrossSales": 1250000,
    "totalCommissions": 125000,
    "totalNetEarnings": 1125000,
    "pendingEarnings": 350000,
    "eligibleEarnings": 775000,
    "paystackEarnings": 600000,
    "bankTransferEarnings": 325000,
    "codEarnings": 200000,
    "collectedAmount": 425000,
    "pendingCollectionAmount": 100000
  }
}
```

### Get Partner Payout Overview
```typescript
GET /api/commerce/payout-visibility/partner?view=overview&period=30d
```

Response:
```json
{
  "overview": {
    "totalVendors": 25,
    "activeVendors": 22,
    "totalGrossSales": 15000000,
    "totalCommissionsCollected": 1500000,
    "totalVendorEarnings": 13500000,
    "paystackVolume": 8000000,
    "bankTransferVolume": 4000000,
    "codVolume": 3000000,
    "totalCollected": 5500000,
    "totalPendingCollection": 1500000,
    "totalEligibleForPayout": 10000000,
    "totalPending": 3500000
  }
}
```

---

## STOP - Awaiting Approval

Wave 2.3 is complete. Per governance rules:

**DO NOT proceed to Wave 2.4 (Inventory Sync & Low Stock) until explicit approval is granted.**

Wave 2.4-2.5 remain LOCKED.
