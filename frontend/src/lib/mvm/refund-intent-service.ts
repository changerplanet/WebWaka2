/**
 * MVM Refund Intent Service
 * 
 * Wave K.3: Refund visibility and intent tracking (NO money movement)
 * 
 * This service provides:
 * - RefundIntent creation (full, vendor-specific, partial)
 * - Admin/Partner visibility
 * - Customer visibility (read-only)
 * 
 * CRITICAL: This service does NOT execute refunds.
 * It only tracks refund intent for visibility and correctness.
 */

import { prisma } from '@/lib/prisma'
import { MvmRefundType, MvmRefundReason, MvmRefundStatus } from '@prisma/client'

export interface CreateRefundIntentInput {
  tenantId: string
  parentOrderId: string
  subOrderId?: string
  refundType: MvmRefundType
  requestedAmount: number
  reason: MvmRefundReason
  reasonDetails?: string
  requestedBy?: string
}

export interface RefundIntentSummary {
  id: string
  refundNumber: string
  refundType: MvmRefundType
  status: MvmRefundStatus
  requestedAmount: number
  approvedAmount: number | null
  reason: MvmRefundReason
  reasonDetails: string | null
  customerEmail: string
  customerName: string | null
  requestedAt: Date
  reviewedAt: Date | null
}

function generateRefundNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `REF-${dateStr}-${random}`
}

export class RefundIntentService {
  /**
   * Create a new refund intent (visibility only, NO money movement)
   */
  static async create(input: CreateRefundIntentInput): Promise<RefundIntentSummary> {
    const parentOrder = await prisma.mvm_parent_order.findUnique({
      where: { id: input.parentOrderId },
      select: { customerEmail: true, customerName: true }
    })

    if (!parentOrder) {
      throw new Error('Parent order not found')
    }

    if (input.subOrderId) {
      const subOrder = await prisma.mvm_sub_order.findUnique({
        where: { id: input.subOrderId }
      })
      if (!subOrder || subOrder.parentOrderId !== input.parentOrderId) {
        throw new Error('Sub-order not found or does not belong to parent order')
      }
    }

    const refundIntent = await prisma.mvm_refund_intent.create({
      data: {
        tenantId: input.tenantId,
        parentOrderId: input.parentOrderId,
        subOrderId: input.subOrderId,
        refundNumber: generateRefundNumber(),
        refundType: input.refundType,
        requestedAmount: input.requestedAmount,
        reason: input.reason,
        reasonDetails: input.reasonDetails,
        customerEmail: parentOrder.customerEmail,
        customerName: parentOrder.customerName,
        requestedBy: input.requestedBy,
        status: 'PENDING'
      }
    })

    return {
      id: refundIntent.id,
      refundNumber: refundIntent.refundNumber,
      refundType: refundIntent.refundType,
      status: refundIntent.status,
      requestedAmount: Number(refundIntent.requestedAmount),
      approvedAmount: null,
      reason: refundIntent.reason,
      reasonDetails: refundIntent.reasonDetails,
      customerEmail: refundIntent.customerEmail,
      customerName: refundIntent.customerName,
      requestedAt: refundIntent.requestedAt,
      reviewedAt: null
    }
  }

  /**
   * Review a refund intent (approve/reject)
   * 
   * NOTE: This does NOT execute the refund. Just updates visibility.
   */
  static async review(
    refundIntentId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    notes?: string,
    approvedAmount?: number
  ): Promise<RefundIntentSummary> {
    const refundIntent = await prisma.mvm_refund_intent.update({
      where: { id: refundIntentId },
      data: {
        status: decision,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes,
        approvedAmount: decision === 'APPROVED' ? approvedAmount : null
      }
    })

    return {
      id: refundIntent.id,
      refundNumber: refundIntent.refundNumber,
      refundType: refundIntent.refundType,
      status: refundIntent.status,
      requestedAmount: Number(refundIntent.requestedAmount),
      approvedAmount: refundIntent.approvedAmount ? Number(refundIntent.approvedAmount) : null,
      reason: refundIntent.reason,
      reasonDetails: refundIntent.reasonDetails,
      customerEmail: refundIntent.customerEmail,
      customerName: refundIntent.customerName,
      requestedAt: refundIntent.requestedAt,
      reviewedAt: refundIntent.reviewedAt
    }
  }

  /**
   * Get refund intents for a parent order (customer view)
   */
  static async getForOrder(
    parentOrderId: string,
    customerEmail?: string
  ): Promise<RefundIntentSummary[]> {
    const where: Record<string, unknown> = {
      parentOrderId,
      visibleToCustomer: true
    }

    if (customerEmail) {
      where.customerEmail = customerEmail
    }

    const refundIntents = await prisma.mvm_refund_intent.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return refundIntents.map(ri => ({
      id: ri.id,
      refundNumber: ri.refundNumber,
      refundType: ri.refundType,
      status: ri.status,
      requestedAmount: Number(ri.requestedAmount),
      approvedAmount: ri.approvedAmount ? Number(ri.approvedAmount) : null,
      reason: ri.reason,
      reasonDetails: ri.reasonDetails,
      customerEmail: ri.customerEmail,
      customerName: ri.customerName,
      requestedAt: ri.requestedAt,
      reviewedAt: ri.reviewedAt
    }))
  }

  /**
   * Get refund intents for admin view (all for tenant)
   */
  static async getForTenant(
    tenantId: string,
    filters?: {
      status?: MvmRefundStatus
      refundType?: MvmRefundType
      page?: number
      pageSize?: number
    }
  ): Promise<{
    refundIntents: RefundIntentSummary[]
    total: number
    page: number
    pageSize: number
  }> {
    const { status, refundType, page = 1, pageSize = 20 } = filters || {}

    const where: Record<string, unknown> = {
      tenantId,
      visibleToAdmin: true
    }

    if (status) where.status = status
    if (refundType) where.refundType = refundType

    const [refundIntents, total] = await Promise.all([
      prisma.mvm_refund_intent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_refund_intent.count({ where })
    ])

    return {
      refundIntents: refundIntents.map(ri => ({
        id: ri.id,
        refundNumber: ri.refundNumber,
        refundType: ri.refundType,
        status: ri.status,
        requestedAmount: Number(ri.requestedAmount),
        approvedAmount: ri.approvedAmount ? Number(ri.approvedAmount) : null,
        reason: ri.reason,
        reasonDetails: ri.reasonDetails,
        customerEmail: ri.customerEmail,
        customerName: ri.customerName,
        requestedAt: ri.requestedAt,
        reviewedAt: ri.reviewedAt
      })),
      total,
      page,
      pageSize
    }
  }

  /**
   * Get refund intent by ID
   */
  static async getById(refundIntentId: string): Promise<RefundIntentSummary | null> {
    const refundIntent = await prisma.mvm_refund_intent.findUnique({
      where: { id: refundIntentId }
    })

    if (!refundIntent) return null

    return {
      id: refundIntent.id,
      refundNumber: refundIntent.refundNumber,
      refundType: refundIntent.refundType,
      status: refundIntent.status,
      requestedAmount: Number(refundIntent.requestedAmount),
      approvedAmount: refundIntent.approvedAmount ? Number(refundIntent.approvedAmount) : null,
      reason: refundIntent.reason,
      reasonDetails: refundIntent.reasonDetails,
      customerEmail: refundIntent.customerEmail,
      customerName: refundIntent.customerName,
      requestedAt: refundIntent.requestedAt,
      reviewedAt: refundIntent.reviewedAt
    }
  }

  /**
   * Cancel a pending refund intent
   */
  static async cancel(refundIntentId: string): Promise<boolean> {
    const refundIntent = await prisma.mvm_refund_intent.findUnique({
      where: { id: refundIntentId }
    })

    if (!refundIntent || refundIntent.status !== 'PENDING') {
      return false
    }

    await prisma.mvm_refund_intent.update({
      where: { id: refundIntentId },
      data: { status: 'CANCELLED' }
    })

    return true
  }
}
