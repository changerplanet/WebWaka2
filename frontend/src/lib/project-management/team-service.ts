/**
 * PROJECT MANAGEMENT SUITE — Team Service
 * Phase 7C.2, S3 Core Services
 * 
 * Manages project team members: add, remove, update roles.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  project_MemberRole,
  type project_team_member 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface AddTeamMemberInput {
  memberId: string;
  memberType?: string; // "STAFF" or "EXTERNAL"
  memberName: string;
  memberEmail?: string;
  role?: project_MemberRole;
}

export interface UpdateTeamMemberInput {
  role?: project_MemberRole;
  isActive?: boolean;
}

export interface TeamMemberFilters {
  projectId: string;
  role?: project_MemberRole;
  memberType?: string;
  isActive?: boolean;
}

// ============================================================================
// TEAM SERVICE FUNCTIONS
// ============================================================================

/**
 * Add a team member to a project
 */
export async function addTeamMember(
  tenantId: string,
  platformInstanceId: string,
  projectId: string,
  input: AddTeamMemberInput,
  addedBy?: string
): Promise<project_team_member> {
  // Check if member already exists
  const existing = await prisma.project_team_member.findUnique({
    where: {
      projectId_memberId: {
        projectId,
        memberId: input.memberId,
      },
    },
  });

  if (existing) {
    // Reactivate if previously removed
    if (!existing.isActive) {
      return prisma.project_team_member.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          leftAt: null,
          role: input.role || existing.role,
        },
      });
    }
    throw new Error('Team member already exists on this project');
  }

  return prisma.project_team_member.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      projectId,
      memberId: input.memberId,
      memberType: input.memberType || 'STAFF',
      memberName: input.memberName,
      memberEmail: input.memberEmail,
      role: input.role || project_MemberRole.MEMBER,
      isActive: true,
      addedBy,
    }),
  });
}

/**
 * Get team member by ID
 */
export async function getTeamMemberById(
  tenantId: string,
  teamMemberId: string
): Promise<project_team_member | null> {
  return prisma.project_team_member.findFirst({
    where: { id: teamMemberId, tenantId },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
    },
  });
}

/**
 * List team members for a project
 */
export async function listTeamMembers(
  tenantId: string,
  filters: TeamMemberFilters
): Promise<project_team_member[]> {
  const where: any = { tenantId, projectId: filters.projectId };

  if (filters.role) where.role = filters.role;
  if (filters.memberType) where.memberType = filters.memberType;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.project_team_member.findMany({
    where,
    orderBy: [
      { role: 'asc' }, // OWNER first, then MANAGER, etc.
      { memberName: 'asc' },
    ],
  });
}

/**
 * Update a team member's role
 */
export async function updateTeamMember(
  tenantId: string,
  teamMemberId: string,
  input: UpdateTeamMemberInput
): Promise<project_team_member> {
  return prisma.project_team_member.update({
    where: { id: teamMemberId },
    data: {
      ...input,
      leftAt: input.isActive === false ? new Date() : undefined,
    },
  });
}

/**
 * Remove a team member from project (soft delete)
 */
export async function removeTeamMember(
  tenantId: string,
  teamMemberId: string
): Promise<project_team_member> {
  return prisma.project_team_member.update({
    where: { id: teamMemberId },
    data: {
      isActive: false,
      leftAt: new Date(),
    },
  });
}

/**
 * Permanently delete a team member record
 */
export async function deleteTeamMember(
  tenantId: string,
  teamMemberId: string
): Promise<void> {
  await prisma.project_team_member.delete({
    where: { id: teamMemberId },
  });
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Transfer ownership to another team member
 */
export async function transferOwnership(
  tenantId: string,
  projectId: string,
  newOwnerId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Demote current owner(s) to manager
    await tx.project_team_member.updateMany({
      where: { projectId, tenantId, role: project_MemberRole.OWNER },
      data: { role: project_MemberRole.MANAGER },
    });

    // Promote new owner
    await tx.project_team_member.updateMany({
      where: { projectId, tenantId, memberId: newOwnerId },
      data: { role: project_MemberRole.OWNER },
    });

    // Update project owner reference
    const newOwner = await tx.project_team_member.findFirst({
      where: { projectId, memberId: newOwnerId },
    });

    if (newOwner) {
      await tx.project_project.update({
        where: { id: projectId },
        data: {
          ownerId: newOwner.memberId,
          ownerName: newOwner.memberName,
        },
      });
    }
  });
}

/**
 * Set project manager
 */
export async function setProjectManager(
  tenantId: string,
  projectId: string,
  managerId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Remove manager role from others (but keep owner)
    await tx.project_team_member.updateMany({
      where: { 
        projectId, 
        tenantId, 
        role: project_MemberRole.MANAGER,
      },
      data: { role: project_MemberRole.LEAD },
    });

    // Set new manager
    await tx.project_team_member.updateMany({
      where: { projectId, tenantId, memberId: managerId },
      data: { role: project_MemberRole.MANAGER },
    });

    // Update project manager reference
    const manager = await tx.project_team_member.findFirst({
      where: { projectId, memberId: managerId },
    });

    if (manager) {
      await tx.project_project.update({
        where: { id: projectId },
        data: {
          managerId: manager.memberId,
          managerName: manager.memberName,
        },
      });
    }
  });
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all projects for a team member
 */
export async function getMemberProjects(
  tenantId: string,
  memberId: string,
  activeOnly: boolean = true
): Promise<project_team_member[]> {
  const where: any = { tenantId, memberId };
  if (activeOnly) where.isActive = true;

  return prisma.project_team_member.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectCode: true,
          status: true,
          priority: true,
          health: true,
          progressPercent: true,
        },
      },
    },
  });
}

/**
 * Check if a member is on a project
 */
export async function isMemberOnProject(
  tenantId: string,
  projectId: string,
  memberId: string
): Promise<boolean> {
  const member = await prisma.project_team_member.findFirst({
    where: { tenantId, projectId, memberId, isActive: true },
  });
  return !!member;
}

/**
 * Get member's role on a project
 */
export async function getMemberRole(
  tenantId: string,
  projectId: string,
  memberId: string
): Promise<project_MemberRole | null> {
  const member = await prisma.project_team_member.findFirst({
    where: { tenantId, projectId, memberId, isActive: true },
  });
  return member?.role || null;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get team statistics for a project
 */
export async function getTeamStats(
  tenantId: string,
  projectId: string
): Promise<{
  total: number;
  active: number;
  byRole: Record<string, number>;
  byType: Record<string, number>;
}> {
  const members = await prisma.project_team_member.findMany({
    where: { tenantId, projectId },
    select: { role: true, memberType: true, isActive: true },
  });

  const byRole: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const m of members.filter((m: any) => m.isActive)) {
    byRole[m.role] = (byRole[m.role] || 0) + 1;
    byType[m.memberType] = (byType[m.memberType] || 0) + 1;
  }

  return {
    total: members.length,
    active: members.filter((m: any) => m.isActive).length,
    byRole,
    byType,
  };
}

/**
 * Get workload for team members (task counts)
 */
export async function getTeamWorkload(
  tenantId: string,
  projectId: string
): Promise<Array<{
  memberId: string;
  memberName: string;
  taskCount: number;
  completedCount: number;
  overdueCount: number;
}>> {
  const members = await listTeamMembers(tenantId, { projectId, isActive: true });
  const now = new Date();

  const workload = await Promise.all(
    members.map(async (member) => {
      const tasks = await prisma.project_task.findMany({
        where: { tenantId, projectId, assigneeId: member.memberId },
        select: { status: true, dueDate: true },
      });

      return {
        memberId: member.memberId,
        memberName: member.memberName,
        taskCount: tasks.length,
        completedCount: tasks.filter((t: any) => t.status === 'DONE').length,
        overdueCount: tasks.filter((t: any) => 
          t.status !== 'DONE' && t.dueDate && t.dueDate < now
        ).length,
      };
    })
  );

  return workload;
}
