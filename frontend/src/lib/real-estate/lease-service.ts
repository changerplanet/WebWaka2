/**
 * REAL ESTATE MANAGEMENT — Lease Service
 * Phase 7A, S2 Core Services
 * 
 * Database-backed lease management.
 * Nigeria-first defaults (NGN, annual rent).
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type LeaseStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
export type RentFrequency = 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY';

export interface CreateLeaseInput {
  unitId: string;
  tenantContactId?: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  serviceCharge?: number;
  securityDeposit?: number;
  depositPaid?: boolean;
  rentFrequency?: RentFrequency;
  noticePeriodDays?: number;
  documents?: string[];
  notes?: string;
}

export interface UpdateLeaseInput extends Partial<Omit<CreateLeaseInput, 'unitId'>> {
  status?: LeaseStatus;
}

export interface LeaseFilters {
  status?: LeaseStatus;
  unitId?: string;
  propertyId?: string;
  tenantSearch?: string;
  expiringWithinDays?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// LEASE NUMBER GENERATION
// ============================================================================

async function generateLeaseNumber(tenantId: string): Promise<string> {
  const count = await prisma.re_lease.count({ where: { tenantId } });
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, '0');
  return `LSE-${year}-${sequence}`;
}

// ============================================================================
// LEASE CRUD OPERATIONS
// ============================================================================

export async function createLease(
  tenantId: string,
  data: CreateLeaseInput,
  createdBy?: string
) {
  // Verify unit belongs to tenant and is available
  const unit = await prisma.re_unit.findFirst({
    where: { id: data.unitId, tenantId },
    include: { property: { select: { id: true, name: true } } },
  });

  if (!unit) {
    throw new Error('Unit not found');
  }

  if (unit.status !== 'VACANT' && unit.status !== 'RESERVED') {
    throw new Error('Unit is not available for lease');
  }

  // Check for overlapping active leases
  const existingLease = await prisma.re_lease.findFirst({
    where: {
      unitId: data.unitId,
      status: 'ACTIVE',
      OR: [
        {
          startDate: { lte: data.endDate },
          endDate: { gte: data.startDate },
        },
      ],
    },
  });

  if (existingLease) {
    throw new Error('Unit already has an active lease for this period');
  }

  const leaseNumber = await generateLeaseNumber(tenantId);

  // Create lease in transaction
  const lease = await prisma.$transaction(async (tx) => {
    // Create the lease
    const newLease = await tx.re_lease.create({
      data: withPrismaDefaults({
        tenantId,
        unitId: data.unitId,
        leaseNumber,
        tenantContactId: data.tenantContactId,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        tenantEmail: data.tenantEmail,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
        monthlyRent: data.monthlyRent,
        serviceCharge: data.serviceCharge || 0,
        securityDeposit: data.securityDeposit || 0,
        depositPaid: data.depositPaid || false,
        rentFrequency: (data.rentFrequency || 'ANNUALLY') as any,
        noticePeriodDays: data.noticePeriodDays || 30,
        documents: data.documents || [],
        notes: data.notes,
        createdBy,
      }),
      include: {
        unit: {
          include: {
            property: { select: { id: true, name: true, address: true } },
          },
        },
      },
    });

    // Update unit status to RESERVED
    await tx.re_unit.update({
      where: { id: data.unitId },
      data: { status: 'RESERVED' },
    });

    return newLease;
  });

  return lease;
}

export async function getLeaseById(tenantId: string, leaseId: string) {
  const lease = await prisma.re_lease.findFirst({
    where: {
      id: leaseId,
      tenantId,
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true, address: true, city: true, state: true } },
        },
      },
      rentSchedules: {
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  return lease;
}

export async function getLeases(tenantId: string, filters: LeaseFilters = {}) {
  const { 
    status, 
    unitId, 
    propertyId, 
    tenantSearch,
    expiringWithinDays,
    page = 1, 
    limit = 20 
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.re_leaseWhereInput = {
    tenantId,
    ...(status && { status: status as any }),
    ...(unitId && { unitId }),
    ...(propertyId && { unit: { propertyId } }),
    ...(tenantSearch && {
      OR: [
        { tenantName: { contains: tenantSearch, mode: 'insensitive' } },
        { tenantPhone: { contains: tenantSearch } },
        { tenantEmail: { contains: tenantSearch, mode: 'insensitive' } },
      ],
    }),
    ...(expiringWithinDays && {
      status: 'ACTIVE',
      endDate: {
        lte: new Date(Date.now() + expiringWithinDays * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    }),
  };

  const [leases, total] = await Promise.all([
    prisma.re_lease.findMany({
      where,
      include: {
        unit: {
          include: {
            property: { select: { id: true, name: true, address: true } },
          },
        },
        rentSchedules: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.re_lease.count({ where }),
  ]);

  return {
    leases,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateLease(
  tenantId: string,
  leaseId: string,
  data: UpdateLeaseInput
) {
  const result = await prisma.re_lease.updateMany({
    where: {
      id: leaseId,
      tenantId,
    },
    data: {
      ...(data.tenantContactId !== undefined && { tenantContactId: data.tenantContactId }),
      ...(data.tenantName && { tenantName: data.tenantName }),
      ...(data.tenantPhone && { tenantPhone: data.tenantPhone }),
      ...(data.tenantEmail !== undefined && { tenantEmail: data.tenantEmail }),
      ...(data.startDate && { startDate: data.startDate }),
      ...(data.endDate && { endDate: data.endDate }),
      ...(data.status && { status: data.status as any }),
      ...(data.monthlyRent !== undefined && { monthlyRent: data.monthlyRent }),
      ...(data.serviceCharge !== undefined && { serviceCharge: data.serviceCharge }),
      ...(data.securityDeposit !== undefined && { securityDeposit: data.securityDeposit }),
      ...(data.depositPaid !== undefined && { depositPaid: data.depositPaid }),
      ...(data.rentFrequency && { rentFrequency: data.rentFrequency as any }),
      ...(data.noticePeriodDays !== undefined && { noticePeriodDays: data.noticePeriodDays }),
      ...(data.documents && { documents: data.documents }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getLeaseById(tenantId, leaseId);
}

export async function activateLease(tenantId: string, leaseId: string) {
  const lease = await prisma.re_lease.findFirst({
    where: { id: leaseId, tenantId, status: 'DRAFT' },
  });

  if (!lease) {
    throw new Error('Lease not found or not in draft status');
  }

  // Activate lease and update unit status in transaction
  const activatedLease = await prisma.$transaction(async (tx) => {
    const updated = await tx.re_lease.update({
      where: { id: leaseId },
      data: { status: 'ACTIVE' },
      include: {
        unit: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Update unit status to OCCUPIED
    await tx.re_unit.update({
      where: { id: lease.unitId },
      data: { status: 'OCCUPIED' },
    });

    // Update property status if needed
    await tx.re_property.updateMany({
      where: { id: updated.unit.propertyId },
      data: { status: 'OCCUPIED' },
    });

    return updated;
  });

  return activatedLease;
}

export async function terminateLease(tenantId: string, leaseId: string, reason?: string) {
  const lease = await prisma.re_lease.findFirst({
    where: { id: leaseId, tenantId, status: 'ACTIVE' },
  });

  if (!lease) {
    throw new Error('Lease not found or not active');
  }

  // Terminate lease and update unit status
  const terminatedLease = await prisma.$transaction(async (tx) => {
    const updated = await tx.re_lease.update({
      where: { id: leaseId },
      data: { 
        status: 'TERMINATED',
        notes: reason ? `${lease.notes || ''}\n\nTermination reason: ${reason}`.trim() : lease.notes,
      },
      include: {
        unit: {
          include: {
            property: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Update unit status to VACANT
    await tx.re_unit.update({
      where: { id: lease.unitId },
      data: { status: 'VACANT' },
    });

    return updated;
  });

  return terminatedLease;
}

// ============================================================================
// LEASE STATISTICS
// ============================================================================

export async function getLeaseStats(tenantId: string) {
  const [
    totalLeases,
    draftLeases,
    activeLeases,
    expiredLeases,
    terminatedLeases,
  ] = await Promise.all([
    prisma.re_lease.count({ where: { tenantId } }),
    prisma.re_lease.count({ where: { tenantId, status: 'DRAFT' } }),
    prisma.re_lease.count({ where: { tenantId, status: 'ACTIVE' } }),
    prisma.re_lease.count({ where: { tenantId, status: 'EXPIRED' } }),
    prisma.re_lease.count({ where: { tenantId, status: 'TERMINATED' } }),
  ]);

  // Leases expiring within 30 days
  const expiringLeases = await prisma.re_lease.count({
    where: {
      tenantId,
      status: 'ACTIVE',
      endDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
  });

  // Monthly rental income
  const rentStats = await prisma.re_lease.aggregate({
    where: { tenantId, status: 'ACTIVE' },
    _sum: { monthlyRent: true, serviceCharge: true },
  });

  return {
    totalLeases,
    draftLeases,
    activeLeases,
    expiredLeases,
    terminatedLeases,
    expiringLeases,
    monthlyRentalIncome: (rentStats._sum.monthlyRent || 0) + (rentStats._sum.serviceCharge || 0),
  };
}

// ============================================================================
// EXPIRING LEASES
// ============================================================================

export async function getExpiringLeases(tenantId: string, withinDays: number = 30) {
  const leases = await prisma.re_lease.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      endDate: {
        lte: new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true, address: true } },
        },
      },
    },
    orderBy: { endDate: 'asc' },
  });

  return leases;
}
