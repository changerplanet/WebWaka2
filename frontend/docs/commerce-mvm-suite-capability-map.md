# Multi-Vendor Marketplace (MVM) Suite — S0–S1 Capability Mapping

## Document Info
- **Suite**: Multi-Vendor Marketplace (Commerce Sub-Suite 3 of 8)
- **Phase**: S0–S1 (Re-Canonicalization Audit)
- **Program**: Platform Canonicalization & Suite Conformance Program (PC-SCP)
- **Status**: SUBMITTED FOR APPROVAL
- **Date**: December 2025
- **Author**: E1 Agent
- **Baseline**: Existing Pre-Standardization Implementation (MOCKED)
- **Reference**: POS & Retail Operations Suite (FROZEN), SVM Suite (FROZEN)

---

## 1️⃣ SUITE INTENT (S0)

### Purpose Statement

The **Multi-Vendor Marketplace (MVM) Suite** enables Nigerian businesses to operate marketplace platforms where multiple independent vendors can sell products under a unified storefront. Unlike Single Vendor Marketplace (SVM), MVM adds vendor management, commission calculation, split payouts, and sub-order orchestration.

### Who This Suite Is For (Nigeria-First)

| Customer Segment | Description | Size Range |
|------------------|-------------|------------|
| **Market Associations** | Trade associations digitizing market operations | 50-500+ vendors |
| **E-Commerce Aggregators** | Online marketplace operators (fashion, electronics) | 20-200 vendors |
| **Motor Parks (ParkHub)** | Transport hubs coordinating multiple operators | 5-50 transport companies |
| **Shopping Malls** | Mall operators aggregating tenant stores online | 10-100 stores |
| **Trade Fairs** | Event organizers hosting multiple exhibitors | 20-500 vendors |
| **Cooperatives** | Producer cooperatives selling collectively | 10-100 members |
| **B2B Platforms** | Wholesale aggregators connecting suppliers | 10-100 wholesalers |

### Core Problems It Solves

1. **Vendor Onboarding** — Register, approve, and manage multiple sellers
2. **Multi-Vendor Catalog** — Unified product discovery across vendors
3. **Split Order Processing** — One customer order → multiple vendor sub-orders
4. **Commission Management** — Automated platform fee calculation
5. **Vendor Earnings Tracking** — Real-time payout visibility for vendors
6. **Tier-Based Incentives** — Performance-based commission rates
7. **Storefront Isolation** — Each vendor sees only their own data

### Nigerian Marketplace Context

| Context | MVM Consideration |
|---------|-------------------|
| **Informal vendor economy** | Simple onboarding, minimal compliance barriers |
| **Trust deficit** | Vendor verification, rating systems, marketplace guarantee |
| **Commission sensitivity** | Transparent, tiered commission (5-20%) |
| **Cash payout preference** | Bank transfer + mobile money payout options |
| **Low digital literacy** | Vendor dashboard must be simple, WhatsApp-friendly |
| **Variable connectivity** | Offline-resilient order sync for vendors |
| **Multi-currency informal** | NGN-first, but support for price negotiation |

### What This Suite Explicitly Does NOT Solve

| Excluded Scope | Reason |
|----------------|--------|
| ❌ **In-store sales (POS)** | Handled by POS & Retail Operations Suite |
| ❌ **Single-vendor e-commerce** | Handled by SVM (Single Vendor Marketplace) |
| ❌ **Vendor inventory management** | Handled by Inventory & Stock Control Suite (Core owns stock) |
| ❌ **Payment gateway integration** | Handled by Payments & Collections Suite |
| ❌ **Vendor payroll/HR** | Vendors are NOT employees; use Partner module patterns |
| ❌ **Logistics/dispatch** | Handled by Logistics Suite (MVM only tracks shipping) |
| ❌ **B2B wholesale pricing** | Handled by B2B / Wholesale Suite |
| ❌ **Customer engagement/CRM** | Handled by CRM Suite |

---

## 2️⃣ CAPABILITY MAPPING (S1)

### Legend

- **Priority**: P0 (Must have), P1 (Should have), P2 (Nice to have)
- **Reuse**: `REUSE` = From existing Core module, `MVM-SPECIFIC` = Unique to MVM
- **Status**:
  - `COMPLIANT` ✅ — Fully implemented and meets canonical standard
  - `PARTIAL` 🟡 — Implemented but incomplete or non-standard
  - `MISSING` ❌ — Not implemented
  - `MOCKED` 🔶 — UI exists but no database/API integration
  - `NON-COMPLIANT` ⚠️ — Implemented but violates canonical standards

---

### A. VENDOR MANAGEMENT (12 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Vendor registration (self-serve)** | P0 | MVM-SPECIFIC | ❌ MISSING | No registration flow exists |
| 2 | **Vendor profile management** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `VendorProfile.tsx` UI exists, no API backend |
| 3 | **Vendor approval workflow** | P0 | MVM-SPECIFIC | ❌ MISSING | No admin approval flow |
| 4 | **Vendor status management** | P0 | MVM-SPECIFIC | 🔶 MOCKED | Types defined in `vendor-engine.ts`, no persistence |
| 5 | **Vendor suspension/reinstatement** | P1 | MVM-SPECIFIC | ❌ MISSING | Status transitions defined, not implemented |
| 6 | **Vendor onboarding steps** | P1 | MVM-SPECIFIC | 🔶 MOCKED | `OnboardingStep` enum exists, no state persistence |
| 7 | **Vendor bank details collection** | P0 | MVM-SPECIFIC | ❌ MISSING | Required for payouts, not implemented |
| 8 | **Vendor verification/KYC** | P1 | MVM-SPECIFIC | ❌ MISSING | No verification flow |
| 9 | **Vendor staff management** | P2 | MVM-SPECIFIC | ❌ MISSING | `VendorStaffMember` type defined, not implemented |
| 10 | **Vendor slug generation** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorEngine.generateSlug()` in `vendor-engine.ts` |
| 11 | **Vendor profile validation** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorEngine.validateProfile()` implemented |
| 12 | **Vendor performance scoring** | P2 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorEngine.calculatePerformanceScore()` implemented |

**Vendor Management: 3/12 Compliant (25%)**

---

### B. PRODUCT MAPPING (8 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Map Core product to vendor** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `VendorProductsView.tsx` UI, no API |
| 2 | **Vendor-specific pricing** | P1 | MVM-SPECIFIC | 🔶 MOCKED | `vendorPrice` field in types, not persisted |
| 3 | **Min/max price constraints** | P2 | MVM-SPECIFIC | ✅ COMPLIANT | `ProductMappingEngine.validatePricing()` logic exists |
| 4 | **Commission override per product** | P1 | MVM-SPECIFIC | 🔶 MOCKED | Field defined in `ProductMapping`, not persisted |
| 5 | **Product activation toggle** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `isActive` in UI, no backend |
| 6 | **Featured product flag** | P2 | MVM-SPECIFIC | 🔶 MOCKED | `isFeatured` field exists |
| 7 | **Allocated stock per vendor** | P1 | MVM-SPECIFIC | ❌ MISSING | Logic defined but not integrated with Inventory |
| 8 | **Product mapping list/search** | P0 | MVM-SPECIFIC | 🔶 MOCKED | Search UI exists, returns demo data |

**Product Mapping: 1/8 Compliant (12.5%)**

---

### C. ORDER MANAGEMENT (10 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Split parent order to vendor sub-orders** | P0 | MVM-SPECIFIC | ❌ MISSING | Core MVM capability not implemented |
| 2 | **Vendor order view (isolation)** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `VendorOrdersView.tsx` shows demo orders |
| 3 | **Order status tracking** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `OrderStatus` enum, UI badges exist |
| 4 | **Order status updates by vendor** | P1 | MVM-SPECIFIC | ❌ MISSING | Vendors cannot update order status |
| 5 | **Order search/filter** | P1 | MVM-SPECIFIC | 🔶 MOCKED | Search UI exists, works on demo data |
| 6 | **Order detail view** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `OrderDetailModal` component exists |
| 7 | **Order customer info (sanitized)** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorDataAccess.sanitizeCustomerData()` |
| 8 | **Order timeline/history** | P2 | MVM-SPECIFIC | ❌ MISSING | Type defined but not rendered |
| 9 | **Vendor order notifications** | P1 | MVM-SPECIFIC | ❌ MISSING | `VendorNotificationPreferences` type only |
| 10 | **Order export (CSV/Excel)** | P2 | MVM-SPECIFIC | ❌ MISSING | No export functionality |

**Order Management: 1/10 Compliant (10%)**

---

### D. COMMISSION & PAYOUTS (10 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Commission calculation per order** | P0 | MVM-SPECIFIC | 🔶 MOCKED | Demo data shows commission, no real calculation |
| 2 | **Tier-based commission rates** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorTierEngine.getEffectiveCommissionRate()` |
| 3 | **Commission override (vendor-level)** | P2 | MVM-SPECIFIC | 🔶 MOCKED | `commissionOverride` field in types |
| 4 | **Commission override (product-level)** | P2 | MVM-SPECIFIC | 🔶 MOCKED | Field exists in mapping type |
| 5 | **Pending payout calculation** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `pendingPayout` shown in dashboard, not calculated |
| 6 | **Payout history view** | P1 | MVM-SPECIFIC | 🔶 MOCKED | `VendorEarningsView.tsx` shows demo payouts |
| 7 | **Payout batch processing** | P1 | MVM-SPECIFIC | ❌ MISSING | No payout execution logic |
| 8 | **Payout schedule configuration** | P2 | MVM-SPECIFIC | ❌ MISSING | No schedule management |
| 9 | **Minimum payout threshold** | P2 | MVM-SPECIFIC | 🔶 MOCKED | Type defined in `VendorEarningsView` |
| 10 | **Commission status tracking** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `Commission` type with status, demo data only |

**Commission & Payouts: 1/10 Compliant (10%)**

---

### E. VENDOR TIERS (6 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Tier definition (admin)** | P1 | MVM-SPECIFIC | ❌ MISSING | No admin UI for tier management |
| 2 | **Tier qualification logic** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorTierEngine.qualifiesForTier()` |
| 3 | **Automatic tier assignment** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorTierEngine.findBestTier()` |
| 4 | **Tier benefits (commission, slots)** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorTier` interface with benefits |
| 5 | **Tier progress display** | P2 | MVM-SPECIFIC | 🔶 MOCKED | Type defined, not displayed |
| 6 | **Default tier assignment** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `isDefault` flag in tier logic |

**Vendor Tiers: 4/6 Compliant (66.7%)**

---

### F. VENDOR DASHBOARD (8 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Dashboard overview metrics** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `VendorDashboard.tsx` with demo data |
| 2 | **Period comparison (MoM)** | P1 | MVM-SPECIFIC | ✅ COMPLIANT | `VendorDataAccess.calculatePeriodComparison()` |
| 3 | **Recent orders widget** | P0 | MVM-SPECIFIC | 🔶 MOCKED | Shows demo orders |
| 4 | **Top products widget** | P1 | MVM-SPECIFIC | 🔶 MOCKED | Shows demo products |
| 5 | **Earnings summary widget** | P0 | MVM-SPECIFIC | 🔶 MOCKED | `EarningsCard` with demo data |
| 6 | **Vendor status banner** | P1 | MVM-SPECIFIC | 🔶 MOCKED | Status badge displayed |
| 7 | **Rating display** | P2 | MVM-SPECIFIC | 🔶 MOCKED | `averageRating` shown |
| 8 | **Conversion rate display** | P2 | MVM-SPECIFIC | 🔶 MOCKED | Field exists, not calculated |

**Vendor Dashboard: 1/8 Compliant (12.5%)**

---

### G. STOREFRONT INTEGRATION (6 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Multi-vendor product listing** | P0 | MVM-SPECIFIC | ❌ MISSING | No unified storefront |
| 2 | **Vendor filter on catalog** | P1 | MVM-SPECIFIC | ❌ MISSING | Not implemented |
| 3 | **Vendor profile page (public)** | P1 | MVM-SPECIFIC | ❌ MISSING | Only private dashboard exists |
| 4 | **Add to cart (vendor attribution)** | P0 | MVM-SPECIFIC | ❌ MISSING | No cart integration |
| 5 | **Checkout with multi-vendor cart** | P0 | MVM-SPECIFIC | ❌ MISSING | No checkout flow |
| 6 | **Post-purchase vendor notification** | P1 | MVM-SPECIFIC | ❌ MISSING | Notification types defined only |

**Storefront Integration: 0/6 Compliant (0%)**

---

### H. ADMIN/MARKETPLACE OPERATOR (8 Capabilities)

| # | Capability | Priority | Reuse | Status | Implementation Notes |
|---|------------|----------|-------|--------|----------------------|
| 1 | **Vendor list (admin view)** | P0 | MVM-SPECIFIC | ❌ MISSING | No admin vendor management |
| 2 | **Vendor approval/rejection** | P0 | MVM-SPECIFIC | ❌ MISSING | No admin approval flow |
| 3 | **Commission configuration** | P0 | MVM-SPECIFIC | ❌ MISSING | No admin settings |
| 4 | **Tier management** | P1 | MVM-SPECIFIC | ❌ MISSING | No tier CRUD admin UI |
| 5 | **Payout processing** | P1 | MVM-SPECIFIC | ❌ MISSING | No payout execution |
| 6 | **Platform-wide analytics** | P2 | MVM-SPECIFIC | ❌ MISSING | No marketplace analytics |
| 7 | **Dispute management** | P2 | MVM-SPECIFIC | ❌ MISSING | No dispute flow |
| 8 | **Vendor communication** | P2 | MVM-SPECIFIC | ❌ MISSING | No messaging system |

**Admin/Operator: 0/8 Compliant (0%)**

---

## 3️⃣ IMPLEMENTATION AUDIT SUMMARY

### What Currently Exists

| Layer | Location | Status | Notes |
|-------|----------|--------|-------|
| **UI Components** | `/frontend/src/components/mvm/` | 🔶 MOCKED | 5 vendor-facing components exist |
| **State Provider** | `MVMProvider.tsx` | 🔶 MOCKED | Falls back to in-memory demo data |
| **Type Definitions** | `/modules/mvm/src/lib/` | ✅ COMPLIANT | Well-designed types and engines |
| **API Routes** | `/api/mvm/*` | ❌ MISSING | No API route files exist |
| **Database Schema** | `schema.prisma` | ❌ MISSING | No `mvm_*` tables defined |
| **Admin UI** | N/A | ❌ MISSING | No marketplace operator UI |
| **Storefront** | N/A | ❌ MISSING | No customer-facing marketplace |

### Files Audited

| File | Purpose | Status |
|------|---------|--------|
| `/frontend/src/components/mvm/VendorDashboard.tsx` | Vendor dashboard UI | 🔶 Mocked |
| `/frontend/src/components/mvm/VendorOrders.tsx` | Order management UI | 🔶 Mocked |
| `/frontend/src/components/mvm/VendorProducts.tsx` | Product mapping UI | 🔶 Mocked |
| `/frontend/src/components/mvm/VendorEarnings.tsx` | Earnings/commission UI | 🔶 Mocked |
| `/frontend/src/components/mvm/VendorProfile.tsx` | Profile management UI | 🔶 Mocked |
| `/frontend/src/components/mvm/MVMProvider.tsx` | State management | 🔶 Demo data fallback |
| `/modules/mvm/src/lib/vendor-engine.ts` | Vendor lifecycle logic | ✅ Good design |
| `/modules/mvm/src/lib/vendor-dashboard.ts` | Dashboard data contracts | ✅ Good design |

### Capability Compliance Summary

| Category | Total | Compliant | Partial/Mocked | Missing | % Compliant |
|----------|-------|-----------|----------------|---------|-------------|
| A. Vendor Management | 12 | 3 | 3 | 6 | 25% |
| B. Product Mapping | 8 | 1 | 6 | 1 | 12.5% |
| C. Order Management | 10 | 1 | 5 | 4 | 10% |
| D. Commission & Payouts | 10 | 1 | 6 | 3 | 10% |
| E. Vendor Tiers | 6 | 4 | 1 | 1 | 66.7% |
| F. Vendor Dashboard | 8 | 1 | 6 | 1 | 12.5% |
| G. Storefront Integration | 6 | 0 | 0 | 6 | 0% |
| H. Admin/Operator | 8 | 0 | 0 | 8 | 0% |
| **TOTAL** | **68** | **11** | **27** | **30** | **16.2%** |

---

## 4️⃣ NIGERIA-FIRST COMPLIANCE CHECK

| Requirement | Current Status | Action Required |
|-------------|----------------|-----------------|
| **Currency: NGN** | ⚠️ USD in demo data | Must convert all amounts to NGN |
| **VAT: 7.5%** | ❌ Not implemented | Add VAT to commission calculation |
| **Bank transfer payouts** | ❌ Not implemented | Integrate with Nigerian payment rails |
| **Mobile money** | ❌ Not implemented | Support Opay, PalmPay, etc. |
| **WhatsApp notifications** | ❌ Not implemented | Add vendor notification channels |
| **Offline resilience** | 🟡 Demo data fallback | Need proper offline-first sync |
| **Simple onboarding** | ❌ Not implemented | Design low-friction vendor signup |

---

## 5️⃣ REUSE ANALYSIS

### From Existing Frozen Suites

| Source Suite | Reusable For MVM | Integration Approach |
|--------------|------------------|----------------------|
| **POS** | Cash handling for in-person vendor sales | Vendor as location context |
| **SVM** | Cart/checkout patterns | Extend for multi-vendor cart |
| **Inventory** | Stock tracking | Core owns stock, vendors see allocated |
| **Payments** | Payment processing | Split payment routing |
| **CRM** | Customer data | Shared customers across vendors |
| **Billing** | Invoice generation | Vendor commission invoices |

### From Platform Core

| Module | Reuse | Notes |
|--------|-------|-------|
| **Partner module** | Payout patterns | Commission structure mirrors partner earnings |
| **Entitlements** | Tier benefits | Capability gating per tier |
| **Notifications** | Vendor alerts | Extend notification system |
| **Activity Log** | Audit trail | Log vendor actions |

---

## 6️⃣ GAP ANALYSIS & PATH TO COMPLIANCE

### Critical Gaps (P0 - Must Implement)

1. **Database Schema** — No `mvm_*` tables exist
   - Proposed: `mvm_vendors`, `mvm_product_mappings`, `mvm_sub_orders`, `mvm_commissions`, `mvm_payouts`

2. **API Layer** — No `/api/mvm/*` routes
   - Need: Vendor CRUD, product mapping, order management, commission endpoints

3. **Order Splitting** — Core MVM capability missing
   - Cart → Parent Order → Vendor Sub-Orders

4. **Admin Panel** — No marketplace operator UI
   - Need: Vendor approval, commission config, payout processing

5. **Storefront** — No customer-facing marketplace
   - Need: Multi-vendor catalog, vendor profiles, unified checkout

### Medium Gaps (P1 - Should Implement)

6. **Payout Processing** — Commission tracked but not paid out
7. **Vendor Onboarding** — No self-serve registration
8. **NGN Currency** — Demo data uses USD

### Low Gaps (P2 - Nice to Have)

9. **Analytics Dashboard** — Platform-wide metrics
10. **Dispute Management** — Order dispute resolution
11. **Vendor Messaging** — In-platform communication

---

## 7️⃣ PROPOSED S2-S6 ROADMAP

### S2: Schema & Currency Standardization
- Create `mvm_*` Prisma models
- Default all amounts to NGN
- Add 7.5% VAT to commission logic
- Migration script for schema

### S3: Core Services
- `VendorService` — CRUD, status transitions
- `ProductMappingService` — Map/unmap products
- `OrderSplitService` — Split parent orders
- `CommissionService` — Calculate, track commissions
- `PayoutService` — Process vendor payouts

### S4: API Layer
- `/api/commerce/mvm/vendors/*`
- `/api/commerce/mvm/products/*`
- `/api/commerce/mvm/orders/*`
- `/api/commerce/mvm/commissions/*`
- `/api/commerce/mvm/admin/*`

### S5: UI & Demo Data
- Wire existing vendor UI to real APIs
- Create marketplace admin UI
- Create customer-facing storefront
- Nigerian demo data (Lagos marketplace)

### S6: Verification & Freeze
- End-to-end testing via `testing_agent_v3_fork`
- Nigeria-first compliance verification
- Documentation update
- FREEZE as Demo-Ready v1

---

## 8️⃣ ARCHITECTURE NOTES

### Key Principle: Vendors Are NOT Tenants

| Concept | Tenant | Vendor |
|---------|--------|--------|
| **Identity** | Platform customer | Seller within tenant |
| **Data ownership** | Full isolation | Scoped to their sales |
| **Billing** | Subscribes to platform | Receives payouts |
| **Products** | Owns Core catalog | Maps Core products |
| **Customers** | Owns customer data | Sees sanitized info |
| **Staff** | Full user management | Limited vendor staff |

### Order Flow

```
Customer → Marketplace Cart → Parent Order
                                    ↓
        ┌───────────────────────────┼───────────────────────────┐
        ↓                           ↓                           ↓
  Vendor A Sub-Order          Vendor B Sub-Order          Vendor C Sub-Order
        ↓                           ↓                           ↓
  Vendor A Fulfills           Vendor B Fulfills           Vendor C Fulfills
        ↓                           ↓                           ↓
  Commission Calculated       Commission Calculated       Commission Calculated
        ↓                           ↓                           ↓
  Payout to Vendor A          Payout to Vendor B          Payout to Vendor C
```

### Commission Flow

```
Order Subtotal (₦10,000)
    ↓
- VAT 7.5% (₦750) → Platform Tax Liability
    ↓
= Net Amount (₦9,250)
    ↓
- Platform Commission 15% (₦1,387.50) → Platform Revenue
    ↓
= Vendor Payout (₦7,862.50) → Pending until payout cycle
```

---

## 9️⃣ RISK ASSESSMENT

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Schema complexity** | High | Start minimal, iterate |
| **Order splitting edge cases** | High | Thorough testing |
| **Payout reconciliation** | High | Idempotent payout logic |
| **Vendor data isolation** | High | Strict tenant+vendor scoping |
| **Performance at scale** | Medium | Index vendor queries |
| **Currency conversion** | Low | NGN-only for MVP |

---

## 🔟 CONCLUSION

The MVM Suite is currently at **~16% compliance** with the canonical standard. The existing implementation consists of:

- **Good**: Well-designed type system and business logic engines
- **Good**: Functional vendor-facing UI components
- **Bad**: No database persistence (100% mocked)
- **Bad**: No API routes
- **Bad**: No admin/operator functionality
- **Bad**: No customer-facing marketplace
- **Bad**: USD instead of NGN

**Recommendation**: Proceed with S2-S6 to build the MVM Suite from scratch using the existing type definitions as a guide. The UI components can be rewired to real APIs. This is effectively a **rebuild** rather than a retrofit.

---

**Submitted for Approval**: December 2025
**Author**: E1 Agent
**Program**: PC-SCP (Platform Canonicalization & Suite Conformance Program)

---

### APPROVAL SECTION

- [ ] S0 Intent Approved
- [ ] S1 Capability Map Approved
- [ ] Proceed to S2 (Schema & Currency)

**User Approval Date**: ___________
**Approved By**: ___________
