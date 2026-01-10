/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Purchase Order Service - PO creation and lifecycle management
 * 
 * PHASE 3: Purchase Order Management
 * 
 * Features:
 * - Purchase order creation
 * - Supplier assignment
 * - Expected delivery tracking
 * - Partial fulfillment support
 * 
 * CRITICAL: POs do NOT trigger payments or mutate inventory
 */

import { prisma } from '@/lib/prisma'
import { ProcPurchaseOrderStatus, ProcPriority, Prisma } from '@prisma/client'
import { ProcConfigurationService } from './config-service'
import { ProcEventService } from './event-service'

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseOrderInput {
  priority?: ProcPriority
  supplierId: string
  supplierName: string
  supplierPhone?: string
  purchaseRequestId?: string
  shipToLocationId?: string
  shipToAddress?: string
  expectedDelivery?: Date
  paymentTerms?: string
  currency?: string
  isCashPurchase?: boolean
  supplierContactPhone?: string
  internalNotes?: string
  supplierNotes?: string
  termsAndConditions?: string
  items: PurchaseOrderItemInput[]
  createdBy: string
  offlineId?: string
}

export interface PurchaseOrderItemInput {
  productId: string
  productSku?: string
  productName: string
  orderedQuantity: number
  unit?: string
  unitPrice: number
  taxRate?: number
  discount?: number
  specifications?: string
  notes?: string
}

export interface PurchaseOrderFilters {
  status?: ProcPurchaseOrderStatus[]
  priority?: ProcPriority[]
  supplierId?: string
  purchaseRequestId?: string
  fromDate?: Date
  toDate?: Date
  search?: string
  isCashPurchase?: boolean
}

export interface PurchaseOrderListOptions {
  filters?: PurchaseOrderFilters
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'orderDate' | 'expectedDelivery' | 'totalAmount'
  orderDir?: 'asc' | 'desc'
}

// ============================================================================
// SERVICE
// ============================================================================

export class PurchaseOrderService {
  /**
   * Create a purchase order
   */
  static async createPurchaseOrder(tenantId: string, input: PurchaseOrderInput) {
    // Check for duplicate offline ID
    if (input.offlineId) {
      const existing = await prisma.proc_purchase_orders.findUnique({
        where: { tenantId_offlineId: { tenantId, offlineId: input.offlineId } },
      })
      if (existing) {
        return this.getPurchaseOrderById(tenantId, existing.id)
      }
    }

    // Get next PO number
    const poNumber = await ProcConfigurationService.getNextPONumber(tenantId)
    const config = await ProcConfigurationService.getConfig(tenantId)

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0
    const itemsWithTotals = input.items.map((item, index) => {
      const lineSubtotal = item.unitPrice * item.orderedQuantity
      const discount = item.discount || 0
      const lineTax = (lineSubtotal - discount) * (item.taxRate || 0)
      const lineTotal = lineSubtotal - discount + lineTax

      subtotal += lineSubtotal - discount
      taxAmount += lineTax

      return {
        ...item,
        lineTotal,
        lineNumber: index + 1,
        pendingQuantity: item.orderedQuantity,
      }
    })

    const totalAmount = subtotal + taxAmount + (0) // No shipping by default

    // Create PO with items
    const po = await prisma.proc_purchase_orders.create({
      data: {
        tenantId,
        poNumber,
        status: 'DRAFT',
        priority: input.priority || 'NORMAL',
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        supplierPhone: input.supplierPhone,
        purchaseRequestId: input.purchaseRequestId,
        shipToLocationId: input.shipToLocationId,
        shipToAddress: input.shipToAddress,
        expectedDelivery: input.expectedDelivery,
        paymentTerms: input.paymentTerms || config?.defaultPaymentTerms || 'NET30',
        currency: input.currency || config?.defaultCurrency || 'NGN',
        subtotal,
        taxAmount,
        shippingCost: 0,
        discount: 0,
        totalAmount,
        isCashPurchase: input.isCashPurchase ?? false,
        supplierContactPhone: input.supplierContactPhone,
        internalNotes: input.internalNotes,
        supplierNotes: input.supplierNotes,
        termsAndConditions: input.termsAndConditions,
        createdBy: input.createdBy,
        offlineId: input.offlineId,
        proc_purchase_order_items: {
          create: itemsWithTotals.map((item: any) => ({
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            orderedQuantity: item.orderedQuantity,
            pendingQuantity: item.pendingQuantity,
            unit: item.unit || 'UNIT',
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discount: item.discount || 0,
            lineTotal: item.lineTotal,
            specifications: item.specifications,
            notes: item.notes,
            lineNumber: item.lineNumber,
          })),
        },
      } as any,
      include: { proc_purchase_order_items: { orderBy: { lineNumber: 'asc' } } },
    })

    // If created from PR, update PR status
    if (input.purchaseRequestId) {
      await prisma.proc_purchase_requests.update({
        where: { id: input.purchaseRequestId },
        data: {
          status: 'CONVERTED',
          convertedToPOId: po.id,
          convertedAt: new Date(),
        },
      })
    }

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_ORDER_CREATED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.id,
      actorId: input.createdBy,
      data: { poNumber: po.poNumber, supplierId: input.supplierId, total: totalAmount },
    })

    return this.formatPurchaseOrder(po)
  }

  /**
   * List purchase orders with filters
   */
  static async listPurchaseOrders(tenantId: string, options: PurchaseOrderListOptions = {}) {
    const { filters = {}, page = 1, limit = 20, orderBy = 'createdAt', orderDir = 'desc' } = options

    const where: Prisma.proc_purchase_ordersWhereInput = {
      tenantId,
      ...(filters.status && { status: { in: filters.status } }),
      ...(filters.priority && { priority: { in: filters.priority } }),
      ...(filters.supplierId && { supplierId: filters.supplierId }),
      ...(filters.purchaseRequestId && { purchaseRequestId: filters.purchaseRequestId }),
      ...(filters.isCashPurchase !== undefined && { isCashPurchase: filters.isCashPurchase }),
      ...(filters.fromDate && { orderDate: { gte: filters.fromDate } }),
      ...(filters.toDate && { orderDate: { lte: filters.toDate } }),
      ...(filters.search && {
        OR: [
          { poNumber: { contains: filters.search, mode: 'insensitive' as const } },
          { supplierName: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [orders, total] = await Promise.all([
      prisma.proc_purchase_orders.findMany({
        where,
        include: { 
          proc_purchase_order_items: { orderBy: { lineNumber: 'asc' } },
          proc_goods_receipts: { select: { id: true, status: true, receivedDate: true } },
        },
        orderBy: { [orderBy]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proc_purchase_orders.count({ where }),
    ])

    return {
      orders: orders.map(o => this.formatPurchaseOrder(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(tenantId: string, id: string) {
    const po = await prisma.proc_purchase_orders.findFirst({
      where: { id, tenantId },
      include: {
        proc_purchase_order_items: { orderBy: { lineNumber: 'asc' } },
        proc_goods_receipts: {
          include: { proc_goods_receipt_items: true },
          orderBy: { receivedDate: 'desc' },
        },
      },
    })

    return po ? this.formatPurchaseOrder(po) : null
  }

  /**
   * Send PO to supplier (change status to PENDING)
   */
  static async sendToSupplier(tenantId: string, id: string, sentBy: string) {
    const po = await prisma.proc_purchase_orders.findFirst({
      where: { id, tenantId },
    })

    if (!po) throw new Error('Purchase order not found')
    if (po.status !== 'DRAFT') throw new Error('Only draft orders can be sent')

    const updated = await prisma.proc_purchase_orders.update({
      where: { id },
      data: { status: 'PENDING' },
      include: { proc_purchase_order_items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_ORDER_SENT',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      actorId: sentBy,
      data: { poNumber: po.poNumber },
    })

    return this.formatPurchaseOrder(updated)
  }

  /**
   * Confirm PO (supplier confirmed)
   */
  static async confirmPurchaseOrder(
    tenantId: string,
    id: string,
    confirmedBy: string,
    confirmedDeliveryDate?: Date
  ) {
    const po = await prisma.proc_purchase_orders.findFirst({
      where: { id, tenantId },
    })

    if (!po) throw new Error('Purchase order not found')
    if (!['DRAFT', 'PENDING'].includes(po.status)) {
      throw new Error('Only draft or pending orders can be confirmed')
    }

    const updated = await prisma.proc_purchase_orders.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedBy,
        confirmedAt: new Date(),
        ...(confirmedDeliveryDate && { confirmedDelivery: confirmedDeliveryDate }),
      },
      include: { proc_purchase_order_items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_ORDER_CONFIRMED',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      actorId: confirmedBy,
      data: { poNumber: po.poNumber },
    })

    return this.formatPurchaseOrder(updated)
  }

  /**
   * Cancel PO
   */
  static async cancelPurchaseOrder(
    tenantId: string,
    id: string,
    cancelledBy: string,
    reason: string
  ) {
    const po = await prisma.proc_purchase_orders.findFirst({
      where: { id, tenantId },
    })

    if (!po) throw new Error('Purchase order not found')
    if (['RECEIVED', 'CLOSED', 'CANCELLED'].includes(po.status)) {
      throw new Error('Cannot cancel order in current status')
    }

    const updated = await prisma.proc_purchase_orders.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: { proc_purchase_order_items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_ORDER_CANCELLED',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      actorId: cancelledBy,
      data: { poNumber: po.poNumber, reason },
    })

    return this.formatPurchaseOrder(updated)
  }

  /**
   * Close PO
   */
  static async closePurchaseOrder(tenantId: string, id: string, closedBy: string) {
    const po = await prisma.proc_purchase_orders.findFirst({
      where: { id, tenantId },
    })

    if (!po) throw new Error('Purchase order not found')
    if (!['RECEIVED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new Error('Only received orders can be closed')
    }

    const updated = await prisma.proc_purchase_orders.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
      include: { proc_purchase_order_items: true },
    })

    // Emit event
    await ProcEventService.emitEvent(tenantId, {
      eventType: 'PURCHASE_ORDER_CLOSED',
      entityType: 'PURCHASE_ORDER',
      entityId: id,
      actorId: closedBy,
      data: { poNumber: po.poNumber },
    })

    return this.formatPurchaseOrder(updated)
  }

  /**
   * Update PO item received quantity (called by goods receipt)
   */
  static async updateItemReceivedQuantity(itemId: string, receivedQuantity: number) {
    const item = await prisma.proc_purchase_order_items.findUnique({
      where: { id: itemId },
      include: { proc_purchase_orders: true },
    })

    if (!item) throw new Error('PO item not found')

    const newReceivedQty = Number(item.receivedQuantity) + receivedQuantity
    const newPendingQty = Number(item.orderedQuantity) - newReceivedQty

    await prisma.proc_purchase_order_items.update({
      where: { id: itemId },
      data: {
        receivedQuantity: newReceivedQty,
        pendingQuantity: Math.max(0, newPendingQty),
        isFulfilled: newPendingQty <= 0,
      },
    })

    // Check if PO is fully received
    await this.updatePOStatus(item.purchaseOrderId)
  }

  /**
   * Update PO status based on item fulfillment
   */
  private static async updatePOStatus(poId: string) {
    const po = await prisma.proc_purchase_orders.findUnique({
      where: { id: poId },
      include: { proc_purchase_order_items: true },
    })

    if (!po) return

    const allFulfilled = po.proc_purchase_order_items.every(item => item.isFulfilled)
    const anyReceived = po.proc_purchase_order_items.some(item => Number(item.receivedQuantity) > 0)

    let newStatus = po.status
    if (allFulfilled) {
      newStatus = 'RECEIVED'
    } else if (anyReceived) {
      newStatus = 'PARTIALLY_RECEIVED'
    }

    if (newStatus !== po.status) {
      await prisma.proc_purchase_orders.update({
        where: { id: poId },
        data: { status: newStatus },
      })
    }
  }

  /**
   * Get PO statistics
   */
  static async getStatistics(tenantId: string) {
    const [statusCounts, totalValue, supplierCounts] = await Promise.all([
      prisma.proc_purchase_orders.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.proc_purchase_orders.aggregate({
        where: { tenantId, status: { in: ['PENDING', 'CONFIRMED', 'PARTIALLY_RECEIVED'] } },
        _sum: { totalAmount: true },
      }),
      prisma.proc_purchase_orders.groupBy({
        by: ['supplierId'],
        where: { tenantId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        _count: true,
      }),
    ])

    return {
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
        value: s._sum.totalAmount?.toNumber() || 0,
      })),
      pendingValue: totalValue._sum.totalAmount?.toNumber() || 0,
      activeSuppliers: supplierCounts.length,
    }
  }

  /**
   * Format PO for output
   */
  private static formatPurchaseOrder(po: {
    id: string
    tenantId: string
    poNumber: string
    status: ProcPurchaseOrderStatus
    priority: ProcPriority
    supplierId: string
    supplierName: string
    supplierPhone: string | null
    purchaseRequestId: string | null
    shipToLocationId: string | null
    shipToAddress: string | null
    orderDate: Date
    expectedDelivery: Date | null
    confirmedDelivery: Date | null
    paymentTerms: string
    currency: string
    subtotal: { toNumber(): number }
    taxAmount: { toNumber(): number }
    shippingCost: { toNumber(): number }
    discount: { toNumber(): number }
    totalAmount: { toNumber(): number }
    createdBy: string
    confirmedBy: string | null
    confirmedAt: Date | null
    cancelledBy: string | null
    cancelledAt: Date | null
    cancellationReason: string | null
    closedAt: Date | null
    isCashPurchase: boolean
    supplierContactPhone: string | null
    offlineId: string | null
    internalNotes: string | null
    supplierNotes: string | null
    termsAndConditions: string | null
    metadata: unknown
    createdAt: Date
    updatedAt: Date
    items?: Array<{
      id: string
      productId: string
      productSku: string | null
      productName: string
      orderedQuantity: { toNumber(): number }
      receivedQuantity: { toNumber(): number }
      pendingQuantity: { toNumber(): number }
      unit: string
      unitPrice: { toNumber(): number }
      taxRate: { toNumber(): number }
      discount: { toNumber(): number }
      lineTotal: { toNumber(): number }
      specifications: string | null
      notes: string | null
      lineNumber: number
      isFulfilled: boolean
    }>
    receipts?: Array<{
      id: string
      status: string
      receivedDate: Date
    }>
  }) {
    return {
      id: po.id,
      tenantId: po.tenantId,
      poNumber: po.poNumber,
      status: po.status,
      priority: po.priority,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      supplierPhone: po.supplierPhone,
      purchaseRequestId: po.purchaseRequestId,
      shipToLocationId: po.shipToLocationId,
      shipToAddress: po.shipToAddress,
      orderDate: po.orderDate,
      expectedDelivery: po.expectedDelivery,
      confirmedDelivery: po.confirmedDelivery,
      paymentTerms: po.paymentTerms,
      currency: po.currency,
      subtotal: po.subtotal.toNumber(),
      taxAmount: po.taxAmount.toNumber(),
      shippingCost: po.shippingCost.toNumber(),
      discount: po.discount.toNumber(),
      totalAmount: po.totalAmount.toNumber(),
      createdBy: po.createdBy,
      confirmedBy: po.confirmedBy,
      confirmedAt: po.confirmedAt,
      cancelledBy: po.cancelledBy,
      cancelledAt: po.cancelledAt,
      cancellationReason: po.cancellationReason,
      closedAt: po.closedAt,
      isCashPurchase: po.isCashPurchase,
      supplierContactPhone: po.supplierContactPhone,
      offlineId: po.offlineId,
      internalNotes: po.internalNotes,
      supplierNotes: po.supplierNotes,
      termsAndConditions: po.termsAndConditions,
      metadata: po.metadata,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      items: (po as any).proc_purchase_order_items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        orderedQuantity: item.orderedQuantity.toNumber(),
        receivedQuantity: item.receivedQuantity.toNumber(),
        pendingQuantity: item.pendingQuantity.toNumber(),
        unit: item.unit,
        unitPrice: item.unitPrice.toNumber(),
        taxRate: item.taxRate.toNumber(),
        discount: item.discount.toNumber(),
        lineTotal: item.lineTotal.toNumber(),
        specifications: item.specifications,
        notes: item.notes,
        lineNumber: item.lineNumber,
        isFulfilled: item.isFulfilled,
      })),
      receipts: po.receipts?.map(r => ({
        id: r.id,
        status: r.status,
        receivedDate: r.receivedDate,
      })),
    }
  }
}
