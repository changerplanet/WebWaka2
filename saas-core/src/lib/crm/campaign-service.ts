/**
 * MODULE 3: CRM & Customer Engagement
 * Campaign Service
 * 
 * Implements marketing campaign definitions (NOT execution).
 * Actual messaging is delegated to Core Communication Engine.
 * 
 * CAMPAIGN TYPES:
 * - PROMOTIONAL: Sales and discounts
 * - LOYALTY: Points multipliers
 * - ENGAGEMENT: Re-engagement
 * - ANNOUNCEMENT: Product announcements
 * - BIRTHDAY: Birthday offers
 * - WINBACK: Win-back inactive customers
 * 
 * CONSTRAINTS:
 * - This module defines campaigns only
 * - No direct SMS/email provider integration
 * - Execution handled by Core
 */

import { prisma } from '@/lib/prisma';
import { 
  CrmCampaignType, 
  CrmCampaignStatus, 
  CrmCampaignChannel,
  Prisma 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CampaignInput {
  name: string;
  slug?: string;
  description?: string;
  campaignType: CrmCampaignType;
  channels: CrmCampaignChannel[];
  content?: CampaignContent;
  scheduledAt?: Date;
  startsAt?: Date;
  endsAt?: Date;
  triggerConfig?: TriggerConfig;
  offerType?: string;
  offerValue?: number;
  offerCode?: string;
  budgetLimit?: number;
  maxRecipients?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CampaignContent {
  subject?: string;       // Email subject
  body?: string;          // Email/Push body
  smsText?: string;       // SMS text (max 160 chars)
  callToAction?: string;  // CTA button text
  ctaUrl?: string;        // CTA URL
  imageUrl?: string;      // Hero image
  templateId?: string;    // External template reference
}

export interface TriggerConfig {
  trigger: 'IMMEDIATE' | 'SCHEDULED' | 'EVENT_BASED';
  eventType?: string;     // For event-based: "PURCHASE", "SIGNUP", "BIRTHDAY"
  delay?: string;         // Delay after event: "1h", "24h", "7d"
  conditions?: Record<string, unknown>;
}

export interface AudienceInput {
  audienceType: 'SEGMENT' | 'ALL_CUSTOMERS' | 'CUSTOM_LIST';
  segmentId?: string;
  customerIds?: string[];
  excludeSegmentIds?: string[];
  excludeCustomerIds?: string[];
}

// ============================================================================
// CAMPAIGN SERVICE
// ============================================================================

export class CampaignService {
  /**
   * Create a new campaign
   */
  static async create(tenantId: string, input: CampaignInput, createdBy?: string) {
    const slug = input.slug || this.generateSlug(input.name);

    return prisma.crmCampaign.create({
      data: {
        tenantId,
        name: input.name,
        slug,
        description: input.description,
        campaignType: input.campaignType,
        channels: input.channels,
        content: input.content as Prisma.InputJsonValue | undefined,
        scheduledAt: input.scheduledAt,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        triggerConfig: input.triggerConfig as Prisma.InputJsonValue | undefined,
        offerType: input.offerType,
        offerValue: input.offerValue,
        offerCode: input.offerCode,
        budgetLimit: input.budgetLimit,
        maxRecipients: input.maxRecipients,
        tags: input.tags || [],
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        status: 'DRAFT',
        createdBy,
      },
    });
  }

  /**
   * Update campaign
   */
  static async update(tenantId: string, campaignId: string, input: Partial<CampaignInput>) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
      throw new Error(`Cannot update ${campaign.status} campaign`);
    }

    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        name: input.name,
        description: input.description,
        campaignType: input.campaignType,
        channels: input.channels,
        content: input.content as Prisma.InputJsonValue | undefined,
        scheduledAt: input.scheduledAt,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        triggerConfig: input.triggerConfig as Prisma.InputJsonValue | undefined,
        offerType: input.offerType,
        offerValue: input.offerValue,
        offerCode: input.offerCode,
        budgetLimit: input.budgetLimit,
        maxRecipients: input.maxRecipients,
        tags: input.tags,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Delete campaign (DRAFT only)
   */
  static async delete(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'DRAFT') {
      throw new Error('Can only delete DRAFT campaigns');
    }

    await prisma.crmCampaign.delete({
      where: { id: campaignId },
    });

    return { success: true };
  }

  /**
   * List campaigns
   */
  static async list(
    tenantId: string,
    options?: {
      status?: CrmCampaignStatus;
      campaignType?: CrmCampaignType;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.CrmCampaignWhereInput = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.campaignType) where.campaignType = options.campaignType;
    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    const [campaigns, total] = await Promise.all([
      prisma.crmCampaign.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          audiences: {
            include: {
              segment: { select: { id: true, name: true, memberCount: true } },
            },
          },
        },
      }),
      prisma.crmCampaign.count({ where }),
    ]);

    return { campaigns, total };
  }

  /**
   * Get campaign by ID
   */
  static async getById(tenantId: string, campaignId: string) {
    return prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
      include: {
        audiences: {
          include: {
            segment: { select: { id: true, name: true, slug: true, memberCount: true } },
          },
        },
      },
    });
  }

  /**
   * Set campaign audience
   */
  static async setAudience(tenantId: string, campaignId: string, audience: AudienceInput) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Delete existing audiences
    await prisma.crmCampaignAudience.deleteMany({
      where: { campaignId },
    });

    // Create new audience
    const created = await prisma.crmCampaignAudience.create({
      data: {
        tenantId,
        campaignId,
        audienceType: audience.audienceType,
        segmentId: audience.segmentId,
        customerIds: audience.customerIds || [],
        excludeSegmentIds: audience.excludeSegmentIds || [],
        excludeCustomerIds: audience.excludeCustomerIds || [],
      },
    });

    // Calculate estimated reach
    const reach = await this.calculateReach(tenantId, created);
    await prisma.crmCampaignAudience.update({
      where: { id: created.id },
      data: { estimatedReach: reach },
    });

    return created;
  }

  /**
   * Publish campaign (DRAFT → SCHEDULED/ACTIVE)
   */
  static async publish(tenantId: string, campaignId: string, publishedBy: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
      include: { audiences: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'DRAFT') {
      throw new Error('Can only publish DRAFT campaigns');
    }

    if (!campaign.audiences.length) {
      throw new Error('Campaign must have an audience before publishing');
    }

    // Determine new status based on scheduling
    const now = new Date();
    let newStatus: CrmCampaignStatus = 'ACTIVE';
    
    if (campaign.scheduledAt && campaign.scheduledAt > now) {
      newStatus = 'SCHEDULED';
    }

    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        status: newStatus,
        publishedAt: now,
        publishedBy,
      },
    });
  }

  /**
   * Pause campaign
   */
  static async pause(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'ACTIVE' && campaign.status !== 'SCHEDULED') {
      throw new Error('Can only pause ACTIVE or SCHEDULED campaigns');
    }

    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });
  }

  /**
   * Resume campaign
   */
  static async resume(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'PAUSED') {
      throw new Error('Can only resume PAUSED campaigns');
    }

    const now = new Date();
    let newStatus: CrmCampaignStatus = 'ACTIVE';
    
    if (campaign.scheduledAt && campaign.scheduledAt > now) {
      newStatus = 'SCHEDULED';
    }

    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: { status: newStatus },
    });
  }

  /**
   * Cancel campaign
   */
  static async cancel(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
      throw new Error(`Campaign is already ${campaign.status}`);
    }

    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Complete campaign (mark as finished)
   */
  static async complete(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Record campaign metrics
   */
  static async recordMetrics(
    campaignId: string,
    metrics: {
      sent?: number;
      delivered?: number;
      opened?: number;
      clicked?: number;
      converted?: number;
    }
  ) {
    return prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        sentCount: metrics.sent ? { increment: metrics.sent } : undefined,
        deliveredCount: metrics.delivered ? { increment: metrics.delivered } : undefined,
        openedCount: metrics.opened ? { increment: metrics.opened } : undefined,
        clickedCount: metrics.clicked ? { increment: metrics.clicked } : undefined,
        convertedCount: metrics.converted ? { increment: metrics.converted } : undefined,
        currentRecipients: metrics.sent ? { increment: metrics.sent } : undefined,
      },
    });
  }

  /**
   * Get campaign performance
   */
  static async getPerformance(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const sent = campaign.sentCount;
    const delivered = campaign.deliveredCount;
    const opened = campaign.openedCount;
    const clicked = campaign.clickedCount;
    const converted = campaign.convertedCount;

    return {
      campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      metrics: {
        sent,
        delivered,
        opened,
        clicked,
        converted,
      },
      rates: {
        deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(2) : '0.00',
        openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : '0.00',
        clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(2) : '0.00',
        conversionRate: clicked > 0 ? ((converted / clicked) * 100).toFixed(2) : '0.00',
      },
      budget: {
        limit: campaign.budgetLimit?.toString(),
        used: campaign.budgetUsed?.toString(),
        remaining: campaign.budgetLimit
          ? (parseFloat(campaign.budgetLimit.toString()) - parseFloat(campaign.budgetUsed.toString())).toFixed(2)
          : null,
      },
    };
  }

  /**
   * Get campaign recipients (for execution by Core)
   * This returns customerIds to send to, NOT the actual sending
   */
  static async getRecipients(tenantId: string, campaignId: string) {
    const campaign = await prisma.crmCampaign.findFirst({
      where: { id: campaignId, tenantId },
      include: { audiences: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const customerIds = new Set<string>();
    const excludeIds = new Set<string>();

    for (const audience of campaign.audiences) {
      // Add exclusions
      for (const id of audience.excludeCustomerIds) {
        excludeIds.add(id);
      }

      // Get excluded segment members
      for (const segId of audience.excludeSegmentIds) {
        const members = await prisma.crmSegmentMembership.findMany({
          where: { segmentId: segId },
          select: { customerId: true },
        });
        for (const m of members) {
          excludeIds.add(m.customerId);
        }
      }

      // Add audience
      switch (audience.audienceType) {
        case 'ALL_CUSTOMERS':
          const allCustomers = await prisma.customer.findMany({
            where: { tenantId },
            select: { id: true },
          });
          for (const c of allCustomers) {
            if (!excludeIds.has(c.id)) customerIds.add(c.id);
          }
          break;

        case 'SEGMENT':
          if (audience.segmentId) {
            const members = await prisma.crmSegmentMembership.findMany({
              where: { segmentId: audience.segmentId },
              select: { customerId: true },
            });
            for (const m of members) {
              if (!excludeIds.has(m.customerId)) customerIds.add(m.customerId);
            }
          }
          break;

        case 'CUSTOM_LIST':
          for (const id of audience.customerIds) {
            if (!excludeIds.has(id)) customerIds.add(id);
          }
          break;
      }
    }

    // Apply max recipients limit
    let recipients = [...customerIds];
    if (campaign.maxRecipients && recipients.length > campaign.maxRecipients) {
      recipients = recipients.slice(0, campaign.maxRecipients);
    }

    return {
      campaignId,
      campaignName: campaign.name,
      channels: campaign.channels,
      content: campaign.content,
      recipientCount: recipients.length,
      recipientIds: recipients,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private static async calculateReach(
    tenantId: string,
    audience: { audienceType: string; segmentId: string | null; customerIds: string[] }
  ): Promise<number> {
    switch (audience.audienceType) {
      case 'ALL_CUSTOMERS':
        return prisma.customer.count({ where: { tenantId } });
      
      case 'SEGMENT':
        if (audience.segmentId) {
          return prisma.crmSegmentMembership.count({ where: { segmentId: audience.segmentId } });
        }
        return 0;
      
      case 'CUSTOM_LIST':
        return audience.customerIds.length;
      
      default:
        return 0;
    }
  }
}
