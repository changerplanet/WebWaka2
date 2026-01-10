/**
 * Political Suite - Donation Service (Phase 2)
 * FACTS ONLY — No payment processing
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: STRICTLY ENFORCED
 * 
 * CRITICAL: This service records DONATION FACTS only.
 * All payment execution happens in the Commerce suite.
 * Records are APPEND-ONLY — no updates or deletes permitted.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logCreate } from './audit-service';

// Re-export enums
export {
  PolDonationSource,
  PolDonationStatus,
} from '@prisma/client';

import type {
  PolDonationSource,
  PolDonationStatus,
} from '@prisma/client';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface RecordDonationFactInput {
  campaignId?: string;
  partyId?: string;
  amount: number;
  currency?: string;
  source: PolDonationSource;
  donorType?: string;
  donorName?: string;
  donorAddress?: string;
  donorPhone?: string;
  donorEmail?: string;
  donorOccupation?: string;
  donorEmployer?: string;
  companyName?: string;
  companyRegNo?: string;
  state?: string;
  lga?: string;
  ward?: string;
  donationDate: Date;
  receiptDate?: Date;
  description?: string;
  purpose?: string;
  inKindDescription?: string;
  inKindValue?: number;
  isAnonymous?: boolean;
  exceedsThreshold?: boolean;
  requiresDisclosure?: boolean;
  complianceNote?: string;
  commerceRefId?: string;
}

export interface DonationFactFilters {
  campaignId?: string;
  partyId?: string;
  source?: PolDonationSource;
  status?: PolDonationStatus;
  state?: string;
  lga?: string;
  ward?: string;
  fromDate?: Date;
  toDate?: Date;
  requiresDisclosure?: boolean;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// RECORD DONATION FACT (APPEND-ONLY)
// ----------------------------------------------------------------------------

/**
 * Record a donation fact.
 * CRITICAL: This is APPEND-ONLY. Once recorded, facts cannot be modified.
 * Payment processing is handled by Commerce suite — this only records the fact.
 */
export async function recordDonationFact(
  tenantId: string,
  input: RecordDonationFactInput,
  recordedBy: string
) {
  // Validate at least campaign or party is provided
  if (!input.campaignId && !input.partyId) {
    throw new Error('Either campaignId or partyId is required');
  }

  // Validate campaign exists if provided
  if (input.campaignId) {
    const campaign = await prisma.pol_campaign.findFirst({
      where: { id: input.campaignId, tenantId },
    });
    if (!campaign) {
      throw new Error('Campaign not found');
    }
  }

  // Validate party exists if provided
  if (input.partyId) {
    const party = await prisma.pol_party.findFirst({
      where: { id: input.partyId, tenantId },
    });
    if (!party) {
      throw new Error('Party not found');
    }
  }

  const donationFact = await prisma.pol_donation_fact.create({
    data: withPrismaDefaults({
      tenantId,
      campaignId: input.campaignId,
      partyId: input.partyId,
      amount: new Decimal(input.amount),
      currency: input.currency || 'NGN',
      source: input.source,
      donorType: input.donorType,
      donorName: input.donorName,
      donorAddress: input.donorAddress,
      donorPhone: input.donorPhone,
      donorEmail: input.donorEmail,
      donorOccupation: input.donorOccupation,
      donorEmployer: input.donorEmployer,
      companyName: input.companyName,
      companyRegNo: input.companyRegNo,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      donationDate: input.donationDate,
      receiptDate: input.receiptDate,
      description: input.description,
      purpose: input.purpose,
      inKindDescription: input.inKindDescription,
      inKindValue: input.inKindValue ? new Decimal(input.inKindValue) : null,
      isAnonymous: input.isAnonymous || false,
      exceedsThreshold: input.exceedsThreshold || false,
      requiresDisclosure: input.requiresDisclosure ?? true,
      complianceNote: input.complianceNote,
      commerceRefId: input.commerceRefId,
      recordedBy,
    }),
  });

  // Log to audit trail
  await logCreate(tenantId, 'donation_fact', donationFact.id, recordedBy, undefined, {
    amount: input.amount,
    currency: input.currency || 'NGN',
    source: input.source,
    campaignId: input.campaignId,
    partyId: input.partyId,
    state: input.state,
  });

  return {
    ...donationFact,
    amount: donationFact.amount.toNumber(),
    inKindValue: donationFact.inKindValue?.toNumber() || null,
    _notice: 'FACT RECORDED — Payment execution handled by Commerce suite',
  };
}

// ----------------------------------------------------------------------------
// QUERY DONATION FACTS (READ-ONLY)
// ----------------------------------------------------------------------------

/**
 * Query donation facts.
 * This is a READ-ONLY operation for reporting and disclosure purposes.
 */
export async function queryDonationFacts(
  tenantId: string,
  filters: DonationFactFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.source) where.source = filters.source;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;
  if (filters.requiresDisclosure !== undefined) where.requiresDisclosure = filters.requiresDisclosure;

  if (filters.fromDate || filters.toDate) {
    where.donationDate = {};
    if (filters.fromDate) (where.donationDate as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.donationDate as Record<string, Date>).lte = filters.toDate;
  }

  if (filters.minAmount || filters.maxAmount) {
    where.amount = {};
    if (filters.minAmount) (where.amount as Record<string, Decimal>).gte = new Decimal(filters.minAmount);
    if (filters.maxAmount) (where.amount as Record<string, Decimal>).lte = new Decimal(filters.maxAmount);
  }

  const [data, total] = await Promise.all([
    prisma.pol_donation_fact.findMany({
      where,
      include: {
        crm_campaigns: { select: { id: true, name: true } },
        party: { select: { id: true, name: true, acronym: true } },
      },
      orderBy: { donationDate: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_donation_fact.count({ where }),
  ]);

  return {
    data: data.map((d: any) => ({
      ...d,
      amount: d.amount.toNumber(),
      inKindValue: d.inKindValue?.toNumber() || null,
    })),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _notice: 'READ-ONLY FACTS — No payment data included',
  };
}

/**
 * Get donation statistics for a campaign or party.
 */
export async function getDonationStats(
  tenantId: string,
  campaignId?: string,
  partyId?: string
) {
  const where: Record<string, unknown> = { tenantId };
  if (campaignId) where.campaignId = campaignId;
  if (partyId) where.partyId = partyId;

  const [totals, bySource, byMonth] = await Promise.all([
    prisma.pol_donation_fact.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
      _max: { amount: true },
      _min: { amount: true },
    }),
    prisma.pol_donation_fact.groupBy({
      by: ['source'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "donationDate") as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM pol_donation_fact
      WHERE "tenantId" = ${tenantId}
        ${campaignId ? prisma.$queryRaw`AND "campaignId" = ${campaignId}` : prisma.$queryRaw``}
        ${partyId ? prisma.$queryRaw`AND "partyId" = ${partyId}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', "donationDate")
      ORDER BY month DESC
      LIMIT 12
    `.catch(() => []), // Fallback if raw query fails
  ]);

  return {
    totalAmount: totals._sum.amount?.toNumber() || 0,
    totalCount: totals._count,
    averageAmount: totals._avg.amount?.toNumber() || 0,
    maxAmount: totals._max.amount?.toNumber() || 0,
    minAmount: totals._min.amount?.toNumber() || 0,
    bySource: bySource.reduce((acc: any, item: any) => {
      acc[item.source] = {
        amount: item._sum.amount?.toNumber() || 0,
        count: item._count,
      };
      return acc;
    }, {} as Record<string, { amount: number; count: number }>),
    disclaimer: 'UNOFFICIAL STATISTICS — Facts only, no payment verification',
  };
}

/**
 * Get a single donation fact by ID.
 */
export async function getDonationFact(tenantId: string, factId: string) {
  const fact = await prisma.pol_donation_fact.findFirst({
    where: { id: factId, tenantId },
    include: {
      crm_campaigns: { select: { id: true, name: true } },
      party: { select: { id: true, name: true, acronym: true } },
    },
  });

  if (!fact) return null;

  return {
    ...fact,
    amount: fact.amount.toNumber(),
    inKindValue: fact.inKindValue?.toNumber() || null,
    _notice: 'READ-ONLY FACT — Cannot be modified',
  };
}
