/**
 * Payment Webhook Processor
 * 
 * Wave K.3 + B1-Fix: Handles payment webhook processing for order finalization
 * 
 * Canonical flow: PAYMENT_CONFIRMED → ORDER_CONFIRMED → INVENTORY_DEDUCTED
 * 
 * Supports:
 * - Paystack webhooks (production)
 * - Demo webhooks (simulation)
 * 
 * Key features:
 * - Idempotent processing (duplicate events are safely ignored)
 * - Demo vs live behavior preserved
 * - P0-1 FIX: Inventory now deducted ONLY on payment success (not at checkout)
 */

import { prisma } from '@/lib/prisma'
import { TransactionService } from './transaction-service'
import { OrderSplitService } from '@/lib/mvm/order-split-service'
import { InventorySyncEngine } from '@/lib/commerce/inventory-engine/inventory-sync-engine'
import { generateMvmOrderReceipt, generateSvmOrderReceipt } from '@/lib/commerce/receipt/order-receipt-service'
import crypto from 'crypto'

export type WebhookEvent = 'charge.success' | 'charge.failed' | 'transfer.success' | 'transfer.failed'

export interface WebhookPayload {
  event: WebhookEvent
  data: {
    reference: string
    amount: number
    currency: string
    status: string
    channel?: string
    paid_at?: string
    metadata?: Record<string, unknown>
    gateway_response?: string
    fees?: number
  }
}

export interface WebhookResult {
  success: boolean
  message: string
  transactionId?: string
  orderId?: string
  alreadyProcessed?: boolean
  isDemo?: boolean
}

export class WebhookProcessor {
  /**
   * Verify Paystack webhook signature
   */
  static verifyPaystackSignature(
    payload: string,
    signature: string,
    secretKey: string
  ): boolean {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(payload)
      .digest('hex')
    
    return hash === signature
  }

  /**
   * Process a payment webhook
   * 
   * Idempotent: duplicate events are safely ignored
   */
  static async processPaymentWebhook(
    payload: WebhookPayload,
    isDemo: boolean = false
  ): Promise<WebhookResult> {
    const { event, data } = payload

    if (event !== 'charge.success' && event !== 'charge.failed') {
      return {
        success: true,
        message: `Event ${event} not handled - ignored`,
        isDemo
      }
    }

    const transaction = await TransactionService.getByReference(data.reference)
    
    if (!transaction) {
      const providerTx = await prisma.paymentTransaction.findFirst({
        where: { providerReference: data.reference }
      })
      
      if (!providerTx) {
        return {
          success: false,
          message: `Transaction not found: ${data.reference}`,
          isDemo
        }
      }

      return this.processTransaction(providerTx.reference, event, data, isDemo)
    }

    return this.processTransaction(transaction.reference, event, data, isDemo)
  }

  /**
   * Process a transaction update
   */
  private static async processTransaction(
    reference: string,
    event: WebhookEvent,
    data: WebhookPayload['data'],
    isDemo: boolean
  ): Promise<WebhookResult> {
    const transaction = await TransactionService.getByReference(reference)
    
    if (!transaction) {
      return {
        success: false,
        message: `Transaction not found: ${reference}`,
        isDemo
      }
    }

    if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
      return {
        success: true,
        message: `Transaction already processed: ${transaction.status}`,
        transactionId: transaction.id,
        alreadyProcessed: true,
        isDemo
      }
    }

    const newStatus = event === 'charge.success' ? 'SUCCESS' : 'FAILED'

    await TransactionService.updateStatus(reference, newStatus, {
      verifiedAt: new Date(),
      completedAt: new Date(),
      channel: data.channel,
      gatewayResponse: data.gateway_response,
      fee: data.fees,
      netAmount: data.amount - (data.fees || 0)
    })

    if (transaction.sourceType === 'mvm_order' && transaction.sourceId) {
      await this.finalizeMvmOrder(
        transaction.sourceId,
        newStatus === 'SUCCESS',
        reference
      )
    } else if (transaction.sourceType === 'svm_order' && transaction.sourceId) {
      // Wave C1: Handle SVM order payment confirmation with receipt generation
      await this.finalizeSvmOrder(
        transaction.sourceId,
        newStatus === 'SUCCESS',
        reference
      )
    }

    return {
      success: true,
      message: `Transaction ${newStatus.toLowerCase()}: ${reference}`,
      transactionId: transaction.id,
      orderId: transaction.sourceId || undefined,
      isDemo
    }
  }

  /**
   * Wave C1: Finalize SVM order after payment confirmation
   * 
   * Flow on SUCCESS: PAYMENT_CAPTURED → RECEIPT_GENERATED → ORDER_CONFIRMED
   * Flow on FAILURE: PAYMENT_FAILED → ORDER_CANCELLED
   */
  private static async finalizeSvmOrder(
    orderId: string,
    paymentSuccess: boolean,
    paymentRef: string
  ): Promise<void> {
    const now = new Date()

    if (paymentSuccess) {
      // Update SVM order payment status (using CAPTURED per SvmPaymentStatus enum)
      await prisma.$executeRaw`
        UPDATE svm_orders 
        SET "paymentStatus" = 'CAPTURED',
            "paymentRef" = ${paymentRef},
            "paidAt" = ${now},
            "status" = 'CONFIRMED',
            "updatedAt" = ${now}
        WHERE id = ${orderId}
      `

      console.log(`[WebhookProcessor] SVM order ${orderId} payment confirmed`)

      // Generate receipt for SVM order
      const order = await prisma.svm_orders.findUnique({
        where: { id: orderId },
        select: { tenantId: true }
      })
      
      if (order) {
        const isDemo = await this.isOrderDemo(order.tenantId)
        const receiptResult = await generateSvmOrderReceipt(orderId, isDemo)
        if (receiptResult.success) {
          console.log(`[WebhookProcessor] Generated receipt ${receiptResult.receiptId} for SVM order ${orderId}`)
        } else {
          console.error(`[WebhookProcessor] Failed to generate receipt for SVM order ${orderId}: ${receiptResult.error}`)
        }
      }
    } else {
      // Update SVM order payment status to failed
      await prisma.$executeRaw`
        UPDATE svm_orders 
        SET "paymentStatus" = 'FAILED',
            "status" = 'CANCELLED',
            "cancelledAt" = ${now},
            "cancelReason" = 'Payment failed',
            "updatedAt" = ${now}
        WHERE id = ${orderId}
      `

      console.log(`[WebhookProcessor] SVM order ${orderId} payment failed`)
    }
  }

  /**
   * Finalize MVM order after payment confirmation
   * 
   * P0-1 FIX: Inventory deduction now happens HERE, not at checkout.
   * 
   * Flow on SUCCESS: PAYMENT_CAPTURED → INVENTORY_DEDUCTED → ORDER_CONFIRMED
   * Flow on FAILURE: PAYMENT_FAILED → ORDER_CANCELLED (no inventory to restore)
   * 
   * This ensures inventory is only permanently deducted after payment is confirmed.
   */
  private static async finalizeMvmOrder(
    orderId: string,
    paymentSuccess: boolean,
    paymentRef: string
  ): Promise<void> {
    const now = new Date()

    if (paymentSuccess) {
      await OrderSplitService.updatePaymentStatus(orderId, 'CAPTURED', paymentRef)

      // P0-1 FIX: Deduct inventory ONLY on confirmed payment
      await this.deductOrderInventory(orderId)

      await prisma.mvm_parent_order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paidAt: now,
          inventoryDeductedAt: now
        }
      })

      await prisma.mvm_sub_order.updateMany({
        where: { parentOrderId: orderId, status: 'PENDING' },
        data: { status: 'CONFIRMED' }
      })

      // Wave C1: Generate receipt for MVM order on payment success
      const order = await prisma.mvm_parent_order.findUnique({
        where: { id: orderId },
        select: { tenantId: true }
      })
      if (order) {
        const isDemo = await this.isOrderDemo(order.tenantId)
        const receiptResult = await generateMvmOrderReceipt(orderId, isDemo)
        if (receiptResult.success) {
          console.log(`[WebhookProcessor] Generated receipt ${receiptResult.receiptId} for MVM order ${orderId}`)
        } else {
          console.error(`[WebhookProcessor] Failed to generate receipt for MVM order ${orderId}: ${receiptResult.error}`)
        }
      }
    } else {
      await OrderSplitService.updatePaymentStatus(orderId, 'FAILED', paymentRef)

      // P0-1 FIX: No inventory restoration needed - inventory was never deducted
      // (inventory is now deducted only on payment success, not at checkout)

      await prisma.mvm_sub_order.updateMany({
        where: { parentOrderId: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelReason: 'Payment failed'
        }
      })

      await prisma.mvm_parent_order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelReason: 'Payment failed'
        }
      })
    }
  }

  /**
   * P0-1 FIX: Deduct inventory for an order
   * Called only after payment is confirmed (idempotent via inventoryDeductedAt check)
   */
  private static async deductOrderInventory(orderId: string): Promise<void> {
    const order = await prisma.mvm_parent_order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            productId: true,
            variantId: true,
            quantity: true
          }
        }
      }
    })

    if (!order) {
      console.error(`[WebhookProcessor] Order not found for inventory deduction: ${orderId}`)
      return
    }

    // Idempotency: skip if already deducted
    if (order.inventoryDeductedAt) {
      console.log(`[WebhookProcessor] Inventory already deducted for order ${orderId}, skipping`)
      return
    }

    const engine = new InventorySyncEngine(order.tenantId)

    for (const item of order.items) {
      await engine.processEvent({
        id: `mvm_payment_${Date.now()}_${item.productId}`,
        tenantId: order.tenantId,
        channel: 'MVM',
        eventType: 'SALE',
        productId: item.productId,
        variantId: item.variantId,
        quantity: -item.quantity,
        referenceType: 'mvm_order',
        referenceId: orderId,
        serverTimestamp: new Date(),
        isOffline: false
      })
    }
  }

  /**
   * Wave C1: Check if tenant is in demo mode
   */
  private static async isOrderDemo(tenantId: string): Promise<boolean> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { status: true }
      })
      return tenant?.status === 'DEMO'
    } catch {
      return false
    }
  }

  /**
   * Simulate a demo payment completion
   * 
   * Used for testing without real payment provider
   */
  static async simulateDemoPayment(
    reference: string,
    success: boolean = true
  ): Promise<WebhookResult> {
    const transaction = await TransactionService.getByReference(reference)
    
    if (!transaction) {
      return {
        success: false,
        message: `Transaction not found: ${reference}`,
        isDemo: true
      }
    }

    if (!transaction.isDemo) {
      return {
        success: false,
        message: 'Cannot simulate completion for non-demo transaction',
        isDemo: false
      }
    }

    if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
      return {
        success: true,
        message: `Transaction already processed: ${transaction.status}`,
        transactionId: transaction.id,
        alreadyProcessed: true,
        isDemo: true
      }
    }

    const payload: WebhookPayload = {
      event: success ? 'charge.success' : 'charge.failed',
      data: {
        reference,
        amount: transaction.amount,
        currency: transaction.currency,
        status: success ? 'success' : 'failed',
        channel: 'demo',
        paid_at: new Date().toISOString(),
        gateway_response: success ? 'Demo payment successful' : 'Demo payment failed',
        fees: 0
      }
    }

    return this.processPaymentWebhook(payload, true)
  }
}
