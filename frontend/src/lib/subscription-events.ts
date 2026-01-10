/**
 * Subscription Events
 * 
 * Defines and emits subscription lifecycle events.
 * 
 * EVENTS ARE MODULE-AGNOSTIC:
 * - They don't know about specific module implementations
 * - They provide raw data for commission calculation
 * - Partner ID is OPTIONAL - not all subscriptions have partners
 * 
 * EVENT CONSUMERS:
 * - Commission Engine (Phase 4)
 * - Analytics
 * - Webhooks
 * - Audit logging
 */

import { prisma } from './prisma'
import { 
  SubscriptionEventType, 
  BillingInterval,
  SubscriptionEvent 
} from '@prisma/client'

// ============================================================================
// EVENT PAYLOAD SCHEMA
// ============================================================================

/**
 * Standard event payload - all subscription events follow this schema
 */
export interface SubscriptionEventPayload {
  // Event identification
  eventType: SubscriptionEventType
  subscriptionId: string
  
  // Core identifiers
  tenantId: string
  partnerId: string | null  // OPTIONAL - null if no partner attribution
  
  // Module information (module-agnostic - just the list)
  modules: string[]
  
  // Billing information
  billingAmount: number | null
  billingCurrency: string | null
  billingInterval: BillingInterval | null
  
  // Period information
  periodStart: Date | null
  periodEnd: Date | null
  
  // Additional context
  metadata?: Record<string, any>
  
  // External reference
  externalEventId?: string
}

// ============================================================================
// EVENT SCHEMAS BY TYPE
// ============================================================================

/**
 * Event schemas with required fields per type
 */
export const EVENT_SCHEMAS: Record<SubscriptionEventType, {
  description: string
  requiredFields: string[]
  optionalFields: string[]
}> = {
  SUBSCRIPTION_CREATED: {
    description: 'New subscription created',
    requiredFields: ['tenantId', 'modules', 'billingAmount', 'billingCurrency', 'billingInterval'],
    optionalFields: ['partnerId', 'periodStart', 'periodEnd', 'metadata']
  },
  SUBSCRIPTION_ACTIVATED: {
    description: 'Subscription activated after payment',
    requiredFields: ['tenantId', 'modules', 'billingAmount', 'billingCurrency'],
    optionalFields: ['partnerId', 'periodStart', 'periodEnd', 'metadata']
  },
  SUBSCRIPTION_RENEWED: {
    description: 'Subscription renewed for new period',
    requiredFields: ['tenantId', 'modules', 'billingAmount', 'billingCurrency', 'periodStart', 'periodEnd'],
    optionalFields: ['partnerId', 'metadata']
  },
  SUBSCRIPTION_CANCELLED: {
    description: 'Subscription cancelled',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'billingAmount', 'periodEnd', 'metadata']
  },
  SUBSCRIPTION_PAUSED: {
    description: 'Subscription paused',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'metadata']
  },
  SUBSCRIPTION_RESUMED: {
    description: 'Subscription resumed from pause',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'billingAmount', 'periodStart', 'periodEnd', 'metadata']
  },
  SUBSCRIPTION_UPGRADED: {
    description: 'Subscription upgraded to higher plan',
    requiredFields: ['tenantId', 'modules', 'billingAmount', 'billingCurrency'],
    optionalFields: ['partnerId', 'periodStart', 'periodEnd', 'metadata']
  },
  SUBSCRIPTION_DOWNGRADED: {
    description: 'Subscription downgraded to lower plan',
    requiredFields: ['tenantId', 'modules', 'billingAmount', 'billingCurrency'],
    optionalFields: ['partnerId', 'periodStart', 'periodEnd', 'metadata']
  },
  SUBSCRIPTION_EXPIRED: {
    description: 'Subscription expired (period ended without renewal)',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'metadata']
  },
  PAYMENT_SUCCEEDED: {
    description: 'Payment processed successfully',
    requiredFields: ['tenantId', 'billingAmount', 'billingCurrency'],
    optionalFields: ['partnerId', 'modules', 'metadata', 'externalEventId']
  },
  PAYMENT_FAILED: {
    description: 'Payment failed',
    requiredFields: ['tenantId', 'billingAmount', 'billingCurrency'],
    optionalFields: ['partnerId', 'modules', 'metadata', 'externalEventId']
  },
  TRIAL_STARTED: {
    description: 'Trial period started',
    requiredFields: ['tenantId', 'modules', 'periodStart', 'periodEnd'],
    optionalFields: ['partnerId', 'metadata']
  },
  TRIAL_ENDED: {
    description: 'Trial period ended',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'metadata']
  },
  SUBSCRIPTION_SUSPENDED: {
    description: 'Subscription suspended due to payment failure',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'metadata']
  },
  SUBSCRIPTION_GRACE_PERIOD_STARTED: {
    description: 'Subscription entered grace period after payment failure',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'metadata', 'periodEnd']
  },
  SUBSCRIPTION_RECOVERED: {
    description: 'Subscription recovered after successful payment during grace period',
    requiredFields: ['tenantId', 'modules'],
    optionalFields: ['partnerId', 'billingAmount', 'metadata']
  }
}

// ============================================================================
// EVENT EMISSION
// ============================================================================

/**
 * Emit a subscription event
 * 
 * Events are stored in the database for:
 * - Commission calculation
 * - Analytics
 * - Audit trail
 * 
 * In production, this would also:
 * - Push to message queue
 * - Trigger webhooks
 * - Notify external systems
 */
export async function emitSubscriptionEvent(
  payload: SubscriptionEventPayload
): Promise<SubscriptionEvent> {
  // Store event in database
  const event = await (prisma.subscriptionEvent.create as any)({
    data: {
      subscriptionId: payload.subscriptionId,
      eventType: payload.eventType,
      tenantId: payload.tenantId,
      partnerId: payload.partnerId, // NULL if no partner
      modules: payload.modules,
      billingAmount: payload.billingAmount,
      billingCurrency: payload.billingCurrency,
      billingInterval: payload.billingInterval,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      metadata: payload.metadata,
      externalEventId: payload.externalEventId,
      occurredAt: new Date()
    }
  })
  
  // In production, emit to event bus/queue
  // await eventBus.emit(payload.eventType, event)
  
  // Notify listeners
  await notifyEventListeners(event)
  
  return event
}

/**
 * Batch emit events (for migration/import scenarios)
 */
export async function emitSubscriptionEvents(
  payloads: SubscriptionEventPayload[]
): Promise<SubscriptionEvent[]> {
  const events: SubscriptionEvent[] = []
  
  for (const payload of payloads) {
    const event = await emitSubscriptionEvent(payload)
    events.push(event)
  }
  
  return events
}

// ============================================================================
// EVENT LISTENERS (In-process)
// ============================================================================

type EventListener = (event: SubscriptionEvent) => Promise<void>

const eventListeners: Map<SubscriptionEventType | '*', EventListener[]> = new Map()

/**
 * Register an event listener
 * 
 * @example
 * ```typescript
 * // Listen to all events
 * onSubscriptionEvent('*', async (event) => {
 *   console.log('Event:', event.eventType)
 * })
 * 
 * // Listen to specific event
 * onSubscriptionEvent('SUBSCRIPTION_RENEWED', async (event) => {
 *   await calculateCommission(event)
 * })
 * ```
 */
export function onSubscriptionEvent(
  eventType: SubscriptionEventType | '*',
  listener: EventListener
): () => void {
  const listeners = eventListeners.get(eventType) || []
  listeners.push(listener)
  eventListeners.set(eventType, listeners)
  
  // Return unsubscribe function
  return () => {
    const current = eventListeners.get(eventType) || []
    const index = current.indexOf(listener)
    if (index > -1) {
      current.splice(index, 1)
      eventListeners.set(eventType, current)
    }
  }
}

/**
 * Notify all registered listeners
 */
async function notifyEventListeners(event: SubscriptionEvent): Promise<void> {
  // Notify specific listeners
  const specificListeners = eventListeners.get(event.eventType) || []
  for (const listener of specificListeners) {
    try {
      await listener(event)
    } catch (error) {
      console.error(`Error in event listener for ${event.eventType}:`, error)
    }
  }
  
  // Notify wildcard listeners
  const wildcardListeners = eventListeners.get('*') || []
  for (const listener of wildcardListeners) {
    try {
      await listener(event)
    } catch (error) {
      console.error(`Error in wildcard event listener:`, error)
    }
  }
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

/**
 * Get events for a subscription
 */
export async function getSubscriptionEvents(
  subscriptionId: string,
  options?: {
    eventTypes?: SubscriptionEventType[]
    limit?: number
    offset?: number
  }
): Promise<SubscriptionEvent[]> {
  return prisma.subscriptionEvent.findMany({
    where: {
      subscriptionId,
      ...(options?.eventTypes && {
        eventType: { in: options.eventTypes }
      })
    },
    orderBy: { occurredAt: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0
  })
}

/**
 * Get events for a tenant
 */
export async function getTenantEvents(
  tenantId: string,
  options?: {
    eventTypes?: SubscriptionEventType[]
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<SubscriptionEvent[]> {
  return prisma.subscriptionEvent.findMany({
    where: {
      tenantId,
      ...(options?.eventTypes && {
        eventType: { in: options.eventTypes }
      }),
      ...(options?.startDate && {
        occurredAt: { gte: options.startDate }
      }),
      ...(options?.endDate && {
        occurredAt: { lte: options.endDate }
      })
    },
    orderBy: { occurredAt: 'desc' },
    take: options?.limit || 100
  })
}

/**
 * Get events for a partner (for commission calculation)
 * 
 * This is used by the Commission Engine (Phase 4)
 */
export async function getPartnerEvents(
  partnerId: string,
  options?: {
    eventTypes?: SubscriptionEventType[]
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<SubscriptionEvent[]> {
  return prisma.subscriptionEvent.findMany({
    where: {
      partnerId, // Only events with this partner
      ...(options?.eventTypes && {
        eventType: { in: options.eventTypes }
      }),
      ...(options?.startDate && {
        occurredAt: { gte: options.startDate }
      }),
      ...(options?.endDate && {
        occurredAt: { lte: options.endDate }
      })
    },
    orderBy: { occurredAt: 'desc' },
    take: options?.limit || 1000
  })
}

/**
 * Get billable events for a period (for commission calculation)
 */
export async function getBillableEvents(
  partnerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<SubscriptionEvent[]> {
  return prisma.subscriptionEvent.findMany({
    where: {
      partnerId,
      eventType: {
        in: [
          'SUBSCRIPTION_ACTIVATED',
          'SUBSCRIPTION_RENEWED',
          'PAYMENT_SUCCEEDED'
        ]
      },
      occurredAt: {
        gte: periodStart,
        lte: periodEnd
      },
      billingAmount: { not: null }
    },
    orderBy: { occurredAt: 'asc' }
  })
}

// ============================================================================
// EVENT EMISSION POINTS
// ============================================================================

/**
 * Document where events should be emitted in the subscription lifecycle
 */
export const EVENT_EMISSION_POINTS = {
  SUBSCRIPTION_CREATED: 'After subscription record is created in database',
  SUBSCRIPTION_ACTIVATED: 'After first successful payment',
  SUBSCRIPTION_RENEWED: 'After successful renewal payment',
  SUBSCRIPTION_CANCELLED: 'After cancellation is processed',
  SUBSCRIPTION_PAUSED: 'After pause is processed',
  SUBSCRIPTION_RESUMED: 'After resume is processed',
  SUBSCRIPTION_UPGRADED: 'After plan upgrade is processed',
  SUBSCRIPTION_DOWNGRADED: 'After plan downgrade is processed',
  SUBSCRIPTION_EXPIRED: 'When period ends without renewal',
  PAYMENT_SUCCEEDED: 'After payment provider confirms success',
  PAYMENT_FAILED: 'After payment provider confirms failure',
  TRIAL_STARTED: 'When trial period begins',
  TRIAL_ENDED: 'When trial period expires'
} as const

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Events that trigger commission calculation
 */
export const COMMISSION_TRIGGERING_EVENTS: SubscriptionEventType[] = [
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_RENEWED',
  'PAYMENT_SUCCEEDED'
]

/**
 * Events that indicate subscription ended
 */
export const SUBSCRIPTION_END_EVENTS: SubscriptionEventType[] = [
  'SUBSCRIPTION_CANCELLED',
  'SUBSCRIPTION_EXPIRED'
]
