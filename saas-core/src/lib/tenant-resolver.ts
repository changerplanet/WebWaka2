import { prisma } from './prisma'
import { Tenant, TenantDomain, DomainType, DomainStatus, TenantStatus } from '@prisma/client'

export type TenantWithDomains = Tenant & {
  domains: TenantDomain[]
}

export type TenantContext = {
  tenant: TenantWithDomains
  resolvedVia: 'custom_domain' | 'subdomain' | 'header' | 'query'
  domain?: string
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
 * Resolves tenant from hostname using proper resolution order:
 * 1. Custom domain (exact match in TenantDomain)
 * 2. Subdomain (extracted from hostname)
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
      tenant: {
        include: { domains: true }
      }
    }
  })
  
  if (customDomain && customDomain.tenant.status === 'ACTIVE') {
    return {
      tenant: customDomain.tenant,
      resolvedVia: 'custom_domain',
      domain: host
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
          tenant: {
            include: { domains: true }
          }
        }
      })
      
      if (subdomainEntry && subdomainEntry.tenant.status === 'ACTIVE') {
        return {
          tenant: subdomainEntry.tenant,
          resolvedVia: 'subdomain',
          domain: subdomain
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
        return {
          tenant,
          resolvedVia: 'subdomain',
          domain: subdomain
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
    return {
      tenant,
      resolvedVia: 'header'
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
      tenant: {
        include: { domains: true }
      }
    }
  })
  
  if (domainEntry && domainEntry.tenant.status === 'ACTIVE') {
    return {
      tenant: domainEntry.tenant,
      resolvedVia: 'query',
      domain: slug
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
    return {
      tenant,
      resolvedVia: 'query',
      domain: slug
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
