/**
 * Payment Webhook Processor
 * 
 * Wave K.3: Handles payment webhook processing for order finalization
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
 */

import { prisma } from '@/lib/prisma'
import { TransactionService } from './transaction-service'
import { OrderSplitService } from '@/lib/mvm/order-split-service'
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
      await this.finalizeOrder(
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
   * Finalize order after payment confirmation
   * 
   * Flow on SUCCESS: PAYMENT_CAPTURED → ORDER_CONFIRMED → sub-orders CONFIRMED
   * Flow on FAILURE: PAYMENT_FAILED → ORDER_CANCELLED → sub-orders CANCELLED
   * 
   * NOTE: Inventory was already deducted at checkout (Wave K.2).
   * On payment failure, inventory is NOT automatically restored (documented gap).
   */
  private static async finalizeOrder(
    orderId: string,
    paymentSuccess: boolean,
    paymentRef: string
  ): Promise<void> {
    const now = new Date()

    if (paymentSuccess) {
      await OrderSplitService.updatePaymentStatus(orderId, 'CAPTURED', paymentRef)

      await prisma.mvm_parent_order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paidAt: now
        }
      })

      await prisma.mvm_sub_order.updateMany({
        where: { parentOrderId: orderId, status: 'PENDING' },
        data: { status: 'CONFIRMED' }
      })
    } else {
      await OrderSplitService.updatePaymentStatus(orderId, 'FAILED', paymentRef)

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
