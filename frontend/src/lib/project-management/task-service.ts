/**
 * PROJECT MANAGEMENT SUITE — Task Service
 * Phase 7C.2, S3 Core Services
 * 
 * Manages project tasks: create, update, assign, complete, dependencies.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  project_TaskStatus, 
  project_TaskPriority,
  type project_task 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  milestoneId?: string;
  assigneeId?: string;
  assigneeName?: string;
  priority?: project_TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  blockedById?: string;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  orderIndex?: number;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: project_TaskStatus;
  actualHours?: number;
  checklistProgress?: number;
}

export interface TaskFilters {
  projectId?: string;
  milestoneId?: string;
  assigneeId?: string;
  status?: project_TaskStatus;
  priority?: project_TaskPriority;
  overdue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// TASK SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new task
 */
export async function createTask(
  tenantId: string,
  platformInstanceId: string,
  projectId: string,
  input: CreateTaskInput,
  createdBy?: string
): Promise<project_task> {
  // Get next order index if not provided
  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const lastTask = await prisma.project_task.findFirst({
      where: { projectId, tenantId, milestoneId: input.milestoneId || null },
      orderBy: { orderIndex: 'desc' },
    });
    orderIndex = (lastTask?.orderIndex || 0) + 1;
  }

  return prisma.project_task.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      projectId,
      milestoneId: input.milestoneId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
      status: project_TaskStatus.TODO,
      priority: input.priority || project_TaskPriority.MEDIUM,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      estimatedHours: input.estimatedHours,
      blockedById: input.blockedById,
      checklist: input.checklist || [],
      checklistProgress: 0,
      orderIndex,
      tags: input.tags || [],
      createdBy,
    }),
    include: {
      milestone: { select: { id: true, name: true } },
      blockedBy: { select: { id: true, title: true, status: true } },
    },
  });
}

/**
 * Get task by ID
 */
export async function getTaskById(
  tenantId: string,
  taskId: string
): Promise<project_task | null> {
  return prisma.project_task.findFirst({
    where: { id: taskId, tenantId },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      milestone: { select: { id: true, name: true } },
      blockedBy: { select: { id: true, title: true, status: true } },
      blockingTasks: { select: { id: true, title: true, status: true } },
    },
  });
}

/**
 * List tasks with filters
 */
export async function listTasks(
  tenantId: string,
  filters: TaskFilters = {}
): Promise<{ tasks: project_task[]; total: number }> {
  const { page = 1, limit = 50, search, overdue, ...whereFilters } = filters;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };

  if (whereFilters.projectId) where.projectId = whereFilters.projectId;
  if (whereFilters.milestoneId) where.milestoneId = whereFilters.milestoneId;
  if (whereFilters.assigneeId) where.assigneeId = whereFilters.assigneeId;
  if (whereFilters.status) where.status = whereFilters.status;
  if (whereFilters.priority) where.priority = whereFilters.priority;

  if (overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: ['DONE'] };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { assigneeName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.project_task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { orderIndex: 'asc' }],
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        milestone: { select: { id: true, name: true } },
        blockedBy: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.project_task.count({ where }),
  ]);

  return { tasks, total };
}

/**
 * Update a task
 */
export async function updateTask(
  tenantId: string,
  taskId: string,
  input: UpdateTaskInput,
  updatedBy?: string
): Promise<project_task> {
  // Calculate checklist progress if checklist is updated
  let checklistProgress = input.checklistProgress;
  if (input.checklist && checklistProgress === undefined) {
    const completed = input.checklist.filter((item: any) => item.completed).length;
    checklistProgress = input.checklist.length > 0 
      ? Math.round((completed / input.checklist.length) * 100) 
      : 0;
  }

  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      ...input,
      checklistProgress,
      updatedBy,
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      milestone: { select: { id: true, name: true } },
      blockedBy: { select: { id: true, title: true, status: true } },
    },
  });
}

/**
 * Delete a task
 */
export async function deleteTask(
  tenantId: string,
  taskId: string
): Promise<void> {
  // First, unblock any tasks that were blocked by this one
  await prisma.project_task.updateMany({
    where: { blockedById: taskId, tenantId },
    data: { blockedById: null },
  });

  // Then delete the task
  await prisma.project_task.delete({
    where: { id: taskId },
  });
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Start a task (TODO → IN_PROGRESS)
 */
export async function startTask(
  tenantId: string,
  taskId: string,
  updatedBy?: string
): Promise<project_task> {
  const task = await prisma.project_task.findFirst({
    where: { id: taskId, tenantId },
    include: {
      blockedBy: { select: { id: true, status: true } },
    },
  });
  if (!task) throw new Error('Task not found');

  // Check if blocked
  if (task.blockedById && task.blockedBy) {
    if (task.blockedBy.status !== 'DONE') {
      throw new Error('Cannot start task: blocked by another task');
    }
  }

  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      status: project_TaskStatus.IN_PROGRESS,
      startedAt: new Date(),
      updatedBy,
    },
  });
}

/**
 * Submit task for review (IN_PROGRESS → REVIEW)
 */
export async function submitTaskForReview(
  tenantId: string,
  taskId: string,
  updatedBy?: string
): Promise<project_task> {
  const task = await getTaskById(tenantId, taskId);
  if (!task) throw new Error('Task not found');
  if (task.status !== project_TaskStatus.IN_PROGRESS) {
    throw new Error('Only in-progress tasks can be submitted for review');
  }

  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      status: project_TaskStatus.REVIEW,
      updatedBy,
    },
  });
}

/**
 * Complete a task (→ DONE)
 */
export async function completeTask(
  tenantId: string,
  taskId: string,
  actualHours?: number,
  updatedBy?: string
): Promise<project_task> {
  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      status: project_TaskStatus.DONE,
      completedAt: new Date(),
      actualHours: actualHours,
      checklistProgress: 100,
      updatedBy,
    },
  });
}

/**
 * Reopen a task (DONE → TODO)
 */
export async function reopenTask(
  tenantId: string,
  taskId: string,
  updatedBy?: string
): Promise<project_task> {
  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      status: project_TaskStatus.TODO,
      completedAt: null,
      updatedBy,
    },
  });
}

/**
 * Block a task
 */
export async function blockTask(
  tenantId: string,
  taskId: string,
  reason?: string,
  updatedBy?: string
): Promise<project_task> {
  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      status: project_TaskStatus.BLOCKED,
      updatedBy,
    },
  });
}

// ============================================================================
// ASSIGNMENT
// ============================================================================

/**
 * Assign task to a staff member
 */
export async function assignTask(
  tenantId: string,
  taskId: string,
  assigneeId: string,
  assigneeName: string,
  updatedBy?: string
): Promise<project_task> {
  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      assigneeId,
      assigneeName,
      updatedBy,
    },
  });
}

/**
 * Unassign task
 */
export async function unassignTask(
  tenantId: string,
  taskId: string,
  updatedBy?: string
): Promise<project_task> {
  return prisma.project_task.update({
    where: { id: taskId },
    data: {
      assigneeId: null,
      assigneeName: null,
      updatedBy,
    },
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk update task status
 */
export async function bulkUpdateTaskStatus(
  tenantId: string,
  taskIds: string[],
  status: project_TaskStatus,
  updatedBy?: string
): Promise<number> {
  const result = await prisma.project_task.updateMany({
    where: { id: { in: taskIds }, tenantId },
    data: { 
      status,
      updatedBy,
      completedAt: status === 'DONE' ? new Date() : undefined,
    },
  });
  return result.count;
}

/**
 * Reorder tasks
 */
export async function reorderTasks(
  tenantId: string,
  taskIds: string[]
): Promise<void> {
  const updates = taskIds.map((id, index) =>
    prisma.project_task.update({
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
 * Get task statistics
 */
export async function getTaskStats(
  tenantId: string,
  projectId?: string
): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  dueToday: number;
  unassigned: number;
}> {
  const where: any = { tenantId };
  if (projectId) where.projectId = projectId;

  const tasks = await prisma.project_task.findMany({
    where,
    select: { status: true, priority: true, dueDate: true, assigneeId: true },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let overdue = 0;
  let dueToday = 0;
  let unassigned = 0;

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

    if (t.dueDate && t.status !== 'DONE') {
      if (t.dueDate < now) overdue++;
      if (t.dueDate >= today && t.dueDate < tomorrow) dueToday++;
    }

    if (!t.assigneeId) unassigned++;
  }

  return {
    total: tasks.length,
    byStatus,
    byPriority,
    overdue,
    dueToday,
    unassigned,
  };
}

/**
 * Get tasks for a specific assignee (My Work)
 */
export async function getMyTasks(
  tenantId: string,
  assigneeId: string,
  includeCompleted: boolean = false
): Promise<project_task[]> {
  const where: any = { tenantId, assigneeId };
  if (!includeCompleted) {
    where.status = { not: 'DONE' };
  }

  return prisma.project_task.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      milestone: { select: { id: true, name: true } },
    },
  });
}
