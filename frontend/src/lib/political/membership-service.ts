/**
 * Political Suite - Membership Service
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateMemberInput,
  UpdateMemberInput,
  MemberQueryFilters,
  PolMemberStatus,
} from './types';
import { logCreate, logUpdate, logStatusChange, logVerify } from './audit-service';

// ----------------------------------------------------------------------------
// MEMBER CRUD
// ----------------------------------------------------------------------------

export async function createMember(
  tenantId: string,
  input: CreateMemberInput,
  actorId: string
) {
  // Verify party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  // Verify organ exists if provided
  if (input.organId) {
    const organ = await prisma.pol_party_organ.findFirst({
      where: { id: input.organId, tenantId, partyId: input.partyId },
    });
    if (!organ) {
      throw new Error('Party organ not found');
    }
  }

  const member = await prisma.pol_member.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      organId: input.organId,
      firstName: input.firstName,
      lastName: input.lastName,
      otherNames: input.otherNames,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone,
      email: input.email,
      address: input.address,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      pollingUnit: input.pollingUnit,
      membershipNo: input.membershipNo,
      voterCardNo: input.voterCardNo,
      ninNo: input.ninNo,
      photoUrl: input.photoUrl,
      notes: input.notes,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'member', member.id, actorId, undefined, {
    partyId: input.partyId,
    name: `${member.firstName} ${member.lastName}`,
    state: member.state,
    lga: member.lga,
    ward: member.ward,
  });

  return member;
}

export async function updateMember(
  tenantId: string,
  memberId: string,
  input: UpdateMemberInput,
  actorId: string
) {
  const existing = await prisma.pol_member.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!existing) {
    throw new Error('Member not found');
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

  const member = await prisma.pol_member.update({
    where: { id: memberId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        'member',
        memberId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, 'member', memberId, actorId, changes);
    }
  }

  return member;
}

export async function getMember(tenantId: string, memberId: string) {
  const member = await prisma.pol_member.findFirst({
    where: { id: memberId, tenantId },
    include: {
      party: true,
      organ: true,
    },
  });

  return member;
}

export async function listMembers(tenantId: string, filters: MemberQueryFilters = {}) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.organId) where.organId = filters.organId;
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;
  if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { membershipNo: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pol_member.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
        organ: { select: { id: true, name: true, level: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_member.count({ where }),
  ]);

  return { data, total, limit: filters.limit || 50, offset: filters.offset || 0 };
}

export async function verifyMember(
  tenantId: string,
  memberId: string,
  actorId: string
) {
  const existing = await prisma.pol_member.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!existing) {
    throw new Error('Member not found');
  }

  if (existing.isVerified) {
    throw new Error('Member is already verified');
  }

  const member = await prisma.pol_member.update({
    where: { id: memberId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: actorId,
      status: PolMemberStatus.VERIFIED,
    },
  });

  await logVerify(tenantId, 'member', memberId, actorId, undefined, {
    membershipNo: member.membershipNo,
    name: `${member.firstName} ${member.lastName}`,
  });

  return member;
}

export async function getMemberStats(
  tenantId: string,
  partyId?: string
) {
  const where: Record<string, unknown> = { tenantId };
  if (partyId) where.partyId = partyId;

  const [total, verified, byStatus, byState] = await Promise.all([
    prisma.pol_member.count({ where }),
    prisma.pol_member.count({ where: { ...where, isVerified: true } }),
    prisma.pol_member.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.pol_member.groupBy({
      by: ['state'],
      where: { ...where, state: { not: null } },
      _count: true,
    }),
  ]);

  return {
    total,
    verified,
    pending: total - verified,
    byStatus: byStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byState: byState.reduce((acc: any, item: any) => {
      if (item.state) acc[item.state] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}
