/**
 * Phase 16B - CRM Entity Builders
 * 
 * Pure, deterministic functions that transform service-layer inputs
 * into Prisma-compliant create/update input objects.
 * 
 * NO side effects, NO I/O, NO business logic.
 */

import { Prisma, CrmLoyaltyTransactionType, CrmEngagementType } from '@prisma/client';
import { randomUUID } from 'crypto';

// ============================================================================
// LOYALTY TRANSACTIONS
// ============================================================================

export interface LoyaltyTransactionInput {
  tenantId: string;
  programId: string;
  customerId: string;
  transactionType: CrmLoyaltyTransactionType | 'EARN' | 'REDEEM' | 'BONUS' | 'ADJUSTMENT' | 'EXPIRY' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  points: number;
  balanceAfter: number;
  sourceType?: string | null;
  sourceId?: string | null;
  ruleId?: string | null;
  description?: string | null;
  memo?: string | null;
  expiresAt?: Date | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function buildLoyaltyTransactionCreate(
  input: LoyaltyTransactionInput
): Prisma.crm_loyalty_transactionsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    crm_loyalty_programs: {
      connect: { id: input.programId }
    },
    customerId: input.customerId,
    transactionType: input.transactionType as CrmLoyaltyTransactionType,
    points: input.points,
    balanceAfter: input.balanceAfter,
    sourceType: input.sourceType ?? null,
    sourceId: input.sourceId ?? null,
    ruleId: input.ruleId ?? null,
    description: input.description ?? null,
    memo: input.memo ?? null,
    expiresAt: input.expiresAt ?? null,
    createdBy: input.createdBy ?? null,
    metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
  };
}

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

export interface EngagementEventInput {
  tenantId: string;
  customerId: string;
  eventType: CrmEngagementType | string;
  channel?: string | null;
  description?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  monetaryValue?: number | null;
  pointsValue?: number | null;
  campaignId?: string | null;
  sessionId?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
}

export function buildEngagementEventCreate(
  input: EngagementEventInput
): Prisma.crm_engagement_eventsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    customerId: input.customerId,
    eventType: input.eventType as CrmEngagementType,
    channel: input.channel ?? null,
    description: input.description ?? null,
    sourceType: input.sourceType ?? null,
    sourceId: input.sourceId ?? null,
    monetaryValue: input.monetaryValue ?? null,
    pointsValue: input.pointsValue ?? null,
    campaignId: input.campaignId ?? null,
    sessionId: input.sessionId ?? null,
    deviceId: input.deviceId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
    occurredAt: input.occurredAt ?? new Date(),
  };
}

// ============================================================================
// CUSTOMER SEGMENTS
// ============================================================================

export interface CustomerSegmentInput {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string | null;
  segmentType?: 'STATIC' | 'DYNAMIC';
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  rules?: Record<string, unknown> | null;
  priority?: number;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
}

export function buildCustomerSegmentCreate(
  input: CustomerSegmentInput
): Prisma.crm_customer_segmentsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name,
    slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: input.description ?? null,
    segmentType: (input.segmentType ?? 'DYNAMIC') as any,
    status: (input.status ?? 'ACTIVE') as any,
    rules: input.rules ? input.rules as Prisma.InputJsonValue : Prisma.JsonNull,
    priority: input.priority ?? 0,
    tags: input.tags ?? [],
    metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
    updatedAt: new Date(),
  };
}

// ============================================================================
// SEGMENT MEMBERSHIPS
// ============================================================================

export interface SegmentMembershipInput {
  tenantId: string;
  segmentId: string;
  customerId: string;
  addedBy?: string | null;
  isManual?: boolean;
  score?: number | null;
  metadata?: Record<string, unknown> | null;
}

export function buildSegmentMembershipCreate(
  input: SegmentMembershipInput
): Prisma.crm_segment_membershipsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    crm_customer_segments: {
      connect: { id: input.segmentId }
    },
    customerId: input.customerId,
    addedBy: input.addedBy ?? null,
    isManual: input.isManual ?? false,
    score: input.score ?? null,
    metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
  };
}

export function buildSegmentMembershipCreateMany(
  inputs: SegmentMembershipInput[]
): Prisma.crm_segment_membershipsCreateManyInput[] {
  return inputs.map(input => ({
    id: randomUUID(),
    tenantId: input.tenantId,
    segmentId: input.segmentId,
    customerId: input.customerId,
    addedBy: input.addedBy ?? null,
    isManual: input.isManual ?? false,
    score: input.score ?? null,
    metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
  }));
}

// ============================================================================
// LOYALTY PROGRAMS
// ============================================================================

export interface LoyaltyProgramInput {
  tenantId: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  pointsName?: string;
  pointsSymbol?: string;
  pointsPerCurrency?: number;
  currencyPerPoint?: number | null;
  pointsExpireMonths?: number | null;
  tierConfig?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export function buildLoyaltyProgramCreate(
  input: LoyaltyProgramInput
): Prisma.crm_loyalty_programsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name,
    description: input.description ?? null,
    isActive: input.isActive ?? true,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    pointsName: input.pointsName ?? 'Points',
    pointsSymbol: input.pointsSymbol ?? 'pts',
    pointsPerCurrency: input.pointsPerCurrency ?? 1,
    currencyPerPoint: input.currencyPerPoint ?? null,
    pointsExpireMonths: input.pointsExpireMonths ?? null,
    tierConfig: input.tierConfig ? input.tierConfig as Prisma.InputJsonValue : Prisma.JsonNull,
    metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
    updatedAt: new Date(),
    createdBy: input.createdBy ?? null,
  };
}

// ============================================================================
// LOYALTY RULES
// ============================================================================

export interface LoyaltyRuleInput {
  tenantId: string;
  programId: string;
  name: string;
  description?: string | null;
  ruleType: string;
  conditions?: Record<string, unknown> | null;
  pointsAwarded: number;
  multiplier?: number;
  isActive?: boolean;
  priority?: number;
  startDate?: Date | null;
  endDate?: Date | null;
  createdBy?: string | null;
}

export function buildLoyaltyRuleCreate(
  input: LoyaltyRuleInput
): Prisma.crm_loyalty_rulesCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    crm_loyalty_programs: {
      connect: { id: input.programId }
    },
    name: input.name,
    description: input.description ?? null,
    ruleType: input.ruleType,
    conditions: input.conditions ? input.conditions as Prisma.InputJsonValue : Prisma.JsonNull,
    pointsAwarded: input.pointsAwarded,
    multiplier: input.multiplier ?? 1,
    isActive: input.isActive ?? true,
    priority: input.priority ?? 0,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    createdBy: input.createdBy ?? null,
  };
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export interface CampaignInput {
  tenantId: string;
  name: string;
  description?: string | null;
  campaignType: string;
  status?: string;
  targetAudience?: Record<string, unknown> | null;
  content?: Record<string, unknown> | null;
  channels?: string[];
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: number | null;
  isActive?: boolean;
  createdBy?: string | null;
}

export function buildCampaignCreate(
  input: CampaignInput
): Prisma.crm_campaignsCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name,
    description: input.description ?? null,
    campaignType: input.campaignType,
    status: input.status ?? 'DRAFT',
    targetAudience: input.targetAudience ? input.targetAudience as Prisma.InputJsonValue : Prisma.JsonNull,
    content: input.content ? input.content as Prisma.InputJsonValue : Prisma.JsonNull,
    channels: input.channels ?? [],
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    budget: input.budget ?? null,
    isActive: input.isActive ?? true,
    createdBy: input.createdBy ?? null,
  };
}

// ============================================================================
// CAMPAIGN AUDIENCES
// ============================================================================

export interface CampaignAudienceInput {
  tenantId: string;
  campaignId: string;
  customerId: string;
  status?: string;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  openedAt?: Date | null;
  clickedAt?: Date | null;
  respondedAt?: Date | null;
  response?: Record<string, unknown> | null;
}

export function buildCampaignAudienceCreate(
  input: CampaignAudienceInput
): Prisma.crm_campaign_audiencesCreateInput {
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    crm_campaigns: {
      connect: { id: input.campaignId }
    },
    customerId: input.customerId,
    status: input.status ?? 'PENDING',
    sentAt: input.sentAt ?? null,
    deliveredAt: input.deliveredAt ?? null,
    openedAt: input.openedAt ?? null,
    clickedAt: input.clickedAt ?? null,
    respondedAt: input.respondedAt ?? null,
    response: input.response ? input.response as Prisma.InputJsonValue : Prisma.JsonNull,
  };
}

// ============================================================================
// CRM CONFIGURATIONS (Upsert)
// ============================================================================

export interface CrmConfigurationInput {
  tenantId: string;
  configType: string;
  configData: Record<string, unknown>;
  isActive?: boolean;
  updatedBy?: string | null;
}

export function buildCrmConfigurationUpsert(
  input: CrmConfigurationInput
): {
  where: Prisma.crm_configurationsWhereUniqueInput;
  create: Prisma.crm_configurationsCreateInput;
  update: Prisma.crm_configurationsUpdateInput;
} {
  const id = `${input.tenantId}_${input.configType}`;
  return {
    where: { id },
    create: {
      id,
      tenantId: input.tenantId,
      configType: input.configType,
      configData: input.configData as Prisma.InputJsonValue,
      isActive: input.isActive ?? true,
      updatedBy: input.updatedBy ?? null,
    },
    update: {
      configData: input.configData as Prisma.InputJsonValue,
      isActive: input.isActive ?? true,
      updatedBy: input.updatedBy ?? null,
      updatedAt: new Date(),
    },
  };
}
