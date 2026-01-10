# PRISMA BUILD BLOCKERS AUDIT REPORT

**Generated:** Phase 1 Dry-Run Audit  
**Date:** January 2026  
**Status:** READ-ONLY AUDIT (No code changes made)

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| **Total TypeScript Errors** | 1,322 |
| **Files Affected** | 119 |
| **Invalid Model Names (camelCase)** | 717 |
| **Other Type Errors** | 604 |
| **Unique Model Replacements Required** | 68 |

### Root Causes
1. **Invalid Prisma Model Names**: Code uses `camelCase` (e.g., `prisma.crmCampaign`) but schema uses `snake_case` (e.g., `prisma.crm_campaigns`)
2. **Missing Required Fields**: `prisma.*.create()` calls missing `id: uuidv4()` and `updatedAt: new Date()`
3. **Implicit `any` Types**: Many callback parameters lack type annotations
4. **Invalid Relation Names**: Includes use lowercase instead of PascalCase
5. **Missing Exports**: Some modules missing expected exports

---

## CATEGORY 1: INVALID MODEL NAMES (717 occurrences, 68 unique replacements)

These are the most critical errors blocking the build. Each requires a simple find/replace.

### Top 20 Model Replacements by Frequency

| Wrong (camelCase) | Correct (snake_case) | Occurrences |
|-------------------|----------------------|-------------|
| `prisma.logisticsDeliveryAssignment` | `prisma.logistics_delivery_assignments` | 40 |
| `prisma.procPurchaseOrder` | `prisma.proc_purchase_orders` | 27 |
| `prisma.procPurchaseRequest` | `prisma.proc_purchase_requests` | 26 |
| `prisma.integrationLog` | `prisma.integration_logs` | 25 |
| `prisma.payPaymentTransaction` | `prisma.pay_payment_transactions` | 25 |
| `prisma.crmCampaign` | `prisma.crm_campaigns` | 24 |
| `prisma.hrAttendanceRecord` | `prisma.hr_attendance_records` | 22 |
| `prisma.hrEmployeeProfile` | `prisma.hr_employee_profiles` | 20 |
| `prisma.integrationEventLog` | `prisma.integration_event_logs` | 20 |
| `prisma.payWallet` | `prisma.pay_wallets` | 20 |
| `prisma.mktAutomationWorkflow` | `prisma.mkt_automation_workflows` | 19 |
| `prisma.hrPayrollPeriod` | `prisma.hr_payroll_periods` | 18 |
| `prisma.logisticsDeliveryAgent` | `prisma.logistics_delivery_agents` | 18 |
| `prisma.crmLoyaltyProgram` | `prisma.crm_loyalty_programs` | 17 |
| `prisma.hrLeaveRequest` | `prisma.hr_leave_requests` | 16 |
| `prisma.hrPayslip` | `prisma.hr_payslips` | 16 |
| `prisma.procGoodsReceipt` | `prisma.proc_goods_receipts` | 16 |
| `prisma.hrConfiguration` | `prisma.hr_configurations` | 15 |
| `prisma.integrationProvider` | `prisma.integration_providers` | 15 |
| `prisma.integrationInstance` | `prisma.integration_instances` | 15 |

### Complete Model Replacement Map

```typescript
// AUTO-FIX REPLACEMENT MAP
const MODEL_REPLACEMENTS = {
  // Logistics (40+ occurrences)
  'logisticsDeliveryAssignment': 'logistics_delivery_assignments',
  'logisticsDeliveryAgent': 'logistics_delivery_agents',
  'logisticsConfiguration': 'logistics_configurations',
  'logisticsDeliveryZone': 'logistics_delivery_zones',
  'logisticsDeliveryProof': 'logistics_delivery_proofs',
  'logisticsDeliveryStatusHistory': 'logistics_delivery_status_history',
  'logisticsDeliveryPricingRule': 'logistics_delivery_pricing_rules',
  
  // Procurement (60+ occurrences)
  'procPurchaseOrder': 'proc_purchase_orders',
  'procPurchaseRequest': 'proc_purchase_requests',
  'procGoodsReceipt': 'proc_goods_receipts',
  'procConfiguration': 'proc_configurations',
  'procEventLog': 'proc_event_logs',
  'procSupplierPriceList': 'proc_supplier_price_lists',
  'procSupplierPerformance': 'proc_supplier_performance',
  'procPurchaseOrderItem': 'proc_purchase_order_items',
  'procGoodsReceiptItem': 'proc_goods_receipt_items',
  'procPurchaseRequestItem': 'proc_purchase_request_items',
  
  // Integrations (70+ occurrences)
  'integrationLog': 'integration_logs',
  'integrationEventLog': 'integration_event_logs',
  'integrationProvider': 'integration_providers',
  'integrationInstance': 'integration_instances',
  'integrationWebhook': 'integration_webhooks',
  'integrationCredential': 'integration_credentials',
  'developerApp': 'developer_apps',
  'apiKey': 'api_keys',
  'accessScope': 'access_scopes',
  
  // Payments (60+ occurrences)
  'payPaymentTransaction': 'pay_payment_transactions',
  'payWallet': 'pay_wallets',
  'payRefund': 'pay_refunds',
  'payPaymentIntent': 'pay_payment_intents',
  'payEventLog': 'pay_event_logs',
  'paySettlement': 'pay_settlements',
  
  // HR (80+ occurrences)
  'hrAttendanceRecord': 'hr_attendance_records',
  'hrEmployeeProfile': 'hr_employee_profiles',
  'hrPayrollPeriod': 'hr_payroll_periods',
  'hrLeaveRequest': 'hr_leave_requests',
  'hrPayslip': 'hr_payslips',
  'hrConfiguration': 'hr_configurations',
  'hrLeaveBalance': 'hr_leave_balances',
  'hrWorkSchedule': 'hr_work_schedules',
  'hrPayrollCalculation': 'hr_payroll_calculations',
  
  // CRM (60+ occurrences)
  'crmCampaign': 'crm_campaigns',
  'crmLoyaltyProgram': 'crm_loyalty_programs',
  'crmEngagementEvent': 'crm_engagement_events',
  'crmSegmentMembership': 'crm_segment_memberships',
  'crmLoyaltyTransaction': 'crm_loyalty_transactions',
  'crmCampaignAudience': 'crm_campaign_audiences',
  'crmLoyaltyRule': 'crm_loyalty_rules',
  
  // Marketing (20+ occurrences)
  'mktAutomationWorkflow': 'mkt_automation_workflows',
  'mktAutomationRun': 'mkt_automation_runs',
  'mktConfiguration': 'mkt_configurations',
  'mktAutomationTrigger': 'mkt_automation_triggers',
  'mktAutomationAction': 'mkt_automation_actions',
  'mktAutomationLog': 'mkt_automation_logs',
  
  // Commerce (15+ occurrences)
  'commerceWallet': 'commerce_wallets',
  'commerceWalletLedger': 'commerce_wallet_ledger',
  'svmShippingZone': 'svm_shipping_zones',
  'svmShippingRate': 'svm_shipping_rates',
  
  // Compliance (15+ occurrences)
  'complianceProfile': 'compliance_profiles',
  'complianceStatus': 'compliance_statuses',
  'complianceEventLog': 'compliance_event_logs',
  'taxComputationRecord': 'tax_computation_records',
  'taxConfiguration': 'tax_configurations',
  'regulatoryReport': 'regulatory_reports',
  'auditArtifact': 'audit_artifacts',
  
  // Inventory (special cases)
  'stockMovement': 'wh_stock_movement',
  
  // Billing (1 occurrence)
  'billing_addonsSubscription': 'billing_addon_subscriptions',
  
  // Intent
  'userIntent': 'user_intents',
};
```

### Files with Most Model Name Issues

| File | Error Count |
|------|-------------|
| `src/lib/logistics/agent-service.ts` | 40+ |
| `src/lib/crm/campaign-service.ts` | 30+ |
| `src/lib/hr/attendance-service.ts` | 25+ |
| `src/lib/integrations/audit-service.ts` | 25+ |
| `src/lib/procurement/purchase-order-service.ts` | 20+ |
| `src/lib/payments/payment-service.ts` | 20+ |
| `src/lib/inventory/transfer-service.ts` | 39 |
| `src/lib/inventory/reorder-service.ts` | 33 |

---

## CATEGORY 2: MISSING REQUIRED FIELDS (id/updatedAt)

Many `prisma.*.create()` calls are missing required fields.

### Pattern to Fix
```typescript
// BEFORE (missing required fields)
await prisma.some_model.create({
  data: {
    tenantId,
    name,
    // ... other fields
  }
});

// AFTER (with required fields)
import { v4 as uuidv4 } from 'uuid';

await prisma.some_model.create({
  data: {
    id: uuidv4(),
    updatedAt: new Date(),
    tenantId,
    name,
    // ... other fields
  }
});
```

### Files Requiring id/updatedAt Additions

These files have `.create()` calls missing `id` and/or `updatedAt`:

| File | Approximate Count |
|------|-------------------|
| `src/lib/billing/config-service.ts` | 2+ |
| `src/lib/billing/discount-service.ts` | 1+ |
| `src/lib/billing/event-service.ts` | 2+ |
| `src/lib/billing/grace-service.ts` | 1+ |
| `src/lib/billing/usage-service.ts` | 2+ |
| `src/lib/capabilities/activation-service.ts` | 2+ |
| `src/lib/commerce-wallet-service.ts` | 1+ |
| `src/lib/earnings-ledger.ts` | 2+ |
| `src/lib/entitlements.ts` | 1+ |
| `src/lib/partner/*.ts` | 10+ |
| `src/lib/partner-attribution.ts` | 3+ |
| `src/lib/partner-tenant-creation.ts` | 3+ |
| `src/lib/payout-readiness.ts` | 3+ |
| `src/lib/phase-3/*.ts` | 4+ |
| `src/lib/phase-4b/*.ts` | 5+ |
| `src/lib/platform-instance/*.ts` | 3+ |
| `src/lib/promotions-storage.ts` | 3+ |
| `src/lib/subscription.ts` | 5+ |
| `src/lib/subscription-events.ts` | 1+ |

---

## CATEGORY 3: OTHER TYPE ERRORS (604 occurrences)

### 3.1 Implicit `any` Types (~150 occurrences)

Many callback parameters lack type annotations:

```typescript
// BEFORE
items.map((item) => item.id)  // 'item' implicitly has 'any' type

// AFTER  
items.map((item: SomeType) => item.id)
```

**Affected Files:**
- `src/lib/crm/engagement-service.ts`
- `src/lib/hr/employee-service.ts`
- `src/lib/logistics/assignment-service.ts`
- `src/lib/payments/payment-service.ts`
- `src/lib/procurement/supplier-service.ts`
- And ~30 more files

### 3.2 Invalid Include Relations (~50 occurrences)

```typescript
// BEFORE (lowercase relation)
include: { product: true, location: true }

// AFTER (PascalCase as defined in schema)
include: { Product: true, Location: true }
```

**Affected Files:**
- `src/lib/core-services.ts` (23 errors)
- `src/lib/inventory/*.ts`
- `src/lib/logistics/*.ts`

### 3.3 Invalid Prisma Type References (~20 occurrences)

```typescript
// BEFORE
Prisma.CommerceWalletLedgerWhereInput

// AFTER
Prisma.commerce_wallet_ledgerWhereInput
```

### 3.4 Missing Model Properties

Some files reference models that don't exist or use wrong property names:

- `src/lib/capabilities/activation-service.ts`: `capabilityEventLog` should be `core_capability_event_logs`
- `src/lib/inventory/*.ts`: Multiple references to non-existent `warehouse`, `stockTransfer`, `reorderRule`
- `src/lib/payments/wallet-service.ts`: `payWalletTransaction` should be `pay_wallet_transactions`

### 3.5 Module Export Issues

| File | Issue |
|------|-------|
| `src/lib/payments/index.ts` | Missing exports: `WalletBalance`, `PaymentConfigService` |
| `src/lib/rules/commission.ts` | Missing exports from `commission-engine` |
| `src/lib/rules/discounts.ts` | Missing exports from `discount-service` |
| `src/lib/political/primary-service.ts` | Missing `PolPrimaryCapability` from `@prisma/client` |
| `src/lib/political/results-service.ts` | Non-exported `PolAuditAction` |

---

## PHASE 2 RECOMMENDED ACTIONS

### Step 1: Create Auto-Fix Script
Create a script that performs these replacements automatically with `// AUTO-FIX:` comments.

### Step 2: Model Name Replacement (Priority: CRITICAL)
Apply the 68 model name replacements across all affected files.

### Step 3: Add Missing Required Fields (Priority: HIGH)  
Add `id: uuidv4()` and `updatedAt: new Date()` to all create calls.

### Step 4: Fix Relation Names (Priority: MEDIUM)
Change lowercase includes to PascalCase.

### Step 5: Add Type Annotations (Priority: MEDIUM)
Add explicit types to callback parameters.

### Step 6: Fix Module Exports (Priority: LOW)
Add missing exports to module index files.

---

## PHASE 3 RECOMMENDATION: withPrismaDefaults Helper

To prevent future regressions, create a helper function:

```typescript
// src/lib/prisma-helpers.ts
import { v4 as uuidv4 } from 'uuid';

export function withPrismaDefaults<T extends Record<string, unknown>>(
  data: Omit<T, 'id' | 'updatedAt'>
): T {
  return {
    id: uuidv4(),
    updatedAt: new Date(),
    ...data,
  } as T;
}

// Usage:
await prisma.some_model.create({
  data: withPrismaDefaults({
    tenantId,
    name,
    // ... other fields
  })
});
```

---

## VERIFICATION

After all fixes are applied, run:
```bash
cd /app/frontend && yarn build
```

Expected result: **0 errors, successful build**

---

## APPENDIX: FULL FILE LIST

<details>
<summary>All 119 files with errors (click to expand)</summary>

```
src/lib/billing/config-service.ts
src/lib/billing/discount-service.ts
src/lib/billing/event-service.ts
src/lib/billing/grace-service.ts
src/lib/billing/usage-service.ts
src/lib/capabilities/activation-service.ts
src/lib/civic/constituent-service.ts
src/lib/civic/demo-data.ts
src/lib/commerce-wallet-service.ts
src/lib/compliance/config-service.ts
src/lib/compliance/event-service.ts
src/lib/compliance/reporting-service.ts
src/lib/compliance/status-service.ts
src/lib/compliance/tax-service.ts
src/lib/core-services.ts
src/lib/crm/campaign-service.ts
src/lib/crm/engagement-service.ts
src/lib/crm/entitlements-service.ts
src/lib/crm/loyalty-service.ts
src/lib/crm/offline-service.ts
src/lib/crm/segmentation-service.ts
src/lib/demo/quickstart.ts
src/lib/earnings-ledger.ts
src/lib/entitlements.ts
src/lib/health/services/lab-order-service.ts
src/lib/hr/attendance-service.ts
src/lib/hr/config-service.ts
src/lib/hr/employee-service.ts
src/lib/hr/entitlements-service.ts
src/lib/hr/event-service.ts
src/lib/hr/leave-service.ts
src/lib/hr/offline-service.ts
src/lib/hr/payroll-service.ts
src/lib/hr/payslip-service.ts
src/lib/integrations/audit-service.ts
src/lib/integrations/config-service.ts
src/lib/integrations/connector-service.ts
src/lib/integrations/developer-service.ts
src/lib/integrations/instance-service.ts
src/lib/integrations/provider-service.ts
src/lib/integrations/webhook-service.ts
src/lib/intent/service.ts
src/lib/inventory/audit-service.ts
src/lib/inventory/entitlements-service.ts
src/lib/inventory/event-emitter.ts
src/lib/inventory/event-service.ts
src/lib/inventory/offline-sync-service.ts
src/lib/inventory/reorder-service.ts
src/lib/inventory/transfer-service.ts
src/lib/inventory/warehouse-service.ts
src/lib/legal-practice/template-service.ts
src/lib/logistics/agent-service.ts
src/lib/logistics/assignment-service.ts
src/lib/logistics/config-service.ts
src/lib/logistics/entitlements-service.ts
src/lib/logistics/event-service.ts
src/lib/logistics/offline-service.ts
src/lib/logistics/proof-service.ts
src/lib/logistics/zone-service.ts
src/lib/marketing/config-service.ts
src/lib/marketing/entitlements-service.ts
src/lib/marketing/execution-service.ts
src/lib/marketing/workflow-service.ts
src/lib/mvm-event-handlers.ts
src/lib/mvm/order-split-service.ts
src/lib/mvm/vendor-service.ts
src/lib/partner-attribution.ts
src/lib/partner-audit.ts
src/lib/partner-authorization.ts
src/lib/partner-dashboard.ts
src/lib/partner-first/client-service.ts
src/lib/partner-first/guards.ts
src/lib/partner-tenant-creation.ts
src/lib/partner/commission-service.ts
src/lib/partner/config-service.ts
src/lib/partner/event-service.ts
src/lib/partner/onboarding-service.ts
src/lib/partner/referral-service.ts
src/lib/payments/config-service.ts
src/lib/payments/entitlements-service.ts
src/lib/payments/index.ts
src/lib/payments/partial-payment-service.ts
src/lib/payments/payment-service.ts
src/lib/payments/proof-service.ts
src/lib/payments/refund-service.ts
src/lib/payments/transfer-service.ts
src/lib/payments/wallet-service.ts
src/lib/payout-readiness.ts
src/lib/phase-3/instance-financials.ts
src/lib/phase-3/instance-subscription.ts
src/lib/phase-4b/client-lifecycle.ts
src/lib/phase-4b/expansion-signals.ts
src/lib/phase-4b/partner-dashboard.ts
src/lib/phase-4b/partner-packages.ts
src/lib/phase-4b/partner-staff.ts
src/lib/platform-instance/default-instance.ts
src/lib/platform-instance/instance-service.ts
src/lib/political/audit-service.ts
src/lib/political/primary-service.ts
src/lib/political/results-service.ts
src/lib/political/voting-service.ts
src/lib/procurement/config-service.ts
src/lib/procurement/entitlements-service.ts
src/lib/procurement/event-service.ts
src/lib/procurement/goods-receipt-service.ts
src/lib/procurement/offline-service.ts
src/lib/procurement/purchase-order-service.ts
src/lib/procurement/purchase-request-service.ts
src/lib/procurement/supplier-service.ts
src/lib/promotions-storage.ts
src/lib/rules/commission.ts
src/lib/rules/discounts.ts
src/lib/rules/promotions.ts
src/lib/shipping-storage.ts
src/lib/sites-funnels/domain-service.ts
src/lib/sites-funnels/permissions-service.ts
src/lib/sites-funnels/template-service.ts
src/lib/subscription-events.ts
src/lib/subscription.ts
```

</details>

---

**END OF PHASE 1 AUDIT REPORT**

**AWAITING USER APPROVAL TO PROCEED TO PHASE 2: CONTROLLED AUTO-FIX**
