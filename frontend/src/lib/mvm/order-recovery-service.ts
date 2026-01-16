/**
 * MVM Order Recovery Service
 * 
 * Wave K.3: Safe order recovery and resilience mechanisms
 * 
 * Features:
 * - Resume checkout from cart (user-triggered)
 * - Re-initiate payment without duplicating orders
 * - Order expiration handling (EXPIRED state)
 * 
 * Constraints:
 * - No cron jobs
 * - No background workers
 * - User-triggered recovery only
 */

import { prisma } from '@/lib/prisma'
import { PaymentExecutionService } from '@/lib/payment-execution/execution-service'
import { OrderSplitService } from './order-split-service'

const ORDER_EXPIRATION_HOURS = 24

export interface RecoveryCheckResult {
  canRecover: boolean
  reason: string
  orderNumber?: string
  parentOrderId?: string
  status?: string
  paymentStatus?: string
  isExpired?: boolean
  expiresAt?: Date
}

export interface PaymentRetryResult {
  success: boolean
  error?: string
  authorizationUrl?: string
  reference?: string
  isDemo: boolean
}

export class OrderRecoveryService {
  /**
   * Check if an order can be recovered
   */
  static async checkRecoveryStatus(
    parentOrderId: string
  ): Promise<RecoveryCheckResult> {
    const order = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true
      }
    })

    if (!order) {
      return {
        canRecover: false,
        reason: 'Order not found'
      }
    }

    if (order.status === 'CANCELLED') {
      return {
        canRecover: false,
        reason: 'Order has been cancelled',
        orderNumber: order.orderNumber,
        parentOrderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    }

    if (order.status === 'EXPIRED') {
      return {
        canRecover: false,
        reason: 'Order has expired',
        orderNumber: order.orderNumber,
        parentOrderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        isExpired: true
      }
    }

    if (order.paymentStatus === 'CAPTURED' || order.paymentStatus === 'PAID') {
      return {
        canRecover: false,
        reason: 'Payment already completed',
        orderNumber: order.orderNumber,
        parentOrderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    }

    const expiresAt = new Date(order.createdAt)
    expiresAt.setHours(expiresAt.getHours() + ORDER_EXPIRATION_HOURS)
    
    if (new Date() > expiresAt) {
      await this.expireOrder(order.id, 'Payment not received within time limit')
      
      return {
        canRecover: false,
        reason: 'Order has expired due to unpaid timeout',
        orderNumber: order.orderNumber,
        parentOrderId: order.id,
        status: 'EXPIRED',
        paymentStatus: order.paymentStatus,
        isExpired: true,
        expiresAt
      }
    }

    if (order.paymentMethod === 'COD') {
      return {
        canRecover: false,
        reason: 'Cash on Delivery orders do not require payment recovery',
        orderNumber: order.orderNumber,
        parentOrderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    }

    return {
      canRecover: true,
      reason: 'Order payment can be retried',
      orderNumber: order.orderNumber,
      parentOrderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      expiresAt
    }
  }

  /**
   * Retry payment for an unpaid order
   * 
   * Does NOT create a new order - reuses existing order
   */
  static async retryPayment(
    parentOrderId: string,
    tenantSlug: string
  ): Promise<PaymentRetryResult> {
    const recoveryCheck = await this.checkRecoveryStatus(parentOrderId)

    if (!recoveryCheck.canRecover) {
      return {
        success: false,
        error: recoveryCheck.reason,
        isDemo: false
      }
    }

    const order = await prisma.mvm_parent_order.findUnique({
      where: { id: parentOrderId },
      select: {
        id: true,
        tenantId: true,
        orderNumber: true,
        customerEmail: true,
        customerName: true,
        grandTotal: true,
        subOrders: { select: { id: true } }
      }
    })

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
        isDemo: false
      }
    }

    const partnerReferral = await prisma.partnerReferral.findUnique({
      where: { tenantId: order.tenantId },
      select: { partnerId: true }
    })

    if (!partnerReferral) {
      return {
        success: false,
        error: 'Partner configuration not found',
        isDemo: false
      }
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/${tenantSlug}/orders?ref=${order.orderNumber}`

    const paymentResponse = await PaymentExecutionService.initiatePayment({
      tenantId: order.tenantId,
      partnerId: partnerReferral.partnerId,
      amount: Number(order.grandTotal),
      currency: 'NGN',
      customerEmail: order.customerEmail,
      customerName: order.customerName || undefined,
      sourceModule: 'mvm',
      sourceType: 'mvm_order',
      sourceId: order.id,
      callbackUrl,
      metadata: {
        orderNumber: order.orderNumber,
        vendorCount: order.subOrders.length,
        isRetry: true
      }
    })

    if (!paymentResponse.success) {
      return {
        success: false,
        error: paymentResponse.error,
        isDemo: paymentResponse.isDemo
      }
    }

    await OrderSplitService.updatePaymentStatus(
      order.id,
      'PENDING',
      paymentResponse.reference
    )

    return {
      success: true,
      authorizationUrl: paymentResponse.authorizationUrl,
      reference: paymentResponse.reference,
      isDemo: paymentResponse.isDemo
    }
  }

  /**
   * Expire an order due to payment timeout
   */
  static async expireOrder(
    parentOrderId: string,
    reason: string
  ): Promise<void> {
    const now = new Date()

    await prisma.mvm_sub_order.updateMany({
      where: { parentOrderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelReason: reason
      }
    })

    await prisma.mvm_parent_order.update({
      where: { id: parentOrderId },
      data: {
        status: 'EXPIRED',
        cancelledAt: now,
        cancelReason: reason
      }
    })
  }

  /**
   * Check for expired orders for a tenant (user-triggered, not background job)
   * 
   * Called when user loads order list or order detail
   */
  static async checkAndExpireOrders(tenantId: string): Promise<number> {
    const expirationCutoff = new Date()
    expirationCutoff.setHours(expirationCutoff.getHours() - ORDER_EXPIRATION_HOURS)

    const pendingOrders = await prisma.mvm_parent_order.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        paymentStatus: { in: ['PENDING', 'FAILED'] },
        paymentMethod: { not: 'COD' },
        createdAt: { lt: expirationCutoff }
      },
      select: { id: true }
    })

    let expiredCount = 0

    for (const order of pendingOrders) {
      await this.expireOrder(order.id, 'Payment not received within time limit')
      expiredCount++
    }

    return expiredCount
  }

  /**
   * Get customer-facing recovery message
   */
  static getRecoveryMessage(status: RecoveryCheckResult): string {
    if (status.isExpired) {
      return 'This order has expired. Please place a new order.'
    }

    if (status.canRecover) {
      const expiresIn = status.expiresAt 
        ? Math.max(0, Math.floor((status.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)))
        : 0
      return `Payment pending. You have ${expiresIn} hours to complete payment.`
    }

    return status.reason
  }
}
