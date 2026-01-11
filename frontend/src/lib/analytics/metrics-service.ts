/**
 * MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE
 * Metrics Service - Core business metrics calculation
 * 
 * PHASE 2 & 3: Event Ingestion & Core Business Metrics
 * 
 * Required metrics:
 * - Total sales (POS / Online / Marketplace)
 * - Order volume
 * - Average order value
 * - Best-selling products
 * - Inventory turnover
 * - Low-stock risk
 * - Customer repeat rate
 * - Vendor performance (for MVM)
 * 
 * CRITICAL: All calculations are READ-ONLY, derived from events.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface MetricDefinition {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  aggregationType: string
  sourceEvent: string
  sourceField: string | null
  format: string
  unit: string | null
  isSystem: boolean
  isActive: boolean
}

export interface MetricSnapshot {
  metricKey: string
  periodType: string
  periodStart: Date
  periodEnd: Date
  value: number
  previousValue: number | null
  changePercent: number | null
  dimensionKey: string | null
  dimensionValue: string | null
}

export interface MetricSummary {
  key: string
  name: string
  value: number
  previousValue: number | null
  changePercent: number | null
  format: string
  unit: string | null
  trend: 'up' | 'down' | 'stable'
}

export interface DateRange {
  start: Date
  end: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class MetricsService {
  /**
   * Get all metric definitions for tenant
   */
  static async getMetricDefinitions(tenantId: string): Promise<MetricDefinition[]> {
    const metrics = await prisma.analytics_metric_definitions.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return metrics.map(m => ({
      id: m.id,
      key: m.key,
      name: m.name,
      description: m.description,
      category: m.category,
      aggregationType: m.aggregationType,
      sourceEvent: m.sourceEvent,
      sourceField: m.sourceField,
      format: m.format,
      unit: m.unit,
      isSystem: m.isSystem,
      isActive: m.isActive,
    }))
  }

  /**
   * Get metric snapshot for a period
   */
  static async getMetricSnapshot(
    tenantId: string,
    metricKey: string,
    periodType: string,
    periodStart: Date
  ): Promise<MetricSnapshot | null> {
    const metric = await prisma.analytics_metric_definitions.findUnique({
      where: { tenantId_key: { tenantId, key: metricKey } },
    })

    if (!metric) return null

    const snapshot = await prisma.analytics_metric_snapshots.findFirst({
      where: {
        tenantId,
        metricId: metric.id,
        periodType,
        periodStart,
      },
    })

    if (!snapshot) return null

    return {
      metricKey,
      periodType: snapshot.periodType,
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      value: snapshot.value.toNumber(),
      previousValue: snapshot.previousValue?.toNumber() ?? null,
      changePercent: snapshot.changePercent?.toNumber() ?? null,
      dimensionKey: snapshot.dimensionKey,
      dimensionValue: snapshot.dimensionValue,
    }
  }

  /**
   * Calculate live metrics from source data
   * This is the core READ-ONLY calculation engine
   */
  static async calculateLiveMetrics(tenantId: string, dateRange: DateRange): Promise<MetricSummary[]> {
    const summaries: MetricSummary[] = []

    // Calculate previous period for comparison
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime()
    const previousStart = new Date(dateRange.start.getTime() - periodLength)
    const previousEnd = new Date(dateRange.start.getTime())

    // Total Sales (from Order table - READ ONLY)
    const salesResult = await this.calculateSales(tenantId, dateRange)
    const prevSalesResult = await this.calculateSales(tenantId, { start: previousStart, end: previousEnd })
    summaries.push(this.createSummary('total_sales', 'Total Sales', salesResult, prevSalesResult, 'currency', 'NGN'))

    // Order Count
    const orderCount = await this.calculateOrderCount(tenantId, dateRange)
    const prevOrderCount = await this.calculateOrderCount(tenantId, { start: previousStart, end: previousEnd })
    summaries.push(this.createSummary('order_count', 'Order Count', orderCount, prevOrderCount, 'number', null))

    // Average Order Value
    const avgOrderValue = orderCount > 0 ? salesResult / orderCount : 0
    const prevAvgOrderValue = prevOrderCount > 0 ? prevSalesResult / prevOrderCount : 0
    summaries.push(this.createSummary('avg_order_value', 'Avg Order Value', avgOrderValue, prevAvgOrderValue, 'currency', 'NGN'))

    // New Customers
    const newCustomers = await this.calculateNewCustomers(tenantId, dateRange)
    const prevNewCustomers = await this.calculateNewCustomers(tenantId, { start: previousStart, end: previousEnd })
    summaries.push(this.createSummary('new_customers', 'New Customers', newCustomers, prevNewCustomers, 'number', null))

    // Low Stock Items
    const lowStockCount = await this.calculateLowStockCount(tenantId)
    summaries.push(this.createSummary('low_stock_count', 'Low Stock Items', lowStockCount, null, 'number', null))

    // Inventory Value
    const inventoryValue = await this.calculateInventoryValue(tenantId)
    summaries.push(this.createSummary('inventory_value', 'Inventory Value', inventoryValue, null, 'currency', 'NGN'))

    return summaries
  }

  /**
   * Calculate sales by channel
   */
  static async calculateSalesByChannel(tenantId: string, dateRange: DateRange): Promise<Record<string, number>> {
    const result: Record<string, number> = {
      pos: 0,
      online: 0,
      marketplace: 0,
    }

    // Online Sales (from SvmOrder table)
    try {
      const onlineSales = await prisma.svm_orders.aggregate({
        where: {
          tenantId,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
          status: { in: ['CONFIRMED', 'DELIVERED'] },
        },
        _sum: { grandTotal: true },
      })
      result.online = onlineSales._sum?.grandTotal?.toNumber() || 0
    } catch {
      // Table might not exist or query might fail
    }

    return result
  }

  /**
   * Get top selling products
   */
  static async getTopProducts(
    tenantId: string,
    dateRange: DateRange,
    limit: number = 10
  ): Promise<Array<{ productId: string; productName: string; quantity: number; revenue: number }>> {
    try {
      const topProducts = await prisma.svm_order_items.groupBy({
        by: ['productId'],
        where: {
          order: {
            tenantId,
            createdAt: { gte: dateRange.start, lte: dateRange.end },
            status: { in: ['CONFIRMED', 'DELIVERED'] },
          },
        },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: 'desc' } },
        take: limit,
      })

      // Get product names
      const productIds = topProducts.map(p => p.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })
      const productMap = new Map(products.map(p => [p.id, p.name]))

      return topProducts.map(p => ({
        productId: p.productId,
        productName: productMap.get(p.productId) || 'Unknown',
        quantity: p._sum.quantity || 0,
        revenue: p._sum.lineTotal?.toNumber() || 0,
      }))
    } catch {
      return []
    }
  }

  /**
   * Calculate customer retention rate
   */
  static async calculateRetentionRate(tenantId: string, dateRange: DateRange): Promise<number> {
    try {
      const periodLength = dateRange.end.getTime() - dateRange.start.getTime()
      const previousStart = new Date(dateRange.start.getTime() - periodLength)
      
      const totalCustomers = await prisma.customer.count({
        where: { tenantId, createdAt: { lte: dateRange.end } },
      })

      const repeatCustomers = await prisma.svm_orders.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          createdAt: { gte: previousStart, lte: dateRange.end },
          customerId: { not: null },
        },
        having: { customerId: { _count: { gt: 1 } } },
      })

      return totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0
    } catch {
      return 0
    }
  }

  // ==========================================================================
  // PRIVATE CALCULATION HELPERS
  // ==========================================================================

  private static async calculateSales(tenantId: string, dateRange: DateRange): Promise<number> {
    try {
      // SvmOrder table for online sales
      const orderSales = await prisma.svm_orders.aggregate({
        where: {
          tenantId,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
          status: { in: ['CONFIRMED', 'DELIVERED'] },
        },
        _sum: { grandTotal: true },
      })

      return orderSales._sum?.grandTotal?.toNumber() || 0
    } catch {
      return 0
    }
  }

  private static async calculateOrderCount(tenantId: string, dateRange: DateRange): Promise<number> {
    try {
      const orderCount = await prisma.svm_orders.count({
        where: {
          tenantId,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
      })

      return orderCount
    } catch {
      return 0
    }
  }

  private static async calculateNewCustomers(tenantId: string, dateRange: DateRange): Promise<number> {
    try {
      return await prisma.customer.count({
        where: {
          tenantId,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
      })
    } catch {
      return 0
    }
  }

  private static async calculateLowStockCount(tenantId: string): Promise<number> {
    try {
      // Get all inventory items where quantity is at or below reorder point
      const lowStockItems = await prisma.inventoryLevel.findMany({
        where: { tenantId },
        select: { quantityAvailable: true, reorderPoint: true },
      })
      
      return lowStockItems.filter(item => 
        Number(item.quantityAvailable) <= Number(item.reorderPoint)
      ).length
    } catch {
      return 0
    }
  }

  private static async calculateInventoryValue(tenantId: string): Promise<number> {
    try {
      const inventory = await prisma.inventoryLevel.findMany({
        where: { tenantId },
        include: { Product: { select: { costPrice: true } } },
      })

      return inventory.reduce((total: number, item) => {
        const qty = Number(item.quantityOnHand || 0)
        const cost = Number(item.Product?.costPrice || 0)
        return total + (qty * cost)
      }, 0)
    } catch {
      return 0
    }
  }

  private static createSummary(
    key: string,
    name: string,
    value: number,
    previousValue: number | null,
    format: string,
    unit: string | null
  ): MetricSummary {
    let changePercent: number | null = null
    let trend: 'up' | 'down' | 'stable' = 'stable'

    if (previousValue !== null && previousValue !== 0) {
      changePercent = ((value - previousValue) / previousValue) * 100
      trend = changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable'
    }

    return {
      key,
      name,
      value,
      previousValue,
      changePercent,
      format,
      unit,
      trend,
    }
  }

  /**
   * Store metric snapshot
   */
  static async storeSnapshot(
    tenantId: string,
    metricKey: string,
    periodType: string,
    periodStart: Date,
    periodEnd: Date,
    value: number,
    previousValue?: number
  ): Promise<void> {
    const metric = await prisma.analytics_metric_definitions.findUnique({
      where: { tenantId_key: { tenantId, key: metricKey } },
    })

    if (!metric) return

    const changePercent = previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null

    await prisma.analytics_metric_snapshots.upsert({
      where: {
        metricId_periodType_periodStart_dimensionKey_dimensionValue: {
          metricId: metric.id,
          periodType,
          periodStart,
          dimensionKey: '',
          dimensionValue: '',
        },
      },
      create: {
        tenantId,
        metricId: metric.id,
        periodType,
        periodStart,
        periodEnd,
        value,
        previousValue,
        changePercent,
        dimensionKey: '',
        dimensionValue: '',
      },
      update: {
        value,
        previousValue,
        changePercent,
        computedAt: new Date(),
      },
    })
  }
}
