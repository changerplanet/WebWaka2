/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Grace Period & Suspension Service
 * 
 * Manages grace periods and suspension policies.
 * 
 * Nigeria-First Considerations:
 * - Payment delays common
 * - Manual overrides allowed with audit trail
 * - Core remains enforcement layer
 */

import { PrismaClient } from '@prisma/client';
import { logBillingEvent } from './event-service';

const prisma = new PrismaClient();

// ============================================================================
// GRACE POLICY MANAGEMENT
// ============================================================================

interface CreateGracePolicyInput {
  tenantId?: string | null;  // null = global policy
  name: string;
  description?: string;
  graceDays?: number;
  limitFeatures?: boolean;
  sendReminders?: boolean;
  reminderDays?: number[];
  suspendAfterGrace?: boolean;
  dataRetentionDays?: number;
  manualOverrideAllowed?: boolean;
  isDefault?: boolean;
}

export async function createGracePolicy(input: CreateGracePolicyInput): Promise<{
  success: boolean;
  policy?: any;
  error?: string;
}> {
  try {
    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.billingGracePolicy.updateMany({
        where: { tenantId: input.tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    const policy = await prisma.billingGracePolicy.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        description: input.description,
        graceDays: input.graceDays ?? 7,
        limitFeatures: input.limitFeatures ?? true,
        sendReminders: input.sendReminders ?? true,
        reminderDays: input.reminderDays ?? [1, 3, 7],
        suspendAfterGrace: input.suspendAfterGrace ?? true,
        dataRetentionDays: input.dataRetentionDays ?? 90,
        manualOverrideAllowed: input.manualOverrideAllowed ?? true,
        isActive: true,
        isDefault: input.isDefault ?? false,
      },
    });
    
    await logBillingEvent({
      eventType: 'GRACE_POLICY_CREATED',
      tenantId: input.tenantId || undefined,
      eventData: {
        policyId: policy.id,
        name: policy.name,
        graceDays: policy.graceDays,
      },
    });
    
    return { success: true, policy };
  } catch (error: any) {
    console.error('Create grace policy error:', error);
    return { success: false, error: error.message || 'Failed to create grace policy' };
  }
}

export async function getGracePolicy(policyId: string) {
  return prisma.billingGracePolicy.findUnique({
    where: { id: policyId },
  });
}

export async function getDefaultGracePolicy(tenantId?: string | null) {
  // Try tenant-specific default first
  if (tenantId) {
    const tenantPolicy = await prisma.billingGracePolicy.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
    });
    
    if (tenantPolicy) return tenantPolicy;
  }
  
  // Fall back to global default
  return prisma.billingGracePolicy.findFirst({
    where: { tenantId: null, isDefault: true, isActive: true },
  });
}

export async function listGracePolicies(params: {
  tenantId?: string | null;
  activeOnly?: boolean;
}) {
  const { tenantId, activeOnly = true } = params;
  
  const where: any = {};
  
  if (tenantId !== undefined) {
    where.OR = [
      { tenantId: null },
      { tenantId },
    ];
  }
  
  if (activeOnly) {
    where.isActive = true;
  }
  
  return prisma.billingGracePolicy.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function updateGracePolicy(
  policyId: string,
  data: {
    name?: string;
    description?: string;
    graceDays?: number;
    limitFeatures?: boolean;
    sendReminders?: boolean;
    reminderDays?: number[];
    suspendAfterGrace?: boolean;
    dataRetentionDays?: number;
    manualOverrideAllowed?: boolean;
    isActive?: boolean;
  }
): Promise<{ success: boolean; policy?: any; error?: string }> {
  try {
    const policy = await prisma.billingGracePolicy.update({
      where: { id: policyId },
      data,
    });
    return { success: true, policy };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update policy' };
  }
}

// ============================================================================
// GRACE PERIOD HANDLING
// ============================================================================

interface StartGracePeriodInput {
  tenantId: string;
  subscriptionId: string;
  policyId?: string;
  reason?: string;
}

export async function startGracePeriod(input: StartGracePeriodInput): Promise<{
  success: boolean;
  graceEndDate?: Date;
  error?: string;
}> {
  try {
    // Get applicable policy
    const policy = input.policyId
      ? await getGracePolicy(input.policyId)
      : await getDefaultGracePolicy(input.tenantId);
    
    if (!policy) {
      return { success: false, error: 'No grace policy found' };
    }
    
    const graceEndDate = new Date();
    graceEndDate.setDate(graceEndDate.getDate() + policy.graceDays);
    
    // Emit event for Core to handle status change
    await logBillingEvent({
      eventType: 'GRACE_PERIOD_STARTED',
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      eventData: {
        policyId: policy.id,
        graceDays: policy.graceDays,
        graceEndDate,
        limitFeatures: policy.limitFeatures,
        reason: input.reason || 'Payment failed',
      },
    });
    
    // Schedule reminders if enabled
    if (policy.sendReminders && policy.reminderDays.length > 0) {
      await logBillingEvent({
        eventType: 'GRACE_REMINDERS_SCHEDULED',
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        eventData: {
          reminderDays: policy.reminderDays,
          graceEndDate,
        },
      });
    }
    
    return { success: true, graceEndDate };
  } catch (error: any) {
    console.error('Start grace period error:', error);
    return { success: false, error: error.message || 'Failed to start grace period' };
  }
}

interface EndGracePeriodInput {
  tenantId: string;
  subscriptionId: string;
  reason: 'PAYMENT_RECEIVED' | 'GRACE_EXPIRED' | 'MANUAL_OVERRIDE';
  overrideBy?: string;
}

export async function endGracePeriod(input: EndGracePeriodInput): Promise<{
  success: boolean;
  shouldSuspend?: boolean;
  error?: string;
}> {
  try {
    const policy = await getDefaultGracePolicy(input.tenantId);
    
    let shouldSuspend = false;
    
    if (input.reason === 'GRACE_EXPIRED' && policy?.suspendAfterGrace) {
      shouldSuspend = true;
      
      // Request suspension from Core
      await logBillingEvent({
        eventType: 'SUSPENSION_REQUESTED',
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        eventData: {
          reason: 'Grace period expired without payment',
          dataRetentionDays: policy.dataRetentionDays,
        },
      });
    }
    
    await logBillingEvent({
      eventType: 'GRACE_PERIOD_ENDED',
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      eventData: {
        reason: input.reason,
        shouldSuspend,
        overrideBy: input.overrideBy,
      },
    });
    
    return { success: true, shouldSuspend };
  } catch (error: any) {
    console.error('End grace period error:', error);
    return { success: false, error: error.message || 'Failed to end grace period' };
  }
}

// ============================================================================
// MANUAL OVERRIDE (Nigeria-First)
// ============================================================================

interface ManualOverrideInput {
  tenantId: string;
  subscriptionId: string;
  action: 'EXTEND_GRACE' | 'SKIP_SUSPENSION' | 'RESTORE_ACCESS';
  extensionDays?: number;
  reason: string;
  overrideBy: string;
}

export async function applyManualOverride(input: ManualOverrideInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const policy = await getDefaultGracePolicy(input.tenantId);
    
    if (!policy?.manualOverrideAllowed) {
      return { success: false, error: 'Manual overrides not allowed by policy' };
    }
    
    await logBillingEvent({
      eventType: 'GRACE_MANUAL_OVERRIDE',
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      actorId: input.overrideBy,
      eventData: {
        action: input.action,
        extensionDays: input.extensionDays,
        reason: input.reason,
      },
    });
    
    // Emit specific action events
    switch (input.action) {
      case 'EXTEND_GRACE':
        await logBillingEvent({
          eventType: 'GRACE_PERIOD_EXTENDED',
          tenantId: input.tenantId,
          subscriptionId: input.subscriptionId,
          eventData: {
            extensionDays: input.extensionDays || 7,
            reason: input.reason,
          },
        });
        break;
      
      case 'RESTORE_ACCESS':
        await logBillingEvent({
          eventType: 'ACCESS_RESTORED',
          tenantId: input.tenantId,
          subscriptionId: input.subscriptionId,
          eventData: {
            reason: input.reason,
            pendingPayment: true,  // Access restored with pending payment
          },
        });
        break;
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Manual override error:', error);
    return { success: false, error: error.message || 'Failed to apply override' };
  }
}

// ============================================================================
// SUSPENSION QUERIES
// ============================================================================

export async function getGraceStatus(tenantId: string, subscriptionId: string): Promise<{
  inGrace: boolean;
  graceStartDate?: Date;
  graceEndDate?: Date;
  daysRemaining?: number;
  featuresLimited?: boolean;
}> {
  // This would query subscription status from Core
  // For now, return default non-grace status
  return {
    inGrace: false,
  };
}
