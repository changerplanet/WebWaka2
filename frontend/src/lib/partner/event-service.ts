/**
 * MODULE 11: PARTNER & RESELLER PLATFORM
 * Event Service
 * 
 * Handles event logging and processing.
 * 
 * EVENTS CONSUMED:
 * - TENANT_CREATED
 * - SUBSCRIPTION_CREATED
 * - SUBSCRIPTION_RENEWED
 * - SUBSCRIPTION_UPGRADED
 * - PAYMENT_COMPLETED
 * 
 * EVENTS EMITTED:
 * - PARTNER_CREATED
 * - PARTNER_VERIFIED
 * - PARTNER_ACTIVATED
 * - PARTNER_ATTRIBUTED
 * - COMMISSION_EARNED
 * - COMMISSION_READY_FOR_PAYOUT
 */

import { PrismaClient } from '@prisma/client';
import { getAttributionByTenant, lockAttribution } from './referral-service';
import { calculateCommission } from './commission-service';

const prisma = new PrismaClient();

// ============================================================================
// EVENT LOGGING
// ============================================================================

interface LogEventInput {
  eventType: string;
  partnerId?: string;
  attributionId?: string;
  commissionId?: string;
  actorId?: string;
  actorType?: string;
  eventData: Record<string, any>;
}

export async function logPartnerEvent(input: LogEventInput): Promise<void> {
  try {
    await prisma.partner_event_logs_ext.create({
      data: {
        eventType: input.eventType,
        partnerId: input.partnerId,
        attributionId: input.attributionId,
        commissionId: input.commissionId,
        actorId: input.actorId,
        actorType: input.actorType,
        eventData: input.eventData,
        occurredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log partner event:', error);
    // Don't throw - logging should not break main flow
  }
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

export async function getPartnerEvents(params: {
  partnerId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { partnerId, eventType, startDate, endDate, page = 1, limit = 50 } = params;
  
  const where: any = {};
  
  if (partnerId) where.partnerId = partnerId;
  if (eventType) where.eventType = eventType;
  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) where.occurredAt.gte = startDate;
    if (endDate) where.occurredAt.lte = endDate;
  }
  
  const [events, total] = await Promise.all([
    prisma.partner_event_logs_ext.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { occurredAt: 'desc' },
    }),
    prisma.partner_event_logs_ext.count({ where }),
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
 * Handle SUBSCRIPTION_CREATED event
 * - Lock attribution
 * - Calculate initial commission
 */
export async function handleSubscriptionCreated(event: {
  tenantId: string;
  subscriptionId: string;
  planId?: string;
  amount: number;
  currency?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if tenant has partner attribution
    const attribution = await getAttributionByTenant(event.tenantId);
    
    if (!attribution) {
      // No partner attribution, nothing to do
      return { success: true };
    }
    
    // Lock attribution on first subscription
    if (!attribution.isLocked) {
      await lockAttribution(event.tenantId);
    }
    
    // Calculate commission
    await calculateCommission({
      partnerId: attribution.partnerId,
      attributionId: attribution.id,
      eventType: 'SUBSCRIPTION_CREATED',
      eventId: event.subscriptionId,
      grossAmount: event.amount,
      currency: event.currency,
      planId: event.planId,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle subscription created error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle SUBSCRIPTION_RENEWED event
 * - Calculate recurring commission (if applicable)
 */
export async function handleSubscriptionRenewed(event: {
  tenantId: string;
  subscriptionId: string;
  planId?: string;
  amount: number;
  currency?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const attribution = await getAttributionByTenant(event.tenantId);
    
    if (!attribution || !attribution.isLocked) {
      return { success: true };
    }
    
    // Calculate recurring commission
    await calculateCommission({
      partnerId: attribution.partnerId,
      attributionId: attribution.id,
      eventType: 'SUBSCRIPTION_RENEWED',
      eventId: event.subscriptionId,
      grossAmount: event.amount,
      currency: event.currency,
      planId: event.planId,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle subscription renewed error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle SUBSCRIPTION_UPGRADED event
 * - Calculate upgrade commission
 */
export async function handleSubscriptionUpgraded(event: {
  tenantId: string;
  subscriptionId: string;
  oldPlanId?: string;
  newPlanId?: string;
  amount: number;
  currency?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const attribution = await getAttributionByTenant(event.tenantId);
    
    if (!attribution || !attribution.isLocked) {
      return { success: true };
    }
    
    // Calculate upgrade commission
    await calculateCommission({
      partnerId: attribution.partnerId,
      attributionId: attribution.id,
      eventType: 'SUBSCRIPTION_UPGRADED',
      eventId: event.subscriptionId,
      grossAmount: event.amount,
      currency: event.currency,
      planId: event.newPlanId,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Handle subscription upgraded error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// IDEMPOTENCY
// ============================================================================

/**
 * Check if an event has already been processed
 * Used to ensure idempotent event handling
 */
export async function isEventProcessed(
  eventType: string,
  eventId: string
): Promise<boolean> {
  const existing = await prisma.partner_event_logs_ext.findFirst({
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
