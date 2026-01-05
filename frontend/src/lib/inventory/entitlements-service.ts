/**
 * MODULE 1: Inventory & Warehouse Management
 * Entitlements Service - Feature gating and usage limits
 * 
 * RULES:
 * - Module checks entitlements only
 * - No plan/billing awareness
 * - Entitlements are fetched from Core
 * - Module enforces limits, Core manages entitlements
 */

import { prisma } from '../prisma';

// ============================================================================
// ENTITLEMENT DEFINITIONS
// ============================================================================

/**
 * All entitlements used by the Inventory & Warehouse Management module
 * These are checked against tenant's subscription entitlements
 */
export const INVENTORY_ENTITLEMENTS = {
  // Warehouse limits
  MAX_WAREHOUSES: 'inventory.max_warehouses',
  WAREHOUSE_TYPES_ALLOWED: 'inventory.warehouse_types', // ['GENERAL', 'COLD_STORAGE', etc.]

  // Transfer limits
  MAX_TRANSFERS_PER_MONTH: 'inventory.max_transfers_per_month',
  MAX_ITEMS_PER_TRANSFER: 'inventory.max_items_per_transfer',
  TRANSFER_APPROVAL_REQUIRED: 'inventory.transfer_approval_required',

  // Audit limits
  MAX_AUDITS_PER_MONTH: 'inventory.max_audits_per_month',
  AUDIT_TYPES_ALLOWED: 'inventory.audit_types', // ['SPOT', 'CYCLE', 'FULL', 'ANNUAL']
  VARIANCE_AUTO_APPROVE_THRESHOLD: 'inventory.variance_auto_approve_pct',

  // Reorder features
  AUTO_REORDER_ENABLED: 'inventory.auto_reorder_enabled',
  MAX_REORDER_RULES: 'inventory.max_reorder_rules',
  VELOCITY_BASED_REORDER: 'inventory.velocity_based_reorder',
  SUPPLIER_INTELLIGENCE: 'inventory.supplier_intelligence',

  // Offline features
  OFFLINE_MODE_ENABLED: 'inventory.offline_mode_enabled',
  MAX_OFFLINE_QUEUE_SIZE: 'inventory.max_offline_queue',

  // Advanced features
  BATCH_LOT_TRACKING: 'inventory.batch_lot_tracking',
  EXPIRY_TRACKING: 'inventory.expiry_tracking',
  SERIAL_NUMBER_TRACKING: 'inventory.serial_tracking',
  BIN_LOCATION_MANAGEMENT: 'inventory.bin_locations',
  MULTI_CURRENCY: 'inventory.multi_currency',

  // Reporting
  ADVANCED_REPORTS: 'inventory.advanced_reports',
  EXPORT_ENABLED: 'inventory.export_enabled',

  // API access
  API_ACCESS: 'inventory.api_access',
  WEBHOOK_NOTIFICATIONS: 'inventory.webhooks',
} as const;

export type InventoryEntitlement = typeof INVENTORY_ENTITLEMENTS[keyof typeof INVENTORY_ENTITLEMENTS];

// ============================================================================
// DEFAULT ENTITLEMENTS BY TIER
// Used when entitlements are not explicitly set
// ============================================================================

export const DEFAULT_ENTITLEMENTS = {
  // Free/Basic tier defaults
  FREE: {
    [INVENTORY_ENTITLEMENTS.MAX_WAREHOUSES]: 1,
    [INVENTORY_ENTITLEMENTS.WAREHOUSE_TYPES_ALLOWED]: ['GENERAL'],
    [INVENTORY_ENTITLEMENTS.MAX_TRANSFERS_PER_MONTH]: 10,
    [INVENTORY_ENTITLEMENTS.MAX_ITEMS_PER_TRANSFER]: 20,
    [INVENTORY_ENTITLEMENTS.TRANSFER_APPROVAL_REQUIRED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_AUDITS_PER_MONTH]: 2,
    [INVENTORY_ENTITLEMENTS.AUDIT_TYPES_ALLOWED]: ['SPOT'],
    [INVENTORY_ENTITLEMENTS.AUTO_REORDER_ENABLED]: false,
    [INVENTORY_ENTITLEMENTS.MAX_REORDER_RULES]: 0,
    [INVENTORY_ENTITLEMENTS.VELOCITY_BASED_REORDER]: false,
    [INVENTORY_ENTITLEMENTS.SUPPLIER_INTELLIGENCE]: false,
    [INVENTORY_ENTITLEMENTS.OFFLINE_MODE_ENABLED]: false,
    [INVENTORY_ENTITLEMENTS.BATCH_LOT_TRACKING]: false,
    [INVENTORY_ENTITLEMENTS.EXPIRY_TRACKING]: false,
    [INVENTORY_ENTITLEMENTS.SERIAL_NUMBER_TRACKING]: false,
    [INVENTORY_ENTITLEMENTS.BIN_LOCATION_MANAGEMENT]: false,
    [INVENTORY_ENTITLEMENTS.MULTI_CURRENCY]: false,
    [INVENTORY_ENTITLEMENTS.ADVANCED_REPORTS]: false,
    [INVENTORY_ENTITLEMENTS.EXPORT_ENABLED]: false,
    [INVENTORY_ENTITLEMENTS.API_ACCESS]: false,
    [INVENTORY_ENTITLEMENTS.WEBHOOK_NOTIFICATIONS]: false,
  },

  // Standard tier defaults
  STANDARD: {
    [INVENTORY_ENTITLEMENTS.MAX_WAREHOUSES]: 3,
    [INVENTORY_ENTITLEMENTS.WAREHOUSE_TYPES_ALLOWED]: ['GENERAL', 'DISTRIBUTION'],
    [INVENTORY_ENTITLEMENTS.MAX_TRANSFERS_PER_MONTH]: 50,
    [INVENTORY_ENTITLEMENTS.MAX_ITEMS_PER_TRANSFER]: 50,
    [INVENTORY_ENTITLEMENTS.TRANSFER_APPROVAL_REQUIRED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_AUDITS_PER_MONTH]: 10,
    [INVENTORY_ENTITLEMENTS.AUDIT_TYPES_ALLOWED]: ['SPOT', 'CYCLE'],
    [INVENTORY_ENTITLEMENTS.AUTO_REORDER_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_REORDER_RULES]: 10,
    [INVENTORY_ENTITLEMENTS.VELOCITY_BASED_REORDER]: false,
    [INVENTORY_ENTITLEMENTS.SUPPLIER_INTELLIGENCE]: false,
    [INVENTORY_ENTITLEMENTS.OFFLINE_MODE_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_OFFLINE_QUEUE_SIZE]: 50,
    [INVENTORY_ENTITLEMENTS.BATCH_LOT_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.EXPIRY_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.SERIAL_NUMBER_TRACKING]: false,
    [INVENTORY_ENTITLEMENTS.BIN_LOCATION_MANAGEMENT]: false,
    [INVENTORY_ENTITLEMENTS.MULTI_CURRENCY]: false,
    [INVENTORY_ENTITLEMENTS.ADVANCED_REPORTS]: false,
    [INVENTORY_ENTITLEMENTS.EXPORT_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.API_ACCESS]: false,
    [INVENTORY_ENTITLEMENTS.WEBHOOK_NOTIFICATIONS]: false,
  },

  // Professional tier defaults
  PROFESSIONAL: {
    [INVENTORY_ENTITLEMENTS.MAX_WAREHOUSES]: 10,
    [INVENTORY_ENTITLEMENTS.WAREHOUSE_TYPES_ALLOWED]: ['GENERAL', 'DISTRIBUTION', 'COLD_STORAGE'],
    [INVENTORY_ENTITLEMENTS.MAX_TRANSFERS_PER_MONTH]: 200,
    [INVENTORY_ENTITLEMENTS.MAX_ITEMS_PER_TRANSFER]: 100,
    [INVENTORY_ENTITLEMENTS.TRANSFER_APPROVAL_REQUIRED]: false, // Optional
    [INVENTORY_ENTITLEMENTS.MAX_AUDITS_PER_MONTH]: 50,
    [INVENTORY_ENTITLEMENTS.AUDIT_TYPES_ALLOWED]: ['SPOT', 'CYCLE', 'FULL'],
    [INVENTORY_ENTITLEMENTS.VARIANCE_AUTO_APPROVE_THRESHOLD]: 5, // 5%
    [INVENTORY_ENTITLEMENTS.AUTO_REORDER_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_REORDER_RULES]: 50,
    [INVENTORY_ENTITLEMENTS.VELOCITY_BASED_REORDER]: true,
    [INVENTORY_ENTITLEMENTS.SUPPLIER_INTELLIGENCE]: true,
    [INVENTORY_ENTITLEMENTS.OFFLINE_MODE_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_OFFLINE_QUEUE_SIZE]: 200,
    [INVENTORY_ENTITLEMENTS.BATCH_LOT_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.EXPIRY_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.SERIAL_NUMBER_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.BIN_LOCATION_MANAGEMENT]: true,
    [INVENTORY_ENTITLEMENTS.MULTI_CURRENCY]: true,
    [INVENTORY_ENTITLEMENTS.ADVANCED_REPORTS]: true,
    [INVENTORY_ENTITLEMENTS.EXPORT_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.API_ACCESS]: true,
    [INVENTORY_ENTITLEMENTS.WEBHOOK_NOTIFICATIONS]: false,
  },

  // Enterprise tier defaults
  ENTERPRISE: {
    [INVENTORY_ENTITLEMENTS.MAX_WAREHOUSES]: -1, // Unlimited
    [INVENTORY_ENTITLEMENTS.WAREHOUSE_TYPES_ALLOWED]: ['GENERAL', 'DISTRIBUTION', 'COLD_STORAGE', 'BONDED'],
    [INVENTORY_ENTITLEMENTS.MAX_TRANSFERS_PER_MONTH]: -1, // Unlimited
    [INVENTORY_ENTITLEMENTS.MAX_ITEMS_PER_TRANSFER]: -1, // Unlimited
    [INVENTORY_ENTITLEMENTS.TRANSFER_APPROVAL_REQUIRED]: false,
    [INVENTORY_ENTITLEMENTS.MAX_AUDITS_PER_MONTH]: -1, // Unlimited
    [INVENTORY_ENTITLEMENTS.AUDIT_TYPES_ALLOWED]: ['SPOT', 'CYCLE', 'FULL', 'ANNUAL'],
    [INVENTORY_ENTITLEMENTS.VARIANCE_AUTO_APPROVE_THRESHOLD]: 10, // 10%
    [INVENTORY_ENTITLEMENTS.AUTO_REORDER_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_REORDER_RULES]: -1, // Unlimited
    [INVENTORY_ENTITLEMENTS.VELOCITY_BASED_REORDER]: true,
    [INVENTORY_ENTITLEMENTS.SUPPLIER_INTELLIGENCE]: true,
    [INVENTORY_ENTITLEMENTS.OFFLINE_MODE_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.MAX_OFFLINE_QUEUE_SIZE]: -1, // Unlimited
    [INVENTORY_ENTITLEMENTS.BATCH_LOT_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.EXPIRY_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.SERIAL_NUMBER_TRACKING]: true,
    [INVENTORY_ENTITLEMENTS.BIN_LOCATION_MANAGEMENT]: true,
    [INVENTORY_ENTITLEMENTS.MULTI_CURRENCY]: true,
    [INVENTORY_ENTITLEMENTS.ADVANCED_REPORTS]: true,
    [INVENTORY_ENTITLEMENTS.EXPORT_ENABLED]: true,
    [INVENTORY_ENTITLEMENTS.API_ACCESS]: true,
    [INVENTORY_ENTITLEMENTS.WEBHOOK_NOTIFICATIONS]: true,
  },
};

// ============================================================================
// ENTITLEMENTS SERVICE
// ============================================================================

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeRequired?: boolean;
}

export interface TenantEntitlements {
  tenantId: string;
  tier: string;
  entitlements: Record<string, unknown>;
  usage: Record<string, number>;
  fetchedAt: Date;
}

// Cache entitlements for performance
const entitlementCache: Map<string, TenantEntitlements> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class InventoryEntitlementsService {
  /**
   * Get tenant entitlements (with caching)
   */
  static async getTenantEntitlements(tenantId: string): Promise<TenantEntitlements> {
    // Check cache
    const cached = entitlementCache.get(tenantId);
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      return cached;
    }

    // Fetch tenant from Core
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        activatedModules: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Determine tier based on activated modules
    // In production, this would come from a subscription/billing system
    let tier = 'FREE';
    const moduleCount = tenant.activatedModules?.length || 0;

    // Simple tier determination based on module count
    // In production, fetch from billing/subscription service
    if (moduleCount >= 5) {
      tier = 'ENTERPRISE';
    } else if (moduleCount >= 3) {
      tier = 'PROFESSIONAL';
    } else if (moduleCount >= 1) {
      tier = 'STANDARD';
    }

    // Get default entitlements for tier
    const defaultEntitlements = DEFAULT_ENTITLEMENTS[tier as keyof typeof DEFAULT_ENTITLEMENTS] || DEFAULT_ENTITLEMENTS.FREE;

    // In production, would merge with custom entitlements from subscription
    const mergedEntitlements = { ...defaultEntitlements };

    // Get current usage
    const usage = await this.getCurrentUsage(tenantId);

    const result: TenantEntitlements = {
      tenantId,
      tier,
      entitlements: mergedEntitlements,
      usage,
      fetchedAt: new Date(),
    };

    // Cache
    entitlementCache.set(tenantId, result);

    return result;
  }

  /**
   * Get current usage for all metered entitlements
   */
  static async getCurrentUsage(tenantId: string): Promise<Record<string, number>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      warehouseCount,
      transfersThisMonth,
      auditsThisMonth,
      reorderRuleCount,
    ] = await Promise.all([
      prisma.warehouse.count({
        where: { tenantId, isActive: true },
      }),
      prisma.stockTransfer.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.inventoryAudit.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      prisma.reorderRule.count({
        where: { tenantId, isActive: true },
      }),
    ]);

    return {
      [INVENTORY_ENTITLEMENTS.MAX_WAREHOUSES]: warehouseCount,
      [INVENTORY_ENTITLEMENTS.MAX_TRANSFERS_PER_MONTH]: transfersThisMonth,
      [INVENTORY_ENTITLEMENTS.MAX_AUDITS_PER_MONTH]: auditsThisMonth,
      [INVENTORY_ENTITLEMENTS.MAX_REORDER_RULES]: reorderRuleCount,
    };
  }

  /**
   * Check if a feature is enabled
   */
  static async checkFeature(
    tenantId: string,
    feature: InventoryEntitlement
  ): Promise<EntitlementCheckResult> {
    const { entitlements } = await this.getTenantEntitlements(tenantId);
    const value = entitlements[feature];

    // Boolean features
    if (typeof value === 'boolean') {
      return {
        allowed: value,
        reason: value ? undefined : `Feature '${feature}' is not enabled for your plan`,
        upgradeRequired: !value,
      };
    }

    // If not explicitly false, assume allowed for feature flags
    return {
      allowed: value !== false,
      reason: value === false ? `Feature '${feature}' is not enabled for your plan` : undefined,
    };
  }

  /**
   * Check a numeric limit
   */
  static async checkLimit(
    tenantId: string,
    limitKey: InventoryEntitlement,
    currentUsage?: number
  ): Promise<EntitlementCheckResult> {
    const { entitlements, usage } = await this.getTenantEntitlements(tenantId);
    const limit = entitlements[limitKey] as number;
    const current = currentUsage ?? usage[limitKey] ?? 0;

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        currentUsage: current,
        limit: -1,
      };
    }

    const allowed = current < limit;
    return {
      allowed,
      reason: allowed ? undefined : `Limit reached: ${current}/${limit} for '${limitKey}'`,
      currentUsage: current,
      limit,
      upgradeRequired: !allowed,
    };
  }

  /**
   * Check if a value is in an allowed list
   */
  static async checkAllowedValue(
    tenantId: string,
    listKey: InventoryEntitlement,
    value: string
  ): Promise<EntitlementCheckResult> {
    const { entitlements } = await this.getTenantEntitlements(tenantId);
    const allowedList = entitlements[listKey] as string[] | undefined;

    if (!allowedList) {
      return { allowed: true }; // No restriction
    }

    const allowed = allowedList.includes(value);
    return {
      allowed,
      reason: allowed ? undefined : `'${value}' is not allowed. Allowed values: ${allowedList.join(', ')}`,
      upgradeRequired: !allowed,
    };
  }

  /**
   * Enforce warehouse creation limit
   */
  static async canCreateWarehouse(
    tenantId: string,
    warehouseType: string
  ): Promise<EntitlementCheckResult> {
    // Check warehouse count limit
    const countCheck = await this.checkLimit(tenantId, INVENTORY_ENTITLEMENTS.MAX_WAREHOUSES);
    if (!countCheck.allowed) {
      return countCheck;
    }

    // Check warehouse type allowed
    const typeCheck = await this.checkAllowedValue(
      tenantId,
      INVENTORY_ENTITLEMENTS.WAREHOUSE_TYPES_ALLOWED,
      warehouseType
    );
    if (!typeCheck.allowed) {
      return typeCheck;
    }

    return { allowed: true };
  }

  /**
   * Enforce transfer creation limit
   */
  static async canCreateTransfer(
    tenantId: string,
    itemCount: number
  ): Promise<EntitlementCheckResult> {
    // Check monthly transfer limit
    const countCheck = await this.checkLimit(tenantId, INVENTORY_ENTITLEMENTS.MAX_TRANSFERS_PER_MONTH);
    if (!countCheck.allowed) {
      return countCheck;
    }

    // Check items per transfer limit
    const { entitlements } = await this.getTenantEntitlements(tenantId);
    const maxItems = entitlements[INVENTORY_ENTITLEMENTS.MAX_ITEMS_PER_TRANSFER] as number;
    
    if (maxItems !== -1 && itemCount > maxItems) {
      return {
        allowed: false,
        reason: `Transfer has ${itemCount} items, but limit is ${maxItems}`,
        currentUsage: itemCount,
        limit: maxItems,
        upgradeRequired: true,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if transfer approval is required
   */
  static async isTransferApprovalRequired(tenantId: string): Promise<boolean> {
    const { entitlements } = await this.getTenantEntitlements(tenantId);
    return entitlements[INVENTORY_ENTITLEMENTS.TRANSFER_APPROVAL_REQUIRED] as boolean ?? true;
  }

  /**
   * Enforce audit creation limit
   */
  static async canCreateAudit(
    tenantId: string,
    auditType: string
  ): Promise<EntitlementCheckResult> {
    // Check monthly audit limit
    const countCheck = await this.checkLimit(tenantId, INVENTORY_ENTITLEMENTS.MAX_AUDITS_PER_MONTH);
    if (!countCheck.allowed) {
      return countCheck;
    }

    // Check audit type allowed
    const typeCheck = await this.checkAllowedValue(
      tenantId,
      INVENTORY_ENTITLEMENTS.AUDIT_TYPES_ALLOWED,
      auditType
    );
    if (!typeCheck.allowed) {
      return typeCheck;
    }

    return { allowed: true };
  }

  /**
   * Get variance auto-approve threshold
   */
  static async getVarianceAutoApproveThreshold(tenantId: string): Promise<number | null> {
    const { entitlements } = await this.getTenantEntitlements(tenantId);
    const threshold = entitlements[INVENTORY_ENTITLEMENTS.VARIANCE_AUTO_APPROVE_THRESHOLD];
    return typeof threshold === 'number' ? threshold : null;
  }

  /**
   * Enforce reorder rule creation limit
   */
  static async canCreateReorderRule(tenantId: string): Promise<EntitlementCheckResult> {
    // Check if auto reorder is enabled
    const featureCheck = await this.checkFeature(tenantId, INVENTORY_ENTITLEMENTS.AUTO_REORDER_ENABLED);
    if (!featureCheck.allowed) {
      return featureCheck;
    }

    // Check rule count limit
    return this.checkLimit(tenantId, INVENTORY_ENTITLEMENTS.MAX_REORDER_RULES);
  }

  /**
   * Check if velocity-based reorder is enabled
   */
  static async canUseVelocityBasedReorder(tenantId: string): Promise<boolean> {
    const check = await this.checkFeature(tenantId, INVENTORY_ENTITLEMENTS.VELOCITY_BASED_REORDER);
    return check.allowed;
  }

  /**
   * Check if offline mode is enabled
   */
  static async canUseOfflineMode(tenantId: string): Promise<EntitlementCheckResult> {
    return this.checkFeature(tenantId, INVENTORY_ENTITLEMENTS.OFFLINE_MODE_ENABLED);
  }

  /**
   * Get offline queue size limit
   */
  static async getOfflineQueueLimit(tenantId: string): Promise<number> {
    const { entitlements } = await this.getTenantEntitlements(tenantId);
    const limit = entitlements[INVENTORY_ENTITLEMENTS.MAX_OFFLINE_QUEUE_SIZE] as number;
    return limit ?? 50; // Default to 50
  }

  /**
   * Check if batch/lot tracking is enabled
   */
  static async canUseBatchLotTracking(tenantId: string): Promise<boolean> {
    const check = await this.checkFeature(tenantId, INVENTORY_ENTITLEMENTS.BATCH_LOT_TRACKING);
    return check.allowed;
  }

  /**
   * Check if API access is enabled
   */
  static async canUseApi(tenantId: string): Promise<boolean> {
    const check = await this.checkFeature(tenantId, INVENTORY_ENTITLEMENTS.API_ACCESS);
    return check.allowed;
  }

  /**
   * Get all entitlements for a tenant (for UI display)
   */
  static async getAllEntitlements(tenantId: string): Promise<{
    tier: string;
    features: Record<string, { enabled: boolean; value?: unknown }>;
    limits: Record<string, { current: number; max: number }>;
    usage: Record<string, number>;
  }> {
    const data = await this.getTenantEntitlements(tenantId);

    const features: Record<string, { enabled: boolean; value?: unknown }> = {};
    const limits: Record<string, { current: number; max: number }> = {};

    // Categorize entitlements
    for (const [key, value] of Object.entries(data.entitlements)) {
      if (typeof value === 'boolean') {
        features[key] = { enabled: value };
      } else if (Array.isArray(value)) {
        features[key] = { enabled: true, value };
      } else if (typeof value === 'number') {
        const usage = data.usage[key] ?? 0;
        limits[key] = { current: usage, max: value };
      }
    }

    return {
      tier: data.tier,
      features,
      limits,
      usage: data.usage,
    };
  }

  /**
   * Clear cache for a tenant (call after subscription changes)
   */
  static clearCache(tenantId: string): void {
    entitlementCache.delete(tenantId);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    entitlementCache.clear();
  }
}
