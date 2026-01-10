/**
 * PAYMENTS & COLLECTIONS SUITE
 * Partial Payment Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Handles partial payment logic for bank transfers:
 * - Partial payment tracking
 * - Balance calculation
 * - Parent-child payment relationships
 * 
 * @module lib/payments/partial-payment-service
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'
import { PayPaymentMethod, PayPaymentStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface PartialPaymentSummary {
  orderId: string
  orderNumber?: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentCount: number
  payments: PartialPaymentRecord[]
  isFullyPaid: boolean
}

export interface PartialPaymentRecord {
  id: string
  transactionNumber: string
  amount: number
  paidAt: Date
  paymentMethod: PayPaymentMethod
  isPartial: boolean
}

// ============================================================================
// PARTIAL PAYMENT SERVICE
// ============================================================================

export class PartialPaymentService {
  /**
   * Check if partial payments are enabled for a tenant
   */
  static async isEnabled(tenantId: string): Promise<boolean> {
    const config = await prisma.pay_configurations.findUnique({
      where: { tenantId },
      select: { partialPaymentsEnabled: true }
    })
    return config?.partialPaymentsEnabled ?? false
  }

  /**
   * Get partial payment summary for an order
   */
  static async getPaymentSummary(
    tenantId: string,
    orderId: string
  ): Promise<PartialPaymentSummary | null> {
    // Get all payments for this order
    const payments = await prisma.pay_payment_transactions.findMany({
      where: {
        tenantId,
        orderId,
        status: 'CONFIRMED' as PayPaymentStatus
      },
      orderBy: { confirmedAt: 'asc' }
    })

    if (payments.length === 0) {
      return null
    }

    // Get original order total (from first payment intent or order)
    const intent = await prisma.pay_payment_intents.findFirst({
      where: { tenantId, orderId },
      orderBy: { createdAt: 'asc' }
    })

    const totalAmount = intent?.amount.toNumber() || 
      payments.reduce((sum: any, p: any) => sum + p.amount.toNumber(), 0)

    const paidAmount = payments.reduce((sum: any, p: any) => sum + p.amount.toNumber(), 0)
    const remainingAmount = Math.max(0, totalAmount - paidAmount)

    return {
      orderId,
      orderNumber: payments[0].orderNumber ?? undefined,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentCount: payments.length,
      payments: payments.map((p: any) => ({
        id: p.id,
        transactionNumber: p.transactionNumber,
        amount: p.amount.toNumber(),
        paidAt: p.confirmedAt!,
        paymentMethod: p.paymentMethod,
        isPartial: p.isPartialPayment
      })),
      isFullyPaid: remainingAmount <= 0
    }
  }

  /**
   * Record a partial payment
   */
  static async recordPartialPayment(
    tenantId: string,
    input: {
      orderId: string
      orderNumber?: string
      amount: number
      paymentMethod: PayPaymentMethod
      gatewayReference?: string
      processedBy?: string
    }
  ): Promise<{
    payment: PartialPaymentRecord
    summary: PartialPaymentSummary
  }> {
    // Check if enabled
    const isEnabled = await this.isEnabled(tenantId)
    if (!isEnabled) {
      throw new Error('Partial payments are not enabled for this tenant')
    }

    // Get existing payment summary
    const existingSummary = await this.getPaymentSummary(tenantId, input.orderId)
    
    // If there are existing payments, get the parent payment ID
    let parentPaymentId: string | undefined
    if (existingSummary && existingSummary.payments.length > 0) {
      // First payment becomes the "parent"
      parentPaymentId = existingSummary.payments[0].id
    }

    // Generate transaction number
    const count = await prisma.pay_payment_transactions.count({ where: { tenantId } })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const transactionNumber = `PAY-${year}${month}-${(count + 1).toString().padStart(6, '0')}`

    // Create partial payment record
    const payment = await prisma.pay_payment_transactions.create({
      data: withPrismaDefaults({
        tenantId,
        transactionNumber,
        amount: input.amount,
        currency: 'NGN',
        gatewayFee: 0,
        platformFee: 0,
        netAmount: input.amount,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        paymentMethod: input.paymentMethod,
        gatewayReference: input.gatewayReference,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        processedBy: input.processedBy,
        isPartialPayment: true,
        partialPaymentOf: parentPaymentId
      }) // AUTO-FIX: required by Prisma schema
    })

    // Log event
    await prisma.pay_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType: 'PARTIAL_PAYMENT_RECORDED',
        eventData: {
          transactionNumber,
          orderId: input.orderId,
          amount: input.amount,
          parentPaymentId
        },
        paymentId: payment.id
      }) // AUTO-FIX: required by Prisma schema
    })

    // Get updated summary
    const updatedSummary = await this.getPaymentSummary(tenantId, input.orderId)

    return {
      payment: {
        id: payment.id,
        transactionNumber: payment.transactionNumber,
        amount: payment.amount.toNumber(),
        paidAt: payment.confirmedAt!,
        paymentMethod: payment.paymentMethod,
        isPartial: true
      },
      summary: updatedSummary!
    }
  }

  /**
   * Get all partial payment chains for a tenant
   */
  static async getPartialPaymentChains(
    tenantId: string,
    options?: {
      onlyIncomplete?: boolean
      page?: number
      limit?: number
    }
  ): Promise<{
    chains: PartialPaymentSummary[]
    total: number
  }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    // Get orders with partial payments
    const ordersWithPartials = await prisma.pay_payment_transactions.groupBy({
      by: ['orderId'],
      where: {
        tenantId,
        isPartialPayment: true,
        orderId: { not: null }
      },
      _count: { id: true }
    })

    const orderIds = ordersWithPartials
      .map((o: any) => o.orderId)
      .filter((id): id is string => id !== null)

    // Get summaries for each order
    const summaries: PartialPaymentSummary[] = []
    
    for (const orderId of orderIds.slice(skip, skip + limit)) {
      const summary = await this.getPaymentSummary(tenantId, orderId)
      if (summary) {
        if (options?.onlyIncomplete && summary.isFullyPaid) {
          continue
        }
        summaries.push(summary)
      }
    }

    return {
      chains: summaries,
      total: orderIds.length
    }
  }

  /**
   * Calculate minimum partial payment allowed
   * Business rule: At least 10% of remaining amount, minimum ₦1,000
   */
  static calculateMinimumPartialPayment(remainingAmount: number): number {
    const tenPercent = Math.ceil(remainingAmount * 0.1)
    return Math.max(tenPercent, 1000)
  }
}
