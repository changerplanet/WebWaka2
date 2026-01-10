/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Supplier Service - Pricing and Performance tracking
 * 
 * PHASE 5: Supplier Pricing & Performance
 * 
 * NOTE: Core owns Supplier entity. This service manages:
 * - Supplier price lists (module-owned)
 * - Performance metrics (module-owned)
 * 
 * All metrics are ADVISORY only - no automatic supplier ranking enforcement.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface SupplierPriceInput {
  supplierId: string
  productId: string
  unitPrice: number
  currency?: string
  minOrderQuantity?: number
  unit?: string
  validFrom?: Date
  validTo?: Date
  leadTimeDays?: number
  notes?: string
}

export interface SupplierPriceFilters {
  supplierId?: string
  productId?: string
  isActive?: boolean
  currency?: string
}

export interface SupplierPerformanceFilters {
  supplierId?: string
  fromDate?: Date
  toDate?: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class SupplierService {
  // ==========================================================================
  // PRICE LIST MANAGEMENT
  // ==========================================================================

  /**
   * Add or update supplier price
   */
  static async setSupplierPrice(tenantId: string, input: SupplierPriceInput) {
    const validFrom = input.validFrom || new Date()

    // Deactivate existing prices for same supplier-product combo
    await prisma.proc_supplier_price_lists.updateMany({
      where: {
        tenantId,
        supplierId: input.supplierId,
        productId: input.productId,
        isActive: true,
      },
      data: {
        isActive: false,
        validTo: validFrom,
      },
    })

    // Create new price entry
    const price = await prisma.proc_supplier_price_lists.create({
      data: {
        tenantId,
        supplierId: input.supplierId,
        productId: input.productId,
        unitPrice: input.unitPrice,
        currency: input.currency || 'NGN',
        minOrderQuantity: input.minOrderQuantity || 1,
        unit: input.unit || 'UNIT',
        validFrom,
        validTo: input.validTo,
        leadTimeDays: input.leadTimeDays,
        notes: input.notes,
        isActive: true,
      },
    })

    return this.formatPrice(price)
  }

  /**
   * Get current price for supplier-product combination
   */
  static async getCurrentPrice(tenantId: string, supplierId: string, productId: string) {
    const price = await prisma.proc_supplier_price_lists.findFirst({
      where: {
        tenantId,
        supplierId,
        productId,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    })

    return price ? this.formatPrice(price) : null
  }

  /**
   * List supplier prices
   */
  static async listPrices(tenantId: string, filters: SupplierPriceFilters = {}) {
    const where: Prisma.ProcSupplierPriceListWhereInput = {
      tenantId,
      ...(filters.supplierId && { supplierId: filters.supplierId }),
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.currency && { currency: filters.currency }),
    }

    const prices = await prisma.proc_supplier_price_lists.findMany({
      where,
      orderBy: [{ supplierId: 'asc' }, { validFrom: 'desc' }],
    })

    return prices.map(p => this.formatPrice(p))
  }

  /**
   * Get price history for supplier-product
   */
  static async getPriceHistory(tenantId: string, supplierId: string, productId: string) {
    const prices = await prisma.proc_supplier_price_lists.findMany({
      where: { tenantId, supplierId, productId },
      orderBy: { validFrom: 'desc' },
    })

    return prices.map(p => this.formatPrice(p))
  }

  /**
   * Compare prices across suppliers for a product
   */
  static async comparePrices(tenantId: string, productId: string) {
    const prices = await prisma.proc_supplier_price_lists.findMany({
      where: {
        tenantId,
        productId,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } },
        ],
      },
      orderBy: { unitPrice: 'asc' },
    })

    // Get supplier names from Core
    const supplierIds = [...new Set(prices.map(p => p.supplierId))]
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    })
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]))

    return prices.map(p => ({
      ...this.formatPrice(p),
      supplierName: supplierMap.get(p.supplierId) || 'Unknown',
    }))
  }

  // ==========================================================================
  // PERFORMANCE TRACKING
  // ==========================================================================

  /**
   * Calculate and store supplier performance for a period
   */
  static async calculatePerformance(
    tenantId: string,
    supplierId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get all POs for this supplier in the period
    const orders = await prisma.proc_purchase_orders.findMany({
      where: {
        tenantId,
        supplierId,
        orderDate: { gte: periodStart, lte: periodEnd },
      },
      include: {
        proc_goods_receipts: {
          include: { bill_invoice_items: true },
        },
      },
    })

    // Calculate metrics
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => ['RECEIVED', 'CLOSED'].includes(o.status)).length
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length
    const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

    // Delivery metrics
    let onTimeDeliveries = 0
    let lateDeliveries = 0
    const deliveryDays: number[] = []

    for (const order of orders) {
      if (order.receipts.length > 0 && order.expectedDelivery) {
        const firstReceipt = order.receipts[0]
        const deliveryDate = firstReceipt.receivedDate
        const expected = order.expectedDelivery

        if (deliveryDate <= expected) {
          onTimeDeliveries++
        } else {
          lateDeliveries++
        }

        const daysDiff = Math.ceil((deliveryDate.getTime() - order.orderDate.getTime()) / (1000 * 60 * 60 * 24))
        deliveryDays.push(daysDiff)
      }
    }

    const avgDeliveryDays = deliveryDays.length > 0
      ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length
      : null

    // Quality metrics
    let totalItemsReceived = 0
    let acceptedItems = 0
    let rejectedItems = 0
    let damagedItems = 0

    for (const order of orders) {
      for (const receipt of order.receipts) {
        for (const item of receipt.items) {
          totalItemsReceived += Number(item.receivedQuantity)
          acceptedItems += Number(item.acceptedQuantity)
          rejectedItems += Number(item.rejectedQuantity)
          damagedItems += Number(item.damagedQuantity)
        }
      }
    }

    const qualityScore = totalItemsReceived > 0
      ? (acceptedItems / totalItemsReceived) * 100
      : null

    // Calculate overall score (weighted average)
    const deliveryScore = (onTimeDeliveries + lateDeliveries) > 0
      ? (onTimeDeliveries / (onTimeDeliveries + lateDeliveries)) * 100
      : null
    
    const overallScore = qualityScore !== null && deliveryScore !== null
      ? (qualityScore * 0.6 + deliveryScore * 0.4)
      : qualityScore || deliveryScore || null

    // Upsert performance record
    const performance = await prisma.proc_supplier_performance.upsert({
      where: {
        tenantId_supplierId_periodStart_periodEnd: {
          tenantId,
          supplierId,
          periodStart,
          periodEnd,
        },
      },
      create: {
        tenantId,
        supplierId,
        periodStart,
        periodEnd,
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalOrderValue,
        onTimeDeliveries,
        lateDeliveries,
        avgDeliveryDays,
        totalItemsReceived,
        acceptedItems,
        rejectedItems,
        damagedItems,
        qualityScore,
        overallScore,
      },
      update: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalOrderValue,
        onTimeDeliveries,
        lateDeliveries,
        avgDeliveryDays,
        totalItemsReceived,
        acceptedItems,
        rejectedItems,
        damagedItems,
        qualityScore,
        overallScore,
        calculatedAt: new Date(),
      },
    })

    return this.formatPerformance(performance)
  }

  /**
   * Get supplier performance for a period
   */
  static async getPerformance(
    tenantId: string,
    supplierId: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    const start = periodStart || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const end = periodEnd || new Date()

    const performance = await prisma.proc_supplier_performance.findFirst({
      where: {
        tenantId,
        supplierId,
        periodStart: { gte: start },
        periodEnd: { lte: end },
      },
      orderBy: { periodEnd: 'desc' },
    })

    return performance ? this.formatPerformance(performance) : null
  }

  /**
   * List supplier performance records
   */
  static async listPerformance(tenantId: string, filters: SupplierPerformanceFilters = {}) {
    const where: Prisma.ProcSupplierPerformanceWhereInput = {
      tenantId,
      ...(filters.supplierId && { supplierId: filters.supplierId }),
      ...(filters.fromDate && { periodStart: { gte: filters.fromDate } }),
      ...(filters.toDate && { periodEnd: { lte: filters.toDate } }),
    }

    const records = await prisma.proc_supplier_performance.findMany({
      where,
      orderBy: [{ periodEnd: 'desc' }, { supplierId: 'asc' }],
    })

    // Get supplier names
    const supplierIds = [...new Set(records.map(r => r.supplierId))]
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    })
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]))

    return records.map(r => ({
      ...this.formatPerformance(r),
      supplierName: supplierMap.get(r.supplierId) || 'Unknown',
    }))
  }

  /**
   * Get top performing suppliers
   */
  static async getTopSuppliers(tenantId: string, limit: number = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const records = await prisma.proc_supplier_performance.findMany({
      where: {
        tenantId,
        periodEnd: { gte: thirtyDaysAgo },
        overallScore: { not: null },
      },
      orderBy: { overallScore: 'desc' },
      take: limit,
    })

    // Get supplier names
    const supplierIds = [...new Set(records.map(r => r.supplierId))]
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    })
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]))

    return records.map(r => ({
      supplierId: r.supplierId,
      supplierName: supplierMap.get(r.supplierId) || 'Unknown',
      overallScore: r.overallScore?.toNumber(),
      qualityScore: r.qualityScore?.toNumber(),
      onTimeRate: (r.onTimeDeliveries + r.lateDeliveries) > 0
        ? (r.onTimeDeliveries / (r.onTimeDeliveries + r.lateDeliveries)) * 100
        : null,
      totalOrders: r.totalOrders,
    }))
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatPrice(price: {
    id: string
    tenantId: string
    supplierId: string
    productId: string
    unitPrice: { toNumber(): number }
    currency: string
    minOrderQuantity: { toNumber(): number }
    unit: string
    validFrom: Date
    validTo: Date | null
    isActive: boolean
    leadTimeDays: number | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: price.id,
      tenantId: price.tenantId,
      supplierId: price.supplierId,
      productId: price.productId,
      unitPrice: price.unitPrice.toNumber(),
      currency: price.currency,
      minOrderQuantity: price.minOrderQuantity.toNumber(),
      unit: price.unit,
      validFrom: price.validFrom,
      validTo: price.validTo,
      isActive: price.isActive,
      leadTimeDays: price.leadTimeDays,
      notes: price.notes,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    }
  }

  private static formatPerformance(perf: {
    id: string
    tenantId: string
    supplierId: string
    periodStart: Date
    periodEnd: Date
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    totalOrderValue: { toNumber(): number }
    onTimeDeliveries: number
    lateDeliveries: number
    avgDeliveryDays: { toNumber(): number } | null
    totalItemsReceived: number
    acceptedItems: number
    rejectedItems: number
    damagedItems: number
    qualityScore: { toNumber(): number } | null
    priceVariance: { toNumber(): number } | null
    overallScore: { toNumber(): number } | null
    notes: string | null
    calculatedAt: Date
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: perf.id,
      tenantId: perf.tenantId,
      supplierId: perf.supplierId,
      periodStart: perf.periodStart,
      periodEnd: perf.periodEnd,
      totalOrders: perf.totalOrders,
      completedOrders: perf.completedOrders,
      cancelledOrders: perf.cancelledOrders,
      totalOrderValue: perf.totalOrderValue.toNumber(),
      onTimeDeliveries: perf.onTimeDeliveries,
      lateDeliveries: perf.lateDeliveries,
      avgDeliveryDays: perf.avgDeliveryDays?.toNumber() ?? null,
      totalItemsReceived: perf.totalItemsReceived,
      acceptedItems: perf.acceptedItems,
      rejectedItems: perf.rejectedItems,
      damagedItems: perf.damagedItems,
      qualityScore: perf.qualityScore?.toNumber() ?? null,
      priceVariance: perf.priceVariance?.toNumber() ?? null,
      overallScore: perf.overallScore?.toNumber() ?? null,
      notes: perf.notes,
      calculatedAt: perf.calculatedAt,
      createdAt: perf.createdAt,
      updatedAt: perf.updatedAt,
    }
  }
}
