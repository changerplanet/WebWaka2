# Multi-Vendor Marketplace (MVM) Suite — S4 API Layer

## Document Info
- **Suite**: Multi-Vendor Marketplace (Commerce Sub-Suite 3 of 8)
- **Phase**: S4 (API Layer Implementation)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: December 2025
- **Author**: E1 Agent
- **Reference**: SVM Suite S4 (Pattern Reference)

---

## 1️⃣ API ROUTES IMPLEMENTED

### Route Summary

| # | Route Group | File Count | Endpoints | Purpose |
|---|-------------|------------|-----------|---------|
| 1 | `/api/commerce/mvm/vendors` | 2 | 6 | Vendor management |
| 2 | `/api/commerce/mvm/tiers` | 2 | 4 | Tier management |
| 3 | `/api/commerce/mvm/products` | 2 | 6 | Product mapping |
| 4 | `/api/commerce/mvm/orders` | 4 | 8 | Order management |
| 5 | `/api/commerce/mvm/commissions` | 2 | 4 | Commission tracking |
| 6 | `/api/commerce/mvm/payouts` | 2 | 4 | Payout management |
| 7 | `/api/commerce/mvm/config` | 1 | 3 | Marketplace config |
| 8 | `/api/commerce/mvm/dashboard` | 1 | 2 | Dashboard data |

**Total: 16 route files, 37 endpoints**

---

## 2️⃣ ENDPOINT DETAILS

### A. Vendors (`/api/commerce/mvm/vendors`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vendors` | List vendors (with filters) |
| POST | `/vendors` | Create new vendor |
| GET | `/vendors/[vendorId]` | Get vendor details |
| PUT | `/vendors/[vendorId]` | Update vendor profile |
| POST | `/vendors/[vendorId]?action=approve` | Approve vendor |
| POST | `/vendors/[vendorId]?action=reject` | Reject vendor |
| POST | `/vendors/[vendorId]?action=suspend` | Suspend vendor |
| POST | `/vendors/[vendorId]?action=reinstate` | Reinstate vendor |
| POST | `/vendors/[vendorId]?action=verify` | Verify vendor |
| POST | `/vendors/[vendorId]?action=auto-tier` | Auto-assign tier |
| POST | `/vendors/[vendorId]?action=complete-profile` | Complete onboarding step |
| POST | `/vendors/[vendorId]?action=sign-agreement` | Sign vendor agreement |

**Filters**: `status`, `tierId`, `isVerified`, `search`, `page`, `pageSize`

**Include Options**: `?include=onboarding,dashboard,tier-progress`

---

### B. Tiers (`/api/commerce/mvm/tiers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tiers` | List all tiers |
| POST | `/tiers` | Create custom tier |
| POST | `/tiers?action=seed` | Seed default Nigeria-first tiers |
| GET | `/tiers/[tierId]` | Get tier details |
| PUT | `/tiers/[tierId]` | Update tier |
| DELETE | `/tiers/[tierId]` | Delete tier (soft) |

---

### C. Products (`/api/commerce/mvm/products`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List product mappings |
| POST | `/products` | Create product mapping |
| GET | `/products/[mappingId]` | Get mapping details |
| PUT | `/products/[mappingId]` | Update mapping |
| DELETE | `/products/[mappingId]` | Delete mapping |
| POST | `/products/[mappingId]?action=toggle-active` | Toggle active status |
| POST | `/products/[mappingId]?action=toggle-featured` | Toggle featured status |

**Filters**: `vendorId`, `productId`, `isActive`, `isFeatured`, `page`, `pageSize`

---

### D. Orders (`/api/commerce/mvm/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List parent orders |
| POST | `/orders` | Create and split order |
| GET | `/orders/[orderId]` | Get parent order with sub-orders |
| POST | `/orders/[orderId]?action=update-payment` | Update payment status |
| POST | `/orders/[orderId]?action=cancel` | Cancel order |
| GET | `/orders/[orderId]/sub` | List sub-orders for parent |
| GET | `/orders/[orderId]/sub/[subOrderId]` | Get sub-order details |
| POST | `/orders/[orderId]/sub/[subOrderId]?action=confirm` | Vendor confirms |
| POST | `/orders/[orderId]/sub/[subOrderId]?action=ship` | Mark shipped |
| POST | `/orders/[orderId]/sub/[subOrderId]?action=deliver` | Mark delivered |
| POST | `/orders/[orderId]/sub/[subOrderId]?action=cancel` | Cancel sub-order |
| POST | `/orders/[orderId]/sub/[subOrderId]?action=refund` | Process refund |

**Include Options**: `?include=timeline,commission`

---

### E. Commissions (`/api/commerce/mvm/commissions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/commissions` | List commissions |
| GET | `/commissions?summary=true` | Get commission summary |
| POST | `/commissions?action=process-clearances` | Batch process clearances |
| GET | `/commissions/[commissionId]` | Get commission details |
| POST | `/commissions/[commissionId]?action=dispute` | Open dispute |
| POST | `/commissions/[commissionId]?action=resolve` | Resolve dispute |

**Filters**: `vendorId`, `status`, `startDate`, `endDate`, `page`, `pageSize`

---

### F. Payouts (`/api/commerce/mvm/payouts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payouts` | List payouts |
| GET | `/payouts?eligible=true` | Get eligible vendors |
| GET | `/payouts?vendorId=...` | Get vendor payout data |
| POST | `/payouts` | Create payout |
| GET | `/payouts/[payoutId]` | Get payout details |
| POST | `/payouts/[payoutId]?action=approve` | Approve payout |
| POST | `/payouts/[payoutId]?action=complete` | Mark completed |
| POST | `/payouts/[payoutId]?action=fail` | Mark failed |
| POST | `/payouts/[payoutId]?action=cancel` | Cancel payout |

---

### G. Config (`/api/commerce/mvm/config`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config` | Get marketplace config |
| PUT | `/config` | Update config |
| POST | `/config?action=activate` | Activate marketplace |
| POST | `/config?action=deactivate` | Deactivate marketplace |
| POST | `/config?action=reset` | Reset to defaults |

---

### H. Dashboard (`/api/commerce/mvm/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Admin/marketplace dashboard |
| GET | `/dashboard?vendorId=...` | Vendor-specific dashboard |

---

## 3️⃣ CAPABILITY GUARD

All routes implement capability guard:

```typescript
const guardResult = await checkCapabilityGuard(request, 'mvm')
if (!guardResult.allowed) {
  return NextResponse.json(
    { success: false, error: guardResult.reason, code: 'CAPABILITY_INACTIVE' },
    { status: 403 }
  )
}
```

---

## 4️⃣ RESPONSE FORMAT

All endpoints return consistent response format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## 5️⃣ FILE STRUCTURE

```
/app/frontend/src/app/api/commerce/mvm/
├── vendors/
│   ├── route.ts              # GET, POST
│   └── [vendorId]/
│       └── route.ts          # GET, PUT, POST
├── tiers/
│   ├── route.ts              # GET, POST
│   └── [tierId]/
│       └── route.ts          # GET, PUT, DELETE
├── products/
│   ├── route.ts              # GET, POST
│   └── [mappingId]/
│       └── route.ts          # GET, PUT, DELETE, POST
├── orders/
│   ├── route.ts              # GET, POST
│   └── [orderId]/
│       ├── route.ts          # GET, POST
│       └── sub/
│           ├── route.ts      # GET
│           └── [subOrderId]/
│               └── route.ts  # GET, POST
├── commissions/
│   ├── route.ts              # GET, POST
│   └── [commissionId]/
│       └── route.ts          # GET, POST
├── payouts/
│   ├── route.ts              # GET, POST
│   └── [payoutId]/
│       └── route.ts          # GET, POST
├── config/
│   └── route.ts              # GET, PUT, POST
└── dashboard/
    └── route.ts              # GET
```

---

## 6️⃣ GUARDRAIL COMPLIANCE

| Guardrail | Status |
|-----------|--------|
| ✅ REST APIs under `/api/commerce/mvm/*` | All routes follow pattern |
| ✅ Capability guard on all routes | `checkCapabilityGuard(request, 'mvm')` |
| ✅ Tenant scoping | All queries include `tenantId` |
| ✅ Thin wrappers over S3 services | APIs delegate to services |
| ❌ No UI changes | No React components modified |
| ❌ No background jobs | No cron or scheduled tasks |
| ❌ No payment gateway calls | Payout service prepares, doesn't execute |
| ❌ No notifications | No SMS/Email/WhatsApp |
| ❌ No vendor storefront UI | API-only in S4 |

---

## 7️⃣ FRONTEND STATUS

```bash
✅ Frontend running on http://localhost:3000
✅ Hot reload working
✅ API routes compiled successfully
```

---

## 8️⃣ WHAT'S NEXT (S5 Preview)

Upon S4 approval, the following will be implemented:

| Component | Purpose |
|-----------|---------|
| **Admin Dashboard UI** | Vendor management, commission review, payout processing |
| **Vendor Dashboard UI** | Rewire existing mocked components to real APIs |
| **Customer Storefront** | Multi-vendor product listing, vendor profiles |
| **Nigerian Demo Data** | Seed script with Lagos marketplace vendors |

---

## 9️⃣ CONCLUSION

S4 delivers **37 API endpoints** across **8 route groups**, providing complete REST coverage for the MVM suite:

- **Vendor Lifecycle**: Registration, approval, onboarding, tiers
- **Product Management**: Mapping, pricing, featured products
- **Order Orchestration**: Parent orders, sub-orders, status tracking
- **Financial Operations**: Commissions, payouts, eligibility checks
- **Marketplace Admin**: Config, dashboard, analytics

All routes follow canonical patterns with:
- Capability guards
- Tenant scoping
- Consistent response format
- Thin service wrappers

**Recommendation**: Approve S4 and proceed to S5 (UI & Demo Data).

---

**Submitted for Approval**: December 2025
**Author**: E1 Agent
**Program**: PC-SCP

---

### APPROVAL SECTION

- [ ] S4 API Layer Approved
- [ ] Proceed to S5 (UI & Demo Data)

**User Approval Date**: ___________
**Approved By**: ___________
