/**
 * TENANT CONTEXT RESOLVER
 * Wave J.4: Tenant Context Hardening
 * 
 * Single authoritative resolver for tenant context resolution.
 * Replaces ad-hoc tenant resolution across all public surfaces.
 * 
 * Resolution capabilities:
 * - Resolve tenant from tenantSlug (public routes)
 * - Resolve tenant from request host (future-ready, no domain logic yet)
 * - Validate tenant exists and status is ACTIVE
 * - Validate required capability/module is enabled
 * 
 * CONSTRAINTS (Wave J.4):
 * - ❌ No new API proxy layer
 * - ❌ No opaque tokens
 * - ❌ No client contract changes (unless unavoidable)
 * - ❌ No background jobs
 * - ❌ No authentication changes
 * - ✅ Read-only Prisma queries
 * - ✅ Tenant isolation enforced
 * 
 * @module lib/tenant-context/resolver
 */

import { prisma } from '../prisma'
import type { 
  TenantContext, 
  TenantContextResolutionResult, 
  TenantContextOptions,
  ModuleRequirement
} from './types'
import { MODULE_ALIASES } from './types'

/**
 * AUTHORITATIVE DEMO TENANT DETECTION
 * Wave C3: Hardened demo detection to prevent spoofing
 * 
 * A tenant is considered a demo tenant if:
 * 1. Slug matches exact pattern: demo-* (with hyphen) or demo_* (with underscore)
 * 2. Slug is exactly "demo"
 * 
 * This prevents attackers from creating tenants like "demostore" to get demo privileges.
 * The hyphen/underscore requirement makes it clear this is a system-designated demo tenant.
 */
const DEMO_SLUG_PATTERNS = [
  /^demo$/i,           // Exactly "demo"
  /^demo[-_]/i,        // Starts with "demo-" or "demo_"
]

function isDemo(slug: string, _name: string): boolean {
  const normalizedSlug = slug.toLowerCase().trim()
  return DEMO_SLUG_PATTERNS.some(pattern => pattern.test(normalizedSlug))
}

export { isDemo }

function hasRequiredModules(
  enabledModules: string[], 
  requiredModules: string[]
): boolean {
  if (requiredModules.length === 0) return true
  
  return requiredModules.some(required => {
    const aliases = MODULE_ALIASES[required.toLowerCase()] || [required.toLowerCase()]
    return enabledModules.some(enabled => 
      aliases.includes(enabled.toLowerCase())
    )
  })
}

function buildContext(
  tenant: {
    id: string
    slug: string
    name: string
    status: string
    activatedModules: string[]
    primaryColor: string
    secondaryColor: string
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
  },
  source: 'slug' | 'host'
): TenantContext {
  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    tenantStatus: tenant.status as TenantContext['tenantStatus'],
    isDemo: isDemo(tenant.slug, tenant.name),
    enabledModules: tenant.activatedModules,
    source,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    appName: tenant.appName,
    logoUrl: tenant.logoUrl,
    faviconUrl: tenant.faviconUrl,
  }
}

export class TenantContextResolver {
  private static readonly TENANT_SELECT = {
    id: true,
    slug: true,
    name: true,
    status: true,
    activatedModules: true,
    primaryColor: true,
    secondaryColor: true,
    appName: true,
    logoUrl: true,
    faviconUrl: true,
  } as const

  static async resolveFromSlug(
    tenantSlug: string,
    options: TenantContextOptions = {}
  ): Promise<TenantContextResolutionResult> {
    const { 
      requiredModules = [], 
      allowDemo = true,
      allowInactive = false 
    } = options

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug.toLowerCase() },
      select: this.TENANT_SELECT,
    })

    if (!tenant) {
      return { success: false, reason: 'not_found' }
    }

    const tenantIsDemo = isDemo(tenant.slug, tenant.name)

    if (!tenantIsDemo || !allowDemo) {
      if (tenant.status === 'SUSPENDED') {
        return { success: false, reason: 'suspended' }
      }

      if (!allowInactive && tenant.status !== 'ACTIVE') {
        return { success: false, reason: 'suspended' }
      }
    }

    if (requiredModules.length > 0) {
      if (!tenantIsDemo && !hasRequiredModules(tenant.activatedModules, requiredModules)) {
        return { success: false, reason: 'module_disabled' }
      }
    }

    return {
      success: true,
      context: buildContext(tenant, 'slug'),
    }
  }

  static async resolveFromHost(
    hostname: string,
    options: TenantContextOptions = {}
  ): Promise<TenantContextResolutionResult> {
    const { 
      requiredModules = [], 
      allowDemo = true,
      allowInactive = false 
    } = options

    const host = hostname.split(':')[0].toLowerCase()

    const customDomain = await prisma.tenantDomain.findFirst({
      where: { 
        domain: host,
        type: 'CUSTOM',
        status: 'VERIFIED'
      },
      include: {
        tenant: {
          select: this.TENANT_SELECT,
        }
      }
    })

    if (customDomain && customDomain.tenant) {
      const tenant = customDomain.tenant
      const tenantIsDemo = isDemo(tenant.slug, tenant.name)

      if (!tenantIsDemo || !allowDemo) {
        if (tenant.status === 'SUSPENDED') {
          return { success: false, reason: 'suspended' }
        }
        if (!allowInactive && tenant.status !== 'ACTIVE') {
          return { success: false, reason: 'suspended' }
        }
      }

      if (requiredModules.length > 0) {
        if (!tenantIsDemo && !hasRequiredModules(tenant.activatedModules, requiredModules)) {
          return { success: false, reason: 'module_disabled' }
        }
      }

      return {
        success: true,
        context: buildContext(tenant, 'host'),
      }
    }

    const parts = host.split('.')
    if (parts.length >= 3) {
      const subdomain = parts[0]
      
      if (!['www', 'api', 'app', 'admin', 'preview', 'localhost'].includes(subdomain)) {
        const result = await this.resolveFromSlug(subdomain, options)
        if (result.success) {
          return {
            success: true,
            context: { ...result.context, source: 'host' },
          }
        }
      }
    }

    return { success: false, reason: 'not_found' }
  }

  static async resolve(
    params: { slug?: string; host?: string },
    options: TenantContextOptions = {}
  ): Promise<TenantContextResolutionResult> {
    if (params.slug) {
      return this.resolveFromSlug(params.slug, options)
    }

    if (params.host) {
      return this.resolveFromHost(params.host, options)
    }

    return { success: false, reason: 'not_found' }
  }

  static async resolveForSVM(
    tenantSlug: string
  ): Promise<TenantContextResolutionResult> {
    return this.resolveFromSlug(tenantSlug, {
      requiredModules: ['svm'],
    })
  }

  static async resolveForMVM(
    tenantSlug: string
  ): Promise<TenantContextResolutionResult> {
    return this.resolveFromSlug(tenantSlug, {
      requiredModules: ['mvm'],
    })
  }

  static async resolveForParkHub(
    tenantSlug: string
  ): Promise<TenantContextResolutionResult> {
    return this.resolveFromSlug(tenantSlug, {
      requiredModules: ['parkhub'],
    })
  }

  static async resolveForSitesFunnels(
    tenantSlug: string
  ): Promise<TenantContextResolutionResult> {
    return this.resolveFromSlug(tenantSlug, {
      requiredModules: ['sites-funnels'],
    })
  }

  /**
   * Resolve tenant for canonical orders/customers/proofs
   * Requires commerce capability (SVM or MVM only)
   * ParkHub-only tenants do NOT get access - they have separate ticket APIs
   */
  static async resolveForOrders(
    tenantSlug: string
  ): Promise<TenantContextResolutionResult> {
    return this.resolveFromSlug(tenantSlug, {
      requiredModules: ['svm', 'mvm'],
    })
  }

  static async resolveGeneric(
    tenantSlug: string
  ): Promise<TenantContextResolutionResult> {
    return this.resolveFromSlug(tenantSlug, {
      requiredModules: [],
    })
  }
}

export { hasRequiredModules }
