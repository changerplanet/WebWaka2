# Partner Analytics

**Phase E1.4: Partner Analytics (Read-Only)**

This document describes the Partner Analytics system, providing actionable visibility into partner performance across tenants, forms, and payments.

## Overview

Partner Analytics is a read-only analytics layer that aggregates data from:
- **sf_forms** - Form definitions
- **sf_form_submissions** - Form submissions
- **PaymentTransaction** - Payment records
- **Tenant** / **PartnerReferral** - Partner-tenant relationships

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PARTNER DASHBOARD UI                       │
│  /partner/analytics - Stat cards, tables, filters           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ANALYTICS API (E1.4)                      │
│  GET /api/partner/analytics/overview                         │
│  GET /api/partner/analytics/tenants                          │
│  GET /api/partner/analytics/forms                            │
│  GET /api/partner/analytics/payments                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 PARTNER ANALYTICS SERVICE                    │
│  PartnerAnalyticsService - Pure aggregation queries          │
│  - getOverview()                                             │
│  - getTenantPerformance()                                    │
│  - getFormPerformance()                                      │
│  - getPaymentsAnalytics()                                    │
└─────────────────────────────────────────────────────────────┘
```

## Users Covered

Analytics is available to users with Partner roles:
- **PARTNER_OWNER**
- **PARTNER_ADMIN**  
- **PARTNER_SALES**

## API Endpoints

### Overview Endpoint

**GET /api/partner/analytics/overview**

Returns aggregate metrics for the partner dashboard.

Query Parameters:
- `timeFilter`: `today` | `7d` | `30d` | `all` (default: `30d`)
- `includeDemo`: `true` | `false` (default: `true`)

Response:
```json
{
  "success": true,
  "overview": {
    "partnerId": "partner-123",
    "partnerName": "Acme Partner",
    "timeFilter": "30d",
    "tenants": {
      "total": 15,
      "active": 12,
      "inactive": 3
    },
    "forms": {
      "total": 45,
      "active": 30,
      "withPayments": 20,
      "demo": 5,
      "live": 40
    },
    "submissions": {
      "total": 1250,
      "completed": 1100,
      "pending": 150,
      "demo": 50,
      "live": 1200
    },
    "payments": {
      "initiated": 800,
      "successful": 720,
      "failed": 50,
      "pending": 30,
      "demo": 20,
      "live": 780,
      "totalRevenue": 3600000,
      "currency": "NGN"
    },
    "generatedAt": "2026-01-14T22:30:00.000Z"
  }
}
```

### Tenants Endpoint

**GET /api/partner/analytics/tenants**

Returns per-tenant performance breakdown.

Response:
```json
{
  "success": true,
  "tenants": [
    {
      "tenantId": "tenant-456",
      "tenantName": "Client Business",
      "tenantSlug": "client-business",
      "isActive": true,
      "submissions": 200,
      "paymentAttempts": 150,
      "successfulPayments": 140,
      "conversionRate": 70.0,
      "revenue": 700000,
      "currency": "NGN",
      "isDemo": false
    }
  ],
  "totals": {
    "submissions": 1250,
    "paymentAttempts": 800,
    "successfulPayments": 720,
    "revenue": 3600000
  },
  "topPerformer": { ... },
  "timeFilter": "30d"
}
```

### Forms Endpoint

**GET /api/partner/analytics/forms**

Returns per-form performance analytics.

Additional Query Parameters:
- `tenantId`: Filter by specific tenant

Response:
```json
{
  "success": true,
  "forms": [
    {
      "formId": "form-789",
      "formName": "Registration Form",
      "formSlug": "registration-form",
      "tenantId": "tenant-456",
      "tenantName": "Client Business",
      "status": "ACTIVE",
      "paymentEnabled": true,
      "paymentAmount": 5000,
      "totalSubmissions": 100,
      "completedSubmissions": 90,
      "pendingSubmissions": 10,
      "revenueGenerated": 450000,
      "currency": "NGN",
      "isDemo": false,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "totals": {
    "totalForms": 45,
    "paymentEnabledForms": 20,
    "totalSubmissions": 1250,
    "totalRevenue": 3600000
  },
  "timeFilter": "30d"
}
```

### Payments Endpoint

**GET /api/partner/analytics/payments**

Returns payment visibility (read-only, no payouts).

Response:
```json
{
  "success": true,
  "timeFilter": "30d",
  "summary": {
    "totalTransactions": 800,
    "pending": 30,
    "success": 720,
    "failed": 50,
    "abandoned": 0,
    "expired": 0,
    "demo": 20,
    "live": 780
  },
  "revenue": {
    "total": 3600000,
    "currency": "NGN",
    "byStatus": {
      "successful": 3600000,
      "pending": 150000
    }
  },
  "bySource": [
    {
      "sourceModule": "forms",
      "count": 500,
      "revenue": 2500000
    },
    {
      "sourceModule": "svm",
      "count": 300,
      "revenue": 1100000
    }
  ]
}
```

## Metrics Provided

### Partner Overview Dashboard
| Metric | Description |
|--------|-------------|
| Total Tenants | Count of tenants referred by partner |
| Active vs Inactive | Tenant status breakdown |
| Total Forms | Forms created across all tenants |
| Total Submissions | Form submission count |
| Payment Initiated | Number of payment attempts |
| Successful Payments | Completed payment count |
| Demo vs Live | Split between demo and production data |

### Tenant Performance
| Metric | Description |
|--------|-------------|
| Submissions | Form submissions per tenant |
| Payment Attempts | Payment initiations per tenant |
| Successful Payments | Completed payments per tenant |
| Conversion Rate | Submissions → Payments ratio |
| Revenue | Total revenue per tenant |
| Top Performer | Highest revenue tenant |

### Sites & Funnels Analytics
| Metric | Description |
|--------|-------------|
| Form Views | (Future) Page views for forms |
| Form Submissions | Submissions per form |
| Payment-Enabled Forms | Forms requiring payment |
| Revenue Generated | Total collected per form |
| Drop-off Count | (Future) Incomplete submissions |

### Payments Analytics (READ-ONLY)
| Metric | Description |
|--------|-------------|
| Total Transactions | Count of all transactions |
| Status Breakdown | Pending / Success / Failed / Demo |
| Revenue Totals | NGN totals (no payouts) |
| By Source | Revenue breakdown by module |

## Time Filters

All endpoints support time filtering:

| Filter | Description |
|--------|-------------|
| `today` | Since midnight today |
| `7d` | Last 7 days |
| `30d` | Last 30 days (default) |
| `all` | All time |

## Demo Mode

- Demo data is included by default (`includeDemo=true`)
- Demo records are clearly labeled in responses
- Set `includeDemo=false` to exclude demo data
- Demo/Live split shown in all metric summaries

## Partner Dashboard UI

Access the analytics dashboard at: `/partner/analytics`

Features:
- Mobile-first responsive design
- Time filter selector (Today / 7d / 30d / All Time)
- Demo toggle to include/exclude demo data
- Tabbed navigation: Overview | Tenants | Forms | Payments
- Stat cards with key metrics
- Sortable data tables

## What's NOT Included

Explicitly out of scope for Phase E1.4:

| Feature | Status |
|---------|--------|
| ❌ Automations | Not implemented |
| ❌ Email/SMS notifications | Not implemented |
| ❌ Payouts | Not implemented |
| ❌ Revenue sharing | Not implemented |
| ❌ Partner balances | Not implemented |
| ❌ Background workers | Not implemented |
| ❌ Cron jobs | Not implemented |
| ❌ Chart libraries | Minimal (stat cards only) |
| ❌ PDF/CSV exports | Not implemented |

## Files Created

### Services
- `frontend/src/lib/partner-analytics/types.ts` - Type definitions
- `frontend/src/lib/partner-analytics/analytics-service.ts` - Core service
- `frontend/src/lib/partner-analytics/index.ts` - Exports

### API Endpoints
- `frontend/src/app/api/partner/analytics/overview/route.ts`
- `frontend/src/app/api/partner/analytics/tenants/route.ts`
- `frontend/src/app/api/partner/analytics/forms/route.ts`
- `frontend/src/app/api/partner/analytics/payments/route.ts`

### UI
- `frontend/src/app/partner/analytics/page.tsx` - Dashboard page

## Related Documentation

- [Forms Builder (E1.3)](./FORMS_BUILDER.md) - Form data source
- [Payment Execution (E1.2)](./PAYMENTS_EXECUTION.md) - Transaction data source
- [Paystack Integration (E1.1)](./PAYSTACK_INTEGRATION.md) - Provider setup
