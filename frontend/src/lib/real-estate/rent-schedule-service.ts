/**
 * REAL ESTATE MANAGEMENT — Rent Schedule Service
 * Phase 7A, S2 Core Services
 * 
 * Database-backed rent tracking and payment scheduling.
 * Nigeria-first defaults (NGN, annual rent cycles).
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type RentPaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'WAIVED';

export interface CreateRentScheduleInput {
  leaseId: string;
  dueDate: Date;
  amount: number;
  description?: string;
}

export interface UpdateRentScheduleInput {
  amount?: number;
  description?: string;
  status?: RentPaymentStatus;
  paidAmount?: number;
  paidDate?: Date;
  lateFee?: number;
  lateFeeApplied?: boolean;
  paymentReference?: string;
  receiptNumber?: string;
}

export interface RentScheduleFilters {
  leaseId?: string;
  propertyId?: string;
  status?: RentPaymentStatus;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface RecordPaymentInput {
  paidAmount: number;
  paidDate?: Date;
  paymentReference?: string;
  receiptNumber?: string;
}

// ============================================================================
// RENT SCHEDULE CRUD OPERATIONS
// ============================================================================

export async function createRentSchedule(
  tenantId: string,
  data: CreateRentScheduleInput
) {
  // Verify lease belongs to tenant
  const lease = await prisma.re_lease.findFirst({
    where: { id: data.leaseId, tenantId },
  });

  if (!lease) {
    throw new Error('Lease not found');
  }

  const schedule = await prisma.re_rent_schedule.create({
    data: withPrismaDefaults({
      tenantId,
      leaseId: data.leaseId,
      dueDate: data.dueDate,
      amount: data.amount,
      description: data.description,
      status: 'PENDING',
      paidAmount: 0,
    }),
    include: {
      lease: {
        select: { 
          id: true, 
          leaseNumber: true, 
          tenantName: true,
          unit: {
            select: { 
              id: true, 
              unitNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return schedule;
}

export async function getRentScheduleById(tenantId: string, scheduleId: string) {
  const schedule = await prisma.re_rent_schedule.findFirst({
    where: {
      id: scheduleId,
      tenantId,
    },
    include: {
      lease: {
        select: {
          id: true,
          leaseNumber: true,
          tenantName: true,
          tenantPhone: true,
          tenantEmail: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              property: { select: { id: true, name: true, address: true } },
            },
          },
        },
      },
    },
  });

  return schedule;
}

export async function getRentSchedules(tenantId: string, filters: RentScheduleFilters = {}) {
  const { 
    leaseId, 
    propertyId, 
    status, 
    dueDateFrom, 
    dueDateTo,
    page = 1, 
    limit = 20 
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.re_rent_scheduleWhereInput = {
    tenantId,
    ...(leaseId && { leaseId }),
    ...(propertyId && { lease: { unit: { propertyId } } }),
    ...(status && { status: status as any }),
    ...(dueDateFrom && { dueDate: { gte: dueDateFrom } }),
    ...(dueDateTo && { dueDate: { lte: dueDateTo } }),
  };

  const [schedules, total] = await Promise.all([
    prisma.re_rent_schedule.findMany({
      where,
      include: {
        lease: {
          select: {
            id: true,
            leaseNumber: true,
            tenantName: true,
            tenantPhone: true,
            unit: {
              select: {
                id: true,
                unitNumber: true,
                property: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.re_rent_schedule.count({ where }),
  ]);

  return {
    schedules,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateRentSchedule(
  tenantId: string,
  scheduleId: string,
  data: UpdateRentScheduleInput
) {
  const result = await prisma.re_rent_schedule.updateMany({
    where: {
      id: scheduleId,
      tenantId,
    },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status as any }),
      ...(data.paidAmount !== undefined && { paidAmount: data.paidAmount }),
      ...(data.paidDate !== undefined && { paidDate: data.paidDate }),
      ...(data.lateFee !== undefined && { lateFee: data.lateFee }),
      ...(data.lateFeeApplied !== undefined && { lateFeeApplied: data.lateFeeApplied }),
      ...(data.paymentReference !== undefined && { paymentReference: data.paymentReference }),
      ...(data.receiptNumber !== undefined && { receiptNumber: data.receiptNumber }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getRentScheduleById(tenantId, scheduleId);
}

// ============================================================================
// PAYMENT RECORDING
// ============================================================================

export async function recordPayment(
  tenantId: string,
  scheduleId: string,
  payment: RecordPaymentInput
) {
  const schedule = await prisma.re_rent_schedule.findFirst({
    where: { id: scheduleId, tenantId },
  });

  if (!schedule) {
    throw new Error('Rent schedule not found');
  }

  const totalDue = schedule.amount + schedule.lateFee;
  const newPaidAmount = schedule.paidAmount + payment.paidAmount;

  let newStatus: RentPaymentStatus;
  if (newPaidAmount >= totalDue) {
    newStatus = 'PAID';
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIAL';
  } else {
    newStatus = schedule.status as RentPaymentStatus;
  }

  const updated = await prisma.re_rent_schedule.update({
    where: { id: scheduleId },
    data: {
      paidAmount: newPaidAmount,
      paidDate: payment.paidDate || new Date(),
      status: newStatus as any,
      paymentReference: payment.paymentReference,
      receiptNumber: payment.receiptNumber,
    },
    include: {
      lease: {
        select: {
          id: true,
          leaseNumber: true,
          tenantName: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              property: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return updated;
}

// ============================================================================
// BULK SCHEDULE GENERATION
// ============================================================================

export async function generateRentSchedulesForLease(
  tenantId: string,
  leaseId: string
) {
  const lease = await prisma.re_lease.findFirst({
    where: { id: leaseId, tenantId },
  });

  if (!lease) {
    throw new Error('Lease not found');
  }

  // Calculate periods based on rent frequency
  const schedules: Array<{
    tenantId: string;
    leaseId: string;
    dueDate: Date;
    amount: number;
    description: string;
    status: 'PENDING';
    paidAmount: number;
  }> = [];

  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const monthlyAmount = lease.monthlyRent + lease.serviceCharge;

  let currentDate = new Date(startDate);
  let periodIndex = 1;

  // Determine period increment based on frequency
  let monthIncrement: number;
  let periodAmount: number;
  switch (lease.rentFrequency) {
    case 'MONTHLY':
      monthIncrement = 1;
      periodAmount = monthlyAmount;
      break;
    case 'QUARTERLY':
      monthIncrement = 3;
      periodAmount = monthlyAmount * 3;
      break;
    case 'BIANNUALLY':
      monthIncrement = 6;
      periodAmount = monthlyAmount * 6;
      break;
    case 'ANNUALLY':
    default:
      monthIncrement = 12;
      periodAmount = monthlyAmount * 12;
      break;
  }

  while (currentDate < endDate) {
    const dueDate = new Date(currentDate);
    const description = `Rent Payment ${periodIndex} - ${dueDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}`;

    schedules.push({
      tenantId,
      leaseId,
      dueDate,
      amount: periodAmount,
      description,
      status: 'PENDING',
      paidAmount: 0,
    });

    // Move to next period
    currentDate.setMonth(currentDate.getMonth() + monthIncrement);
    periodIndex++;
  }

  // Create all schedules
  if (schedules.length > 0) {
    await prisma.re_rent_schedule.createMany({
      data: schedules.map((s: any) => ({
        ...s,
        status: s.status as any,
      })),
    });
  }

  return schedules.length;
}

// ============================================================================
// OVERDUE MANAGEMENT
// ============================================================================

export async function markOverduePayments(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.re_rent_schedule.updateMany({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: { lt: today },
    },
    data: {
      status: 'OVERDUE',
    },
  });

  return result.count;
}

export async function applyLateFees(
  tenantId: string,
  lateFeePercentage: number = 10
) {
  const overdueSchedules = await prisma.re_rent_schedule.findMany({
    where: {
      tenantId,
      status: 'OVERDUE',
      lateFeeApplied: false,
    },
  });

  let appliedCount = 0;

  for (const schedule of overdueSchedules) {
    const lateFee = schedule.amount * (lateFeePercentage / 100);
    await prisma.re_rent_schedule.update({
      where: { id: schedule.id },
      data: {
        lateFee,
        lateFeeApplied: true,
      },
    });
    appliedCount++;
  }

  return appliedCount;
}

// ============================================================================
// RENT STATISTICS
// ============================================================================

export async function getRentStats(tenantId: string) {
  const [
    totalSchedules,
    pendingSchedules,
    paidSchedules,
    partialSchedules,
    overdueSchedules,
  ] = await Promise.all([
    prisma.re_rent_schedule.count({ where: { tenantId } }),
    prisma.re_rent_schedule.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.re_rent_schedule.count({ where: { tenantId, status: 'PAID' } }),
    prisma.re_rent_schedule.count({ where: { tenantId, status: 'PARTIAL' } }),
    prisma.re_rent_schedule.count({ where: { tenantId, status: 'OVERDUE' } }),
  ]);

  // Financial stats
  const financialStats = await prisma.re_rent_schedule.aggregate({
    where: { tenantId },
    _sum: { amount: true, paidAmount: true, lateFee: true },
  });

  const totalDue = (financialStats._sum.amount || 0) + (financialStats._sum.lateFee || 0);
  const totalCollected = financialStats._sum.paidAmount || 0;
  const totalOutstanding = totalDue - totalCollected;
  const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

  // Current month stats
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const currentMonthEnd = new Date(currentMonthStart);
  currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);

  const currentMonthStats = await prisma.re_rent_schedule.aggregate({
    where: {
      tenantId,
      dueDate: { gte: currentMonthStart, lt: currentMonthEnd },
    },
    _sum: { amount: true, paidAmount: true },
  });

  return {
    totalSchedules,
    pendingSchedules,
    paidSchedules,
    partialSchedules,
    overdueSchedules,
    totalDue,
    totalCollected,
    totalOutstanding,
    collectionRate,
    currentMonthDue: currentMonthStats._sum.amount || 0,
    currentMonthCollected: currentMonthStats._sum.paidAmount || 0,
  };
}

// ============================================================================
// ARREARS REPORT
// ============================================================================

export async function getArrearsReport(tenantId: string) {
  const overdueSchedules = await prisma.re_rent_schedule.findMany({
    where: {
      tenantId,
      status: { in: ['OVERDUE', 'PARTIAL'] },
    },
    include: {
      lease: {
        select: {
          id: true,
          leaseNumber: true,
          tenantName: true,
          tenantPhone: true,
          tenantEmail: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              property: { select: { id: true, name: true, address: true } },
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Group by tenant
  const arrearsByTenant: Record<string, {
    tenantName: string;
    tenantPhone: string;
    tenantEmail: string | null;
    totalArrears: number;
    schedules: typeof overdueSchedules;
  }> = {};

  for (const schedule of overdueSchedules) {
    const key = schedule.lease.tenantName;
    if (!arrearsByTenant[key]) {
      arrearsByTenant[key] = {
        tenantName: schedule.lease.tenantName,
        tenantPhone: schedule.lease.tenantPhone,
        tenantEmail: schedule.lease.tenantEmail,
        totalArrears: 0,
        schedules: [],
      };
    }
    const outstanding = (schedule.amount + schedule.lateFee) - schedule.paidAmount;
    arrearsByTenant[key].totalArrears += outstanding;
    arrearsByTenant[key].schedules.push(schedule);
  }

  return Object.values(arrearsByTenant).sort((a: any, b: any) => b.totalArrears - a.totalArrears);
}
