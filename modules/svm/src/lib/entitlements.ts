/**
 * SVM Entitlement Service
 * 
 * Checks entitlements for Single Vendor Marketplace module.
 * 
 * RULES:
 * - Module checks entitlements ONLY
 * - Module does NOT know plan names
 * - Module does NOT contain billing logic
 * - All limits come from Core
 * 
 * The module receives abstract limits like 'max_products' without
 * knowing if this is a "Free", "Pro", or "Enterprise" plan.
 */

// ============================================================================
// ENTITLEMENT DEFINITIONS
// ============================================================================

/**
 * SVM Features - boolean flags that can be enabled/disabled
 */
export const SVM_ENTITLEMENT_FEATURES = {
  STOREFRONT: 'storefront',
  CART: 'cart',
  CHECKOUT: 'checkout',
  ORDERS: 'orders',
  PROMOTIONS: 'promotions',
  REVIEWS: 'reviews',
  WISHLIST: 'wishlist',
  CMS: 'cms',
  SEO: 'seo',
  ANALYTICS: 'analytics',
  API: 'api',
  CUSTOM_DOMAIN: 'custom_domain',
  MULTI_CURRENCY: 'multi_currency',
  ADVANCED_SHIPPING: 'advanced_shipping',
  ABANDONED_CART: 'abandoned_cart',
} as const

export type SVMFeature = typeof SVM_ENTITLEMENT_FEATURES[keyof typeof SVM_ENTITLEMENT_FEATURES]

/**
 * SVM Limits - numeric limits that can be set
 */
export const SVM_ENTITLEMENT_LIMITS = {
  MAX_PRODUCTS: 'max_products',
  MAX_ORDERS_PER_MONTH: 'max_orders_per_month',
  MAX_STORAGE_MB: 'max_storage_mb',
  MAX_PROMOTIONS: 'max_promotions',
  MAX_BANNERS: 'max_banners',
  MAX_PAGES: 'max_pages',
  MAX_REVIEWS: 'max_reviews',
  MAX_IMAGES_PER_PRODUCT: 'max_images_per_product',
  MAX_VARIANTS_PER_PRODUCT: 'max_variants_per_product',
  MAX_SHIPPING_ZONES: 'max_shipping_zones',
} as const

export type SVMLimitKey = typeof SVM_ENTITLEMENT_LIMITS[keyof typeof SVM_ENTITLEMENT_LIMITS]

/**
 * Default entitlements for when no subscription is found
 * These are minimal limits for the free tier
 */
export const DEFAULT_ENTITLEMENTS: SVMEntitlements = {
  module: 'SVM',
  features: [
    SVM_ENTITLEMENT_FEATURES.STOREFRONT,
    SVM_ENTITLEMENT_FEATURES.CART,
    SVM_ENTITLEMENT_FEATURES.CHECKOUT,
    SVM_ENTITLEMENT_FEATURES.ORDERS,
  ],
  limits: {
    [SVM_ENTITLEMENT_LIMITS.MAX_PRODUCTS]: 50,
    [SVM_ENTITLEMENT_LIMITS.MAX_ORDERS_PER_MONTH]: 100,
    [SVM_ENTITLEMENT_LIMITS.MAX_STORAGE_MB]: 256,
    [SVM_ENTITLEMENT_LIMITS.MAX_PROMOTIONS]: 5,
    [SVM_ENTITLEMENT_LIMITS.MAX_BANNERS]: 3,
    [SVM_ENTITLEMENT_LIMITS.MAX_PAGES]: 5,
    [SVM_ENTITLEMENT_LIMITS.MAX_REVIEWS]: 100,
    [SVM_ENTITLEMENT_LIMITS.MAX_IMAGES_PER_PRODUCT]: 5,
    [SVM_ENTITLEMENT_LIMITS.MAX_VARIANTS_PER_PRODUCT]: 3,
    [SVM_ENTITLEMENT_LIMITS.MAX_SHIPPING_ZONES]: 3,
  },
  expiresAt: null
}

// ============================================================================
// TYPES
// ============================================================================

export interface SVMEntitlements {
  module: 'SVM'
  features: SVMFeature[]
  limits: Record<SVMLimitKey, number | null>  // null = unlimited
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
  limitKey: SVMLimitKey
  remaining?: number
}

export interface FeatureCheckResult extends EntitlementCheckResult {
  feature: SVMFeature
}

export interface SVMEntitlementServiceConfig {
  coreEntitlementsUrl: string
  tenantId: string
  cacheTimeMs?: number
}

// ============================================================================
// ENTITLEMENT SERVICE
// ============================================================================

export class SVMEntitlementService {
  private config: SVMEntitlementServiceConfig
  private cachedEntitlements: SVMEntitlements | null = null
  private cacheExpiry: number = 0
  private usageCounters: Map<string, number> = new Map()
  
  constructor(config: SVMEntitlementServiceConfig) {
    this.config = {
      ...config,
      cacheTimeMs: config.cacheTimeMs ?? 60000 // Default 1 minute cache
    }
  }
  
  // ==========================================================================
  // ENTITLEMENT FETCHING
  // ==========================================================================
  
  /**
   * Fetch entitlements from Core
   */
  async fetchEntitlements(): Promise<SVMEntitlements> {
    // Check cache
    if (this.cachedEntitlements && Date.now() < this.cacheExpiry) {
      return this.cachedEntitlements
    }
    
    try {
      const url = `${this.config.coreEntitlementsUrl}?tenantId=${this.config.tenantId}`
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn('[SVM Entitlements] Failed to fetch, using defaults')
        return DEFAULT_ENTITLEMENTS
      }
      
      const data = await response.json()
      
      if (!data.success) {
        return DEFAULT_ENTITLEMENTS
      }
      
      // Map Core response to SVMEntitlements
      const entitlements: SVMEntitlements = {
        module: 'SVM',
        features: data.features || DEFAULT_ENTITLEMENTS.features,
        limits: {
          ...DEFAULT_ENTITLEMENTS.limits,
          ...(data.limits || {})
        },
        expiresAt: data.expiresAt || null
      }
      
      // Update cache
      this.cachedEntitlements = entitlements
      this.cacheExpiry = Date.now() + (this.config.cacheTimeMs ?? 60000)
      
      return entitlements
    } catch (error) {
      console.error('[SVM Entitlements] Error fetching:', error)
      return DEFAULT_ENTITLEMENTS
    }
  }
  
  /**
   * Invalidate cached entitlements
   */
  invalidateCache(): void {
    this.cachedEntitlements = null
    this.cacheExpiry = 0
  }
  
  // ==========================================================================
  // FEATURE CHECKS
  // ==========================================================================
  
  /**
   * Check if a feature is enabled
   */
  async hasFeature(feature: SVMFeature): Promise<FeatureCheckResult> {
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
   * Require a feature (throws if not allowed)
   */
  async requireFeature(feature: SVMFeature): Promise<void> {
    const result = await this.hasFeature(feature)
    if (!result.allowed) {
      throw new EntitlementError(result.reason || 'Feature not allowed', feature)
    }
  }
  
  /**
   * Check multiple features
   */
  async hasFeatures(features: SVMFeature[]): Promise<Record<SVMFeature, boolean>> {
    const entitlements = await this.fetchEntitlements()
    const result: Record<string, boolean> = {}
    
    for (const feature of features) {
      result[feature] = entitlements.features.includes(feature)
    }
    
    return result as Record<SVMFeature, boolean>
  }
  
  // ==========================================================================
  // LIMIT CHECKS
  // ==========================================================================
  
  /**
   * Check if within limit
   */
  async checkLimit(
    limitKey: SVMLimitKey, 
    currentCount: number
  ): Promise<LimitCheckResult> {
    const entitlements = await this.fetchEntitlements()
    const limit = entitlements.limits[limitKey]
    
    // null means unlimited
    if (limit === null || limit === undefined) {
      return {
        limitKey,
        allowed: true,
        currentValue: currentCount,
        limitValue: null
      }
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
   * Check if can add one more (common use case)
   */
  async canAddOne(limitKey: SVMLimitKey, currentCount: number): Promise<boolean> {
    const result = await this.checkLimit(limitKey, currentCount)
    return result.allowed
  }
  
  /**
   * Check if can add N items
   */
  async canAdd(limitKey: SVMLimitKey, currentCount: number, addCount: number): Promise<LimitCheckResult> {
    const entitlements = await this.fetchEntitlements()
    const limit = entitlements.limits[limitKey]
    
    if (limit === null || limit === undefined) {
      return {
        limitKey,
        allowed: true,
        currentValue: currentCount,
        limitValue: null
      }
    }
    
    const newCount = currentCount + addCount
    const allowed = newCount <= limit
    
    return {
      limitKey,
      allowed,
      currentValue: currentCount,
      limitValue: limit,
      remaining: Math.max(0, limit - currentCount),
      reason: allowed ? undefined : `Cannot add ${addCount}. Would exceed limit: ${newCount}/${limit}`,
      upgradeRequired: !allowed
    }
  }
  
  /**
   * Get remaining capacity for a limit
   */
  async getRemaining(limitKey: SVMLimitKey, currentCount: number): Promise<number | null> {
    const entitlements = await this.fetchEntitlements()
    const limit = entitlements.limits[limitKey]
    
    if (limit === null || limit === undefined) {
      return null // unlimited
    }
    
    return Math.max(0, limit - currentCount)
  }
  
  /**
   * Get usage percentage (0-100)
   */
  async getUsagePercent(limitKey: SVMLimitKey, currentCount: number): Promise<number> {
    const entitlements = await this.fetchEntitlements()
    const limit = entitlements.limits[limitKey]
    
    if (limit === null || limit === undefined || limit === 0) {
      return 0 // unlimited or zero limit
    }
    
    return Math.min(100, Math.round((currentCount / limit) * 100))
  }
  
  // ==========================================================================
  // MONTHLY RESET LIMITS
  // ==========================================================================
  
  /**
   * Track monthly usage (e.g., orders per month)
   * This is a client-side counter that resets monthly
   */
  incrementMonthlyCounter(key: string): number {
    const monthKey = this.getMonthKey(key)
    const current = this.usageCounters.get(monthKey) || 0
    const newValue = current + 1
    this.usageCounters.set(monthKey, newValue)
    return newValue
  }
  
  /**
   * Get current monthly count
   */
  getMonthlyCount(key: string): number {
    const monthKey = this.getMonthKey(key)
    return this.usageCounters.get(monthKey) || 0
  }
  
  /**
   * Check monthly limit
   */
  async checkMonthlyLimit(limitKey: SVMLimitKey, key: string): Promise<LimitCheckResult> {
    const currentCount = this.getMonthlyCount(key)
    return this.checkLimit(limitKey, currentCount)
  }
  
  /**
   * Check and increment monthly counter in one call
   */
  async canIncrementMonthly(limitKey: SVMLimitKey, key: string): Promise<LimitCheckResult> {
    const currentCount = this.getMonthlyCount(key)
    const result = await this.checkLimit(limitKey, currentCount)
    
    if (result.allowed) {
      this.incrementMonthlyCounter(key)
    }
    
    return result
  }
  
  private getMonthKey(key: string): string {
    const now = new Date()
    return `${key}_${now.getFullYear()}_${now.getMonth()}`
  }
  
  // ==========================================================================
  // COMBINED CHECKS
  // ==========================================================================
  
  /**
   * Check both feature and limit
   */
  async checkFeatureAndLimit(
    feature: SVMFeature,
    limitKey: SVMLimitKey,
    currentCount: number
  ): Promise<EntitlementCheckResult> {
    const featureResult = await this.hasFeature(feature)
    
    if (!featureResult.allowed) {
      return featureResult
    }
    
    return this.checkLimit(limitKey, currentCount)
  }
  
  /**
   * Get all entitlements summary for UI display
   */
  async getSummary(): Promise<{
    features: Record<SVMFeature, boolean>
    limits: Record<SVMLimitKey, { value: number | null; label: string }>
    expiresAt: string | null
  }> {
    const entitlements = await this.fetchEntitlements()
    
    const features: Record<string, boolean> = {}
    for (const feature of Object.values(SVM_ENTITLEMENT_FEATURES)) {
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
      features: features as Record<SVMFeature, boolean>,
      limits: limits as Record<SVMLimitKey, { value: number | null; label: string }>,
      expiresAt: entitlements.expiresAt
    }
  }
}

// ============================================================================
// ENTITLEMENT ERROR
// ============================================================================

export class EntitlementError extends Error {
  public readonly feature?: SVMFeature
  public readonly limitKey?: SVMLimitKey
  public readonly upgradeRequired: boolean
  
  constructor(
    message: string,
    featureOrLimit?: SVMFeature | SVMLimitKey,
    upgradeRequired: boolean = true
  ) {
    super(message)
    this.name = 'EntitlementError'
    this.upgradeRequired = upgradeRequired
    
    // Determine if it's a feature or limit
    if (featureOrLimit) {
      if (Object.values(SVM_ENTITLEMENT_FEATURES).includes(featureOrLimit as SVMFeature)) {
        this.feature = featureOrLimit as SVMFeature
      } else {
        this.limitKey = featureOrLimit as SVMLimitKey
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let entitlementServiceInstance: SVMEntitlementService | null = null

/**
 * Initialize the global entitlement service
 */
export function initEntitlementService(config: SVMEntitlementServiceConfig): SVMEntitlementService {
  entitlementServiceInstance = new SVMEntitlementService(config)
  return entitlementServiceInstance
}

/**
 * Get the global entitlement service
 */
export function getEntitlementService(): SVMEntitlementService | null {
  return entitlementServiceInstance
}

/**
 * Quick entitlement check using global service
 */
export async function checkEntitlement(
  check: { feature?: SVMFeature; limit?: { key: SVMLimitKey; count: number } }
): Promise<EntitlementCheckResult> {
  if (!entitlementServiceInstance) {
    console.warn('[SVM Entitlements] Service not initialized')
    return { allowed: true } // Fail open if not configured
  }
  
  if (check.feature) {
    return entitlementServiceInstance.hasFeature(check.feature)
  }
  
  if (check.limit) {
    return entitlementServiceInstance.checkLimit(check.limit.key, check.limit.count)
  }
  
  return { allowed: true }
}

// ============================================================================
// DECORATOR HELPERS
// ============================================================================

/**
 * Check entitlements before calling a function
 * Returns a wrapper that throws EntitlementError if check fails
 */
export function withEntitlementCheck<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  check: { feature?: SVMFeature; limit?: { key: SVMLimitKey; getCount: () => number } }
): T {
  return (async (...args: unknown[]) => {
    const result = await checkEntitlement({
      feature: check.feature,
      limit: check.limit ? { key: check.limit.key, count: check.limit.getCount() } : undefined
    })
    
    if (!result.allowed) {
      throw new EntitlementError(
        result.reason || 'Entitlement check failed',
        check.feature || check.limit?.key
      )
    }
    
    return fn(...args)
  }) as T
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Format limit for display
 */
export function formatLimit(value: number | null): string {
  if (value === null) return 'Unlimited'
  return value.toLocaleString()
}

/**
 * Get upgrade prompt message
 */
export function getUpgradePrompt(result: EntitlementCheckResult): string {
  if (result.allowed) return ''
  
  if (result.limitValue !== undefined && result.limitValue !== null) {
    return `You've reached your limit of ${result.limitValue}. Upgrade to add more.`
  }
  
  return 'This feature requires an upgrade. Contact support to learn more.'
}

/**
 * Get usage bar color based on percentage
 */
export function getUsageColor(percent: number): 'green' | 'yellow' | 'red' {
  if (percent < 70) return 'green'
  if (percent < 90) return 'yellow'
  return 'red'
}
