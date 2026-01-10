/**
 * PROJECT MANAGEMENT SUITE — Service Index
 * Phase 7C.2, S3 Core Services
 * 
 * Re-exports all project management services for convenient imports.
 */

// Project Service
export {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
  startProject,
  holdProject,
  resumeProject,
  completeProject,
  cancelProject,
  archiveProject,
  recalculateProjectProgress,
  getProjectStats,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectFilters,
} from './project-service';

// Milestone Service
export {
  createMilestone,
  getMilestoneById,
  listMilestones,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
  reopenMilestone,
  recalculateMilestoneProgress,
  reorderMilestones,
  getMilestoneStats,
  type CreateMilestoneInput,
  type UpdateMilestoneInput,
  type MilestoneFilters,
} from './milestone-service';

// Task Service
export {
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  deleteTask,
  startTask,
  submitTaskForReview,
  completeTask,
  reopenTask,
  blockTask,
  assignTask,
  unassignTask,
  bulkUpdateTaskStatus,
  reorderTasks,
  getTaskStats,
  getMyTasks,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilters,
} from './task-service';

// Team Service
export {
  addTeamMember,
  getTeamMemberById,
  listTeamMembers,
  updateTeamMember,
  removeTeamMember,
  deleteTeamMember,
  transferOwnership,
  setProjectManager,
  getMemberProjects,
  isMemberOnProject,
  getMemberRole,
  getTeamStats,
  getTeamWorkload,
  type AddTeamMemberInput,
  type UpdateTeamMemberInput,
  type TeamMemberFilters,
} from './team-service';

// Budget Service
export {
  createBudgetItem,
  getBudgetItemById,
  listBudgetItems,
  updateBudgetItem,
  deleteBudgetItem,
  approveBudgetItem,
  revokeApproval,
  recordActualSpend,
  linkExpense,
  getBudgetSummary,
  getProjectBudgetStatus,
  createBudgetItems,
  syncProjectBudget,
  getBudgetStats,
  BUDGET_CATEGORIES,
  type CreateBudgetItemInput,
  type UpdateBudgetItemInput,
  type BudgetFilters,
  type BudgetSummary,
  type BudgetCategory,
} from './budget-service';
