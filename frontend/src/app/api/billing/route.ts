/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * API Routes
 * 
 * EXTENDS (not replaces) SaaS Core subscription engine.
 * No payment execution, no subscription duplication.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBillingModuleStatus,
  validateBillingModule,
  getBillingConfiguration,
  updateBillingConfiguration,
  initializeBillingForTenant,
  BILLING_MODULE,
} from '@/lib/billing/config-service';
import {
  createBundle,
  getBundle,
  listBundles,
  updateBundle,
  deactivateBundle,
  resolveBundleEntitlements,
  compareBundleSavings,
} from '@/lib/billing/bundle-service';
import {
  createAddOn,
  getAddOn,
  listAddOns,
  subscribeToAddOn,
  updateAddOnQuantity,
  cancelAddOnSubscription,
  getActiveAddOns,
  calculateAddOnTotal,
} from '@/lib/billing/addon-service';
import {
  createUsageMetric,
  listUsageMetrics,
  recordUsage,
  getUsageSummary,
  getUsageHistory,
  calculateOverageCharges,
} from '@/lib/billing/usage-service';
import {
  createDiscountRule,
  listDiscountRules,
  validateDiscount,
  calculateDiscount,
  recordDiscountUsage,
  getPartnerDiscounts,
} from '@/lib/billing/discount-service';
import {
  createGracePolicy,
  listGracePolicies,
  startGracePeriod,
  endGracePeriod,
  applyManualOverride,
  getGraceStatus,
} from '@/lib/billing/grace-service';
import {
  createAdjustment,
  listAdjustments,
  approveAdjustment,
  applyAdjustment,
  cancelAdjustment,
  getAdjustmentBalance,
} from '@/lib/billing/adjustment-service';
import {
  handlePaymentFailed,
  handlePaymentCompleted,
  handleSubscriptionCreated,
  handleSubscriptionRenewed,
  getBillingEvents,
} from '@/lib/billing/event-service';
import { getBillingEntitlements } from '@/lib/billing/entitlements-service';

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    const tenantId = searchParams.get('tenantId');
    
    switch (action) {
      // =====================================================================
      // MODULE STATUS
      // =====================================================================
      case 'status': {
        const status = await getBillingModuleStatus(tenantId || undefined);
        return NextResponse.json(status);
      }
      
      case 'manifest': {
        return NextResponse.json(BILLING_MODULE);
      }
      
      case 'validate': {
        const validation = await validateBillingModule();
        return NextResponse.json(validation);
      }
      
      case 'config': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const config = await getBillingConfiguration(tenantId);
        return NextResponse.json({ config });
      }
      
      case 'entitlements': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const entitlements = await getBillingEntitlements(tenantId);
        return NextResponse.json({ entitlements });
      }
      
      // =====================================================================
      // BUNDLES
      // =====================================================================
      case 'bundles': {
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const promotedOnly = searchParams.get('promotedOnly') === 'true';
        
        const bundles = await listBundles({
          tenantId: tenantId || undefined,
          activeOnly,
          promotedOnly,
        });
        return NextResponse.json({ bundles });
      }
      
      case 'bundle': {
        const bundleId = searchParams.get('bundleId');
        if (!bundleId) {
          return NextResponse.json({ error: 'bundleId required' }, { status: 400 });
        }
        
        const bundle = await getBundle(bundleId);
        if (!bundle) {
          return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
        }
        
        return NextResponse.json({ bundle });
      }
      
      case 'bundle-entitlements': {
        const bundleId = searchParams.get('bundleId');
        if (!bundleId) {
          return NextResponse.json({ error: 'bundleId required' }, { status: 400 });
        }
        
        const entitlements = await resolveBundleEntitlements(bundleId);
        return NextResponse.json(entitlements);
      }
      
      case 'bundle-savings': {
        const bundleId = searchParams.get('bundleId');
        if (!bundleId) {
          return NextResponse.json({ error: 'bundleId required' }, { status: 400 });
        }
        
        const savings = await compareBundleSavings(bundleId);
        return NextResponse.json(savings);
      }
      
      // =====================================================================
      // ADD-ONS
      // =====================================================================
      case 'addons': {
        const activeOnly = searchParams.get('activeOnly') !== 'false';
        const addOnType = searchParams.get('addOnType') as any;
        
        const addOns = await listAddOns({
          tenantId: tenantId || undefined,
          activeOnly,
          addOnType,
        });
        return NextResponse.json({ addOns });
      }
      
      case 'addon': {
        const addOnId = searchParams.get('addOnId');
        if (!addOnId) {
          return NextResponse.json({ error: 'addOnId required' }, { status: 400 });
        }
        
        const addOn = await getAddOn(addOnId);
        if (!addOn) {
          return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
        }
        
        return NextResponse.json({ addOn });
      }
      
      case 'active-addons': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const subscriptionId = searchParams.get('subscriptionId') || undefined;
        const activeAddOns = await getActiveAddOns(tenantId, subscriptionId);
        return NextResponse.json({ activeAddOns });
      }
      
      case 'addon-total': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const total = await calculateAddOnTotal(tenantId);
        return NextResponse.json(total);
      }
      
      // =====================================================================
      // USAGE
      // =====================================================================
      case 'usage-metrics': {
        const metrics = await listUsageMetrics({
          tenantId: tenantId || undefined,
          activeOnly: true,
        });
        return NextResponse.json({ metrics });
      }
      
      case 'usage-summary': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const periodStart = new Date(searchParams.get('periodStart') || new Date().toISOString());
        const periodEnd = new Date(searchParams.get('periodEnd') || new Date().toISOString());
        
        const summary = await getUsageSummary(tenantId, periodStart, periodEnd);
        return NextResponse.json(summary);
      }
      
      case 'usage-history': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const metricKey = searchParams.get('metricKey');
        if (!metricKey) {
          return NextResponse.json({ error: 'metricKey required' }, { status: 400 });
        }
        
        const limit = parseInt(searchParams.get('limit') || '12');
        const history = await getUsageHistory(tenantId, metricKey, limit);
        return NextResponse.json({ history });
      }
      
      // =====================================================================
      // DISCOUNTS
      // =====================================================================
      case 'discount-rules': {
        const partnerId = searchParams.get('partnerId') || undefined;
        
        const rules = await listDiscountRules({
          tenantId: tenantId || undefined,
          activeOnly: true,
          partnerId,
        });
        return NextResponse.json({ rules });
      }
      
      case 'validate-discount': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const code = searchParams.get('code');
        if (!code) {
          return NextResponse.json({ error: 'code required' }, { status: 400 });
        }
        
        const result = await validateDiscount({
          code,
          tenantId,
          planId: searchParams.get('planId') || undefined,
          orderValue: parseFloat(searchParams.get('orderValue') || '0'),
        });
        return NextResponse.json(result);
      }
      
      case 'calculate-discount': {
        const code = searchParams.get('code');
        const amount = parseFloat(searchParams.get('amount') || '0');
        
        if (!code || !amount) {
          return NextResponse.json({ error: 'code and amount required' }, { status: 400 });
        }
        
        const result = await calculateDiscount(code, amount);
        return NextResponse.json(result);
      }
      
      case 'partner-discounts': {
        const partnerId = searchParams.get('partnerId');
        if (!partnerId) {
          return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }
        
        const discounts = await getPartnerDiscounts(partnerId);
        return NextResponse.json({ discounts });
      }
      
      // =====================================================================
      // GRACE POLICIES
      // =====================================================================
      case 'grace-policies': {
        const policies = await listGracePolicies({
          tenantId: tenantId || undefined,
          activeOnly: true,
        });
        return NextResponse.json({ policies });
      }
      
      case 'grace-status': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const subscriptionId = searchParams.get('subscriptionId');
        if (!subscriptionId) {
          return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
        }
        
        const status = await getGraceStatus(tenantId, subscriptionId);
        return NextResponse.json(status);
      }
      
      // =====================================================================
      // ADJUSTMENTS
      // =====================================================================
      case 'adjustments': {
        const subscriptionId = searchParams.get('subscriptionId') || undefined;
        const type = searchParams.get('type') as any;
        const status = searchParams.get('status') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listAdjustments({
          tenantId: tenantId || undefined,
          subscriptionId,
          type,
          status,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      case 'adjustment-balance': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const balance = await getAdjustmentBalance(tenantId);
        return NextResponse.json(balance);
      }
      
      // =====================================================================
      // EVENTS
      // =====================================================================
      case 'events': {
        const subscriptionId = searchParams.get('subscriptionId') || undefined;
        const eventType = searchParams.get('eventType') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const result = await getBillingEvents({
          tenantId: tenantId || undefined,
          subscriptionId,
          eventType,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Billing API GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      // =====================================================================
      // CONFIGURATION
      // =====================================================================
      case 'initialize': {
        const { tenantId } = body;
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const result = await initializeBillingForTenant(tenantId);
        return NextResponse.json(result);
      }
      
      case 'update-config': {
        const { tenantId, data } = body;
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        
        const config = await updateBillingConfiguration(tenantId, data || {});
        return NextResponse.json({ success: true, config });
      }
      
      // =====================================================================
      // BUNDLES
      // =====================================================================
      case 'create-bundle': {
        const result = await createBundle(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'update-bundle': {
        const { bundleId, ...data } = body;
        if (!bundleId) {
          return NextResponse.json({ error: 'bundleId required' }, { status: 400 });
        }
        
        const result = await updateBundle(bundleId, data);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'deactivate-bundle': {
        const { bundleId } = body;
        if (!bundleId) {
          return NextResponse.json({ error: 'bundleId required' }, { status: 400 });
        }
        
        const result = await deactivateBundle(bundleId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // ADD-ONS
      // =====================================================================
      case 'create-addon': {
        const result = await createAddOn(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'subscribe-addon': {
        const { tenantId, subscriptionId, addOnId, quantity } = body;
        
        if (!tenantId || !subscriptionId || !addOnId) {
          return NextResponse.json(
            { error: 'tenantId, subscriptionId, and addOnId required' },
            { status: 400 }
          );
        }
        
        const result = await subscribeToAddOn({ tenantId, subscriptionId, addOnId, quantity });
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'update-addon-quantity': {
        const { subscriptionId, newQuantity } = body;
        
        if (!subscriptionId || newQuantity === undefined) {
          return NextResponse.json(
            { error: 'subscriptionId and newQuantity required' },
            { status: 400 }
          );
        }
        
        const result = await updateAddOnQuantity(subscriptionId, newQuantity);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'cancel-addon': {
        const { subscriptionId } = body;
        if (!subscriptionId) {
          return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
        }
        
        const result = await cancelAddOnSubscription(subscriptionId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // USAGE
      // =====================================================================
      case 'create-usage-metric': {
        const result = await createUsageMetric(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'record-usage': {
        const result = await recordUsage(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'calculate-overage': {
        const { tenantId, periodStart, periodEnd } = body;
        
        if (!tenantId || !periodStart || !periodEnd) {
          return NextResponse.json(
            { error: 'tenantId, periodStart, and periodEnd required' },
            { status: 400 }
          );
        }
        
        const result = await calculateOverageCharges(
          tenantId,
          new Date(periodStart),
          new Date(periodEnd)
        );
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // DISCOUNTS
      // =====================================================================
      case 'create-discount-rule': {
        const result = await createDiscountRule(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'record-discount-usage': {
        const { code } = body;
        if (!code) {
          return NextResponse.json({ error: 'code required' }, { status: 400 });
        }
        
        const result = await recordDiscountUsage(code);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // GRACE POLICIES
      // =====================================================================
      case 'create-grace-policy': {
        const result = await createGracePolicy(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'start-grace-period': {
        const { tenantId, subscriptionId, policyId, reason } = body;
        
        if (!tenantId || !subscriptionId) {
          return NextResponse.json(
            { error: 'tenantId and subscriptionId required' },
            { status: 400 }
          );
        }
        
        const result = await startGracePeriod({ tenantId, subscriptionId, policyId, reason });
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'end-grace-period': {
        const result = await endGracePeriod(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'manual-override': {
        const result = await applyManualOverride(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // ADJUSTMENTS
      // =====================================================================
      case 'create-adjustment': {
        const result = await createAdjustment(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'approve-adjustment': {
        const { adjustmentId, approvedBy } = body;
        
        if (!adjustmentId || !approvedBy) {
          return NextResponse.json(
            { error: 'adjustmentId and approvedBy required' },
            { status: 400 }
          );
        }
        
        const result = await approveAdjustment(adjustmentId, approvedBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'apply-adjustment': {
        const { adjustmentId } = body;
        if (!adjustmentId) {
          return NextResponse.json({ error: 'adjustmentId required' }, { status: 400 });
        }
        
        const result = await applyAdjustment(adjustmentId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'cancel-adjustment': {
        const { adjustmentId, cancelledBy } = body;
        if (!adjustmentId) {
          return NextResponse.json({ error: 'adjustmentId required' }, { status: 400 });
        }
        
        const result = await cancelAdjustment(adjustmentId, cancelledBy);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      // =====================================================================
      // EVENT PROCESSING
      // =====================================================================
      case 'process-payment-failed': {
        const result = await handlePaymentFailed(body);
        return NextResponse.json(result);
      }
      
      case 'process-payment-completed': {
        const result = await handlePaymentCompleted(body);
        return NextResponse.json(result);
      }
      
      case 'process-subscription-created': {
        const result = await handleSubscriptionCreated(body);
        return NextResponse.json(result);
      }
      
      case 'process-subscription-renewed': {
        const result = await handleSubscriptionRenewed(body);
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Billing API POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
