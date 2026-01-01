/**
 * POS Entitlements
 * 
 * Checks tenant's entitlements via SaaS Core.
 * POS does NOT know plan names or billing logic.
 * POS only checks: "Can this tenant do X?"
 */

// ============================================================================
// ENTITLEMENT TYPES (What POS checks)
// ============================================================================

export type POSEntitlement =
  | 'pos.access'              // Basic POS access
  | 'pos.offline_enabled'     // Can use offline mode
  | 'pos.multi_register'      // Can have multiple registers
  | 'pos.layaway'             // Layaway feature enabled
  | 'pos.advanced_discounts'  // Advanced discount rules
  | 'pos.custom_receipts'     // Custom receipt templates
  | 'pos.reports'             // Access to reports
  | 'pos.api_access'          // API access for integrations

export interface POSLimits {
  maxLocations: number | null    // null = unlimited
  maxRegisters: number | null
  maxStaff: number | null
  maxOfflineTransactions: number
  maxProductsCache: number
}

export interface POSEntitlementContext {
  tenantId: string
  entitlements: Set<POSEntitlement>
  limits: POSLimits
  expiresAt: Date | null
}

// ============================================================================
// ENTITLEMENT CHECK RESULT
// ============================================================================

export interface EntitlementCheckResult {
  allowed: boolean
  reason?: string
  upgradeHint?: string  // Suggest what to do (without mentioning plans)
}

// ============================================================================
// DEFAULT LIMITS (used when Core unavailable)
// ============================================================================

const DEFAULT_LIMITS: POSLimits = {
  maxLocations: 1,
  maxRegisters: 1,
  maxStaff: 5,
  maxOfflineTransactions: 50,
  maxProductsCache: 500
}

// ============================================================================
// ENTITLEMENT CHECKER
// ============================================================================

/**
 * Check if tenant has a specific POS entitlement
 */
export function hasEntitlement(
  context: POSEntitlementContext,
  entitlement: POSEntitlement
): EntitlementCheckResult {
  // Check if entitlement exists
  if (!context.entitlements.has(entitlement)) {
    return {
      allowed: false,
      reason: `Feature not available`,
      upgradeHint: 'Contact administrator to enable this feature'
    }
  }

  // Check expiration
  if (context.expiresAt && context.expiresAt < new Date()) {
    return {
      allowed: false,
      reason: 'Access has expired',
      upgradeHint: 'Contact administrator to renew access'
    }
  }

  return { allowed: true }
}

/**
 * Check if tenant can add another register
 */
export function canAddRegister(
  context: POSEntitlementContext,
  currentCount: number
): EntitlementCheckResult {
  // Must have multi-register entitlement for more than 1
  if (currentCount >= 1 && !context.entitlements.has('pos.multi_register')) {
    return {
      allowed: false,
      reason: 'Single register limit reached',
      upgradeHint: 'Enable multi-register support to add more registers'
    }
  }

  // Check limit
  if (context.limits.maxRegisters !== null && currentCount >= context.limits.maxRegisters) {
    return {
      allowed: false,
      reason: `Maximum ${context.limits.maxRegisters} registers reached`,
      upgradeHint: 'Contact administrator to increase register limit'
    }
  }

  return { allowed: true }
}

/**
 * Check if tenant can add another staff member
 */
export function canAddStaff(
  context: POSEntitlementContext,
  currentCount: number
): EntitlementCheckResult {
  if (context.limits.maxStaff !== null && currentCount >= context.limits.maxStaff) {
    return {
      allowed: false,
      reason: `Maximum ${context.limits.maxStaff} staff members reached`,
      upgradeHint: 'Contact administrator to increase staff limit'
    }
  }

  return { allowed: true }
}

/**
 * Check if tenant can use offline mode
 */
export function canUseOffline(context: POSEntitlementContext): EntitlementCheckResult {
  return hasEntitlement(context, 'pos.offline_enabled')
}

/**
 * Check if offline transaction limit exceeded
 */
export function canCreateOfflineTransaction(
  context: POSEntitlementContext,
  currentPendingCount: number
): EntitlementCheckResult {
  if (currentPendingCount >= context.limits.maxOfflineTransactions) {
    return {
      allowed: false,
      reason: `Offline limit reached (${context.limits.maxOfflineTransactions} transactions)`,
      upgradeHint: 'Connect to sync pending transactions before creating more'
    }
  }

  return { allowed: true }
}

/**
 * Check if tenant can use layaway
 */
export function canUseLayaway(context: POSEntitlementContext): EntitlementCheckResult {
  return hasEntitlement(context, 'pos.layaway')
}

/**
 * Check if tenant can use advanced discounts
 */
export function canUseAdvancedDiscounts(context: POSEntitlementContext): EntitlementCheckResult {
  return hasEntitlement(context, 'pos.advanced_discounts')
}

// ============================================================================
// ENTITLEMENT CONTEXT LOADER
// ============================================================================

/**
 * Interface for Core's entitlement service
 * POS calls this; Core implements it
 */
export interface CoreEntitlementService {
  getEntitlements(tenantId: string): Promise<{
    module: 'POS'
    features: string[]  // List of enabled features
    limits: Record<string, number | null>
    expiresAt: string | null
  } | null>
}

/**
 * Load entitlement context from Core
 */
export async function loadEntitlementContext(
  tenantId: string,
  coreService: CoreEntitlementService
): Promise<POSEntitlementContext> {
  try {
    const result = await coreService.getEntitlements(tenantId)

    if (!result) {
      // No POS entitlement at all
      return {
        tenantId,
        entitlements: new Set(),
        limits: DEFAULT_LIMITS,
        expiresAt: null
      }
    }

    // Map Core features to POS entitlements
    const entitlements = new Set<POSEntitlement>()
    entitlements.add('pos.access') // Base access granted

    if (result.features.includes('offline')) {
      entitlements.add('pos.offline_enabled')
    }
    if (result.features.includes('multi_register')) {
      entitlements.add('pos.multi_register')
    }
    if (result.features.includes('layaway')) {
      entitlements.add('pos.layaway')
    }
    if (result.features.includes('advanced_discounts')) {
      entitlements.add('pos.advanced_discounts')
    }
    if (result.features.includes('custom_receipts')) {
      entitlements.add('pos.custom_receipts')
    }
    if (result.features.includes('reports')) {
      entitlements.add('pos.reports')
    }
    if (result.features.includes('api')) {
      entitlements.add('pos.api_access')
    }

    // Map limits
    const limits: POSLimits = {
      maxLocations: result.limits.max_locations ?? DEFAULT_LIMITS.maxLocations,
      maxRegisters: result.limits.max_registers ?? DEFAULT_LIMITS.maxRegisters,
      maxStaff: result.limits.max_staff ?? DEFAULT_LIMITS.maxStaff,
      maxOfflineTransactions: result.limits.max_offline_transactions ?? DEFAULT_LIMITS.maxOfflineTransactions,
      maxProductsCache: result.limits.max_products_cache ?? DEFAULT_LIMITS.maxProductsCache
    }

    return {
      tenantId,
      entitlements,
      limits,
      expiresAt: result.expiresAt ? new Date(result.expiresAt) : null
    }
  } catch (error) {
    console.error('Failed to load entitlements:', error)
    
    // Return minimal entitlements on error (fail closed for paid features)
    return {
      tenantId,
      entitlements: new Set(['pos.access'] as POSEntitlement[]),
      limits: DEFAULT_LIMITS,
      expiresAt: null
    }
  }
}

// ============================================================================
// FAILURE HANDLING
// ============================================================================

/**
 * Standard failure responses for entitlement checks
 */
export function createEntitlementError(result: EntitlementCheckResult): {
  code: string
  message: string
  upgradeHint?: string
} {
  return {
    code: 'ENTITLEMENT_DENIED',
    message: result.reason || 'Action not permitted',
    upgradeHint: result.upgradeHint
  }
}

/**
 * UI-friendly message for entitlement failures
 */
export function getFailureMessage(result: EntitlementCheckResult): string {
  return result.reason || 'This feature is not available'
}

/**
 * Check if failure is due to limit (vs feature access)
 */
export function isLimitFailure(result: EntitlementCheckResult): boolean {
  return result.reason?.includes('limit') || result.reason?.includes('Maximum') || false
}
