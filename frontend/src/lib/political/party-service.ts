/**
 * Political Suite - Party Service
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreatePartyInput,
  UpdatePartyInput,
  CreatePartyOrganInput,
  UpdatePartyOrganInput,
  PartyQueryFilters,
  PolPartyStatus,
  PolPartyOrganLevel,
} from './types';
import { logCreate, logUpdate, logStatusChange } from './audit-service';

// ----------------------------------------------------------------------------
// PARTY CRUD
// ----------------------------------------------------------------------------

export async function createParty(
  tenantId: string,
  input: CreatePartyInput,
  actorId: string
) {
  const party = await prisma.pol_party.create({
    data: withPrismaDefaults({
      tenantId,
      name: input.name,
      acronym: input.acronym,
      registrationNo: input.registrationNo,
      motto: input.motto,
      slogan: input.slogan,
      logoUrl: input.logoUrl,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      foundedDate: input.foundedDate,
      registeredDate: input.registeredDate,
      headquarters: input.headquarters,
      phone: input.phone,
      email: input.email,
      website: input.website,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'party', party.id, actorId, undefined, {
    name: party.name,
    acronym: party.acronym,
  });

  return party;
}

export async function updateParty(
  tenantId: string,
  partyId: string,
  input: UpdatePartyInput,
  actorId: string
) {
  const existing = await prisma.pol_party.findFirst({
    where: { id: partyId, tenantId },
  });

  if (!existing) {
    throw new Error('Party not found');
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

  const party = await prisma.pol_party.update({
    where: { id: partyId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        'party',
        partyId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, 'party', partyId, actorId, changes);
    }
  }

  return party;
}

export async function getParty(tenantId: string, partyId: string) {
  const party = await prisma.pol_party.findFirst({
    where: { id: partyId, tenantId },
    include: {
      organs: { where: { isActive: true } },
      _count: {
        select: {
          members: true,
          campaigns: true,
        },
      },
    },
  });

  return party;
}

export async function listParties(tenantId: string, filters: PartyQueryFilters = {}) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { acronym: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pol_party.findMany({
      where,
      include: {
        _count: {
          select: {
            members: true,
            campaigns: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_party.count({ where }),
  ]);

  return { data, total, limit: filters.limit || 50, offset: filters.offset || 0 };
}

// ----------------------------------------------------------------------------
// PARTY ORGAN CRUD
// ----------------------------------------------------------------------------

export async function createPartyOrgan(
  tenantId: string,
  input: CreatePartyOrganInput,
  actorId: string
) {
  // Verify party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  const organ = await prisma.pol_party_organ.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      name: input.name,
      level: input.level,
      zone: input.zone,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      parentOrganId: input.parentOrganId,
      chairmanName: input.chairmanName,
      secretaryName: input.secretaryName,
      treasurerName: input.treasurerName,
      officeAddress: input.officeAddress,
      phone: input.phone,
      email: input.email,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'party_organ', organ.id, actorId, undefined, {
    partyId: input.partyId,
    name: organ.name,
    level: organ.level,
    state: organ.state,
  });

  return organ;
}

export async function updatePartyOrgan(
  tenantId: string,
  organId: string,
  input: UpdatePartyOrganInput,
  actorId: string
) {
  const existing = await prisma.pol_party_organ.findFirst({
    where: { id: organId, tenantId },
  });

  if (!existing) {
    throw new Error('Party organ not found');
  }

  // Track changes
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
      changes[key] = {
        old: (existing as Record<string, unknown>)[key],
        new: value,
      };
    }
  }

  const organ = await prisma.pol_party_organ.update({
    where: { id: organId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    await logUpdate(tenantId, 'party_organ', organId, actorId, changes);
  }

  return organ;
}

export async function listPartyOrgans(
  tenantId: string,
  partyId: string,
  filters: {
    level?: PolPartyOrganLevel;
    state?: string;
    lga?: string;
    ward?: string;
    parentOrganId?: string;
    isActive?: boolean;
  } = {}
) {
  const where: Record<string, unknown> = { tenantId, partyId };

  if (filters.level) where.level = filters.level;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;
  if (filters.parentOrganId !== undefined) where.parentOrganId = filters.parentOrganId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const organs = await prisma.pol_party_organ.findMany({
    where,
    include: {
      parentOrgan: true,
      _count: {
        select: {
          members: true,
          childOrgans: true,
        },
      },
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });

  return organs;
}

export async function getPartyOrganHierarchy(tenantId: string, partyId: string) {
  // Get all organs for the party
  const organs = await prisma.pol_party_organ.findMany({
    where: { tenantId, partyId, isActive: true },
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: { level: 'asc' },
  });

  // Build hierarchy tree
  type OrganWithChildren = typeof organs[0] & { children: typeof organs };
  const organMap = new Map<string, OrganWithChildren>();
  
  for (const o of organs) {
    organMap.set(o.id, { ...o, children: [] });
  }
  
  const roots: OrganWithChildren[] = [];

  for (const [, organ] of Array.from(organMap.entries())) {
    if (organ.parentOrganId && organMap.has(organ.parentOrganId)) {
      organMap.get(organ.parentOrganId)!.children.push(organ);
    } else {
      roots.push(organ);
    }
  }

  return roots;
}
