/**
 * POS Event Handlers
 * 
 * Core's handlers for events emitted by the POS module.
 */

import { prisma } from './prisma'
import { createAuditLog } from './audit'
import { AuditAction } from '@prisma/client'

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
      targetId: idempotencyKey,
      action: 'SETTINGS_UPDATED' // Using existing action for POS events
    }
  })
  return !!existing
}

async function markEventProcessed(
  idempotencyKey: string, 
  eventType: string,
  tenantId: string,
  staffId: string
): Promise<void> {
  await createAuditLog({
    action: 'SETTINGS_UPDATED' as AuditAction, // Using existing action
    actorId: staffId || 'system',
    actorEmail: 'pos-system@internal',
    tenantId,
    targetType: 'POS_EVENT',
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

    await createAuditLog({
      action: 'TENANT_CREATED' as AuditAction, // Using for POS_SALE_COMPLETED
      actorId: staffId,
      actorEmail: 'pos@internal',
      tenantId,
      targetType: 'SALE',
      targetId: saleId,
      metadata: {
        eventType: 'POS_SALE_COMPLETED',
        saleNumber,
        grandTotal,
        itemCount: lineItems.length,
        paymentMethods: payments.map(p => p.method)
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.sale.completed', tenantId, staffId)
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

    await createAuditLog({
      action: 'TENANT_SUSPENDED' as AuditAction, // Using for POS_SALE_VOIDED
      actorId: voidedByStaffId,
      actorEmail: 'pos@internal',
      tenantId,
      targetType: 'SALE',
      targetId: saleId,
      metadata: {
        eventType: 'POS_SALE_VOIDED',
        saleNumber,
        reason,
        originalStaffId: staffId,
        itemCount: lineItems.length
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.sale.cancelled', tenantId, voidedByStaffId)
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

    await createAuditLog({
      action: 'SETTINGS_UPDATED' as AuditAction, // Using for POS_PAYMENT
      actorId: staffId,
      actorEmail: 'pos@internal',
      tenantId,
      targetType: 'PAYMENT',
      targetId: paymentId,
      metadata: {
        eventType: 'POS_PAYMENT_RECORDED',
        saleId,
        method,
        amount,
        tipAmount: tipAmount || 0
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.payment.captured', tenantId, staffId)
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

    await createAuditLog({
      action: 'TENANT_REACTIVATED' as AuditAction, // Using for POS_REFUND
      actorId: staffId,
      actorEmail: 'pos@internal',
      tenantId,
      targetType: 'REFUND',
      targetId: refundId,
      metadata: {
        eventType: 'POS_REFUND_CREATED',
        refundNumber,
        totalRefunded,
        reason,
        itemCount: items.length
      }
    })

    await markEventProcessed(idempotencyKey, 'pos.refund.created', tenantId, staffId)
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
      return handleSaleCompleted(event as unknown as POSEventBase & { payload: SaleCompletedPayload })
    case 'pos.sale.cancelled':
    case 'pos.sale.voided':
      return handleSaleCancelled(event as unknown as POSEventBase & { payload: SaleCancelledPayload })
    case 'pos.payment.captured':
      return handlePaymentCaptured(event as unknown as POSEventBase & { payload: PaymentCapturedPayload })
    case 'pos.refund.created':
      return handleRefundCreated(event as unknown as POSEventBase & { payload: RefundCreatedPayload })
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

    const limits = (entitlement.limits as Record<string, unknown>) || {}
    const features: string[] = ['offline']
    
    const maxRegisters = typeof limits.max_registers === 'number' ? limits.max_registers : 1
    if (maxRegisters > 1) features.push('multi_register')
    if (limits.layaway_enabled === true) features.push('layaway')
    if (limits.advanced_discounts === true) features.push('advanced_discounts')
    if (limits.custom_receipts === true) features.push('custom_receipts')
    if (limits.reports_enabled !== false) features.push('reports')
    if (limits.api_enabled === true) features.push('api')

    return {
      module: 'POS',
      features,
      limits: {
        max_locations: typeof limits.max_locations === 'number' ? limits.max_locations : 1,
        max_registers: maxRegisters,
        max_staff: typeof limits.max_staff === 'number' ? limits.max_staff : 5,
        max_offline_transactions: typeof limits.max_offline_transactions === 'number' ? limits.max_offline_transactions : 50,
        max_products_cache: typeof limits.max_products_cache === 'number' ? limits.max_products_cache : 500
      },
      expiresAt: entitlement.validUntil?.toISOString() || null
    }
  } catch (error) {
    console.error('[POS] Error fetching entitlements:', error)
    return null
  }
}
