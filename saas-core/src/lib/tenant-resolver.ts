import { prisma } from './prisma'
import { Tenant, TenantDomain, DomainType, DomainStatus } from '@prisma/client'

export type TenantWithDomains = Tenant & {
  domains: TenantDomain[]
}

/**
 * Resolves tenant from hostname (subdomain or custom domain)
 * 
 * Resolution order:
 * 1. Check TenantDomain for exact custom domain match
 * 2. Extract subdomain and check TenantDomain for subdomain match
 * 3. Fall back to Tenant.slug for legacy support
 * 
 * Examples:
 * - acme.saascore.com -> resolves via subdomain "acme"
 * - app.acme.com -> resolves via custom domain "app.acme.com"
 * - saascore.com -> no tenant (super admin or landing page)
 */
export async function resolveTenantFromHost(hostname: string): Promise<TenantWithDomains | null> {
  // Remove port if present
  const host = hostname.split(':')[0].toLowerCase()
  
  // 1. Check for exact custom domain match (verified only)
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
  
  if (customDomain?.tenant.status === 'ACTIVE') {
    return customDomain.tenant
  }
  
  // 2. Extract subdomain from host
  const parts = host.split('.')
  
  // Need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length >= 3) {
    const subdomain = parts[0]
    
    // Skip common non-tenant subdomains
    if (['www', 'api', 'app', 'admin', 'preview', 'localhost'].includes(subdomain)) {
      return null
    }
    
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
    
    if (subdomainEntry?.tenant.status === 'ACTIVE') {
      return subdomainEntry.tenant
    }
    
    // 3. Fallback: Check Tenant.slug directly (legacy support)
    const tenant = await prisma.tenant.findFirst({
      where: { 
        slug: subdomain,
        status: 'ACTIVE'
      },
      include: { domains: true }
    })
    
    if (tenant) return tenant
  }
  
  return null
}

/**
 * Resolves tenant by slug directly
 */
export async function resolveTenantBySlug(slug: string): Promise<TenantWithDomains | null> {
  // First try to find by domain entry
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
  
  if (domainEntry?.tenant.status === 'ACTIVE') {
    return domainEntry.tenant
  }
  
  // Fallback to slug
  return prisma.tenant.findFirst({
    where: { 
      slug: slug.toLowerCase(),
      status: 'ACTIVE'
    },
    include: { domains: true }
  })
}

/**
 * Resolves tenant by ID
 */
export async function resolveTenantById(id: string): Promise<TenantWithDomains | null> {
  return prisma.tenant.findFirst({
    where: { 
      id,
      status: 'ACTIVE'
    },
    include: { domains: true }
  })
}

/**
 * Gets primary domain for a tenant (for display purposes)
 */
export function getPrimaryDomain(tenant: TenantWithDomains): TenantDomain | null {
  // First try to find explicitly marked primary
  const primary = tenant.domains.find(d => d.isPrimary && d.status === 'VERIFIED')
  if (primary) return primary
  
  // Prefer custom domain over subdomain
  const customDomain = tenant.domains.find(d => d.type === 'CUSTOM' && d.status === 'VERIFIED')
  if (customDomain) return customDomain
  
  // Fall back to any verified subdomain
  const subdomain = tenant.domains.find(d => d.type === 'SUBDOMAIN' && d.status === 'VERIFIED')
  return subdomain || null
}
