# Multi-Vendor Marketplace (MVM) Suite — S3 Core Services

## Document Info
- **Suite**: Multi-Vendor Marketplace (Commerce Sub-Suite 3 of 8)
- **Phase**: S3 (Core Services Implementation)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: December 2025
- **Author**: E1 Agent
- **Reference**: SVM Suite S3 (Pattern Reference)

---

## 1️⃣ SERVICES IMPLEMENTED

### Service Summary

| # | Service | File | Methods | Purpose |
|---|---------|------|---------|---------|
| 1 | `VendorService` | `vendor-service.ts` | 12 | Vendor CRUD, metrics, dashboard |
| 2 | `VendorStatusService` | `vendor-status-service.ts` | 9 | Status transitions, approval workflow |
| 3 | `VendorOnboardingService` | `vendor-onboarding-service.ts` | 12 | Onboarding steps, progress tracking |
| 4 | `VendorTierService` | `vendor-tier-service.ts` | 12 | Tier CRUD, auto-assignment, progress |
| 5 | `ProductMappingService` | `product-mapping-service.ts` | 14 | Product mapping, pricing validation |
| 6 | `OrderSplitService` | `order-split-service.ts` | 10 | Order creation, vendor splitting |
| 7 | `SubOrderService` | `sub-order-service.ts` | 12 | Sub-order lifecycle, status updates |
| 8 | `CommissionService` | `commission-service.ts` | 14 | Commission calculation, tracking |
| 9 | `PayoutService` | `payout-service.ts` | 14 | Payout eligibility, creation, processing |
| 10 | `MarketplaceConfigService` | `marketplace-config-service.ts` | 14 | Tenant marketplace settings |

**Total: 10 services, 123 methods**

---

## 2️⃣ SERVICE DETAILS

### A. Vendor Management Layer

#### VendorService
Core vendor entity management.

| Method | Description |
|--------|-------------|
| `create()` | Create vendor with auto-generated slug |
| `getById()` | Get vendor by ID with tier info |
| `getBySlug()` | Get vendor by URL-friendly slug |
| `getByEmail()` | Get vendor by email (login lookup) |
| `update()` | Update vendor profile |
| `list()` | List vendors with filters (status, tier, search) |
| `getEffectiveCommissionRate()` | Get rate (override > tier > default) |
| `updateMetrics()` | Update sales/order counts |
| `hasBankDetails()` | Check payout readiness |
| `getDashboardSummary()` | Vendor dashboard data |

#### VendorStatusService
State machine for vendor lifecycle.

| Method | Description |
|--------|-------------|
| `isValidTransition()` | Validate status change |
| `getValidNextStatuses()` | Get allowed transitions |
| `approve()` | Approve pending vendor |
| `reject()` | Reject with reason |
| `suspend()` | Suspend active vendor |
| `reinstate()` | Reinstate suspended vendor |
| `markChurned()` | Mark as permanently inactive |
| `reapply()` | Allow rejected vendor to re-apply |
| `verify()` / `unverify()` | Toggle verification status |

**State Machine:**
```
PENDING_APPROVAL → APPROVED, REJECTED
APPROVED → SUSPENDED, CHURNED
SUSPENDED → APPROVED, CHURNED
REJECTED → PENDING_APPROVAL
CHURNED → (terminal)
```

#### VendorOnboardingService
Onboarding workflow management.

| Method | Description |
|--------|-------------|
| `getStepIndex()` | Get step position |
| `getNextStep()` | Get next onboarding step |
| `getCompletedSteps()` | Get completed steps |
| `calculateProgress()` | Progress percentage (0-100) |
| `checkProfileComplete()` | Validate profile fields |
| `checkBankInfoAdded()` | Validate bank details |
| `checkProductsAdded()` | Check product mappings exist |
| `checkAgreementSigned()` | Check agreement in metadata |
| `getStatus()` | Full onboarding status |
| `advanceStep()` | Advance if requirements met |
| `completeProfile()` / `completeBankInfo()` / etc. | Step completions |

**Onboarding Steps:**
```
REGISTERED → PROFILE_COMPLETED → BANK_INFO_ADDED → PRODUCTS_ADDED → AGREEMENT_SIGNED → COMPLETED
```

#### VendorTierService
Performance-based tier management.

| Method | Description |
|--------|-------------|
| `create()` | Create tier with commission rate |
| `getById()` / `getByCode()` | Get tier |
| `getDefault()` | Get default tier for new vendors |
| `list()` | List all tiers |
| `update()` / `delete()` | Tier management |
| `checkQualification()` | Check if vendor qualifies for tier |
| `findBestTier()` | Find best qualifying tier |
| `autoAssignTier()` | Auto-assign based on performance |
| `getTierProgress()` | Progress toward next tier |
| `seedDefaultTiers()` | Create Nigeria-first default tiers |

**Default Tiers (Nigeria-First):**

| Tier | Commission | Min Sales | Min Rating | Min Orders |
|------|------------|-----------|------------|------------|
| Bronze | 15% | - | - | - |
| Silver | 12% | ₦500,000 | 4.0 | 50 |
| Gold | 10% | ₦2,000,000 | 4.5 | 200 |
| Platinum | 8% | ₦10,000,000 | 4.8 | 1,000 |

---

### B. Product Layer

#### ProductMappingService
Maps Core catalog products to vendors.

| Method | Description |
|--------|-------------|
| `create()` | Create product mapping with pricing |
| `getById()` | Get mapping by ID |
| `getByVendorProduct()` | Get by vendor + product |
| `update()` | Update pricing/stock |
| `delete()` | Remove mapping |
| `list()` | List mappings with filters |
| `getVendorsForProduct()` | Get all vendors selling a product |
| `toggleActive()` / `toggleFeatured()` | Toggle states |
| `validatePricing()` | Validate min/max constraints |
| `recordSale()` | Update sales metrics |
| `bulkUpdateStatus()` | Bulk activate/deactivate |
| `getVendorMappingCount()` | Get counts (total/active/featured) |
| `canAddFeatured()` | Check tier-based featured limit |

---

### C. Order Layer

#### OrderSplitService
Core MVM capability — splits orders by vendor.

| Method | Description |
|--------|-------------|
| `createAndSplit()` | Create parent order + split into sub-orders |
| `getParentOrder()` | Get parent with sub-orders |
| `getByOrderNumber()` | Get by order number |
| `getSubOrder()` | Get single sub-order |
| `getVendorSubOrders()` | Get vendor's sub-orders |
| `getVendorOrderCounts()` | Counts by status |
| `updatePaymentStatus()` | Update payment state |
| `cancelOrder()` | Cancel parent + all sub-orders |
| `checkAllSubOrdersComplete()` | Check completion |
| `tryCompleteParentOrder()` | Auto-complete if all done |

**Order Split Flow:**
```
Customer Cart
    ↓
Parent Order (MVM-20251215-A3B7K)
    ↓
Split by vendorId
    ↓
┌─────────────────┬─────────────────┐
↓                 ↓                 ↓
SUB-A3B7K-V001   SUB-A3B7K-V002   SUB-A3B7K-V003
(Vendor A)       (Vendor B)       (Vendor C)
```

#### SubOrderService
Vendor sub-order lifecycle management.

| Method | Description |
|--------|-------------|
| `isValidTransition()` | Validate status change |
| `getValidNextStatuses()` | Get allowed transitions |
| `confirm()` | Vendor accepts order |
| `startProcessing()` | Begin fulfillment |
| `markShipped()` | Add tracking info |
| `markDelivered()` | Delivery confirmed → triggers commission |
| `cancel()` | Cancel sub-order |
| `refund()` | Process refund |
| `updateTracking()` | Update tracking details |
| `addVendorNotes()` | Add vendor notes |
| `getTimeline()` | Get status history |
| `bulkConfirm()` | Bulk confirm pending orders |

**Sub-Order State Machine:**
```
PENDING → CONFIRMED, CANCELLED
CONFIRMED → PROCESSING, CANCELLED
PROCESSING → SHIPPED, CANCELLED
SHIPPED → DELIVERED, CANCELLED
DELIVERED → REFUNDED
CANCELLED → (terminal)
REFUNDED → (terminal)
```

---

### D. Financial Layer

#### CommissionService
Commission calculation and tracking.

| Method | Description |
|--------|-------------|
| `calculate()` | Calculate commission from sale amount |
| `createFromSubOrder()` | Create commission record |
| `getById()` / `getBySubOrderId()` | Get commission |
| `list()` | List with filters |
| `markCleared()` | Mark as cleared (after delivery) |
| `processClearances()` | Batch process eligible clearances |
| `linkToPayout()` | Link to payout |
| `dispute()` | Open dispute |
| `resolveDispute()` | Resolve with outcome |
| `reverse()` | Reverse (order cancelled) |
| `getSummary()` | Summary by status |
| `getPayable()` | Get cleared, unpaid commissions |
| `getVendorEarnings()` | Earnings for period |

**Commission Calculation (Nigeria-First):**
```
Sale Amount: ₦10,000
    ↓
VAT (7.5%): ₦750
    ↓
Commission (15%): ₦1,500
    ↓
Vendor Payout: ₦8,500
```

**Commission State Machine:**
```
PENDING → PROCESSING → CLEARED → PAID
                    ↘ DISPUTED ↗
                         ↓
                      REVERSED
```

#### PayoutService
Vendor payout management.

| Method | Description |
|--------|-------------|
| `checkEligibility()` | Check if vendor can receive payout |
| `create()` | Create payout from commission IDs |
| `createFromAllCleared()` | Create from all cleared commissions |
| `getById()` / `getByNumber()` | Get payout |
| `list()` | List with filters |
| `approve()` | Approve for processing |
| `markCompleted()` | Mark as completed + update commissions |
| `markFailed()` | Mark as failed + unlink commissions |
| `cancel()` | Cancel pending payout |
| `getVendorPayoutSummary()` | Summary for vendor |
| `getRecentPayouts()` | Recent payouts for dashboard |
| `getEligibleVendors()` | Get all vendors eligible for payout |

**Payout Eligibility Rules:**
- Vendor status = APPROVED
- Bank details complete (bankName, bankCode, accountNumber, accountName)
- Available amount ≥ ₦5,000 (minimum payout)

---

### E. Configuration Layer

#### MarketplaceConfigService
Tenant-level marketplace settings.

| Method | Description |
|--------|-------------|
| `getOrCreate()` | Get or create with defaults |
| `get()` | Get config |
| `update()` | Update settings |
| `getSummary()` | Config summary |
| `isActive()` | Check if marketplace active |
| `activate()` / `deactivate()` | Toggle active |
| `getCommissionRate()` | Get default commission |
| `getVatRate()` | Get VAT rate |
| `getClearanceDays()` | Get clearance period |
| `isAutoApproveEnabled()` | Check auto-approval |
| `updateCommissionRate()` | Update commission |
| `updatePayoutSettings()` | Update payout config |
| `resetToDefaults()` | Reset all to defaults |

**Default Settings (Nigeria-First):**

| Setting | Default | Description |
|---------|---------|-------------|
| Commission Rate | 15% | Platform commission |
| VAT Rate | 7.5% | Nigerian VAT |
| Payout Cycle | 14 days | Bi-weekly |
| Min Payout | ₦5,000 | Minimum payout amount |
| Clearance Days | 7 | Days after delivery |
| Auto-Approve | false | Manual vendor approval |
| Require Verification | true | Verification required |

---

## 3️⃣ FILE STRUCTURE

```
/app/frontend/src/lib/mvm/
├── index.ts                    # Canonical exports
├── vendor-service.ts           # Vendor CRUD
├── vendor-status-service.ts    # Status transitions
├── vendor-onboarding-service.ts # Onboarding workflow
├── vendor-tier-service.ts      # Tier management
├── product-mapping-service.ts  # Product → Vendor mapping
├── order-split-service.ts      # Order splitting
├── sub-order-service.ts        # Sub-order lifecycle
├── commission-service.ts       # Commission tracking
├── payout-service.ts           # Payout management
└── marketplace-config-service.ts # Tenant config
```

---

## 4️⃣ NIGERIA-FIRST COMPLIANCE

| Feature | Implementation |
|---------|---------------|
| **Currency** | All amounts default to NGN |
| **VAT** | 7.5% built into CommissionService.calculate() |
| **Bank Details** | Nigerian fields: bankCode, accountNumber |
| **Payout Minimum** | ₦5,000 default |
| **Payout Cycle** | 14 days (bi-weekly) |
| **Clearance Period** | 7 days after delivery |
| **Default Tiers** | Bronze/Silver/Gold/Platinum with NGN thresholds |

---

## 5️⃣ GUARDRAIL COMPLIANCE

| Guardrail | Status |
|-----------|--------|
| ✅ Domain services only | All 10 services are domain-focused |
| ✅ No UI | No React components |
| ✅ No API routes | No route handlers |
| ✅ No payment gateways | PayoutService prepares, doesn't execute |
| ✅ No background jobs | processClearances() is sync, called by API |
| ✅ No notifications | No SMS/Email/WhatsApp |
| ✅ No inventory logic | Product mapping only, no stock management |
| ✅ Tenant-scoped | All services require tenantId |
| ✅ Deterministic | Commission/payout logic is predictable |
| ✅ Auditable | All state changes tracked with timestamps |

---

## 6️⃣ COMPILATION STATUS

```bash
✅ npx tsc --noEmit --skipLibCheck src/lib/mvm/*.ts
# Exit code: 0 (no errors)
```

All services compile without TypeScript errors.

---

## 7️⃣ WHAT'S NEXT (S4 Preview)

Upon S3 approval, the following API routes will be implemented:

| Route Group | Purpose |
|-------------|---------|
| `/api/commerce/mvm/vendors/*` | Vendor CRUD, status, onboarding |
| `/api/commerce/mvm/tiers/*` | Tier management |
| `/api/commerce/mvm/products/*` | Product mapping |
| `/api/commerce/mvm/orders/*` | Order creation, sub-order management |
| `/api/commerce/mvm/commissions/*` | Commission queries |
| `/api/commerce/mvm/payouts/*` | Payout management |
| `/api/commerce/mvm/admin/*` | Marketplace admin operations |

---

## 8️⃣ CONCLUSION

S3 delivers **10 domain services** with **123 methods** covering the complete MVM functionality:

- **Vendor Lifecycle**: Registration, approval, onboarding, tiers
- **Product Mapping**: Core catalog → vendor mapping with pricing
- **Order Orchestration**: Parent order → vendor sub-orders
- **Financial Flow**: Commission calculation, clearance, payouts

All services follow the canonical patterns established by POS and SVM, with full Nigeria-first compliance.

**Recommendation**: Approve S3 and proceed to S4 (API Layer).

---

**Submitted for Approval**: December 2025
**Author**: E1 Agent
**Program**: PC-SCP

---

### APPROVAL SECTION

- [ ] S3 Core Services Approved
- [ ] Proceed to S4 (API Layer)

**User Approval Date**: ___________
**Approved By**: ___________
