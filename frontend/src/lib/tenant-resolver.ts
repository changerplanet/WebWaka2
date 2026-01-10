/**
 * TENANT RESOLVER (Phase 2 Enhanced)
 * 
 * Resolves tenant AND platform instance from domain/headers/query.
 * 
 * Resolution Order:
 * 1. Custom domain → Tenant + Instance (if mapped)
 * 2. Subdomain → Tenant + Instance (if mapped)
 * 3. X-Tenant-ID header → Tenant + Default Instance
 * 4. ?tenant= query → Tenant + Default Instance
 * 
 * PHASE 2 ADDITION:
 * - Domain can optionally map to a specific PlatformInstance
 * - If no instance mapped, falls back to tenant's default instance
 */

import { prisma } from './prisma'
import { Tenant, TenantDomain, PlatformInstance } from '@prisma/client'

// Extended types for Phase 2
export type TenantWithDomains = Tenant & {
  domains: TenantDomain[]
}

export type PlatformInstanceWithTenant = PlatformInstance & {
  tenant: Tenant
}

export type TenantContext = {
  tenant: TenantWithDomains
  resolvedVia: 'custom_domain' | 'subdomain' | 'header' | 'query'
  domain?: string
  // Phase 2: Platform Instance context
  platformInstance?: PlatformInstanceWithTenant
  instanceResolvedVia?: 'domain_mapping' | 'default_instance'
}

// Routes that don't require tenant resolution
export const PUBLIC_ROUTES = [
  '/login',
  '/register', 
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/icons'
]

// Super Admin routes (require SUPER_ADMIN, no tenant needed)
export const SUPER_ADMIN_ROUTES = [
  '/admin',
  '/api/admin'
]

/**
 * Check if a path is public (no tenant resolution needed)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a path is a Super Admin route
 */
export function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Get the default platform instance for a tenant
 */
async function getDefaultInstance(tenantId: string): Promise<PlatformInstanceWithTenant | null> {
  return prisma.platformInstance.findFirst({
    where: { 
      tenantId, 
      isDefault: true,
      isActive: true
    },
    include: { tenant: true }
  }) as unknown as PlatformInstanceWithTenant | null
}

/**
 * Resolves tenant AND platform instance from hostname.
 * 
 * Resolution order:
 * 1. Custom domain (exact match in TenantDomain)
 *    - If domain has platformInstanceId, use that instance
 *    - Otherwise, use tenant's default instance
 * 2. Subdomain (extracted from hostname)
 *    - Same instance resolution logic
 * 3. Returns null if no match
 */
export async function resolveTenantFromHost(hostname: string): Promise<TenantContext | null> {
  const host = hostname.split(':')[0].toLowerCase()
  
  // 1. Check for custom domain match (highest priority)
  const customDomain = await prisma.tenantDomain.findFirst({
    where: { 
      domain: host,
      type: 'CUSTOM',
      status: 'VERIFIED'
    },
    include: {
      Tenant: {
        include: { domains: true }
      },
      // Phase 2: Include platform instance if mapped
      platformInstance: {
        include: { Tenant: true }
      }
    }
  })
  
  if (customDomain && customDomain.tenant.status === 'ACTIVE') {
    // Phase 2: Resolve platform instance
    let platformInstance = customDomain.platformInstance
    let instanceResolvedVia: 'domain_mapping' | 'default_instance' = 'domain_mapping'
    
    if (!platformInstance) {
      // Fallback to default instance
      platformInstance = await getDefaultInstance(customDomain.tenantId)
      instanceResolvedVia = 'default_instance'
    }
    
    return {
      tenant: customDomain.tenant,
      resolvedVia: 'custom_domain',
      domain: host,
      platformInstance: platformInstance || undefined,
      instanceResolvedVia: platformInstance ? instanceResolvedVia : undefined
    }
  }
  
  // 2. Extract and check subdomain
  const parts = host.split('.')
  if (parts.length >= 3) {
    const subdomain = parts[0]
    
    // Skip common non-tenant subdomains
    if (!['www', 'api', 'app', 'admin', 'preview', 'localhost'].includes(subdomain)) {
      // Check TenantDomain for subdomain
      const subdomainEntry = await prisma.tenantDomain.findFirst({
        where: {
          domain: subdomain,
          type: 'SUBDOMAIN',
          status: 'VERIFIED'
        },
        include: {
          Tenant: {
            include: { domains: true }
          },
          platformInstance: {
            include: { Tenant: true }
          }
        }
      })
      
      if (subdomainEntry && subdomainEntry.tenant.status === 'ACTIVE') {
        // Phase 2: Resolve platform instance
        let platformInstance = subdomainEntry.platformInstance
        let instanceResolvedVia: 'domain_mapping' | 'default_instance' = 'domain_mapping'
        
        if (!platformInstance) {
          platformInstance = await getDefaultInstance(subdomainEntry.tenantId)
          instanceResolvedVia = 'default_instance'
        }
        
        return {
          tenant: subdomainEntry.tenant,
          resolvedVia: 'subdomain',
          domain: subdomain,
          platformInstance: platformInstance || undefined,
          instanceResolvedVia: platformInstance ? instanceResolvedVia : undefined
        }
      }
      
      // Fallback: Check Tenant.slug directly
      const tenant = await prisma.tenant.findFirst({
        where: { 
          slug: subdomain,
          status: 'ACTIVE'
        },
        include: { domains: true }
      })
      
      if (tenant) {
        // Phase 2: Get default instance for slug-based resolution
        const platformInstance = await getDefaultInstance(tenant.id)
        
        return {
          tenant,
          resolvedVia: 'subdomain',
          domain: subdomain,
          platformInstance: platformInstance || undefined,
          instanceResolvedVia: platformInstance ? 'default_instance' : undefined
        }
      }
    }
  }
  
  return null
}

/**
 * Resolves tenant from X-Tenant-ID header (for internal tools)
 */
export async function resolveTenantFromHeader(tenantId: string): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findFirst({
    where: { 
      id: tenantId,
      status: 'ACTIVE'
    },
    include: { domains: true }
  })
  
  if (tenant) {
    // Phase 2: Get default instance
    const platformInstance = await getDefaultInstance(tenant.id)
    
    return {
      tenant,
      resolvedVia: 'header',
      platformInstance: platformInstance || undefined,
      instanceResolvedVia: platformInstance ? 'default_instance' : undefined
    }
  }
  
  return null
}

/**
 * Resolves tenant from query parameter (for testing/preview)
 */
export async function resolveTenantFromQuery(slug: string): Promise<TenantContext | null> {
  // First try TenantDomain
  const domainEntry = await prisma.tenantDomain.findFirst({
    where: {
      domain: slug.toLowerCase(),
      type: 'SUBDOMAIN'
    },
    include: {
      Tenant: {
        include: { domains: true }
      },
      platformInstance: {
        include: { Tenant: true }
      }
    }
  })
  
  if (domainEntry && domainEntry.tenant.status === 'ACTIVE') {
    // Phase 2: Resolve platform instance
    let platformInstance = domainEntry.platformInstance
    let instanceResolvedVia: 'domain_mapping' | 'default_instance' = 'domain_mapping'
    
    if (!platformInstance) {
      platformInstance = await getDefaultInstance(domainEntry.tenantId)
      instanceResolvedVia = 'default_instance'
    }
    
    return {
      tenant: domainEntry.tenant,
      resolvedVia: 'query',
      domain: slug,
      platformInstance: platformInstance || undefined,
      instanceResolvedVia: platformInstance ? instanceResolvedVia : undefined
    }
  }
  
  // Fallback to slug
  const tenant = await prisma.tenant.findFirst({
    where: { 
      slug: slug.toLowerCase(),
      status: 'ACTIVE'
    },
    include: { domains: true }
  })
  
  if (tenant) {
    const platformInstance = await getDefaultInstance(tenant.id)
    
    return {
      tenant,
      resolvedVia: 'query',
      domain: slug,
      platformInstance: platformInstance || undefined,
      instanceResolvedVia: platformInstance ? 'default_instance' : undefined
    }
  }
  
  return null
}

/**
 * Full tenant resolution with all fallbacks
 * Resolution order:
 * 1. Custom domain
 * 2. Subdomain
 * 3. X-Tenant-ID header
 * 4. ?tenant= query param
 */
export async function resolveTenant(
  hostname: string,
  headers: { tenantId?: string },
  query: { tenant?: string }
): Promise<TenantContext | null> {
  // 1 & 2. Try hostname resolution (custom domain, then subdomain)
  let context = await resolveTenantFromHost(hostname)
  if (context) return context
  
  // 3. Try X-Tenant-ID header
  if (headers.tenantId) {
    context = await resolveTenantFromHeader(headers.tenantId)
    if (context) return context
  }
  
  // 4. Try query parameter
  if (query.tenant) {
    context = await resolveTenantFromQuery(query.tenant)
    if (context) return context
  }
  
  return null
}

/**
 * Check if tenant is accessible (not suspended/deactivated)
 */
export function isTenantAccessible(tenant: Tenant): boolean {
  return tenant.status === 'ACTIVE'
}

/**
 * Get tenant by ID (for internal use)
 */
export async function getTenantById(id: string): Promise<TenantWithDomains | null> {
  return prisma.tenant.findUnique({
    where: { id },
    include: { domains: true }
  })
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<TenantWithDomains | null> {
  return prisma.tenant.findUnique({
    where: { slug },
    include: { domains: true }
  })
}

/**
 * Alias for getTenantBySlug (for backwards compatibility)
 */
export const resolveTenantBySlug = getTenantBySlug

// Re-export types
export type ResolvedTenant = TenantWithDomains
export type { TenantContext as TenantResolverContext }

// Export helper functions for core module
export async function getTenantFromSlug(slug: string): Promise<TenantWithDomains | null> {
  return getTenantBySlug(slug)
}

export async function getTenantFromDomain(domain: string): Promise<TenantWithDomains | null> {
  const context = await resolveTenantFromHost(domain)
  return context?.tenant || null
}

/**
 * Phase 2: Get platform instance by ID with tenant
 */
export async function getInstanceById(instanceId: string): Promise<PlatformInstanceWithTenant | null> {
  return prisma.platformInstance.findUnique({
    where: { id: instanceId },
    include: { Tenant: true }
  })
}

/**
 * Phase 2: Resolve instance from domain directly
 */
export async function resolveInstanceFromDomain(domain: string): Promise<PlatformInstanceWithTenant | null> {
  const domainEntry = await prisma.tenantDomain.findFirst({
    where: { domain: domain.toLowerCase() },
    include: {
      platformInstance: {
        include: { Tenant: true }
      }
    }
  })
  
  if (domainEntry?.platformInstance) {
    return domainEntry.platformInstance
  }
  
  // Fallback to default instance of the tenant
  if (domainEntry) {
    return getDefaultInstance(domainEntry.tenantId)
  }
  
  return null
}
