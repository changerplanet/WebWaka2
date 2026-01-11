/**
 * MODULE 8: MARKETING AUTOMATION
 * Workflow Service - Automation workflow management
 * 
 * PHASE 1-5: Domain Model, Triggers, Actions, Scheduling, Templates
 */

import { prisma } from '@/lib/prisma'
import { MktAutomationStatus, MktTriggerType, MktActionType, MktRunStatus, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowInput {
  name: string
  description?: string
  isRecurring?: boolean
  startDate?: Date
  endDate?: Date
  triggers: TriggerInput[]
  actions: ActionInput[]
  offlineId?: string
}

export interface TriggerInput {
  type: MktTriggerType
  eventName?: string
  conditions?: Record<string, unknown>
  scheduleType?: string
  scheduleDays?: number
}

export interface ActionInput {
  type: MktActionType
  config: Record<string, unknown>
  delayMinutes?: number
}

export interface WorkflowOutput {
  id: string
  tenantId: string
  name: string
  description: string | null
  status: MktAutomationStatus
  isRecurring: boolean
  startDate: Date | null
  endDate: Date | null
  templateKey: string | null
  isTemplate: boolean
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  lastRunAt: Date | null
  triggers: TriggerOutput[]
  actions: ActionOutput[]
  createdAt: Date
  updatedAt: Date
}

export interface TriggerOutput {
  id: string
  type: MktTriggerType
  eventName: string | null
  conditions: Record<string, unknown> | null
  scheduleType: string | null
  scheduleDays: number | null
  isActive: boolean
}

export interface ActionOutput {
  id: string
  type: MktActionType
  config: Record<string, unknown>
  delayMinutes: number
  sortOrder: number
  isActive: boolean
}

// ============================================================================
// SERVICE
// ============================================================================

export class WorkflowService {
  /**
   * List workflows
   */
  static async listWorkflows(tenantId: string, options?: {
    status?: MktAutomationStatus[]
    includeTemplates?: boolean
    page?: number
    limit?: number
  }) {
    const { status, includeTemplates = false, page = 1, limit = 20 } = options || {}

    const where: Prisma.mkt_automation_workflowsWhereInput = {
      tenantId,
      ...(status && { status: { in: status } }),
      ...(!includeTemplates && { isTemplate: false }),
    }

    const [workflows, total] = await Promise.all([
      prisma.mkt_automation_workflows.findMany({
        where,
        include: {
          mkt_automation_triggers: { orderBy: { sortOrder: 'asc' } },
          mkt_automation_actions: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mkt_automation_workflows.count({ where }),
    ])

    return {
      workflows: workflows.map(w => this.formatWorkflow(w)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get workflow by ID
   */
  static async getWorkflow(tenantId: string, id: string): Promise<WorkflowOutput | null> {
    const workflow = await prisma.mkt_automation_workflows.findFirst({
      where: { id, tenantId },
      include: {
        mkt_automation_triggers: { orderBy: { sortOrder: 'asc' } },
        mkt_automation_actions: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return workflow ? this.formatWorkflow(workflow) : null
  }

  /**
   * Create workflow
   */
  static async createWorkflow(tenantId: string, input: WorkflowInput, createdBy: string): Promise<WorkflowOutput> {
    // Check for duplicate offline ID
    if (input.offlineId) {
      const existing = await prisma.mkt_automation_workflows.findUnique({
        where: { tenantId_offlineId: { tenantId, offlineId: input.offlineId } },
      })
      if (existing) {
        const full = await this.getWorkflow(tenantId, existing.id)
        return full!
      }
    }

    const workflow = await prisma.mkt_automation_workflows.create({
      data: withPrismaDefaults({
        tenantId,
        name: input.name,
        description: input.description,
        isRecurring: input.isRecurring ?? true,
        startDate: input.startDate,
        endDate: input.endDate,
        offlineId: input.offlineId,
        createdBy,
        mkt_automation_triggers: {
          create: input.triggers.map((t, i) => withPrismaDefaults({
            type: t.type,
            eventName: t.eventName,
            conditions: t.conditions as Prisma.InputJsonValue || Prisma.JsonNull,
            scheduleType: t.scheduleType,
            scheduleDays: t.scheduleDays,
            sortOrder: i,
          })),
        },
        mkt_automation_actions: {
          create: input.actions.map((a, i) => withPrismaDefaults({
            type: a.type,
            config: a.config as Prisma.InputJsonValue,
            delayMinutes: a.delayMinutes || 0,
            sortOrder: i,
          })),
        },
      }),
      include: {
        mkt_automation_triggers: { orderBy: { sortOrder: 'asc' } },
        mkt_automation_actions: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return this.formatWorkflow(workflow)
  }

  /**
   * Create workflow from template
   */
  static async createFromTemplate(
    tenantId: string,
    templateKey: string,
    overrides?: { name?: string; description?: string },
    createdBy?: string
  ): Promise<WorkflowOutput> {
    const template = await prisma.mkt_automation_workflows.findFirst({
      where: { tenantId, templateKey, isTemplate: true },
      include: { mkt_automation_triggers: true, mkt_automation_actions: true },
    })

    if (!template) {
      throw new Error(`Template '${templateKey}' not found`)
    }

    const workflow = await prisma.mkt_automation_workflows.create({
      data: withPrismaDefaults({
        tenantId,
        name: overrides?.name || template.name,
        description: overrides?.description || template.description,
        isRecurring: template.isRecurring,
        createdBy,
        mkt_automation_triggers: {
          create: template.mkt_automation_triggers.map(t => withPrismaDefaults({
            type: t.type,
            eventName: t.eventName,
            conditions: t.conditions as Prisma.InputJsonValue || Prisma.JsonNull,
            scheduleType: t.scheduleType,
            scheduleDays: t.scheduleDays,
            sortOrder: t.sortOrder,
          })),
        },
        mkt_automation_actions: {
          create: template.mkt_automation_actions.map(a => withPrismaDefaults({
            type: a.type,
            config: a.config as Prisma.InputJsonValue,
            delayMinutes: a.delayMinutes,
            sortOrder: a.sortOrder,
          })),
        },
      }),
      include: {
        mkt_automation_triggers: { orderBy: { sortOrder: 'asc' } },
        mkt_automation_actions: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return this.formatWorkflow(workflow)
  }

  /**
   * Update workflow
   */
  static async updateWorkflow(tenantId: string, id: string, input: Partial<WorkflowInput>): Promise<WorkflowOutput> {
    const workflow = await prisma.mkt_automation_workflows.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isRecurring !== undefined && { isRecurring: input.isRecurring }),
        ...(input.startDate !== undefined && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
      include: {
        mkt_automation_triggers: { orderBy: { sortOrder: 'asc' } },
        mkt_automation_actions: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return this.formatWorkflow(workflow)
  }

  /**
   * Activate workflow
   */
  static async activateWorkflow(tenantId: string, id: string): Promise<WorkflowOutput> {
    const workflow = await prisma.mkt_automation_workflows.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { mkt_automation_triggers: true, mkt_automation_actions: true },
    })

    return this.formatWorkflow(workflow)
  }

  /**
   * Pause workflow
   */
  static async pauseWorkflow(tenantId: string, id: string): Promise<WorkflowOutput> {
    const workflow = await prisma.mkt_automation_workflows.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: { mkt_automation_triggers: true, mkt_automation_actions: true },
    })

    return this.formatWorkflow(workflow)
  }

  /**
   * Archive workflow
   */
  static async archiveWorkflow(tenantId: string, id: string): Promise<void> {
    await prisma.mkt_automation_workflows.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  /**
   * Get templates
   */
  static async getTemplates(tenantId: string): Promise<WorkflowOutput[]> {
    const templates = await prisma.mkt_automation_workflows.findMany({
      where: { tenantId, isTemplate: true },
      include: { mkt_automation_triggers: true, mkt_automation_actions: true },
      orderBy: { name: 'asc' },
    })

    return templates.map(t => this.formatWorkflow(t))
  }

  /**
   * Get workflow statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, totals] = await Promise.all([
      prisma.mkt_automation_workflows.groupBy({
        by: ['status'],
        where: { tenantId, isTemplate: false },
        _count: true,
      }),
      prisma.mkt_automation_workflows.aggregate({
        where: { tenantId, isTemplate: false },
        _sum: { totalRuns: true, successfulRuns: true, failedRuns: true },
      }),
    ])

    return {
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      totalRuns: totals._sum.totalRuns || 0,
      successfulRuns: totals._sum.successfulRuns || 0,
      failedRuns: totals._sum.failedRuns || 0,
    }
  }

  /**
   * Format workflow
   */
  private static formatWorkflow(workflow: {
    id: string
    tenantId: string
    name: string
    description: string | null
    status: MktAutomationStatus
    isRecurring: boolean
    startDate: Date | null
    endDate: Date | null
    templateKey: string | null
    isTemplate: boolean
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    lastRunAt: Date | null
    createdAt: Date
    updatedAt: Date
    mkt_automation_triggers: Array<{
      id: string
      type: MktTriggerType
      eventName: string | null
      conditions: unknown
      scheduleType: string | null
      scheduleDays: number | null
      isActive: boolean
    }>
    mkt_automation_actions: Array<{
      id: string
      type: MktActionType
      config: unknown
      delayMinutes: number
      sortOrder: number
      isActive: boolean
    }>
  }): WorkflowOutput {
    return {
      id: workflow.id,
      tenantId: workflow.tenantId,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      isRecurring: workflow.isRecurring,
      startDate: workflow.startDate,
      endDate: workflow.endDate,
      templateKey: workflow.templateKey,
      isTemplate: workflow.isTemplate,
      totalRuns: workflow.totalRuns,
      successfulRuns: workflow.successfulRuns,
      failedRuns: workflow.failedRuns,
      lastRunAt: workflow.lastRunAt,
      triggers: workflow.mkt_automation_triggers.map(t => ({
        id: t.id,
        type: t.type,
        eventName: t.eventName,
        conditions: t.conditions as Record<string, unknown> | null,
        scheduleType: t.scheduleType,
        scheduleDays: t.scheduleDays,
        isActive: t.isActive,
      })),
      actions: workflow.mkt_automation_actions.map(a => ({
        id: a.id,
        type: a.type,
        config: a.config as Record<string, unknown>,
        delayMinutes: a.delayMinutes,
        sortOrder: a.sortOrder,
        isActive: a.isActive,
      })),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }
  }
}
