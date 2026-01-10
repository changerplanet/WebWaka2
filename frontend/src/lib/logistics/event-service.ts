/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Event Service - Event consumption and emission
 * 
 * CONSUMES:
 * - ORDER_READY_FOR_DELIVERY (from POS/SVM/MVM)
 * - ORDER_CANCELLED (from POS/SVM/MVM)
 * 
 * EMITS:
 * - DELIVERY_ASSIGNED
 * - DELIVERY_PICKED_UP
 * - DELIVERY_IN_TRANSIT
 * - DELIVERY_COMPLETED
 * - DELIVERY_FAILED
 * 
 * NOTE: Events are IDEMPOTENT - processing same event twice is safe.
 */

import { prisma } from '@/lib/prisma'
import { AssignmentService } from './assignment-service'

// ============================================================================
// TYPES
// ============================================================================

export type LogisticsEventType =
  | 'DELIVERY_ASSIGNED'
  | 'DELIVERY_PICKED_UP'
  | 'DELIVERY_IN_TRANSIT'
  | 'DELIVERY_COMPLETED'
  | 'DELIVERY_FAILED'

export type ConsumedEventType =
  | 'ORDER_READY_FOR_DELIVERY'
  | 'ORDER_CANCELLED'

export interface LogisticsEvent {
  eventType: LogisticsEventType
  payload: {
    assignmentId: string
    orderId: string
    orderType: string
    agentId?: string | null
    customerId?: string | null
    reason?: string
  }
}

export interface OrderReadyEvent {
  eventType: 'ORDER_READY_FOR_DELIVERY'
  orderId: string
  orderType: 'POS_SALE' | 'SVM_ORDER' | 'MVM_ORDER'
  orderNumber?: string
  tenantId: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  deliveryAddress?: object
  deliveryLatitude?: number
  deliveryLongitude?: number
  pickupLocationId?: string
  orderValue?: number
  weightKg?: number
  priority?: 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'NEXT_DAY'
  scheduledDeliveryAt?: Date
  specialInstructions?: string
  metadata?: Record<string, unknown>
}

export interface OrderCancelledEvent {
  eventType: 'ORDER_CANCELLED'
  orderId: string
  orderType: string
  tenantId: string
  reason?: string
  cancelledBy?: string
}

// Event log for idempotency
interface EventLogEntry {
  eventId: string
  eventType: string
  processedAt: Date
}

// In-memory event log (in production, use Redis or database)
const processedEvents = new Map<string, EventLogEntry>()

// ============================================================================
// EVENT SERVICE
// ============================================================================

export class EventService {
  /**
   * Process incoming event (from POS/SVM/MVM)
   */
  static async processEvent(event: OrderReadyEvent | OrderCancelledEvent): Promise<boolean> {
    // Generate event ID for idempotency
    const eventId = `${event.eventType}:${event.orderId}:${event.orderType}`
    
    // Check if already processed (idempotency)
    if (processedEvents.has(eventId)) {
      console.log(`Event already processed: ${eventId}`)
      return true
    }

    try {
      switch (event.eventType) {
        case 'ORDER_READY_FOR_DELIVERY':
          await this.handleOrderReady(event as OrderReadyEvent)
          break
        
        case 'ORDER_CANCELLED':
          await this.handleOrderCancelled(event as OrderCancelledEvent)
          break
        
        default:
          console.log(`Unknown event type: ${(event as { eventType: string }).eventType}`)
          return false
      }

      // Mark as processed
      processedEvents.set(eventId, {
        eventId,
        eventType: event.eventType,
        processedAt: new Date(),
      })

      return true
    } catch (error) {
      console.error(`Error processing event ${eventId}:`, error)
      throw error
    }
  }

  /**
   * Handle ORDER_READY_FOR_DELIVERY event
   */
  private static async handleOrderReady(event: OrderReadyEvent) {
    // Check if assignment already exists
    const existing = await prisma.logistics_delivery_assignments.findUnique({
      where: {
        orderId_orderType: { orderId: event.orderId, orderType: event.orderType },
      },
    })

    if (existing) {
      console.log(`Assignment already exists for order ${event.orderId}`)
      return existing
    }

    // Get logistics config
    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId: event.tenantId },
    })

    if (!config?.deliveryEnabled) {
      console.log(`Logistics not enabled for tenant ${event.tenantId}`)
      return null
    }

    // Create assignment
    const assignment = await AssignmentService.createAssignment(event.tenantId, {
      orderId: event.orderId,
      orderType: event.orderType,
      orderNumber: event.orderNumber,
      customerId: event.customerId,
      customerName: event.customerName,
      customerPhone: event.customerPhone,
      deliveryAddress: event.deliveryAddress as {
        line1: string
        line2?: string
        city?: string
        state?: string
        lga?: string
        postalCode?: string
        country?: string
        landmark?: string
      },
      deliveryLatitude: event.deliveryLatitude,
      deliveryLongitude: event.deliveryLongitude,
      pickupLocationId: event.pickupLocationId,
      priority: event.priority,
      scheduledDeliveryAt: event.scheduledDeliveryAt,
      specialInstructions: event.specialInstructions,
      metadata: event.metadata,
    })

    // Auto-assign if enabled
    if (config.autoAssignmentEnabled) {
      try {
        await AssignmentService.autoAssign(
          event.tenantId,
          assignment.id,
          config.assignmentAlgorithm as 'NEAREST' | 'ROUND_ROBIN' | 'LEAST_BUSY',
          'SYSTEM'
        )
      } catch (error) {
        console.log(`Auto-assignment failed: ${error}`)
        // Continue without auto-assignment
      }
    }

    return assignment
  }

  /**
   * Handle ORDER_CANCELLED event
   */
  private static async handleOrderCancelled(event: OrderCancelledEvent) {
    const assignment = await prisma.logistics_delivery_assignments.findUnique({
      where: {
        orderId_orderType: { orderId: event.orderId, orderType: event.orderType },
      },
    })

    if (!assignment) {
      console.log(`No assignment found for cancelled order ${event.orderId}`)
      return null
    }

    // Only cancel if not already delivered
    if (assignment.status === 'DELIVERED') {
      console.log(`Cannot cancel delivered order ${event.orderId}`)
      return assignment
    }

    // Cancel the assignment
    return AssignmentService.cancelAssignment(
      event.tenantId,
      assignment.id,
      event.reason || 'Order cancelled',
      event.cancelledBy || 'SYSTEM'
    )
  }

  /**
   * Emit logistics event (to Core/other modules)
   * NOTE: In production, this would publish to a message queue
   */
  static async emitEvent(tenantId: string, event: LogisticsEvent) {
    // Log the event
    console.log(`[LOGISTICS EVENT] ${event.eventType}:`, event.payload)

    // In a real implementation, this would:
    // 1. Publish to message queue (RabbitMQ, Kafka, etc.)
    // 2. Or call webhook endpoints
    // 3. Or use Prisma events/subscriptions

    // For now, we'll trigger notifications via Core communication engine
    await this.triggerNotifications(tenantId, event)

    return event
  }

  /**
   * Trigger notifications based on event
   * NOTE: This hands off to Core Communication Engine
   */
  private static async triggerNotifications(tenantId: string, event: LogisticsEvent) {
    // Get config for notification preferences
    const config = await prisma.logistics_configurations.findUnique({
      where: { tenantId },
    })

    if (!config) return

    // Determine which notification to send
    const notificationMap: Record<string, {
      configKey: keyof typeof config
      template: string
    }> = {
      DELIVERY_ASSIGNED: { configKey: 'notifyCustomerOnAssignment', template: 'delivery_assigned' },
      DELIVERY_PICKED_UP: { configKey: 'notifyCustomerOnPickup', template: 'delivery_pickup' },
      DELIVERY_IN_TRANSIT: { configKey: 'notifyCustomerOnTransit', template: 'delivery_transit' },
      DELIVERY_COMPLETED: { configKey: 'notifyCustomerOnDelivery', template: 'delivery_complete' },
      DELIVERY_FAILED: { configKey: 'notifyCustomerOnFailure', template: 'delivery_failed' },
    }

    const notificationConfig = notificationMap[event.eventType]
    if (!notificationConfig) return

    if (!config[notificationConfig.configKey]) return

    // In production, this would call Core's notification API
    // For now, just log it
    console.log(`[NOTIFICATION] Would send ${notificationConfig.template} to customer ${event.payload.customerId}`)
  }

  /**
   * Get event processing history
   */
  static getProcessedEvents(): EventLogEntry[] {
    return Array.from(processedEvents.values())
  }

  /**
   * Clear event log (for testing)
   */
  static clearEventLog() {
    processedEvents.clear()
  }
}
