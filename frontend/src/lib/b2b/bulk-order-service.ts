/**
 * MODULE 9: B2B & WHOLESALE
 * Bulk Order Service
 * 
 * PHASE 4: Bulk Ordering Workflows
 * 
 * CRITICAL: Orders are created via existing order modules (POS/SVM/MVM).
 * Inventory is NOT mutated directly.
 */

import { prisma } from '@/lib/prisma'
import { B2BBulkOrderStatus, Prisma } from '@prisma/client'
import { B2BPricingService } from './pricing-service'
import { withPrismaDefaults, toJsonValue } from '@/lib/db/prismaDefaults'
import { 
  parseJsonField, 
  BulkOrderItemsSchema, 
  type BulkOrderItem as ValidatedBulkOrderItem 
} from '@/lib/db/jsonValidation'

// ============================================================================
// TYPES
// ============================================================================

export interface BulkOrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  wholesalePrice: number
  discount: number
  lineTotal: number
}

export interface BulkOrderDraft {
  id: string
  tenantId: string
  profileId: string
  name: string | null
  description: string | null
  items: BulkOrderItem[]
  itemCount: number
  subtotal: number
  discountTotal: number
  estimatedTotal: number
  status: B2BBulkOrderStatus
  convertedOrderId: string | null
  convertedAt: Date | null
  offlineId: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class B2BBulkOrderService {
  /**
   * Create bulk order draft
   */
  static async createDraft(
    tenantId: string,
    input: {
      profileId: string
      name?: string
      description?: string
      items: Array<{
        productId: string
        quantity: number
      }>
      offlineId?: string
    },
    createdBy?: string
  ): Promise<BulkOrderDraft> {
    // Verify profile exists
    const profile = await prisma.b2b_customer_profiles.findUnique({
      where: { id: input.profileId },
    })

    if (!profile) throw new Error('B2B profile not found')

    // Resolve prices for all items
    const itemsWithPricing: BulkOrderItem[] = []
    let subtotal = 0
    let discountTotal = 0

    for (const item of input.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true },
      })

      if (!product) continue

      const pricing = await B2BPricingService.resolvePrice(
        tenantId,
        item.productId,
        item.quantity,
        { customerId: profile.customerId, priceTierId: profile.priceTierId || undefined }
      )

      const lineTotal = pricing.wholesalePrice * item.quantity
      const lineDiscount = pricing.discount * item.quantity

      itemsWithPricing.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: pricing.originalPrice,
        wholesalePrice: pricing.wholesalePrice,
        discount: pricing.discount,
        lineTotal,
      })

      subtotal += pricing.originalPrice * item.quantity
      discountTotal += lineDiscount
    }

    const estimatedTotal = subtotal - discountTotal

    const draft = await prisma.b2b_bulk_order_drafts.create({
      data: withPrismaDefaults({
        tenantId,
        profileId: input.profileId,
        name: input.name,
        description: input.description,
        items: toJsonValue(itemsWithPricing),
        itemCount: itemsWithPricing.length,
        subtotal,
        discountTotal,
        estimatedTotal,
        offlineId: input.offlineId,
        createdBy,
        status: 'DRAFT',
      }),
    })

    return this.formatDraft(draft)
  }

  /**
   * Update bulk order draft
   */
  static async updateDraft(
    tenantId: string,
    draftId: string,
    input: {
      name?: string
      description?: string
      items?: Array<{
        productId: string
        quantity: number
      }>
    }
  ): Promise<BulkOrderDraft> {
    const existing = await prisma.b2b_bulk_order_drafts.findUnique({
      where: { id: draftId, tenantId },
      include: { b2b_customer_profiles: true },
    })

    if (!existing) throw new Error('Draft not found')
    if (existing.status !== 'DRAFT') throw new Error('Cannot update non-draft order')

    let items = existing.items as unknown as BulkOrderItem[]
    let subtotal = existing.subtotal.toNumber()
    let discountTotal = existing.discountTotal.toNumber()

    // Recalculate if items changed
    if (input.items) {
      items = []
      subtotal = 0
      discountTotal = 0

      for (const item of input.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, price: true },
        })

        if (!product) continue

        const pricing = await B2BPricingService.resolvePrice(
          tenantId,
          item.productId,
          item.quantity,
          { 
            customerId: existing.b2b_customer_profiles.customerId,
            priceTierId: existing.b2b_customer_profiles.priceTierId || undefined 
          }
        )

        items.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: pricing.originalPrice,
          wholesalePrice: pricing.wholesalePrice,
          discount: pricing.discount,
          lineTotal: pricing.wholesalePrice * item.quantity,
        })

        subtotal += pricing.originalPrice * item.quantity
        discountTotal += pricing.discount * item.quantity
      }
    }

    const draft = await prisma.b2b_bulk_order_drafts.update({
      where: { id: draftId },
      data: {
        name: input.name,
        description: input.description,
        items: toJsonValue(items),
        itemCount: items.length,
        subtotal,
        discountTotal,
        estimatedTotal: subtotal - discountTotal,
      },
    })

    return this.formatDraft(draft)
  }

  /**
   * Submit bulk order draft for approval
   */
  static async submitDraft(
    tenantId: string,
    draftId: string,
    submittedBy?: string
  ): Promise<BulkOrderDraft> {
    const draft = await prisma.b2b_bulk_order_drafts.findUnique({
      where: { id: draftId, tenantId },
    })

    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'DRAFT') throw new Error('Draft already submitted')

    // Capture current pricing snapshot
    const items = draft.items as unknown as BulkOrderItem[]
    const pricingSnapshot = {
      capturedAt: new Date(),
      items: items.map(i => ({
        productId: i.productId,
        unitPrice: i.unitPrice,
        wholesalePrice: i.wholesalePrice,
        discount: i.discount,
      })),
    }

    const updated = await prisma.b2b_bulk_order_drafts.update({
      where: { id: draftId },
      data: {
        status: 'SUBMITTED',
        pricingSnapshot: toJsonValue(pricingSnapshot),
        submittedBy,
        submittedAt: new Date(),
      },
    })

    // Log event
    await prisma.b2b_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType: 'BULK_ORDER_SUBMITTED',
        eventData: { draftId, submittedBy },
        profileId: draft.profileId,
      }),
    })

    return this.formatDraft(updated)
  }

  /**
   * Approve bulk order draft
   */
  static async approveDraft(
    tenantId: string,
    draftId: string
  ): Promise<BulkOrderDraft> {
    const draft = await prisma.b2b_bulk_order_drafts.update({
      where: { id: draftId, tenantId, status: 'SUBMITTED' },
      data: { status: 'APPROVED' },
    })

    return this.formatDraft(draft)
  }

  /**
   * Reject bulk order draft
   */
  static async rejectDraft(
    tenantId: string,
    draftId: string,
    reason?: string
  ): Promise<BulkOrderDraft> {
    const draft = await prisma.b2b_bulk_order_drafts.update({
      where: { id: draftId, tenantId, status: 'SUBMITTED' },
      data: { 
        status: 'REJECTED',
        metadata: { rejectionReason: reason },
      },
    })

    return this.formatDraft(draft)
  }

  /**
   * Mark draft as converted to actual order
   * NOTE: Actual order creation happens via POS/SVM/MVM module
   */
  static async markConverted(
    tenantId: string,
    draftId: string,
    orderId: string
  ): Promise<BulkOrderDraft> {
    const draft = await prisma.b2b_bulk_order_drafts.update({
      where: { id: draftId, tenantId },
      data: {
        status: 'CONVERTED',
        convertedOrderId: orderId,
        convertedAt: new Date(),
      },
    })

    // Log event
    await prisma.b2b_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType: 'BULK_ORDER_CONVERTED',
        eventData: { draftId, orderId },
        profileId: draft.profileId,
        orderId,
      }),
    })

    return this.formatDraft(draft)
  }

  /**
   * List bulk order drafts
   */
  static async listDrafts(
    tenantId: string,
    options?: {
      profileId?: string
      status?: B2BBulkOrderStatus[]
      page?: number
      limit?: number
    }
  ): Promise<{ drafts: BulkOrderDraft[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(options?.profileId && { profileId: options.profileId }),
      ...(options?.status && { status: { in: options.status } }),
    }

    const [drafts, total] = await Promise.all([
      prisma.b2b_bulk_order_drafts.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.b2b_bulk_order_drafts.count({ where }),
    ])

    return {
      drafts: drafts.map(d => this.formatDraft(d)),
      total,
    }
  }

  /**
   * Get draft by ID
   */
  static async getDraft(tenantId: string, draftId: string): Promise<BulkOrderDraft | null> {
    const draft = await prisma.b2b_bulk_order_drafts.findUnique({
      where: { id: draftId, tenantId },
    })

    return draft ? this.formatDraft(draft) : null
  }

  /**
   * Cancel draft
   */
  static async cancelDraft(tenantId: string, draftId: string): Promise<BulkOrderDraft> {
    const draft = await prisma.b2b_bulk_order_drafts.update({
      where: { id: draftId, tenantId },
      data: { status: 'CANCELLED' },
    })

    return this.formatDraft(draft)
  }

  /**
   * Get statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, totals] = await Promise.all([
      prisma.b2b_bulk_order_drafts.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { estimatedTotal: true },
      }),
      prisma.b2b_bulk_order_drafts.aggregate({
        where: { tenantId },
        _sum: { estimatedTotal: true },
        _count: { id: true },
      }),
    ])

    return {
      byStatus: byStatus.reduce((acc, s) => ({
        ...acc,
        [s.status]: {
          count: s._count.id,
          total: s._sum.estimatedTotal?.toNumber() || 0,
        },
      }), {}),
      totals: {
        draftCount: totals._count.id,
        totalValue: totals._sum.estimatedTotal?.toNumber() || 0,
      },
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatDraft(draft: {
    id: string
    tenantId: string
    profileId: string
    name: string | null
    description: string | null
    items: unknown
    itemCount: number
    subtotal: { toNumber: () => number }
    discountTotal: { toNumber: () => number }
    estimatedTotal: { toNumber: () => number }
    status: B2BBulkOrderStatus
    convertedOrderId: string | null
    convertedAt: Date | null
    offlineId: string | null
    createdAt: Date
    updatedAt: Date
  }): BulkOrderDraft {
    return {
      id: draft.id,
      tenantId: draft.tenantId,
      profileId: draft.profileId,
      name: draft.name,
      description: draft.description,
      items: draft.items as BulkOrderItem[],
      itemCount: draft.itemCount,
      subtotal: draft.subtotal.toNumber(),
      discountTotal: draft.discountTotal.toNumber(),
      estimatedTotal: draft.estimatedTotal.toNumber(),
      status: draft.status,
      convertedOrderId: draft.convertedOrderId,
      convertedAt: draft.convertedAt,
      offlineId: draft.offlineId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    }
  }
}
