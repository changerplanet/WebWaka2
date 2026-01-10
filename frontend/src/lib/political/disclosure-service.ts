/**
 * Political Suite - Disclosure Service (Phase 2)
 * Reporting & Aggregation — No payment data
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: STRICTLY ENFORCED
 * 
 * CRITICAL: Disclosures are aggregations of donation_fact and expense_fact.
 * They are READ-ONLY outputs for regulatory reporting.
 * All disclosures must include UNOFFICIAL disclaimers.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logCreate, logStatusChange } from './audit-service';

// Re-export enums
export {
  PolDisclosureType,
  PolDisclosureStatus,
} from '@prisma/client';

import type {
  PolDisclosureType,
  PolDisclosureStatus,
} from '@prisma/client';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface GenerateDisclosureInput {
  campaignId?: string;
  partyId?: string;
  title: string;
  type: PolDisclosureType;
  periodStart: Date;
  periodEnd: Date;
  jurisdiction?: string;
  state?: string;
}

export interface DisclosureFilters {
  campaignId?: string;
  partyId?: string;
  type?: PolDisclosureType;
  status?: PolDisclosureStatus;
  state?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// MANDATORY DISCLAIMER
const MANDATORY_DISCLAIMER = 'UNOFFICIAL - FOR INTERNAL PARTY USE ONLY. NOT AN OFFICIAL REGULATORY FILING.';

// ----------------------------------------------------------------------------
// GENERATE DISCLOSURE
// ----------------------------------------------------------------------------

/**
 * Generate a financial disclosure by aggregating donation and expense facts.
 * This creates a snapshot report for a given period.
 */
export async function generateDisclosure(
  tenantId: string,
  input: GenerateDisclosureInput,
  generatedBy: string
) {
  // Validate at least campaign or party is provided
  if (!input.campaignId && !input.partyId) {
    throw new Error('Either campaignId or partyId is required');
  }

  // Build where clause for facts
  const factWhere: Record<string, unknown> = {
    tenantId,
    requiresDisclosure: true,
  };
  
  if (input.campaignId) factWhere.campaignId = input.campaignId;
  if (input.partyId) factWhere.partyId = input.partyId;

  // Aggregate donations for the period
  const donationAgg = await prisma.pol_donation_fact.aggregate({
    where: {
      ...factWhere,
      donationDate: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
    },
    _sum: { amount: true },
    _count: true,
  });

  // Aggregate expenses for the period
  const expenseAgg = await prisma.pol_expense_fact.aggregate({
    where: {
      ...factWhere,
      expenseDate: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
    },
    _sum: { amount: true },
    _count: true,
  });

  // Group donations by source
  const donationsBySource = await prisma.pol_donation_fact.groupBy({
    by: ['source'],
    where: {
      ...factWhere,
      donationDate: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
    },
    _sum: { amount: true },
  });

  // Group expenses by category
  const expensesByCategory = await prisma.pol_expense_fact.groupBy({
    by: ['category'],
    where: {
      ...factWhere,
      expenseDate: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
    },
    _sum: { amount: true },
  });

  // Get top donors (non-anonymous, over threshold)
  const topDonors = await prisma.pol_donation_fact.findMany({
    where: {
      ...factWhere,
      donationDate: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
      isAnonymous: false,
      donorName: { not: null },
    },
    orderBy: { amount: 'desc' },
    take: 10,
    select: {
      donorName: true,
      donorType: true,
      amount: true,
      source: true,
    },
  });

  // Get large expenses
  const largeExpenses = await prisma.pol_expense_fact.findMany({
    where: {
      ...factWhere,
      expenseDate: {
        gte: input.periodStart,
        lte: input.periodEnd,
      },
    },
    orderBy: { amount: 'desc' },
    take: 10,
    select: {
      beneficiaryName: true,
      beneficiaryType: true,
      amount: true,
      category: true,
      description: true,
    },
  });

  // Calculate totals
  const totalDonations = donationAgg._sum.amount?.toNumber() || 0;
  const totalExpenses = expenseAgg._sum.amount?.toNumber() || 0;
  const netBalance = totalDonations - totalExpenses;

  // Create disclosure record
  const disclosure = await prisma.pol_disclosure.create({
    data: withPrismaDefaults({
      tenantId,
      campaignId: input.campaignId,
      partyId: input.partyId,
      title: input.title,
      type: input.type,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      jurisdiction: input.jurisdiction,
      state: input.state,
      totalDonations: new Decimal(totalDonations),
      donationCount: donationAgg._count,
      totalExpenses: new Decimal(totalExpenses),
      expenseCount: expenseAgg._count,
      netBalance: new Decimal(netBalance),
      donationsBySource: donationsBySource.reduce((acc: any, item: any) => {
        acc[item.source] = item._sum.amount?.toNumber() || 0;
        return acc;
      }, {} as Record<string, number>),
      expensesByCategory: expensesByCategory.reduce((acc: any, item: any) => {
        acc[item.category] = item._sum.amount?.toNumber() || 0;
        return acc;
      }, {} as Record<string, number>),
      topDonors: topDonors.map((d: any) => ({
        name: d.donorName,
        type: d.donorType,
        amount: d.amount.toNumber(),
        source: d.source,
      })),
      largeExpenses: largeExpenses.map((e: any) => ({
        beneficiary: e.beneficiaryName,
        type: e.beneficiaryType,
        amount: e.amount.toNumber(),
        category: e.category,
        description: e.description,
      })),
      disclaimer: MANDATORY_DISCLAIMER,
      generatedBy,
    }),
  });

  await logCreate(tenantId, 'disclosure', disclosure.id, generatedBy, undefined, {
    type: input.type,
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    totalDonations,
    totalExpenses,
    netBalance,
  });

  return formatDisclosure(disclosure);
}

// ----------------------------------------------------------------------------
// QUERY DISCLOSURES
// ----------------------------------------------------------------------------

/**
 * Query disclosures.
 */
export async function queryDisclosures(
  tenantId: string,
  filters: DisclosureFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;

  if (filters.fromDate || filters.toDate) {
    where.periodStart = {};
    if (filters.fromDate) (where.periodStart as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.periodStart as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_disclosure.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        party: { select: { id: true, name: true, acronym: true } },
      },
      orderBy: { periodStart: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_disclosure.count({ where }),
  ]);

  return {
    data: data.map(formatDisclosure),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get a single disclosure by ID.
 */
export async function getDisclosure(tenantId: string, disclosureId: string) {
  const disclosure = await prisma.pol_disclosure.findFirst({
    where: { id: disclosureId, tenantId },
    include: {
      campaign: { select: { id: true, name: true } },
      party: { select: { id: true, name: true, acronym: true } },
    },
  });

  if (!disclosure) return null;

  return formatDisclosure(disclosure);
}

/**
 * Submit a disclosure (change status to SUBMITTED).
 */
export async function submitDisclosure(
  tenantId: string,
  disclosureId: string,
  submittedBy: string,
  submittedTo: string
) {
  const existing = await prisma.pol_disclosure.findFirst({
    where: { id: disclosureId, tenantId },
  });

  if (!existing) {
    throw new Error('Disclosure not found');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft disclosures can be submitted');
  }

  const disclosure = await prisma.pol_disclosure.update({
    where: { id: disclosureId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      submittedBy,
      submittedTo,
    },
    include: {
      campaign: { select: { id: true, name: true } },
      party: { select: { id: true, name: true, acronym: true } },
    },
  });

  await logStatusChange(
    tenantId,
    'disclosure',
    disclosureId,
    submittedBy,
    'DRAFT',
    'SUBMITTED'
  );

  return formatDisclosure(disclosure);
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function formatDisclosure(disclosure: {
  id: string;
  tenantId: string;
  campaignId: string | null;
  partyId: string | null;
  title: string;
  type: PolDisclosureType;
  periodStart: Date;
  periodEnd: Date;
  jurisdiction: string | null;
  state: string | null;
  totalDonations: Decimal;
  donationCount: number;
  totalExpenses: Decimal;
  expenseCount: number;
  netBalance: Decimal;
  donationsBySource: unknown;
  expensesByCategory: unknown;
  topDonors: unknown;
  largeExpenses: unknown;
  status: PolDisclosureStatus;
  statusNote: string | null;
  submittedAt: Date | null;
  submittedBy: string | null;
  submittedTo: string | null;
  responseDate: Date | null;
  responseNote: string | null;
  disclaimer: string;
  generatedAt: Date;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  campaign?: { id: string; name: string } | null;
  party?: { id: string; name: string; acronym: string } | null;
}) {
  return {
    ...disclosure,
    totalDonations: disclosure.totalDonations.toNumber(),
    totalExpenses: disclosure.totalExpenses.toNumber(),
    netBalance: disclosure.netBalance.toNumber(),
    _mandatory_notice: MANDATORY_DISCLAIMER,
  };
}
