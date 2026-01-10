/**
 * PAYMENTS & COLLECTIONS SUITE
 * Proof of Payment Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Handles proof-of-payment workflow for bank transfers:
 * - Proof attachment management
 * - Verification lifecycle
 * - Admin review workflow
 * 
 * @module lib/payments/proof-service
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface ProofAttachment {
  paymentId: string
  proofUrl: string
  uploadedAt: Date
  uploadedBy: string
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'
  verifiedAt?: Date
  verifiedBy?: string
  rejectionReason?: string
}

export interface ProofVerificationResult {
  success: boolean
  paymentId: string
  status: 'VERIFIED' | 'REJECTED'
  verifiedAt?: Date
  verifiedBy?: string
  rejectionReason?: string
}

// ============================================================================
// PROOF OF PAYMENT SERVICE
// ============================================================================

export class PaymentProofService {
  /**
   * Attach proof of payment to a transaction
   */
  static async attachProof(
    tenantId: string,
    paymentId: string,
    proofUrl: string,
    uploadedBy: string
  ): Promise<ProofAttachment> {
    const payment = await prisma.pay_payment_transactions.update({
      where: { id: paymentId, tenantId },
      data: {
        proofAttachmentUrl: proofUrl,
        proofUploadedAt: new Date(),
        status: 'PROCESSING'
      }
    })

    // Log event
    await this.logProofEvent(tenantId, paymentId, 'PROOF_UPLOADED', {
      proofUrl,
      uploadedBy
    })

    return {
      paymentId: payment.id,
      proofUrl,
      uploadedAt: payment.proofUploadedAt!,
      uploadedBy,
      status: 'PENDING_REVIEW'
    }
  }

  /**
   * Get proof details for a payment
   */
  static async getProof(tenantId: string, paymentId: string): Promise<ProofAttachment | null> {
    const payment = await prisma.pay_payment_transactions.findFirst({
      where: { id: paymentId, tenantId },
      select: {
        id: true,
        proofAttachmentUrl: true,
        proofUploadedAt: true,
        proofVerifiedAt: true,
        proofVerifiedBy: true,
        status: true
      }
    })

    if (!payment || !payment.proofAttachmentUrl) {
      return null
    }

    let status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' = 'PENDING_REVIEW'
    if (payment.proofVerifiedAt) {
      status = payment.status === 'CONFIRMED' ? 'VERIFIED' : 'REJECTED'
    }

    return {
      paymentId: payment.id,
      proofUrl: payment.proofAttachmentUrl,
      uploadedAt: payment.proofUploadedAt!,
      uploadedBy: 'unknown', // Would need to store this
      status,
      verifiedAt: payment.proofVerifiedAt ?? undefined,
      verifiedBy: payment.proofVerifiedBy ?? undefined
    }
  }

  /**
   * Verify proof of payment (Admin action)
   */
  static async verifyProof(
    tenantId: string,
    paymentId: string,
    verifiedBy: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<ProofVerificationResult> {
    const payment = await prisma.pay_payment_transactions.findFirst({
      where: { id: paymentId, tenantId }
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (!payment.proofAttachmentUrl) {
      throw new Error('No proof attached to this payment')
    }

    if (payment.proofVerifiedAt) {
      throw new Error('Proof has already been verified')
    }

    const now = new Date()

    if (approved) {
      await prisma.pay_payment_transactions.update({
        where: { id: paymentId },
        data: {
          proofVerifiedAt: now,
          proofVerifiedBy: verifiedBy,
          status: 'CONFIRMED',
          confirmedAt: now
        }
      })

      await this.logProofEvent(tenantId, paymentId, 'PROOF_VERIFIED', {
        verifiedBy,
        approvedAt: now.toISOString()
      })

      return {
        success: true,
        paymentId,
        status: 'VERIFIED',
        verifiedAt: now,
        verifiedBy
      }
    } else {
      await prisma.pay_payment_transactions.update({
        where: { id: paymentId },
        data: {
          proofVerifiedAt: now,
          proofVerifiedBy: verifiedBy,
          status: 'FAILED',
          statusMessage: rejectionReason || 'Proof verification failed'
        }
      })

      await this.logProofEvent(tenantId, paymentId, 'PROOF_REJECTED', {
        verifiedBy,
        rejectedAt: now.toISOString(),
        reason: rejectionReason
      })

      return {
        success: true,
        paymentId,
        status: 'REJECTED',
        verifiedAt: now,
        verifiedBy,
        rejectionReason
      }
    }
  }

  /**
   * Get payments pending proof verification
   */
  static async getPendingVerifications(
    tenantId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{
    payments: Array<{
      id: string
      transactionNumber: string
      amount: number
      proofUrl: string
      uploadedAt: Date
      orderNumber?: string
      customerEmail?: string
    }>
    total: number
  }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      proofAttachmentUrl: { not: null },
      proofVerifiedAt: null,
      status: 'PROCESSING' as const
    }

    const [payments, total] = await Promise.all([
      prisma.pay_payment_transactions.findMany({
        where,
        select: {
          id: true,
          transactionNumber: true,
          amount: true,
          proofAttachmentUrl: true,
          proofUploadedAt: true,
          orderNumber: true,
          customerEmail: true
        },
        orderBy: { proofUploadedAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.pay_payment_transactions.count({ where })
    ])

    return {
      payments: payments.map((p: any) => ({
        id: p.id,
        transactionNumber: p.transactionNumber,
        amount: p.amount.toNumber(),
        proofUrl: p.proofAttachmentUrl!,
        uploadedAt: p.proofUploadedAt!,
        orderNumber: p.orderNumber ?? undefined,
        customerEmail: p.customerEmail ?? undefined
      })),
      total
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static async logProofEvent(
    tenantId: string,
    paymentId: string,
    eventType: string,
    eventData: Record<string, unknown>
  ) {
    await prisma.pay_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType,
        eventData,
        paymentId
      }) // AUTO-FIX: required by Prisma schema
    })
  }
}
