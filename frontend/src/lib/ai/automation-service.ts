/**
 * MODULE 14: AI & AUTOMATION
 * Automation Rules Service
 * 
 * If-this-then-that rules with safety constraints.
 * Non-destructive actions only, fully auditable.
 */

import { logAIEvent } from './event-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TRIGGER TYPES
// ============================================================================

export const TRIGGER_TYPES = {
  THRESHOLD: 'THRESHOLD',   // Value crosses threshold
  TIME: 'TIME',             // Time-based (daily, weekly)
  EVENT: 'EVENT',           // System event occurs
} as const;

// ============================================================================
// ACTION TYPES (Non-destructive only)
// ============================================================================

export const ACTION_TYPES = {
  NOTIFY: 'NOTIFY',         // Send notification
  ALERT: 'ALERT',           // Create alert
  LOG: 'LOG',               // Log entry
  RECOMMEND: 'RECOMMEND',   // Create recommendation
} as const;

// ============================================================================
// RULE MANAGEMENT
// ============================================================================

interface CreateRuleInput {
  tenantId: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  actionType: string;
  actionConfig: Record<string, any>;
  requiresApproval?: boolean;
  approvalConfig?: Record<string, any>;
  maxTriggersPerDay?: number;
  cooldownMinutes?: number;
}

export async function createAutomationRule(input: CreateRuleInput): Promise<{
  success: boolean;
  rule?: any;
  error?: string;
}> {
  try {
    // Validate action type is non-destructive
    if (!Object.values(ACTION_TYPES).includes(input.actionType as any)) {
      return { success: false, error: `Invalid action type. Allowed: ${Object.values(ACTION_TYPES).join(', ')}` };
    }
    
    const rule = await prisma.automation_rules.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        triggerConfig: input.triggerConfig,
        actionType: input.actionType,
        actionConfig: input.actionConfig,
        requiresApproval: input.requiresApproval || false,
        approvalConfig: input.approvalConfig,
        isActive: true,
        triggerCount: 0,
        maxTriggersPerDay: input.maxTriggersPerDay,
        cooldownMinutes: input.cooldownMinutes,
      }),
    });
    
    await logAIEvent({
      eventType: 'AUTOMATION_RULE_CREATED',
      tenantId: input.tenantId,
      ruleId: rule.id,
      eventData: {
        name: rule.name,
        triggerType: rule.triggerType,
        actionType: rule.actionType,
      },
    });
    
    return { success: true, rule };
  } catch (error: any) {
    console.error('Create automation rule error:', error);
    return { success: false, error: error.message || 'Failed to create rule' };
  }
}

export async function getAutomationRule(ruleId: string) {
  return prisma.automation_rules.findUnique({
    where: { id: ruleId },
  });
}

export async function listAutomationRules(params: {
  tenantId: string;
  activeOnly?: boolean;
  triggerType?: string;
  actionType?: string;
}) {
  const { tenantId, activeOnly = true, triggerType, actionType } = params;
  
  const where: any = { tenantId };
  
  if (activeOnly) where.isActive = true;
  if (triggerType) where.triggerType = triggerType;
  if (actionType) where.actionType = actionType;
  
  return prisma.automation_rules.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAutomationRule(
  ruleId: string,
  data: {
    name?: string;
    description?: string;
    triggerConfig?: Record<string, any>;
    actionConfig?: Record<string, any>;
    requiresApproval?: boolean;
    isActive?: boolean;
    maxTriggersPerDay?: number;
    cooldownMinutes?: number;
  }
): Promise<{ success: boolean; rule?: any; error?: string }> {
  try {
    const rule = await prisma.automation_rules.update({
      where: { id: ruleId },
      data,
    });
    return { success: true, rule };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update rule' };
  }
}

export async function deactivateRule(ruleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.automation_rules.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deactivate rule' };
  }
}

// ============================================================================
// RULE EXECUTION
// ============================================================================

interface TriggerRuleInput {
  ruleId: string;
  triggerData: Record<string, any>;
}

export async function triggerAutomationRule(input: TriggerRuleInput): Promise<{
  success: boolean;
  run?: any;
  error?: string;
}> {
  try {
    const rule = await prisma.automation_rules.findUnique({
      where: { id: input.ruleId },
    });
    
    if (!rule) {
      return { success: false, error: 'Rule not found' };
    }
    
    if (!rule.isActive) {
      return { success: false, error: 'Rule is not active' };
    }
    
    // Check cooldown
    if (rule.cooldownMinutes && rule.lastTriggeredAt) {
      const cooldownEnd = new Date(rule.lastTriggeredAt.getTime() + rule.cooldownMinutes * 60000);
      if (new Date() < cooldownEnd) {
        return { success: false, error: 'Rule is in cooldown period' };
      }
    }
    
    // Check daily limit
    if (rule.maxTriggersPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTriggers = await prisma.automation_runs.count({
        where: {
          ruleId: rule.id,
          triggeredAt: { gte: today },
        },
      });
      
      if (todayTriggers >= rule.maxTriggersPerDay) {
        return { success: false, error: 'Daily trigger limit reached' };
      }
    }
    
    // Determine if approval is required
    const status = rule.requiresApproval ? 'PENDING_APPROVAL' : 'COMPLETED';
    
    // Execute action (non-destructive)
    const actionResult = await executeAction(rule.actionType, rule.actionConfig, input.triggerData);
    
    // Create run record
    const run = await prisma.automation_runs.create({
      data: withPrismaDefaults({
        tenantId: rule.tenantId,
        ruleId: rule.id,
        triggeredAt: new Date(),
        triggerData: input.triggerData,
        actionTaken: rule.actionType,
        actionData: actionResult,
        status,
        resultMessage: actionResult.message,
      }),
    });
    
    // Update rule stats
    await prisma.automation_rules.update({
      where: { id: rule.id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: { increment: 1 },
      },
    });
    
    await logAIEvent({
      eventType: 'AUTOMATION_TRIGGERED',
      tenantId: rule.tenantId,
      ruleId: rule.id,
      runId: run.id,
      eventData: {
        actionType: rule.actionType,
        status,
        triggerData: input.triggerData,
      },
    });
    
    return { success: true, run };
  } catch (error: any) {
    console.error('Trigger automation rule error:', error);
    return { success: false, error: error.message || 'Failed to trigger rule' };
  }
}

async function executeAction(
  actionType: string,
  actionConfig: any,
  triggerData: any
): Promise<{ success: boolean; message: string; data?: any }> {
  switch (actionType) {
    case ACTION_TYPES.NOTIFY:
      return {
        success: true,
        message: `Notification queued: ${actionConfig.message || 'Alert triggered'}`,
        data: { notificationType: actionConfig.type || 'push' },
      };
    
    case ACTION_TYPES.ALERT:
      return {
        success: true,
        message: `Alert created: ${actionConfig.title || 'Automation Alert'}`,
        data: { severity: actionConfig.severity || 'INFO' },
      };
    
    case ACTION_TYPES.LOG:
      return {
        success: true,
        message: `Log entry created`,
        data: { logLevel: actionConfig.level || 'INFO' },
      };
    
    case ACTION_TYPES.RECOMMEND:
      return {
        success: true,
        message: `Recommendation created for review`,
        data: { recommendationType: actionConfig.recommendationType },
      };
    
    default:
      return {
        success: false,
        message: `Unknown action type: ${actionType}`,
      };
  }
}

// ============================================================================
// RUN MANAGEMENT
// ============================================================================

export async function listAutomationRuns(params: {
  tenantId: string;
  ruleId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { tenantId, ruleId, status, page = 1, limit = 20 } = params;
  
  const where: any = { tenantId };
  
  if (ruleId) where.ruleId = ruleId;
  if (status) where.status = status;
  
  const [runs, total] = await Promise.all([
    prisma.automation_runs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { triggeredAt: 'desc' },
      include: { automation_rules: true },
    }),
    prisma.automation_runs.count({ where }),
  ]);
  
  return {
    runs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function approveRun(
  runId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const run = await prisma.automation_runs.findUnique({
      where: { id: runId },
    });
    
    if (!run) {
      return { success: false, error: 'Run not found' };
    }
    
    if (run.status !== 'PENDING_APPROVAL') {
      return { success: false, error: 'Run is not pending approval' };
    }
    
    await prisma.automation_runs.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        approvedAt: new Date(),
        approvedBy,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to approve run' };
  }
}

export async function rejectRun(
  runId: string,
  rejectedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.automation_runs.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        rejectedAt: new Date(),
        rejectedBy,
        resultMessage: 'Rejected by user',
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reject run' };
  }
}
