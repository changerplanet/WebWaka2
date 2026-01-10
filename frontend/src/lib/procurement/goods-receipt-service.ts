/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Goods Receipt Service - Record received goods
 * 
 * PHASE 4: Goods Receipt & Inventory Events
 * 
 * CRITICAL: Goods receipt EMITS inventory adjustment events.
 * Core/Inventory module applies the actual inventory changes.
 * This module does NOT mutate inventory directly.
 */

import { prisma } from '@/lib/prisma'
import { ProcGoodsReceiptStatus, Prisma } from '@prisma/client'
import { ProcConfigurationService } from './config-service'
import { PurchaseOrderService } from './purchase-order-service'
import { ProcEventService } from './event-service'

// ============================================================================
// TYPES
// ============================================================================

export interface GoodsReceiptInput {
  purchaseOrderId: string
  receivedBy: string
  locationId?: string
  deliveryNote?: string
  invoiceNumber?: string
  invoiceDate?: Date
  photoUrls?: string[]
  notes?: string
  items: GoodsReceiptItemInput[]
  offlineId?: string
}

export interface GoodsReceiptItemInput {
  purchaseOrderItemId: string
  productId: string
  productSku?: string
  productName: string
  orderedQuantity: number
  receivedQuantity: number
  acceptedQuantity?: number
  rejectedQuantity?: number
  damagedQuantity?: number
  missingQuantity?: number
  unit?: string
  qualityStatus?: string
  qualityNotes?: string
  batchNumber?: string
  expiryDate?: Date
  serialNumbers?: string[]
  notes?: string
}

export interface GoodsReceiptFilters {
  status?: ProcGoodsReceiptStatus[]
  purchaseOrderId?: string
  locationId?: string
  fromDate?: Date
  toDate?: Date
  search?: string
}

export interface GoodsReceiptListOptions {
  filters?: GoodsReceiptFilters
  page?: number
  limit?: number
  orderBy?: 'receivedDate' | 'createdAt'
  orderDir?: 'asc' | 'desc'
}

// ============================================================================
// SERVICE
// ============================================================================

export class GoodsReceiptService {
  /**
   * Create a goods receipt
   */
  static async createGoodsReceipt(tenantId: string, input: GoodsReceiptInput) {
    // Check for duplicate offline ID
    if (input.offlineId) {
      const existing = await prisma.proc_goods_receipts.findUnique({
        where: { tenantId_offlineId: { tenantId, offlineId: input.offlineId } },
      })
      if (existing) {
        return this.getGoodsReceiptById(tenantId, existing.id)
      }
    }

    // Verify PO exists
    const po = await prisma.proc_purchase_orders.findFirst({
      where: { id: input.purchaseOrderId, tenantId },
      include: { bill_invoice_items: true },
    })

    if (!po) throw new Error('Purchase order not found')
    if (['CANCELLED', 'CLOSED'].includes(po.status)) {
      throw new Error('Cannot receive goods for cancelled or closed orders')
    }

    // Get next GR number
    const receiptNumber = await ProcConfigurationService.getNextGRNumber(tenantId)

    // Create receipt with items
    const receipt = await prisma.proc_goods_receipts.create({
      data: {
        tenantId,
        receiptNumber,
        purchaseOrderId: input.purchaseOrderId,
        status: 'PENDING',
        receivedBy: input.receivedBy,
        locationId: input.locationId,
        deliveryNote: input.deliveryNote,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        photoUrls: input.photoUrls ? (input.photoUrls as Prisma.InputJsonValue) : Prisma.JsonNull,
        notes: input.notes,
        offlineId: input.offlineId,
        items: {
          create: input.items.map(item => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: item.acceptedQuantity ?? item.receivedQuantity,
            rejectedQuantity: item.rejectedQuantity ?? 0,
            damagedQuantity: item.damagedQuantity ?? 0,
            missingQuantity: item.missingQuantity ?? 0,
            unit: item.unit || 'UNIT',
            qualityStatus: item.qualityStatus,
            qualityNotes: item.qualityNotes,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            serialNumbers: item.serialNumbers ? (item.serialNumbers as Prisma.InputJsonValue) : Prisma.JsonNull,
            notes: item.notes,
          })),
        },
      },
      include: { bill_invoice_items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'GOODS_RECEIVED',
      entityType: 'GOODS_RECEIPT',
      entityId: receipt.id,
      actorId: input.receivedBy,
      data: {
        receiptNumber: receipt.receiptNumber,
        poNumber: po.poNumber,
        itemCount: input.items.length,
      },
    })

    return this.formatGoodsReceipt(receipt)
  }

  /**
   * List goods receipts
   */
  static async listGoodsReceipts(tenantId: string, options: GoodsReceiptListOptions = {}) {
    const { filters = {}, page = 1, limit = 20, orderBy = 'receivedDate', orderDir = 'desc' } = options

    const where: Prisma.ProcGoodsReceiptWhereInput = {
      tenantId,
      ...(filters.status && { status: { in: filters.status } }),
      ...(filters.purchaseOrderId && { purchaseOrderId: filters.purchaseOrderId }),
      ...(filters.locationId && { locationId: filters.locationId }),
      ...(filters.fromDate && { receivedDate: { gte: filters.fromDate } }),
      ...(filters.toDate && { receivedDate: { lte: filters.toDate } }),
      ...(filters.search && {
        OR: [
          { receiptNumber: { contains: filters.search, mode: 'insensitive' as const } },
          { deliveryNote: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [receipts, total] = await Promise.all([
      prisma.proc_goods_receipts.findMany({
        where,
        include: {
          bill_invoice_items: true,
          proc_purchase_orders: { select: { poNumber: true, supplierName: true } },
        },
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proc_goods_receipts.count({ where }),
    ])

    return {
      receipts: receipts.map(r => this.formatGoodsReceipt(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get goods receipt by ID
   */
  static async getGoodsReceiptById(tenantId: string, id: string) {
    const receipt = await prisma.proc_goods_receipts.findFirst({
      where: { id, tenantId },
      include: {
        bill_invoice_items: true,
        proc_purchase_orders: {
          include: { bill_invoice_items: true },
        },
      },
    })

    return receipt ? this.formatGoodsReceipt(receipt) : null
  }

  /**
   * Verify quality and accept receipt
   */
  static async verifyAndAccept(
    tenantId: string,
    id: string,
    verifiedBy: string,
    qualityNotes?: string
  ) {
    const receipt = await prisma.proc_goods_receipts.findFirst({
      where: { id, tenantId },
      include: { bill_invoice_items: true },
    })

    if (!receipt) throw new Error('Goods receipt not found')
    if (receipt.status !== 'PENDING') throw new Error('Only pending receipts can be verified')

    // Update receipt status
    const updated = await prisma.proc_goods_receipts.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        qualityCheckedBy: verifiedBy,
        qualityCheckedAt: new Date(),
        qualityNotes,
      },
      include: { bill_invoice_items: true },
    })

    // Update PO item quantities
    for (const item of receipt.items) {
      await PurchaseOrderService.updateItemReceivedQuantity(
        item.purchaseOrderItemId,
        Number(item.acceptedQuantity)
      )
    }

    // Emit inventory adjustment event (Core will apply changes)
    const inventoryEventId = `INV-ADJ-${receipt.receiptNumber}`
    await prisma.proc_goods_receipts.update({
      where: { id },
      data: {
        inventoryEventEmitted: true,
        inventoryEventId,
        inventoryEventAt: new Date(),
      },
    })

    // Emit event for Core to consume
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'INVENTORY_ADJUSTMENT_REQUESTED',
      entityType: 'GOODS_RECEIPT',
      entityId: receipt.id,
      actorId: verifiedBy,
      data: {
        receiptNumber: receipt.receiptNumber,
        inventoryEventId,
        adjustments: receipt.items.map(item => ({
          productId: item.productId,
          locationId: receipt.locationId,
          quantity: Number(item.acceptedQuantity),
          unit: item.unit,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          reason: 'GOODS_RECEIPT',
          reference: receipt.receiptNumber,
        })),
      },
    })

    return this.formatGoodsReceipt(updated)
  }

  /**
   * Reject receipt (quality issues)
   */
  static async rejectReceipt(
    tenantId: string,
    id: string,
    rejectedBy: string,
    reason: string
  ) {
    const receipt = await prisma.proc_goods_receipts.findFirst({
      where: { id, tenantId },
    })

    if (!receipt) throw new Error('Goods receipt not found')
    if (receipt.status !== 'PENDING') throw new Error('Only pending receipts can be rejected')

    const updated = await prisma.proc_goods_receipts.update({
      where: { id },
      data: {
        status: 'REJECTED',
        qualityCheckedBy: rejectedBy,
        qualityCheckedAt: new Date(),
        qualityNotes: reason,
      },
      include: { bill_invoice_items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'GOODS_RECEIPT_REJECTED',
      entityType: 'GOODS_RECEIPT',
      entityId: id,
      actorId: rejectedBy,
      data: { receiptNumber: receipt.receiptNumber, reason },
    })

    return this.formatGoodsReceipt(updated)
  }

  /**
   * Update receipt item quantities
   */
  static async updateReceiptItems(
    tenantId: string,
    receiptId: string,
    items: Array<{
      itemId: string
      acceptedQuantity?: number
      rejectedQuantity?: number
      damagedQuantity?: number
      qualityStatus?: string
      qualityNotes?: string
    }>
  ) {
    const receipt = await prisma.proc_goods_receipts.findFirst({
      where: { id: receiptId, tenantId },
    })

    if (!receipt) throw new Error('Goods receipt not found')
    if (receipt.status !== 'PENDING') throw new Error('Only pending receipts can be updated')

    // Update each item
    for (const item of items) {
      await prisma.proc_goods_receipt_items.update({
        where: { id: item.itemId },
        data: {
          ...(item.acceptedQuantity !== undefined && { acceptedQuantity: item.acceptedQuantity }),
          ...(item.rejectedQuantity !== undefined && { rejectedQuantity: item.rejectedQuantity }),
          ...(item.damagedQuantity !== undefined && { damagedQuantity: item.damagedQuantity }),
          ...(item.qualityStatus !== undefined && { qualityStatus: item.qualityStatus }),
          ...(item.qualityNotes !== undefined && { qualityNotes: item.qualityNotes }),
        },
      })
    }

    return this.getGoodsReceiptById(tenantId, receiptId)
  }

  /**
   * Get receipt statistics
   */
  static async getStatistics(tenantId: string) {
    const [statusCounts, recentReceipts] = await Promise.all([
      prisma.proc_goods_receipts.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      prisma.proc_goods_receipts.count({
        where: {
          tenantId,
          receivedDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return {
      byStatus: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
      receiptsLast30Days: recentReceipts,
    }
  }

  /**
   * Format goods receipt for output
   */
  private static formatGoodsReceipt(receipt: {
    id: string
    tenantId: string
    receiptNumber: string
    purchaseOrderId: string
    status: ProcGoodsReceiptStatus
    receivedDate: Date
    receivedBy: string
    locationId: string | null
    deliveryNote: string | null
    invoiceNumber: string | null
    invoiceDate: Date | null
    qualityCheckedBy: string | null
    qualityCheckedAt: Date | null
    qualityNotes: string | null
    inventoryEventEmitted: boolean
    inventoryEventId: string | null
    inventoryEventAt: Date | null
    photoUrls: unknown
    offlineId: string | null
    notes: string | null
    metadata: unknown
    createdAt: Date
    updatedAt: Date
    items?: Array<{
      id: string
      purchaseOrderItemId: string
      productId: string
      productSku: string | null
      productName: string
      orderedQuantity: { toNumber(): number }
      receivedQuantity: { toNumber(): number }
      acceptedQuantity: { toNumber(): number }
      rejectedQuantity: { toNumber(): number }
      damagedQuantity: { toNumber(): number }
      missingQuantity: { toNumber(): number }
      unit: string
      qualityStatus: string | null
      qualityNotes: string | null
      batchNumber: string | null
      expiryDate: Date | null
      serialNumbers: unknown
      notes: string | null
    }>
    purchaseOrder?: {
      poNumber: string
      supplierName: string
    }
  }) {
    return {
      id: receipt.id,
      tenantId: receipt.tenantId,
      receiptNumber: receipt.receiptNumber,
      purchaseOrderId: receipt.purchaseOrderId,
      status: receipt.status,
      receivedDate: receipt.receivedDate,
      receivedBy: receipt.receivedBy,
      locationId: receipt.locationId,
      deliveryNote: receipt.deliveryNote,
      invoiceNumber: receipt.invoiceNumber,
      invoiceDate: receipt.invoiceDate,
      qualityCheckedBy: receipt.qualityCheckedBy,
      qualityCheckedAt: receipt.qualityCheckedAt,
      qualityNotes: receipt.qualityNotes,
      inventoryEventEmitted: receipt.inventoryEventEmitted,
      inventoryEventId: receipt.inventoryEventId,
      inventoryEventAt: receipt.inventoryEventAt,
      photoUrls: receipt.photoUrls as string[] | null,
      offlineId: receipt.offlineId,
      notes: receipt.notes,
      metadata: receipt.metadata,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
      items: receipt.items?.map(item => ({
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        orderedQuantity: item.orderedQuantity.toNumber(),
        receivedQuantity: item.receivedQuantity.toNumber(),
        acceptedQuantity: item.acceptedQuantity.toNumber(),
        rejectedQuantity: item.rejectedQuantity.toNumber(),
        damagedQuantity: item.damagedQuantity.toNumber(),
        missingQuantity: item.missingQuantity.toNumber(),
        unit: item.unit,
        qualityStatus: item.qualityStatus,
        qualityNotes: item.qualityNotes,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        serialNumbers: item.serialNumbers as string[] | null,
        notes: item.notes,
      })),
      purchaseOrder: receipt.purchaseOrder,
    }
  }
}
