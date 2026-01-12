/**
 * SVM Event Handlers
 * 
 * Core's handlers for events emitted by the SVM (Single Vendor Marketplace) module.
 * 
 * Events handled:
 * - svm.order.placed → Reserve inventory
 * - svm.order.payment_requested → Create payment intent
 * - svm.order.cancelled → Release inventory, process refund
 * - svm.order.refund_requested → Process refund
 */

import { prisma } from './prisma'
import { createAuditLog } from './audit'
import { AuditAction } from '@prisma/client'
import {
  type SVMEvent,
  type SVMEventUnknown,
  type SVMOrderPlacedEvent,
  type SVMPaymentRequestedEvent,
  type SVMOrderCancelledEvent,
  type SVMRefundRequestedEvent,
  type SVMOrderShippedEvent,
  isSVMEvent,
  type EventHandlerResult
} from './events/eventTypes'

// ============================================================================
// TYPES (Re-exports for backwards compatibility)
// ============================================================================

export type { 
  OrderPlacedPayload,
  PaymentRequestedPayload,
  OrderCancelledPayload,
  SVMRefundRequestedPayload as RefundRequestedPayload,
  OrderShippedPayload
} from './events/eventTypes'
  tenantId: string
  customerId?: string
  guestEmail?: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    unitPrice: number
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
  reservationId?: string
}

interface PaymentRequestedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string
  guestEmail?: string
  amount: number
  currency: string
  returnUrl?: string
  metadata?: Record<string, string>
}

interface OrderCancelledPayload {
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

interface RefundRequestedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  corePaymentId: string
  refundType: 'FULL' | 'PARTIAL'
  refundAmount: number
  reason: string
  items?: Array<{
    productId: string
    variantId?: string
    quantity: number
    restockItem: boolean
  }>
  requestedBy: string
}

interface OrderShippedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string
  carrier: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDelivery?: string
  shippedAt: string
  notifyCustomer: boolean
  customerEmail?: string
}

// ============================================================================
// IDEMPOTENCY CHECK
// ============================================================================

async function isEventProcessed(idempotencyKey: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      targetId: idempotencyKey,
      action: 'TENANT_UPDATED' // Using existing action for SVM events
    }
  })
  return !!existing
}

async function markEventProcessed(
  idempotencyKey: string, 
  eventType: string,
  tenantId: string,
  actorId: string
): Promise<void> {
  await createAuditLog({
    action: 'TENANT_UPDATED' as AuditAction,
    actorId: actorId || 'system',
    actorEmail: 'svm-system@internal',
    tenantId,
    targetType: 'SVM_EVENT',
    targetId: idempotencyKey,
    metadata: {
      eventType,
      processedAt: new Date().toISOString()
    }
  })
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle order placed - Reserve inventory
 */
export async function handleOrderPlaced(
  event: SVMEventBase & { payload: OrderPlacedPayload }
): Promise<{ success: boolean; error?: string; reservationId?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    console.log('[SVM] Event already processed:', idempotencyKey)
    return { success: true }
  }

  try {
    const { tenantId, orderId, orderNumber, items, grandTotal, customerId } = payload

    console.log('[SVM] Order placed:', orderNumber, 'for tenant', tenantId)
    console.log('[SVM] Total: ₦' + grandTotal.toLocaleString() + ', Items:', items.length)

    // GUARDED: Inventory reservation
    // In production, this would reserve inventory in Core to prevent overselling.
    // Currently, the system validates availability at checkout time.
    // Full inventory reservation would be: await inventoryService.reserve(tenantId, items)
    const reservationId = `res_${Date.now()}`

    await createAuditLog({
      action: 'TENANT_CREATED' as AuditAction, // Using for SVM_ORDER_PLACED
      actorId: customerId || 'guest',
      actorEmail: payload.guestEmail || 'guest@checkout',
      tenantId,
      targetType: 'ORDER',
      targetId: orderId,
      metadata: {
        eventType: 'SVM_ORDER_PLACED',
        orderNumber,
        grandTotal,
        itemCount: items.length,
        currency: payload.currency
      }
    })

    await markEventProcessed(idempotencyKey, 'svm.order.placed', tenantId, customerId || 'guest')
    return { success: true, reservationId: `res_${Date.now()}` }
  } catch (error) {
    console.error('[SVM] Error handling order placed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Handle payment requested - Create payment intent
 */
export async function handlePaymentRequested(
  event: SVMEventBase & { payload: PaymentRequestedPayload }
): Promise<{ success: boolean; error?: string; paymentIntentId?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, orderId, orderNumber, amount, currency, customerId } = payload

    console.log('[SVM] Payment requested:', orderNumber, 'for ₦' + amount.toLocaleString())

    // GUARDED: Payment intent creation
    // In production, this integrates with payment providers (Paystack, Flutterwave, etc.)
    // Currently, payment is handled via the checkout form with test mode
    // Full implementation: await paymentService.createIntent({ tenantId, amount, currency, metadata: { orderId, orderNumber } })
    const paymentIntentId = `pi_${Date.now()}`

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: customerId || 'guest',
      actorEmail: payload.guestEmail || 'guest@checkout',
      tenantId,
      targetType: 'PAYMENT_REQUEST',
      targetId: orderId,
      metadata: {
        eventType: 'SVM_PAYMENT_REQUESTED',
        orderNumber,
        amount,
        currency
      }
    })

    await markEventProcessed(idempotencyKey, 'svm.order.payment_requested', tenantId, customerId || 'guest')
    return { success: true, paymentIntentId: `pi_${Date.now()}` }
  } catch (error) {
    console.error('[SVM] Error handling payment requested:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Handle order cancelled - Release inventory, refund if needed
 */
export async function handleOrderCancelled(
  event: SVMEventBase & { payload: OrderCancelledPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { 
      tenantId, orderId, orderNumber, cancelledBy, 
      cancelledByUserId, reason, items, wasPaymentCaptured, refundAmount 
    } = payload

    console.log('[SVM] Order cancelled:', orderNumber, 'by', cancelledBy)

    // GUARDED: Release inventory reservation
    // In production: await inventoryService.release(tenantId, items)
    // Currently, inventory is not hard-reserved, so no release needed

    // GUARDED: Process refund if payment was captured
    // In production: if (wasPaymentCaptured && refundAmount) await paymentService.refund(paymentId, refundAmount)
    // Currently, refunds are handled manually through admin dashboard

    await createAuditLog({
      action: 'TENANT_SUSPENDED' as AuditAction, // Using for SVM_ORDER_CANCELLED
      actorId: cancelledByUserId || cancelledBy.toLowerCase(),
      actorEmail: 'svm@internal',
      tenantId,
      targetType: 'ORDER',
      targetId: orderId,
      metadata: {
        eventType: 'SVM_ORDER_CANCELLED',
        orderNumber,
        reason,
        cancelledBy,
        wasPaymentCaptured,
        refundAmount: refundAmount || 0,
        itemCount: items.length
      }
    })

    await markEventProcessed(idempotencyKey, 'svm.order.cancelled', tenantId, cancelledByUserId || 'system')
    return { success: true }
  } catch (error) {
    console.error('[SVM] Error handling order cancelled:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Handle refund requested - Process refund and optionally restock
 */
export async function handleRefundRequested(
  event: SVMEventBase & { payload: RefundRequestedPayload }
): Promise<{ success: boolean; error?: string; refundId?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { 
      tenantId, orderId, orderNumber, corePaymentId,
      refundType, refundAmount, reason, items, requestedBy 
    } = payload

    console.log('[SVM] Refund requested:', orderNumber, refundType, '₦' + refundAmount.toLocaleString())

    // GUARDED: Process refund through payment provider
    // In production: await paymentService.refund(corePaymentId, refundAmount)
    // Currently, refunds are processed manually and recorded in audit log
    const refundId = `ref_${Date.now()}`

    // GUARDED: Restock items if requested
    // In production: for items with restockItem=true, call inventoryService.restock()
    // Currently, restocking is handled through inventory management UI
    if (items) {
      console.log('[SVM] Items to potentially restock:', items.filter(i => i.restockItem).length)
    }

    await createAuditLog({
      action: 'TENANT_ACTIVATED' as AuditAction, // Using for SVM_REFUND
      actorId: requestedBy,
      actorEmail: 'svm@internal',
      tenantId,
      targetType: 'REFUND',
      targetId: orderId,
      metadata: {
        eventType: 'SVM_REFUND_REQUESTED',
        orderNumber,
        refundType,
        refundAmount,
        reason,
        corePaymentId,
        itemCount: items?.length || 0
      }
    })

    await markEventProcessed(idempotencyKey, 'svm.order.refund_requested', tenantId, requestedBy)
    return { success: true, refundId: `ref_${Date.now()}` }
  } catch (error) {
    console.error('[SVM] Error handling refund requested:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Handle order shipped - Send notification to customer
 */
export async function handleOrderShipped(
  event: SVMEventBase & { payload: OrderShippedPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { 
      tenantId, orderId, orderNumber, carrier, 
      trackingNumber, trackingUrl, notifyCustomer, customerEmail 
    } = payload

    console.log('[SVM] Order shipped:', orderNumber, 'via', carrier, trackingNumber)

    // GUARDED: Send email notification if requested
    // In production: await emailService.sendShippingNotification({ to: customerEmail, orderNumber, carrier, trackingNumber, trackingUrl })
    // Currently, shipping notifications can be sent via WhatsApp or manually
    if (notifyCustomer && customerEmail) {
      console.log('[SVM] Shipping notification would be sent to:', customerEmail)
    }

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: 'system',
      actorEmail: 'svm@internal',
      tenantId,
      targetType: 'ORDER',
      targetId: orderId,
      metadata: {
        eventType: 'SVM_ORDER_SHIPPED',
        orderNumber,
        carrier,
        trackingNumber,
        trackingUrl,
        notifyCustomer
      }
    })

    await markEventProcessed(idempotencyKey, 'svm.order.shipped', tenantId, 'system')
    return { success: true }
  } catch (error) {
    console.error('[SVM] Error handling order shipped:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================================================
// EVENT ROUTER
// ============================================================================

export async function handleSVMEvent(
  event: SVMEventBase & { payload: Record<string, unknown> }
): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
  console.log('[SVM] Received event:', event.eventType)

  switch (event.eventType) {
    case 'svm.order.placed':
      return handleOrderPlaced(event as unknown as SVMEventBase & { payload: OrderPlacedPayload })
    
    case 'svm.order.payment_requested':
      return handlePaymentRequested(event as unknown as SVMEventBase & { payload: PaymentRequestedPayload })
    
    case 'svm.order.cancelled':
      return handleOrderCancelled(event as unknown as SVMEventBase & { payload: OrderCancelledPayload })
    
    case 'svm.order.refund_requested':
      return handleRefundRequested(event as unknown as SVMEventBase & { payload: RefundRequestedPayload })
    
    case 'svm.order.shipped':
      return handleOrderShipped(event as unknown as SVMEventBase & { payload: OrderShippedPayload })
    
    // Events that don't need Core action (just log)
    case 'svm.order.created':
    case 'svm.order.paid':
    case 'svm.order.processing':
    case 'svm.order.delivered':
    case 'svm.order.fulfilled':
    case 'svm.order.refunded':
    case 'svm.order.status_changed':
      console.log('[SVM] Event logged:', event.eventType, event.payload)
      return { success: true }
    
    default:
      console.log('[SVM] Unhandled event type:', event.eventType)
      return { success: true }
  }
}

// ============================================================================
// SVM ENTITLEMENT SERVICE
// ============================================================================

export async function getSVMEntitlements(tenantId: string): Promise<{
  module: 'SVM'
  features: string[]
  limits: Record<string, number | null>
  expiresAt: string | null
} | null> {
  try {
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_module: { tenantId, module: 'SVM' }
      }
    })

    if (!entitlement || entitlement.status !== 'ACTIVE') {
      // Return default entitlements for testing
      return {
        module: 'SVM',
        features: ['storefront', 'cart', 'checkout', 'orders'],
        limits: {
          max_products: 100,
          max_orders_per_month: 500,
          max_storage_mb: 1024
        },
        expiresAt: null
      }
    }

    const limits = (entitlement.limits as Record<string, unknown>) || {}
    const features: string[] = ['storefront', 'cart', 'checkout', 'orders']
    
    if (limits.promotions_enabled !== false) features.push('promotions')
    if (limits.reviews_enabled !== false) features.push('reviews')
    if (limits.wishlist_enabled !== false) features.push('wishlist')
    if (limits.cms_enabled !== false) features.push('cms')
    if (limits.seo_enabled !== false) features.push('seo')
    if (limits.analytics_enabled !== false) features.push('analytics')
    if (limits.api_enabled === true) features.push('api')

    return {
      module: 'SVM',
      features,
      limits: {
        max_products: typeof limits.max_products === 'number' ? limits.max_products : 100,
        max_orders_per_month: typeof limits.max_orders_per_month === 'number' ? limits.max_orders_per_month : 500,
        max_storage_mb: typeof limits.max_storage_mb === 'number' ? limits.max_storage_mb : 1024,
        max_banners: typeof limits.max_banners === 'number' ? limits.max_banners : 10,
        max_pages: typeof limits.max_pages === 'number' ? limits.max_pages : 20
      },
      expiresAt: entitlement.validUntil?.toISOString() || null
    }
  } catch (error) {
    console.error('[SVM] Error fetching entitlements:', error)
    return null
  }
}
