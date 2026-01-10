/**
 * LEGAL PRACTICE SUITE — Matter Service
 * Phase 7B.1, S3 Core Services
 * 
 * Database-backed legal matter (case) management.
 * Nigeria-first defaults (NGN, retainer billing).
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type MatterType = 'CIVIL' | 'CRIMINAL' | 'CORPORATE' | 'FAMILY' | 'PROPERTY' | 'EMPLOYMENT' | 'INTELLECTUAL_PROPERTY' | 'TAX' | 'BANKING' | 'ADMINISTRATIVE' | 'ARBITRATION' | 'OTHER';
export type MatterStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'CLOSED' | 'ARCHIVED';

export interface CreateMatterInput {
  title: string;
  description?: string;
  matterType: MatterType;
  practiceArea?: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  court?: string;
  division?: string;
  suitNumber?: string;
  judgeRef?: string;
  billingType?: string;
  agreedFee?: number;
  retainerAmount?: number;
  leadLawyerId?: string;
  leadLawyerName?: string;
  trialDate?: Date;
  notes?: string;
  tags?: string[];
}

export interface UpdateMatterInput extends Partial<Omit<CreateMatterInput, 'clientId'>> {
  status?: MatterStatus;
  closeDate?: Date;
  nextAction?: Date;
  internalNotes?: string;
  opposingCounsel?: string;
}

export interface MatterFilters {
  status?: MatterStatus;
  matterType?: MatterType;
  clientId?: string;
  leadLawyerId?: string;
  court?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// MATTER NUMBER GENERATION
// ============================================================================

async function generateMatterNumber(tenantId: string): Promise<string> {
  const count = await prisma.leg_matter.count({ where: { tenantId } });
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, '0');
  return `MAT-${year}-${sequence}`;
}

// ============================================================================
// MATTER CRUD OPERATIONS
// ============================================================================

export async function createMatter(
  tenantId: string,
  data: CreateMatterInput,
  platformInstanceId?: string,
  createdBy?: string
) {
  const matterNumber = await generateMatterNumber(tenantId);

  const matter = await prisma.leg_matter.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      matterNumber,
      title: data.title,
      description: data.description,
      matterType: data.matterType as any,
      status: 'DRAFT',
      practiceArea: data.practiceArea,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,
      court: data.court,
      division: data.division,
      suitNumber: data.suitNumber,
      judgeRef: data.judgeRef,
      billingType: data.billingType,
      agreedFee: data.agreedFee,
      retainerAmount: data.retainerAmount,
      leadLawyerId: data.leadLawyerId,
      leadLawyerName: data.leadLawyerName,
      trialDate: data.trialDate,
      notes: data.notes,
      tags: data.tags || [],
      createdBy,
    }),
    include: {
      parties: true,
      deadlines: {
        where: { status: 'PENDING' },
        orderBy: { dueDate: 'asc' },
        take: 3,
      },
    },
  });

  return matter;
}

export async function getMatterById(tenantId: string, matterId: string) {
  const matter = await prisma.leg_matter.findFirst({
    where: {
      id: matterId,
      tenantId,
    },
    include: {
      parties: true,
      deadlines: {
        orderBy: { dueDate: 'asc' },
      },
      retainer: {
        include: {
          transactions: {
            orderBy: { transactionDate: 'desc' },
            take: 5,
          },
        },
      },
      timeEntries: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      filings: {
        orderBy: { filedDate: 'desc' },
        take: 5,
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      disbursements: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  return matter;
}

export async function getMatters(tenantId: string, filters: MatterFilters = {}) {
  const { 
    status, 
    matterType, 
    clientId, 
    leadLawyerId,
    court,
    search,
    page = 1, 
    limit = 20 
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_matterWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
    ...(matterType && { matterType: matterType as any }),
    ...(clientId && { clientId }),
    ...(leadLawyerId && { leadLawyerId }),
    ...(court && { court: { contains: court, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { matterNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { suitNumber: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [matters, total] = await Promise.all([
    prisma.leg_matter.findMany({
      where,
      include: {
        deadlines: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            parties: true,
            timeEntries: true,
            documents: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_matter.count({ where }),
  ]);

  return {
    matters,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateMatter(
  tenantId: string,
  matterId: string,
  data: UpdateMatterInput
) {
  const result = await prisma.leg_matter.updateMany({
    where: {
      id: matterId,
      tenantId,
    },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.matterType && { matterType: data.matterType as any }),
      ...(data.status && { status: data.status as any }),
      ...(data.practiceArea !== undefined && { practiceArea: data.practiceArea }),
      ...(data.court !== undefined && { court: data.court }),
      ...(data.division !== undefined && { division: data.division }),
      ...(data.suitNumber !== undefined && { suitNumber: data.suitNumber }),
      ...(data.judgeRef !== undefined && { judgeRef: data.judgeRef }),
      ...(data.billingType !== undefined && { billingType: data.billingType }),
      ...(data.agreedFee !== undefined && { agreedFee: data.agreedFee }),
      ...(data.retainerAmount !== undefined && { retainerAmount: data.retainerAmount }),
      ...(data.leadLawyerId !== undefined && { leadLawyerId: data.leadLawyerId }),
      ...(data.leadLawyerName !== undefined && { leadLawyerName: data.leadLawyerName }),
      ...(data.trialDate !== undefined && { trialDate: data.trialDate }),
      ...(data.closeDate !== undefined && { closeDate: data.closeDate }),
      ...(data.nextAction !== undefined && { nextAction: data.nextAction }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
      ...(data.opposingCounsel !== undefined && { opposingCounsel: data.opposingCounsel }),
      ...(data.tags && { tags: data.tags }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getMatterById(tenantId, matterId);
}

export async function closeMatter(tenantId: string, matterId: string) {
  const result = await prisma.leg_matter.updateMany({
    where: {
      id: matterId,
      tenantId,
      status: { not: 'CLOSED' },
    },
    data: {
      status: 'CLOSED',
      closeDate: new Date(),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getMatterById(tenantId, matterId);
}

export async function reopenMatter(tenantId: string, matterId: string) {
  const result = await prisma.leg_matter.updateMany({
    where: {
      id: matterId,
      tenantId,
      status: 'CLOSED',
    },
    data: {
      status: 'ACTIVE',
      closeDate: null,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getMatterById(tenantId, matterId);
}

// ============================================================================
// MATTER STATISTICS
// ============================================================================

export async function getMatterStats(tenantId: string) {
  const [
    totalMatters,
    draftMatters,
    activeMatters,
    onHoldMatters,
    closedMatters,
  ] = await Promise.all([
    prisma.leg_matter.count({ where: { tenantId } }),
    prisma.leg_matter.count({ where: { tenantId, status: 'DRAFT' } }),
    prisma.leg_matter.count({ where: { tenantId, status: 'ACTIVE' } }),
    prisma.leg_matter.count({ where: { tenantId, status: 'ON_HOLD' } }),
    prisma.leg_matter.count({ where: { tenantId, status: 'CLOSED' } }),
  ]);

  // Matters by type
  const mattersByType = await prisma.leg_matter.groupBy({
    by: ['matterType'],
    where: { tenantId, status: { not: 'ARCHIVED' } },
    _count: true,
  });

  // Upcoming deadlines
  const upcomingDeadlines = await prisma.leg_deadline.count({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      },
    },
  });

  // Billable hours this month
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const monthlyBillableHours = await prisma.leg_time_entry.aggregate({
    where: {
      tenantId,
      billable: true,
      date: { gte: currentMonthStart },
    },
    _sum: { hours: true },
  });

  return {
    totalMatters,
    draftMatters,
    activeMatters,
    onHoldMatters,
    closedMatters,
    mattersByType,
    upcomingDeadlines,
    monthlyBillableHours: monthlyBillableHours._sum.hours || 0,
  };
}

// ============================================================================
// CONFLICT CHECK
// ============================================================================

export async function checkConflict(tenantId: string, partyName: string, excludeMatterId?: string) {
  const conflicts = await prisma.leg_matter_party.findMany({
    where: {
      tenantId,
      name: { contains: partyName, mode: 'insensitive' },
      ...(excludeMatterId && { matterId: { not: excludeMatterId } }),
    },
    include: {
      leg_matters: {
        select: {
          id: true,
          matterNumber: true,
          title: true,
          status: true,
          clientName: true,
        },
      },
    },
    take: 20,
  });

  return conflicts;
}
