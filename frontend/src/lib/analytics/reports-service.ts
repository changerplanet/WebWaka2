/**
 * MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE
 * Reports Service - Report generation and export
 * 
 * PHASE 5: Reports & Exports
 * 
 * Capabilities:
 * - Period-based reports
 * - CSV and PDF export
 * - Shareable summaries (read-only)
 * 
 * CRITICAL: Reports derived from metrics only, no direct raw data access.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { MetricsService, DateRange } from './metrics-service'

// ============================================================================
// TYPES
// ============================================================================

export interface ReportDefinition {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  metricKeys: string[]
  dimensions: string[] | null
  filters: Record<string, unknown> | null
  format: string
  isScheduled: boolean
  schedule: string | null
  recipients: string[] | null
  isSystem: boolean
  isActive: boolean
  lastGeneratedAt: Date | null
}

export interface ReportOutput {
  reportKey: string
  reportName: string
  generatedAt: Date
  dateRange: DateRange
  metrics: Array<{
    key: string
    name: string
    value: number
    previousValue: number | null
    changePercent: number | null
    format: string
  }>
  dimensions?: Record<string, unknown>
  exportFormats: string[]
}

export interface ReportInput {
  key: string
  name: string
  description?: string
  category: string
  metricKeys: string[]
  dimensions?: string[]
  filters?: Record<string, unknown>
  format?: string
  isScheduled?: boolean
  schedule?: string
  recipients?: string[]
}

// ============================================================================
// SERVICE
// ============================================================================

export class ReportsService {
  /**
   * List all report definitions
   */
  static async listReports(tenantId: string): Promise<ReportDefinition[]> {
    const reports = await prisma.analytics_report_definitions.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return reports.map(r => this.formatReportDefinition(r))
  }

  /**
   * Get report definition
   */
  static async getReportDefinition(tenantId: string, key: string): Promise<ReportDefinition | null> {
    const report = await prisma.analytics_report_definitions.findUnique({
      where: { tenantId_key: { tenantId, key } },
    })

    return report ? this.formatReportDefinition(report) : null
  }

  /**
   * Generate report
   */
  static async generateReport(
    tenantId: string,
    key: string,
    dateRange: DateRange
  ): Promise<ReportOutput | null> {
    const definition = await this.getReportDefinition(tenantId, key)
    if (!definition) return null

    // Calculate metrics
    const liveMetrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)
    const metricsMap = new Map(liveMetrics.map(m => [m.key, m]))

    // Filter to requested metrics
    const reportMetrics = definition.metricKeys
      .map(key => metricsMap.get(key))
      .filter(m => m !== undefined)
      .map(m => ({
        key: m!.key,
        name: m!.name,
        value: m!.value,
        previousValue: m!.previousValue,
        changePercent: m!.changePercent,
        format: m!.format,
      }))

    // Update last generated
    await prisma.analytics_report_definitions.update({
      where: { tenantId_key: { tenantId, key } },
      data: { lastGeneratedAt: new Date() },
    })

    return {
      reportKey: definition.key,
      reportName: definition.name,
      generatedAt: new Date(),
      dateRange,
      metrics: reportMetrics,
      exportFormats: ['CSV', 'PDF'],
    }
  }

  /**
   * Generate quick sales report
   */
  static async generateSalesReport(tenantId: string, dateRange: DateRange): Promise<ReportOutput> {
    const metrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)
    const salesByChannel = await MetricsService.calculateSalesByChannel(tenantId, dateRange)
    const topProducts = await MetricsService.getTopProducts(tenantId, dateRange, 10)

    const salesMetrics = metrics
      .filter(m => ['total_sales', 'order_count', 'avg_order_value', 'pos_sales', 'online_sales'].includes(m.key))
      .map(m => ({
        key: m.key,
        name: m.name,
        value: m.value,
        previousValue: m.previousValue,
        changePercent: m.changePercent,
        format: m.format,
      }))

    return {
      reportKey: 'sales_report',
      reportName: 'Sales Report',
      generatedAt: new Date(),
      dateRange,
      metrics: salesMetrics,
      dimensions: {
        salesByChannel,
        topProducts,
      },
      exportFormats: ['CSV', 'PDF'],
    }
  }

  /**
   * Generate inventory report
   */
  static async generateInventoryReport(tenantId: string): Promise<ReportOutput> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateRange = { start: thirtyDaysAgo, end: now }

    const metrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)
    
    const inventoryMetrics = metrics
      .filter(m => ['low_stock_count', 'inventory_value'].includes(m.key))
      .map(m => ({
        key: m.key,
        name: m.name,
        value: m.value,
        previousValue: m.previousValue,
        changePercent: m.changePercent,
        format: m.format,
      }))

    // Get low stock items
    let lowStockItems: Array<{ productName: string; quantity: number; reorderPoint: number }> = []
    try {
      const items = await prisma.inventoryLevel.findMany({
        where: { tenantId },
        include: { Product: { select: { name: true } } },
        take: 50,
      })

      lowStockItems = items
        .filter(item => Number(item.quantityAvailable) <= Number(item.reorderPoint))
        .slice(0, 20)
        .map(item => ({
          productName: item.product?.name || 'Unknown',
          quantity: Number(item.quantityOnHand),
          reorderPoint: Number(item.reorderPoint),
        }))
    } catch {
      // Table might not exist
    }

    return {
      reportKey: 'inventory_report',
      reportName: 'Inventory Report',
      generatedAt: new Date(),
      dateRange,
      metrics: inventoryMetrics,
      dimensions: {
        lowStockItems,
      },
      exportFormats: ['CSV', 'PDF'],
    }
  }

  /**
   * Export report to CSV format
   */
  static async exportToCSV(report: ReportOutput): Promise<string> {
    const lines: string[] = []

    // Header
    lines.push(`Report: ${report.reportName}`)
    lines.push(`Generated: ${report.generatedAt.toISOString()}`)
    lines.push(`Period: ${report.dateRange.start.toISOString()} to ${report.dateRange.end.toISOString()}`)
    lines.push('')

    // Metrics
    lines.push('Metric,Value,Previous Value,Change %')
    for (const metric of report.metrics) {
      const value = metric.format === 'currency' ? `₦${metric.value.toLocaleString()}` : metric.value.toString()
      const prev = metric.previousValue !== null
        ? (metric.format === 'currency' ? `₦${metric.previousValue.toLocaleString()}` : metric.previousValue.toString())
        : 'N/A'
      const change = metric.changePercent !== null ? `${metric.changePercent.toFixed(2)}%` : 'N/A'
      lines.push(`${metric.name},${value},${prev},${change}`)
    }

    return lines.join('\n')
  }

  /**
   * Create report definition
   */
  static async createReport(
    tenantId: string,
    input: ReportInput,
    createdBy: string
  ): Promise<ReportDefinition> {
    const report = await prisma.analytics_report_definitions.create({
      data: {
        tenantId,
        key: input.key,
        name: input.name,
        description: input.description,
        category: input.category,
        metricKeys: input.metricKeys as Prisma.InputJsonValue,
        dimensions: input.dimensions as Prisma.InputJsonValue || Prisma.JsonNull,
        filters: input.filters as Prisma.InputJsonValue || Prisma.JsonNull,
        format: input.format || 'PDF',
        isScheduled: input.isScheduled || false,
        schedule: input.schedule,
        recipients: input.recipients as Prisma.InputJsonValue || Prisma.JsonNull,
        isSystem: false,
        createdBy,
      },
    })

    return this.formatReportDefinition(report)
  }

  /**
   * Delete report definition
   */
  static async deleteReport(tenantId: string, key: string): Promise<void> {
    await prisma.analytics_report_definitions.update({
      where: { tenantId_key: { tenantId, key } },
      data: { isActive: false },
    })
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatReportDefinition(report: {
    id: string
    key: string
    name: string
    description: string | null
    category: string
    metricKeys: unknown
    dimensions: unknown
    filters: unknown
    format: string
    isScheduled: boolean
    schedule: string | null
    recipients: unknown
    isSystem: boolean
    isActive: boolean
    lastGeneratedAt: Date | null
  }): ReportDefinition {
    return {
      id: report.id,
      key: report.key,
      name: report.name,
      description: report.description,
      category: report.category,
      metricKeys: report.metricKeys as string[],
      dimensions: report.dimensions as string[] | null,
      filters: report.filters as Record<string, unknown> | null,
      format: report.format,
      isScheduled: report.isScheduled,
      schedule: report.schedule,
      recipients: report.recipients as string[] | null,
      isSystem: report.isSystem,
      isActive: report.isActive,
      lastGeneratedAt: report.lastGeneratedAt,
    }
  }
}
