/**
 * POS Event Handlers
 * 
 * Core's handlers for events emitted by the POS module.
 * 
 * POS emits events → Core handles:
 * - Inventory management
 * - Payment recording
 * - Audit logging
 * - Analytics (future)
 * 
 * IMPORTANT: These handlers are idempotent via idempotency keys
 */

import { prisma } from './prisma'
import { logAuditEvent } from './audit'

// ============================================================================
// TYPES
// ============================================================================

interface POSEventBase {
  eventId: string
  eventType: string
  timestamp: string
  idempotencyKey: string
}

interface SaleCompletedPayload {
  saleId: string
  saleNumber: string
  tenantId: string
  staffId: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  lineItems: Array<{
    lineItemId: string
    productId: string
    variantId?: string
    quantity: number
    unitPrice: number
  }>
  payments: Array<{
    paymentId: string
    method: string
    amount: number
  }>
  completedAt: string
  offlineId?: string
}

interface SaleCancelledPayload {
  saleId: string
  saleNumber: string
  tenantId: string
  staffId: string
  voidedByStaffId: string
  reason: string
  lineItems: Array<{
    lineItemId: string
    productId: string
    quantity: number
  }>
  cancelledAt: string
}

interface PaymentCapturedPayload {
  paymentId: string
  saleId: string
  tenantId: string
  staffId: string
  method: 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'SPLIT'
  amount: number
  tipAmount?: number
  totalAmount: number
  currency: string
  cashReceived?: number
  changeGiven?: number
  corePaymentId?: string
  cardLastFour?: string
  cardBrand?: string
  processedAt: string
  offlineId?: string
}

interface RefundCreatedPayload {
  refundId: string
  refundNumber: string
  originalSaleId?: string
  tenantId: string
  staffId: string
  approvedByStaffId?: string
  totalRefunded: number
  refundMethod: string
  reason: string
  items: Array<{
    lineItemId: string
    productId: string
    quantity: number
    refundAmount: number
    restock: boolean
  }>
  processedAt: string
}

// ============================================================================
// IDEMPOTENCY CHECK
// ============================================================================

async function isEventProcessed(idempotencyKey: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      details: {
        path: ['idempotencyKey'],
        equals: idempotencyKey
      }
    }
  })
  return !!existing
}

async function markEventProcessed(
  idempotencyKey: string, 
  eventType: string,
  tenantId: string
): Promise<void> {
  await logAuditEvent({
    tenantId,
    userId: 'system',
    action: 'POS_EVENT_PROCESSED',
    targetType: 'POS_EVENT',
    targetId: idempotencyKey,
    details: {
      idempotencyKey,
      eventType,
      processedAt: new Date().toISOString()
    }
  })
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export async function handleSaleCompleted(
  event: POSEventBase & { payload: SaleCompletedPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    console.log('[POS] Event already processed:', idempotencyKey)
    return { success: true }
  }

  try {
    const { tenantId, saleId, saleNumber, staffId, lineItems, grandTotal, payments } = payload

    console.log('[POS] Sale completed:', saleNumber, 'for tenant', tenantId)
    console.log('[POS] Total: $' + grandTotal + ', Items:', lineItems.length)

    await logAuditEvent({
      tenantId,
      userId: staffId,
      action: 'POS_SALE_COMPLETED',
      targetType: 'SALE',
      targetId: saleId,
      details: {
        saleNumber,
        grandTotal,
        itemCount: lineItems.length,
        paymentMethods: payments.map(p => p.method),
        idempotencyKey
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.sale.completed', tenantId)
    return { success: true }
  } catch (error) {
    console.error('[POS] Error handling sale completed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function handleSaleCancelled(
  event: POSEventBase & { payload: SaleCancelledPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, saleId, saleNumber, staffId, voidedByStaffId, reason, lineItems } = payload

    console.log('[POS] Sale cancelled:', saleNumber, 'by', voidedByStaffId)

    await logAuditEvent({
      tenantId,
      userId: voidedByStaffId,
      action: 'POS_SALE_VOIDED',
      targetType: 'SALE',
      targetId: saleId,
      details: {
        saleNumber,
        reason,
        originalStaffId: staffId,
        itemCount: lineItems.length,
        idempotencyKey
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.sale.cancelled', tenantId)
    return { success: true }
  } catch (error) {
    console.error('[POS] Error handling sale cancelled:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function handlePaymentCaptured(
  event: POSEventBase & { payload: PaymentCapturedPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, paymentId, saleId, staffId, method, amount, tipAmount } = payload

    console.log('[POS] Payment captured:', method, '$' + amount, 'for sale', saleId)

    await logAuditEvent({
      tenantId,
      userId: staffId,
      action: 'POS_PAYMENT_RECORDED',
      targetType: 'PAYMENT',
      targetId: paymentId,
      details: {
        saleId,
        method,
        amount,
        tipAmount: tipAmount || 0,
        idempotencyKey
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.payment.captured', tenantId)
    return { success: true }
  } catch (error) {
    console.error('[POS] Error handling payment captured:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function handleRefundCreated(
  event: POSEventBase & { payload: RefundCreatedPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, refundId, refundNumber, staffId, totalRefunded, reason, items } = payload

    console.log('[POS] Refund created:', refundNumber, 'for $' + totalRefunded)

    await logAuditEvent({
      tenantId,
      userId: staffId,
      action: 'POS_REFUND_CREATED',
      targetType: 'REFUND',
      targetId: refundId,
      details: {
        refundNumber,
        totalRefunded,
        reason,
        itemCount: items.length,
        idempotencyKey
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.refund.created', tenantId)
    return { success: true }
  } catch (error) {
    console.error('[POS] Error handling refund created:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================================================
// EVENT ROUTER
// ============================================================================

export async function handlePOSEvent(
  event: POSEventBase & { payload: Record<string, unknown> }
): Promise<{ success: boolean; error?: string }> {
  console.log('[POS] Received event:', event.eventType)

  switch (event.eventType) {
    case 'pos.sale.completed':
      return handleSaleCompleted(event as POSEventBase & { payload: SaleCompletedPayload })
    case 'pos.sale.cancelled':
    case 'pos.sale.voided':
      return handleSaleCancelled(event as POSEventBase & { payload: SaleCancelledPayload })
    case 'pos.payment.captured':
      return handlePaymentCaptured(event as POSEventBase & { payload: PaymentCapturedPayload })
    case 'pos.refund.created':
      return handleRefundCreated(event as POSEventBase & { payload: RefundCreatedPayload })
    default:
      console.log('[POS] Unhandled event type:', event.eventType)
      return { success: true }
  }
}

// ============================================================================
// POS ENTITLEMENT SERVICE
// ============================================================================

export async function getPOSEntitlements(tenantId: string): Promise<{
  module: 'POS'
  features: string[]
  limits: Record<string, number | null>
  expiresAt: string | null
} | null> {
  try {
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_module: { tenantId, module: 'POS' }
      }
    })

    if (!entitlement || entitlement.status !== 'ACTIVE') {
      return null
    }

    const limits = (entitlement.limits as Record<string, number | null>) || {}
    const features: string[] = ['offline']
    
    if ((limits.max_registers ?? 1) > 1) features.push('multi_register')
    if (limits.layaway_enabled) features.push('layaway')
    if (limits.advanced_discounts) features.push('advanced_discounts')
    if (limits.custom_receipts) features.push('custom_receipts')
    if (limits.reports_enabled !== false) features.push('reports')
    if (limits.api_enabled) features.push('api')

    return {
      module: 'POS',
      features,
      limits: {
        max_locations: limits.max_locations ?? 1,
        max_registers: limits.max_registers ?? 1,
        max_staff: limits.max_staff ?? 5,
        max_offline_transactions: limits.max_offline_transactions ?? 50,
        max_products_cache: limits.max_products_cache ?? 500
      },
      expiresAt: entitlement.validUntil?.toISOString() || null
    }
  } catch (error) {
    console.error('[POS] Error fetching entitlements:', error)
    return null
  }
}
