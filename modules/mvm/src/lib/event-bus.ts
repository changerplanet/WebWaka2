/**
 * MVM Event Bus
 * 
 * Centralized event system for Multi Vendor Marketplace module.
 * 
 * RULES:
 * - All events are module-scoped (mvm.*)
 * - No analytics logic inside module - events sent to Core
 * - Core handles inventory, payments, notifications
 * - Idempotency enforced via unique keys
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * All MVM event types - module-scoped with 'mvm.' prefix
 */
export const MVM_EVENT_TYPES = {
  // Vendor lifecycle
  VENDOR_CREATED: 'mvm.vendor.created',
  VENDOR_UPDATED: 'mvm.vendor.updated',
  VENDOR_APPROVED: 'mvm.vendor.approved',
  VENDOR_SUSPENDED: 'mvm.vendor.suspended',
  VENDOR_REJECTED: 'mvm.vendor.rejected',
  VENDOR_CHURNED: 'mvm.vendor.churned',
  
  // Vendor onboarding
  VENDOR_ONBOARDING_STARTED: 'mvm.vendor.onboarding_started',
  VENDOR_ONBOARDING_STEP_COMPLETED: 'mvm.vendor.onboarding_step_completed',
  VENDOR_ONBOARDING_COMPLETED: 'mvm.vendor.onboarding_completed',
  
  // Vendor staff
  VENDOR_STAFF_INVITED: 'mvm.vendor.staff_invited',
  VENDOR_STAFF_JOINED: 'mvm.vendor.staff_joined',
  VENDOR_STAFF_REMOVED: 'mvm.vendor.staff_removed',
  
  // Product mapping
  VENDOR_PRODUCT_ADDED: 'mvm.vendor.product_added',
  VENDOR_PRODUCT_REMOVED: 'mvm.vendor.product_removed',
  VENDOR_PRODUCT_UPDATED: 'mvm.vendor.product_updated',
  
  // Order splitting
  ORDER_SPLIT: 'mvm.order.split',
  SUBORDER_CREATED: 'mvm.suborder.created',
  SUBORDER_STATUS_CHANGED: 'mvm.suborder.status_changed',
  SUBORDER_ACCEPTED: 'mvm.suborder.accepted',
  SUBORDER_SHIPPED: 'mvm.suborder.shipped',
  SUBORDER_DELIVERED: 'mvm.suborder.delivered',
  SUBORDER_CANCELLED: 'mvm.suborder.cancelled',
  SUBORDER_REFUNDED: 'mvm.suborder.refunded',
  
  // Vendor order events
  VENDOR_ORDER_RECEIVED: 'mvm.vendor.order_received',
  VENDOR_ORDER_ACCEPTED: 'mvm.vendor.order_accepted',
  VENDOR_ORDER_FULFILLED: 'mvm.vendor.order_fulfilled',
  
  // Commission events
  COMMISSION_CALCULATED: 'mvm.commission.calculated',
  COMMISSION_EARNED: 'mvm.commission.earned',
  COMMISSION_ADJUSTED: 'mvm.commission.adjusted',
  
  // Payout events
  PAYOUT_SCHEDULED: 'mvm.payout.scheduled',
  PAYOUT_PROCESSING: 'mvm.payout.processing',
  PAYOUT_COMPLETED: 'mvm.payout.completed',
  PAYOUT_FAILED: 'mvm.payout.failed',
  PAYOUT_READY: 'mvm.payout.ready',
  
  // Tier events
  VENDOR_TIER_CHANGED: 'mvm.vendor.tier_changed',
  VENDOR_TIER_UPGRADED: 'mvm.vendor.tier_upgraded',
  VENDOR_TIER_DOWNGRADED: 'mvm.vendor.tier_downgraded',
} as const

export type MVMEventType = typeof MVM_EVENT_TYPES[keyof typeof MVM_EVENT_TYPES]

// ============================================================================
// EVENT PAYLOAD SCHEMAS
// ============================================================================

/**
 * Base event structure
 */
export interface MVMEventBase {
  eventId: string
  eventType: MVMEventType
  timestamp: string
  idempotencyKey: string
  tenantId: string
  version: '1.0'
}

/**
 * VENDOR_ONBOARDED payload
 */
export interface VendorOnboardedPayload {
  vendorId: string
  vendorName: string
  tenantId: string
  email: string
  tierId?: string
  tierName?: string
  commissionRate: number
  onboardedAt: string
}

/**
 * VENDOR_ORDER_RECEIVED payload
 */
export interface VendorOrderReceivedPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  parentOrderId: string
  parentOrderNumber: string
  itemCount: number
  grandTotal: number
  currency: string
  customerName?: string
  receivedAt: string
}

/**
 * VENDOR_ORDER_FULFILLED payload
 */
export interface VendorOrderFulfilledPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  parentOrderId: string
  grandTotal: number
  commissionAmount: number
  vendorEarnings: number
  fulfilledAt: string
}

/**
 * COMMISSION_EARNED payload
 */
export interface CommissionEarnedPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  orderTotal: number
  commissionRate: number
  commissionAmount: number
  vendorEarnings: number
  earnedAt: string
}

/**
 * ORDER_SPLIT payload
 */
export interface OrderSplitPayload {
  tenantId: string
  parentOrderId: string
  parentOrderNumber: string
  vendorCount: number
  subOrderIds: string[]
  subOrderNumbers: string[]
  totalAmount: number
  totalCommission: number
  splitAt: string
}

/**
 * SUBORDER_CREATED payload
 */
export interface SubOrderCreatedPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  parentOrderId: string
  parentOrderNumber: string
  itemCount: number
  grandTotal: number
  commissionAmount: number
  vendorEarnings: number
  createdAt: string
}

/**
 * PAYOUT_READY payload
 */
export interface PayoutReadyPayload {
  tenantId: string
  vendorId: string
  payoutRecordId: string
  grossAmount: number
  commissionAmount: number
  netAmount: number
  currency: string
  subOrderIds: string[]
  scheduledAt: string
}

// ============================================================================
// IDEMPOTENCY RULES
// ============================================================================

/**
 * Generate idempotency key for an event
 */
export function generateIdempotencyKey(
  eventType: MVMEventType,
  resourceId: string,
  action?: string,
  timeBucketMinutes?: number
): string {
  const parts = [eventType, resourceId]
  if (action) parts.push(action)
  
  if (timeBucketMinutes) {
    const now = new Date()
    const timeBucket = Math.floor(now.getTime() / (timeBucketMinutes * 60 * 1000))
    parts.push(String(timeBucket))
  } else {
    // Unique key with timestamp
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    parts.push(`${timestamp}${random}`)
  }
  
  return parts.join('_')
}

// ============================================================================
// EVENT EMITTER
// ============================================================================

export interface MVMEventEmitterConfig {
  coreEventsUrl: string
  tenantId: string
  retryAttempts?: number
  retryDelayMs?: number
}

export class MVMEventEmitter {
  private config: Required<MVMEventEmitterConfig>
  private eventQueue: Array<MVMEventBase & { payload: unknown }> = []
  
  constructor(config: MVMEventEmitterConfig) {
    this.config = {
      coreEventsUrl: config.coreEventsUrl,
      tenantId: config.tenantId,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000
    }
  }
  
  /**
   * Emit an event to Core
   */
  async emit<T extends Record<string, unknown>>(
    eventType: MVMEventType,
    payload: T,
    idempotencyKey?: string
  ): Promise<{ success: boolean; eventId: string; error?: string }> {
    const event: MVMEventBase & { payload: T } = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      idempotencyKey: idempotencyKey || generateIdempotencyKey(eventType, String(Date.now())),
      tenantId: this.config.tenantId,
      version: '1.0',
      payload
    }
    
    return this.sendToCore(event)
  }
  
  /**
   * Queue event for batch processing
   */
  queue<T extends Record<string, unknown>>(
    eventType: MVMEventType,
    payload: T,
    idempotencyKey?: string
  ): void {
    const event = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      idempotencyKey: idempotencyKey || generateIdempotencyKey(eventType, String(Date.now())),
      tenantId: this.config.tenantId,
      version: '1.0' as const,
      payload
    }
    
    this.eventQueue.push(event)
  }
  
  /**
   * Flush queued events
   */
  async flush(): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      const result = await this.sendToCore(event)
      if (result.success) success++
      else failed++
    }
    
    return { success, failed }
  }
  
  /**
   * Send event to Core
   */
  private async sendToCore(
    event: MVMEventBase & { payload: unknown }
  ): Promise<{ success: boolean; eventId: string; error?: string }> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.config.coreEventsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        })
        
        if (response.ok) {
          return { success: true, eventId: event.eventId }
        }
        
        if (response.status >= 400 && response.status < 500) {
          const data = await response.json().catch(() => ({}))
          return { success: false, eventId: event.eventId, error: data.error || `HTTP ${response.status}` }
        }
        
        lastError = new Error(`HTTP ${response.status}`)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
      }
      
      if (attempt < this.config.retryAttempts - 1) {
        await this.delay(this.config.retryDelayMs * (attempt + 1))
      }
    }
    
    return { success: false, eventId: event.eventId, error: lastError?.message }
  }
  
  private generateEventId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `mvm_evt_${timestamp}${random}`
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Create VENDOR_ONBOARDED event
 */
export function createVendorOnboardedEvent(
  payload: VendorOnboardedPayload
): { eventType: MVMEventType; payload: VendorOnboardedPayload; idempotencyKey: string } {
  return {
    eventType: MVM_EVENT_TYPES.VENDOR_ONBOARDING_COMPLETED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      MVM_EVENT_TYPES.VENDOR_ONBOARDING_COMPLETED,
      payload.vendorId,
      'onboarded'
    )
  }
}

/**
 * Create VENDOR_ORDER_RECEIVED event
 */
export function createVendorOrderReceivedEvent(
  payload: VendorOrderReceivedPayload
): { eventType: MVMEventType; payload: VendorOrderReceivedPayload; idempotencyKey: string } {
  return {
    eventType: MVM_EVENT_TYPES.VENDOR_ORDER_RECEIVED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      MVM_EVENT_TYPES.VENDOR_ORDER_RECEIVED,
      payload.subOrderId,
      'received'
    )
  }
}

/**
 * Create VENDOR_ORDER_FULFILLED event
 */
export function createVendorOrderFulfilledEvent(
  payload: VendorOrderFulfilledPayload
): { eventType: MVMEventType; payload: VendorOrderFulfilledPayload; idempotencyKey: string } {
  return {
    eventType: MVM_EVENT_TYPES.VENDOR_ORDER_FULFILLED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      MVM_EVENT_TYPES.VENDOR_ORDER_FULFILLED,
      payload.subOrderId,
      'fulfilled'
    )
  }
}

/**
 * Create COMMISSION_EARNED event
 */
export function createCommissionEarnedEvent(
  payload: CommissionEarnedPayload
): { eventType: MVMEventType; payload: CommissionEarnedPayload; idempotencyKey: string } {
  return {
    eventType: MVM_EVENT_TYPES.COMMISSION_EARNED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      MVM_EVENT_TYPES.COMMISSION_EARNED,
      payload.subOrderId,
      'earned'
    )
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let globalEmitter: MVMEventEmitter | null = null

export function initMVMEventEmitter(config: MVMEventEmitterConfig): MVMEventEmitter {
  globalEmitter = new MVMEventEmitter(config)
  return globalEmitter
}

export function getMVMEventEmitter(): MVMEventEmitter | null {
  return globalEmitter
}

export async function emitMVMEvent<T extends Record<string, unknown>>(
  eventType: MVMEventType,
  payload: T,
  idempotencyKey?: string
): Promise<{ success: boolean; eventId: string; error?: string }> {
  if (!globalEmitter) {
    return { success: false, eventId: '', error: 'Event emitter not initialized' }
  }
  return globalEmitter.emit(eventType, payload, idempotencyKey)
}
