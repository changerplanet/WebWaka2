/**
 * SVM Order Engine
 * 
 * Manages the online order lifecycle.
 * 
 * IMPORTANT:
 * - SVM does NOT process payments - Core does
 * - SVM emits events - Core handles actions
 * - State transitions are validated via state machine
 */

import Decimal from 'decimal.js'

// ============================================================================
// ORDER STATES
// ============================================================================

export type OrderState =
  | 'DRAFT'       // Cart converted, not yet submitted
  | 'PLACED'      // Customer submitted order, awaiting payment
  | 'PAID'        // Payment confirmed by Core
  | 'PROCESSING'  // Being prepared/packed
  | 'SHIPPED'     // Handed to carrier
  | 'DELIVERED'   // Customer received
  | 'FULFILLED'   // Order complete (after return window)
  | 'CANCELLED'   // Order cancelled
  | 'REFUNDED'    // Fully refunded

// ============================================================================
// STATE MACHINE
// ============================================================================

/**
 * Valid state transitions
 * Key = current state, Value = allowed next states
 */
export const ORDER_TRANSITIONS: Record<OrderState, OrderState[]> = {
  'DRAFT': ['PLACED', 'CANCELLED'],
  'PLACED': ['PAID', 'CANCELLED'],
  'PAID': ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  'PROCESSING': ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  'SHIPPED': ['DELIVERED', 'REFUNDED'],
  'DELIVERED': ['FULFILLED', 'REFUNDED'],
  'FULFILLED': ['REFUNDED'], // Can still refund after fulfillment
  'CANCELLED': [], // Terminal state
  'REFUNDED': []   // Terminal state
}

/**
 * Check if transition is valid
 */
export function canTransition(from: OrderState, to: OrderState): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get valid next states
 */
export function getValidTransitions(current: OrderState): OrderState[] {
  return ORDER_TRANSITIONS[current] || []
}

/**
 * Check if state is terminal (no further transitions)
 */
export function isTerminalState(state: OrderState): boolean {
  return ORDER_TRANSITIONS[state]?.length === 0
}

/**
 * Check if order can be cancelled
 */
export function canCancel(state: OrderState): boolean {
  return ORDER_TRANSITIONS[state]?.includes('CANCELLED') ?? false
}

/**
 * Check if order can be refunded
 */
export function canRefund(state: OrderState): boolean {
  return ORDER_TRANSITIONS[state]?.includes('REFUNDED') ?? false
}

// ============================================================================
// ORDER EVENTS (emitted to Core)
// ============================================================================

export type OrderEventType =
  | 'svm.order.created'
  | 'svm.order.placed'
  | 'svm.order.payment_requested'
  | 'svm.order.paid'
  | 'svm.order.processing'
  | 'svm.order.shipped'
  | 'svm.order.delivered'
  | 'svm.order.fulfilled'
  | 'svm.order.cancelled'
  | 'svm.order.refund_requested'
  | 'svm.order.refunded'
  | 'svm.order.status_changed'

interface OrderEventBase {
  eventId: string
  eventType: OrderEventType
  timestamp: string
  idempotencyKey: string
}

// ============================================================================
// EVENT PAYLOADS
// ============================================================================

export interface OrderCreatedEvent extends OrderEventBase {
  eventType: 'svm.order.created'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    customerId?: string
    guestEmail?: string
    items: OrderItemSnapshot[]
    subtotal: number
    currency: string
  }
}

export interface OrderPlacedEvent extends OrderEventBase {
  eventType: 'svm.order.placed'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    customerId?: string
    guestEmail?: string
    
    // Items for inventory reservation
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
      unitPrice: number
    }>
    
    // Totals
    subtotal: number
    shippingTotal: number
    taxTotal: number
    discountTotal: number
    grandTotal: number
    currency: string
    
    // Shipping
    shippingAddress: ShippingAddress
    shippingMethod?: string
    
    // For Core to reserve inventory
    reservationId?: string
  }
}

export interface PaymentRequestedEvent extends OrderEventBase {
  eventType: 'svm.order.payment_requested'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    customerId?: string
    guestEmail?: string
    amount: number
    currency: string
    
    // For Core to create payment intent
    returnUrl?: string
    metadata?: Record<string, string>
  }
}

export interface OrderPaidEvent extends OrderEventBase {
  eventType: 'svm.order.paid'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    corePaymentId: string
    amount: number
    currency: string
    paidAt: string
  }
}

export interface OrderShippedEvent extends OrderEventBase {
  eventType: 'svm.order.shipped'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    customerId?: string
    carrier: string
    trackingNumber: string
    trackingUrl?: string
    estimatedDelivery?: string
    shippedAt: string
    
    // For notification
    notifyCustomer: boolean
    customerEmail?: string
  }
}

export interface OrderDeliveredEvent extends OrderEventBase {
  eventType: 'svm.order.delivered'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    deliveredAt: string
    deliveryProof?: string
  }
}

export interface OrderCancelledEvent extends OrderEventBase {
  eventType: 'svm.order.cancelled'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    reason: string
    cancelledBy: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
    cancelledByUserId?: string
    
    // For inventory release
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
    }>
    
    // For refund if paid
    wasPaymentCaptured: boolean
    corePaymentId?: string
    refundAmount?: number
  }
}

export interface RefundRequestedEvent extends OrderEventBase {
  eventType: 'svm.order.refund_requested'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    corePaymentId: string
    
    refundType: 'FULL' | 'PARTIAL'
    refundAmount: number
    reason: string
    
    // Items being refunded (for inventory restore)
    items?: Array<{
      productId: string
      variantId?: string
      quantity: number
      restockItem: boolean
    }>
    
    requestedBy: string
  }
}

export interface OrderRefundedEvent extends OrderEventBase {
  eventType: 'svm.order.refunded'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    coreRefundId: string
    refundAmount: number
    refundedAt: string
  }
}

export interface OrderStatusChangedEvent extends OrderEventBase {
  eventType: 'svm.order.status_changed'
  payload: {
    orderId: string
    orderNumber: string
    tenantId: string
    fromStatus: OrderState
    toStatus: OrderState
    changedBy?: string
    reason?: string
  }
}

// Union type for all events
export type OrderEvent =
  | OrderCreatedEvent
  | OrderPlacedEvent
  | PaymentRequestedEvent
  | OrderPaidEvent
  | OrderShippedEvent
  | OrderDeliveredEvent
  | OrderCancelledEvent
  | RefundRequestedEvent
  | OrderRefundedEvent
  | OrderStatusChangedEvent

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface OrderItemSnapshot {
  productId: string
  variantId?: string
  productName: string
  productSku?: string
  variantName?: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface ShippingAddress {
  name: string
  address1: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

// ============================================================================
// ORDER ENGINE
// ============================================================================

export interface OrderEngineConfig {
  tenantId: string
  eventEmitter: OrderEventEmitter
}

export interface OrderEventEmitter {
  emit(event: OrderEvent): Promise<void>
}

export interface OrderData {
  id: string
  orderNumber: string
  tenantId: string
  customerId?: string
  guestEmail?: string
  status: OrderState
  
  items: OrderItemSnapshot[]
  
  subtotal: Decimal
  shippingTotal: Decimal
  taxTotal: Decimal
  discountTotal: Decimal
  grandTotal: Decimal
  currency: string
  
  shippingAddress?: ShippingAddress
  shippingMethod?: string
  
  corePaymentId?: string
  reservationId?: string
  
  createdAt: Date
  updatedAt: Date
}

/**
 * Order Engine - Manages order lifecycle
 */
export class OrderEngine {
  private order: OrderData
  private events: OrderEvent[] = []
  private eventEmitter: OrderEventEmitter
  private tenantId: string

  private constructor(order: OrderData, config: OrderEngineConfig) {
    this.order = order
    this.eventEmitter = config.eventEmitter
    this.tenantId = config.tenantId
  }

  /**
   * Create a new order from cart
   */
  static create(
    input: CreateOrderInput,
    config: OrderEngineConfig
  ): OrderEngine {
    const now = new Date()
    const orderNumber = generateOrderNumber()
    const orderId = generateId('order')

    const subtotal = input.items.reduce(
      (sum, item) => sum.plus(new Decimal(item.unitPrice).times(item.quantity)),
      new Decimal(0)
    )

    const order: OrderData = {
      id: orderId,
      orderNumber,
      tenantId: config.tenantId,
      customerId: input.customerId,
      guestEmail: input.guestEmail,
      status: 'DRAFT',
      
      items: input.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSku: item.productSku,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: new Decimal(item.unitPrice).times(item.quantity).toNumber()
      })),
      
      subtotal,
      shippingTotal: new Decimal(input.shippingTotal || 0),
      taxTotal: new Decimal(input.taxTotal || 0),
      discountTotal: new Decimal(input.discountTotal || 0),
      grandTotal: subtotal
        .plus(input.shippingTotal || 0)
        .plus(input.taxTotal || 0)
        .minus(input.discountTotal || 0),
      currency: input.currency || 'USD',
      
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod,
      
      createdAt: now,
      updatedAt: now
    }

    const engine = new OrderEngine(order, config)

    // Emit creation event
    engine.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.created',
      timestamp: now.toISOString(),
      idempotencyKey: `order_${orderId}_created`,
      payload: {
        orderId,
        orderNumber,
        tenantId: config.tenantId,
        customerId: input.customerId,
        guestEmail: input.guestEmail,
        items: order.items,
        subtotal: subtotal.toNumber(),
        currency: order.currency
      }
    })

    return engine
  }

  /**
   * Load existing order
   */
  static load(order: OrderData, config: OrderEngineConfig): OrderEngine {
    return new OrderEngine(order, config)
  }

  // ============================================================================
  // STATE TRANSITIONS
  // ============================================================================

  /**
   * Place the order (submit for payment)
   */
  async place(reservationId?: string): Promise<void> {
    this.validateTransition('PLACED')
    
    this.order.reservationId = reservationId
    this.transition('PLACED')

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.placed',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_placed`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        customerId: this.order.customerId,
        guestEmail: this.order.guestEmail,
        items: this.order.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        subtotal: this.order.subtotal.toNumber(),
        shippingTotal: this.order.shippingTotal.toNumber(),
        taxTotal: this.order.taxTotal.toNumber(),
        discountTotal: this.order.discountTotal.toNumber(),
        grandTotal: this.order.grandTotal.toNumber(),
        currency: this.order.currency,
        shippingAddress: this.order.shippingAddress!,
        shippingMethod: this.order.shippingMethod,
        reservationId
      }
    })

    // Request payment from Core
    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.payment_requested',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_payment_requested`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        customerId: this.order.customerId,
        guestEmail: this.order.guestEmail,
        amount: this.order.grandTotal.toNumber(),
        currency: this.order.currency,
        metadata: {
          orderNumber: this.order.orderNumber
        }
      }
    })

    await this.flushEvents()
  }

  /**
   * Mark order as paid (called when Core confirms payment)
   */
  async markPaid(corePaymentId: string): Promise<void> {
    this.validateTransition('PAID')
    
    this.order.corePaymentId = corePaymentId
    this.transition('PAID')

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.paid',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_paid`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        corePaymentId,
        amount: this.order.grandTotal.toNumber(),
        currency: this.order.currency,
        paidAt: new Date().toISOString()
      }
    })

    await this.flushEvents()
  }

  /**
   * Start processing order
   */
  async startProcessing(): Promise<void> {
    this.validateTransition('PROCESSING')
    this.transition('PROCESSING')
    await this.flushEvents()
  }

  /**
   * Mark order as shipped
   */
  async markShipped(
    carrier: string,
    trackingNumber: string,
    options?: {
      trackingUrl?: string
      estimatedDelivery?: Date
      notifyCustomer?: boolean
    }
  ): Promise<void> {
    this.validateTransition('SHIPPED')
    this.transition('SHIPPED')

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.shipped',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_shipped`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        customerId: this.order.customerId,
        carrier,
        trackingNumber,
        trackingUrl: options?.trackingUrl,
        estimatedDelivery: options?.estimatedDelivery?.toISOString(),
        shippedAt: new Date().toISOString(),
        notifyCustomer: options?.notifyCustomer ?? true,
        customerEmail: this.order.guestEmail
      }
    })

    await this.flushEvents()
  }

  /**
   * Mark order as delivered
   */
  async markDelivered(deliveryProof?: string): Promise<void> {
    this.validateTransition('DELIVERED')
    this.transition('DELIVERED')

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.delivered',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_delivered`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        deliveredAt: new Date().toISOString(),
        deliveryProof
      }
    })

    await this.flushEvents()
  }

  /**
   * Mark order as fulfilled (complete)
   */
  async markFulfilled(): Promise<void> {
    this.validateTransition('FULFILLED')
    this.transition('FULFILLED')
    await this.flushEvents()
  }

  /**
   * Cancel order
   */
  async cancel(
    reason: string,
    cancelledBy: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM',
    cancelledByUserId?: string
  ): Promise<void> {
    this.validateTransition('CANCELLED')
    
    const wasPaymentCaptured = this.order.status === 'PAID' || 
                               this.order.status === 'PROCESSING'
    
    this.transition('CANCELLED')

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.cancelled',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_cancelled`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        reason,
        cancelledBy,
        cancelledByUserId,
        items: this.order.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        wasPaymentCaptured,
        corePaymentId: this.order.corePaymentId,
        refundAmount: wasPaymentCaptured ? this.order.grandTotal.toNumber() : undefined
      }
    })

    await this.flushEvents()
  }

  /**
   * Request refund
   */
  async requestRefund(
    refundType: 'FULL' | 'PARTIAL',
    amount: number,
    reason: string,
    requestedBy: string,
    items?: Array<{ productId: string; variantId?: string; quantity: number; restockItem: boolean }>
  ): Promise<void> {
    if (!this.order.corePaymentId) {
      throw new Error('Cannot refund order without payment')
    }

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.refund_requested',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_refund_requested_${Date.now()}`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        corePaymentId: this.order.corePaymentId,
        refundType,
        refundAmount: amount,
        reason,
        items,
        requestedBy
      }
    })

    await this.flushEvents()
  }

  /**
   * Mark order as refunded (called when Core confirms refund)
   */
  async markRefunded(coreRefundId: string, refundAmount: number): Promise<void> {
    this.validateTransition('REFUNDED')
    this.transition('REFUNDED')

    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.refunded',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_refunded`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        coreRefundId,
        refundAmount,
        refundedAt: new Date().toISOString()
      }
    })

    await this.flushEvents()
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get current order state
   */
  getState(): OrderData {
    return { ...this.order }
  }

  /**
   * Get current status
   */
  getStatus(): OrderState {
    return this.order.status
  }

  /**
   * Get pending events
   */
  getEvents(): OrderEvent[] {
    return [...this.events]
  }

  /**
   * Validate state transition
   */
  private validateTransition(to: OrderState): void {
    if (!canTransition(this.order.status, to)) {
      throw new Error(
        `Invalid transition from ${this.order.status} to ${to}. ` +
        `Valid transitions: ${getValidTransitions(this.order.status).join(', ')}`
      )
    }
  }

  /**
   * Perform state transition
   */
  private transition(to: OrderState): void {
    const from = this.order.status
    this.order.status = to
    this.order.updatedAt = new Date()

    // Always emit status change event
    this.addEvent({
      eventId: generateEventId(),
      eventType: 'svm.order.status_changed',
      timestamp: new Date().toISOString(),
      idempotencyKey: `order_${this.order.id}_status_${from}_to_${to}`,
      payload: {
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        tenantId: this.tenantId,
        fromStatus: from,
        toStatus: to
      }
    })
  }

  /**
   * Add event to queue
   */
  private addEvent(event: OrderEvent): void {
    this.events.push(event)
  }

  /**
   * Flush all pending events to emitter
   */
  private async flushEvents(): Promise<void> {
    for (const event of this.events) {
      await this.eventEmitter.emit(event)
    }
    this.events = []
  }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateOrderInput {
  customerId?: string
  guestEmail?: string
  
  items: Array<{
    productId: string
    variantId?: string
    productName: string
    productSku?: string
    variantName?: string
    unitPrice: number
    quantity: number
  }>
  
  shippingTotal?: number
  taxTotal?: number
  discountTotal?: number
  currency?: string
  
  shippingAddress?: ShippingAddress
  shippingMethod?: string
}

// ============================================================================
// ID GENERATORS
// ============================================================================

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}${random}`
}

export function generateEventId(): string {
  return generateId('evt')
}

export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `ORD-${year}${month}${day}-${seq}`
}
