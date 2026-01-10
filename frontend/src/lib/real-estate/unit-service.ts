/**
 * REAL ESTATE MANAGEMENT — Unit Service
 * Phase 7A, S2 Core Services
 * 
 * Database-backed unit management within properties.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type UnitType = 'FLAT' | 'ROOM' | 'SHOP' | 'OFFICE' | 'WAREHOUSE' | 'PARKING';
export type UnitStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface CreateUnitInput {
  propertyId: string;
  unitNumber: string;
  unitType: UnitType;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  floor?: number;
  monthlyRent: number;
  serviceCharge?: number;
  cautionDeposit?: number;
  features?: string[];
  photos?: string[];
}

export interface UpdateUnitInput extends Partial<CreateUnitInput> {
  status?: UnitStatus;
}

export interface UnitFilters {
  propertyId?: string;
  status?: UnitStatus;
  unitType?: UnitType;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// UNIT CRUD OPERATIONS
// ============================================================================

export async function createUnit(tenantId: string, data: CreateUnitInput) {
  // Verify property belongs to tenant
  const property = await prisma.re_property.findFirst({
    where: {
      id: data.propertyId,
      tenantId,
    },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  const unit = await prisma.re_unit.create({
    data: withPrismaDefaults({
      tenantId,
      propertyId: data.propertyId,
      unitNumber: data.unitNumber,
      unitType: data.unitType as any,
      status: 'VACANT',
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sizeSqm: data.sizeSqm,
      floor: data.floor,
      monthlyRent: data.monthlyRent,
      serviceCharge: data.serviceCharge || 0,
      cautionDeposit: data.cautionDeposit || 0,
      features: data.features || [],
      photos: data.photos || [],
    }),
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  return unit;
}

export async function getUnitById(tenantId: string, unitId: string) {
  const unit = await prisma.re_unit.findFirst({
    where: {
      id: unitId,
      tenantId,
    },
    include: {
      property: true,
      leases: {
        where: { status: 'ACTIVE' },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  });

  return unit;
}

export async function getUnits(tenantId: string, filters: UnitFilters = {}) {
  const {
    propertyId,
    status,
    unitType,
    minRent,
    maxRent,
    bedrooms,
    page = 1,
    limit = 20,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.re_unitWhereInput = {
    tenantId,
    ...(propertyId && { propertyId }),
    ...(status && { status: status as any }),
    ...(unitType && { unitType: unitType as any }),
    ...(minRent && { monthlyRent: { gte: minRent } }),
    ...(maxRent && { monthlyRent: { lte: maxRent } }),
    ...(bedrooms && { bedrooms }),
  };

  const [units, total] = await Promise.all([
    prisma.re_unit.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        leases: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            tenantName: true,
            endDate: true,
          },
          take: 1,
        },
      },
      orderBy: [{ property: { name: 'asc' } }, { unitNumber: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.re_unit.count({ where }),
  ]);

  return {
    units,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnitsByProperty(tenantId: string, propertyId: string) {
  const units = await prisma.re_unit.findMany({
    where: {
      tenantId,
      propertyId,
    },
    include: {
      leases: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          tenantName: true,
          tenantPhone: true,
          endDate: true,
        },
        take: 1,
      },
    },
    orderBy: { unitNumber: 'asc' },
  });

  return units;
}

export async function updateUnit(
  tenantId: string,
  unitId: string,
  data: UpdateUnitInput
) {
  const result = await prisma.re_unit.updateMany({
    where: {
      id: unitId,
      tenantId,
    },
    data: {
      ...(data.unitNumber && { unitNumber: data.unitNumber }),
      ...(data.unitType && { unitType: data.unitType as any }),
      ...(data.status && { status: data.status as any }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
      ...(data.sizeSqm !== undefined && { sizeSqm: data.sizeSqm }),
      ...(data.floor !== undefined && { floor: data.floor }),
      ...(data.monthlyRent !== undefined && { monthlyRent: data.monthlyRent }),
      ...(data.serviceCharge !== undefined && { serviceCharge: data.serviceCharge }),
      ...(data.cautionDeposit !== undefined && { cautionDeposit: data.cautionDeposit }),
      ...(data.features && { features: data.features }),
      ...(data.photos && { photos: data.photos }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getUnitById(tenantId, unitId);
}

export async function deleteUnit(tenantId: string, unitId: string) {
  // Check if unit has active leases
  const activeLeases = await prisma.re_lease.count({
    where: {
      unitId,
      tenantId,
      status: 'ACTIVE',
    },
  });

  if (activeLeases > 0) {
    throw new Error('Cannot delete unit with active lease');
  }

  const result = await prisma.re_unit.deleteMany({
    where: {
      id: unitId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// UNIT STATISTICS
// ============================================================================

export async function getUnitStats(tenantId: string, propertyId?: string) {
  const where: Prisma.re_unitWhereInput = {
    tenantId,
    ...(propertyId && { propertyId }),
  };

  const [total, vacant, occupied, reserved, maintenance] = await Promise.all([
    prisma.re_unit.count({ where }),
    prisma.re_unit.count({ where: { ...where, status: 'VACANT' } }),
    prisma.re_unit.count({ where: { ...where, status: 'OCCUPIED' } }),
    prisma.re_unit.count({ where: { ...where, status: 'RESERVED' } }),
    prisma.re_unit.count({ where: { ...where, status: 'MAINTENANCE' } }),
  ]);

  // Calculate total potential rent
  const rentData = await prisma.re_unit.aggregate({
    where,
    _sum: {
      monthlyRent: true,
    },
  });

  const occupiedRentData = await prisma.re_unit.aggregate({
    where: { ...where, status: 'OCCUPIED' },
    _sum: {
      monthlyRent: true,
    },
  });

  return {
    total,
    vacant,
    occupied,
    reserved,
    maintenance,
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    totalPotentialRent: rentData._sum.monthlyRent || 0,
    totalOccupiedRent: occupiedRentData._sum.monthlyRent || 0,
  };
}

export async function getVacantUnits(tenantId: string, limit = 10) {
  return prisma.re_unit.findMany({
    where: {
      tenantId,
      status: 'VACANT',
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
    },
    orderBy: { monthlyRent: 'asc' },
    take: limit,
  });
}
