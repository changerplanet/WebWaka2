/**
 * RECRUITMENT & ONBOARDING SUITE — Onboarding Task Service
 * Phase 7C.1, S3 Core Services
 * 
 * Manages onboarding tasks: generate checklist, track completion, document collection.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  recruit_OnboardingStatus,
  type recruit_onboarding_task 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOnboardingTaskInput {
  applicationId: string;
  taskName: string;
  description?: string;
  category?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedDepartment?: string;
  dueDate?: Date;
  dueOrder?: number;
  requiresDocument?: boolean;
  documentType?: string;
  notes?: string;
}

export interface UpdateOnboardingTaskInput {
  taskName?: string;
  description?: string;
  category?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedDepartment?: string;
  dueDate?: Date;
  dueOrder?: number;
  requiresDocument?: boolean;
  documentType?: string;
  notes?: string;
}

export interface OnboardingTaskFilters {
  applicationId?: string;
  category?: string;
  status?: recruit_OnboardingStatus;
  assignedTo?: string;
  assignedDepartment?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

// Default onboarding checklist for Nigerian context
const DEFAULT_ONBOARDING_TASKS = [
  // HR Tasks
  { taskName: 'Collect National ID / Voter\'s Card / Passport', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Government ID', dueOrder: 1 },
  { taskName: 'Collect Educational Certificates', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Educational Certificate', dueOrder: 2 },
  { taskName: 'Collect NYSC Certificate / Exemption Letter', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'NYSC Certificate', dueOrder: 3 },
  { taskName: 'Collect Professional Licenses (if applicable)', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Professional License', dueOrder: 4 },
  { taskName: 'Collect Guarantor Form (2 guarantors)', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Guarantor Form', dueOrder: 5 },
  { taskName: 'Collect Passport Photographs', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Passport Photo', dueOrder: 6 },
  { taskName: 'Collect Bank Account Details', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Bank Details', dueOrder: 7 },
  { taskName: 'Complete Employee Information Form', ProductCategory: 'Documents', assignedDepartment: 'HR', dueOrder: 8 },
  { taskName: 'Sign Employment Contract', ProductCategory: 'Documents', assignedDepartment: 'HR', requiresDocument: true, documentType: 'Signed Contract', dueOrder: 9 },
  
  // Finance Tasks
  { taskName: 'Setup Pension (PFA Registration)', ProductCategory: 'Finance', assignedDepartment: 'Finance', dueOrder: 10 },
  { taskName: 'Setup Tax (PAYE Registration)', ProductCategory: 'Finance', assignedDepartment: 'Finance', dueOrder: 11 },
  { taskName: 'Setup NHF (if applicable)', ProductCategory: 'Finance', assignedDepartment: 'Finance', dueOrder: 12 },
  { taskName: 'Add to Payroll System', ProductCategory: 'Finance', assignedDepartment: 'Finance', dueOrder: 13 },
  
  // IT Tasks
  { taskName: 'Create Email Account', ProductCategory: 'IT Setup', assignedDepartment: 'IT', dueOrder: 14 },
  { taskName: 'Setup Computer / Workstation', ProductCategory: 'IT Setup', assignedDepartment: 'IT', dueOrder: 15 },
  { taskName: 'Provide System Access / Login Credentials', ProductCategory: 'IT Setup', assignedDepartment: 'IT', dueOrder: 16 },
  { taskName: 'Issue Access Card / Building Pass', ProductCategory: 'IT Setup', assignedDepartment: 'Admin', dueOrder: 17 },
  
  // Training & Orientation
  { taskName: 'Schedule Orientation Session', ProductCategory: 'Training', assignedDepartment: 'HR', dueOrder: 18 },
  { taskName: 'Complete Health & Safety Training', ProductCategory: 'Training', assignedDepartment: 'HR', dueOrder: 19 },
  { taskName: 'Complete Company Policy Training', ProductCategory: 'Training', assignedDepartment: 'HR', dueOrder: 20 },
  { taskName: 'Department Introduction', ProductCategory: 'Training', assignedDepartment: 'Manager', dueOrder: 21 },
  
  // Administrative
  { taskName: 'Register for HMO / Health Insurance', ProductCategory: 'Admin', assignedDepartment: 'HR', dueOrder: 22 },
  { taskName: 'Assign Desk / Workspace', ProductCategory: 'Admin', assignedDepartment: 'Admin', dueOrder: 23 },
  { taskName: 'Add to Company Directory', ProductCategory: 'Admin', assignedDepartment: 'HR', dueOrder: 24 },
];

// ============================================================================
// ONBOARDING TASK SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a single onboarding task
 */
export async function createOnboardingTask(
  tenantId: string,
  platformInstanceId: string,
  input: CreateOnboardingTaskInput
): Promise<recruit_onboarding_task> {
  // Verify application exists and is hired
  const application = await prisma.recruit_application.findFirst({
    where: { id: input.applicationId, tenantId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  return prisma.recruit_onboarding_task.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      applicationId: input.applicationId,
      taskName: input.taskName,
      description: input.description,
      category: input.category,
      assignedTo: input.assignedTo,
      assignedToName: input.assignedToName,
      assignedDepartment: input.assignedDepartment,
      dueDate: input.dueDate,
      dueOrder: input.dueOrder,
      requiresDocument: input.requiresDocument || false,
      documentType: input.documentType,
      notes: input.notes,
      status: 'PENDING',
    }),
  });
}

/**
 * Generate default onboarding checklist for a hired candidate
 */
export async function generateOnboardingChecklist(
  tenantId: string,
  platformInstanceId: string,
  applicationId: string,
  startDate?: Date
): Promise<recruit_onboarding_task[]> {
  // Verify application exists and is hired
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId, stage: 'HIRED' },
    include: { offer: true },
  });

  if (!application) {
    throw new Error('Application not found or not hired');
  }

  // Check if tasks already exist
  const existingTasks = await prisma.recruit_onboarding_task.count({
    where: { applicationId, tenantId },
  });

  if (existingTasks > 0) {
    throw new Error('Onboarding tasks already exist for this application');
  }

  // Calculate due dates based on start date
  const baseDate = startDate || application.offer?.startDate || new Date();
  
  const tasks = await Promise.all(
    DEFAULT_ONBOARDING_TASKS.map(async (task) => {
      // Calculate due date (tasks due before or on start date)
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() - Math.max(0, 5 - (task.dueOrder || 0) / 5));

      return prisma.recruit_onboarding_task.create({
        data: withPrismaDefaults({
          tenantId,
          platformInstanceId,
          applicationId,
          taskName: task.taskName,
          ProductCategory: task.category,
          assignedDepartment: task.assignedDepartment,
          dueDate,
          dueOrder: task.dueOrder,
          requiresDocument: task.requiresDocument || false,
          documentType: task.documentType,
          status: 'PENDING',
        }),
      });
    })
  );

  return tasks;
}

/**
 * Get onboarding task by ID
 */
export async function getOnboardingTaskById(
  tenantId: string,
  taskId: string
): Promise<recruit_onboarding_task | null> {
  return prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
    include: {
      application: {
        select: {
          applicantName: true,
          applicantEmail: true,
          log_jobs: { select: { title: true } },
        },
      },
    },
  });
}

/**
 * Get onboarding tasks with filters
 */
export async function getOnboardingTasks(
  tenantId: string,
  filters: OnboardingTaskFilters = {}
): Promise<{ tasks: recruit_onboarding_task[]; total: number; pagination: any }> {
  const {
    applicationId,
    category,
    status,
    assignedTo,
    assignedDepartment,
    isOverdue,
    page = 1,
    limit = 50,
  } = filters;

  const where: any = { tenantId };

  if (applicationId) where.applicationId = applicationId;
  if (category) where.category = category;
  if (status) where.status = status;
  if (assignedTo) where.assignedTo = assignedTo;
  if (assignedDepartment) where.assignedDepartment = assignedDepartment;

  if (isOverdue) {
    where.status = { in: ['PENDING', 'IN_PROGRESS'] };
    where.dueDate = { lt: new Date() };
  }

  const [tasks, total] = await Promise.all([
    prisma.recruit_onboarding_task.findMany({
      where,
      orderBy: { dueOrder: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        application: {
          select: {
            applicantName: true,
            log_jobs: { select: { title: true } },
          },
        },
      },
    }),
    prisma.recruit_onboarding_task.count({ where }),
  ]);

  return {
    tasks,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get tasks by application (checklist view)
 */
export async function getChecklistByApplication(
  tenantId: string,
  applicationId: string
): Promise<{
  tasks: recruit_onboarding_task[];
  progress: { total: number; completed: number; percentage: number };
  byCategory: Record<string, recruit_onboarding_task[]>;
}> {
  const tasks = await prisma.recruit_onboarding_task.findMany({
    where: { applicationId, tenantId },
    orderBy: { dueOrder: 'asc' },
  });

  const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const percentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  // Group by category
  const byCategory: Record<string, recruit_onboarding_task[]> = {};
  tasks.forEach(task => {
    const cat = task.category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(task);
  });

  return {
    tasks,
    progress: { total: tasks.length, completed, percentage },
    byCategory,
  };
}

/**
 * Update onboarding task
 */
export async function updateOnboardingTask(
  tenantId: string,
  taskId: string,
  input: UpdateOnboardingTaskInput
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task) return null;

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
}

/**
 * Start task (PENDING → IN_PROGRESS)
 */
export async function startTask(
  tenantId: string,
  taskId: string
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task || task.status !== 'PENDING') return null;

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      status: 'IN_PROGRESS',
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Complete task
 */
export async function completeTask(
  tenantId: string,
  taskId: string,
  completedBy?: string,
  notes?: string
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task || task.status === 'COMPLETED') return null;

  // If requires document, check if uploaded
  if (task.requiresDocument && !task.documentFileId) {
    throw new Error('Document upload required before completing this task');
  }

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy,
      completionNotes: notes,
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Skip task
 */
export async function skipTask(
  tenantId: string,
  taskId: string,
  reason?: string,
  skippedBy?: string
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task) return null;

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      status: 'SKIPPED',
      completionNotes: reason ? `[SKIPPED] ${reason}` : task.completionNotes,
      statusChangedAt: new Date(),
      statusChangedBy: skippedBy,
    },
  });
}

/**
 * Upload document for task
 */
export async function uploadTaskDocument(
  tenantId: string,
  taskId: string,
  fileId: string,
  fileName: string
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task || !task.requiresDocument) return null;

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      documentFileId: fileId,
      documentFileName: fileName,
      status: task.status === 'PENDING' ? 'IN_PROGRESS' : task.status,
      statusChangedAt: task.status === 'PENDING' ? new Date() : task.statusChangedAt,
    },
  });
}

/**
 * Verify document
 */
export async function verifyDocument(
  tenantId: string,
  taskId: string,
  verifiedBy: string
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task || !task.documentFileId) return null;

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      documentVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
    },
  });
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(
  tenantId: string
): Promise<recruit_onboarding_task[]> {
  const now = new Date();

  return prisma.recruit_onboarding_task.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { lt: now },
    },
    orderBy: { dueDate: 'asc' },
    include: {
      application: {
        select: {
          applicantName: true,
          log_jobs: { select: { title: true } },
        },
      },
    },
  });
}

/**
 * Get onboarding statistics
 */
export async function getOnboardingStats(tenantId: string): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byCategory: { category: string; total: number; completed: number }[];
  avgCompletionRate: number;
}> {
  const now = new Date();

  const [
    total,
    pending,
    inProgress,
    completed,
    overdue,
    categoryGroups,
  ] = await Promise.all([
    prisma.recruit_onboarding_task.count({ where: { tenantId } }),
    prisma.recruit_onboarding_task.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.recruit_onboarding_task.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
    prisma.recruit_onboarding_task.count({ where: { tenantId, status: 'COMPLETED' } }),
    prisma.recruit_onboarding_task.count({
      where: {
        tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
    }),
    prisma.recruit_onboarding_task.groupBy({
      by: ['category', 'status'],
      where: { tenantId },
      _count: true,
    }),
  ]);

  // Process category stats
  const catMap: Record<string, { total: number; completed: number }> = {};
  categoryGroups.forEach((g: any) => {
    const cat = g.category || 'General';
    if (!catMap[cat]) catMap[cat] = { total: 0, completed: 0 };
    catMap[cat].total += g._count;
    if (g.status === 'COMPLETED') catMap[cat].completed += g._count;
  });

  const byCategory = Object.entries(catMap).map(([category, data]) => ({
    category,
    total: data.total,
    completed: data.completed,
  }));

  const avgCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    pending,
    inProgress,
    completed,
    overdue,
    byCategory,
    avgCompletionRate,
  };
}

/**
 * Assign task to staff member
 */
export async function assignTask(
  tenantId: string,
  taskId: string,
  assignedTo: string,
  assignedToName: string
): Promise<recruit_onboarding_task | null> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task) return null;

  return prisma.recruit_onboarding_task.update({
    where: { id: taskId },
    data: {
      assignedTo,
      assignedToName,
    },
  });
}

/**
 * Delete onboarding task
 */
export async function deleteOnboardingTask(
  tenantId: string,
  taskId: string
): Promise<boolean> {
  const task = await prisma.recruit_onboarding_task.findFirst({
    where: { id: taskId, tenantId },
  });

  if (!task) return false;

  await prisma.recruit_onboarding_task.delete({ where: { id: taskId } });
  return true;
}

/**
 * Delete all tasks for an application (cleanup)
 */
export async function deleteChecklistByApplication(
  tenantId: string,
  applicationId: string
): Promise<number> {
  const result = await prisma.recruit_onboarding_task.deleteMany({
    where: { applicationId, tenantId },
  });

  return result.count;
}
