/**
 * LEGAL PRACTICE SUITE — Party Service
 * Phase 7B.1, S3 Core Services
 * 
 * Manages parties on legal matters (clients, opposing parties, witnesses, etc.)
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export type PartyRole = 'CLIENT' | 'OPPOSING_PARTY' | 'OPPOSING_COUNSEL' | 'WITNESS' | 'EXPERT' | 'JUDGE' | 'REGISTRAR' | 'CO_COUNSEL' | 'OTHER';

export interface CreatePartyInput {
  matterId: string;
  contactId?: string;
  partyRole: PartyRole;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  organization?: string;
  notes?: string;
  representedBy?: string;
  isAdverseParty?: boolean;
}

export interface UpdatePartyInput extends Partial<Omit<CreatePartyInput, 'matterId'>> {}

export interface PartyFilters {
  matterId?: string;
  partyRole?: PartyRole;
  isAdverseParty?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// PARTY CRUD OPERATIONS
// ============================================================================

export async function createParty(tenantId: string, data: CreatePartyInput) {
  // Verify matter belongs to tenant
  const matter = await prisma.leg_matter.findFirst({
    where: { id: data.matterId, tenantId },
  });

  if (!matter) {
    throw new Error('Matter not found');
  }

  const party = await prisma.leg_matter_party.create({
    data: withPrismaDefaults({
      tenantId,
      matterId: data.matterId,
      contactId: data.contactId,
      partyRole: data.partyRole as any,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      organization: data.organization,
      notes: data.notes,
      representedBy: data.representedBy,
      isAdverseParty: data.isAdverseParty || false,
    }),
    include: {
      leg_matters: {
        select: { id: true, matterNumber: true, title: true },
      },
    },
  });

  return party;
}

export async function getPartyById(tenantId: string, partyId: string) {
  const party = await prisma.leg_matter_party.findFirst({
    where: {
      id: partyId,
      tenantId,
    },
    include: {
      leg_matters: {
        select: { id: true, matterNumber: true, title: true, clientName: true },
      },
    },
  });

  return party;
}

export async function getParties(tenantId: string, filters: PartyFilters = {}) {
  const { matterId, partyRole, isAdverseParty, search, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.leg_matter_partyWhereInput = {
    tenantId,
    ...(matterId && { matterId }),
    ...(partyRole && { partyRole: partyRole as any }),
    ...(isAdverseParty !== undefined && { isAdverseParty }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [parties, total] = await Promise.all([
    prisma.leg_matter_party.findMany({
      where,
      include: {
        leg_matters: {
          select: { id: true, matterNumber: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leg_matter_party.count({ where }),
  ]);

  return {
    parties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPartiesByMatter(tenantId: string, matterId: string) {
  const parties = await prisma.leg_matter_party.findMany({
    where: {
      tenantId,
      matterId,
    },
    orderBy: [
      { partyRole: 'asc' },
      { name: 'asc' },
    ],
  });

  return parties;
}

export async function updateParty(tenantId: string, partyId: string, data: UpdatePartyInput) {
  const result = await prisma.leg_matter_party.updateMany({
    where: {
      id: partyId,
      tenantId,
    },
    data: {
      ...(data.contactId !== undefined && { contactId: data.contactId }),
      ...(data.partyRole && { partyRole: data.partyRole as any }),
      ...(data.name && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.organization !== undefined && { organization: data.organization }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.representedBy !== undefined && { representedBy: data.representedBy }),
      ...(data.isAdverseParty !== undefined && { isAdverseParty: data.isAdverseParty }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getPartyById(tenantId, partyId);
}

export async function deleteParty(tenantId: string, partyId: string) {
  const result = await prisma.leg_matter_party.deleteMany({
    where: {
      id: partyId,
      tenantId,
    },
  });

  return result.count > 0;
}

// ============================================================================
// PARTY ROLE LABELS
// ============================================================================

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  CLIENT: 'Client',
  OPPOSING_PARTY: 'Opposing Party',
  OPPOSING_COUNSEL: 'Opposing Counsel',
  WITNESS: 'Witness',
  EXPERT: 'Expert',
  JUDGE: 'Judge',
  REGISTRAR: 'Registrar',
  CO_COUNSEL: 'Co-Counsel',
  OTHER: 'Other',
};
