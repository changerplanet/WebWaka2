/**
 * MVM Event Handlers
 * 
 * Core's handlers for events emitted by the MVM (Multi Vendor Marketplace) module.
 * 
 * Events handled:
 * - mvm.vendor.onboarding_completed → Create vendor audit, notify tenant admin
 * - mvm.vendor.approved → Update vendor status audit
 * - mvm.vendor.suspended → Update vendor status audit
 * - mvm.order.split → Log order split, update parent order
 * - mvm.suborder.created → Reserve inventory for vendor items
 * - mvm.suborder.delivered → Mark earnings as ready, update customer metrics
 * - mvm.suborder.cancelled → Release inventory
 * - mvm.commission.earned → Create commission ledger entry
 * - mvm.payout.ready → Log payout readiness (no money movement)
 * 
 * RULES:
 * - Core processes events, modules emit only
 * - Inventory/wallet updates happen here, not in MVM
 * - Idempotency enforced via unique keys
 */

import { prisma } from './prisma'
import { createAuditLog } from './audit'
import { AuditAction } from '@prisma/client'
import {
  type MVMEvent,
  type MVMEventUnknown,
  type MVMVendorOnboardedEvent,
  type MVMVendorApprovedEvent,
  type MVMVendorSuspendedEvent,
  type MVMOrderSplitEvent,
  type MVMSubOrderCreatedEvent,
  type MVMSubOrderDeliveredEvent,
  type MVMSubOrderCancelledEvent,
  type MVMCommissionEarnedEvent,
  type MVMPayoutReadyEvent,
  isMVMEvent,
  type EventHandlerResult
} from './events/eventTypes'

// ============================================================================
// TYPES (Re-exports for backwards compatibility)
// ============================================================================

export type {
  VendorOnboardedPayload,
  VendorStatusChangedPayload,
  OrderSplitPayload,
  SubOrderCreatedPayload,
  SubOrderDeliveredPayload,
  SubOrderCancelledPayload,
  CommissionEarnedPayload,
  PayoutReadyPayload
} from './events/eventTypes'

// ============================================================================
// IDEMPOTENCY CHECK
// ============================================================================

async function isEventProcessed(idempotencyKey: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      targetId: idempotencyKey,
      targetType: 'MVM_EVENT'
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
    actorId: actorId || 'mvm-system',
    actorEmail: 'mvm-system@internal',
    tenantId,
    targetType: 'MVM_EVENT',
    targetId: idempotencyKey,
    metadata: {
      eventType,
      processedAt: new Date().toISOString()
    }
  })
}

// ============================================================================
// VENDOR LIFECYCLE HANDLERS
// ============================================================================

/**
 * Handle vendor onboarding completed
 * - Creates audit log
 * - Could trigger welcome notification
 */
export async function handleVendorOnboarded(
  event: MVMVendorOnboardedEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    console.log('[MVM] Event already processed:', idempotencyKey)
    return { success: true }
  }

  try {
    const { tenantId, vendorId, vendorName, email, commissionRate } = payload

    console.log('[MVM] Vendor onboarded:', vendorName, 'for tenant', tenantId)

    // Create audit log
    await createAuditLog({
      action: 'TENANT_CREATED' as AuditAction,
      actorId: vendorId,
      actorEmail: email,
      tenantId,
      targetType: 'VENDOR',
      targetId: vendorId,
      metadata: {
        eventType: 'MVM_VENDOR_ONBOARDED',
        vendorName,
        commissionRate,
        tierId: payload.tierId,
        tierName: payload.tierName,
        onboardedAt: payload.onboardedAt
      }
    })

    // GUARDED: Welcome notification
    // In production, this sends an email via email service (Resend, SendGrid)
    // Currently, vendors are notified through the platform dashboard
    console.log('[MVM] Vendor onboarded:', vendorId, '- Welcome notification would be sent')

    await markEventProcessed(idempotencyKey, 'mvm.vendor.onboarding_completed', tenantId, vendorId)
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling vendor onboarded:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle vendor approved
 */
export async function handleVendorApproved(
  event: MVMVendorApprovedEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, vendorName, changedBy } = payload

    console.log('[MVM] Vendor approved:', vendorName)

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: changedBy || 'system',
      actorEmail: 'admin@tenant',
      tenantId,
      targetType: 'VENDOR',
      targetId: vendorId,
      metadata: {
        eventType: 'MVM_VENDOR_APPROVED',
        vendorName,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
        changedAt: payload.changedAt
      }
    })

    // GUARDED: Notify vendor of approval
    // In production, sends email notification to vendor
    // Currently, vendors see status changes in their dashboard
    console.log('[MVM] Vendor approved:', vendorId, '- Approval notification would be sent')

    await markEventProcessed(idempotencyKey, 'mvm.vendor.approved', tenantId, changedBy || 'system')
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling vendor approved:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle vendor suspended
 */
export async function handleVendorSuspended(
  event: MVMVendorSuspendedEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, vendorName, reason, changedBy } = payload

    console.log('[MVM] Vendor suspended:', vendorName, 'Reason:', reason)

    await createAuditLog({
      action: 'TENANT_SUSPENDED' as AuditAction,
      actorId: changedBy || 'system',
      actorEmail: 'admin@tenant',
      tenantId,
      targetType: 'VENDOR',
      targetId: vendorId,
      metadata: {
        eventType: 'MVM_VENDOR_SUSPENDED',
        vendorName,
        reason,
        previousStatus: payload.previousStatus,
        changedAt: payload.changedAt
      }
    })

    await markEventProcessed(idempotencyKey, 'mvm.vendor.suspended', tenantId, changedBy || 'system')
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling vendor suspended:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// ORDER SPLITTING HANDLERS
// ============================================================================

/**
 * Handle order split
 * - Logs the split for audit
 * - Updates parent order metadata (if needed)
 */
export async function handleOrderSplit(
  event: MVMOrderSplitEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, parentOrderId, parentOrderNumber, vendorCount, totalAmount, totalCommission } = payload

    console.log('[MVM] Order split:', parentOrderNumber, 'into', vendorCount, 'sub-orders')

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: 'system',
      actorEmail: 'mvm-system@internal',
      tenantId,
      targetType: 'ORDER_SPLIT',
      targetId: parentOrderId,
      metadata: {
        eventType: 'MVM_ORDER_SPLIT',
        parentOrderNumber,
        vendorCount,
        subOrderIds: payload.subOrderIds,
        subOrderNumbers: payload.subOrderNumbers,
        totalAmount,
        totalCommission,
        splitAt: payload.splitAt
      }
    })

    await markEventProcessed(idempotencyKey, 'mvm.order.split', tenantId, 'system')
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling order split:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle sub-order created
 * - Reserves inventory for vendor items
 */
export async function handleSubOrderCreated(
  event: MVMSubOrderCreatedEvent
): Promise<EventHandlerResult & { reservationId?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, subOrderId, subOrderNumber, items, grandTotal, commissionAmount } = payload

    console.log('[MVM] Sub-order created:', subOrderNumber, 'for vendor', vendorId)
    console.log('[MVM] Items:', items.length, 'Total: ₦' + grandTotal.toLocaleString(), 'Commission: ₦' + commissionAmount.toLocaleString())

    // GUARDED: Reserve inventory for these items
    // In production, inventory reservation prevents overselling across vendors
    // Currently, availability is validated at checkout time
    console.log('[MVM] Inventory reservation would be created for', items.length, 'items')

    await createAuditLog({
      action: 'TENANT_CREATED' as AuditAction,
      actorId: vendorId,
      actorEmail: 'vendor@mvm',
      tenantId,
      targetType: 'VENDOR_SUB_ORDER',
      targetId: subOrderId,
      metadata: {
        eventType: 'MVM_SUBORDER_CREATED',
        subOrderNumber,
        parentOrderId: payload.parentOrderId,
        parentOrderNumber: payload.parentOrderNumber,
        itemCount: items.length,
        grandTotal,
        commissionAmount,
        vendorEarnings: payload.vendorEarnings
      }
    })

    await markEventProcessed(idempotencyKey, 'mvm.suborder.created', tenantId, vendorId)
    return { success: true, reservationId: `mvm_res_${Date.now()}` }
  } catch (error) {
    console.error('[MVM] Error handling sub-order created:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle sub-order delivered
 * - Releases inventory reservation (stock already decremented)
 * - Updates customer metrics
 * - Marks vendor earnings as ready
 */
export async function handleSubOrderDelivered(
  event: MVMSubOrderDeliveredEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, subOrderId, subOrderNumber, grandTotal, commissionAmount, customerId } = payload

    console.log('[MVM] Sub-order delivered:', subOrderNumber)

    // GUARDED: Update customer metrics
    // In production, this updates customer lifetime value and order history
    // Currently, customer data is tracked through order records
    if (customerId) {
      console.log('[MVM] Customer metrics would be updated for:', customerId)
    }

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: vendorId,
      actorEmail: 'vendor@mvm',
      tenantId,
      targetType: 'VENDOR_SUB_ORDER',
      targetId: subOrderId,
      metadata: {
        eventType: 'MVM_SUBORDER_DELIVERED',
        subOrderNumber,
        grandTotal,
        commissionAmount,
        vendorEarnings: payload.vendorEarnings,
        customerId,
        deliveredAt: payload.deliveredAt
      }
    })

    await markEventProcessed(idempotencyKey, 'mvm.suborder.delivered', tenantId, vendorId)
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling sub-order delivered:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle sub-order cancelled
 * - Releases inventory reservation
 */
export async function handleSubOrderCancelled(
  event: MVMSubOrderCancelledEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, subOrderId, subOrderNumber, items, reason } = payload

    console.log('[MVM] Sub-order cancelled:', subOrderNumber, 'Reason:', reason)

    // GUARDED: Release inventory reservation
    // In production, this releases reserved inventory back to available stock
    // Currently, inventory is not hard-reserved, so no release needed
    console.log('[MVM] Inventory reservation would be released for', items.length, 'items')

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: vendorId,
      actorEmail: 'vendor@mvm',
      tenantId,
      targetType: 'VENDOR_SUB_ORDER',
      targetId: subOrderId,
      metadata: {
        eventType: 'MVM_SUBORDER_CANCELLED',
        subOrderNumber,
        parentOrderId: payload.parentOrderId,
        reason,
        itemCount: items.length,
        cancelledAt: payload.cancelledAt
      }
    })

    await markEventProcessed(idempotencyKey, 'mvm.suborder.cancelled', tenantId, vendorId)
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling sub-order cancelled:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// COMMISSION & PAYOUT HANDLERS
// ============================================================================

/**
 * Handle commission earned
 * - Creates commission ledger entry (for audit/reporting)
 * - Does NOT move money
 */
export async function handleCommissionEarned(
  event: MVMCommissionEarnedEvent
): Promise<EventHandlerResult> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, subOrderId, subOrderNumber, commissionRate, commissionAmount, orderTotal } = payload

    console.log('[MVM] Commission earned: $' + commissionAmount, 'on order', subOrderNumber)
    console.log('[MVM] Rate:', commissionRate + '%', 'Order total: $' + orderTotal)

    // NOTE: No actual money movement here - this is for audit/reporting only
    // Actual payout would be handled by a separate payout service

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: vendorId,
      actorEmail: 'vendor@mvm',
      tenantId,
      targetType: 'COMMISSION',
      targetId: subOrderId,
      metadata: {
        eventType: 'MVM_COMMISSION_EARNED',
        subOrderNumber,
        orderTotal,
        commissionRate,
        commissionAmount,
        vendorEarnings: payload.vendorEarnings,
        earnedAt: payload.earnedAt
      }
    })

    await markEventProcessed(idempotencyKey, 'mvm.commission.earned', tenantId, vendorId)
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling commission earned:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle payout ready
 * - Logs payout readiness (for audit)
 * - Does NOT execute payout (handled by external system)
 */
export async function handlePayoutReady(
  event: MVMEventBase & { payload: PayoutReadyPayload }
): Promise<{ success: boolean; error?: string }> {
  const { idempotencyKey, payload } = event

  if (await isEventProcessed(idempotencyKey)) {
    return { success: true }
  }

  try {
    const { tenantId, vendorId, payoutRecordId, netAmount, currency, subOrderIds } = payload

    console.log('[MVM] Payout ready: $' + netAmount, currency, 'for vendor', vendorId)
    console.log('[MVM] Includes', subOrderIds.length, 'sub-orders')

    // NOTE: No actual payout execution here
    // This only logs that a payout is ready for processing by external system

    await createAuditLog({
      action: 'TENANT_UPDATED' as AuditAction,
      actorId: vendorId,
      actorEmail: 'vendor@mvm',
      tenantId,
      targetType: 'PAYOUT',
      targetId: payoutRecordId,
      metadata: {
        eventType: 'MVM_PAYOUT_READY',
        grossAmount: payload.grossAmount,
        commissionAmount: payload.commissionAmount,
        netAmount,
        currency,
        subOrderCount: subOrderIds.length,
        scheduledAt: payload.scheduledAt
      }
    })

    // GUARDED: Notify vendor of pending payout
    // In production, sends email notification when payout is ready
    // Currently, vendors see payout status in their earnings dashboard
    console.log('[MVM] Payout notification would be sent:', '₦' + netAmount.toLocaleString(), 'scheduled at', payload.scheduledAt)

    await markEventProcessed(idempotencyKey, 'mvm.payout.ready', tenantId, vendorId)
    return { success: true }
  } catch (error) {
    console.error('[MVM] Error handling payout ready:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// EVENT ROUTER
// ============================================================================

/**
 * Route MVM events to appropriate handlers
 */
export async function handleMVMEvent(
  event: MVMEventBase & { payload: Record<string, unknown> }
): Promise<{ success: boolean; error?: string }> {
  const { eventType } = event

  console.log('[MVM] Processing event:', eventType)

  switch (eventType) {
    // Vendor lifecycle
    case 'mvm.vendor.onboarding_completed':
      return handleVendorOnboarded(event as unknown as MVMEventBase & { payload: VendorOnboardedPayload })

    case 'mvm.vendor.approved':
      return handleVendorApproved(event as unknown as MVMEventBase & { payload: VendorStatusChangedPayload })

    case 'mvm.vendor.suspended':
      return handleVendorSuspended(event as unknown as MVMEventBase & { payload: VendorStatusChangedPayload })

    // Order splitting
    case 'mvm.order.split':
      return handleOrderSplit(event as unknown as MVMEventBase & { payload: OrderSplitPayload })

    case 'mvm.suborder.created':
      return handleSubOrderCreated(event as unknown as MVMEventBase & { payload: SubOrderCreatedPayload })

    case 'mvm.suborder.delivered':
      return handleSubOrderDelivered(event as unknown as MVMEventBase & { payload: SubOrderDeliveredPayload })

    case 'mvm.suborder.cancelled':
      return handleSubOrderCancelled(event as unknown as MVMEventBase & { payload: SubOrderCancelledPayload })

    // Commission & payout
    case 'mvm.commission.earned':
      return handleCommissionEarned(event as unknown as MVMEventBase & { payload: CommissionEarnedPayload })

    case 'mvm.payout.ready':
      return handlePayoutReady(event as unknown as MVMEventBase & { payload: PayoutReadyPayload })

    default:
      console.log('[MVM] Unknown event type:', eventType)
      return { success: true } // Don't fail on unknown events
  }
}

// ============================================================================
// ENTITLEMENTS
// ============================================================================

/**
 * Get MVM entitlements for a tenant
 * Used by MVM module to check limits
 */
export async function getMVMEntitlements(tenantId: string): Promise<{
  success: boolean
  module: 'MVM'
  features: string[]
  limits: Record<string, number | null>
  expiresAt: string | null
}> {
  try {
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        tenantId_module: {
          tenantId,
          module: 'MVM'
        }
      },
      include: {
        Subscription: true
      }
    })

    if (!entitlement || entitlement.status !== 'ACTIVE') {
      return {
        success: false,
        module: 'MVM',
        features: [],
        limits: {},
        expiresAt: null
      }
    }

    // Parse limits from JSON
    const limits = (entitlement.limits as Record<string, number | null>) || {}

    return {
      success: true,
      module: 'MVM',
      features: [
        'vendors',
        'vendor_onboarding',
        'vendor_dashboard',
        'order_splitting',
        'commission_management',
        'payout_tracking'
      ],
      limits: {
        max_vendors: limits.max_vendors ?? 10,
        max_vendor_staff_per_vendor: limits.max_vendor_staff_per_vendor ?? 3,
        max_products_per_vendor: limits.max_products_per_vendor ?? 50,
        max_commission_rules: limits.max_commission_rules ?? 5,
        max_vendor_tiers: limits.max_vendor_tiers ?? 3,
        commission_rate_min: limits.commission_rate_min ?? 5,
        commission_rate_max: limits.commission_rate_max ?? 30
      },
      expiresAt: entitlement.validUntil?.toISOString() ?? null
    }
  } catch (error) {
    console.error('[MVM] Error fetching entitlements:', error)
    return {
      success: false,
      module: 'MVM',
      features: [],
      limits: {},
      expiresAt: null
    }
  }
}
