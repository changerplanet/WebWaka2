/**
 * DEFAULT INSTANCE MANAGEMENT (Phase 2)
 * 
 * Ensures small tenants aren't burdened with multi-instance complexity.
 * 
 * BEHAVIOR:
 * - New tenant starts with ONE platform instance (default)
 * - Default instance has ALL activated capabilities visible
 * - Additional instances must be explicitly created
 * - Phase 1 experience unchanged for single-instance tenants
 * 
 * PHASE 2 BOUNDARIES:
 * - No automatic complexity
 * - No forced multi-instance setup
 * - Simple UX identical to Phase 1 by default
 */

import { prisma } from '@/lib/prisma'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

/**
 * Create default platform instance for a new tenant
 * Called when a tenant is created
 */
export async function createDefaultInstanceForTenant(tenantId: string): Promise<string> {
  // Get tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      slug: true,
      activatedModules: true,
    }
  })
  
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`)
  }
  
  // Check if default instance already exists
  const existing = await prisma.platformInstance.findFirst({
    where: { tenantId, isDefault: true }
  })
  
  if (existing) {
    return existing.id
  }
  
  // Create default instance
  // - Name: "[TenantName] Platform"
  // - Slug: "default"
  // - suiteKeys: empty (means ALL capabilities visible)
  // - No custom branding (uses tenant branding)
  const instance = await prisma.platformInstance.create({
    data: withPrismaDefaults({
      tenantId,
      name: `${tenant.name} Platform`,
      slug: 'default',
      description: 'Default platform instance - all capabilities visible',
      suiteKeys: [], // Empty = all capabilities visible (Phase 1 behavior)
      isDefault: true,
      isActive: true,
      // No branding overrides - falls back to tenant branding
    })
  })
  
  return instance.id
}

/**
 * Ensure all existing tenants have a default instance
 * Safe migration script - idempotent
 */
export async function ensureAllTenantsHaveDefaultInstance(): Promise<{
  total: number
  created: number
  existing: number
  errors: number
}> {
  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  })
  
  let created = 0
  let existing = 0
  let errors = 0
  
  for (const tenant of tenants) {
    try {
      // Check if default instance exists
      const existingInstance = await prisma.platformInstance.findFirst({
        where: { tenantId: tenant.id, isDefault: true }
      })
      
      if (existingInstance) {
        existing++
        continue
      }
      
      // Create default instance
      await createDefaultInstanceForTenant(tenant.id)
      created++
    } catch (error) {
      console.error(`Failed to create default instance for tenant ${tenant.id}:`, error)
      errors++
    }
  }
  
  return {
    total: tenants.length,
    created,
    existing,
    errors
  }
}

/**
 * Check if a tenant has only the default instance (simple mode)
 */
export async function isSimpleTenant(tenantId: string): Promise<boolean> {
  const instanceCount = await prisma.platformInstance.count({
    where: { tenantId, isActive: true }
  })
  
  return instanceCount <= 1
}

/**
 * Get instance count for a tenant
 */
export async function getTenantInstanceCount(tenantId: string): Promise<number> {
  return prisma.platformInstance.count({
    where: { tenantId, isActive: true }
  })
}

/**
 * Should we show instance switcher UI?
 * Only show if tenant has more than one active instance
 */
export async function shouldShowInstanceSwitcher(tenantId: string): Promise<boolean> {
  const count = await getTenantInstanceCount(tenantId)
  return count > 1
}
