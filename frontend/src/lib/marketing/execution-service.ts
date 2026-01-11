/**
 * MODULE 8: MARKETING AUTOMATION
 * Execution Service - Trigger evaluation and action execution
 * 
 * PHASE 2-4: Triggers, Actions, Scheduling
 * 
 * CRITICAL: Actions emit events or handoff requests only.
 * NO direct message sending. All messages via Core Communication Engine.
 */

import { prisma } from '@/lib/prisma'
import { MktRunStatus, MktActionType, Prisma } from '@prisma/client'
import { MktConfigService } from './config-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface TriggerEvaluationResult {
  shouldTrigger: boolean
  workflowId: string
  reason?: string
}

export interface ActionResult {
  actionId: string
  type: MktActionType
  success: boolean
  error?: string
  handoffId?: string
}

export interface ExecutionResult {
  runId: string
  status: MktRunStatus
  actionsExecuted: number
  results: ActionResult[]
  completedAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class ExecutionService {
  /**
   * Process an incoming event and trigger matching workflows
   */
  static async processEvent(
    tenantId: string,
    eventName: string,
    eventData: Record<string, unknown>
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = []

    // Check if automation is enabled
    const config = await MktConfigService.getConfig(tenantId)
    if (!config?.automationEnabled) {
      return results
    }

    // Check quiet hours
    if (await MktConfigService.isQuietHours(tenantId)) {
      // Queue for later instead of executing now
      return results
    }

    // Find matching active workflows
    const workflows = await prisma.mkt_automation_workflows.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        triggers: {
          some: {
            type: 'EVENT',
            eventName,
            isActive: true,
          },
        },
      },
      include: {
        triggers: { where: { isActive: true } },
        actions: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    })

    for (const workflow of workflows) {
      // Evaluate trigger conditions
      const trigger = workflow.triggers.find(t => t.eventName === eventName)
      if (!trigger) continue

      const shouldExecute = await this.evaluateTriggerConditions(
        trigger.conditions as Record<string, unknown> | null,
        eventData
      )

      if (shouldExecute) {
        const result = await this.executeWorkflow(
          tenantId,
          workflow.id,
          eventData.customerId as string | undefined,
          eventName,
          eventData,
          workflow.actions
        )
        results.push(result)
      }
    }

    return results
  }

  /**
   * Execute a workflow
   */
  static async executeWorkflow(
    tenantId: string,
    workflowId: string,
    customerId: string | undefined,
    triggeredBy: string,
    triggerData: Record<string, unknown>,
    actions: Array<{
      id: string
      type: MktActionType
      config: unknown
      delayMinutes: number
    }>
  ): Promise<ExecutionResult> {
    // Create run record
    const run = await prisma.mkt_automation_runs.create({
      data: {
        tenantId,
        workflowId,
        customerId,
        customerPhone: triggerData.phone as string | undefined,
        triggeredBy,
        triggerData: triggerData as Prisma.InputJsonValue,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    const results: ActionResult[] = []
    let hasErrors = false

    // Execute actions in order
    for (const action of actions) {
      // Handle delay
      if (action.delayMinutes > 0) {
        // In production, this would queue the action for later
        // For now, we'll just note it
        results.push({
          actionId: action.id,
          type: action.type,
          success: true,
          handoffId: `DELAYED_${action.delayMinutes}min`,
        })
        continue
      }

      try {
        const result = await this.executeAction(
          tenantId,
          action.type,
          action.config as Record<string, unknown>,
          { customerId, ...triggerData }
        )
        results.push({
          actionId: action.id,
          type: action.type,
          success: true,
          handoffId: result.handoffId,
        })
      } catch (error) {
        hasErrors = true
        results.push({
          actionId: action.id,
          type: action.type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Update run record
    const status: MktRunStatus = hasErrors ? 'FAILED' : 'COMPLETED'
    await prisma.mkt_automation_runs.update({
      where: { id: run.id },
      data: {
        status,
        completedAt: new Date(),
        actionsExecuted: results.filter(r => r.success).length,
        actionResults: results as unknown as Prisma.InputJsonValue,
      },
    })

    // Update workflow statistics
    await prisma.mkt_automation_workflows.update({
      where: { id: workflowId },
      data: {
        totalRuns: { increment: 1 },
        ...(status === 'COMPLETED' && { successfulRuns: { increment: 1 } }),
        ...(status === 'FAILED' && { failedRuns: { increment: 1 } }),
        lastRunAt: new Date(),
      },
    })

    return {
      runId: run.id,
      status,
      actionsExecuted: results.filter(r => r.success).length,
      results,
      completedAt: new Date(),
    }
  }

  /**
   * Execute a single action
   * CRITICAL: This method DELEGATES to Core, never sends directly
   */
  private static async executeAction(
    tenantId: string,
    type: MktActionType,
    config: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<{ handoffId?: string }> {
    switch (type) {
      case 'SEND_MESSAGE':
        // Delegate to Core Communication Engine
        // In production, this would call the Core notification API
        return this.handoffToCore('SEND_MESSAGE', {
          tenantId,
          channel: config.channel || 'SMS',
          template: config.template,
          recipient: context.customerId || context.phone,
          data: context,
        })

      case 'APPLY_TAG':
        // Delegate to CRM
        return this.handoffToCore('APPLY_TAG', {
          tenantId,
          customerId: context.customerId,
          tag: config.tag,
        })

      case 'AWARD_POINTS':
        // Delegate to CRM Loyalty
        return this.handoffToCore('AWARD_POINTS', {
          tenantId,
          customerId: context.customerId,
          points: config.points,
          reason: config.reason,
        })

      case 'INTERNAL_NOTIFY':
        // Create internal notification
        return this.handoffToCore('INTERNAL_NOTIFY', {
          tenantId,
          type: config.notificationType,
          message: config.message,
          data: context,
        })

      case 'WAIT':
        // Wait actions are handled by the scheduler
        return { handoffId: `WAIT_${config.minutes || 0}min` }

      default:
        throw new Error(`Unknown action type: ${type}`)
    }
  }

  /**
   * Handoff to Core Communication Engine
   * This creates an event that Core will process
   */
  private static async handoffToCore(
    actionType: string,
    payload: Record<string, unknown>
  ): Promise<{ handoffId: string }> {
    const handoffId = `MKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Log the handoff
    await prisma.mkt_automation_logs.create({
      data: {
        tenantId: payload.tenantId as string,
        eventType: 'CORE_HANDOFF',
        eventData: {
          handoffId,
          actionType,
          payload,
        } as Prisma.InputJsonValue,
      },
    })

    // In production, this would:
    // 1. Publish event to message queue
    // 2. Or call Core API directly
    // For now, we just log and return

    return { handoffId }
  }

  /**
   * Evaluate trigger conditions
   */
  private static async evaluateTriggerConditions(
    conditions: Record<string, unknown> | null,
    eventData: Record<string, unknown>
  ): Promise<boolean> {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true
    }

    // Simple condition evaluation
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = eventData[key]

      if (typeof expected === 'object' && expected !== null) {
        // Complex condition
        const op = expected as { gt?: number; lt?: number; eq?: unknown; in?: unknown[] }
        if (op.gt !== undefined && !(typeof actual === 'number' && actual > op.gt)) return false
        if (op.lt !== undefined && !(typeof actual === 'number' && actual < op.lt)) return false
        if (op.eq !== undefined && actual !== op.eq) return false
        if (op.in !== undefined && !op.in.includes(actual)) return false
      } else {
        // Simple equality
        if (actual !== expected) return false
      }
    }

    return true
  }

  /**
   * Get run history for a workflow
   */
  static async getRunHistory(tenantId: string, workflowId: string, limit: number = 50) {
    const runs = await prisma.mkt_automation_runs.findMany({
      where: { tenantId, workflowId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return runs.map(r => ({
      id: r.id,
      customerId: r.customerId,
      triggeredBy: r.triggeredBy,
      status: r.status,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      actionsExecuted: r.actionsExecuted,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt,
    }))
  }

  /**
   * Get run statistics
   */
  static async getRunStatistics(tenantId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [byStatus, total] = await Promise.all([
      prisma.mkt_automation_runs.groupBy({
        by: ['status'],
        where: { tenantId, createdAt: { gte: since } },
        _count: true,
      }),
      prisma.mkt_automation_runs.count({
        where: { tenantId, createdAt: { gte: since } },
      }),
    ])

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      period: `${days} days`,
    }
  }
}
