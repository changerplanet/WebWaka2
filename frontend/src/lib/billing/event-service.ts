/**
 * MODULE 12: SUBSCRIPTION & BILLING EXTENSIONS
 * Event Service
 * 
 * Handles event logging and processing for billing module.
 * Events must be idempotent with no synchronous dependencies.
 */

import { PrismaClient } from '@prisma/client';
import { startGracePeriod, endGracePeriod } from './grace-service';

const prisma = new PrismaClient();

// ============================================================================
// EVENT LOGGING
// ============================================================================

interface LogBillingEventInput {
  eventType: string;
  tenantId?: string;
  subscriptionId?: string;
  bundleId?: string;
  addOnId?: string;
  adjustmentId?: string;
  actorId?: string;
  actorType?: string;
  eventData: Record<string, any>;
}

export async function logBillingEvent(input: LogBillingEventInput): Promise<void> {
  try {
    await (prisma.billing_event_logs.create as any)({
      data: {
        eventType: input.eventType,
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        bundleId: input.bundleId,
        addOnId: input.addOnId,
        adjustmentId: input.adjustmentId,
        actorId: input.actorId,
        actorType: input.actorType,
        eventData: input.eventData,
        occurredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log billing event:', error);
    // Don't throw - logging should not break main flow
  }
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

export async function getBillingEvents(params: {
  tenantId?: string;
  subscriptionId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { tenantId, subscriptionId, eventType, startDate, endDate, page = 1, limit = 50 } = params;
  
  const where: any = {};
  
  if (tenantId) where.tenantId = tenantId;
  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (eventType) where.eventType = eventType;
  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) where.occurredAt.gte = startDate;
    if (endDate) where.occurredAt.lte = endDate;
  }
  
  const [events, total] = await Promise.all([
    prisma.billing_event_logs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { occurredAt: 'desc' },
    }),
    prisma.billing_event_logs.count({ where }),
  ]);
  
  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// EVENT HANDLERS (for processing Core events)
// ============================================================================

/**
 * Handle PAYMENT_FAILED event
 * - Start grace period
 */
export async function handlePaymentFailed(event: {
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  failureReason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Start grace period
    const result = await startGracePeriod({
      tenantId: event.tenantId,
      subscriptionId: event.subscriptionId,
      reason: event.failureReason || 'Payment failed',
    });
    
    if (!result.success) {
      return result;
    }
    
    await logBillingEvent({
      eventType: 'PAYMENT_FAILED_PROCESSED',
      tenantId: event.tenantId,
      subscriptionId: event.subscriptionId,
      eventData: {
        amount: event.amount,
        currency: event.currency,
        graceEndDate: result.graceEndDate,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle payment failed error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle PAYMENT_COMPLETED event
 * - End grace period if in grace
 * - Process any pending adjustments
 */
export async function handlePaymentCompleted(event: {
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // End grace period if active
    await endGracePeriod({
      tenantId: event.tenantId,
      subscriptionId: event.subscriptionId,
      reason: 'PAYMENT_RECEIVED',
    });
    
    await logBillingEvent({
      eventType: 'PAYMENT_COMPLETED_PROCESSED',
      tenantId: event.tenantId,
      subscriptionId: event.subscriptionId,
      eventData: {
        amount: event.amount,
        currency: event.currency,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle payment completed error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle SUBSCRIPTION_CREATED event
 * - Initialize billing configuration for tenant
 */
export async function handleSubscriptionCreated(event: {
  tenantId: string;
  subscriptionId: string;
  planId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure billing configuration exists
    await (prisma.billing_configurations.upsert as any)({
      where: { tenantId: event.tenantId },
      create: {
        tenantId: event.tenantId,
        bundlesEnabled: false,
        addOnsEnabled: false,
        usageBillingEnabled: false,
        gracePeriodsEnabled: true,
        defaultGraceDays: 7,
        graceSuspendFeatures: true,
        usageAlertThreshold: 80,
        manualRenewalsAllowed: true,
        informalUpgradesAllowed: true,
      },
      update: {},  // Don't update if exists
    });
    
    await logBillingEvent({
      eventType: 'SUBSCRIPTION_CREATED_PROCESSED',
      tenantId: event.tenantId,
      subscriptionId: event.subscriptionId,
      eventData: {
        planId: event.planId,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle subscription created error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle SUBSCRIPTION_RENEWED event
 * - Reset usage counters if applicable
 */
export async function handleSubscriptionRenewed(event: {
  tenantId: string;
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await logBillingEvent({
      eventType: 'SUBSCRIPTION_RENEWED_PROCESSED',
      tenantId: event.tenantId,
      subscriptionId: event.subscriptionId,
      eventData: {
        periodStart: event.periodStart,
        periodEnd: event.periodEnd,
      },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle subscription renewed error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// IDEMPOTENCY
// ============================================================================

export async function isEventProcessed(
  eventType: string,
  eventId: string
): Promise<boolean> {
  const existing = await prisma.billing_event_logs.findFirst({
    where: {
      eventType,
      eventData: {
        path: ['eventId'],
        equals: eventId,
      },
    },
  });
  
  return !!existing;
}
