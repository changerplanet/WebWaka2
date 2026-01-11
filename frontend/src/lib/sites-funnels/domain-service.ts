/**
 * SITES & FUNNELS: Domain Service
 * 
 * Domain mapping and SSL management:
 * - Custom domains
 * - Partner domains
 * - Instance domains
 * - SSL readiness hooks
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface DomainMapping {
  id: string;
  siteId: string;
  domain: string;
  subdomain?: string;
  domainType: 'custom' | 'partner' | 'instance';
  sslStatus: 'pending' | 'active' | 'failed';
  sslExpiresAt?: Date;
  isActive: boolean;
  isPrimary: boolean;
  verifiedAt?: Date;
}

export interface AddDomainInput {
  siteId: string;
  domain: string;
  subdomain?: string;
  domainType: 'custom' | 'partner' | 'instance';
  isPrimary?: boolean;
}

// ============================================================================
// DOMAIN CRUD
// ============================================================================

/**
 * Add domain mapping to a site
 */
export async function addDomainMapping(
  input: AddDomainInput,
  tenantId: string
): Promise<{
  success: boolean;
  domainMapping?: DomainMapping;
  error?: string;
}> {
  try {
    const { siteId, domain, subdomain, domainType, isPrimary } = input;

    // Verify site exists and belongs to tenant
    const site = await prisma.sf_sites.findFirst({
      where: { id: siteId, tenantId },
    });

    if (!site) {
      return { success: false, error: 'Site not found' };
    }

    // Check if domain already mapped
    const existingDomain = await prisma.sf_domain_mappings.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return { success: false, error: 'Domain is already mapped to another site' };
    }

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.sf_domain_mappings.updateMany({
        where: { siteId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const domainMapping = await prisma.sf_domain_mappings.create({
      data: {
        id: randomUUID(),
        siteId,
        domain,
        subdomain,
        domainType,
        sslStatus: 'pending',
        isActive: false, // Requires verification
        isPrimary: isPrimary || false,
      },
    });

    return { 
      success: true, 
      domainMapping: {
        id: domainMapping.id,
        siteId: domainMapping.siteId,
        domain: domainMapping.domain,
        subdomain: domainMapping.subdomain || undefined,
        domainType: domainMapping.domainType as 'custom' | 'partner' | 'instance',
        sslStatus: domainMapping.sslStatus as 'pending' | 'active' | 'failed',
        sslExpiresAt: domainMapping.sslExpiresAt || undefined,
        isActive: domainMapping.isActive,
        isPrimary: domainMapping.isPrimary,
        verifiedAt: domainMapping.verifiedAt || undefined,
      }
    };
  } catch (error: any) {
    console.error('Add domain mapping error:', error);
    return { success: false, error: error.message || 'Failed to add domain' };
  }
}

/**
 * List domain mappings for a site
 */
export async function listDomainMappings(
  siteId: string,
  tenantId: string
): Promise<DomainMapping[]> {
  const site = await prisma.sf_sites.findFirst({
    where: { id: siteId, tenantId },
  });

  if (!site) return [];

  const mappings = await prisma.sf_domain_mappings.findMany({
    where: { siteId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  return mappings.map(m => ({
    id: m.id,
    siteId: m.siteId,
    domain: m.domain,
    subdomain: m.subdomain || undefined,
    domainType: m.domainType as 'custom' | 'partner' | 'instance',
    sslStatus: m.sslStatus as 'pending' | 'active' | 'failed',
    sslExpiresAt: m.sslExpiresAt || undefined,
    isActive: m.isActive,
    isPrimary: m.isPrimary,
    verifiedAt: m.verifiedAt || undefined,
  }));
}

/**
 * Remove domain mapping
 */
export async function removeDomainMapping(
  domainId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const domain = await prisma.sf_domain_mappings.findUnique({
      where: { id: domainId },
      include: { site: true },
    });

    if (!domain || domain.site.tenantId !== tenantId) {
      return { success: false, error: 'Domain not found' };
    }

    await prisma.sf_domain_mappings.delete({
      where: { id: domainId },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to remove domain' };
  }
}

/**
 * Set primary domain
 */
export async function setPrimaryDomain(
  domainId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const domain = await prisma.sf_domain_mappings.findUnique({
      where: { id: domainId },
      include: { site: true },
    });

    if (!domain || domain.site.tenantId !== tenantId) {
      return { success: false, error: 'Domain not found' };
    }

    // Unset all primaries for this site
    await prisma.sf_domain_mappings.updateMany({
      where: { siteId: domain.siteId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this domain as primary
    await prisma.sf_domain_mappings.update({
      where: { id: domainId },
      data: { isPrimary: true },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to set primary domain' };
  }
}

// ============================================================================
// DOMAIN VERIFICATION
// ============================================================================

/**
 * Get DNS verification records for a domain
 */
export function getDnsVerificationRecords(domain: string): {
  type: 'TXT' | 'CNAME';
  name: string;
  value: string;
}[] {
  // In production, these would be actual DNS records to verify ownership
  return [
    {
      type: 'TXT',
      name: `_webwaka.${domain}`,
      value: `webwaka-verification=${Buffer.from(domain).toString('base64').substring(0, 32)}`,
    },
    {
      type: 'CNAME',
      name: domain,
      value: 'sites.webwaka.com',
    },
  ];
}

/**
 * Verify domain ownership (mock implementation)
 */
export async function verifyDomain(
  domainId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const domain = await prisma.sf_domain_mappings.findUnique({
      where: { id: domainId },
      include: { site: true },
    });

    if (!domain || domain.site.tenantId !== tenantId) {
      return { success: false, error: 'Domain not found' };
    }

    // In production, this would actually verify DNS records
    // For now, we just mark it as verified
    await prisma.sf_domain_mappings.update({
      where: { id: domainId },
      data: {
        isActive: true,
        verifiedAt: new Date(),
        sslStatus: 'active', // Would trigger SSL provisioning in production
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify domain' };
  }
}

// ============================================================================
// BRANDING
// ============================================================================

/**
 * Get branding for a site with inheritance
 * Priority: Site → Tenant → Partner → Instance
 */
export async function getSiteBranding(siteId: string): Promise<{
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}> {
  const site = await prisma.sf_sites.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    return {};
  }

  // Get tenant branding if available
  const tenant = await prisma.tenant.findUnique({
    where: { id: site.tenantId },
  });

  // Get partner branding if available
  const partner = site.partnerId
    ? await prisma.partner.findUnique({
        where: { id: site.partnerId },
      })
    : null;

  // Get platform instance branding if available
  const instance = site.platformInstanceId
    ? await prisma.platformInstance.findUnique({
        where: { id: site.platformInstanceId },
      })
    : null;

  // Merge branding with priority: Site > Tenant > Partner > Instance
  // Branding fields are directly on the models, not in a nested branding object
  return {
    logoUrl: site.logoUrl || tenant?.logoUrl || instance?.logoUrl || undefined,
    faviconUrl: site.faviconUrl || tenant?.faviconUrl || instance?.faviconUrl || undefined,
    primaryColor: site.primaryColor || tenant?.primaryColor || instance?.primaryColor || '#0066ff',
    secondaryColor: site.secondaryColor || tenant?.secondaryColor || instance?.secondaryColor || '#4d4d4d',
    fontFamily: site.fontFamily || 'Inter',
  };
}

/**
 * Update site branding
 */
export async function updateSiteBranding(
  siteId: string,
  tenantId: string,
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const site = await prisma.sf_sites.findFirst({
      where: { id: siteId, tenantId },
    });

    if (!site) {
      return { success: false, error: 'Site not found' };
    }

    await prisma.sf_sites.update({
      where: { id: siteId },
      data: branding,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update branding' };
  }
}
