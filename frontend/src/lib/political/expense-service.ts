/**
 * Political Suite - Expense Service (Phase 2)
 * FACTS ONLY — No payment processing
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: STRICTLY ENFORCED
 * 
 * CRITICAL: This service records EXPENSE FACTS only.
 * All payment execution happens in the Commerce suite.
 * Records are APPEND-ONLY — no updates or deletes permitted.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logCreate, logVerify } from './audit-service';

// Re-export enums
export {
  PolExpenseCategory,
  PolExpenseStatus,
} from '@prisma/client';

import type {
  PolExpenseCategory,
  PolExpenseStatus,
} from '@prisma/client';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface RecordExpenseFactInput {
  campaignId?: string;
  partyId?: string;
  amount: number;
  currency?: string;
  ProductCategory: PolExpenseCategory;
  beneficiaryType?: string;
  beneficiaryName: string;
  beneficiaryAddress?: string;
  beneficiaryPhone?: string;
  beneficiaryBank?: string;
  beneficiaryAccount?: string;
  state?: string;
  lga?: string;
  ward?: string;
  expenseDate: Date;
  paymentDate?: Date;
  description: string;
  purpose?: string;
  invoiceNo?: string;
  receiptNo?: string;
  hasInvoice?: boolean;
  hasReceipt?: boolean;
  documentRefs?: string;
  exceedsThreshold?: boolean;
  requiresDisclosure?: boolean;
  complianceNote?: string;
  commerceRefId?: string;
}

export interface ExpenseFactFilters {
  campaignId?: string;
  partyId?: string;
  category?: PolExpenseCategory;
  status?: PolExpenseStatus;
  state?: string;
  lga?: string;
  ward?: string;
  fromDate?: Date;
  toDate?: Date;
  requiresDisclosure?: boolean;
  isVerified?: boolean;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// RECORD EXPENSE FACT (APPEND-ONLY)
// ----------------------------------------------------------------------------

/**
 * Record an expense fact.
 * CRITICAL: This is APPEND-ONLY. Once recorded, facts cannot be modified.
 * Payment processing is handled by Commerce suite — this only records the fact.
 */
export async function recordExpenseFact(
  tenantId: string,
  input: RecordExpenseFactInput,
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

  const expenseFact = await prisma.pol_expense_fact.create({
    data: withPrismaDefaults({
      tenantId,
      campaignId: input.campaignId,
      partyId: input.partyId,
      amount: new Decimal(input.amount),
      currency: input.currency || 'NGN',
      category: input.category,
      beneficiaryType: input.beneficiaryType,
      beneficiaryName: input.beneficiaryName,
      beneficiaryAddress: input.beneficiaryAddress,
      beneficiaryPhone: input.beneficiaryPhone,
      beneficiaryBank: input.beneficiaryBank,
      beneficiaryAccount: input.beneficiaryAccount,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      expenseDate: input.expenseDate,
      paymentDate: input.paymentDate,
      description: input.description,
      purpose: input.purpose,
      invoiceNo: input.invoiceNo,
      receiptNo: input.receiptNo,
      hasInvoice: input.hasInvoice || false,
      hasReceipt: input.hasReceipt || false,
      documentRefs: input.documentRefs,
      exceedsThreshold: input.exceedsThreshold || false,
      requiresDisclosure: input.requiresDisclosure ?? true,
      complianceNote: input.complianceNote,
      commerceRefId: input.commerceRefId,
      recordedBy,
    }),
  });

  // Log to audit trail
  await logCreate(tenantId, 'expense_fact', expenseFact.id, recordedBy, undefined, {
    amount: input.amount,
    currency: input.currency || 'NGN',
    category: input.category,
    beneficiaryName: input.beneficiaryName,
    campaignId: input.campaignId,
    partyId: input.partyId,
    state: input.state,
  });

  return {
    ...expenseFact,
    amount: expenseFact.amount.toNumber(),
    _notice: 'FACT RECORDED — Payment execution handled by Commerce suite',
  };
}

// ----------------------------------------------------------------------------
// VERIFY EXPENSE FACT (Status Update Only)
// ----------------------------------------------------------------------------

/**
 * Verify an expense fact (mark as verified after document review).
 * This is the ONLY allowed "update" — setting verification status.
 * The expense fact itself remains immutable.
 */
export async function verifyExpenseFact(
  tenantId: string,
  factId: string,
  verifiedBy: string,
  verificationNote?: string
) {
  const existing = await prisma.pol_expense_fact.findFirst({
    where: { id: factId, tenantId },
  });

  if (!existing) {
    throw new Error('Expense fact not found');
  }

  if (existing.isVerified) {
    throw new Error('Expense fact is already verified');
  }

  // Only update verification fields — nothing else
  const verified = await prisma.pol_expense_fact.update({
    where: { id: factId },
    data: {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
      verificationNote,
      status: 'VERIFIED',
    },
  });

  await logVerify(tenantId, 'expense_fact', factId, verifiedBy, undefined, {
    verificationNote,
  });

  return {
    ...verified,
    amount: verified.amount.toNumber(),
    _notice: 'FACT VERIFIED — Core data remains immutable',
  };
}

// ----------------------------------------------------------------------------
// QUERY EXPENSE FACTS (READ-ONLY)
// ----------------------------------------------------------------------------

/**
 * Query expense facts.
 * This is a READ-ONLY operation for reporting and disclosure purposes.
 */
export async function queryExpenseFacts(
  tenantId: string,
  filters: ExpenseFactFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;
  if (filters.requiresDisclosure !== undefined) where.requiresDisclosure = filters.requiresDisclosure;
  if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

  if (filters.fromDate || filters.toDate) {
    where.expenseDate = {};
    if (filters.fromDate) (where.expenseDate as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.expenseDate as Record<string, Date>).lte = filters.toDate;
  }

  if (filters.minAmount || filters.maxAmount) {
    where.amount = {};
    if (filters.minAmount) (where.amount as Record<string, Decimal>).gte = new Decimal(filters.minAmount);
    if (filters.maxAmount) (where.amount as Record<string, Decimal>).lte = new Decimal(filters.maxAmount);
  }

  const [data, total] = await Promise.all([
    prisma.pol_expense_fact.findMany({
      where,
      include: {
        crm_campaigns: { select: { id: true, name: true } },
        party: { select: { id: true, name: true, acronym: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_expense_fact.count({ where }),
  ]);

  return {
    data: data.map((d: any) => ({
      ...d,
      amount: d.amount.toNumber(),
    })),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _notice: 'READ-ONLY FACTS — No payment data included',
  };
}

/**
 * Get expense statistics for a campaign or party.
 */
export async function getExpenseStats(
  tenantId: string,
  campaignId?: string,
  partyId?: string
) {
  const where: Record<string, unknown> = { tenantId };
  if (campaignId) where.campaignId = campaignId;
  if (partyId) where.partyId = partyId;

  const [totals, byCategory, verified] = await Promise.all([
    prisma.pol_expense_fact.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
      _max: { amount: true },
      _min: { amount: true },
    }),
    prisma.pol_expense_fact.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.pol_expense_fact.count({ where: { ...where, isVerified: true } }),
  ]);

  return {
    totalAmount: totals._sum.amount?.toNumber() || 0,
    totalCount: totals._count,
    verifiedCount: verified,
    unverifiedCount: totals._count - verified,
    averageAmount: totals._avg.amount?.toNumber() || 0,
    maxAmount: totals._max.amount?.toNumber() || 0,
    minAmount: totals._min.amount?.toNumber() || 0,
    byCategory: byCategory.reduce((acc: any, item: any) => {
      acc[item.category] = {
        amount: item._sum.amount?.toNumber() || 0,
        count: item._count,
      };
      return acc;
    }, {} as Record<string, { amount: number; count: number }>),
    disclaimer: 'UNOFFICIAL STATISTICS — Facts only, no payment verification',
  };
}

/**
 * Get a single expense fact by ID.
 */
export async function getExpenseFact(tenantId: string, factId: string) {
  const fact = await prisma.pol_expense_fact.findFirst({
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
    _notice: 'READ-ONLY FACT — Cannot be modified (except verification status)',
  };
}
