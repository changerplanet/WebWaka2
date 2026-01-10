/**
 * LEGAL PRACTICE SUITE — Disbursement Service
 * Phase 7B.1, S3 Core Services
 * 
 * Matter expense tracking (filing fees, transport, etc.)
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type DisbursementCategory = 'FILING_FEE' | 'TRANSPORT' | 'PRINTING' | 'COURIER' | 'ACCOMMODATION' | 'EXPERT_FEE' | 'COURT_FEE' | 'SEARCH_FEE' | 'OTHER';

export interface CreateDisbursementInput {
  matterId: string;
  category: DisbursementCategory;
  description: string;
  amount: number;
  date: Date;
  vendor?: string;
  receipt?: string;
  billable?: boolean;
  submittedBy?: string;
  submittedName?: string;
  notes?: string;
}

export interface UpdateDisbursementInput extends Partial<Omit<CreateDisbursementInput, 'matterId'>> {
  approvedBy?: string;
  invoiced?: boolean;
  invoiceId?: string;
  invoiceRef?: string;
  chargedToRetainer?: boolean;
  retainerTxnId?: string;
}

export interface DisbursementFilters {
  matterId?: string;
  category?: DisbursementCategory;
  billable?: boolean;
  invoiced?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// DISBURSEMENT CRUD OPERATIONS
// ============================================================================

export async function createDisbursement(tenantId: string, data: CreateDisbursementInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  const disbursement = await prisma.leg_disbursement.create({
    data: withPrismaDefaults({
      tenantId,
      matterId: data.matterId,
      category: data.category as any,
      description: data.description,
      amount: data.amount,
      date: data.date,
      vendor: data.vendor,
      receipt: data.receipt,
      billable: data.billable ?? true,
      submittedBy: data.submittedBy,
      submittedName: data.submittedName,
      notes: data.notes,
    }),
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return disbursement;
}

export async function getDisbursementById(tenantId: string, disbursementId: string) {
  const disbursement = await prisma.leg_disbursement.findFirst({
    where: {
      id: disbursementId,
      tenantId,
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return disbursement;
}

export async function getDisbursements(tenantId: string, filters: DisbursementFilters = {}) {
  const {
    matterId,
    category,
    billable,
    invoiced,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_disbursementWhereInput = {
    tenantId,
    ...(matterId && { matterId }),
    ...(category && { category: category as any }),
    ...(billable !== undefined && { billable }),
    ...(invoiced !== undefined && { invoiced }),
    ...(dateFrom && { date: { gte: dateFrom } }),
    ...(dateTo && { date: { lte: dateTo } }),
  };

  const [disbursements, total] = await Promise.all([
    prisma.leg_disbursement.findMany({
      where,
      include: {
        matter: {
          select: { id: true, matterNumber: true, title: true },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_disbursement.count({ where }),
  ]);

  return {
    disbursements,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDisbursementsByMatter(tenantId: string, matterId: string) {
  const disbursements = await prisma.leg_disbursement.findMany({
    where: {
      tenantId,
      matterId,
    },
    orderBy: { date: 'desc' },
  });

  return disbursements;
}

export async function updateDisbursement(tenantId: string, disbursementId: string, data: UpdateDisbursementInput) {
  const result = await prisma.leg_disbursement.updateMany({
    where: {
      id: disbursementId,
      tenantId,
    },
    data: {
      ...(data.category && { category: data.category as any }),
      ...(data.description && { description: data.description }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.date && { date: data.date }),
      ...(data.vendor !== undefined && { vendor: data.vendor }),
      ...(data.receipt !== undefined && { receipt: data.receipt }),
      ...(data.billable !== undefined && { billable: data.billable }),
      ...(data.submittedBy !== undefined && { submittedBy: data.submittedBy }),
      ...(data.submittedName !== undefined && { submittedName: data.submittedName }),
      ...(data.approvedBy !== undefined && { approvedBy: data.approvedBy }),
      ...(data.approvedBy && { approvedAt: new Date() }),
      ...(data.invoiced !== undefined && { invoiced: data.invoiced }),
      ...(data.invoiceId !== undefined && { invoiceId: data.invoiceId }),
      ...(data.invoiceRef !== undefined && { invoiceRef: data.invoiceRef }),
      ...(data.chargedToRetainer !== undefined && { chargedToRetainer: data.chargedToRetainer }),
      ...(data.retainerTxnId !== undefined && { retainerTxnId: data.retainerTxnId }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getDisbursementById(tenantId, disbursementId);
}

export async function deleteDisbursement(tenantId: string, disbursementId: string) {
  // Cannot delete if invoiced
  const disbursement = await prisma.leg_disbursement.findFirst({
    where: { id: disbursementId, tenantId },
  });

  if (disbursement?.invoiced) {
    throw new Error('Cannot delete invoiced disbursement');
  }

  const result = await prisma.leg_disbursement.deleteMany({
    where: {
      id: disbursementId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// DISBURSEMENT STATISTICS
// ============================================================================

export async function getDisbursementStats(tenantId: string, matterId?: string) {
  const baseWhere = { tenantId, ...(matterId && { matterId }) };

  const [totalDisbursements, billableDisbursements, invoicedDisbursements] = await Promise.all([
    prisma.leg_disbursement.count({ where: baseWhere }),
    prisma.leg_disbursement.count({ where: { ...baseWhere, billable: true } }),
    prisma.leg_disbursement.count({ where: { ...baseWhere, invoiced: true } }),
  ]);

  const totalAmount = await prisma.leg_disbursement.aggregate({
    where: baseWhere,
    _sum: { amount: true },
  });

  const billableAmount = await prisma.leg_disbursement.aggregate({
    where: { ...baseWhere, billable: true },
    _sum: { amount: true },
  });

  const unbilledAmount = await prisma.leg_disbursement.aggregate({
    where: { ...baseWhere, billable: true, invoiced: false },
    _sum: { amount: true },
  });

  // By category
  const byCategory = await prisma.leg_disbursement.groupBy({
    by: ['category'],
    where: baseWhere,
    _sum: { amount: true },
    _count: true,
  });

  return {
    totalDisbursements,
    billableDisbursements,
    invoicedDisbursements,
    totalAmount: totalAmount._sum.amount || 0,
    billableAmount: billableAmount._sum.amount || 0,
    unbilledAmount: unbilledAmount._sum.amount || 0,
    byCategory,
  };
}

// ============================================================================
// DISBURSEMENT CATEGORY LABELS
// ============================================================================

export const DISBURSEMENT_CATEGORY_LABELS: Record<DisbursementCategory, string> = {
  FILING_FEE: 'Filing Fee',
  TRANSPORT: 'Transport',
  PRINTING: 'Printing',
  COURIER: 'Courier',
  ACCOMMODATION: 'Accommodation',
  EXPERT_FEE: 'Expert Fee',
  COURT_FEE: 'Court Fee',
  SEARCH_FEE: 'Search Fee',
  OTHER: 'Other',
};
