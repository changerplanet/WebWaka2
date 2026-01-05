/**
 * MODULE 11: PARTNER & RESELLER PLATFORM
 * Referral & Attribution Service
 * 
 * Manages referral links and tenant attribution.
 * 
 * CRITICAL RULES:
 * - Attribution occurs at first subscription
 * - Attribution is IMMUTABLE once set
 * - Attribution survives upgrades and renewals
 * - No reassignment of referrals
 */

import { PrismaClient, AttributionStatus } from '@prisma/client';
import { getPartnerConfiguration } from './config-service';
import { logPartnerEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// REFERRAL LINK MANAGEMENT
// ============================================================================

interface CreateReferralLinkInput {
  partnerId: string;
  name?: string;
  destinationUrl?: string;
  campaign?: string;
  source?: string;
  medium?: string;
  expiresAt?: Date;
}

export async function createReferralLink(input: CreateReferralLinkInput): Promise<{
  success: boolean;
  referralLink?: any;
  error?: string;
}> {
  try {
    // Verify partner exists and is active
    const partner = await prisma.partner.findUnique({
      where: { id: input.partnerId },
    });
    
    if (!partner) {
      return { success: false, error: 'Partner not found' };
    }
    
    if (partner.status !== 'ACTIVE') {
      return { success: false, error: 'Partner must be active to create referral links' };
    }
    
    // Generate unique referral code
    const code = generateReferralCode(partner.slug);
    
    const referralLink = await prisma.partnerReferralLinkExt.create({
      data: {
        partnerId: input.partnerId,
        code,
        name: input.name || `Link ${new Date().toISOString().slice(0, 10)}`,
        destinationUrl: input.destinationUrl,
        campaign: input.campaign,
        source: input.source,
        medium: input.medium,
        expiresAt: input.expiresAt,
        isActive: true,
        clicks: 0,
        signups: 0,
        conversions: 0,
      },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'REFERRAL_LINK_CREATED',
      partnerId: input.partnerId,
      eventData: {
        referralLinkId: referralLink.id,
        code: referralLink.code,
      },
    });
    
    return {
      success: true,
      referralLink: {
        id: referralLink.id,
        code: referralLink.code,
        url: buildReferralUrl(referralLink.code, input.destinationUrl),
        name: referralLink.name,
        expiresAt: referralLink.expiresAt,
      },
    };
  } catch (error: any) {
    console.error('Create referral link error:', error);
    return { success: false, error: error.message || 'Failed to create referral link' };
  }
}

export async function getReferralLink(code: string) {
  return prisma.partnerReferralLinkExt.findUnique({
    where: { code },
  });
}

export async function trackReferralClick(code: string): Promise<{
  success: boolean;
  partnerId?: string;
  error?: string;
}> {
  try {
    const link = await prisma.partnerReferralLinkExt.findUnique({
      where: { code },
    });
    
    if (!link) {
      return { success: false, error: 'Referral link not found' };
    }
    
    if (!link.isActive) {
      return { success: false, error: 'Referral link is inactive' };
    }
    
    if (link.expiresAt && link.expiresAt < new Date()) {
      return { success: false, error: 'Referral link has expired' };
    }
    
    // Increment click count
    await prisma.partnerReferralLinkExt.update({
      where: { code },
      data: { clicks: { increment: 1 } },
    });
    
    return {
      success: true,
      partnerId: link.partnerId,
    };
  } catch (error: any) {
    console.error('Track referral click error:', error);
    return { success: false, error: error.message || 'Failed to track click' };
  }
}

export async function listPartnerReferralLinks(partnerId: string, activeOnly: boolean = true) {
  const where: any = { partnerId };
  if (activeOnly) {
    where.isActive = true;
  }
  
  return prisma.partnerReferralLinkExt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function deactivateReferralLink(linkId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.partnerReferralLinkExt.update({
      where: { id: linkId },
      data: { isActive: false },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deactivate link' };
  }
}

// ============================================================================
// ATTRIBUTION MANAGEMENT
// ============================================================================

interface CreateAttributionInput {
  partnerId: string;
  tenantId: string;
  tenantSlug?: string;
  referralLinkId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function createAttribution(input: CreateAttributionInput): Promise<{
  success: boolean;
  attribution?: any;
  error?: string;
}> {
  try {
    const config = await getPartnerConfiguration();
    
    // Check if tenant already has attribution
    const existingAttribution = await prisma.partnerAttributionRecord.findUnique({
      where: { tenantId: input.tenantId },
    });
    
    if (existingAttribution) {
      // Attribution is immutable
      return {
        success: false,
        error: 'Tenant already has partner attribution',
        attribution: existingAttribution,
      };
    }
    
    // Verify partner is active
    const partner = await prisma.partner.findUnique({
      where: { id: input.partnerId },
    });
    
    if (!partner || partner.status !== 'ACTIVE') {
      return { success: false, error: 'Partner is not active' };
    }
    
    // Create attribution
    const attribution = await prisma.partnerAttributionRecord.create({
      data: {
        partnerId: input.partnerId,
        tenantId: input.tenantId,
        tenantSlug: input.tenantSlug,
        referralLinkId: input.referralLinkId,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        status: 'ATTRIBUTED',
        isLocked: false,  // Will be locked after first subscription
      },
    });
    
    // Update referral link signups count
    if (input.referralLinkId) {
      await prisma.partnerReferralLinkExt.update({
        where: { id: input.referralLinkId },
        data: { signups: { increment: 1 } },
      });
    }
    
    // Update partner metrics
    await prisma.partnerProfileExt.update({
      where: { partnerId: input.partnerId },
      data: { totalReferrals: { increment: 1 } },
    });
    
    // Log event
    await logPartnerEvent({
      eventType: 'PARTNER_ATTRIBUTED',
      partnerId: input.partnerId,
      attributionId: attribution.id,
      eventData: {
        tenantId: input.tenantId,
        referralLinkId: input.referralLinkId,
      },
    });
    
    return {
      success: true,
      attribution: {
        id: attribution.id,
        partnerId: attribution.partnerId,
        tenantId: attribution.tenantId,
        status: attribution.status,
        attributedAt: attribution.attributedAt,
      },
    };
  } catch (error: any) {
    console.error('Create attribution error:', error);
    return { success: false, error: error.message || 'Failed to create attribution' };
  }
}

export async function lockAttribution(tenantId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const attribution = await prisma.partnerAttributionRecord.findUnique({
      where: { tenantId },
    });
    
    if (!attribution) {
      return { success: false, error: 'Attribution not found' };
    }
    
    if (attribution.isLocked) {
      return { success: true };  // Already locked
    }
    
    await prisma.partnerAttributionRecord.update({
      where: { tenantId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        status: 'CONVERTED',
        firstSubscription: new Date(),
      },
    });
    
    // Update referral link conversions
    if (attribution.referralLinkId) {
      await prisma.partnerReferralLinkExt.update({
        where: { id: attribution.referralLinkId },
        data: { conversions: { increment: 1 } },
      });
    }
    
    // Log event
    await logPartnerEvent({
      eventType: 'ATTRIBUTION_LOCKED',
      partnerId: attribution.partnerId,
      attributionId: attribution.id,
      eventData: { tenantId },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Lock attribution error:', error);
    return { success: false, error: error.message || 'Failed to lock attribution' };
  }
}

export async function getAttributionByTenant(tenantId: string) {
  return prisma.partnerAttributionRecord.findUnique({
    where: { tenantId },
  });
}

export async function getAttributionsByPartner(
  partnerId: string,
  params: { status?: AttributionStatus; page?: number; limit?: number } = {}
) {
  const { status, page = 1, limit = 20 } = params;
  
  const where: any = { partnerId };
  if (status) {
    where.status = status;
  }
  
  const [attributions, total] = await Promise.all([
    prisma.partnerAttributionRecord.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { attributedAt: 'desc' },
    }),
    prisma.partnerAttributionRecord.count({ where }),
  ]);
  
  return {
    attributions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// ATTRIBUTION LOOKUP (for processing events)
// ============================================================================

export async function resolvePartnerFromReferralCode(code: string): Promise<{
  partnerId: string | null;
  referralLinkId: string | null;
}> {
  const link = await prisma.partnerReferralLinkExt.findUnique({
    where: { code },
  });
  
  if (!link || !link.isActive) {
    return { partnerId: null, referralLinkId: null };
  }
  
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { partnerId: null, referralLinkId: null };
  }
  
  return {
    partnerId: link.partnerId,
    referralLinkId: link.id,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function generateReferralCode(partnerSlug: string): string {
  const prefix = partnerSlug.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

function buildReferralUrl(code: string, destinationUrl?: string | null): string {
  const baseUrl = destinationUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://webwaka.com';
  return `${baseUrl}/signup?ref=${code}`;
}
