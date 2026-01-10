/**
 * LEGAL PRACTICE SUITE — Time Entry Service
 * Phase 7B.1, S3 Core Services
 * 
 * Billable hours tracking for legal matters.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type ActivityType = 'RESEARCH' | 'DRAFTING' | 'REVIEW' | 'APPEARANCE' | 'CALL' | 'MEETING' | 'TRAVEL' | 'FILING' | 'CORRESPONDENCE' | 'CONSULTATION' | 'OTHER';

export interface CreateTimeEntryInput {
  matterId: string;
  date: Date;
  hours: number;
  activityType: ActivityType;
  description: string;
  billable?: boolean;
  rate?: number;
  staffId: string;
  staffName: string;
  staffRole?: string;
}

export interface UpdateTimeEntryInput extends Partial<Omit<CreateTimeEntryInput, 'matterId'>> {
  approved?: boolean;
  approvedBy?: string;
}

export interface TimeEntryFilters {
  matterId?: string;
  staffId?: string;
  activityType?: ActivityType;
  billable?: boolean;
  approved?: boolean;
  invoiced?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// TIME ENTRY CRUD OPERATIONS
// ============================================================================

export async function createTimeEntry(tenantId: string, data: CreateTimeEntryInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  const amount = data.rate && data.hours ? data.hours * data.rate : null;

  const entry = await prisma.leg_time_entry.create({
    data: withPrismaDefaults({
      tenantId,
      matterId: data.matterId,
      date: data.date,
      hours: data.hours,
      activityType: data.activityType as any,
      description: data.description,
      billable: data.billable ?? true,
      rate: data.rate,
      amount,
      staffId: data.staffId,
      staffName: data.staffName,
      staffRole: data.staffRole,
    }),
    include: {
      leg_matters: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return entry;
}

export async function getTimeEntryById(tenantId: string, entryId: string) {
  const entry = await prisma.leg_time_entry.findFirst({
    where: {
      id: entryId,
      tenantId,
    },
    include: {
      leg_matters: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return entry;
}

export async function getTimeEntries(tenantId: string, filters: TimeEntryFilters = {}) {
  const {
    matterId,
    staffId,
    activityType,
    billable,
    approved,
    invoiced,
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_time_entryWhereInput = {
    tenantId,
    ...(matterId && { matterId }),
    ...(staffId && { staffId }),
    ...(activityType && { activityType: activityType as any }),
    ...(billable !== undefined && { billable }),
    ...(approved !== undefined && { approved }),
    ...(invoiced !== undefined && { invoiced }),
    ...(dateFrom && { date: { gte: dateFrom } }),
    ...(dateTo && { date: { lte: dateTo } }),
  };

  const [entries, total] = await Promise.all([
    prisma.leg_time_entry.findMany({
      where,
      include: {
        leg_matters: {
          select: { id: true, matterNumber: true, title: true, clientName: true },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_time_entry.count({ where }),
  ]);

  return {
    entries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTimeEntriesByMatter(tenantId: string, matterId: string) {
  const entries = await prisma.leg_time_entry.findMany({
    where: {
      tenantId,
      matterId,
    },
    orderBy: { date: 'desc' },
  });

  return entries;
}

export async function updateTimeEntry(tenantId: string, entryId: string, data: UpdateTimeEntryInput) {
  // Calculate amount if rate or hours changed
  let amount: number | undefined;
  if (data.rate !== undefined || data.hours !== undefined) {
    const entry = await prisma.leg_time_entry.findFirst({
      where: { id: entryId, tenantId },
    });
    if (entry) {
      const newRate = data.rate ?? entry.rate;
      const newHours = data.hours ?? entry.hours;
      amount = newRate && newHours ? newRate * newHours : undefined;
    }
  }

  const result = await prisma.leg_time_entry.updateMany({
    where: {
      id: entryId,
      tenantId,
    },
    data: {
      ...(data.date && { date: data.date }),
      ...(data.hours !== undefined && { hours: data.hours }),
      ...(data.activityType && { activityType: data.activityType as any }),
      ...(data.description && { description: data.description }),
      ...(data.billable !== undefined && { billable: data.billable }),
      ...(data.rate !== undefined && { rate: data.rate }),
      ...(amount !== undefined && { amount }),
      ...(data.staffId && { staffId: data.staffId }),
      ...(data.staffName && { staffName: data.staffName }),
      ...(data.staffRole !== undefined && { staffRole: data.staffRole }),
      ...(data.approved !== undefined && { approved: data.approved }),
      ...(data.approvedBy !== undefined && { approvedBy: data.approvedBy }),
      ...(data.approved && { approvedAt: new Date() }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getTimeEntryById(tenantId, entryId);
}

export async function approveTimeEntry(tenantId: string, entryId: string, approvedBy: string) {
  const result = await prisma.leg_time_entry.updateMany({
    where: {
      id: entryId,
      tenantId,
      approved: false,
    },
    data: {
      approved: true,
      approvedBy,
      approvedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getTimeEntryById(tenantId, entryId);
}

export async function deleteTimeEntry(tenantId: string, entryId: string) {
  // Cannot delete if invoiced
  const entry = await prisma.leg_time_entry.findFirst({
    where: { id: entryId, tenantId },
  });

  if (entry?.invoiced) {
    throw new Error('Cannot delete invoiced time entry');
  }

  const result = await prisma.leg_time_entry.deleteMany({
    where: {
      id: entryId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// TIME STATISTICS
// ============================================================================

export async function getTimeStats(tenantId: string, matterId?: string) {
  const baseWhere = { tenantId, ...(matterId && { matterId }) };

  const [
    totalEntries,
    billableEntries,
    approvedEntries,
    invoicedEntries,
  ] = await Promise.all([
    prisma.leg_time_entry.count({ where: baseWhere }),
    prisma.leg_time_entry.count({ where: { ...baseWhere, billable: true } }),
    prisma.leg_time_entry.count({ where: { ...baseWhere, approved: true } }),
    prisma.leg_time_entry.count({ where: { ...baseWhere, invoiced: true } }),
  ]);

  const hourStats = await prisma.leg_time_entry.aggregate({
    where: baseWhere,
    _sum: { hours: true, amount: true },
  });

  const billableHourStats = await prisma.leg_time_entry.aggregate({
    where: { ...baseWhere, billable: true },
    _sum: { hours: true, amount: true },
  });

  const unbilledStats = await prisma.leg_time_entry.aggregate({
    where: { ...baseWhere, billable: true, invoiced: false },
    _sum: { hours: true, amount: true },
  });

  return {
    totalEntries,
    billableEntries,
    approvedEntries,
    invoicedEntries,
    totalHours: hourStats._sum.hours || 0,
    totalAmount: hourStats._sum.amount || 0,
    billableHours: billableHourStats._sum.hours || 0,
    billableAmount: billableHourStats._sum.amount || 0,
    unbilledHours: unbilledStats._sum.hours || 0,
    unbilledAmount: unbilledStats._sum.amount || 0,
  };
}

// ============================================================================
// ACTIVITY TYPE LABELS
// ============================================================================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  RESEARCH: 'Research',
  DRAFTING: 'Drafting',
  REVIEW: 'Document Review',
  APPEARANCE: 'Court Appearance',
  CALL: 'Phone Call',
  MEETING: 'Meeting',
  TRAVEL: 'Travel',
  FILING: 'Filing',
  CORRESPONDENCE: 'Correspondence',
  CONSULTATION: 'Consultation',
  OTHER: 'Other',
};
