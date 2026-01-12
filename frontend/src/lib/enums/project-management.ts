/**
 * PROJECT MANAGEMENT ENUM VALIDATORS
 * ===================================
 * 
 * Phase 11B: Type-safe validators for project management module enums.
 * Uses Prisma schema as source of truth.
 * 
 * @module lib/enums/project-management
 */

import { validateEnumValue } from './types'

// =============================================================================
// PROJECT STATUS (Prisma: project_Status)
// =============================================================================

export const PM_PROJECT_STATUS = [
  'DRAFT',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED'
] as const

export type PmProjectStatusType = typeof PM_PROJECT_STATUS[number]

export function validateProjectStatus(
  value: string | null | undefined
): PmProjectStatusType | undefined {
  return validateEnumValue(value, PM_PROJECT_STATUS, 'ProjectStatus', 'API')
}

// =============================================================================
// PROJECT PRIORITY (Prisma: project_Priority)
// =============================================================================

export const PM_PROJECT_PRIORITY = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
] as const

export type PmProjectPriorityType = typeof PM_PROJECT_PRIORITY[number]

export function validateProjectPriority(
  value: string | null | undefined
): PmProjectPriorityType | undefined {
  return validateEnumValue(value, PM_PROJECT_PRIORITY, 'ProjectPriority', 'API')
}

// =============================================================================
// PROJECT HEALTH (Prisma: project_Health)
// =============================================================================

export const PM_PROJECT_HEALTH = [
  'ON_TRACK',
  'AT_RISK',
  'DELAYED'
] as const

export type PmProjectHealthType = typeof PM_PROJECT_HEALTH[number]

export function validateProjectHealth(
  value: string | null | undefined
): PmProjectHealthType | undefined {
  return validateEnumValue(value, PM_PROJECT_HEALTH, 'ProjectHealth', 'API')
}

// =============================================================================
// TASK STATUS (Prisma: project_TaskStatus)
// =============================================================================

export const PM_TASK_STATUS = [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'BLOCKED'
] as const

export type PmTaskStatusType = typeof PM_TASK_STATUS[number]

export function validateTaskStatus(
  value: string | null | undefined
): PmTaskStatusType | undefined {
  return validateEnumValue(value, PM_TASK_STATUS, 'TaskStatus', 'API')
}

// =============================================================================
// TASK PRIORITY (Prisma: project_TaskPriority)
// =============================================================================

export const PM_TASK_PRIORITY = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
] as const

export type PmTaskPriorityType = typeof PM_TASK_PRIORITY[number]

export function validateTaskPriority(
  value: string | null | undefined
): PmTaskPriorityType | undefined {
  return validateEnumValue(value, PM_TASK_PRIORITY, 'TaskPriority', 'API')
}

// =============================================================================
// TEAM MEMBER ROLE (Prisma: project_MemberRole)
// =============================================================================

export const PM_TEAM_ROLE = [
  'OWNER',
  'MANAGER',
  'LEAD',
  'MEMBER',
  'OBSERVER'
] as const

export type PmTeamRoleType = typeof PM_TEAM_ROLE[number]

export function validateTeamRole(
  value: string | null | undefined
): PmTeamRoleType | undefined {
  return validateEnumValue(value, PM_TEAM_ROLE, 'TeamRole', 'API')
}
