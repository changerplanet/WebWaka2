/**
 * Church Suite — Leadership Assignment Service
 * Phase 1: Registry & Membership
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 * 
 * Role assignments are TIME-BOUND and APPEND-ONLY for history
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateRoleInput,
  UpdateRoleInput,
  CreateRoleAssignmentInput,
  TerminateRoleAssignmentInput,
  ChuRoleType,
} from './types';
import { logCreate, logUpdate, logAssignment, logTermination } from './audit-service';

// ----------------------------------------------------------------------------
// ROLE DEFINITIONS
// ----------------------------------------------------------------------------

export async function createRole(
  tenantId: string,
  input: CreateRoleInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const role = await prisma.chu_role.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      name: input.name,
      type: input.type,
      description: input.description,
      canAssignAtUnit: input.canAssignAtUnit ?? true,
      permissions: input.permissions ? JSON.stringify(input.permissions) : null,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'role', role.id, actorId, undefined, {
    name: role.name,
    type: role.type,
  });

  return role;
}

export async function updateRole(
  tenantId: string,
  roleId: string,
  input: UpdateRoleInput,
  actorId: string
) {
  const existing = await prisma.chu_role.findFirst({
    where: { id: roleId, tenantId },
  });

  if (!existing) throw new Error('Role not found');

  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      const existingValue = key === 'permissions'
        ? existing.permissions
        : (existing as Record<string, unknown>)[key];
      const newValue = key === 'permissions' && Array.isArray(value)
        ? JSON.stringify(value)
        : value;
      if (existingValue !== newValue) {
        changes[key] = { old: existingValue, new: newValue };
      }
    }
  }

  const role = await prisma.chu_role.update({
    where: { id: roleId },
    data: {
      ...input,
      permissions: input.permissions ? JSON.stringify(input.permissions) : undefined,
    },
  });

  if (Object.keys(changes).length > 0) {
    await logUpdate(tenantId, existing.churchId, 'role', roleId, actorId, changes);
  }

  return role;
}

export async function getRole(
  tenantId: string,
  roleId: string
) {
  const role = await prisma.chu_role.findFirst({
    where: { id: roleId, tenantId },
    include: {
      church: { select: { name: true } },
      _count: {
        select: { assignments: { where: { isActive: true } } },
      },
    },
  });

  if (role && role.permissions) {
    return {
      ...role,
      permissions: JSON.parse(role.permissions),
    };
  }

  return role;
}

export async function listRoles(
  tenantId: string,
  churchId: string,
  includeInactive: boolean = false
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (!includeInactive) where.isActive = true;

  const roles = await prisma.chu_role.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { assignments: { where: { isActive: true } } },
      },
    },
  });

  return roles.map((r: any) => ({
    ...r,
    permissions: r.permissions ? JSON.parse(r.permissions) : null,
  }));
}

// Default roles for Nigerian churches
export async function seedDefaultRoles(
  tenantId: string,
  churchId: string,
  actorId: string
) {
  const defaultRoles: Array<{ name: string; type: ChuRoleType; description: string }> = [
    { name: 'Senior Pastor', type: ChuRoleType.SENIOR_PASTOR, description: 'Head of the church' },
    { name: 'Associate Pastor', type: ChuRoleType.ASSOCIATE_PASTOR, description: 'Assistant to Senior Pastor' },
    { name: 'Pastor', type: ChuRoleType.PASTOR, description: 'Ordained minister' },
    { name: 'Elder', type: ChuRoleType.ELDER, description: 'Church elder' },
    { name: 'Deacon', type: ChuRoleType.DEACON, description: 'Church deacon' },
    { name: 'Deaconess', type: ChuRoleType.DEACONESS, description: 'Church deaconess' },
    { name: 'Trustee', type: ChuRoleType.TRUSTEE, description: 'Church trustee' },
    { name: 'Church Administrator', type: ChuRoleType.CHURCH_ADMIN, description: 'Administrative head' },
    { name: 'Treasurer', type: ChuRoleType.TREASURER, description: 'Financial oversight' },
    { name: 'Secretary', type: ChuRoleType.SECRETARY, description: 'Church secretary' },
    { name: 'Department Head', type: ChuRoleType.DEPARTMENT_HEAD, description: 'Head of department/ministry' },
    { name: 'Cell Leader', type: ChuRoleType.CELL_LEADER, description: 'Fellowship cell leader' },
    { name: 'Worker', type: ChuRoleType.WORKER, description: 'Active church worker' },
    { name: 'Member', type: ChuRoleType.MEMBER, description: 'Church member' },
  ];

  const created = [];
  for (const role of defaultRoles) {
    const existing = await prisma.chu_role.findFirst({
      where: { tenantId, churchId, name: role.name },
    });

    if (!existing) {
      const newRole = await createRole(tenantId, {
        churchId,
        name: role.name,
        type: role.type,
        description: role.description,
      }, actorId);
      created.push(newRole);
    }
  }

  return created;
}

// ----------------------------------------------------------------------------
// ROLE ASSIGNMENTS (APPEND-ONLY HISTORY)
// ----------------------------------------------------------------------------

export async function assignRole(
  tenantId: string,
  input: CreateRoleAssignmentInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const member = await prisma.chu_member.findFirst({
    where: { id: input.memberId, tenantId },
  });
  if (!member) throw new Error('Member not found');

  const role = await prisma.chu_role.findFirst({
    where: { id: input.roleId, tenantId },
  });
  if (!role) throw new Error('Role not found');

  // If unit-scoped assignment, validate unit
  if (input.unitId) {
    const unit = await prisma.chu_church_unit.findFirst({
      where: { id: input.unitId, tenantId },
    });
    if (!unit) throw new Error('Unit not found');
    if (!role.canAssignAtUnit) throw new Error('This role cannot be assigned at unit level');
  }

  // Check for existing active assignment of same role
  const existing = await prisma.chu_role_assignment.findFirst({
    where: {
      tenantId,
      memberId: input.memberId,
      roleId: input.roleId,
      unitId: input.unitId || null,
      isActive: true,
    },
  });

  if (existing) {
    throw new Error('Member already has this role assignment');
  }

  const assignment = await prisma.chu_role_assignment.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      memberId: input.memberId,
      roleId: input.roleId,
      unitId: input.unitId,
      effectiveDate: input.effectiveDate || new Date(),
      endDate: input.endDate,
      assignedBy: actorId,
    }),
  });

  await logAssignment(tenantId, input.churchId, 'role_assignment', assignment.id, actorId, {
    memberId: input.memberId,
    roleId: input.roleId,
    roleName: role.name,
    unitId: input.unitId,
  }, input.unitId);

  return assignment;
}

export async function terminateRoleAssignment(
  tenantId: string,
  assignmentId: string,
  input: TerminateRoleAssignmentInput,
  actorId: string
) {
  const assignment = await prisma.chu_role_assignment.findFirst({
    where: { id: assignmentId, tenantId },
    include: { role: true },
  });

  if (!assignment) throw new Error('Role assignment not found');
  if (!assignment.isActive) throw new Error('Role assignment is already terminated');

  const updated = await prisma.chu_role_assignment.update({
    where: { id: assignmentId },
    data: {
      isActive: false,
      endDate: new Date(),
      terminatedBy: actorId,
      terminationReason: input.terminationReason,
    },
  });

  await logTermination(
    tenantId,
    assignment.churchId,
    'role_assignment',
    assignmentId,
    actorId,
    input.terminationReason || `Terminated: ${assignment.role.name}`,
    assignment.unitId || undefined
  );

  return updated;
}

export async function getMemberRoles(
  tenantId: string,
  memberId: string,
  includeInactive: boolean = false
) {
  const where: Record<string, unknown> = { tenantId, memberId };
  if (!includeInactive) where.isActive = true;

  return prisma.chu_role_assignment.findMany({
    where,
    orderBy: { assignedDate: 'desc' },
    include: {
      role: { select: { name: true, type: true } },
      unit: { select: { name: true, level: true } },
    },
  });
}

export async function getRoleHolders(
  tenantId: string,
  roleId: string,
  unitId?: string
) {
  const where: Record<string, unknown> = {
    tenantId,
    roleId,
    isActive: true,
  };
  if (unitId) where.unitId = unitId;

  return prisma.chu_role_assignment.findMany({
    where,
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          photoUrl: true,
        },
      },
      unit: { select: { name: true, level: true } },
    },
  });
}

export async function getLeadershipHistory(
  tenantId: string,
  churchId: string,
  unitId?: string,
  limit: number = 50
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (unitId) where.unitId = unitId;

  return prisma.chu_role_assignment.findMany({
    where,
    orderBy: { assignedDate: 'desc' },
    take: limit,
    include: {
      member: {
        select: { firstName: true, lastName: true },
      },
      role: { select: { name: true, type: true } },
      unit: { select: { name: true } },
    },
  });
}
