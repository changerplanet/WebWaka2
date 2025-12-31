import { prisma } from './prisma'
import { TenantWithBranding } from './tenant-context'

/**
 * Resolves tenant from hostname (subdomain or custom domain)
 * 
 * Examples:
 * - acme.saascore.com -> resolves tenant with slug "acme"
 * - app.acme.com -> resolves tenant with customDomain "app.acme.com"
 * - saascore.com -> no tenant (super admin or landing page)
 */
export async function resolveTenantFromHost(hostname: string): Promise<TenantWithBranding | null> {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Check for custom domain first
  let tenant = await prisma.tenant.findUnique({
    where: { customDomain: host, isActive: true },
    include: { branding: true }
  })
  
  if (tenant) return tenant
  
  // Extract subdomain from host
  // Pattern: subdomain.domain.tld or subdomain.preview.emergentagent.com
  const parts = host.split('.')
  
  // Need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length >= 3) {
    const subdomain = parts[0]
    
    // Skip common non-tenant subdomains
    if (['www', 'api', 'app', 'admin', 'preview'].includes(subdomain)) {
      return null
    }
    
    tenant = await prisma.tenant.findUnique({
      where: { slug: subdomain, isActive: true },
      include: { branding: true }
    })
    
    if (tenant) return tenant
  }
  
  return null
}

/**
 * Resolves tenant by slug directly
 */
export async function resolveTenantBySlug(slug: string): Promise<TenantWithBranding | null> {
  return prisma.tenant.findUnique({
    where: { slug, isActive: true },
    include: { branding: true }
  })
}

/**
 * Resolves tenant by ID
 */
export async function resolveTenantById(id: string): Promise<TenantWithBranding | null> {
  return prisma.tenant.findUnique({
    where: { id, isActive: true },
    include: { branding: true }
  })
}
