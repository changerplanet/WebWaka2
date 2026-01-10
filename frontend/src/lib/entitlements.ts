/**
 * Entitlement Service
 * 
 * THE ONLY INTERFACE MODULES SHOULD USE FOR ACCESS CHECKS
 * 
 * Modules check entitlements, NOT:
 * - Subscriptions
 * - Payments
 * - Partner relationships
 * - Commission logic
 * 
 * This provides a clean abstraction layer that:
 * 1. Isolates modules from subscription complexity
 * 2. Enables flexible entitlement sources (subscription, promo, manual)
 * 3. Keeps partner logic completely out of modules
 */

import { prisma } from './prisma'
import { EntitlementStatus, Entitlement } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface EntitlementCheck {
  hasAccess: boolean
  module: string
  status: EntitlementStatus | null
  validUntil: Date | null
  limits: Record<string, any> | null
  source: string | null
}

export interface ModuleEntitlements {
  [module: string]: EntitlementCheck
}

// Available modules in the system
export const AVAILABLE_MODULES = ['POS', 'SVM', 'MVM'] as const
export type ModuleType = typeof AVAILABLE_MODULES[number]

// ============================================================================
// ENTITLEMENT CHECKS - USE THESE IN MODULES
// ============================================================================

/**
 * Check if tenant has access to a specific module
 * 
 * THIS IS THE FUNCTION MODULES SHOULD CALL
 * 
 * @example
 * ```typescript
 * // In POS module:
 * const access = await hasModuleAccess(tenantId, 'POS')
 * if (!access.hasAccess) {
 *   return { error: 'POS module not available' }
 * }
 * ```
 */
export async function hasModuleAccess(
  tenantId: string, 
  module: ModuleType
): Promise<EntitlementCheck> {
  const entitlement = await prisma.entitlement.findUnique({
    where: {
      tenantId_module: {
        tenantId,
        module
      }
    }
  })
  
  // No entitlement found
  if (!entitlement) {
    return {
      hasAccess: false,
      module,
      status: null,
      validUntil: null,
      limits: null,
      source: null
    }
  }
  
  // Check if entitlement is active
  if (entitlement.status !== 'ACTIVE') {
    return {
      hasAccess: false,
      module,
      status: entitlement.status,
      validUntil: entitlement.validUntil,
      limits: entitlement.limits as Record<string, any> | null,
      source: entitlement.source
    }
  }
  
  // Check if entitlement has expired
  if (entitlement.validUntil && entitlement.validUntil < new Date()) {
    return {
      hasAccess: false,
      module,
      status: 'EXPIRED',
      validUntil: entitlement.validUntil,
      limits: entitlement.limits as Record<string, any> | null,
      source: entitlement.source
    }
  }
  
  // Entitlement is valid
  return {
    hasAccess: true,
    module,
    status: entitlement.status,
    validUntil: entitlement.validUntil,
    limits: entitlement.limits as Record<string, any> | null,
    source: entitlement.source
  }
}

/**
 * Check access to multiple modules at once
 * 
 * @example
 * ```typescript
 * const access = await getModuleAccess(tenantId, ['POS', 'SVM'])
 * if (access.POS.hasAccess && access.SVM.hasAccess) {
 *   // Has both modules
 * }
 * ```
 */
export async function getModuleAccess(
  tenantId: string,
  modules: ModuleType[]
): Promise<ModuleEntitlements> {
  const results: ModuleEntitlements = {}
  
  // Batch query for efficiency
  const entitlements = await prisma.entitlement.findMany({
    where: {
      tenantId,
      module: { in: modules }
    }
  })
  
  // Build map for quick lookup
  const entitlementMap = new Map(
    entitlements.map(e => [e.module, e])
  )
  
  // Check each requested module
  for (const moduleName of modules) {
    const entitlement = entitlementMap.get(moduleName)
    
    if (!entitlement) {
      results[moduleName] = {
        hasAccess: false,
        module: moduleName,
        status: null,
        validUntil: null,
        limits: null,
        source: null
      }
      continue
    }
    
    const isActive = entitlement.status === 'ACTIVE'
    const isExpired = entitlement.validUntil && entitlement.validUntil < new Date()
    
    results[moduleName] = {
      hasAccess: isActive && !isExpired,
      module: moduleName,
      status: isExpired ? 'EXPIRED' : entitlement.status,
      validUntil: entitlement.validUntil,
      limits: entitlement.limits as Record<string, any> | null,
      source: entitlement.source
    }
  }
  
  return results
}

/**
 * Get all active entitlements for a tenant
 */
export async function getAllEntitlements(tenantId: string): Promise<Entitlement[]> {
  return prisma.entitlement.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    }
  })
}

/**
 * Get list of active module names for a tenant
 */
export async function getActiveModules(tenantId: string): Promise<string[]> {
  const entitlements = await getAllEntitlements(tenantId)
  return entitlements.map(e => e.module)
}

// ============================================================================
// ENTITLEMENT LIMITS - USE THESE FOR QUOTA CHECKS
// ============================================================================

/**
 * Get a specific limit value from entitlement
 * 
 * @example
 * ```typescript
 * const maxTransactions = await getModuleLimit(tenantId, 'POS', 'maxTransactions')
 * if (currentCount >= maxTransactions) {
 *   return { error: 'Transaction limit reached' }
 * }
 * ```
 */
export async function getModuleLimit(
  tenantId: string,
  module: ModuleType,
  limitKey: string
): Promise<number | null> {
  const entitlement = await prisma.entitlement.findUnique({
    where: {
      tenantId_module: { tenantId, module }
    },
    select: { limits: true }
  })
  
  if (!entitlement?.limits) return null
  
  const limits = entitlement.limits as Record<string, any>
  return limits[limitKey] ?? null
}

// ============================================================================
// ENTITLEMENT MIDDLEWARE - USE IN API ROUTES
// ============================================================================

/**
 * Require module access - throws if not entitled
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const tenantId = getTenantId(request)
 *   await requireModuleAccess(tenantId, 'POS')
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireModuleAccess(
  tenantId: string,
  module: ModuleType
): Promise<EntitlementCheck> {
  const access = await hasModuleAccess(tenantId, module)
  
  if (!access.hasAccess) {
    throw new ModuleNotEntitledError(module, access.status)
  }
  
  return access
}

// ============================================================================
// ERRORS
// ============================================================================

export class ModuleNotEntitledError extends Error {
  constructor(
    public readonly module: string,
    public readonly status: EntitlementStatus | null
  ) {
    const reason = status === 'EXPIRED' 
      ? 'entitlement expired' 
      : status === 'SUSPENDED'
      ? 'entitlement suspended'
      : 'not subscribed'
    
    super(`Access to ${module} module denied: ${reason}`)
    this.name = 'ModuleNotEntitledError'
  }
}

// ============================================================================
// INTERNAL - ENTITLEMENT MANAGEMENT
// These functions are for subscription service use, NOT modules
// ============================================================================

/**
 * Grant entitlement to a tenant
 * INTERNAL USE ONLY - called by subscription service
 */
export async function grantEntitlement(
  tenantId: string,
  module: string,
  options: {
    subscriptionId?: string
    validUntil?: Date | null
    limits?: Record<string, any>
    source?: string
  }
): Promise<Entitlement> {
  return prisma.entitlement.upsert({
    where: {
      tenantId_module: { tenantId, module }
    },
    create: {
      tenantId,
      module,
      subscriptionId: options.subscriptionId,
      status: 'ACTIVE',
      validUntil: options.validUntil,
      limits: options.limits,
      source: options.source || 'subscription'
    } as any,
    update: {
      subscriptionId: options.subscriptionId,
      status: 'ACTIVE',
      validUntil: options.validUntil,
      limits: options.limits,
      source: options.source || 'subscription'
    }
  })
}

/**
 * Revoke entitlement from a tenant
 * INTERNAL USE ONLY - called by subscription service
 */
export async function revokeEntitlement(
  tenantId: string,
  module: string
): Promise<void> {
  await prisma.entitlement.updateMany({
    where: {
      tenantId,
      module
    },
    data: {
      status: 'EXPIRED'
    }
  })
}

/**
 * Suspend entitlement (e.g., payment failure)
 * INTERNAL USE ONLY
 */
export async function suspendEntitlement(
  tenantId: string,
  module: string
): Promise<void> {
  await prisma.entitlement.updateMany({
    where: {
      tenantId,
      module
    },
    data: {
      status: 'SUSPENDED'
    }
  })
}

/**
 * Reactivate suspended entitlement
 * INTERNAL USE ONLY
 */
export async function reactivateEntitlement(
  tenantId: string,
  module: string
): Promise<void> {
  await prisma.entitlement.updateMany({
    where: {
      tenantId,
      module,
      status: 'SUSPENDED'
    },
    data: {
      status: 'ACTIVE'
    }
  })
}
