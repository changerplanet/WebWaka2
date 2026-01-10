/**
 * LEGAL PRACTICE SUITE — Deadline Service
 * Phase 7B.1, S3 Core Services
 * 
 * Court dates, filing deadlines, and limitation period tracking.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type DeadlineType = 'COURT_DATE' | 'FILING_DEADLINE' | 'LIMITATION' | 'INTERNAL' | 'COMPLIANCE' | 'OTHER';
export type DeadlineStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'EXTENDED' | 'CANCELLED';

export interface CreateDeadlineInput {
  matterId: string;
  deadlineType: DeadlineType;
  title: string;
  description?: string;
  dueDate: Date;
  dueTime?: string;
  court?: string;
  courtroom?: string;
  judgeRef?: string;
  reminderDays?: number;
  assignedTo?: string;
  assignedName?: string;
  priority?: number;
  notes?: string;
}

export interface UpdateDeadlineInput extends Partial<Omit<CreateDeadlineInput, 'matterId'>> {
  status?: DeadlineStatus;
  completedDate?: Date;
  completedBy?: string;
}

export interface DeadlineFilters {
  matterId?: string;
  deadlineType?: DeadlineType;
  status?: DeadlineStatus;
  assignedTo?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  priority?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// DEADLINE CRUD OPERATIONS
// ============================================================================

export async function createDeadline(tenantId: string, data: CreateDeadlineInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  const deadline = await prisma.leg_deadline.create({
    data: withPrismaDefaults({
      tenantId,
      matterId: data.matterId,
      deadlineType: data.deadlineType as any,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      court: data.court,
      courtroom: data.courtroom,
      judgeRef: data.judgeRef,
      reminderDays: data.reminderDays ?? 3,
      assignedTo: data.assignedTo,
      assignedName: data.assignedName,
      priority: data.priority ?? 2,
      notes: data.notes,
    }),
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return deadline;
}

export async function getDeadlineById(tenantId: string, deadlineId: string) {
  const deadline = await prisma.leg_deadline.findFirst({
    where: {
      id: deadlineId,
      tenantId,
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true, court: true },
      },
    },
  });

  return deadline;
}

export async function getDeadlines(tenantId: string, filters: DeadlineFilters = {}) {
  const {
    matterId,
    deadlineType,
    status,
    assignedTo,
    dueDateFrom,
    dueDateTo,
    priority,
    page = 1,
    limit = 50,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_deadlineWhereInput = {
    tenantId,
    ...(matterId && { matterId }),
    ...(deadlineType && { deadlineType: deadlineType as any }),
    ...(status && { status: status as any }),
    ...(assignedTo && { assignedTo }),
    ...(dueDateFrom && { dueDate: { gte: dueDateFrom } }),
    ...(dueDateTo && { dueDate: { lte: dueDateTo } }),
    ...(priority && { priority }),
  };

  const [deadlines, total] = await Promise.all([
    prisma.leg_deadline.findMany({
      where,
      include: {
        matter: {
          select: { id: true, matterNumber: true, title: true, clientName: true },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
      ],
      skip,
      take: limit,
    }),
    prisma.leg_deadline.count({ where }),
  ]);

  return {
    deadlines,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDeadlinesByMatter(tenantId: string, matterId: string) {
  const deadlines = await prisma.leg_deadline.findMany({
    where: {
      tenantId,
      matterId,
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
    ],
  });

  return deadlines;
}

export async function getUpcomingDeadlines(tenantId: string, days: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const deadlines = await prisma.leg_deadline.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: {
        gte: now,
        lte: futureDate,
      },
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true, court: true },
      },
    },
    orderBy: [
      { priority: 'asc' },
      { dueDate: 'asc' },
    ],
  });

  return deadlines;
}

export async function getOverdueDeadlines(tenantId: string) {
  const now = new Date();

  const deadlines = await prisma.leg_deadline.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: { lt: now },
    },
    include: {
      matter: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return deadlines;
}

export async function updateDeadline(tenantId: string, deadlineId: string, data: UpdateDeadlineInput) {
  const result = await prisma.leg_deadline.updateMany({
    where: {
      id: deadlineId,
      tenantId,
    },
    data: {
      ...(data.deadlineType && { deadlineType: data.deadlineType as any }),
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.dueDate && { dueDate: data.dueDate }),
      ...(data.dueTime !== undefined && { dueTime: data.dueTime }),
      ...(data.court !== undefined && { court: data.court }),
      ...(data.courtroom !== undefined && { courtroom: data.courtroom }),
      ...(data.judgeRef !== undefined && { judgeRef: data.judgeRef }),
      ...(data.status && { status: data.status as any }),
      ...(data.completedDate !== undefined && { completedDate: data.completedDate }),
      ...(data.completedBy !== undefined && { completedBy: data.completedBy }),
      ...(data.reminderDays !== undefined && { reminderDays: data.reminderDays }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      ...(data.assignedName !== undefined && { assignedName: data.assignedName }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getDeadlineById(tenantId, deadlineId);
}

export async function completeDeadline(tenantId: string, deadlineId: string, completedBy?: string) {
  const result = await prisma.leg_deadline.updateMany({
    where: {
      id: deadlineId,
      tenantId,
      status: 'PENDING',
    },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
      completedBy,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getDeadlineById(tenantId, deadlineId);
}

export async function extendDeadline(tenantId: string, deadlineId: string, newDueDate: Date, notes?: string) {
  const deadline = await prisma.leg_deadline.findFirst({
    where: { id: deadlineId, tenantId },
  });

  if (!deadline) {
    return null;
  }

  const result = await prisma.leg_deadline.updateMany({
    where: {
      id: deadlineId,
      tenantId,
    },
    data: {
      status: 'EXTENDED',
      dueDate: newDueDate,
      notes: notes ? `${deadline.notes || ''}\n\nExtended: ${notes}`.trim() : deadline.notes,
    },
  });

  // Create new pending deadline with extended date
  if (result.count > 0) {
    await prisma.leg_deadline.update({
      where: { id: deadlineId },
      data: { status: 'PENDING' },
    });
  }

  return getDeadlineById(tenantId, deadlineId);
}

export async function deleteDeadline(tenantId: string, deadlineId: string) {
  const result = await prisma.leg_deadline.deleteMany({
    where: {
      id: deadlineId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// DEADLINE STATISTICS
// ============================================================================

export async function getDeadlineStats(tenantId: string) {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalDeadlines,
    pendingDeadlines,
    completedDeadlines,
    missedDeadlines,
    overdueDeadlines,
    next7DaysDeadlines,
    next30DaysDeadlines,
    courtDates,
  ] = await Promise.all([
    prisma.leg_deadline.count({ where: { tenantId } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'COMPLETED' } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'MISSED' } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'PENDING', dueDate: { lt: now } } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'PENDING', dueDate: { gte: now, lte: next7Days } } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'PENDING', dueDate: { gte: now, lte: next30Days } } }),
    prisma.leg_deadline.count({ where: { tenantId, status: 'PENDING', deadlineType: 'COURT_DATE' } }),
  ]);

  return {
    totalDeadlines,
    pendingDeadlines,
    completedDeadlines,
    missedDeadlines,
    overdueDeadlines,
    next7DaysDeadlines,
    next30DaysDeadlines,
    upcomingCourtDates: courtDates,
  };
}

// ============================================================================
// DEADLINE TYPE LABELS
// ============================================================================

export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  COURT_DATE: 'Court Date',
  FILING_DEADLINE: 'Filing Deadline',
  LIMITATION: 'Limitation Period',
  INTERNAL: 'Internal Deadline',
  COMPLIANCE: 'Compliance',
  OTHER: 'Other',
};

export const DEADLINE_STATUS_LABELS: Record<DeadlineStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'yellow' },
  COMPLETED: { label: 'Completed', color: 'green' },
  MISSED: { label: 'Missed', color: 'red' },
  EXTENDED: { label: 'Extended', color: 'blue' },
  CANCELLED: { label: 'Cancelled', color: 'gray' },
};
