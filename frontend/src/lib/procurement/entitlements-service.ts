/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Entitlements Service - Feature gating by subscription tier
 * 
 * PHASE 8: Entitlements
 * 
 * Module checks entitlements only - no pricing or plan awareness.
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface ProcEntitlementStatus {
  allowed: boolean
  limit?: number
  current?: number
  reason?: string
}

export interface ProcEntitlements {
  procurementEnabled: ProcEntitlementStatus
  maxPurchaseOrders: ProcEntitlementStatus
  maxPurchaseRequests: ProcEntitlementStatus
  supplierPriceList: ProcEntitlementStatus
  supplierAnalytics: ProcEntitlementStatus
  offlineSync: ProcEntitlementStatus
  advancedReports: ProcEntitlementStatus
}

// ============================================================================
// TIER LIMITS
// ============================================================================

const TIER_LIMITS = {
  FREE: {
    procurementEnabled: false,
    maxPurchaseOrders: 0,
    maxPurchaseRequests: 0,
    supplierPriceList: false,
    supplierAnalytics: false,
    offlineSync: false,
    advancedReports: false,
  },
  STARTER: {
    procurementEnabled: true,
    maxPurchaseOrders: 50,
    maxPurchaseRequests: 100,
    supplierPriceList: true,
    supplierAnalytics: false,
    offlineSync: false,
    advancedReports: false,
  },
  PROFESSIONAL: {
    procurementEnabled: true,
    maxPurchaseOrders: 500,
    maxPurchaseRequests: 1000,
    supplierPriceList: true,
    supplierAnalytics: true,
    offlineSync: true,
    advancedReports: true,
  },
  ENTERPRISE: {
    procurementEnabled: true,
    maxPurchaseOrders: -1, // Unlimited
    maxPurchaseRequests: -1,
    supplierPriceList: true,
    supplierAnalytics: true,
    offlineSync: true,
    advancedReports: true,
  },
}

// ============================================================================
// SERVICE
// ============================================================================

export class ProcEntitlementsService {
  /**
   * Get all entitlements for tenant
   */
  static async getEntitlements(tenantId: string): Promise<ProcEntitlements> {
    const tier = await this.getTenantTier(tenantId)
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE

    // Get current usage
    const [poCount, prCount] = await Promise.all([
      prisma.proc_purchase_orders.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.proc_purchase_requests.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    return {
      procurementEnabled: {
        allowed: limits.procurementEnabled,
        reason: limits.procurementEnabled ? undefined : 'Upgrade to Starter plan to enable procurement',
      },
      maxPurchaseOrders: {
        allowed: limits.maxPurchaseOrders === -1 || poCount < limits.maxPurchaseOrders,
        limit: limits.maxPurchaseOrders === -1 ? undefined : limits.maxPurchaseOrders,
        current: poCount,
        reason: limits.maxPurchaseOrders !== -1 && poCount >= limits.maxPurchaseOrders
          ? `Monthly PO limit (${limits.maxPurchaseOrders}) reached`
          : undefined,
      },
      maxPurchaseRequests: {
        allowed: limits.maxPurchaseRequests === -1 || prCount < limits.maxPurchaseRequests,
        limit: limits.maxPurchaseRequests === -1 ? undefined : limits.maxPurchaseRequests,
        current: prCount,
        reason: limits.maxPurchaseRequests !== -1 && prCount >= limits.maxPurchaseRequests
          ? `Monthly PR limit (${limits.maxPurchaseRequests}) reached`
          : undefined,
      },
      supplierPriceList: {
        allowed: limits.supplierPriceList,
        reason: limits.supplierPriceList ? undefined : 'Upgrade to Starter plan for price lists',
      },
      supplierAnalytics: {
        allowed: limits.supplierAnalytics,
        reason: limits.supplierAnalytics ? undefined : 'Upgrade to Professional plan for analytics',
      },
      offlineSync: {
        allowed: limits.offlineSync,
        reason: limits.offlineSync ? undefined : 'Upgrade to Professional plan for offline sync',
      },
      advancedReports: {
        allowed: limits.advancedReports,
        reason: limits.advancedReports ? undefined : 'Upgrade to Professional plan for advanced reports',
      },
    }
  }

  /**
   * Check specific entitlement
   */
  static async checkEntitlement(
    tenantId: string,
    entitlement: keyof ProcEntitlements
  ): Promise<ProcEntitlementStatus> {
    const entitlements = await this.getEntitlements(tenantId)
    return entitlements[entitlement]
  }

  /**
   * Enforce entitlement (throws if not allowed)
   */
  static async enforceEntitlement(
    tenantId: string,
    entitlement: keyof ProcEntitlements
  ): Promise<void> {
    const status = await this.checkEntitlement(tenantId, entitlement)
    if (!status.allowed) {
      throw new Error(status.reason || `Entitlement '${entitlement}' not allowed`)
    }
  }

  /**
   * Get tenant tier from subscription
   */
  private static async getTenantTier(tenantId: string): Promise<keyof typeof TIER_LIMITS> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { SubscriptionPlan: true },
        },
      },
    })

    const tenantAny = tenant as any;
    if (!tenantAny?.subscription?.SubscriptionPlan) {
      return 'FREE'
    }

    const planSlug = tenantAny.subscription.SubscriptionPlan.slug.toUpperCase()

    if (planSlug.includes('ENTERPRISE')) return 'ENTERPRISE'
    if (planSlug.includes('PROFESSIONAL') || planSlug.includes('PRO')) return 'PROFESSIONAL'
    if (planSlug.includes('STARTER') || planSlug.includes('BASIC')) return 'STARTER'

    return 'FREE'
  }

  /**
   * Get usage statistics
   */
  static async getUsage(tenantId: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [
      totalPOs,
      monthlyPOs,
      totalPRs,
      monthlyPRs,
      totalReceipts,
      totalSuppliers,
    ] = await Promise.all([
      prisma.proc_purchase_orders.count({ where: { tenantId } }),
      prisma.proc_purchase_orders.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.proc_purchase_requests.count({ where: { tenantId } }),
      prisma.proc_purchase_requests.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.proc_goods_receipts.count({ where: { tenantId } }),
      prisma.supplier.count({ where: { tenantId, status: 'ACTIVE' } }),
    ])

    const entitlements = await this.getEntitlements(tenantId)

    return {
      purchaseOrders: {
        total: totalPOs,
        thisMonth: monthlyPOs,
        limit: entitlements.maxPurchaseOrders.limit,
        percentUsed: entitlements.maxPurchaseOrders.limit
          ? Math.round((monthlyPOs / entitlements.maxPurchaseOrders.limit) * 100)
          : null,
      },
      purchaseRequests: {
        total: totalPRs,
        thisMonth: monthlyPRs,
        limit: entitlements.maxPurchaseRequests.limit,
        percentUsed: entitlements.maxPurchaseRequests.limit
          ? Math.round((monthlyPRs / entitlements.maxPurchaseRequests.limit) * 100)
          : null,
      },
      goodsReceipts: {
        total: totalReceipts,
      },
      suppliers: {
        active: totalSuppliers,
      },
    }
  }
}
