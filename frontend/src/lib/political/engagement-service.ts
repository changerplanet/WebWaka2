/**
 * Political Suite - Engagement Service (Phase 4)
 * POST-ELECTION COMMUNITY ENGAGEMENT
 * 
 * Authorization: January 8, 2026 (Checkpoint C Approved)
 * Classification: GOVERNANCE & POST-ELECTION
 * 
 * MANDATORY LABELS:
 * - NON-PARTISAN COMMUNITY ENGAGEMENT
 * - FOR INFORMATIONAL PURPOSES ONLY
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { createGovernanceAudit } from './governance-audit-service';

// Re-export enums
export {
  PolEngagementType,
} from '@prisma/client';

import type {
  PolEngagementType,
} from '@prisma/client';

// MANDATORY DISCLAIMERS
const DISCLAIMER_1 = 'NON-PARTISAN COMMUNITY ENGAGEMENT';
const DISCLAIMER_2 = 'FOR INFORMATIONAL PURPOSES ONLY';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateEngagementInput {
  partyId: string;
  type: PolEngagementType;
  title: string;
  description: string;
  content?: string;
  campaignId?: string;
  primaryId?: string;
  targetAudience?: string;
  state?: string;
  lga?: string;
  ward?: string;
  scheduledAt?: Date;
}

export interface UpdateEngagementInput {
  title?: string;
  description?: string;
  content?: string;
  targetAudience?: string;
  scheduledAt?: Date;
}

export interface EngagementFilters {
  partyId?: string;
  type?: PolEngagementType;
  isPublished?: boolean;
  state?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// ENGAGEMENT CRUD
// ----------------------------------------------------------------------------

/**
 * Create a community engagement.
 */
export async function createEngagement(
  tenantId: string,
  input: CreateEngagementInput,
  createdBy: string
) {
  // Validate party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  const engagement = await prisma.pol_engagement.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      type: input.type,
      title: input.title,
      description: input.description,
      content: input.content,
      campaignId: input.campaignId,
      primaryId: input.primaryId,
      targetAudience: input.targetAudience,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      scheduledAt: input.scheduledAt,
      disclaimer1: DISCLAIMER_1,
      disclaimer2: DISCLAIMER_2,
      createdBy,
    }),
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'engagement',
    entityId: engagement.id,
    action: 'CREATE',
    actorId: createdBy,
    partyId: input.partyId,
    state: input.state,
    changeNote: `Engagement created: ${input.title}`,
  });

  return formatEngagement(engagement);
}

/**
 * Update an engagement (only if not published).
 */
export async function updateEngagement(
  tenantId: string,
  engagementId: string,
  input: UpdateEngagementInput,
  actorId: string
) {
  const existing = await prisma.pol_engagement.findFirst({
    where: { id: engagementId, tenantId },
  });

  if (!existing) {
    throw new Error('Engagement not found');
  }

  if (existing.isPublished) {
    throw new Error('Published engagements cannot be modified');
  }

  const engagement = await prisma.pol_engagement.update({
    where: { id: engagementId },
    data: input,
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'engagement',
    entityId: engagementId,
    action: 'UPDATE',
    actorId,
    partyId: existing.partyId,
    changeNote: 'Engagement updated',
  });

  return formatEngagement(engagement);
}

/**
 * Publish an engagement.
 */
export async function publishEngagement(
  tenantId: string,
  engagementId: string,
  publishedBy: string
) {
  const existing = await prisma.pol_engagement.findFirst({
    where: { id: engagementId, tenantId },
  });

  if (!existing) {
    throw new Error('Engagement not found');
  }

  if (existing.isPublished) {
    throw new Error('Engagement is already published');
  }

  const engagement = await prisma.pol_engagement.update({
    where: { id: engagementId },
    data: {
      isDraft: false,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'engagement',
    entityId: engagementId,
    action: 'PUBLISH',
    actorId: publishedBy,
    partyId: existing.partyId,
    changeNote: `Engagement published: ${existing.title}`,
  });

  return formatEngagement(engagement);
}

/**
 * Get an engagement by ID.
 */
export async function getEngagement(tenantId: string, engagementId: string) {
  const engagement = await prisma.pol_engagement.findFirst({
    where: { id: engagementId, tenantId },
    include: {
      party: { select: { id: true, name: true, acronym: true } },
      campaign: { select: { id: true, name: true } },
      primary: { select: { id: true, title: true } },
    },
  });

  if (!engagement) return null;

  return formatEngagement(engagement);
}

/**
 * List engagements.
 */
export async function listEngagements(
  tenantId: string,
  filters: EngagementFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.type) where.type = filters.type;
  if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
  if (filters.state) where.state = filters.state;

  if (filters.fromDate || filters.toDate) {
    where.publishedAt = {};
    if (filters.fromDate) (where.publishedAt as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.publishedAt as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_engagement.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_engagement.count({ where }),
  ]);

  return {
    data: data.map(formatEngagement),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
  };
}

/**
 * Increment view count.
 */
export async function incrementViewCount(
  tenantId: string,
  engagementId: string
) {
  const engagement = await prisma.pol_engagement.findFirst({
    where: { id: engagementId, tenantId, isPublished: true },
  });

  if (!engagement) {
    throw new Error('Published engagement not found');
  }

  await prisma.pol_engagement.update({
    where: { id: engagementId },
    data: { viewCount: { increment: 1 } },
  });

  return { success: true, viewCount: engagement.viewCount + 1 };
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function formatEngagement(engagement: Record<string, unknown>) {
  return {
    ...engagement,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _mandatory_notice: 'NON-PARTISAN COMMUNITY ENGAGEMENT - FOR INFORMATIONAL PURPOSES ONLY',
  };
}
