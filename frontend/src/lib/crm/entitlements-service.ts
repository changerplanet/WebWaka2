/**
 * MODULE 3: CRM & Customer Engagement
 * CRM Entitlements Service
 * 
 * Integrates with SaaS Core entitlement system for feature gating.
 * 
 * ENTITLEMENT KEYS:
 * - crm_enabled: Basic CRM features
 * - crm_segmentation: Customer segmentation
 * - crm_loyalty: Loyalty program
 * - crm_campaigns: Marketing campaigns
 * - crm_max_segments: Max segments allowed
 * - crm_max_campaigns: Max active campaigns
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export interface CrmEntitlements {
  enabled: boolean;
  segmentation: boolean;
  loyalty: boolean;
  campaigns: boolean;
  maxSegments: number;
  maxCampaigns: number;
  maxLoyaltyRules: number;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
}

// ============================================================================
// DEFAULT ENTITLEMENTS BY TIER
// ============================================================================

const TIER_ENTITLEMENTS: Record<string, CrmEntitlements> = {
  free: {
    enabled: true,
    segmentation: true,
    loyalty: false,
    campaigns: false,
    maxSegments: 5,
    maxCampaigns: 0,
    maxLoyaltyRules: 0,
    tier: 'free',
  },
  starter: {
    enabled: true,
    segmentation: true,
    loyalty: true,
    campaigns: true,
    maxSegments: 20,
    maxCampaigns: 5,
    maxLoyaltyRules: 10,
    tier: 'starter',
  },
  professional: {
    enabled: true,
    segmentation: true,
    loyalty: true,
    campaigns: true,
    maxSegments: 100,
    maxCampaigns: 50,
    maxLoyaltyRules: 50,
    tier: 'professional',
  },
  enterprise: {
    enabled: true,
    segmentation: true,
    loyalty: true,
    campaigns: true,
    maxSegments: -1,
    maxCampaigns: -1,
    maxLoyaltyRules: -1,
    tier: 'enterprise',
  },
};

// ============================================================================
// CRM ENTITLEMENTS SERVICE
// ============================================================================

export class CrmEntitlementsService {
  /**
   * Get entitlements for a tenant
   */
  static async getEntitlements(tenantId: string): Promise<CrmEntitlements> {
    const activation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey: 'crm',
        },
      },
    });

    if (!activation || activation.status !== 'ACTIVE') {
      return { ...TIER_ENTITLEMENTS.free, enabled: false };
    }

    // Default to starter tier for active accounts
    return TIER_ENTITLEMENTS.starter;
  }

  /**
   * Check if a specific feature is entitled
   */
  static async checkFeature(
    tenantId: string,
    feature: keyof Omit<CrmEntitlements, 'tier' | 'enabled'>
  ): Promise<{ entitled: boolean; limit?: number; reason?: string }> {
    const entitlements = await this.getEntitlements(tenantId);

    if (!entitlements.enabled) {
      return { entitled: false, reason: 'CRM module is not enabled' };
    }

    const value = entitlements[feature];

    if (typeof value === 'boolean') {
      return {
        entitled: value,
        reason: value ? undefined : `${feature} is not included in your plan`,
      };
    }

    if (typeof value === 'number') {
      return {
        entitled: value !== 0,
        limit: value === -1 ? undefined : value,
        reason: value === 0 ? `${feature} limit reached` : undefined,
      };
    }

    return { entitled: true };
  }

  /**
   * Check usage against limits
   */
  static async checkUsage(
    tenantId: string,
    resource: 'segments' | 'campaigns' | 'loyaltyRules'
  ): Promise<{ allowed: boolean; limit: number; used: number; remaining: number }> {
    const entitlements = await this.getEntitlements(tenantId);

    let limit: number;
    let used: number;

    switch (resource) {
      case 'segments':
        limit = entitlements.maxSegments;
        used = await prisma.crm_customer_segments.count({ where: { tenantId } });
        break;
      case 'campaigns':
        limit = entitlements.maxCampaigns;
        used = await prisma.crm_campaigns.count({
          where: { tenantId, status: { in: ['DRAFT', 'SCHEDULED', 'ACTIVE'] } },
        });
        break;
      case 'loyaltyRules':
        limit = entitlements.maxLoyaltyRules;
        used = await prisma.crm_loyalty_rules.count({ where: { tenantId } });
        break;
      default:
        limit = -1;
        used = 0;
    }

    if (limit === -1) {
      return { allowed: true, limit: -1, used, remaining: -1 };
    }

    return {
      allowed: used < limit,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }

  /**
   * Get entitlement summary for display
   */
  static async getEntitlementSummary(tenantId: string) {
    const entitlements = await this.getEntitlements(tenantId);
    
    const [segmentCount, campaignCount, ruleCount] = await Promise.all([
      prisma.crm_customer_segments.count({ where: { tenantId } }),
      prisma.crm_campaigns.count({
        where: { tenantId, status: { in: ['DRAFT', 'SCHEDULED', 'ACTIVE'] } },
      }),
      prisma.crm_loyalty_rules.count({ where: { tenantId } }),
    ]);

    return {
      tier: entitlements.tier,
      enabled: entitlements.enabled,
      features: {
        segmentation: entitlements.segmentation,
        loyalty: entitlements.loyalty,
        campaigns: entitlements.campaigns,
      },
      usage: {
        segments: {
          used: segmentCount,
          limit: entitlements.maxSegments,
          unlimited: entitlements.maxSegments === -1,
        },
        campaigns: {
          used: campaignCount,
          limit: entitlements.maxCampaigns,
          unlimited: entitlements.maxCampaigns === -1,
        },
        loyaltyRules: {
          used: ruleCount,
          limit: entitlements.maxLoyaltyRules,
          unlimited: entitlements.maxLoyaltyRules === -1,
        },
      },
    };
  }
}
