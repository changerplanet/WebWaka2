/**
 * PROJECT MANAGEMENT SUITE — Budget Service
 * Phase 7C.2, S3 Core Services
 * 
 * Manages project budget: line items, tracking, variance calculation.
 * Light budget tracking - NOT full cost accounting.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { type project_budget_item, type project_project } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateBudgetItemInput {
  category: string; // "Materials", "Labor", "Equipment", "Consulting", "Travel", "Other"
  description: string;
  estimatedAmount: number;
  actualAmount?: number;
  milestoneId?: string;
  expenseId?: string;
  invoiceId?: string;
}

export interface UpdateBudgetItemInput extends Partial<CreateBudgetItemInput> {
  isApproved?: boolean;
}

export interface BudgetFilters {
  projectId: string;
  category?: string;
  milestoneId?: string;
  isApproved?: boolean;
}

export interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  isOverBudget: boolean;
  byCategory: Record<string, { estimated: number; actual: number }>;
  byMilestone: Record<string, { estimated: number; actual: number }>;
}

// ============================================================================
// BUDGET SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a budget line item
 */
export async function createBudgetItem(
  tenantId: string,
  platformInstanceId: string,
  projectId: string,
  input: CreateBudgetItemInput,
  createdBy?: string
): Promise<project_budget_item> {
  return prisma.project_budget_item.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      projectId,
      category: input.category,
      description: input.description,
      estimatedAmount: input.estimatedAmount,
      actualAmount: input.actualAmount,
      currency: 'NGN',
      milestoneId: input.milestoneId,
      expenseId: input.expenseId,
      invoiceId: input.invoiceId,
      isApproved: false,
      createdBy,
    }),
  });
}

/**
 * Get budget item by ID
 */
export async function getBudgetItemById(
  tenantId: string,
  budgetItemId: string
): Promise<project_budget_item | null> {
  return prisma.project_budget_item.findFirst({
    where: { id: budgetItemId, tenantId },
  });
}

/**
 * List budget items for a project
 */
export async function listBudgetItems(
  tenantId: string,
  filters: BudgetFilters
): Promise<project_budget_item[]> {
  const where: any = { tenantId, projectId: filters.projectId };

  if (filters.category) where.category = filters.category;
  if (filters.milestoneId) where.milestoneId = filters.milestoneId;
  if (filters.isApproved !== undefined) where.isApproved = filters.isApproved;

  return prisma.project_budget_item.findMany({
    where,
    orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
  });
}

/**
 * Update a budget item
 */
export async function updateBudgetItem(
  tenantId: string,
  budgetItemId: string,
  input: UpdateBudgetItemInput,
  updatedBy?: string
): Promise<project_budget_item> {
  const data: any = { ...input };
  
  if (input.isApproved) {
    data.approvedBy = updatedBy;
    data.approvedAt = new Date();
  }

  return prisma.project_budget_item.update({
    where: { id: budgetItemId },
    data,
  });
}

/**
 * Delete a budget item
 */
export async function deleteBudgetItem(
  tenantId: string,
  budgetItemId: string
): Promise<void> {
  await prisma.project_budget_item.delete({
    where: { id: budgetItemId },
  });
}

// ============================================================================
// APPROVAL
// ============================================================================

/**
 * Approve a budget item
 */
export async function approveBudgetItem(
  tenantId: string,
  budgetItemId: string,
  approvedBy: string
): Promise<project_budget_item> {
  return prisma.project_budget_item.update({
    where: { id: budgetItemId },
    data: {
      isApproved: true,
      approvedBy,
      approvedAt: new Date(),
    },
  });
}

/**
 * Revoke budget item approval
 */
export async function revokeApproval(
  tenantId: string,
  budgetItemId: string
): Promise<project_budget_item> {
  return prisma.project_budget_item.update({
    where: { id: budgetItemId },
    data: {
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
    },
  });
}

// ============================================================================
// ACTUAL AMOUNT TRACKING
// ============================================================================

/**
 * Record actual spend for a budget item
 */
export async function recordActualSpend(
  tenantId: string,
  budgetItemId: string,
  actualAmount: number,
  expenseId?: string
): Promise<project_budget_item> {
  return prisma.project_budget_item.update({
    where: { id: budgetItemId },
    data: {
      actualAmount,
      expenseId,
    },
  });
}

/**
 * Link expense to budget item
 */
export async function linkExpense(
  tenantId: string,
  budgetItemId: string,
  expenseId: string,
  expenseAmount: number
): Promise<project_budget_item> {
  return prisma.project_budget_item.update({
    where: { id: budgetItemId },
    data: {
      expenseId,
      actualAmount: expenseAmount,
    },
  });
}

// ============================================================================
// BUDGET SUMMARY & ANALYSIS
// ============================================================================

/**
 * Get budget summary for a project
 */
export async function getBudgetSummary(
  tenantId: string,
  projectId: string
): Promise<BudgetSummary> {
  const items = await listBudgetItems(tenantId, { projectId });

  let totalEstimated = 0;
  let totalActual = 0;
  const byCategory: Record<string, { estimated: number; actual: number }> = {};
  const byMilestone: Record<string, { estimated: number; actual: number }> = {};

  for (const item of items) {
    const estimated = Number(item.estimatedAmount);
    const actual = item.actualAmount ? Number(item.actualAmount) : 0;

    totalEstimated += estimated;
    totalActual += actual;

    // By category
    if (!byCategory[item.category]) {
      byCategory[item.category] = { estimated: 0, actual: 0 };
    }
    byCategory[item.category].estimated += estimated;
    byCategory[item.category].actual += actual;

    // By milestone
    const milestoneKey = item.milestoneId || 'unassigned';
    if (!byMilestone[milestoneKey]) {
      byMilestone[milestoneKey] = { estimated: 0, actual: 0 };
    }
    byMilestone[milestoneKey].estimated += estimated;
    byMilestone[milestoneKey].actual += actual;
  }

  const variance = totalEstimated - totalActual;
  const variancePercent = totalEstimated > 0 
    ? Math.round((variance / totalEstimated) * 100) 
    : 0;

  return {
    totalEstimated,
    totalActual,
    variance,
    variancePercent,
    isOverBudget: totalActual > totalEstimated,
    byCategory,
    byMilestone,
  };
}

/**
 * Get budget vs actual for project dashboard
 */
export async function getProjectBudgetStatus(
  tenantId: string,
  projectId: string
): Promise<{
  estimated: number;
  actual: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}> {
  const project = await prisma.project_project.findFirst({
    where: { id: projectId, tenantId },
  });

  const summary = await getBudgetSummary(tenantId, projectId);

  // Use project-level budget if set, otherwise sum of line items
  const estimated = project?.budgetEstimated 
    ? Number(project.budgetEstimated) 
    : summary.totalEstimated;

  return {
    estimated,
    actual: summary.totalActual,
    remaining: estimated - summary.totalActual,
    percentUsed: estimated > 0 
      ? Math.round((summary.totalActual / estimated) * 100) 
      : 0,
    isOverBudget: summary.totalActual > estimated,
  };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Create multiple budget items at once
 */
export async function createBudgetItems(
  tenantId: string,
  platformInstanceId: string,
  projectId: string,
  items: CreateBudgetItemInput[],
  createdBy?: string
): Promise<number> {
  const result = await prisma.project_budget_item.createMany({
    data: items.map((item: any) => ({
      tenantId,
      platformInstanceId,
      projectId,
      category: item.category,
      description: item.description,
      estimatedAmount: item.estimatedAmount,
      actualAmount: item.actualAmount,
      currency: 'NGN',
      milestoneId: item.milestoneId,
      isApproved: false,
      createdBy,
    })),
  });
  return result.count;
}

/**
 * Update project estimated budget based on line items
 */
export async function syncProjectBudget(
  tenantId: string,
  projectId: string
): Promise<project_project> {
  const summary = await getBudgetSummary(tenantId, projectId);

  return prisma.project_project.update({
    where: { id: projectId },
    data: {
      budgetEstimated: summary.totalEstimated,
    },
  });
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get budget statistics across projects
 */
export async function getBudgetStats(
  tenantId: string,
  platformInstanceId?: string
): Promise<{
  totalEstimated: number;
  totalActual: number;
  projectsOverBudget: number;
  topCategories: Array<{ category: string; amount: number }>;
}> {
  const where: any = { tenantId };
  if (platformInstanceId) where.platformInstanceId = platformInstanceId;

  const items = await prisma.project_budget_item.findMany({
    where,
    select: { 
      projectId: true, 
      category: true, 
      estimatedAmount: true, 
      actualAmount: true 
    },
  });

  let totalEstimated = 0;
  let totalActual = 0;
  const projectBudgets: Record<string, { estimated: number; actual: number }> = {};
  const categoryTotals: Record<string, number> = {};

  for (const item of items) {
    const estimated = Number(item.estimatedAmount);
    const actual = item.actualAmount ? Number(item.actualAmount) : 0;

    totalEstimated += estimated;
    totalActual += actual;

    // Track by project
    if (!projectBudgets[item.projectId]) {
      projectBudgets[item.projectId] = { estimated: 0, actual: 0 };
    }
    projectBudgets[item.projectId].estimated += estimated;
    projectBudgets[item.projectId].actual += actual;

    // Track by category
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + actual;
  }

  const projectsOverBudget = Object.values(projectBudgets).filter(
    (p: any) => p.actual > p.estimated && p.estimated > 0
  ).length;

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalEstimated,
    totalActual,
    projectsOverBudget,
    topCategories,
  };
}

// ============================================================================
// BUDGET CATEGORIES (Constants)
// ============================================================================

export const BUDGET_CATEGORIES = [
  'Materials',
  'Labor',
  'Equipment',
  'Consulting',
  'Travel',
  'Communication',
  'Utilities',
  'Permits & Licenses',
  'Insurance',
  'Contingency',
  'Other',
] as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];
