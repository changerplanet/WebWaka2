# Commerce Suite: Commerce Rules Engine
## S0-S1: Audit & Capability Map

**Suite Code**: `COM-RULES`  
**Phase**: S0-S1 (Audit & Capability Mapping)  
**Completed**: January 2025  
**Status**: ✅ COMPLETE

---

## 1. Audit Summary

### 1.1 Existing Infrastructure Status

**FINDING**: Commerce Rules Engine has **fragmented implementations** across multiple modules, requiring **consolidation and canonicalization**.

| Component | Status | Location |
|-----------|--------|----------|
| Commission Engine | ✅ EXISTS | `/lib/commission-engine.ts` (standalone) |
| Discount Rules | ✅ EXISTS | `/lib/billing/discount-service.ts` |
| B2B Pricing Rules | ✅ EXISTS | `/lib/b2b/pricing-service.ts` |
| Promotions Engine | ✅ EXISTS | `/lib/promotions-storage.ts` (SVM) |
| Inventory Reorder Rules | ✅ EXISTS | `/lib/inventory/reorder-service.ts` |
| CRM Loyalty Rules | ✅ EXISTS | `crm_loyalty_rules` table |
| Automation Rules | ✅ EXISTS | `automation_rules` table |
| Logistics Pricing Rules | ✅ EXISTS | `logistics_delivery_pricing_rules` table |

### 1.2 Schema Tables (Rule-Related)

| Table | Suite | Purpose |
|-------|-------|---------|
| `automation_rules` | Automation | General automation triggers |
| `automation_runs` | Automation | Rule execution history |
| `b2b_wholesale_price_rules` | B2B | Wholesale pricing rules |
| `b2b_price_tiers` | B2B | Volume-based price tiers |
| `billing_discount_rules` | Billing | Discount/promo codes |
| `crm_loyalty_rules` | CRM | Loyalty point rules |
| `inv_reorder_rules` | Inventory | Auto-reorder thresholds |
| `inv_supplier_replenishment_rules` | Inventory | Supplier-specific rules |
| `logistics_delivery_pricing_rules` | Logistics | Delivery fee rules |
| `partner_commission_rules_ext` | Partner | Commission calculations |
| `svm_promotions` | SVM | Storefront promotions |
| `svm_promotion_usages` | SVM | Promotion usage tracking |

---

## 2. Existing Rule Types (Audit)

### 2.1 Commission Rules (Partner)

**File**: `/app/frontend/src/lib/commission-engine.ts`

| Feature | Status |
|---------|--------|
| Percentage commission | ✅ |
| Fixed commission | ✅ |
| Tiered commission | ✅ |
| Hybrid commission | ✅ |
| Event-based triggers | ✅ |
| Declarative rules | ✅ |

**Quality**: HIGH - Well-architected, declarative, Nigeria-ready

### 2.2 Discount Rules (Billing)

**File**: `/app/frontend/src/lib/billing/discount-service.ts`

| Feature | Status |
|---------|--------|
| Percentage discount | ✅ |
| Fixed amount discount | ✅ |
| Promo codes | ✅ |
| Max uses / per-tenant | ✅ |
| Date validity | ✅ |
| First-time only | ✅ |
| Min order value | ✅ |

**Quality**: MEDIUM - Functional but uses wrong Prisma model names

### 2.3 B2B Pricing Rules

**File**: `/app/frontend/src/lib/b2b/pricing-service.ts`

| Feature | Status |
|---------|--------|
| Price tiers | ✅ |
| Quantity breaks | ✅ |
| Customer-specific pricing | ✅ |
| Category-based rules | ✅ |
| Priority ordering | ✅ |

**Quality**: HIGH - Well-structured resolution logic

### 2.4 Promotions (SVM)

**File**: `/app/frontend/src/lib/promotions-storage.ts`

| Feature | Status |
|---------|--------|
| Coupon codes | ✅ |
| Automatic promotions | ✅ |
| Flash sales | ✅ |
| Buy X Get Y | ✅ |
| Free shipping | ✅ |
| Stackable promotions | ✅ |
| Usage limits | ✅ |
| Customer targeting | ✅ |

**Quality**: HIGH - Comprehensive promotion engine

### 2.5 Inventory Reorder Rules

**File**: `/app/frontend/src/lib/inventory/reorder-service.ts`

| Feature | Status |
|---------|--------|
| Min/max thresholds | ✅ |
| Reorder quantity | ✅ |
| Lead time | ✅ |
| Safety stock | ✅ |
| Auto-suggestions | ✅ |

**Quality**: HIGH - Nigeria-aware (accounts for supply delays)

### 2.6 CRM Loyalty Rules

**Table**: `crm_loyalty_rules`

| Feature | Status |
|---------|--------|
| Point earning rules | ✅ |
| Tier thresholds | ✅ |
| Reward redemption | ✅ |
| Expiration rules | ✅ |

**Quality**: MEDIUM - Exists in schema, limited service layer

### 2.7 Logistics Pricing Rules

**Table**: `logistics_delivery_pricing_rules`

| Feature | Status |
|---------|--------|
| Zone-based pricing | ✅ |
| Weight-based rates | ✅ |
| Distance rules | ✅ |
| Time-based surcharges | ✅ |

**Quality**: MEDIUM - Schema complete, limited service

---

## 3. Gap Analysis

### 3.1 What's Missing (P0 Gaps)

| Gap ID | Description | Priority |
|--------|-------------|----------|
| GAP-001 | No unified Rules API namespace | P0 |
| GAP-002 | No `/commerce-rules-demo` page | P1 |
| GAP-003 | Fragmented rule services | P1 |
| GAP-004 | No cross-suite rule orchestration | P2 |
| GAP-005 | No rule versioning | P2 |

### 3.2 What Exists But Needs Canonicalization

| Item | Current Location | Action Needed |
|------|------------------|---------------|
| Commission Engine | `/lib/commission-engine.ts` | Move to `/lib/rules/` |
| Discount Service | `/lib/billing/discount-service.ts` | Promote, fix Prisma |
| B2B Pricing | `/lib/b2b/pricing-service.ts` | Promote to canonical |
| Promotions | `/lib/promotions-storage.ts` | Rename, promote |
| Reorder Rules | `/lib/inventory/reorder-service.ts` | Already canonical |

---

## 4. Capability Assessment

### 4.1 What Commerce Rules Engine IS

| Capability | Status | Notes |
|------------|--------|-------|
| Pricing rules | ✅ | B2B, wholesale, tiers |
| Discount rules | ✅ | Billing-side |
| Promotion rules | ✅ | SVM storefront |
| Commission rules | ✅ | Partner |
| Inventory rules | ✅ | Reorder thresholds |
| Logistics pricing | ✅ | Delivery fees |
| Loyalty rules | ✅ | CRM points |
| Automation rules | ✅ | General triggers |

### 4.2 What Commerce Rules Engine is NOT

| Out of Scope | Reason |
|--------------|--------|
| Payment gateway rules | Payments suite domain |
| Accounting rules | Accounting suite domain |
| Tax calculation | VAT handled in Billing |
| Workflow engine | Separate concern |
| Business process automation | Phase 2 |

---

## 5. Nigeria-First Compliance

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| NGN pricing rules | Decimal precision | ✅ |
| Multi-tier B2B | Volume discounts | ✅ |
| Informal retail | Flash sales, cash discounts | ✅ |
| Logistics zones | Lagos, Abuja, etc. | ✅ |
| Commission models | Partner-specific | ✅ |

---

## 6. S2-S6 Recommendation

### 6.1 Recommended Approach

Given the **fragmented but functional** state, I recommend:

| Phase | Action |
|-------|--------|
| **S2** | Create unified schema (if needed) or validate existing |
| **S3** | Create `/lib/rules/` canonical namespace with re-exports |
| **S4** | Create `/api/commerce/rules/*` unified API |
| **S5** | Create `/commerce-rules-demo` page |
| **S6** | Verify & FREEZE |

### 6.2 Key Decision Point

**Option A (Recommended)**: Light Canonicalization
- Create barrel exports in `/lib/rules/`
- Expose via `/api/commerce/rules/*`
- Don't refactor existing working services
- Demo page showcases existing capabilities

**Option B**: Full Rewrite
- Consolidate all rule logic into single engine
- Requires significant schema changes
- Risk: Destabilizes frozen suites

**Recommendation**: Option A — Light Canonicalization

---

## 7. Files of Reference

| Path | Description |
|------|-------------|
| `/app/frontend/src/lib/commission-engine.ts` | Commission calculation |
| `/app/frontend/src/lib/billing/discount-service.ts` | Discount rules |
| `/app/frontend/src/lib/b2b/pricing-service.ts` | B2B pricing |
| `/app/frontend/src/lib/promotions-storage.ts` | SVM promotions |
| `/app/frontend/src/lib/inventory/reorder-service.ts` | Inventory rules |
| `/app/frontend/prisma/schema.prisma` | All `*_rules` tables |

---

## 8. Conclusion

**Commerce Rules Engine is ~70% complete** with functional implementations scattered across modules.

**Required for FREEZE**:
1. Create `/lib/rules/` barrel exports (S3)
2. Create `/api/commerce/rules/` API namespace (S4)
3. Create `/commerce-rules-demo` page (S5)
4. Full verification (S6)

**Explicitly NOT doing**:
- Full rule engine rewrite
- Schema consolidation
- Cross-suite orchestration (Phase 2)

---

*Document prepared under PC-SCP guidelines*  
*S0-S1 Audit & Capability Map — COMPLETE*
