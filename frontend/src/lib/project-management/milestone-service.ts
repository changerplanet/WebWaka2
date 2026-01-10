/**
 * PROJECT MANAGEMENT SUITE — Milestone Service
 * Phase 7C.2, S3 Core Services
 * 
 * Manages project milestones: create, update, complete, dependencies.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { type project_milestone } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateMilestoneInput {
  name: string;
  description?: string;
  deliverables?: string;
  targetDate?: Date;
  orderIndex?: number;
  dependsOnId?: string;
}

export interface UpdateMilestoneInput extends Partial<CreateMilestoneInput> {
  isCompleted?: boolean;
}

export interface MilestoneFilters {
  projectId: string;
  isCompleted?: boolean;
  search?: string;
}

// ============================================================================
// MILESTONE SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new milestone
 */
export async function createMilestone(
  tenantId: string,
  platformInstanceId: string,
  projectId: string,
  input: CreateMilestoneInput,
  createdBy?: string
): Promise<project_milestone> {
  // Get next order index if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const lastMilestone = await prisma.project_milestone.findFirst({
      where: { projectId, tenantId },
      orderBy: { orderIndex: 'desc' },
    });
    orderIndex = (lastMilestone?.orderIndex || 0) + 1;
  }

  return prisma.project_milestone.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      projectId,
      name: input.name,
      description: input.description,
      deliverables: input.deliverables,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      orderIndex,
      dependsOnId: input.dependsOnId,
      isCompleted: false,
      progressPercent: 0,
      createdBy,
    }),
    include: {
      tasks: true,
      dependsOn: true,
    },
  });
}

/**
 * Get milestone by ID
 */
export async function getMilestoneById(
  tenantId: string,
  milestoneId: string
): Promise<project_milestone | null> {
  return prisma.project_milestone.findFirst({
    where: { id: milestoneId, tenantId },
    include: {
      tasks: { orderBy: { orderIndex: 'asc' } },
      dependsOn: true,
      dependentMilestones: true,
    },
  });
}

/**
 * List milestones for a project
 */
export async function listMilestones(
  tenantId: string,
  filters: MilestoneFilters
): Promise<project_milestone[]> {
  const where: any = { tenantId, projectId: filters.projectId };

  if (filters.isCompleted !== undefined) {
    where.isCompleted = filters.isCompleted;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.project_milestone.findMany({
    where,
    orderBy: { orderIndex: 'asc' },
    include: {
      tasks: { select: { id: true, status: true } },
      dependsOn: { select: { id: true, name: true, isCompleted: true } },
    },
  });
}

/**
 * Update a milestone
 */
export async function updateMilestone(
  tenantId: string,
  milestoneId: string,
  input: UpdateMilestoneInput
): Promise<project_milestone> {
  return prisma.project_milestone.update({
    where: { id: milestoneId },
    data: input,
    include: {
      tasks: true,
      dependsOn: true,
    },
  });
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(
  tenantId: string,
  milestoneId: string
): Promise<void> {
  // First, unlink any tasks from this milestone
  await prisma.project_task.updateMany({
    where: { milestoneId, tenantId },
    data: { milestoneId: null },
  });

  // Then delete the milestone
  await prisma.project_milestone.delete({
    where: { id: milestoneId },
  });
}

// ============================================================================
// COMPLETION & PROGRESS
// ============================================================================

/**
 * Mark milestone as complete
 */
export async function completeMilestone(
  tenantId: string,
  milestoneId: string,
  completedBy?: string
): Promise<project_milestone> {
  const milestone = await getMilestoneById(tenantId, milestoneId);
  if (!milestone) throw new Error('Milestone not found');

  // Check if dependency is completed
  if (milestone.dependsOnId) {
    const dependency = await getMilestoneById(tenantId, milestone.dependsOnId);
    if (dependency && !dependency.isCompleted) {
      throw new Error('Cannot complete milestone: dependent milestone is not complete');
    }
  }

  return prisma.project_milestone.update({
    where: { id: milestoneId },
    data: {
      isCompleted: true,
      completedDate: new Date(),
      completedBy,
      progressPercent: 100,
    },
  });
}

/**
 * Reopen a completed milestone
 */
export async function reopenMilestone(
  tenantId: string,
  milestoneId: string
): Promise<project_milestone> {
  const milestone = await prisma.project_milestone.findFirst({
    where: { id: milestoneId, tenantId },
    include: {
      dependentMilestones: { select: { id: true, isCompleted: true } },
    },
  });
  if (!milestone) throw new Error('Milestone not found');

  // Check if any dependent milestones are completed (can't reopen if dependents are done)
  if (milestone.dependentMilestones && milestone.dependentMilestones.length > 0) {
    const completedDependents = milestone.dependentMilestones.filter((m) => m.isCompleted);
    if (completedDependents.length > 0) {
      throw new Error('Cannot reopen milestone: other milestones depend on it');
    }
  }

  return prisma.project_milestone.update({
    where: { id: milestoneId },
    data: {
      isCompleted: false,
      completedDate: null,
      completedBy: null,
    },
  });
}

/**
 * Recalculate milestone progress based on tasks
 */
export async function recalculateMilestoneProgress(
  tenantId: string,
  milestoneId: string
): Promise<project_milestone> {
  const tasks = await prisma.project_task.findMany({
    where: { milestoneId, tenantId },
  });

  if (tasks.length === 0) {
    return prisma.project_milestone.update({
      where: { id: milestoneId },
      data: { progressPercent: 0 },
    });
  }

  const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
  const progressPercent = Math.round((completedTasks / tasks.length) * 100);

  return prisma.project_milestone.update({
    where: { id: milestoneId },
    data: { progressPercent },
  });
}

// ============================================================================
// REORDERING
// ============================================================================

/**
 * Reorder milestones
 */
export async function reorderMilestones(
  tenantId: string,
  projectId: string,
  milestoneIds: string[]
): Promise<void> {
  const updates = milestoneIds.map((id, index) =>
    prisma.project_milestone.update({
      where: { id },
      data: { orderIndex: index },
    })
  );

  await prisma.$transaction(updates);
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get milestone statistics for a project
 */
export async function getMilestoneStats(
  tenantId: string,
  projectId: string
): Promise<{
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}> {
  const milestones = await prisma.project_milestone.findMany({
    where: { tenantId, projectId },
    select: { isCompleted: true, targetDate: true },
  });

  const now = new Date();
  let overdue = 0;

  for (const m of milestones) {
    if (!m.isCompleted && m.targetDate && m.targetDate < now) {
      overdue++;
    }
  }

  return {
    total: milestones.length,
    completed: milestones.filter((m: any) => m.isCompleted).length,
    pending: milestones.filter((m: any) => !m.isCompleted).length,
    overdue,
  };
}
