/**
 * LEGAL PRACTICE SUITE — Filing Service
 * Phase 7B.1, S3 Core Services
 * 
 * Manual court filing tracking (no e-filing integration).
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type FilingType = 'ORIGINATING_PROCESS' | 'MOTION' | 'BRIEF' | 'AFFIDAVIT' | 'EXHIBIT' | 'JUDGMENT' | 'ORDER' | 'RULING' | 'NOTICE' | 'OTHER';

export interface CreateFilingInput {
  matterId: string;
  filingType: FilingType;
  title: string;
  description?: string;
  court: string;
  filedDate: Date;
  filedBy?: string;
  filingNumber?: string;
  receiptRef?: string;
  filingFee?: number;
  feePaid?: boolean;
  documentId?: string;
  notes?: string;
}

export interface UpdateFilingInput extends Partial<Omit<CreateFilingInput, 'matterId'>> {
  stampedCopyId?: string;
  served?: boolean;
  servedDate?: Date;
  servedOn?: string;
  acknowledged?: boolean;
  acknowledgedDate?: Date;
}

export interface FilingFilters {
  matterId?: string;
  filingType?: FilingType;
  court?: string;
  dateFrom?: Date;
  dateTo?: Date;
  served?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// FILING CRUD OPERATIONS
// ============================================================================

export async function createFiling(tenantId: string, data: CreateFilingInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  const filing = await prisma.leg_filing.create({
    data: withPrismaDefaults({
      tenantId,
      matterId: data.matterId,
      filingType: data.filingType as any,
      title: data.title,
      description: data.description,
      court: data.court,
      filedDate: data.filedDate,
      filedBy: data.filedBy,
      filingNumber: data.filingNumber,
      receiptRef: data.receiptRef,
      filingFee: data.filingFee,
      feePaid: data.feePaid ?? false,
      documentId: data.documentId,
      notes: data.notes,
    }),
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, suitNumber: true },
      },
    },
  });

  return filing;
}

export async function getFilingById(tenantId: string, filingId: string) {
  const filing = await prisma.leg_filing.findFirst({
    where: {
      id: filingId,
      tenantId,
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, court: true, suitNumber: true },
      },
    },
  });

  return filing;
}

export async function getFilings(tenantId: string, filters: FilingFilters = {}) {
  const {
    matterId,
    filingType,
    court,
    dateFrom,
    dateTo,
    served,
    page = 1,
    limit = 50,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_filingWhereInput = {
    tenantId,
    ...(matterId && { matterId }),
    ...(filingType && { filingType: filingType as any }),
    ...(court && { court: { contains: court, mode: 'insensitive' } }),
    ...(dateFrom && { filedDate: { gte: dateFrom } }),
    ...(dateTo && { filedDate: { lte: dateTo } }),
    ...(served !== undefined && { served }),
  };

  const [filings, total] = await Promise.all([
    prisma.leg_filing.findMany({
      where,
      include: {
        matter: {
          select: { id: true, matterNumber: true, title: true },
        },
      },
      orderBy: { filedDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_filing.count({ where }),
  ]);

  return {
    filings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFilingsByMatter(tenantId: string, matterId: string) {
  const filings = await prisma.leg_filing.findMany({
    where: {
      tenantId,
      matterId,
    },
    orderBy: { filedDate: 'desc' },
  });

  return filings;
}

export async function updateFiling(tenantId: string, filingId: string, data: UpdateFilingInput) {
  const result = await prisma.leg_filing.updateMany({
    where: {
      id: filingId,
      tenantId,
    },
    data: {
      ...(data.filingType && { filingType: data.filingType as any }),
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.court && { court: data.court }),
      ...(data.filedDate && { filedDate: data.filedDate }),
      ...(data.filedBy !== undefined && { filedBy: data.filedBy }),
      ...(data.filingNumber !== undefined && { filingNumber: data.filingNumber }),
      ...(data.receiptRef !== undefined && { receiptRef: data.receiptRef }),
      ...(data.filingFee !== undefined && { filingFee: data.filingFee }),
      ...(data.feePaid !== undefined && { feePaid: data.feePaid }),
      ...(data.stampedCopyId !== undefined && { stampedCopyId: data.stampedCopyId }),
      ...(data.served !== undefined && { served: data.served }),
      ...(data.servedDate !== undefined && { servedDate: data.servedDate }),
      ...(data.servedOn !== undefined && { servedOn: data.servedOn }),
      ...(data.acknowledged !== undefined && { acknowledged: data.acknowledged }),
      ...(data.acknowledgedDate !== undefined && { acknowledgedDate: data.acknowledgedDate }),
      ...(data.documentId !== undefined && { documentId: data.documentId }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getFilingById(tenantId, filingId);
}

export async function markServed(
  tenantId: string,
  filingId: string,
  servedDate: Date,
  servedOn: string
) {
  const result = await prisma.leg_filing.updateMany({
    where: {
      id: filingId,
      tenantId,
    },
    data: {
      served: true,
      servedDate,
      servedOn,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getFilingById(tenantId, filingId);
}

export async function deleteFiling(tenantId: string, filingId: string) {
  const result = await prisma.leg_filing.deleteMany({
    where: {
      id: filingId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// FILING STATISTICS
// ============================================================================

export async function getFilingStats(tenantId: string, matterId?: string) {
  const baseWhere = { tenantId, ...(matterId && { matterId }) };

  const [
    totalFilings,
    servedFilings,
    acknowledgedFilings,
  ] = await Promise.all([
    prisma.leg_filing.count({ where: baseWhere }),
    prisma.leg_filing.count({ where: { ...baseWhere, served: true } }),
    prisma.leg_filing.count({ where: { ...baseWhere, acknowledged: true } }),
  ]);

  const feeStats = await prisma.leg_filing.aggregate({
    where: baseWhere,
    _sum: { filingFee: true },
  });

  const paidFees = await prisma.leg_filing.aggregate({
    where: { ...baseWhere, feePaid: true },
    _sum: { filingFee: true },
  });

  return {
    totalFilings,
    servedFilings,
    acknowledgedFilings,
    totalFilingFees: feeStats._sum.filingFee || 0,
    paidFilingFees: paidFees._sum.filingFee || 0,
    unpaidFilingFees: (feeStats._sum.filingFee || 0) - (paidFees._sum.filingFee || 0),
  };
}

// ============================================================================
// FILING TYPE LABELS
// ============================================================================

export const FILING_TYPE_LABELS: Record<FilingType, string> = {
  ORIGINATING_PROCESS: 'Originating Process',
  MOTION: 'Motion',
  BRIEF: 'Brief',
  AFFIDAVIT: 'Affidavit',
  EXHIBIT: 'Exhibit',
  JUDGMENT: 'Judgment',
  ORDER: 'Order',
  RULING: 'Ruling',
  NOTICE: 'Notice',
  OTHER: 'Other',
};
