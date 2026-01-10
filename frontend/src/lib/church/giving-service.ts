/**
 * Church Suite — Giving & Financial Facts Service
 * Phase 3: Giving & Financial Facts
 *
 * Authorization: January 8, 2026 (Checkpoint B Approved - Continued)
 * Classification: HIGH TRUST
 * 
 * 🚨 COMMERCE BOUNDARY: FACTS ONLY
 * - This service records FACTS about giving and expenses
 * - NO payment processing
 * - NO wallet management
 * - NO balance calculations
 * - NO receipt generation
 * - ALL execution handled by Commerce Suite
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { logCreate } from './audit-service';

// ----------------------------------------------------------------------------
// COMMERCE BOUNDARY DISCLAIMERS
// ----------------------------------------------------------------------------

export const COMMERCE_BOUNDARY = {
  _commerce_boundary: 'FACTS_ONLY',
  _execution: 'Handled by Commerce Suite',
  _disclaimer: 'Church Suite does NOT process payments',
  _explicit_exclusions: [
    'NO payment processing',
    'NO wallet management',
    'NO balance calculations',
    'NO receipt generation',
    'NO donor ranking',
  ],
} as const;

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateTitheFactInput {
  churchId: string;
  unitId?: string;
  memberId?: string;
  isAnonymous?: boolean;
  amount: number;
  currency?: string;
  givingPeriod?: string;
  purpose?: string;
  notes?: string;
  givenMethod?: string;
}

export interface CreateOfferingFactInput {
  churchId: string;
  unitId?: string;
  memberId?: string;
  isAnonymous?: boolean;
  amount: number;
  currency?: string;
  offeringType: string;
  serviceId?: string;
  eventId?: string;
  notes?: string;
  givenMethod?: string;
}

export interface CreatePledgeFactInput {
  churchId: string;
  memberId: string;
  pledgeType: string;
  projectName?: string;
  pledgedAmount: number;
  currency?: string;
  pledgeDate: Date;
  fulfillmentDate?: Date;
  notes?: string;
}

export interface CreateExpenseFactInput {
  churchId: string;
  unitId?: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  vendor?: string;
  recipientName?: string;
  referenceNo?: string;
  expenseDate: Date;
  approvedBy?: string;
  notes?: string;
  attachmentUrl?: string;
}

export interface CreateBudgetFactInput {
  churchId: string;
  unitId?: string;
  fiscalYear: number;
  fiscalPeriod?: string;
  category: string;
  subcategory?: string;
  allocatedAmount: number;
  currency?: string;
  approvedBy: string;
  approvalDate: Date;
  notes?: string;
}

export interface CreateDisclosureInput {
  churchId: string;
  reportPeriod: string;
  reportType: string;
  totalTithes?: number;
  totalOfferings?: number;
  totalExpenses?: number;
  currency?: string;
  summaryText?: string;
  preparedBy: string;
  reportUrl?: string;
}

export interface GivingQueryFilters {
  churchId?: string;
  unitId?: string;
  memberId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// TITHE FACTS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function recordTitheFact(
  tenantId: string,
  input: CreateTitheFactInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const tithe = await prisma.chu_giving_tithe_fact.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      memberId: input.isAnonymous ? null : input.memberId,
      isAnonymous: input.isAnonymous || false,
      amount: input.amount,
      currency: input.currency || 'NGN',
      givingPeriod: input.givingPeriod,
      purpose: input.purpose || 'TITHE',
      notes: input.notes,
      givenMethod: input.givenMethod,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'tithe_fact', tithe.id, actorId, input.unitId, {
    amount: tithe.amount,
    currency: tithe.currency,
    isAnonymous: tithe.isAnonymous,
  });

  return {
    ...tithe,
    ...COMMERCE_BOUNDARY,
  };
}

export async function getTitheFacts(
  tenantId: string,
  filters: GivingQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.memberId) where.memberId = filters.memberId;
  if (filters.startDate || filters.endDate) {
    where.recordedAt = {};
    if (filters.startDate) (where.recordedAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.recordedAt as Record<string, unknown>).lte = filters.endDate;
  }

  const facts = await prisma.chu_giving_tithe_fact.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  const total = await prisma.chu_giving_tithe_fact.count({ where });

  return { facts, total, ...COMMERCE_BOUNDARY };
}

// ----------------------------------------------------------------------------
// OFFERING FACTS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function recordOfferingFact(
  tenantId: string,
  input: CreateOfferingFactInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const offering = await prisma.chu_giving_offering_fact.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      memberId: input.isAnonymous ? null : input.memberId,
      isAnonymous: input.isAnonymous || false,
      amount: input.amount,
      currency: input.currency || 'NGN',
      offeringType: input.offeringType,
      serviceId: input.serviceId,
      eventId: input.eventId,
      notes: input.notes,
      givenMethod: input.givenMethod,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'offering_fact', offering.id, actorId, input.unitId, {
    amount: offering.amount,
    offeringType: offering.offeringType,
    isAnonymous: offering.isAnonymous,
  });

  return {
    ...offering,
    ...COMMERCE_BOUNDARY,
  };
}

export async function getOfferingFacts(
  tenantId: string,
  filters: GivingQueryFilters & { offeringType?: string }
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.memberId) where.memberId = filters.memberId;
  if (filters.offeringType) where.offeringType = filters.offeringType;
  if (filters.startDate || filters.endDate) {
    where.recordedAt = {};
    if (filters.startDate) (where.recordedAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.recordedAt as Record<string, unknown>).lte = filters.endDate;
  }

  const facts = await prisma.chu_giving_offering_fact.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  const total = await prisma.chu_giving_offering_fact.count({ where });

  return { facts, total, ...COMMERCE_BOUNDARY };
}

// ----------------------------------------------------------------------------
// PLEDGE FACTS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function recordPledgeFact(
  tenantId: string,
  input: CreatePledgeFactInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const pledgeDate = new Date(input.pledgeDate);
  const fulfillmentDate = input.fulfillmentDate ? new Date(input.fulfillmentDate) : null;

  const pledge = await prisma.chu_giving_pledge_fact.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      memberId: input.memberId,
      pledgeType: input.pledgeType,
      projectName: input.projectName,
      pledgedAmount: input.pledgedAmount,
      currency: input.currency || 'NGN',
      pledgeDate,
      fulfillmentDate,
      notes: input.notes,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'pledge_fact', pledge.id, actorId, undefined, {
    pledgedAmount: pledge.pledgedAmount,
    pledgeType: pledge.pledgeType,
  });

  return {
    ...pledge,
    ...COMMERCE_BOUNDARY,
  };
}

export async function getPledgeFacts(
  tenantId: string,
  filters: GivingQueryFilters & { pledgeType?: string; status?: string }
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.memberId) where.memberId = filters.memberId;
  if (filters.pledgeType) where.pledgeType = filters.pledgeType;
  if (filters.status) where.status = filters.status;

  const facts = await prisma.chu_giving_pledge_fact.findMany({
    where,
    orderBy: { pledgeDate: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  const total = await prisma.chu_giving_pledge_fact.count({ where });

  return { facts, total, ...COMMERCE_BOUNDARY };
}

// ----------------------------------------------------------------------------
// EXPENSE FACTS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function recordExpenseFact(
  tenantId: string,
  input: CreateExpenseFactInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const expenseDate = new Date(input.expenseDate);
  const approvalDate = input.approvedBy ? new Date() : null;

  const expense = await prisma.chu_expense_fact.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      category: input.category,
      description: input.description,
      amount: input.amount,
      currency: input.currency || 'NGN',
      vendor: input.vendor,
      recipientName: input.recipientName,
      referenceNo: input.referenceNo,
      expenseDate,
      approvedBy: input.approvedBy,
      approvalDate,
      notes: input.notes,
      attachmentUrl: input.attachmentUrl,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'expense_fact', expense.id, actorId, input.unitId, {
    amount: expense.amount,
    ProductCategory: expense.category,
  });

  return {
    ...expense,
    ...COMMERCE_BOUNDARY,
  };
}

export async function getExpenseFacts(
  tenantId: string,
  filters: GivingQueryFilters & { category?: string }
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.category) where.category = filters.category;
  if (filters.startDate || filters.endDate) {
    where.expenseDate = {};
    if (filters.startDate) (where.expenseDate as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.expenseDate as Record<string, unknown>).lte = filters.endDate;
  }

  const facts = await prisma.chu_expense_fact.findMany({
    where,
    orderBy: { expenseDate: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  const total = await prisma.chu_expense_fact.count({ where });

  return { facts, total, ...COMMERCE_BOUNDARY };
}

// ----------------------------------------------------------------------------
// BUDGET FACTS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function recordBudgetFact(
  tenantId: string,
  input: CreateBudgetFactInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const approvalDate = new Date(input.approvalDate);

  const budget = await prisma.chu_budget_fact.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      fiscalYear: input.fiscalYear,
      fiscalPeriod: input.fiscalPeriod,
      category: input.category,
      subcategory: input.subcategory,
      allocatedAmount: input.allocatedAmount,
      currency: input.currency || 'NGN',
      approvedBy: input.approvedBy,
      approvalDate,
      notes: input.notes,
      recordedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'budget_fact', budget.id, actorId, input.unitId, {
    allocatedAmount: budget.allocatedAmount,
    ProductCategory: budget.category,
    fiscalYear: budget.fiscalYear,
  });

  return {
    ...budget,
    ...COMMERCE_BOUNDARY,
  };
}

export async function getBudgetFacts(
  tenantId: string,
  churchId: string,
  fiscalYear?: number
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (fiscalYear) where.fiscalYear = fiscalYear;

  const facts = await prisma.chu_budget_fact.findMany({
    where,
    orderBy: [{ fiscalYear: 'desc' }, { category: 'asc' }],
  });

  return { facts, total: facts.length, ...COMMERCE_BOUNDARY };
}

// ----------------------------------------------------------------------------
// FINANCIAL DISCLOSURES
// ----------------------------------------------------------------------------

export async function createDisclosure(
  tenantId: string,
  input: CreateDisclosureInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const disclosure = await prisma.chu_financial_disclosure.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      reportPeriod: input.reportPeriod,
      reportType: input.reportType,
      totalTithes: input.totalTithes,
      totalOfferings: input.totalOfferings,
      totalExpenses: input.totalExpenses,
      currency: input.currency || 'NGN',
      summaryText: input.summaryText,
      preparedBy: input.preparedBy,
      reportUrl: input.reportUrl,
    }),
  });

  await logCreate(tenantId, input.churchId, 'financial_disclosure', disclosure.id, actorId, undefined, {
    reportPeriod: disclosure.reportPeriod,
    reportType: disclosure.reportType,
  });

  return disclosure;
}

export async function publishDisclosure(
  tenantId: string,
  disclosureId: string,
  actorId: string
) {
  const disclosure = await prisma.chu_financial_disclosure.findFirst({
    where: { id: disclosureId, tenantId },
  });

  if (!disclosure) throw new Error('Disclosure not found');

  return prisma.chu_financial_disclosure.update({
    where: { id: disclosureId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      approvedBy: actorId,
      approvalDate: new Date(),
    },
  });
}

export async function getDisclosures(
  tenantId: string,
  churchId: string,
  isPublished?: boolean
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (isPublished !== undefined) where.isPublished = isPublished;

  return prisma.chu_financial_disclosure.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

// ----------------------------------------------------------------------------
// GIVING SUMMARY (AGGREGATED - NO INDIVIDUAL DATA FOR PRIVACY)
// ----------------------------------------------------------------------------

export async function getGivingSummary(
  tenantId: string,
  churchId: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereDate: Record<string, unknown> = {};
  if (startDate) whereDate.gte = startDate;
  if (endDate) whereDate.lte = endDate;

  const [tithes, offerings, pledges, expenses] = await Promise.all([
    prisma.chu_giving_tithe_fact.aggregate({
      where: {
        tenantId,
        churchId,
        ...(startDate || endDate ? { recordedAt: whereDate } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.chu_giving_offering_fact.aggregate({
      where: {
        tenantId,
        churchId,
        ...(startDate || endDate ? { recordedAt: whereDate } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.chu_giving_pledge_fact.aggregate({
      where: { tenantId, churchId },
      _sum: { pledgedAmount: true },
      _count: true,
    }),
    prisma.chu_expense_fact.aggregate({
      where: {
        tenantId,
        churchId,
        ...(startDate || endDate ? { expenseDate: whereDate } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    summary: {
      tithes: {
        total: tithes._sum.amount || 0,
        count: tithes._count,
      },
      offerings: {
        total: offerings._sum.amount || 0,
        count: offerings._count,
      },
      pledges: {
        total: pledges._sum.pledgedAmount || 0,
        count: pledges._count,
      },
      expenses: {
        total: expenses._sum.amount || 0,
        count: expenses._count,
      },
      netIncome: (tithes._sum.amount || 0) + (offerings._sum.amount || 0) - (expenses._sum.amount || 0),
    },
    _privacy: 'AGGREGATED_ONLY — No individual giving data exposed',
    ...COMMERCE_BOUNDARY,
  };
}
