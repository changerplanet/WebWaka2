/**
 * SITES & FUNNELS: Entitlements Service
 * 
 * Capability-based access control for Sites & Funnels module.
 * 
 * RULES:
 * - Module is DISABLED by default
 * - Requires explicit activation per tenant
 * - Partner-managed: Only Partners can enable for their tenants
 * - Instance-aware: Respects Platform Instance boundaries
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { CapabilityStatus } from '@prisma/client';

// ============================================================================
// CONSTANTS
// ============================================================================

export const SITES_FUNNELS_CAPABILITY_KEY = 'sites_and_funnels';

// Optional dependency capabilities
export const OPTIONAL_DEPENDENCIES = {
  CRM: 'crm',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
} as const;

// Feature flags within Sites & Funnels
export const SITES_FUNNELS_FEATURES = {
  SITES: 'sites',
  FUNNELS: 'funnels',
  AI_CONTENT: 'ai_content',
  CUSTOM_DOMAINS: 'custom_domains',
  TEMPLATES: 'templates',
  ANALYTICS: 'site_analytics',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface SitesFunnelsEntitlementStatus {
  enabled: boolean;
  activatedAt?: Date;
  features: {
    sites: boolean;
    funnels: boolean;
    aiContent: boolean;
    customDomains: boolean;
    templates: boolean;
    analytics: boolean;
  };
  limits: {
    maxSites: number;
    maxFunnels: number;
    maxPagesPerSite: number;
    maxPagesPerFunnel: number;
    aiRequestsPerMonth: number;
  };
  optionalIntegrations: {
    crm: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

export interface SitesFunnelsActivationInput {
  tenantId: string;
  platformInstanceId?: string;
  activatedBy: string; // Partner user ID
  features?: Partial<SitesFunnelsEntitlementStatus['features']>;
  limits?: Partial<SitesFunnelsEntitlementStatus['limits']>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_FEATURES: SitesFunnelsEntitlementStatus['features'] = {
  sites: true,
  funnels: true,
  aiContent: true,
  customDomains: false, // Premium feature
  templates: true,
  analytics: true,
};

const DEFAULT_LIMITS: SitesFunnelsEntitlementStatus['limits'] = {
  maxSites: 5,
  maxFunnels: 10,
  maxPagesPerSite: 20,
  maxPagesPerFunnel: 10,
  aiRequestsPerMonth: 100,
};

// ============================================================================
// ENTITLEMENT CHECK FUNCTIONS
// ============================================================================

/**
 * Check if Sites & Funnels is enabled for a tenant
 */
export async function isSitesFunnelsEnabled(tenantId: string): Promise<boolean> {
  try {
    const activation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
        },
      },
    });

    return activation?.status === CapabilityStatus.ACTIVE;
  } catch (error) {
    console.error('Error checking Sites & Funnels entitlement:', error);
    return false;
  }
}

/**
 * Get full entitlement status for Sites & Funnels
 */
export async function getSitesFunnelsEntitlementStatus(
  tenantId: string
): Promise<SitesFunnelsEntitlementStatus> {
  try {
    const activation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
        },
      },
    });

    if (!activation || activation.status !== CapabilityStatus.ACTIVE) {
      return {
        enabled: false,
        features: {
          sites: false,
          funnels: false,
          aiContent: false,
          customDomains: false,
          templates: false,
          analytics: false,
        },
        limits: {
          maxSites: 0,
          maxFunnels: 0,
          maxPagesPerSite: 0,
          maxPagesPerFunnel: 0,
          aiRequestsPerMonth: 0,
        },
        optionalIntegrations: {
          crm: false,
          analytics: false,
          marketing: false,
        },
      };
    }

    // Get configuration from activation metadata
    const config = (activation.configuration as any) || {};
    const features = { ...DEFAULT_FEATURES, ...(config.features || {}) };
    const limits = { ...DEFAULT_LIMITS, ...(config.limits || {}) };

    // Check optional integrations
    const optionalIntegrations = await checkOptionalIntegrations(tenantId);

    return {
      enabled: true,
      activatedAt: activation.activatedAt || undefined,
      features,
      limits,
      optionalIntegrations,
    };
  } catch (error) {
    console.error('Error getting Sites & Funnels entitlement status:', error);
    return {
      enabled: false,
      features: {
        sites: false,
        funnels: false,
        aiContent: false,
        customDomains: false,
        templates: false,
        analytics: false,
      },
      limits: {
        maxSites: 0,
        maxFunnels: 0,
        maxPagesPerSite: 0,
        maxPagesPerFunnel: 0,
        aiRequestsPerMonth: 0,
      },
      optionalIntegrations: {
        crm: false,
        analytics: false,
        marketing: false,
      },
    };
  }
}

/**
 * Check which optional integrations are available
 */
async function checkOptionalIntegrations(tenantId: string): Promise<{
  crm: boolean;
  analytics: boolean;
  marketing: boolean;
}> {
  try {
    const [crmActivation, analyticsActivation, marketingActivation] = await Promise.all([
      prisma.core_tenant_capability_activations.findUnique({
        where: {
          tenantId_capabilityKey: {
            tenantId,
            capabilityKey: OPTIONAL_DEPENDENCIES.CRM,
          },
        },
      }),
      prisma.core_tenant_capability_activations.findUnique({
        where: {
          tenantId_capabilityKey: {
            tenantId,
            capabilityKey: OPTIONAL_DEPENDENCIES.ANALYTICS,
          },
        },
      }),
      prisma.core_tenant_capability_activations.findUnique({
        where: {
          tenantId_capabilityKey: {
            tenantId,
            capabilityKey: OPTIONAL_DEPENDENCIES.MARKETING,
          },
        },
      }),
    ]);

    return {
      crm: crmActivation?.status === CapabilityStatus.ACTIVE,
      analytics: analyticsActivation?.status === CapabilityStatus.ACTIVE,
      marketing: marketingActivation?.status === CapabilityStatus.ACTIVE,
    };
  } catch (error) {
    console.error('Error checking optional integrations:', error);
    return {
      crm: false,
      analytics: false,
      marketing: false,
    };
  }
}

// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================

/**
 * Activate Sites & Funnels for a tenant
 * Can only be called by Partner users
 */
export async function activateSitesFunnels(
  input: SitesFunnelsActivationInput
): Promise<{
  success: boolean;
  error?: string;
  status?: SitesFunnelsEntitlementStatus;
}> {
  try {
    const { tenantId, platformInstanceId, activatedBy, features, limits } = input;

    // Verify the tenant exists and get partner relationship
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        partnerReferral: true,
      },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    const partnerId = tenant.partnerReferral?.partnerId;
    if (!partnerId) {
      return { success: false, error: 'Tenant must be Partner-managed to enable Sites & Funnels' };
    }

    // Verify the activator is a Partner user
    const partnerUser = await prisma.partnerUser.findFirst({
      where: {
        userId: activatedBy,
        partnerId: partnerId,
        isActive: true,
      },
    });

    if (!partnerUser) {
      return { success: false, error: 'Only Partner users can activate Sites & Funnels' };
    }

    // Check if capability is already activated
    const existingActivation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
        },
      },
    });

    const configuration = {
      features: { ...DEFAULT_FEATURES, ...(features || {}) },
      limits: { ...DEFAULT_LIMITS, ...(limits || {}) },
      platformInstanceId,
      activatedByPartnerId: partnerId,
      activatedByUserId: activatedBy,
    };

    const crypto = await import('crypto');

    if (existingActivation) {
      // Update existing activation
      await prisma.core_tenant_capability_activations.update({
        where: {
          tenantId_capabilityKey: {
            tenantId,
            capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
          },
        },
        data: {
          status: CapabilityStatus.ACTIVE,
          configuration,
          activatedAt: new Date(),
          activatedBy: 'ADMIN', // Partner activation uses ADMIN
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new activation
      await prisma.core_tenant_capability_activations.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
          status: CapabilityStatus.ACTIVE,
          configuration,
          activatedAt: new Date(),
          activatedBy: 'ADMIN', // Partner activation uses ADMIN
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Get updated status
    const status = await getSitesFunnelsEntitlementStatus(tenantId);

    return { success: true, status };
  } catch (error: any) {
    console.error('Error activating Sites & Funnels:', error);
    return { success: false, error: error.message || 'Failed to activate Sites & Funnels' };
  }
}

/**
 * Deactivate Sites & Funnels for a tenant
 */
export async function deactivateSitesFunnels(
  tenantId: string,
  deactivatedBy: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const activation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
        },
      },
    });

    if (!activation) {
      return { success: true }; // Already not activated
    }

    await prisma.core_tenant_capability_activations.update({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: SITES_FUNNELS_CAPABILITY_KEY,
        },
      },
      data: {
        status: CapabilityStatus.INACTIVE,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error deactivating Sites & Funnels:', error);
    return { success: false, error: error.message || 'Failed to deactivate Sites & Funnels' };
  }
}

// ============================================================================
// LIMIT CHECK FUNCTIONS
// ============================================================================

/**
 * Check if tenant can create more sites
 */
export async function canCreateSite(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxAllowed?: number;
}> {
  const status = await getSitesFunnelsEntitlementStatus(tenantId);

  if (!status.enabled) {
    return { allowed: false, reason: 'Sites & Funnels is not enabled for this tenant' };
  }

  if (!status.features.sites) {
    return { allowed: false, reason: 'Sites feature is not enabled' };
  }

  // Count existing sites
  const siteCount = await prisma.sf_sites.count({
    where: { tenantId },
  });

  if (siteCount >= status.limits.maxSites) {
    return {
      allowed: false,
      reason: `Site limit reached (${siteCount}/${status.limits.maxSites})`,
      currentCount: siteCount,
      maxAllowed: status.limits.maxSites,
    };
  }

  return {
    allowed: true,
    currentCount: siteCount,
    maxAllowed: status.limits.maxSites,
  };
}

/**
 * Check if tenant can create more funnels
 */
export async function canCreateFunnel(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxAllowed?: number;
}> {
  const status = await getSitesFunnelsEntitlementStatus(tenantId);

  if (!status.enabled) {
    return { allowed: false, reason: 'Sites & Funnels is not enabled for this tenant' };
  }

  if (!status.features.funnels) {
    return { allowed: false, reason: 'Funnels feature is not enabled' };
  }

  // Count existing funnels
  const funnelCount = await prisma.sf_funnels.count({
    where: { tenantId },
  });

  if (funnelCount >= status.limits.maxFunnels) {
    return {
      allowed: false,
      reason: `Funnel limit reached (${funnelCount}/${status.limits.maxFunnels})`,
      currentCount: funnelCount,
      maxAllowed: status.limits.maxFunnels,
    };
  }

  return {
    allowed: true,
    currentCount: funnelCount,
    maxAllowed: status.limits.maxFunnels,
  };
}

/**
 * Check if AI content generation is allowed
 */
export async function canUseAIContent(tenantId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usedThisMonth?: number;
  maxAllowed?: number;
}> {
  const status = await getSitesFunnelsEntitlementStatus(tenantId);

  if (!status.enabled) {
    return { allowed: false, reason: 'Sites & Funnels is not enabled for this tenant' };
  }

  if (!status.features.aiContent) {
    return { allowed: false, reason: 'AI Content feature is not enabled' };
  }

  // Count AI requests this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const aiRequestCount = await prisma.sf_ai_content_logs.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (aiRequestCount >= status.limits.aiRequestsPerMonth) {
    return {
      allowed: false,
      reason: `AI request limit reached for this month (${aiRequestCount}/${status.limits.aiRequestsPerMonth})`,
      usedThisMonth: aiRequestCount,
      maxAllowed: status.limits.aiRequestsPerMonth,
    };
  }

  return {
    allowed: true,
    usedThisMonth: aiRequestCount,
    maxAllowed: status.limits.aiRequestsPerMonth,
  };
}

// ============================================================================
// PERMISSION GUARDS
// ============================================================================

/**
 * Guard: Require Sites & Funnels to be enabled
 */
export async function requireSitesFunnelsEnabled(tenantId: string): Promise<{
  authorized: boolean;
  error?: string;
  status?: number;
}> {
  const enabled = await isSitesFunnelsEnabled(tenantId);

  if (!enabled) {
    return {
      authorized: false,
      error: 'Sites & Funnels capability is not enabled for this tenant',
      status: 403,
    };
  }

  return { authorized: true };
}

/**
 * Guard: Require Partner ownership
 */
export async function requirePartnerOwnership(
  tenantId: string,
  userId: string
): Promise<{
  authorized: boolean;
  error?: string;
  status?: number;
  partnerId?: string;
}> {
  // Get tenant with partner referral
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      partnerReferral: true,
    },
  });

  const partnerId = tenant?.partnerReferral?.partnerId;
  if (!partnerId) {
    return {
      authorized: false,
      error: 'Tenant is not Partner-managed',
      status: 403,
    };
  }

  // Check if user is a Partner user
  const partnerUser = await prisma.partnerUser.findFirst({
    where: {
      userId,
      partnerId,
      isActive: true,
    },
  });

  if (!partnerUser) {
    return {
      authorized: false,
      error: 'User is not authorized to manage this tenant\'s sites',
      status: 403,
    };
  }

  return {
    authorized: true,
    partnerId,
  };
}
