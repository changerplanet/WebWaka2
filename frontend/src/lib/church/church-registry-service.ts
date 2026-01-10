/**
 * Church Suite — Church Registry Service
 * Phase 1: Registry & Membership
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateChurchInput,
  UpdateChurchInput,
  ChurchQueryFilters,
  CreateChurchUnitInput,
  UpdateChurchUnitInput,
  ChurchUnitQueryFilters,
  CreateCellGroupInput,
  UpdateCellGroupInput,
  CellGroupQueryFilters,
} from './types';
import { logCreate, logUpdate, logStatusChange } from './audit-service';

// ----------------------------------------------------------------------------
// CHURCH CRUD
// ----------------------------------------------------------------------------

export async function createChurch(
  tenantId: string,
  input: CreateChurchInput,
  actorId: string
) {
  const church = await prisma.chu_church.create({
    data: withPrismaDefaults({
      tenantId,
      name: input.name,
      acronym: input.acronym,
      motto: input.motto,
      vision: input.vision,
      mission: input.mission,
      registrationNo: input.registrationNo,
      registeredDate: input.registeredDate,
      headquarters: input.headquarters,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country || 'Nigeria',
      phone: input.phone,
      email: input.email,
      website: input.website,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, church.id, 'church', church.id, actorId, undefined, {
    name: church.name,
    acronym: church.acronym,
  });

  return church;
}

export async function updateChurch(
  tenantId: string,
  churchId: string,
  input: UpdateChurchInput,
  actorId: string
) {
  const existing = await prisma.chu_church.findFirst({
    where: { id: churchId, tenantId },
  });

  if (!existing) {
    throw new Error('Church not found');
  }

  // Track changes for audit
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
      changes[key] = {
        old: (existing as Record<string, unknown>)[key],
        new: value,
      };
    }
  }

  const church = await prisma.chu_church.update({
    where: { id: churchId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        churchId,
        'church',
        churchId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, churchId, 'church', churchId, actorId, changes);
    }
  }

  return church;
}

export async function getChurch(
  tenantId: string,
  churchId: string
) {
  return prisma.chu_church.findFirst({
    where: { id: churchId, tenantId },
    include: {
      units: { where: { status: 'ACTIVE' }, take: 10 },
      _count: {
        select: {
          members: true,
          units: true,
          cellGroups: true,
        },
      },
    },
  });
}

export async function listChurches(
  tenantId: string,
  filters: ChurchQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { acronym: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const churches = await prisma.chu_church.findMany({
    where,
    orderBy: { name: 'asc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      _count: {
        select: {
          members: true,
          units: true,
          cellGroups: true,
        },
      },
    },
  });

  const total = await prisma.chu_church.count({ where });

  return { churches, total };
}

// ----------------------------------------------------------------------------
// CHURCH UNIT CRUD
// ----------------------------------------------------------------------------

export async function createChurchUnit(
  tenantId: string,
  input: CreateChurchUnitInput,
  actorId: string
) {
  // Validate church exists
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  // Build hierarchy path
  let hierarchyPath = `/${input.churchId}`;
  if (input.parentUnitId) {
    const parent = await prisma.chu_church_unit.findFirst({
      where: { id: input.parentUnitId, tenantId },
    });
    if (!parent) throw new Error('Parent unit not found');
    hierarchyPath = `${parent.hierarchyPath || '/' + parent.churchId}/${input.parentUnitId}`;
  }

  const unit = await prisma.chu_church_unit.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      name: input.name,
      code: input.code,
      level: input.level,
      parentUnitId: input.parentUnitId,
      hierarchyPath,
      address: input.address,
      city: input.city,
      lga: input.lga,
      state: input.state,
      phone: input.phone,
      email: input.email,
      establishedDate: input.establishedDate,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'church_unit', unit.id, actorId, unit.id, {
    name: unit.name,
    level: unit.level,
    parentUnitId: unit.parentUnitId,
  });

  return unit;
}

export async function updateChurchUnit(
  tenantId: string,
  unitId: string,
  input: UpdateChurchUnitInput,
  actorId: string
) {
  const existing = await prisma.chu_church_unit.findFirst({
    where: { id: unitId, tenantId },
  });

  if (!existing) throw new Error('Church unit not found');

  // Track changes for audit
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
      changes[key] = {
        old: (existing as Record<string, unknown>)[key],
        new: value,
      };
    }
  }

  const unit = await prisma.chu_church_unit.update({
    where: { id: unitId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        existing.churchId,
        'church_unit',
        unitId,
        actorId,
        String(changes.status.old),
        String(changes.status.new),
        undefined,
        unitId
      );
    } else {
      await logUpdate(tenantId, existing.churchId, 'church_unit', unitId, actorId, changes, unitId);
    }
  }

  return unit;
}

export async function getChurchUnit(
  tenantId: string,
  unitId: string
) {
  return prisma.chu_church_unit.findFirst({
    where: { id: unitId, tenantId },
    include: {
      church: true,
      parentUnit: true,
      childUnits: { where: { status: 'ACTIVE' } },
      _count: {
        select: {
          members: true,
          cellGroups: true,
        },
      },
    },
  });
}

export async function listChurchUnits(
  tenantId: string,
  filters: ChurchUnitQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.level) where.level = filters.level;
  if (filters.parentUnitId) where.parentUnitId = filters.parentUnitId;
  if (filters.state) where.state = filters.state;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const units = await prisma.chu_church_unit.findMany({
    where,
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      church: { select: { name: true } },
      parentUnit: { select: { name: true, level: true } },
      _count: {
        select: {
          members: true,
          childUnits: true,
        },
      },
    },
  });

  const total = await prisma.chu_church_unit.count({ where });

  return { units, total };
}

export async function getHierarchy(
  tenantId: string,
  churchId: string
) {
  const units = await prisma.chu_church_unit.findMany({
    where: { tenantId, churchId, status: 'ACTIVE' },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          members: true,
          childUnits: true,
        },
      },
    },
  });

  // Build tree structure
  const unitMap = new Map(units.map((u: any) => [u.id, { ...u, children: [] as typeof units }]));
  const roots: typeof units = [];

  for (const unit of units) {
    if (unit.parentUnitId && unitMap.has(unit.parentUnitId)) {
      const parent = unitMap.get(unit.parentUnitId)!;
      (parent as { children: typeof units }).children.push(unit);
    } else {
      roots.push(unit);
    }
  }

  return roots;
}

// ----------------------------------------------------------------------------
// CELL GROUP CRUD
// ----------------------------------------------------------------------------

export async function createCellGroup(
  tenantId: string,
  input: CreateCellGroupInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const cellGroup = await prisma.chu_cell_group.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      name: input.name,
      code: input.code,
      hostName: input.hostName,
      hostPhone: input.hostPhone,
      address: input.address,
      area: input.area,
      meetingDay: input.meetingDay,
      meetingTime: input.meetingTime,
      cellLeaderId: input.cellLeaderId,
      assistantLeaderId: input.assistantLeaderId,
      maxMembers: input.maxMembers,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'cell_group', cellGroup.id, actorId, input.unitId, {
    name: cellGroup.name,
    area: cellGroup.area,
  });

  return cellGroup;
}

export async function updateCellGroup(
  tenantId: string,
  cellGroupId: string,
  input: UpdateCellGroupInput,
  actorId: string
) {
  const existing = await prisma.chu_cell_group.findFirst({
    where: { id: cellGroupId, tenantId },
  });

  if (!existing) throw new Error('Cell group not found');

  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
      changes[key] = {
        old: (existing as Record<string, unknown>)[key],
        new: value,
      };
    }
  }

  const cellGroup = await prisma.chu_cell_group.update({
    where: { id: cellGroupId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    await logUpdate(tenantId, existing.churchId, 'cell_group', cellGroupId, actorId, changes, existing.unitId || undefined);
  }

  return cellGroup;
}

export async function getCellGroup(
  tenantId: string,
  cellGroupId: string
) {
  return prisma.chu_cell_group.findFirst({
    where: { id: cellGroupId, tenantId },
    include: {
      church: { select: { name: true } },
      unit: { select: { name: true, level: true } },
      members: {
        where: { isActive: true },
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      },
    },
  });
}

export async function listCellGroups(
  tenantId: string,
  filters: CellGroupQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { area: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const cellGroups = await prisma.chu_cell_group.findMany({
    where,
    orderBy: { name: 'asc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      unit: { select: { name: true, level: true } },
      _count: {
        select: { members: true },
      },
    },
  });

  const total = await prisma.chu_cell_group.count({ where });

  return { cellGroups, total };
}
