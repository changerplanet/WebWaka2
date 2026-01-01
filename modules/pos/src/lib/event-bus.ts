/**
 * POS Event Bus
 * 
 * Handles event emission from POS module to Core.
 * Events are NOT processed here - they are sent to Core's event handler.
 * 
 * IMPORTANT:
 * - POS emits events
 * - Core subscribes and handles (inventory, payments, etc.)
 * - POS does NOT know what Core does with events
 */

import type { POSEvent } from './sale-engine'

// ============================================================================
// EVENT HANDLER TYPE
// ============================================================================

export type EventHandler = (event: POSEvent) => Promise<void>

// ============================================================================
// EVENT BUS
// ============================================================================

class POSEventBus {
  private handlers: Map<string, EventHandler[]> = new Map()
  private globalHandlers: EventHandler[] = []
  private eventLog: POSEvent[] = []
  private maxLogSize: number = 1000

  /**
   * Subscribe to a specific event type
   */
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) handlers.splice(index, 1)
      }
    }
  }

  /**
   * Subscribe to ALL events (for Core integration)
   */
  onAll(handler: EventHandler): () => void {
    this.globalHandlers.push(handler)
    return () => {
      const index = this.globalHandlers.indexOf(handler)
      if (index > -1) this.globalHandlers.splice(index, 1)
    }
  }

  /**
   * Emit an event
   */
  async emit(event: POSEvent): Promise<void> {
    // Log event
    this.eventLog.push(event)
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift()
    }

    // Call specific handlers
    const handlers = this.handlers.get(event.eventType) || []
    const allHandlers = [...handlers, ...this.globalHandlers]

    // Execute all handlers (fire and forget, don't block)
    await Promise.allSettled(
      allHandlers.map(handler => handler(event))
    )
  }

  /**
   * Get recent events (for debugging/sync)
   */
  getRecentEvents(count: number = 100): POSEvent[] {
    return this.eventLog.slice(-count)
  }

  /**
   * Get events since a timestamp
   */
  getEventsSince(timestamp: Date): POSEvent[] {
    return this.eventLog.filter(e => e.timestamp > timestamp)
  }

  /**
   * Clear event log (use with caution)
   */
  clearLog(): void {
    this.eventLog = []
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const posEventBus = new POSEventBus()

// ============================================================================
// HELPER: Create event emitter for SaleEngine
// ============================================================================

export function createEventEmitter(): (event: POSEvent) => Promise<void> {
  return async (event: POSEvent) => {
    await posEventBus.emit(event)
  }
}

// ============================================================================
// CORE INTEGRATION INTERFACE
// ============================================================================

/**
 * Interface for Core to implement when subscribing to POS events
 */
export interface CoreEventSubscriber {
  // Inventory events
  onInventoryDeductionRequested?: (event: Extract<POSEvent, { eventType: 'pos.inventory.deduction_requested' }>) => Promise<void>
  onInventoryReleaseRequested?: (event: Extract<POSEvent, { eventType: 'pos.inventory.release_requested' }>) => Promise<void>
  onInventoryReservationRequested?: (event: Extract<POSEvent, { eventType: 'pos.inventory.reservation_requested' }>) => Promise<void>

  // Sale events
  onSaleCompleted?: (event: Extract<POSEvent, { eventType: 'pos.sale.completed' }>) => Promise<void>
  onSaleVoided?: (event: Extract<POSEvent, { eventType: 'pos.sale.voided' }>) => Promise<void>
  onPaymentAdded?: (event: Extract<POSEvent, { eventType: 'pos.sale.payment_added' }>) => Promise<void>
}

/**
 * Register Core's event handlers
 */
export function registerCoreSubscriber(subscriber: CoreEventSubscriber): () => void {
  const unsubscribers: (() => void)[] = []

  if (subscriber.onInventoryDeductionRequested) {
    unsubscribers.push(
      posEventBus.on('pos.inventory.deduction_requested', subscriber.onInventoryDeductionRequested as EventHandler)
    )
  }

  if (subscriber.onInventoryReleaseRequested) {
    unsubscribers.push(
      posEventBus.on('pos.inventory.release_requested', subscriber.onInventoryReleaseRequested as EventHandler)
    )
  }

  if (subscriber.onInventoryReservationRequested) {
    unsubscribers.push(
      posEventBus.on('pos.inventory.reservation_requested', subscriber.onInventoryReservationRequested as EventHandler)
    )
  }

  if (subscriber.onSaleCompleted) {
    unsubscribers.push(
      posEventBus.on('pos.sale.completed', subscriber.onSaleCompleted as EventHandler)
    )
  }

  if (subscriber.onSaleVoided) {
    unsubscribers.push(
      posEventBus.on('pos.sale.voided', subscriber.onSaleVoided as EventHandler)
    )
  }

  if (subscriber.onPaymentAdded) {
    unsubscribers.push(
      posEventBus.on('pos.sale.payment_added', subscriber.onPaymentAdded as EventHandler)
    )
  }

  // Return function to unsubscribe all
  return () => unsubscribers.forEach(unsub => unsub())
}

// ============================================================================
// EXPORTS
// ============================================================================

export { POSEventBus }
