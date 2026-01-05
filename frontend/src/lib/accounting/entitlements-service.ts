/**
 * MODULE 2: Accounting & Finance
 * Entitlements Service
 * 
 * Integrates with SaaS Core entitlement system for feature gating.
 * 
 * ENTITLEMENT KEYS:
 * - accounting_enabled: Basic accounting features
 * - accounting_advanced_reports: P&L, Balance Sheet, Cash Flow
 * - accounting_multi_currency: Multi-currency support (future)
 * - accounting_max_periods: Max financial periods (free tier limit)
 * - accounting_tax_reports: VAT/Tax reporting
 * - accounting_offline_sync: Offline expense sync
 * - accounting_api_access: API access for integrations
 * 
 * RULES:
 * - Module checks entitlements only
 * - No plan or pricing awareness
 * - Graceful degradation for missing entitlements
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export interface AccountingEntitlements {
  // Core features
  enabled: boolean;
  
  // Feature flags
  advancedReports: boolean;
  multiCurrency: boolean;
  taxReports: boolean;
  offlineSync: boolean;
  apiAccess: boolean;
  
  // Limits
  maxFinancialPeriods: number;
  maxExpensesPerMonth: number;
  maxAttachmentsPerExpense: number;
  
  // Tier info (for display only)
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
}

// ============================================================================
// DEFAULT ENTITLEMENTS BY TIER
// ============================================================================

const TIER_ENTITLEMENTS: Record<string, AccountingEntitlements> = {
  free: {
    enabled: true,
    advancedReports: false,
    multiCurrency: false,
    taxReports: false,
    offlineSync: false,
    apiAccess: false,
    maxFinancialPeriods: 3,
    maxExpensesPerMonth: 50,
    maxAttachmentsPerExpense: 1,
    tier: 'free',
  },
  starter: {
    enabled: true,
    advancedReports: true,
    multiCurrency: false,
    taxReports: true,
    offlineSync: false,
    apiAccess: false,
    maxFinancialPeriods: 12,
    maxExpensesPerMonth: 200,
    maxAttachmentsPerExpense: 3,
    tier: 'starter',
  },
  professional: {
    enabled: true,
    advancedReports: true,
    multiCurrency: true,
    taxReports: true,
    offlineSync: true,
    apiAccess: true,
    maxFinancialPeriods: 36,
    maxExpensesPerMonth: 1000,
    maxAttachmentsPerExpense: 5,
    tier: 'professional',
  },
  enterprise: {
    enabled: true,
    advancedReports: true,
    multiCurrency: true,
    taxReports: true,
    offlineSync: true,
    apiAccess: true,
    maxFinancialPeriods: -1, // Unlimited
    maxExpensesPerMonth: -1, // Unlimited
    maxAttachmentsPerExpense: 10,
    tier: 'enterprise',
  },
};

// ============================================================================
// ENTITLEMENTS SERVICE
// ============================================================================

export class AccountingEntitlementsService {
  /**
   * Get entitlements for a tenant
   * 
   * In production, this would query the Core subscription/entitlement system.
   * For now, we derive from a simplified tier lookup.
   */
  static async getEntitlements(tenantId: string): Promise<AccountingEntitlements> {
    // Check if accounting capability is active
    const activation = await prisma.tenantCapabilityActivation.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: 'accounting',
        },
      },
    });

    if (!activation || activation.status !== 'ACTIVE') {
      return {
        ...TIER_ENTITLEMENTS.free,
        enabled: false,
      };
    }

    // In a full implementation, query subscription tier
    // For now, return professional tier for active accounts
    // TODO: Integrate with Core subscription system
    
    // Check for tenant-specific entitlement overrides
    const overrides = await this.getTenantOverrides(tenantId);
    
    // Default to starter tier for now
    const baseEntitlements = TIER_ENTITLEMENTS.starter;
    
    return {
      ...baseEntitlements,
      ...overrides,
    };
  }

  /**
   * Check if a specific feature is entitled
   */
  static async checkFeature(
    tenantId: string,
    feature: keyof Omit<AccountingEntitlements, 'tier' | 'enabled'>
  ): Promise<{ entitled: boolean; limit?: number; reason?: string }> {
    const entitlements = await this.getEntitlements(tenantId);

    if (!entitlements.enabled) {
      return {
        entitled: false,
        reason: 'Accounting module is not enabled',
      };
    }

    const value = entitlements[feature];

    if (typeof value === 'boolean') {
      return {
        entitled: value,
        reason: value ? undefined : `${feature} is not included in your plan`,
      };
    }

    if (typeof value === 'number') {
      return {
        entitled: value !== 0,
        limit: value === -1 ? undefined : value,
        reason: value === 0 ? `${feature} limit reached` : undefined,
      };
    }

    return { entitled: true };
  }

  /**
   * Check usage against limits
   */
  static async checkUsage(
    tenantId: string,
    resource: 'expenses' | 'periods' | 'attachments',
    currentCount: number
  ): Promise<{ allowed: boolean; limit: number; used: number; remaining: number }> {
    const entitlements = await this.getEntitlements(tenantId);

    let limit: number;
    switch (resource) {
      case 'expenses':
        limit = entitlements.maxExpensesPerMonth;
        break;
      case 'periods':
        limit = entitlements.maxFinancialPeriods;
        break;
      case 'attachments':
        limit = entitlements.maxAttachmentsPerExpense;
        break;
      default:
        limit = -1;
    }

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        limit: -1,
        used: currentCount,
        remaining: -1,
      };
    }

    return {
      allowed: currentCount < limit,
      limit,
      used: currentCount,
      remaining: Math.max(0, limit - currentCount),
    };
  }

  /**
   * Get current month expense count
   */
  static async getCurrentMonthExpenseCount(tenantId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return prisma.acctExpenseRecord.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
  }

  /**
   * Get financial period count
   */
  static async getFinancialPeriodCount(tenantId: string): Promise<number> {
    return prisma.acctFinancialPeriod.count({
      where: { tenantId },
    });
  }

  /**
   * Get tenant-specific entitlement overrides
   * 
   * This allows for promotional upgrades, trials, etc.
   */
  private static async getTenantOverrides(
    tenantId: string
  ): Promise<Partial<AccountingEntitlements>> {
    // In production, this would query a tenant_entitlement_overrides table
    // For now, return empty (no overrides)
    return {};
  }

  /**
   * Get entitlement summary for display
   */
  static async getEntitlementSummary(tenantId: string) {
    const entitlements = await this.getEntitlements(tenantId);
    const expenseCount = await this.getCurrentMonthExpenseCount(tenantId);
    const periodCount = await this.getFinancialPeriodCount(tenantId);

    return {
      tier: entitlements.tier,
      enabled: entitlements.enabled,
      features: {
        advancedReports: entitlements.advancedReports,
        multiCurrency: entitlements.multiCurrency,
        taxReports: entitlements.taxReports,
        offlineSync: entitlements.offlineSync,
        apiAccess: entitlements.apiAccess,
      },
      usage: {
        expenses: {
          used: expenseCount,
          limit: entitlements.maxExpensesPerMonth,
          unlimited: entitlements.maxExpensesPerMonth === -1,
        },
        periods: {
          used: periodCount,
          limit: entitlements.maxFinancialPeriods,
          unlimited: entitlements.maxFinancialPeriods === -1,
        },
      },
    };
  }
}
