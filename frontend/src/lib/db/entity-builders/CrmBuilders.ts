/**
 * Phase 16B - CRM Entity Builders (Simplified)
 * 
 * These builders provide minimal type-safe wrappers that:
 * 1. Generate required `id` fields
 * 2. Set required `updatedAt` timestamps
 * 3. Accept service-layer objects with explicit typing
 * 
 * The actual field mapping remains in the service layer.
 */

import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// GENERIC BUILDER HELPERS
// ============================================================================

/**
 * Wraps a data object with required id and timestamp fields
 */
export function withCrmDefaults<T extends object>(
  data: T
): T & { id: string; updatedAt: Date } {
  return {
    id: randomUUID(),
    ...data,
    updatedAt: new Date(),
  };
}

/**
 * For createMany operations, wraps each item with id
 */
export function withCrmDefaultsMany<T extends object>(
  items: T[]
): Array<T & { id: string }> {
  return items.map(item => ({
    id: randomUUID(),
    ...item,
  }));
}

// ============================================================================
// LOYALTY TRANSACTIONS
// ============================================================================

export type LoyaltyTransactionData = Omit<
  Prisma.crm_loyalty_transactionsCreateInput,
  'id' | 'createdAt'
>;

export function buildLoyaltyTransaction(
  data: LoyaltyTransactionData
): Prisma.crm_loyalty_transactionsCreateInput {
  return {
    id: randomUUID(),
    ...data,
  };
}

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

export type EngagementEventData = Omit<
  Prisma.crm_engagement_eventsCreateInput,
  'id' | 'createdAt'
>;

export function buildEngagementEvent(
  data: EngagementEventData
): Prisma.crm_engagement_eventsCreateInput {
  return {
    id: randomUUID(),
    ...data,
  };
}

// ============================================================================
// CUSTOMER SEGMENTS
// ============================================================================

export type CustomerSegmentData = Omit<
  Prisma.crm_customer_segmentsCreateInput,
  'id' | 'createdAt'
>;

export function buildCustomerSegment(
  data: CustomerSegmentData
): Prisma.crm_customer_segmentsCreateInput {
  return {
    id: randomUUID(),
    updatedAt: new Date(),
    ...data,
  };
}

// ============================================================================
// SEGMENT MEMBERSHIPS
// ============================================================================

export type SegmentMembershipData = Omit<
  Prisma.crm_segment_membershipsCreateInput,
  'id' | 'joinedAt'
>;

export function buildSegmentMembership(
  data: SegmentMembershipData
): Prisma.crm_segment_membershipsCreateInput {
  return {
    id: randomUUID(),
    ...data,
  };
}

// For createMany (uses raw data format)
export function buildSegmentMembershipsMany(
  items: Array<{
    tenantId: string;
    segmentId: string;
    customerId: string;
    addedBy?: string | null;
    isManual?: boolean;
    score?: number | null;
    metadata?: Prisma.InputJsonValue | null;
  }>
): Prisma.crm_segment_membershipsCreateManyInput[] {
  return items.map(item => ({
    id: randomUUID(),
    tenantId: item.tenantId,
    segmentId: item.segmentId,
    customerId: item.customerId,
    addedBy: item.addedBy ?? null,
    isManual: item.isManual ?? false,
    score: item.score ?? null,
    metadata: item.metadata ?? Prisma.JsonNull,
  }));
}

// ============================================================================
// LOYALTY PROGRAMS
// ============================================================================

export type LoyaltyProgramData = Omit<
  Prisma.crm_loyalty_programsCreateInput,
  'id' | 'createdAt'
>;

export function buildLoyaltyProgram(
  data: LoyaltyProgramData
): Prisma.crm_loyalty_programsCreateInput {
  return {
    id: randomUUID(),
    updatedAt: new Date(),
    ...data,
  };
}

// ============================================================================
// LOYALTY RULES
// ============================================================================

export type LoyaltyRuleData = Omit<
  Prisma.crm_loyalty_rulesCreateInput,
  'id' | 'createdAt'
>;

export function buildLoyaltyRule(
  data: LoyaltyRuleData
): Prisma.crm_loyalty_rulesCreateInput {
  return {
    id: randomUUID(),
    updatedAt: new Date(),
    ...data,
  };
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export type CampaignData = Omit<
  Prisma.crm_campaignsCreateInput,
  'id' | 'createdAt'
>;

export function buildCampaign(
  data: CampaignData
): Prisma.crm_campaignsCreateInput {
  return {
    id: randomUUID(),
    updatedAt: new Date(),
    ...data,
  };
}

// ============================================================================
// CAMPAIGN AUDIENCES
// ============================================================================

export type CampaignAudienceData = Omit<
  Prisma.crm_campaign_audiencesCreateInput,
  'id' | 'createdAt'
>;

export function buildCampaignAudience(
  data: CampaignAudienceData
): Prisma.crm_campaign_audiencesCreateInput {
  return {
    id: randomUUID(),
    ...data,
  };
}

// ============================================================================
// CRM CONFIGURATIONS (Upsert)
// ============================================================================

export function buildCrmConfigUpsert(
  tenantId: string,
  configType: string,
  configData: Prisma.InputJsonValue,
  updatedBy?: string | null
): {
  where: Prisma.crm_configurationsWhereUniqueInput;
  create: Prisma.crm_configurationsCreateInput;
  update: Prisma.crm_configurationsUpdateInput;
} {
  const id = `${tenantId}_${configType}`;
  return {
    where: { id },
    create: {
      id,
      tenantId,
      configType,
      configData,
      isActive: true,
      createdBy: updatedBy ?? null,
      updatedAt: new Date(),
    },
    update: {
      configData,
      isActive: true,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
    },
  };
}
