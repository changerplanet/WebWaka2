/**
 * SVM Order Lifecycle Service
 * 
 * Manages order state transitions, cancellation eligibility,
 * and refund logic for the Single Vendor Marketplace.
 * 
 * NOTE: This service handles LOGIC ONLY, not actual refund processing.
 * Financial transactions are handled by the Payments & Collections Suite.
 * 
 * @module lib/svm/order-lifecycle-service
 */

import { prisma } from '../prisma'

// ============================================================================
// TYPES
// ============================================================================

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'RETURNED'

export type CancellationReason =
  | 'CUSTOMER_REQUEST'
  | 'OUT_OF_STOCK'
  | 'PAYMENT_FAILED'
  | 'FRAUD_SUSPECTED'
  | 'DELIVERY_FAILED'
  | 'MERCHANT_CANCELLED'
  | 'OTHER'

export interface OrderStateTransition {
  from: OrderStatus
  to: OrderStatus
  allowedBy: ('CUSTOMER' | 'MERCHANT' | 'SYSTEM')[]
  requiresPayment: boolean
  requiresFulfillment: boolean
  autoNotify: boolean
}

export interface CancellationEligibility {
  canCancel: boolean
  reason: string | null
  refundEligible: boolean
  refundAmount: number
  refundPercentage: number
  cancellationFee: number
}

export interface RefundEligibility {
  canRefund: boolean
  reason: string | null
  maxRefundAmount: number
  suggestedAmount: number
  requiresReturn: boolean
  returnDeadlineDays: number
}

// ============================================================================
// ORDER STATE MACHINE
// ============================================================================

/**
 * Valid order state transitions
 */
export const ORDER_TRANSITIONS: OrderStateTransition[] = [
  // Initial states
  { from: 'PENDING', to: 'CONFIRMED', allowedBy: ['MERCHANT', 'SYSTEM'], requiresPayment: true, requiresFulfillment: false, autoNotify: true },
  { from: 'PENDING', to: 'CANCELLED', allowedBy: ['CUSTOMER', 'MERCHANT', 'SYSTEM'], requiresPayment: false, requiresFulfillment: false, autoNotify: true },
  
  // Confirmed states
  { from: 'CONFIRMED', to: 'PROCESSING', allowedBy: ['MERCHANT', 'SYSTEM'], requiresPayment: true, requiresFulfillment: false, autoNotify: true },
  { from: 'CONFIRMED', to: 'CANCELLED', allowedBy: ['CUSTOMER', 'MERCHANT'], requiresPayment: false, requiresFulfillment: false, autoNotify: true },
  
  // Processing states
  { from: 'PROCESSING', to: 'SHIPPED', allowedBy: ['MERCHANT', 'SYSTEM'], requiresPayment: true, requiresFulfillment: false, autoNotify: true },
  { from: 'PROCESSING', to: 'CANCELLED', allowedBy: ['MERCHANT'], requiresPayment: false, requiresFulfillment: false, autoNotify: true },
  
  // Shipping states
  { from: 'SHIPPED', to: 'OUT_FOR_DELIVERY', allowedBy: ['MERCHANT', 'SYSTEM'], requiresPayment: true, requiresFulfillment: false, autoNotify: true },
  { from: 'SHIPPED', to: 'DELIVERED', allowedBy: ['MERCHANT', 'SYSTEM'], requiresPayment: true, requiresFulfillment: true, autoNotify: true },
  
  // Delivery states
  { from: 'OUT_FOR_DELIVERY', to: 'DELIVERED', allowedBy: ['MERCHANT', 'SYSTEM'], requiresPayment: true, requiresFulfillment: true, autoNotify: true },
  
  // Return states
  { from: 'DELIVERED', to: 'RETURNED', allowedBy: ['MERCHANT'], requiresPayment: false, requiresFulfillment: false, autoNotify: true }
]

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
): boolean {
  const transition = ORDER_TRANSITIONS.find((t: any) => t.from === from && t.to === to)
  if (!transition) return false
  return transition.allowedBy.includes(actor)
}

/**
 * Get allowed next states for an order
 */
export function getAllowedTransitions(
  currentStatus: OrderStatus,
  actor: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
): OrderStatus[] {
  return ORDER_TRANSITIONS
    .filter((t: any) => t.from === currentStatus && t.allowedBy.includes(actor))
    .map((t: any) => t.to)
}

// ============================================================================
// CANCELLATION LOGIC
// ============================================================================

/**
 * Check if an order can be cancelled
 */
export async function checkCancellationEligibility(
  orderId: string
): Promise<CancellationEligibility> {
  const order = await prisma.svm_orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      grandTotal: true,
      shippingTotal: true,
      createdAt: true,
      shippedAt: true
    }
  })
  
  if (!order) {
    return {
      canCancel: false,
      reason: 'Order not found',
      refundEligible: false,
      refundAmount: 0,
      refundPercentage: 0,
      cancellationFee: 0
    }
  }
  
  const grandTotal = Number(order.grandTotal)
  const shippingTotal = Number(order.shippingTotal)
  
  // Cannot cancel delivered, cancelled, or returned orders
  if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
    return {
      canCancel: false,
      reason: `Order is already ${order.status.toLowerCase()}`,
      refundEligible: false,
      refundAmount: 0,
      refundPercentage: 0,
      cancellationFee: 0
    }
  }
  
  // Cannot cancel if already shipped (only merchant can)
  if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
    return {
      canCancel: false,
      reason: 'Order has already been shipped. Please contact support.',
      refundEligible: true,
      refundAmount: grandTotal - shippingTotal, // Shipping non-refundable
      refundPercentage: 100,
      cancellationFee: shippingTotal
    }
  }
  
  // Can cancel pending or confirmed orders
  if (['PENDING', 'CONFIRMED'].includes(order.status)) {
    const isPaid = order.paymentStatus === 'CAPTURED'
    
    return {
      canCancel: true,
      reason: null,
      refundEligible: isPaid,
      refundAmount: isPaid ? grandTotal : 0,
      refundPercentage: 100,
      cancellationFee: 0
    }
  }
  
  // Processing - partial refund may apply
  if (order.status === 'PROCESSING') {
    const isPaid = order.paymentStatus === 'CAPTURED'
    const processingFee = Math.round(grandTotal * 0.05) // 5% processing fee
    
    return {
      canCancel: true,
      reason: 'A 5% processing fee may apply',
      refundEligible: isPaid,
      refundAmount: isPaid ? grandTotal - processingFee : 0,
      refundPercentage: 95,
      cancellationFee: processingFee
    }
  }
  
  return {
    canCancel: false,
    reason: 'Order cannot be cancelled at this stage',
    refundEligible: false,
    refundAmount: 0,
    refundPercentage: 0,
    cancellationFee: 0
  }
}

/**
 * Cancel an order (logic only)
 */
export async function cancelOrder(
  orderId: string,
  reason: CancellationReason,
  cancelledBy: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM',
  notes?: string
): Promise<{ success: boolean; error?: string; refundAmount?: number }> {
  const eligibility = await checkCancellationEligibility(orderId)
  
  if (!eligibility.canCancel) {
    return { success: false, error: eligibility.reason || 'Order cannot be cancelled' }
  }
  
  try {
    await prisma.svm_orders.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        internalNotes: notes ? 
          `[${new Date().toISOString()}] Cancelled by ${cancelledBy}: ${reason}. ${notes}` :
          `[${new Date().toISOString()}] Cancelled by ${cancelledBy}: ${reason}`
      }
    })
    
    return { 
      success: true, 
      refundAmount: eligibility.refundAmount 
    }
  } catch (error) {
    console.error('[SVM Order] Error cancelling order:', error)
    return { success: false, error: 'Failed to cancel order' }
  }
}

// ============================================================================
// REFUND LOGIC
// ============================================================================

/**
 * Check if an order is eligible for refund
 */
export async function checkRefundEligibility(
  orderId: string
): Promise<RefundEligibility> {
  const order = await prisma.svm_orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      shippingTotal: true,
      refundedAmount: true,
      deliveredAt: true
    }
  })
  
  if (!order) {
    return {
      canRefund: false,
      reason: 'Order not found',
      maxRefundAmount: 0,
      suggestedAmount: 0,
      requiresReturn: false,
      returnDeadlineDays: 0
    }
  }
  
  const grandTotal = Number(order.grandTotal)
  const refundedAmount = Number(order.refundedAmount)
  const remainingAmount = grandTotal - refundedAmount
  
  // Must be paid to refund
  if (!['CAPTURED', 'PARTIALLY_REFUNDED'].includes(order.paymentStatus)) {
    return {
      canRefund: false,
      reason: 'Order has not been paid',
      maxRefundAmount: 0,
      suggestedAmount: 0,
      requiresReturn: false,
      returnDeadlineDays: 0
    }
  }
  
  // Already fully refunded
  if (remainingAmount <= 0) {
    return {
      canRefund: false,
      reason: 'Order has already been fully refunded',
      maxRefundAmount: 0,
      suggestedAmount: 0,
      requiresReturn: false,
      returnDeadlineDays: 0
    }
  }
  
  // Cancelled orders - full refund
  if (order.status === 'CANCELLED') {
    return {
      canRefund: true,
      reason: null,
      maxRefundAmount: remainingAmount,
      suggestedAmount: remainingAmount,
      requiresReturn: false,
      returnDeadlineDays: 0
    }
  }
  
  // Delivered orders - check return window
  if (order.status === 'DELIVERED' && order.deliveredAt) {
    const daysSinceDelivery = Math.floor(
      (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const returnWindow = 7 // 7-day return policy
    
    if (daysSinceDelivery > returnWindow) {
      return {
        canRefund: false,
        reason: `Return window has expired (${returnWindow} days from delivery)`,
        maxRefundAmount: 0,
        suggestedAmount: 0,
        requiresReturn: true,
        returnDeadlineDays: 0
      }
    }
    
    return {
      canRefund: true,
      reason: null,
      maxRefundAmount: remainingAmount,
      suggestedAmount: remainingAmount - Number(order.shippingTotal), // Shipping non-refundable
      requiresReturn: true,
      returnDeadlineDays: returnWindow - daysSinceDelivery
    }
  }
  
  // Other paid statuses
  return {
    canRefund: true,
    reason: null,
    maxRefundAmount: remainingAmount,
    suggestedAmount: remainingAmount,
    requiresReturn: ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status),
    returnDeadlineDays: 7
  }
}

// ============================================================================
// ORDER STATUS UPDATES
// ============================================================================

/**
 * Update order status with validation
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actor: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.svm_orders.findUnique({
    where: { id: orderId },
    select: { status: true }
  })
  
  if (!order) {
    return { success: false, error: 'Order not found' }
  }
  
  const currentStatus = order.status as OrderStatus
  
  if (!isValidTransition(currentStatus, newStatus, actor)) {
    return { 
      success: false, 
      error: `Cannot transition from ${currentStatus} to ${newStatus}` 
    }
  }
  
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date()
  }
  
  // Set timestamps based on status
  if (newStatus === 'SHIPPED') {
    updateData.shippedAt = new Date()
    if (metadata?.trackingNumber) {
      updateData.trackingNumber = metadata.trackingNumber
    }
    if (metadata?.carrier) {
      updateData.shippingCarrier = metadata.carrier
    }
  } else if (newStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date()
    updateData.fulfillmentStatus = 'FULFILLED'
  } else if (newStatus === 'CANCELLED') {
    updateData.cancelledAt = new Date()
  }
  
  try {
    await prisma.svm_orders.update({
      where: { id: orderId },
      data: updateData
    })
    
    return { success: true }
  } catch (error) {
    console.error('[SVM Order] Error updating status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

// ============================================================================
// STATUS DISPLAY HELPERS
// ============================================================================

export interface OrderStatusDisplay {
  status: OrderStatus
  label: string
  color: string
  description: string
  icon: string
}

export const ORDER_STATUS_DISPLAY: Record<OrderStatus, Omit<OrderStatusDisplay, 'status'>> = {
  PENDING: {
    label: 'Pending',
    color: 'gray',
    description: 'Order received, awaiting confirmation',
    icon: 'clock'
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'blue',
    description: 'Order confirmed, preparing for shipment',
    icon: 'check-circle'
  },
  PROCESSING: {
    label: 'Processing',
    color: 'yellow',
    description: 'Order is being prepared',
    icon: 'package'
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'indigo',
    description: 'Order has been shipped',
    icon: 'truck'
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    color: 'purple',
    description: 'Order is out for delivery',
    icon: 'navigation'
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'green',
    description: 'Order has been delivered',
    icon: 'check'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'red',
    description: 'Order has been cancelled',
    icon: 'x-circle'
  },
  RETURNED: {
    label: 'Returned',
    color: 'orange',
    description: 'Order has been returned',
    icon: 'rotate-ccw'
  }
}

/**
 * Get display info for an order status
 */
export function getOrderStatusDisplay(status: OrderStatus): OrderStatusDisplay {
  return {
    status,
    ...ORDER_STATUS_DISPLAY[status]
  }
}

/**
 * Get order timeline for display
 */
export function getOrderTimeline(status: OrderStatus): OrderStatusDisplay[] {
  const timeline: OrderStatus[] = [
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
  ]
  
  const currentIndex = timeline.indexOf(status)
  
  return timeline.map((s, index) => ({
    status: s,
    ...ORDER_STATUS_DISPLAY[s],
    isComplete: index < currentIndex,
    isCurrent: s === status,
    isPending: index > currentIndex
  })) as OrderStatusDisplay[]
}
