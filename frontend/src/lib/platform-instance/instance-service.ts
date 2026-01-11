/**
 * PLATFORM INSTANCE SERVICE (Phase 2)
 * 
 * Manages Platform Instances - the multi-suite, multi-domain UX boundaries
 * within a single tenant.
 * 
 * KEY CONCEPTS:
 * - One tenant can have multiple platform instances
 * - Each instance has its own branding, navigation, and domain mapping
 * - A default instance is auto-created for every tenant
 * - Instance scopes VISIBILITY, not permissions (RBAC remains tenant-wide)
 * 
 * PHASE 2 BOUNDARIES (DO NOT IMPLEMENT):
 * - Per-instance billing (billing is tenant-wide)
 * - Per-instance partner attribution (attribution is tenant-wide)
 * - Per-instance data isolation (data is tenant-wide, UX is instance-scoped)
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// Type definitions
export interface PlatformInstanceBranding {
  displayName: string | null
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

export interface PlatformInstanceWithTenant {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  suiteKeys: string[]
  displayName: string | null
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  navigationConfig: Prisma.JsonValue
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  tenant: {
    id: string
    name: string
    slug: string
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
}

export interface ResolvedBranding {
  displayName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  source: 'instance' | 'tenant'
}

/**
 * Create a default platform instance for a tenant
 * Called when a new tenant is created or when migrating existing tenants
 */
export async function createDefaultInstance(tenantId: string): Promise<string> {
  // Get tenant info for default values
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

  // Create default instance with all activated modules
  const instance = await prisma.platformInstance.create({
    data: withPrismaDefaults({
      tenantId,
      name: `${tenant.name} Platform`,
      slug: 'default',
      description: 'Default platform instance',
      suiteKeys: tenant.activatedModules,
      isDefault: true,
      isActive: true,
    })
  })

  return instance.id
}

/**
 * Ensure all existing tenants have a default platform instance
 * Safe to run multiple times (idempotent)
 */
export async function migrateExistingTenants(): Promise<{ migrated: number; skipped: number }> {
  const tenantsWithoutInstance = await prisma.tenant.findMany({
    where: {
      platformInstances: {
        none: {}
      }
    },
    select: { id: true }
  })

  let migrated = 0
  let skipped = 0

  for (const tenant of tenantsWithoutInstance) {
    try {
      await createDefaultInstance(tenant.id)
      migrated++
    } catch (error) {
      console.error(`Failed to create default instance for tenant ${tenant.id}:`, error)
      skipped++
    }
  }

  return { migrated, skipped }
}

/**
 * Get a platform instance by ID with tenant info
 */
export async function getInstance(instanceId: string): Promise<PlatformInstanceWithTenant | null> {
  return prisma.platformInstance.findUnique({
    where: { id: instanceId },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          appName: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          secondaryColor: true,
        }
      }
    }
  })
}

/**
 * Get the default instance for a tenant
 */
export async function getDefaultInstance(tenantId: string): Promise<PlatformInstanceWithTenant | null> {
  return prisma.platformInstance.findFirst({
    where: { tenantId, isDefault: true },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          appName: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          secondaryColor: true,
        }
      }
    }
  })
}

/**
 * Get all instances for a tenant
 */
export async function getTenantInstances(tenantId: string): Promise<PlatformInstanceWithTenant[]> {
  return prisma.platformInstance.findMany({
    where: { tenantId, isActive: true },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          appName: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          secondaryColor: true,
        }
      }
    },
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' }
    ]
  })
}

/**
 * Resolve branding for an instance with tenant fallback
 */
export function resolveInstanceBranding(instance: PlatformInstanceWithTenant): ResolvedBranding {
  const hasInstanceBranding = !!(
    instance.displayName ||
    instance.logoUrl ||
    instance.primaryColor ||
    instance.secondaryColor
  )

  return {
    displayName: instance.displayName || instance.tenant.appName,
    logoUrl: instance.logoUrl || instance.tenant.logoUrl,
    faviconUrl: instance.faviconUrl || instance.tenant.faviconUrl,
    primaryColor: instance.primaryColor || instance.tenant.primaryColor,
    secondaryColor: instance.secondaryColor || instance.tenant.secondaryColor,
    source: hasInstanceBranding ? 'instance' : 'tenant'
  }
}

/**
 * Create a new platform instance for a tenant
 */
export async function createInstance(
  tenantId: string,
  data: {
    name: string
    slug: string
    description?: string
    suiteKeys: string[]
    branding?: Partial<PlatformInstanceBranding>
  }
): Promise<PlatformInstanceWithTenant> {
  const instance = await prisma.platformInstance.create({
    data: {
      tenantId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      suiteKeys: data.suiteKeys,
      displayName: data.branding?.displayName,
      logoUrl: data.branding?.logoUrl,
      faviconUrl: data.branding?.faviconUrl,
      primaryColor: data.branding?.primaryColor,
      secondaryColor: data.branding?.secondaryColor,
      isDefault: false, // Only one default per tenant
      isActive: true,
    },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          appName: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          secondaryColor: true,
        }
      }
    }
  })

  return instance
}

/**
 * Update instance branding
 */
export async function updateInstanceBranding(
  instanceId: string,
  branding: Partial<PlatformInstanceBranding>
): Promise<PlatformInstanceWithTenant> {
  return prisma.platformInstance.update({
    where: { id: instanceId },
    data: {
      displayName: branding.displayName,
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
    },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          appName: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          secondaryColor: true,
        }
      }
    }
  })
}

/**
 * Update instance suite keys (which capabilities are visible)
 */
export async function updateInstanceSuites(
  instanceId: string,
  suiteKeys: string[]
): Promise<PlatformInstanceWithTenant> {
  return prisma.platformInstance.update({
    where: { id: instanceId },
    data: { suiteKeys },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          appName: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          secondaryColor: true,
        }
      }
    }
  })
}

/**
 * Map a domain to a platform instance
 */
export async function mapDomainToInstance(
  domainId: string,
  instanceId: string | null
): Promise<void> {
  await prisma.tenantDomain.update({
    where: { id: domainId },
    data: { platformInstanceId: instanceId }
  })
}

/**
 * Check if a capability is visible in an instance
 * This is VISIBILITY only - actual permission checks happen via RBAC
 */
export function isCapabilityVisibleInInstance(
  instance: PlatformInstanceWithTenant,
  capabilityKey: string
): boolean {
  // If no suite keys defined, all capabilities are visible (default instance behavior)
  if (!instance.suiteKeys || instance.suiteKeys.length === 0) {
    return true
  }
  
  return instance.suiteKeys.includes(capabilityKey)
}

/**
 * Filter capabilities to those visible in an instance
 */
export function filterCapabilitiesByInstance(
  instance: PlatformInstanceWithTenant,
  capabilityKeys: string[]
): string[] {
  // If no suite keys defined, return all capabilities
  if (!instance.suiteKeys || instance.suiteKeys.length === 0) {
    return capabilityKeys
  }
  
  return capabilityKeys.filter(key => instance.suiteKeys.includes(key))
}
