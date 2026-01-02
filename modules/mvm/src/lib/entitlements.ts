/**
 * MVM Entitlement Service
 * 
 * Checks entitlements for Multi Vendor Marketplace module.
 * 
 * RULES:
 * - Module checks entitlements ONLY
 * - Module does NOT know plan names
 * - Module does NOT contain billing logic
 * - All limits come from Core
 */

// ============================================================================
// ENTITLEMENT DEFINITIONS
// ============================================================================

/**
 * MVM Features - boolean flags that can be enabled/disabled
 */
export const MVM_ENTITLEMENT_FEATURES = {
  VENDORS: 'vendors',
  VENDOR_ONBOARDING: 'vendor_onboarding',
  VENDOR_DASHBOARD: 'vendor_dashboard',
  ORDER_SPLITTING: 'order_splitting',
  COMMISSION_MANAGEMENT: 'commission_management',
  PAYOUT_TRACKING: 'payout_tracking',
  VENDOR_TIERS: 'vendor_tiers',
  VENDOR_ANALYTICS: 'vendor_analytics',
  VENDOR_API: 'vendor_api',
  ADVANCED_COMMISSIONS: 'advanced_commissions', // Category/product-specific
  VENDOR_STAFF: 'vendor_staff',
  VENDOR_PROMOTIONS: 'vendor_promotions',
} as const

export type MVMFeature = typeof MVM_ENTITLEMENT_FEATURES[keyof typeof MVM_ENTITLEMENT_FEATURES]

/**
 * MVM Limits - numeric limits that can be set
 */
export const MVM_ENTITLEMENT_LIMITS = {
  MAX_VENDORS: 'max_vendors',
  MAX_VENDOR_STAFF_PER_VENDOR: 'max_vendor_staff_per_vendor',
  MAX_PRODUCTS_PER_VENDOR: 'max_products_per_vendor',
  MAX_COMMISSION_RULES: 'max_commission_rules',
  MAX_VENDOR_TIERS: 'max_vendor_tiers',
  COMMISSION_RATE_MIN: 'commission_rate_min',
  COMMISSION_RATE_MAX: 'commission_rate_max',
} as const

export type MVMLimitKey = typeof MVM_ENTITLEMENT_LIMITS[keyof typeof MVM_ENTITLEMENT_LIMITS]

/**
 * Default entitlements (free tier)
 */
export const DEFAULT_MVM_ENTITLEMENTS: MVMEntitlements = {
  module: 'MVM',
  features: [
    MVM_ENTITLEMENT_FEATURES.VENDORS,
    MVM_ENTITLEMENT_FEATURES.VENDOR_ONBOARDING,
    MVM_ENTITLEMENT_FEATURES.VENDOR_DASHBOARD,
    MVM_ENTITLEMENT_FEATURES.ORDER_SPLITTING,
    MVM_ENTITLEMENT_FEATURES.COMMISSION_MANAGEMENT,
    MVM_ENTITLEMENT_FEATURES.PAYOUT_TRACKING,
  ],
  limits: {
    [MVM_ENTITLEMENT_LIMITS.MAX_VENDORS]: 10,
    [MVM_ENTITLEMENT_LIMITS.MAX_VENDOR_STAFF_PER_VENDOR]: 3,
    [MVM_ENTITLEMENT_LIMITS.MAX_PRODUCTS_PER_VENDOR]: 50,
    [MVM_ENTITLEMENT_LIMITS.MAX_COMMISSION_RULES]: 5,
    [MVM_ENTITLEMENT_LIMITS.MAX_VENDOR_TIERS]: 3,
    [MVM_ENTITLEMENT_LIMITS.COMMISSION_RATE_MIN]: 5,
    [MVM_ENTITLEMENT_LIMITS.COMMISSION_RATE_MAX]: 30,
  },
  expiresAt: null
}

// ============================================================================
// TYPES
// ============================================================================

export interface MVMEntitlements {
  module: 'MVM'
  features: MVMFeature[]
  limits: Record<MVMLimitKey, number | null>
  expiresAt: string | null
}

export interface EntitlementCheckResult {
  allowed: boolean
  reason?: string
  upgradeRequired?: boolean
  currentValue?: number
  limitValue?: number | null
}

export interface LimitCheckResult extends EntitlementCheckResult {
  limitKey: MVMLimitKey
  remaining?: number
}

export interface FeatureCheckResult extends EntitlementCheckResult {
  feature: MVMFeature
}

export interface MVMEntitlementServiceConfig {
  coreEntitlementsUrl: string
  tenantId: string
  cacheTimeMs?: number
}

// ============================================================================
// ENTITLEMENT SERVICE
// ============================================================================

export class MVMEntitlementService {
  private config: MVMEntitlementServiceConfig
  private cachedEntitlements: MVMEntitlements | null = null
  private cacheExpiry: number = 0
  
  constructor(config: MVMEntitlementServiceConfig) {
    this.config = {
      ...config,
      cacheTimeMs: config.cacheTimeMs ?? 60000
    }
  }
  
  /**
   * Fetch entitlements from Core
   */
  async fetchEntitlements(): Promise<MVMEntitlements> {
    if (this.cachedEntitlements && Date.now() < this.cacheExpiry) {
      return this.cachedEntitlements
    }
    
    try {
      const url = `${this.config.coreEntitlementsUrl}?tenantId=${this.config.tenantId}&module=MVM`
      const response = await fetch(url)
      
      if (!response.ok) {
        return DEFAULT_MVM_ENTITLEMENTS
      }
      
      const data = await response.json()
      
      const entitlements: MVMEntitlements = {
        module: 'MVM',
        features: data.features || DEFAULT_MVM_ENTITLEMENTS.features,
        limits: { ...DEFAULT_MVM_ENTITLEMENTS.limits, ...(data.limits || {}) },
        expiresAt: data.expiresAt || null
      }
      
      this.cachedEntitlements = entitlements
      this.cacheExpiry = Date.now() + (this.config.cacheTimeMs ?? 60000)
      
      return entitlements
    } catch {
      return DEFAULT_MVM_ENTITLEMENTS
    }
  }
  
  /**
   * Check if a feature is enabled
   */
  async hasFeature(feature: MVMFeature): Promise<FeatureCheckResult> {
    const entitlements = await this.fetchEntitlements()
    const allowed = entitlements.features.includes(feature)
    
    return {
      feature,
      allowed,
      reason: allowed ? undefined : `Feature '${feature}' is not included in your plan`,
      upgradeRequired: !allowed
    }
  }
  
  /**
   * Check if within limit
   */
  async checkLimit(limitKey: MVMLimitKey, currentCount: number): Promise<LimitCheckResult> {
    const entitlements = await this.fetchEntitlements()
    const limit = entitlements.limits[limitKey]
    
    if (limit === null || limit === undefined) {
      return { limitKey, allowed: true, currentValue: currentCount, limitValue: null }
    }
    
    const allowed = currentCount < limit
    const remaining = Math.max(0, limit - currentCount)
    
    return {
      limitKey,
      allowed,
      currentValue: currentCount,
      limitValue: limit,
      remaining,
      reason: allowed ? undefined : `Limit reached: ${currentCount}/${limit} ${limitKey.replace('max_', '')}`,
      upgradeRequired: !allowed
    }
  }
  
  /**
   * Check commission rate against limits
   */
  async checkCommissionRate(rate: number): Promise<EntitlementCheckResult> {
    const entitlements = await this.fetchEntitlements()
    const minRate = entitlements.limits[MVM_ENTITLEMENT_LIMITS.COMMISSION_RATE_MIN] ?? 0
    const maxRate = entitlements.limits[MVM_ENTITLEMENT_LIMITS.COMMISSION_RATE_MAX] ?? 100
    
    if (rate < minRate) {
      return {
        allowed: false,
        reason: `Commission rate cannot be below ${minRate}%`,
        upgradeRequired: true
      }
    }
    
    if (rate > maxRate) {
      return {
        allowed: false,
        reason: `Commission rate cannot exceed ${maxRate}%`,
        upgradeRequired: true
      }
    }
    
    return { allowed: true }
  }
  
  /**
   * Invalidate cache
   */
  invalidateCache(): void {
    this.cachedEntitlements = null
    this.cacheExpiry = 0
  }
  
  /**
   * Get entitlements summary
   */
  async getSummary(): Promise<{
    features: Record<MVMFeature, boolean>
    limits: Record<MVMLimitKey, { value: number | null; label: string }>
  }> {
    const entitlements = await this.fetchEntitlements()
    
    const features: Record<string, boolean> = {}
    for (const feature of Object.values(MVM_ENTITLEMENT_FEATURES)) {
      features[feature] = entitlements.features.includes(feature)
    }
    
    const limits: Record<string, { value: number | null; label: string }> = {}
    for (const [key, value] of Object.entries(entitlements.limits)) {
      limits[key] = {
        value,
        label: value === null ? 'Unlimited' : String(value)
      }
    }
    
    return {
      features: features as Record<MVMFeature, boolean>,
      limits: limits as Record<MVMLimitKey, { value: number | null; label: string }>
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let serviceInstance: MVMEntitlementService | null = null

export function initMVMEntitlementService(config: MVMEntitlementServiceConfig): MVMEntitlementService {
  serviceInstance = new MVMEntitlementService(config)
  return serviceInstance
}

export function getMVMEntitlementService(): MVMEntitlementService | null {
  return serviceInstance
}

export async function checkMVMEntitlement(
  check: { feature?: MVMFeature; limit?: { key: MVMLimitKey; count: number } }
): Promise<EntitlementCheckResult> {
  if (!serviceInstance) {
    return { allowed: true }
  }
  
  if (check.feature) {
    return serviceInstance.hasFeature(check.feature)
  }
  
  if (check.limit) {
    return serviceInstance.checkLimit(check.limit.key, check.limit.count)
  }
  
  return { allowed: true }
}

// ============================================================================
// ENTITLEMENT ERROR
// ============================================================================

export class MVMEntitlementError extends Error {
  public readonly feature?: MVMFeature
  public readonly limitKey?: MVMLimitKey
  public readonly upgradeRequired: boolean
  
  constructor(message: string, featureOrLimit?: MVMFeature | MVMLimitKey, upgradeRequired: boolean = true) {
    super(message)
    this.name = 'MVMEntitlementError'
    this.upgradeRequired = upgradeRequired
    
    if (featureOrLimit) {
      if (Object.values(MVM_ENTITLEMENT_FEATURES).includes(featureOrLimit as MVMFeature)) {
        this.feature = featureOrLimit as MVMFeature
      } else {
        this.limitKey = featureOrLimit as MVMLimitKey
      }
    }
  }
}
