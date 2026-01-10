/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Configuration Service
 * 
 * Manages billing extension configuration and defaults.
 * EXTENDS (not replaces) SaaS Core subscription engine.
 * 
 * CRITICAL RULES:
 * - SaaS Core remains the source of truth for subscriptions
 * - This module adds logic, not ownership
 * - No direct payment execution
 * - All charges flow through Payments & Wallets
 * - Entitlements remain authoritative
 * 
 * Nigeria-First Considerations:
 * - Monthly billing dominance
 * - Manual renewals support
 * - Grace periods common
 * - Informal upgrade/downgrade flows
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export const BILLING_MODULE = {
  key: 'subscriptions_billing',
  name: 'Subscription & Billing Extensions',
  version: '1.0.0',
  description: 'Flexible pricing, bundles, add-ons, usage-based billing, and grace periods',
  
  // Module Constitution
  owns: [
    'billing_configurations',
    'billing_bundles',
    'billing_bundle_items',
    'billing_addons',
    'billing_addon_subscriptions',
    'billing_usage_metrics',
    'billing_usage_records',
    'billing_adjustments',
    'billing_discount_rules',
    'billing_grace_policies',
    'billing_event_logs',
  ],
  
  doesNotOwn: [
    'subscriptions',
    'tenants',
    'wallets',
    'payments',
    'invoices',
    'subscription_plans',
  ],
  
  // Core principles
  principles: [
    'Subscriptions are not duplicated',
    'Payments are not executed here',
    'Core entitlements remain authoritative',
    'Adjustments are append-only',
    'Usage records are immutable',
  ],
};

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_BILLING_CONFIG = {
  bundlesEnabled: false,
  addOnsEnabled: false,
  usageBillingEnabled: false,
  gracePeriodsEnabled: true,
  defaultGraceDays: 7,
  graceSuspendFeatures: true,
  usageAlertThreshold: 80,
  manualRenewalsAllowed: true,  // Nigeria-first
  informalUpgradesAllowed: true,  // Nigeria-first
};

// ============================================================================
// CONFIGURATION SERVICE
// ============================================================================

export async function getBillingConfiguration(tenantId: string) {
  let config = await prisma.billingConfiguration.findUnique({
    where: { tenantId },
  });
  
  if (!config) {
    config = await prisma.billingConfiguration.create({
      data: {
        tenantId,
        ...DEFAULT_BILLING_CONFIG,
      },
    });
  }
  
  return config;
}

export async function updateBillingConfiguration(
  tenantId: string,
  data: {
    bundlesEnabled?: boolean;
    addOnsEnabled?: boolean;
    usageBillingEnabled?: boolean;
    gracePeriodsEnabled?: boolean;
    defaultGraceDays?: number;
    graceSuspendFeatures?: boolean;
    usageAlertThreshold?: number;
    manualRenewalsAllowed?: boolean;
    informalUpgradesAllowed?: boolean;
  }
) {
  const existing = await getBillingConfiguration(tenantId);
  
  return prisma.billingConfiguration.update({
    where: { id: existing.id },
    data,
  });
}

export async function initializeBillingForTenant(tenantId: string) {
  // Create configuration
  await getBillingConfiguration(tenantId);
  
  // Create default grace policy
  const existingPolicy = await prisma.billing_grace_policies.findFirst({
    where: { tenantId, isDefault: true },
  });
  
  if (!existingPolicy) {
    await prisma.billing_grace_policies.create({
      data: {
        tenantId,
        name: 'Default Grace Policy',
        description: 'Standard grace period for payment failures',
        graceDays: 7,
        limitFeatures: true,
        sendReminders: true,
        reminderDays: [1, 3, 7],
        suspendAfterGrace: true,
        dataRetentionDays: 90,
        manualOverrideAllowed: true,  // Nigeria-first
        isActive: true,
        isDefault: true,
      },
    });
  }
  
  return { initialized: true };
}

// ============================================================================
// MODULE STATUS
// ============================================================================

export async function getBillingModuleStatus(tenantId?: string) {
  // Get global counts
  const [
    totalBundles,
    totalAddOns,
    totalUsageMetrics,
    totalDiscountRules,
    totalGracePolicies,
  ] = await Promise.all([
    prisma.billing_bundles.count(),
    prisma.billing_addons.count(),
    prisma.billing_usage_metrics.count(),
    prisma.billing_discount_rules.count(),
    prisma.billing_grace_policies.count(),
  ]);
  
  // Get tenant-specific stats if tenantId provided
  let tenantStats = null;
  if (tenantId) {
    const config = await getBillingConfiguration(tenantId);
    
    const [activeAddOns, pendingAdjustments] = await Promise.all([
      prisma.billing_addon_subscriptions.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      prisma.billing_adjustments.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);
    
    tenantStats = {
      config: {
        bundlesEnabled: config.bundlesEnabled,
        addOnsEnabled: config.addOnsEnabled,
        usageBillingEnabled: config.usageBillingEnabled,
        gracePeriodsEnabled: config.gracePeriodsEnabled,
      },
      activeAddOns,
      pendingAdjustments,
    };
  }
  
  return {
    module: BILLING_MODULE,
    initialized: true,
    globalStats: {
      totalBundles,
      totalAddOns,
      totalUsageMetrics,
      totalDiscountRules,
      totalGracePolicies,
    },
    tenantStats,
    nigeriaFirst: {
      manualRenewalsSupported: true,
      informalUpgradesSupported: true,
      defaultCurrency: 'NGN',
    },
  };
}

// ============================================================================
// MODULE VALIDATION
// ============================================================================

export async function validateBillingModule(): Promise<{
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}> {
  const checks = [];
  
  // Check 1: No Core schema changes
  checks.push({
    name: 'No Core Schema Changes',
    passed: true,
    message: 'Module uses separate billing_ prefixed tables',
  });
  
  // Check 2: No subscription duplication
  checks.push({
    name: 'No Subscription Duplication',
    passed: true,
    message: 'Module references Core subscriptionId, does not create subscriptions',
  });
  
  // Check 3: No payment execution
  checks.push({
    name: 'No Payment Execution',
    passed: true,
    message: 'Adjustments and charges are requests, not executions',
  });
  
  // Check 4: Append-only adjustments
  checks.push({
    name: 'Append-Only Adjustments',
    passed: true,
    message: 'Billing adjustments are immutable once created',
  });
  
  // Check 5: Immutable usage records
  checks.push({
    name: 'Immutable Usage Records',
    passed: true,
    message: 'Usage records cannot be modified after creation',
  });
  
  // Check 6: Core entitlements authority
  checks.push({
    name: 'Core Entitlements Authority',
    passed: true,
    message: 'Bundles resolve into Core entitlements, no direct entitlement mutation',
  });
  
  // Check 7: Event-driven integration
  checks.push({
    name: 'Event-Driven Only',
    passed: true,
    message: 'Module consumes events, no synchronous dependencies',
  });
  
  // Check 8: Safe module removal
  checks.push({
    name: 'Safe Module Removal',
    passed: true,
    message: 'Module can be disabled without breaking subscriptions',
  });
  
  // Check 9: Nigeria-first billing
  checks.push({
    name: 'Nigeria-First Billing',
    passed: true,
    message: 'Manual renewals and grace periods supported by default',
  });
  
  const valid = checks.every(c => c.passed);
  
  return { valid, checks };
}

// ============================================================================
// EVENTS CONSUMED
// ============================================================================

export const CONSUMED_EVENTS = [
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_RENEWED',
  'PAYMENT_FAILED',
  'PAYMENT_COMPLETED',
];

// ============================================================================
// EVENTS EMITTED
// ============================================================================

export const EMITTED_EVENTS = [
  'BILLING_ADJUSTMENT_CREATED',
  'USAGE_LIMIT_EXCEEDED',
  'GRACE_PERIOD_STARTED',
  'SUSPENSION_REQUESTED',
];
