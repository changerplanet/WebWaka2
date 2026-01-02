/**
 * SVM Event Bus
 * 
 * Centralized event system for Single Vendor Marketplace module.
 * 
 * RULES:
 * - All events are module-scoped (svm.*)
 * - No analytics logic inside module - events sent to Core
 * - Core handles inventory, payments, notifications
 * - Idempotency enforced via unique keys
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * All SVM event types - module-scoped with 'svm.' prefix
 */
export const SVM_EVENT_TYPES = {
  // Order lifecycle
  ORDER_CREATED: 'svm.order.created',
  ORDER_PLACED: 'svm.order.placed',
  ORDER_PAYMENT_REQUESTED: 'svm.order.payment_requested',
  ORDER_PAID: 'svm.order.paid',
  ORDER_PROCESSING: 'svm.order.processing',
  ORDER_SHIPPED: 'svm.order.shipped',
  ORDER_DELIVERED: 'svm.order.delivered',
  ORDER_FULFILLED: 'svm.order.fulfilled',
  ORDER_CANCELLED: 'svm.order.cancelled',
  ORDER_REFUND_REQUESTED: 'svm.order.refund_requested',
  ORDER_REFUNDED: 'svm.order.refunded',
  ORDER_STATUS_CHANGED: 'svm.order.status_changed',
  
  // Cart events
  CART_ITEM_ADDED: 'svm.cart.item_added',
  CART_ITEM_REMOVED: 'svm.cart.item_removed',
  CART_ITEM_UPDATED: 'svm.cart.item_updated',
  CART_CLEARED: 'svm.cart.cleared',
  CART_ABANDONED: 'svm.cart.abandoned',
  
  // Product events
  PRODUCT_VIEWED: 'svm.product.viewed',
  PRODUCT_SEARCHED: 'svm.product.searched',
  
  // Promotion events
  PROMOTION_APPLIED: 'svm.promotion.applied',
  PROMOTION_REMOVED: 'svm.promotion.removed',
  PROMOTION_VALIDATION_FAILED: 'svm.promotion.validation_failed',
  
  // Wishlist events
  WISHLIST_ITEM_ADDED: 'svm.wishlist.item_added',
  WISHLIST_ITEM_REMOVED: 'svm.wishlist.item_removed',
  
  // Review events
  REVIEW_SUBMITTED: 'svm.review.submitted',
  REVIEW_APPROVED: 'svm.review.approved',
  REVIEW_REJECTED: 'svm.review.rejected',
  
  // Storefront events
  STOREFRONT_PAGE_VIEWED: 'svm.storefront.page_viewed',
  STOREFRONT_CHECKOUT_STARTED: 'svm.storefront.checkout_started',
  STOREFRONT_CHECKOUT_COMPLETED: 'svm.storefront.checkout_completed',
} as const

export type SVMEventType = typeof SVM_EVENT_TYPES[keyof typeof SVM_EVENT_TYPES]

// ============================================================================
// EVENT PAYLOAD SCHEMAS
// ============================================================================

/**
 * Base event structure - all events must have these fields
 */
export interface SVMEventBase {
  eventId: string
  eventType: SVMEventType
  timestamp: string
  idempotencyKey: string
  tenantId: string
  version: '1.0'
}

/**
 * ORDER_PLACED payload - Main event for order submission
 */
export interface OrderPlacedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string
  guestEmail?: string
  items: Array<{
    productId: string
    variantId?: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  currency: string
  shippingAddress: {
    name: string
    address1: string
    address2?: string
    city: string
    state?: string
    postalCode: string
    country: string
    phone?: string
  }
  shippingMethod?: string
  promotionCode?: string
}

/**
 * ORDER_PAID payload - Payment confirmation
 */
export interface OrderPaidPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  corePaymentId: string
  amount: number
  currency: string
  paidAt: string
}

/**
 * ORDER_FULFILLED payload - Order complete
 */
export interface OrderFulfilledPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  fulfilledAt: string
  deliveryConfirmed: boolean
}

/**
 * ORDER_CANCELLED payload - Order cancellation
 */
export interface OrderCancelledPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  reason: string
  cancelledBy: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
  cancelledByUserId?: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
  wasPaymentCaptured: boolean
  corePaymentId?: string
  refundAmount?: number
}

/**
 * Cart event payloads
 */
export interface CartItemAddedPayload {
  tenantId: string
  cartId?: string
  sessionId?: string
  customerId?: string
  productId: string
  variantId?: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface CartAbandonedPayload {
  tenantId: string
  cartId: string
  customerId?: string
  sessionId?: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  abandonedAt: string
  lastActivityAt: string
}

/**
 * Product event payloads
 */
export interface ProductViewedPayload {
  tenantId: string
  productId: string
  productName: string
  categoryId?: string
  customerId?: string
  sessionId?: string
  source?: 'search' | 'category' | 'direct' | 'recommendation'
}

/**
 * Promotion event payloads
 */
export interface PromotionAppliedPayload {
  tenantId: string
  promotionId: string
  promotionCode?: string
  promotionName: string
  discountType: string
  discountAmount: number
  orderId?: string
  cartId?: string
  customerId?: string
}

/**
 * Review event payloads
 */
export interface ReviewSubmittedPayload {
  tenantId: string
  reviewId: string
  productId: string
  customerId: string
  rating: number
  title?: string
  verifiedPurchase: boolean
}

// ============================================================================
// IDEMPOTENCY RULES
// ============================================================================

/**
 * Generate idempotency key for an event
 * 
 * Rules:
 * - Keys are deterministic based on event context
 * - Same action on same resource generates same key
 * - Format: {eventType}_{resourceId}_{action}_{timestamp_bucket}
 * 
 * This prevents duplicate event processing while allowing
 * legitimate retries within the same time bucket.
 */
export function generateIdempotencyKey(
  eventType: SVMEventType,
  resourceId: string,
  action?: string,
  timeBucketMinutes: number = 5
): string {
  const now = new Date()
  const timeBucket = Math.floor(now.getTime() / (timeBucketMinutes * 60 * 1000))
  const parts = [eventType, resourceId]
  if (action) parts.push(action)
  parts.push(String(timeBucket))
  return parts.join('_')
}

/**
 * Generate unique idempotency key (no time bucket)
 * Use for one-time events that should never be duplicated
 */
export function generateUniqueIdempotencyKey(
  eventType: SVMEventType,
  resourceId: string
): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${eventType}_${resourceId}_${timestamp}${random}`
}

// ============================================================================
// EVENT EMITTER
// ============================================================================

export interface SVMEventEmitterConfig {
  coreEventsUrl: string
  tenantId: string
  retryAttempts?: number
  retryDelayMs?: number
}

/**
 * SVM Event Emitter
 * 
 * Sends events to the SaaS Core for processing.
 * Core handles:
 * - Inventory reservation/release
 * - Payment processing
 * - Email notifications
 * - Analytics aggregation
 */
export class SVMEventEmitter {
  private config: Required<SVMEventEmitterConfig>
  private eventQueue: Array<SVMEventBase & { payload: unknown }> = []
  private isProcessing = false
  
  constructor(config: SVMEventEmitterConfig) {
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
    eventType: SVMEventType,
    payload: T,
    idempotencyKey?: string
  ): Promise<{ success: boolean; eventId: string; error?: string }> {
    const event: SVMEventBase & { payload: T } = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      idempotencyKey: idempotencyKey || generateUniqueIdempotencyKey(eventType, String(Date.now())),
      tenantId: this.config.tenantId,
      version: '1.0',
      payload
    }
    
    return this.sendToCore(event)
  }
  
  /**
   * Queue an event for batch processing
   */
  queue<T extends Record<string, unknown>>(
    eventType: SVMEventType,
    payload: T,
    idempotencyKey?: string
  ): void {
    const event = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      idempotencyKey: idempotencyKey || generateUniqueIdempotencyKey(eventType, String(Date.now())),
      tenantId: this.config.tenantId,
      version: '1.0' as const,
      payload
    }
    
    this.eventQueue.push(event)
  }
  
  /**
   * Flush all queued events
   */
  async flush(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing) {
      return { success: 0, failed: 0 }
    }
    
    this.isProcessing = true
    let success = 0
    let failed = 0
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      const result = await this.sendToCore(event)
      if (result.success) {
        success++
      } else {
        failed++
      }
    }
    
    this.isProcessing = false
    return { success, failed }
  }
  
  /**
   * Send event to Core with retry logic
   */
  private async sendToCore(
    event: SVMEventBase & { payload: unknown }
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
          const data = await response.json()
          return { success: true, eventId: event.eventId, ...data }
        }
        
        // Non-retryable error (4xx)
        if (response.status >= 400 && response.status < 500) {
          const data = await response.json().catch(() => ({}))
          return { 
            success: false, 
            eventId: event.eventId, 
            error: data.error || `HTTP ${response.status}` 
          }
        }
        
        // Retryable error (5xx)
        lastError = new Error(`HTTP ${response.status}`)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
      }
      
      // Wait before retry
      if (attempt < this.config.retryAttempts - 1) {
        await this.delay(this.config.retryDelayMs * (attempt + 1))
      }
    }
    
    // Log failed event for debugging
    console.error('[SVM EventBus] Failed to emit event:', {
      eventId: event.eventId,
      eventType: event.eventType,
      error: lastError?.message
    })
    
    return { 
      success: false, 
      eventId: event.eventId, 
      error: lastError?.message || 'Unknown error' 
    }
  }
  
  private generateEventId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `evt_${timestamp}${random}`
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

let globalEmitter: SVMEventEmitter | null = null

/**
 * Initialize the global event emitter
 */
export function initEventEmitter(config: SVMEventEmitterConfig): SVMEventEmitter {
  globalEmitter = new SVMEventEmitter(config)
  return globalEmitter
}

/**
 * Get the global event emitter
 */
export function getEventEmitter(): SVMEventEmitter | null {
  return globalEmitter
}

/**
 * Emit an event using the global emitter
 */
export async function emitEvent<T extends Record<string, unknown>>(
  eventType: SVMEventType,
  payload: T,
  idempotencyKey?: string
): Promise<{ success: boolean; eventId: string; error?: string }> {
  if (!globalEmitter) {
    console.warn('[SVM EventBus] Event emitter not initialized')
    return { success: false, eventId: '', error: 'Event emitter not initialized' }
  }
  return globalEmitter.emit(eventType, payload, idempotencyKey)
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Create ORDER_PLACED event
 */
export function createOrderPlacedEvent(
  payload: OrderPlacedPayload
): { eventType: SVMEventType; payload: OrderPlacedPayload; idempotencyKey: string } {
  return {
    eventType: SVM_EVENT_TYPES.ORDER_PLACED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      SVM_EVENT_TYPES.ORDER_PLACED,
      payload.orderId,
      'placed'
    )
  }
}

/**
 * Create ORDER_PAID event
 */
export function createOrderPaidEvent(
  payload: OrderPaidPayload
): { eventType: SVMEventType; payload: OrderPaidPayload; idempotencyKey: string } {
  return {
    eventType: SVM_EVENT_TYPES.ORDER_PAID,
    payload,
    idempotencyKey: generateUniqueIdempotencyKey(
      SVM_EVENT_TYPES.ORDER_PAID,
      payload.orderId
    )
  }
}

/**
 * Create ORDER_FULFILLED event
 */
export function createOrderFulfilledEvent(
  payload: OrderFulfilledPayload
): { eventType: SVMEventType; payload: OrderFulfilledPayload; idempotencyKey: string } {
  return {
    eventType: SVM_EVENT_TYPES.ORDER_FULFILLED,
    payload,
    idempotencyKey: generateUniqueIdempotencyKey(
      SVM_EVENT_TYPES.ORDER_FULFILLED,
      payload.orderId
    )
  }
}

/**
 * Create ORDER_CANCELLED event
 */
export function createOrderCancelledEvent(
  payload: OrderCancelledPayload
): { eventType: SVMEventType; payload: OrderCancelledPayload; idempotencyKey: string } {
  return {
    eventType: SVM_EVENT_TYPES.ORDER_CANCELLED,
    payload,
    idempotencyKey: generateUniqueIdempotencyKey(
      SVM_EVENT_TYPES.ORDER_CANCELLED,
      payload.orderId
    )
  }
}

/**
 * Create CART_ITEM_ADDED event
 */
export function createCartItemAddedEvent(
  payload: CartItemAddedPayload
): { eventType: SVMEventType; payload: CartItemAddedPayload; idempotencyKey: string } {
  return {
    eventType: SVM_EVENT_TYPES.CART_ITEM_ADDED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      SVM_EVENT_TYPES.CART_ITEM_ADDED,
      `${payload.cartId || payload.sessionId}_${payload.productId}`,
      'add'
    )
  }
}

/**
 * Create PRODUCT_VIEWED event
 */
export function createProductViewedEvent(
  payload: ProductViewedPayload
): { eventType: SVMEventType; payload: ProductViewedPayload; idempotencyKey: string } {
  return {
    eventType: SVM_EVENT_TYPES.PRODUCT_VIEWED,
    payload,
    idempotencyKey: generateIdempotencyKey(
      SVM_EVENT_TYPES.PRODUCT_VIEWED,
      `${payload.sessionId || payload.customerId}_${payload.productId}`,
      'view',
      15 // 15 minute bucket for product views
    )
  }
}
