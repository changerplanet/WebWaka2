/**
 * Church Suite — Membership Lifecycle Service
 * Phase 1: Registry & Membership
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 * 
 * ⚠️ SAFEGUARDING: Minors data is protected
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateMemberInput,
  UpdateMemberInput,
  MemberQueryFilters,
  ChangeMemberStatusInput,
  CreateGuardianLinkInput,
  VerifyGuardianLinkInput,
  CreateFamilyUnitInput,
  UpdateFamilyUnitInput,
  CreateCellMembershipInput,
  ChuMemberStatus,
} from './types';
import { logCreate, logUpdate, logStatusChange, logAssignment, logTermination } from './audit-service';

// ----------------------------------------------------------------------------
// MEMBER CRUD
// ----------------------------------------------------------------------------

export async function registerMember(
  tenantId: string,
  input: CreateMemberInput,
  actorId: string
) {
  // Validate church exists
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  // Parse dates
  const dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
  const joinDate = input.joinDate ? new Date(input.joinDate) : new Date();
  const baptismDate = input.baptismDate ? new Date(input.baptismDate) : null;

  // Check if minor (under 18)
  let isMinor = false;
  if (dateOfBirth) {
    const age = Math.floor(
      (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    isMinor = age < 18;
  }

  const member = await prisma.chu_member.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      gender: input.gender,
      dateOfBirth,
      isMinor,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      lga: input.lga,
      state: input.state,
      membershipNo: input.membershipNo,
      joinDate,
      baptismDate,
      previousChurch: input.previousChurch,
      transferLetter: input.transferLetter,
      occupation: input.occupation,
      employer: input.employer,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      emergencyContactRelation: input.emergencyContactRelation,
      photoUrl: input.photoUrl,
      registeredBy: actorId,
    }),
  });

  // Create initial status history
  await prisma.chu_member_status.create({
    data: withPrismaDefaults({
      tenantId,
      memberId: member.id,
      previousStatus: null,
      newStatus: ChuMemberStatus.VISITOR,
      reason: 'Initial registration',
      changedBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'member', member.id, actorId, input.unitId, {
    firstName: member.firstName,
    lastName: member.lastName,
    isMinor: member.isMinor,
  });

  return member;
}

export async function updateMember(
  tenantId: string,
  memberId: string,
  input: UpdateMemberInput,
  actorId: string
) {
  const existing = await prisma.chu_member.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!existing) throw new Error('Member not found');

  // Parse dates for update
  const updateData: Record<string, unknown> = { ...input };
  if (input.dateOfBirth) updateData.dateOfBirth = new Date(input.dateOfBirth);
  if (input.joinDate) updateData.joinDate = new Date(input.joinDate);
  if (input.baptismDate) updateData.baptismDate = new Date(input.baptismDate);

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

  // Recalculate isMinor if dateOfBirth changed
  let isMinor = existing.isMinor;
  if (input.dateOfBirth) {
    const dob = new Date(input.dateOfBirth);
    const age = Math.floor(
      (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    isMinor = age < 18;
    updateData.isMinor = isMinor;
  }

  const member = await prisma.chu_member.update({
    where: { id: memberId },
    data: updateData,
  });

  if (Object.keys(changes).length > 0) {
    await logUpdate(tenantId, existing.churchId, 'member', memberId, actorId, changes, existing.unitId || undefined);
  }

  return member;
}

export async function changeMemberStatus(
  tenantId: string,
  memberId: string,
  input: ChangeMemberStatusInput,
  actorId: string
) {
  const existing = await prisma.chu_member.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!existing) throw new Error('Member not found');

  // Update member status
  const member = await prisma.chu_member.update({
    where: { id: memberId },
    data: { status: input.newStatus },
  });

  // Create status history (APPEND-ONLY)
  await prisma.chu_member_status.create({
    data: withPrismaDefaults({
      tenantId,
      memberId,
      previousStatus: existing.status,
      newStatus: input.newStatus,
      reason: input.reason,
      changedBy: actorId,
    }),
  });

  await logStatusChange(
    tenantId,
    existing.churchId,
    'member',
    memberId,
    actorId,
    existing.status,
    input.newStatus,
    input.reason,
    existing.unitId || undefined
  );

  return member;
}

export async function getMember(
  tenantId: string,
  memberId: string,
  includeMinorDetails: boolean = false
) {
  const member = await prisma.chu_member.findFirst({
    where: { id: memberId, tenantId },
    include: {
      church: { select: { name: true } },
      unit: { select: { name: true, level: true } },
      statusHistory: { orderBy: { changedAt: 'desc' }, take: 10 },
      cellMemberships: {
        where: { isActive: true },
        include: {
          cellGroup: { select: { name: true, area: true } },
        },
      },
      roleAssignments: {
        where: { isActive: true },
        include: {
          role: { select: { name: true, type: true } },
        },
      },
    },
  });

  if (!member) return null;

  // ⚠️ SAFEGUARDING: Restrict minor details unless explicitly requested
  if (member.isMinor && !includeMinorDetails) {
    return {
      ...member,
      phone: '[PROTECTED]',
      email: '[PROTECTED]',
      address: '[PROTECTED]',
      _safeguarding: 'MINOR_DATA_RESTRICTED',
    };
  }

  return member;
}

export async function listMembers(
  tenantId: string,
  filters: MemberQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.status) where.status = filters.status;
  if (filters.isMinor !== undefined) where.isMinor = filters.isMinor;
  if (filters.state) where.state = filters.state;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { membershipNo: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
    ];
  }

  const members = await prisma.chu_member.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: filters.limit || 50,
    skip: filters.offset || 0,
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      gender: true,
      isMinor: true,
      membershipNo: true,
      status: true,
      joinDate: true,
      phone: true,
      email: true,
      state: true,
      churchId: true,
      unitId: true,
      // ⚠️ Don't include detailed address/DOB in list view
    },
  });

  // ⚠️ SAFEGUARDING: Mask minor contact info in list view
  const safeMemberList = members.map((m: any) => {
    if (m.isMinor) {
      return {
        ...m,
        phone: '[PROTECTED]',
        email: '[PROTECTED]',
        _safeguarding: 'MINOR',
      };
    }
    return m;
  });

  const total = await prisma.chu_member.count({ where });

  return { members: safeMemberList, total };
}

export async function getMemberStatusHistory(
  tenantId: string,
  memberId: string
) {
  return prisma.chu_member_status.findMany({
    where: { tenantId, memberId },
    orderBy: { changedAt: 'desc' },
  });
}

export async function getMemberStats(
  tenantId: string,
  churchId: string,
  unitId?: string
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (unitId) where.unitId = unitId;

  const [total, byStatus, minors] = await Promise.all([
    prisma.chu_member.count({ where }),
    prisma.chu_member.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.chu_member.count({ where: { ...where, isMinor: true } }),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s._count])),
    minors,
    adults: total - minors,
  };
}

// ----------------------------------------------------------------------------
// GUARDIAN LINKS (⚠️ SAFEGUARDING)
// ----------------------------------------------------------------------------

export async function createGuardianLink(
  tenantId: string,
  input: CreateGuardianLinkInput,
  actorId: string
) {
  // Validate minor exists and is actually a minor
  const minor = await prisma.chu_member.findFirst({
    where: { id: input.minorId, tenantId, isMinor: true },
  });
  if (!minor) throw new Error('Minor not found or is not a minor');

  // Validate guardian exists and is an adult
  const guardian = await prisma.chu_member.findFirst({
    where: { id: input.guardianId, tenantId, isMinor: false },
  });
  if (!guardian) throw new Error('Guardian not found or is not an adult');

  const link = await prisma.chu_guardian_link.create({
    data: withPrismaDefaults({
      tenantId,
      minorId: input.minorId,
      guardianId: input.guardianId,
      relationship: input.relationship,
      isPrimaryGuardian: input.isPrimaryGuardian || false,
      createdBy: actorId,
    }),
  });

  await logAssignment(tenantId, minor.churchId, 'guardian_link', link.id, actorId, {
    minorId: input.minorId,
    guardianId: input.guardianId,
    relationship: input.relationship,
  }, minor.unitId || undefined);

  return link;
}

export async function verifyGuardianLink(
  tenantId: string,
  linkId: string,
  input: VerifyGuardianLinkInput,
  actorId: string
) {
  const link = await prisma.chu_guardian_link.findFirst({
    where: { id: linkId, tenantId },
    include: { minor: true },
  });

  if (!link) throw new Error('Guardian link not found');

  const updated = await prisma.chu_guardian_link.update({
    where: { id: linkId },
    data: {
      isVerified: true,
      verifiedBy: actorId,
      verifiedAt: new Date(),
      consentGiven: input.consentGiven || false,
      consentDate: input.consentGiven ? new Date() : null,
    },
  });

  await logUpdate(tenantId, link.minor.churchId, 'guardian_link', linkId, actorId, {
    isVerified: { old: false, new: true },
    consentGiven: { old: false, new: input.consentGiven || false },
  });

  return updated;
}

export async function getMinorGuardians(
  tenantId: string,
  minorId: string
) {
  return prisma.chu_guardian_link.findMany({
    where: { tenantId, minorId, isActive: true },
    include: {
      guardian: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  });
}

export async function revokeGuardianLink(
  tenantId: string,
  linkId: string,
  actorId: string
) {
  const link = await prisma.chu_guardian_link.findFirst({
    where: { id: linkId, tenantId },
    include: { minor: true },
  });

  if (!link) throw new Error('Guardian link not found');

  const updated = await prisma.chu_guardian_link.update({
    where: { id: linkId },
    data: { isActive: false },
  });

  await logTermination(tenantId, link.minor.churchId, 'guardian_link', linkId, actorId, 'Link revoked', link.minor.unitId || undefined);

  return updated;
}

// ----------------------------------------------------------------------------
// FAMILY UNITS
// ----------------------------------------------------------------------------

export async function createFamilyUnit(
  tenantId: string,
  input: CreateFamilyUnitInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const familyUnit = await prisma.chu_family_unit.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      familyName: input.familyName,
      headId: input.headId,
      address: input.address,
      city: input.city,
      state: input.state,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'family_unit', familyUnit.id, actorId, undefined, {
    familyName: familyUnit.familyName,
  });

  return familyUnit;
}

export async function addMemberToFamily(
  tenantId: string,
  familyUnitId: string,
  memberId: string,
  actorId: string
) {
  const familyUnit = await prisma.chu_family_unit.findFirst({
    where: { id: familyUnitId, tenantId },
  });
  if (!familyUnit) throw new Error('Family unit not found');

  const member = await prisma.chu_member.update({
    where: { id: memberId },
    data: { familyUnitId },
  });

  await logAssignment(tenantId, familyUnit.churchId, 'family_membership', memberId, actorId, {
    familyUnitId,
    memberId,
  });

  return member;
}

// ----------------------------------------------------------------------------
// CELL MEMBERSHIPS
// ----------------------------------------------------------------------------

export async function assignToCell(
  tenantId: string,
  input: CreateCellMembershipInput,
  actorId: string
) {
  const cellGroup = await prisma.chu_cell_group.findFirst({
    where: { id: input.cellGroupId, tenantId },
  });
  if (!cellGroup) throw new Error('Cell group not found');

  const member = await prisma.chu_member.findFirst({
    where: { id: input.memberId, tenantId },
  });
  if (!member) throw new Error('Member not found');

  // Check if already in this cell
  const existing = await prisma.chu_cell_membership.findFirst({
    where: { memberId: input.memberId, cellGroupId: input.cellGroupId, isActive: true },
  });
  if (existing) throw new Error('Member already in this cell group');

  const membership = await prisma.chu_cell_membership.create({
    data: withPrismaDefaults({
      tenantId,
      memberId: input.memberId,
      cellGroupId: input.cellGroupId,
      role: input.role || 'MEMBER',
      registeredBy: actorId,
    }),
  });

  await logAssignment(tenantId, cellGroup.churchId, 'cell_membership', membership.id, actorId, {
    memberId: input.memberId,
    cellGroupId: input.cellGroupId,
    role: input.role,
  }, cellGroup.unitId || undefined);

  return membership;
}

export async function removeFromCell(
  tenantId: string,
  membershipId: string,
  actorId: string
) {
  const membership = await prisma.chu_cell_membership.findFirst({
    where: { id: membershipId, tenantId },
    include: { cellGroup: true },
  });

  if (!membership) throw new Error('Cell membership not found');

  const updated = await prisma.chu_cell_membership.update({
    where: { id: membershipId },
    data: {
      isActive: false,
      leftDate: new Date(),
    },
  });

  await logTermination(
    tenantId,
    membership.cellGroup.churchId,
    'cell_membership',
    membershipId,
    actorId,
    'Removed from cell',
    membership.cellGroup.unitId || undefined
  );

  return updated;
}

export async function getMemberCells(
  tenantId: string,
  memberId: string
) {
  return prisma.chu_cell_membership.findMany({
    where: { tenantId, memberId, isActive: true },
    include: {
      cellGroup: {
        select: {
          id: true,
          name: true,
          area: true,
          meetingDay: true,
          meetingTime: true,
        },
      },
    },
  });
}
