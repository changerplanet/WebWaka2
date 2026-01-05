/**
 * MODULE 10: PAYMENTS & WALLETS
 * Refund Service
 * 
 * PHASE 5: Refunds & Reversals
 * 
 * 🚨 CRITICAL:
 * - Refunds create NEW transactions (append-only)
 * - Original transactions are NEVER edited
 */

import { prisma } from '@/lib/prisma'
import { PayRefundReason, PayRefundStatus, PayRefundMethod, Prisma } from '@prisma/client'
import { WalletService } from './wallet-service'

// ============================================================================
// TYPES
// ============================================================================

export interface Refund {
  id: string
  tenantId: string
  refundNumber: string
  paymentId: string
  amount: number
  currency: string
  reason: PayRefundReason
  notes: string | null
  status: PayRefundStatus
  refundMethod: PayRefundMethod
  processedAt: Date | null
  createdAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class RefundService {
  /**
   * Generate refund number
   */
  private static async generateRefundNumber(tenantId: string): Promise<string> {
    const count = await prisma.payRefund.count({ where: { tenantId } })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `REF-${year}${month}-${(count + 1).toString().padStart(5, '0')}`
  }

  /**
   * Request refund
   */
  static async requestRefund(
    tenantId: string,
    input: {
      paymentId: string
      amount: number
      reason: PayRefundReason
      notes?: string
      refundMethod?: PayRefundMethod
    },
    requestedBy?: string
  ): Promise<Refund> {
    // Get original payment
    const payment = await prisma.payPaymentTransaction.findUnique({
      where: { id: input.paymentId },
    })

    if (!payment) throw new Error('Payment not found')
    if (payment.tenantId !== tenantId) throw new Error('Payment not found')
    if (payment.status !== 'CONFIRMED') throw new Error('Cannot refund unconfirmed payment')

    // Check total refunds don't exceed payment
    const existingRefunds = await prisma.payRefund.aggregate({
      where: { paymentId: input.paymentId, status: { in: ['APPROVED', 'PROCESSING', 'COMPLETED'] } },
      _sum: { amount: true },
    })

    const totalRefunded = existingRefunds._sum.amount?.toNumber() || 0
    const maxRefundable = payment.amount.toNumber() - totalRefunded

    if (input.amount > maxRefundable) {
      throw new Error(`Maximum refundable amount is ${maxRefundable}`)
    }

    const refundNumber = await this.generateRefundNumber(tenantId)

    const refund = await prisma.payRefund.create({
      data: {
        tenantId,
        refundNumber,
        paymentId: input.paymentId,
        amount: input.amount,
        currency: payment.currency,
        reason: input.reason,
        notes: input.notes,
        refundMethod: input.refundMethod || 'ORIGINAL_METHOD',
        status: 'PENDING',
        requestedBy,
      },
    })

    // Log event
    await this.logEvent(tenantId, 'REFUND_REQUESTED', {
      refundNumber,
      paymentId: input.paymentId,
      amount: input.amount,
      reason: input.reason,
    })

    return this.formatRefund(refund)
  }

  /**
   * Approve refund
   */
  static async approveRefund(tenantId: string, refundId: string, approvedBy: string): Promise<Refund> {
    const refund = await prisma.payRefund.update({
      where: { id: refundId, tenantId, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        approvedBy,
      },
    })

    await this.logEvent(tenantId, 'REFUND_APPROVED', { refundId, approvedBy })

    return this.formatRefund(refund)
  }

  /**
   * Process refund (execute)
   * 🚨 This is where money moves back
   */
  static async processRefund(tenantId: string, refundId: string): Promise<Refund> {
    const refund = await prisma.payRefund.findUnique({
      where: { id: refundId, tenantId },
      include: { payment: true },
    })

    if (!refund) throw new Error('Refund not found')
    if (refund.status !== 'APPROVED') throw new Error('Refund not approved')

    // Get business wallet
    const businessWallet = await WalletService.getWalletByOwner(tenantId, 'BUSINESS', null, refund.currency)
    if (!businessWallet) throw new Error('Business wallet not found')

    // Check balance
    if (businessWallet.balance < refund.amount.toNumber()) {
      throw new Error('Insufficient balance for refund')
    }

    // Update refund to processing
    await prisma.payRefund.update({
      where: { id: refundId },
      data: { status: 'PROCESSING' },
    })

    // Debit business wallet
    await WalletService.debit(tenantId, businessWallet.id, refund.amount.toNumber(), {
      type: 'REFUND_MADE',
      referenceType: 'REFUND',
      referenceId: refundId,
      description: `Refund ${refund.refundNumber} for payment ${refund.payment.transactionNumber}`,
    })

    // Update refund to completed
    const updated = await prisma.payRefund.update({
      where: { id: refundId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    })

    // Update original payment status
    const totalRefunded = await prisma.payRefund.aggregate({
      where: { paymentId: refund.paymentId, status: 'COMPLETED' },
      _sum: { amount: true },
    })

    const paymentAmount = refund.payment.amount.toNumber()
    const refundedAmount = totalRefunded._sum.amount?.toNumber() || 0

    await prisma.payPaymentTransaction.update({
      where: { id: refund.paymentId },
      data: {
        status: refundedAmount >= paymentAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    })

    // Log event
    await this.logEvent(tenantId, 'REFUND_PROCESSED', {
      refundId,
      refundNumber: refund.refundNumber,
      amount: refund.amount.toNumber(),
    })

    return this.formatRefund(updated)
  }

  /**
   * Reject refund
   */
  static async rejectRefund(tenantId: string, refundId: string, reason?: string): Promise<Refund> {
    const refund = await prisma.payRefund.update({
      where: { id: refundId, tenantId, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        notes: reason ? `Rejected: ${reason}` : 'Rejected',
      },
    })

    await this.logEvent(tenantId, 'REFUND_REJECTED', { refundId, reason })

    return this.formatRefund(refund)
  }

  /**
   * List refunds
   */
  static async listRefunds(
    tenantId: string,
    options?: {
      paymentId?: string
      status?: PayRefundStatus[]
      page?: number
      limit?: number
    }
  ): Promise<{ refunds: Refund[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(options?.paymentId && { paymentId: options.paymentId }),
      ...(options?.status && { status: { in: options.status } }),
    }

    const [refunds, total] = await Promise.all([
      prisma.payRefund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payRefund.count({ where }),
    ])

    return {
      refunds: refunds.map(r => this.formatRefund(r)),
      total,
    }
  }

  /**
   * Get refund statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, byReason, totals] = await Promise.all([
      prisma.payRefund.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.payRefund.groupBy({
        by: ['reason'],
        where: { tenantId, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.payRefund.aggregate({
        where: { tenantId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ])

    return {
      byStatus: byStatus.reduce((acc, s) => ({
        ...acc,
        [s.status]: { count: s._count.id, amount: s._sum.amount?.toNumber() || 0 },
      }), {}),
      byReason: byReason.reduce((acc, r) => ({
        ...acc,
        [r.reason]: { count: r._count.id, amount: r._sum.amount?.toNumber() || 0 },
      }), {}),
      totals: {
        count: totals._count.id,
        totalRefunded: totals._sum.amount?.toNumber() || 0,
      },
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatRefund(refund: {
    id: string
    tenantId: string
    refundNumber: string
    paymentId: string
    amount: { toNumber: () => number }
    currency: string
    reason: PayRefundReason
    notes: string | null
    status: PayRefundStatus
    refundMethod: PayRefundMethod
    processedAt: Date | null
    createdAt: Date
  }): Refund {
    return {
      id: refund.id,
      tenantId: refund.tenantId,
      refundNumber: refund.refundNumber,
      paymentId: refund.paymentId,
      amount: refund.amount.toNumber(),
      currency: refund.currency,
      reason: refund.reason,
      notes: refund.notes,
      status: refund.status,
      refundMethod: refund.refundMethod,
      processedAt: refund.processedAt,
      createdAt: refund.createdAt,
    }
  }

  private static async logEvent(tenantId: string, eventType: string, eventData: Record<string, unknown>) {
    await prisma.payEventLog.create({
      data: {
        tenantId,
        eventType,
        eventData: eventData as Prisma.InputJsonValue,
        refundId: eventData.refundId as string | undefined,
      },
    })
  }
}
