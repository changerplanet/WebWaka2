/**
 * MODULE 10: PAYMENTS & WALLETS
 * Payment Service
 * 
 * PHASE 3: Payment Intents & Execution
 * 
 * 🚨 CRITICAL:
 * - Orders REQUEST payment, not EXECUTE
 * - Payment execution emits events
 * - No double charges (idempotency enforced)
 */

import { prisma } from '@/lib/prisma'
import { PayPaymentMethod, PayIntentStatus, PayPaymentStatus, Prisma } from '@prisma/client'
import { WalletService } from './wallet-service'
import { v4 as uuidv4 } from 'uuid'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentIntent {
  id: string
  tenantId: string
  intentId: string
  amount: number
  currency: string
  orderId: string | null
  orderNumber: string | null
  customerId: string | null
  customerEmail: string | null
  customerPhone: string | null
  paymentMethod: PayPaymentMethod | null
  status: PayIntentStatus
  expiresAt: Date | null
  paymentId: string | null
  createdAt: Date
}

export interface PaymentTransaction {
  id: string
  tenantId: string
  transactionNumber: string
  intentId: string | null
  amount: number
  currency: string
  gatewayFee: number
  platformFee: number
  netAmount: number
  orderId: string | null
  orderNumber: string | null
  customerId: string | null
  paymentMethod: PayPaymentMethod
  status: PayPaymentStatus
  confirmedAt: Date | null
  createdAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class PaymentService {
  /**
   * Generate transaction number
   */
  private static async generateTransactionNumber(tenantId: string): Promise<string> {
    const count = await prisma.pay_payment_transactions.count({ where: { tenantId } })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `PAY-${year}${month}-${(count + 1).toString().padStart(6, '0')}`
  }

  /**
   * Create payment intent
   */
  static async createIntent(
    tenantId: string,
    input: {
      amount: number
      currency?: string
      orderId?: string
      orderNumber?: string
      customerId?: string
      customerEmail?: string
      customerPhone?: string
      paymentMethod?: PayPaymentMethod
      expiresInMinutes?: number
      idempotencyKey?: string
    }
  ): Promise<PaymentIntent> {
    // Check idempotency
    if (input.idempotencyKey) {
      const existing = await prisma.pay_payment_intents.findFirst({
        where: { tenantId, idempotencyKey: input.idempotencyKey },
      })
      if (existing) {
        return this.formatIntent(existing)
      }
    }

    const intentId = `pi_${uuidv4().replace(/-/g, '')}`
    const expiresAt = input.expiresInMinutes
      ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000)
      : null

    const intent = await prisma.pay_payment_intents.create({
      data: withPrismaDefaults({
        tenantId,
        intentId,
        amount: input.amount,
        currency: input.currency || 'NGN',
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        customerId: input.customerId,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        paymentMethod: input.paymentMethod,
        expiresAt,
        idempotencyKey: input.idempotencyKey,
        status: 'CREATED',
      }),
    })

    // Log event
    await this.logEvent(tenantId, 'PAYMENT_INTENT_CREATED', {
      intentId: intent.intentId,
      amount: input.amount,
      orderId: input.orderId,
    })

    return this.formatIntent(intent)
  }

  /**
   * Confirm payment (execute)
   * 🚨 This is where money actually moves
   */
  static async confirmPayment(
    tenantId: string,
    intentId: string,
    options: {
      paymentMethod: PayPaymentMethod
      methodDetails?: Record<string, unknown>
      gatewayReference?: string
      gatewayResponse?: Record<string, unknown>
      processedBy?: string
      idempotencyKey?: string
    }
  ): Promise<PaymentTransaction> {
    // Check idempotency for transaction
    if (options.idempotencyKey) {
      const existing = await prisma.pay_payment_transactions.findFirst({
        where: { tenantId, idempotencyKey: options.idempotencyKey },
      })
      if (existing) {
        return this.formatTransaction(existing)
      }
    }

    // Get intent
    const intent = await prisma.pay_payment_intents.findFirst({
      where: { tenantId, intentId },
    })

    if (!intent) throw new Error('Payment intent not found')
    if (intent.status === 'SUCCEEDED') throw new Error('Payment already confirmed')
    if (intent.status === 'CANCELLED') throw new Error('Payment was cancelled')
    if (intent.expiresAt && intent.expiresAt < new Date()) {
      await prisma.pay_payment_intents.update({
        where: { id: intent.id },
        data: { status: 'EXPIRED' },
      })
      throw new Error('Payment intent expired')
    }

    // Update intent to processing
    await prisma.pay_payment_intents.update({
      where: { id: intent.id },
      data: { status: 'PROCESSING', paymentMethod: options.paymentMethod },
    })

    // Calculate fees
    const config = await prisma.pay_configurations.findUnique({ where: { tenantId } })
    const platformFee = config?.platformCommission
      ? (intent.amount.toNumber() * config.platformCommission.toNumber()) / 100
      : 0
    const gatewayFee = 0 // Would come from gateway response

    const amount = intent.amount.toNumber()
    const netAmount = amount - platformFee - gatewayFee

    // Get business wallet
    const businessWallet = await WalletService.getWalletByOwner(tenantId, 'BUSINESS', null, intent.currency)
    if (!businessWallet) throw new Error('Business wallet not found')

    // Create transaction
    const transactionNumber = await this.generateTransactionNumber(tenantId)
    
    const transaction = await prisma.pay_payment_transactions.create({
      data: withPrismaDefaults({
        tenantId,
        transactionNumber,
        intentId,
        amount,
        currency: intent.currency,
        gatewayFee,
        platformFee,
        netAmount,
        orderId: intent.orderId,
        orderNumber: intent.orderNumber,
        customerId: intent.customerId,
        customerEmail: intent.customerEmail,
        customerPhone: intent.customerPhone,
        paymentMethod: options.paymentMethod,
        methodDetails: options.methodDetails as Prisma.InputJsonValue | undefined,
        gatewayProvider: options.paymentMethod === 'CASH' ? null : 'manual',
        gatewayReference: options.gatewayReference,
        gatewayResponse: options.gatewayResponse as Prisma.InputJsonValue | undefined,
        destinationWalletId: businessWallet.id,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        processedBy: options.processedBy,
        idempotencyKey: options.idempotencyKey,
      }),
    })

    // Credit business wallet
    await WalletService.credit(tenantId, businessWallet.id, netAmount, {
      type: 'PAYMENT_RECEIVED',
      referenceType: 'ORDER',
      referenceId: intent.orderId || undefined,
      paymentId: transaction.id,
      description: `Payment for order ${intent.orderNumber || intent.orderId || 'N/A'}`,
      performedBy: options.processedBy,
    })

    // Credit platform wallet with fee (if any)
    if (platformFee > 0) {
      const platformWallet = await WalletService.getWalletByOwner(tenantId, 'PLATFORM', null, intent.currency)
      if (platformWallet) {
        await WalletService.credit(tenantId, platformWallet.id, platformFee, {
          type: 'COMMISSION',
          referenceType: 'PAYMENT',
          referenceId: transaction.id,
          description: `Commission from payment ${transactionNumber}`,
        })
      }
    }

    // Update intent to succeeded
    await prisma.pay_payment_intents.update({
      where: { id: intent.id },
      data: { status: 'SUCCEEDED', paymentId: transaction.id },
    })

    // Log event
    await this.logEvent(tenantId, 'PAYMENT_CONFIRMED', {
      transactionNumber,
      intentId,
      amount,
      paymentMethod: options.paymentMethod,
      orderId: intent.orderId,
    })

    return this.formatTransaction(transaction)
  }

  /**
   * Cancel payment intent
   */
  static async cancelIntent(tenantId: string, intentId: string): Promise<PaymentIntent> {
    const intent = await prisma.pay_payment_intents.update({
      where: { intentId, tenantId },
      data: { status: 'CANCELLED' },
    })

    await this.logEvent(tenantId, 'PAYMENT_INTENT_CANCELLED', { intentId })

    return this.formatIntent(intent)
  }

  /**
   * Record cash payment (offline support)
   */
  static async recordCashPayment(
    tenantId: string,
    input: {
      amount: number
      orderId?: string
      orderNumber?: string
      customerId?: string
      receivedBy: string
      notes?: string
    }
  ): Promise<PaymentTransaction> {
    // Create intent and confirm in one go
    const intent = await this.createIntent(tenantId, {
      amount: input.amount,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      paymentMethod: 'CASH',
    })

    return this.confirmPayment(tenantId, intent.intentId, {
      paymentMethod: 'CASH',
      methodDetails: { receivedBy: input.receivedBy, notes: input.notes },
      processedBy: input.receivedBy,
    })
  }

  /**
   * Get payment by transaction number
   */
  static async getPayment(tenantId: string, transactionNumber: string): Promise<PaymentTransaction | null> {
    const tx = await prisma.pay_payment_transactions.findFirst({
      where: { tenantId, transactionNumber },
    })

    return tx ? this.formatTransaction(tx) : null
  }

  /**
   * List payments
   */
  static async listPayments(
    tenantId: string,
    options?: {
      orderId?: string
      customerId?: string
      status?: PayPaymentStatus[]
      paymentMethod?: PayPaymentMethod[]
      page?: number
      limit?: number
    }
  ): Promise<{ payments: PaymentTransaction[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(options?.orderId && { orderId: options.orderId }),
      ...(options?.customerId && { customerId: options.customerId }),
      ...(options?.status && { status: { in: options.status } }),
      ...(options?.paymentMethod && { paymentMethod: { in: options.paymentMethod } }),
    }

    const [payments, total] = await Promise.all([
      prisma.pay_payment_transactions.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pay_payment_transactions.count({ where }),
    ])

    return {
      payments: payments.map(p => this.formatTransaction(p)),
      total,
    }
  }

  /**
   * Get payment statistics
   */
  static async getStatistics(tenantId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [byStatus, byMethod, totals, dailyVolume] = await Promise.all([
      prisma.pay_payment_transactions.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.pay_payment_transactions.groupBy({
        by: ['paymentMethod'],
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: startDate } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.pay_payment_transactions.aggregate({
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: startDate } },
        _sum: { amount: true, netAmount: true, platformFee: true },
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT DATE("confirmedAt") as date, SUM(amount) as volume
        FROM pay_payment_transactions
        WHERE "tenantId" = ${tenantId} AND status = 'CONFIRMED' AND "confirmedAt" >= ${startDate}
        GROUP BY DATE("confirmedAt")
        ORDER BY date DESC
        LIMIT 30
      ` as Promise<Array<{ date: Date; volume: number }>>,
    ])

    return {
      byStatus: byStatus.reduce((acc, s) => ({
        ...acc,
        [s.status]: { count: s._count.id, amount: s._sum.amount?.toNumber() || 0 },
      }), {}),
      byMethod: byMethod.reduce((acc, m) => ({
        ...acc,
        [m.paymentMethod]: { count: m._count.id, amount: m._sum.amount?.toNumber() || 0 },
      }), {}),
      totals: {
        count: totals._count.id,
        totalAmount: totals._sum.amount?.toNumber() || 0,
        netAmount: totals._sum.netAmount?.toNumber() || 0,
        platformFees: totals._sum.platformFee?.toNumber() || 0,
      },
      dailyVolume,
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatIntent(intent: {
    id: string
    tenantId: string
    intentId: string
    amount: { toNumber: () => number }
    currency: string
    orderId: string | null
    orderNumber: string | null
    customerId: string | null
    customerEmail: string | null
    customerPhone: string | null
    paymentMethod: PayPaymentMethod | null
    status: PayIntentStatus
    expiresAt: Date | null
    paymentId: string | null
    createdAt: Date
  }): PaymentIntent {
    return {
      id: intent.id,
      tenantId: intent.tenantId,
      intentId: intent.intentId,
      amount: intent.amount.toNumber(),
      currency: intent.currency,
      orderId: intent.orderId,
      orderNumber: intent.orderNumber,
      customerId: intent.customerId,
      customerEmail: intent.customerEmail,
      customerPhone: intent.customerPhone,
      paymentMethod: intent.paymentMethod,
      status: intent.status,
      expiresAt: intent.expiresAt,
      paymentId: intent.paymentId,
      createdAt: intent.createdAt,
    }
  }

  private static formatTransaction(tx: {
    id: string
    tenantId: string
    transactionNumber: string
    intentId: string | null
    amount: { toNumber: () => number }
    currency: string
    gatewayFee: { toNumber: () => number }
    platformFee: { toNumber: () => number }
    netAmount: { toNumber: () => number }
    orderId: string | null
    orderNumber: string | null
    customerId: string | null
    paymentMethod: PayPaymentMethod
    status: PayPaymentStatus
    confirmedAt: Date | null
    createdAt: Date
  }): PaymentTransaction {
    return {
      id: tx.id,
      tenantId: tx.tenantId,
      transactionNumber: tx.transactionNumber,
      intentId: tx.intentId,
      amount: tx.amount.toNumber(),
      currency: tx.currency,
      gatewayFee: tx.gatewayFee.toNumber(),
      platformFee: tx.platformFee.toNumber(),
      netAmount: tx.netAmount.toNumber(),
      orderId: tx.orderId,
      orderNumber: tx.orderNumber,
      customerId: tx.customerId,
      paymentMethod: tx.paymentMethod,
      status: tx.status,
      confirmedAt: tx.confirmedAt,
      createdAt: tx.createdAt,
    }
  }

  private static async logEvent(tenantId: string, eventType: string, eventData: Record<string, unknown>) {
    await prisma.pay_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType,
        eventData: eventData as Prisma.InputJsonValue,
        paymentId: eventData.paymentId as string | undefined,
      }),
    })
  }
}
