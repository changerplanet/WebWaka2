/**
 * PROJECT MANAGEMENT SUITE — Project Service
 * Phase 7C.2, S3 Core Services
 * 
 * Manages projects: create, update, status transitions, progress tracking.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  project_Status, 
  project_Priority,
  project_Health,
  type project_project 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProjectInput {
  name: string;
  description?: string;
  category?: string; // "Construction", "NGO Program", "Client Project", "Internal"
  clientId?: string;
  clientName?: string;
  ownerId?: string;
  ownerName?: string;
  managerId?: string;
  managerName?: string;
  priority?: project_Priority;
  startDate?: Date;
  targetEndDate?: Date;
  budgetEstimated?: number;
  budgetCurrency?: string;
  visibility?: string;
  tags?: string[];
  color?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: project_Status;
  health?: project_Health;
  progressPercent?: number;
  actualEndDate?: Date;
}

export interface ProjectFilters {
  status?: project_Status;
  priority?: project_Priority;
  health?: project_Health;
  category?: string;
  clientId?: string;
  ownerId?: string;
  managerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// PROJECT SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate project code
 */
async function generateProjectCode(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.project_project.count({
    where: { tenantId, projectCode: { startsWith: `PRJ-${year}-` } }
  });
  return `PRJ-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Create a new project
 */
export async function createProject(
  tenantId: string,
  platformInstanceId: string,
  input: CreateProjectInput,
  createdBy?: string
): Promise<project_project> {
  const projectCode = await generateProjectCode(tenantId);

  return prisma.project_project.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      projectCode,
      name: input.name,
      description: input.description,
      category: input.category,
      clientId: input.clientId,
      clientName: input.clientName,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      managerId: input.managerId,
      managerName: input.managerName,
      status: project_Status.DRAFT,
      priority: input.priority || project_Priority.MEDIUM,
      health: project_Health.ON_TRACK,
      startDate: input.startDate ? new Date(input.startDate) : null,
      targetEndDate: input.targetEndDate ? new Date(input.targetEndDate) : null,
      budgetEstimated: input.budgetEstimated,
      budgetCurrency: input.budgetCurrency || 'NGN',
      visibility: input.visibility || 'TEAM',
      tags: input.tags || [],
      color: input.color,
      progressPercent: 0,
      createdBy,
    }),
    include: {
      milestones: true,
      tasks: true,
      teamMembers: true,
    },
  });
}

/**
 * Get project by ID
 */
export async function getProjectById(
  tenantId: string,
  projectId: string
): Promise<project_project | null> {
  return prisma.project_project.findFirst({
    where: { id: projectId, tenantId },
    include: {
      milestones: { orderBy: { orderIndex: 'asc' } },
      tasks: { orderBy: { orderIndex: 'asc' } },
      teamMembers: { where: { isActive: true } },
      budgetItems: true,
    },
  });
}

/**
 * List projects with filters
 */
export async function listProjects(
  tenantId: string,
  filters: ProjectFilters = {}
): Promise<{ projects: project_project[]; total: number }> {
  const { page = 1, limit = 20, search, ...whereFilters } = filters;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };

  if (whereFilters.status) where.status = whereFilters.status;
  if (whereFilters.priority) where.priority = whereFilters.priority;
  if (whereFilters.health) where.health = whereFilters.health;
  if (whereFilters.category) where.category = whereFilters.category;
  if (whereFilters.clientId) where.clientId = whereFilters.clientId;
  if (whereFilters.ownerId) where.ownerId = whereFilters.ownerId;
  if (whereFilters.managerId) where.managerId = whereFilters.managerId;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { projectCode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { clientName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project_project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { milestones: true, tasks: true, teamMembers: true } },
      },
    }),
    prisma.project_project.count({ where }),
  ]);

  return { projects, total };
}

/**
 * Update a project
 */
export async function updateProject(
  tenantId: string,
  projectId: string,
  input: UpdateProjectInput,
  updatedBy?: string
): Promise<project_project> {
  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      ...input,
      updatedBy,
    },
    include: {
      milestones: { orderBy: { orderIndex: 'asc' } },
      tasks: { orderBy: { orderIndex: 'asc' } },
      teamMembers: { where: { isActive: true } },
    },
  });
}

/**
 * Delete a project (soft delete by setting status to CANCELLED, or hard delete)
 */
export async function deleteProject(
  tenantId: string,
  projectId: string,
  hard: boolean = false
): Promise<void> {
  if (hard) {
    await prisma.project_project.delete({
      where: { id: projectId },
    });
  } else {
    await prisma.project_project.update({
      where: { id: projectId },
      data: { status: project_Status.CANCELLED },
    });
  }
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Start a project (DRAFT → ACTIVE)
 */
export async function startProject(
  tenantId: string,
  projectId: string,
  updatedBy?: string
): Promise<project_project> {
  const project = await getProjectById(tenantId, projectId);
  if (!project) throw new Error('Project not found');
  if (project.status !== project_Status.DRAFT) {
    throw new Error('Only draft projects can be started');
  }

  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      status: project_Status.ACTIVE,
      startDate: project.startDate || new Date(),
      updatedBy,
    },
  });
}

/**
 * Put project on hold (ACTIVE → ON_HOLD)
 */
export async function holdProject(
  tenantId: string,
  projectId: string,
  updatedBy?: string
): Promise<project_project> {
  const project = await getProjectById(tenantId, projectId);
  if (!project) throw new Error('Project not found');
  if (project.status !== project_Status.ACTIVE) {
    throw new Error('Only active projects can be put on hold');
  }

  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      status: project_Status.ON_HOLD,
      updatedBy,
    },
  });
}

/**
 * Resume project (ON_HOLD → ACTIVE)
 */
export async function resumeProject(
  tenantId: string,
  projectId: string,
  updatedBy?: string
): Promise<project_project> {
  const project = await getProjectById(tenantId, projectId);
  if (!project) throw new Error('Project not found');
  if (project.status !== project_Status.ON_HOLD) {
    throw new Error('Only on-hold projects can be resumed');
  }

  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      status: project_Status.ACTIVE,
      updatedBy,
    },
  });
}

/**
 * Complete a project
 */
export async function completeProject(
  tenantId: string,
  projectId: string,
  updatedBy?: string
): Promise<project_project> {
  const project = await getProjectById(tenantId, projectId);
  if (!project) throw new Error('Project not found');
  if (project.status !== project_Status.ACTIVE) {
    throw new Error('Only active projects can be completed');
  }

  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      status: project_Status.COMPLETED,
      actualEndDate: new Date(),
      progressPercent: 100,
      updatedBy,
    },
  });
}

/**
 * Cancel a project
 */
export async function cancelProject(
  tenantId: string,
  projectId: string,
  updatedBy?: string
): Promise<project_project> {
  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      status: project_Status.CANCELLED,
      updatedBy,
    },
  });
}

/**
 * Archive a project
 */
export async function archiveProject(
  tenantId: string,
  projectId: string,
  updatedBy?: string
): Promise<project_project> {
  const project = await getProjectById(tenantId, projectId);
  if (!project) throw new Error('Project not found');
  if (project.status !== project_Status.COMPLETED && project.status !== project_Status.CANCELLED) {
    throw new Error('Only completed or cancelled projects can be archived');
  }

  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      status: project_Status.ARCHIVED,
      updatedBy,
    },
  });
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Recalculate project progress based on tasks
 */
export async function recalculateProjectProgress(
  tenantId: string,
  projectId: string
): Promise<project_project> {
  const tasks = await prisma.project_task.findMany({
    where: { projectId, tenantId },
  });

  if (tasks.length === 0) {
    return prisma.project_project.update({
      where: { id: projectId },
      data: { progressPercent: 0 },
    });
  }

  const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
  const progressPercent = Math.round((completedTasks / tasks.length) * 100);

  // Determine health based on dates and progress
  const project = await getProjectById(tenantId, projectId);
  let health: project_Health = project_Health.ON_TRACK;

  if (project?.targetEndDate) {
    const daysToDeadline = Math.ceil(
      (project.targetEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = Math.min(100, Math.max(0, 100 - (daysToDeadline / 30) * 100));
    
    if (progressPercent < expectedProgress - 20) {
      health = project_Health.DELAYED;
    } else if (progressPercent < expectedProgress - 10) {
      health = project_Health.AT_RISK;
    }
  }

  return prisma.project_project.update({
    where: { id: projectId },
    data: { progressPercent, health },
  });
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get project statistics for dashboard
 */
export async function getProjectStats(
  tenantId: string,
  platformInstanceId?: string
): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byHealth: Record<string, number>;
  overdue: number;
  dueThisWeek: number;
}> {
  const where: any = { tenantId };
  if (platformInstanceId) where.platformInstanceId = platformInstanceId;

  const projects = await prisma.project_project.findMany({
    where,
    select: { status: true, priority: true, health: true, targetEndDate: true },
  });

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byHealth: Record<string, number> = {};
  let overdue = 0;
  let dueThisWeek = 0;

  for (const p of projects) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    byHealth[p.health] = (byHealth[p.health] || 0) + 1;

    if (p.targetEndDate) {
      if (p.targetEndDate < now && p.status === 'ACTIVE') overdue++;
      if (p.targetEndDate >= now && p.targetEndDate <= oneWeekFromNow) dueThisWeek++;
    }
  }

  return {
    total: projects.length,
    byStatus,
    byPriority,
    byHealth,
    overdue,
    dueThisWeek,
  };
}
