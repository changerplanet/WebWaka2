/**
 * MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE
 * Dashboard Service - Dashboard and widget management
 * 
 * PHASE 4: Dashboards
 * 
 * Required dashboards:
 * - Business Overview
 * - Sales Performance
 * - Inventory Health
 * - Customer Insights
 * - Vendor Insights (MVM only)
 * 
 * Nigeria-first: Mobile-first, simple charts, minimal config
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { MetricsService, DateRange } from './metrics-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardOutput {
  id: string
  key: string
  name: string
  description: string | null
  layout: { columns: number; rows: number }
  isSystem: boolean
  isDefault: boolean
  isActive: boolean
  widgets: WidgetOutput[]
  createdAt: Date
  updatedAt: Date
}

export interface WidgetOutput {
  id: string
  title: string
  type: string
  metricKeys: string[]
  dimensions: string[] | null
  config: Record<string, unknown>
  gridX: number
  gridY: number
  gridW: number
  gridH: number
  isActive: boolean
  sortOrder: number
  data?: unknown
}

export interface DashboardInput {
  key: string
  name: string
  description?: string
  layout?: { columns: number; rows: number }
  isDefault?: boolean
}

export interface WidgetInput {
  title: string
  type: string
  metricKeys: string[]
  dimensions?: string[]
  config?: Record<string, unknown>
  gridX: number
  gridY: number
  gridW: number
  gridH: number
}

// ============================================================================
// SERVICE
// ============================================================================

export class DashboardService {
  /**
   * List all dashboards for tenant
   */
  static async listDashboards(tenantId: string): Promise<DashboardOutput[]> {
    const dashboards = await prisma.analytics_dashboards.findMany({
      where: { tenantId, isActive: true },
      include: {
        analytics_dashboard_widgets: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return dashboards.map(d => this.formatDashboard(d))
  }

  /**
   * Get dashboard by key
   */
  static async getDashboard(tenantId: string, key: string): Promise<DashboardOutput | null> {
    const dashboard = await prisma.analytics_dashboards.findUnique({
      where: { tenantId_key: { tenantId, key } },
      include: {
        analytics_dashboard_widgets: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return dashboard ? this.formatDashboard(dashboard) : null
  }

  /**
   * Get dashboard with live data
   */
  static async getDashboardWithData(
    tenantId: string,
    key: string,
    dateRange: DateRange
  ): Promise<DashboardOutput | null> {
    const dashboard = await this.getDashboard(tenantId, key)
    if (!dashboard) return null

    // Fetch live metrics
    const liveMetrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)
    const metricsMap = new Map(liveMetrics.map(m => [m.key, m]))

    // Attach data to widgets
    dashboard.widgets = dashboard.widgets.map(widget => {
      const widgetData: Record<string, unknown> = {}
      
      for (const metricKey of widget.metricKeys) {
        const metric = metricsMap.get(metricKey)
        if (metric) {
          widgetData[metricKey] = metric
        }
      }

      return {
        ...widget,
        data: widgetData,
      }
    })

    return dashboard
  }

  /**
   * Get default dashboard
   */
  static async getDefaultDashboard(tenantId: string): Promise<DashboardOutput | null> {
    const dashboard = await prisma.analytics_dashboards.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
      include: {
        analytics_dashboard_widgets: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return dashboard ? this.formatDashboard(dashboard) : null
  }

  /**
   * Create custom dashboard
   */
  static async createDashboard(
    tenantId: string,
    input: DashboardInput,
    createdBy: string
  ): Promise<DashboardOutput> {
    const dashboard = await prisma.analytics_dashboards.create({
      data: withPrismaDefaults({
        tenantId,
        key: input.key,
        name: input.name,
        description: input.description,
        layout: input.layout as Prisma.InputJsonValue || { columns: 4, rows: 4 },
        isDefault: input.isDefault ?? false,
        isSystem: false,
        createdBy,
      }),
      include: { analytics_dashboard_widgets: true },
    })

    return this.formatDashboard(dashboard)
  }

  /**
   * Update dashboard
   */
  static async updateDashboard(
    tenantId: string,
    key: string,
    input: Partial<DashboardInput>
  ): Promise<DashboardOutput> {
    const dashboard = await prisma.analytics_dashboards.update({
      where: { tenantId_key: { tenantId, key } },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.layout && { layout: input.layout as Prisma.InputJsonValue }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      },
      include: { analytics_dashboard_widgets: true },
    })

    return this.formatDashboard(dashboard)
  }

  /**
   * Delete dashboard (soft delete)
   */
  static async deleteDashboard(tenantId: string, key: string): Promise<void> {
    await prisma.analytics_dashboards.update({
      where: { tenantId_key: { tenantId, key } },
      data: { isActive: false },
    })
  }

  /**
   * Add widget to dashboard
   */
  static async addWidget(dashboardId: string, input: WidgetInput): Promise<WidgetOutput> {
    const maxOrder = await prisma.analytics_dashboard_widgets.aggregate({
      where: { dashboardId },
      _max: { sortOrder: true },
    })

    const widget = await prisma.analytics_dashboard_widgets.create({
      data: withPrismaDefaults({
        dashboardId,
        title: input.title,
        type: input.type,
        metricKeys: input.metricKeys as Prisma.InputJsonValue,
        dimensions: input.dimensions as Prisma.InputJsonValue || Prisma.JsonNull,
        config: input.config as Prisma.InputJsonValue || {},
        gridX: input.gridX,
        gridY: input.gridY,
        gridW: input.gridW,
        gridH: input.gridH,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      }),
    })

    return this.formatWidget(widget)
  }

  /**
   * Update widget
   */
  static async updateWidget(widgetId: string, input: Partial<WidgetInput>): Promise<WidgetOutput> {
    const widget = await prisma.analytics_dashboard_widgets.update({
      where: { id: widgetId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.type && { type: input.type }),
        ...(input.metricKeys && { metricKeys: input.metricKeys as Prisma.InputJsonValue }),
        ...(input.dimensions && { dimensions: input.dimensions as Prisma.InputJsonValue }),
        ...(input.config && { config: input.config as Prisma.InputJsonValue }),
        ...(input.gridX !== undefined && { gridX: input.gridX }),
        ...(input.gridY !== undefined && { gridY: input.gridY }),
        ...(input.gridW !== undefined && { gridW: input.gridW }),
        ...(input.gridH !== undefined && { gridH: input.gridH }),
      },
    })

    return this.formatWidget(widget)
  }

  /**
   * Remove widget
   */
  static async removeWidget(widgetId: string): Promise<void> {
    await prisma.analytics_dashboard_widgets.update({
      where: { id: widgetId },
      data: { isActive: false },
    })
  }

  /**
   * Get Nigeria-first business overview
   */
  static async getBusinessOverview(tenantId: string, dateRange: DateRange) {
    const metrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)
    const salesByChannel = await MetricsService.calculateSalesByChannel(tenantId, dateRange)
    const topProducts = await MetricsService.getTopProducts(tenantId, dateRange, 5)

    return {
      summary: {
        totalSales: metrics.find(m => m.key === 'total_sales'),
        orderCount: metrics.find(m => m.key === 'order_count'),
        avgOrderValue: metrics.find(m => m.key === 'avg_order_value'),
        newCustomers: metrics.find(m => m.key === 'new_customers'),
        lowStockCount: metrics.find(m => m.key === 'low_stock_count'),
      },
      salesByChannel,
      topProducts,
      dateRange,
      generatedAt: new Date(),
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatDashboard(dashboard: {
    id: string
    key: string
    name: string
    description: string | null
    layout: unknown
    isSystem: boolean
    isDefault: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    widgets?: Array<{
      id: string
      title: string
      type: string
      metricKeys: unknown
      dimensions: unknown
      config: unknown
      gridX: number
      gridY: number
      gridW: number
      gridH: number
      isActive: boolean
      sortOrder: number
    }>
  }): DashboardOutput {
    return {
      id: dashboard.id,
      key: dashboard.key,
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout as { columns: number; rows: number },
      isSystem: dashboard.isSystem,
      isDefault: dashboard.isDefault,
      isActive: dashboard.isActive,
      widgets: (dashboard as unknown as { analytics_dashboard_widgets?: Array<{ id: string; title: string; type: string; metricKeys: unknown; dimensions: unknown; config: unknown; gridX: number; gridY: number; gridW: number; gridH: number; isActive: boolean; sortOrder: number }> }).analytics_dashboard_widgets?.map(w => this.formatWidget(w)) || [],
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
    }
  }

  private static formatWidget(widget: {
    id: string
    title: string
    type: string
    metricKeys: unknown
    dimensions: unknown
    config: unknown
    gridX: number
    gridY: number
    gridW: number
    gridH: number
    isActive: boolean
    sortOrder: number
  }): WidgetOutput {
    return {
      id: widget.id,
      title: widget.title,
      type: widget.type,
      metricKeys: widget.metricKeys as string[],
      dimensions: widget.dimensions as string[] | null,
      config: widget.config as Record<string, unknown>,
      gridX: widget.gridX,
      gridY: widget.gridY,
      gridW: widget.gridW,
      gridH: widget.gridH,
      isActive: widget.isActive,
      sortOrder: widget.sortOrder,
    }
  }
}
