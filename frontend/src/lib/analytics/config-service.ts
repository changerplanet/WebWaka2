/**
 * MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE
 * Configuration Service - Tenant-level analytics settings
 * 
 * PHASE 0: Module Constitution
 * 
 * This module OWNS:
 * - Analytics configuration
 * - Metrics and aggregations
 * - Dashboards and reports
 * - Basic forecasting
 * 
 * This module DOES NOT OWN (read-only access only):
 * - Orders, Payments, Inventory, Customers, Wallets, Ledgers
 * 
 * CRITICAL: This module is STRICTLY READ-ONLY. No data mutation occurs.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsConfigInput {
  analyticsEnabled?: boolean
  dashboardsEnabled?: boolean
  reportsEnabled?: boolean
  forecastingEnabled?: boolean
  exportEnabled?: boolean
  snapshotRetentionDays?: number
  autoRefreshEnabled?: boolean
  refreshIntervalMins?: number
  defaultCurrency?: string
  timezone?: string
  fiscalYearStart?: number
  metadata?: Record<string, unknown>
}

export interface AnalyticsConfigOutput {
  id: string
  tenantId: string
  analyticsEnabled: boolean
  dashboardsEnabled: boolean
  reportsEnabled: boolean
  forecastingEnabled: boolean
  exportEnabled: boolean
  snapshotRetentionDays: number
  autoRefreshEnabled: boolean
  refreshIntervalMins: number
  lastRefreshedAt: Date | null
  defaultCurrency: string
  timezone: string
  fiscalYearStart: number
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class AnalyticsConfigService {
  /**
   * Get analytics status
   */
  static async getStatus(tenantId: string) {
    const config = await prisma.analytics_configurations.findUnique({
      where: { tenantId },
    })

    return {
      initialized: !!config,
      enabled: config?.analyticsEnabled ?? false,
      config: config ? this.formatConfig(config) : null,
    }
  }

  /**
   * Get analytics configuration
   */
  static async getConfig(tenantId: string): Promise<AnalyticsConfigOutput | null> {
    const config = await prisma.analytics_configurations.findUnique({
      where: { tenantId },
    })

    return config ? this.formatConfig(config) : null
  }

  /**
   * Initialize analytics module
   */
  static async initialize(tenantId: string, input?: AnalyticsConfigInput): Promise<AnalyticsConfigOutput> {
    const existing = await prisma.analytics_configurations.findUnique({
      where: { tenantId },
    })

    if (existing) {
      return this.updateConfig(tenantId, input || {})
    }

    const config = await prisma.analytics_configurations.create({
      data: withPrismaDefaults({
        tenantId,
        analyticsEnabled: input?.analyticsEnabled ?? true,
        dashboardsEnabled: input?.dashboardsEnabled ?? true,
        reportsEnabled: input?.reportsEnabled ?? true,
        forecastingEnabled: input?.forecastingEnabled ?? false,
        exportEnabled: input?.exportEnabled ?? true,
        snapshotRetentionDays: input?.snapshotRetentionDays ?? 365,
        autoRefreshEnabled: input?.autoRefreshEnabled ?? true,
        refreshIntervalMins: input?.refreshIntervalMins ?? 60,
        defaultCurrency: input?.defaultCurrency ?? 'NGN',
        timezone: input?.timezone ?? 'Africa/Lagos',
        fiscalYearStart: input?.fiscalYearStart ?? 1,
        metadata: input?.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      }),
    })

    // Create default metric definitions
    await this.createDefaultMetrics(tenantId)

    // Create default dashboards
    await this.createDefaultDashboards(tenantId)

    return this.formatConfig(config)
  }

  /**
   * Update analytics configuration
   */
  static async updateConfig(tenantId: string, input: AnalyticsConfigInput): Promise<AnalyticsConfigOutput> {
    const config = await prisma.analytics_configurations.update({
      where: { tenantId },
      data: {
        ...(input.analyticsEnabled !== undefined && { analyticsEnabled: input.analyticsEnabled }),
        ...(input.dashboardsEnabled !== undefined && { dashboardsEnabled: input.dashboardsEnabled }),
        ...(input.reportsEnabled !== undefined && { reportsEnabled: input.reportsEnabled }),
        ...(input.forecastingEnabled !== undefined && { forecastingEnabled: input.forecastingEnabled }),
        ...(input.exportEnabled !== undefined && { exportEnabled: input.exportEnabled }),
        ...(input.snapshotRetentionDays !== undefined && { snapshotRetentionDays: input.snapshotRetentionDays }),
        ...(input.autoRefreshEnabled !== undefined && { autoRefreshEnabled: input.autoRefreshEnabled }),
        ...(input.refreshIntervalMins !== undefined && { refreshIntervalMins: input.refreshIntervalMins }),
        ...(input.defaultCurrency !== undefined && { defaultCurrency: input.defaultCurrency }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.fiscalYearStart !== undefined && { fiscalYearStart: input.fiscalYearStart }),
        ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      },
    })

    return this.formatConfig(config)
  }

  /**
   * Mark last refresh time
   */
  static async markRefreshed(tenantId: string): Promise<void> {
    await prisma.analytics_configurations.update({
      where: { tenantId },
      data: { lastRefreshedAt: new Date() },
    })
  }

  /**
   * Create default metric definitions
   */
  private static async createDefaultMetrics(tenantId: string): Promise<void> {
    const defaultMetrics = [
      // Sales metrics
      { key: 'total_sales', name: 'Total Sales', category: 'sales', aggregationType: 'SUM', sourceEvent: 'SALE_COMPLETED', sourceField: 'amount', format: 'currency' },
      { key: 'order_count', name: 'Order Count', category: 'sales', aggregationType: 'COUNT', sourceEvent: 'ORDER_CREATED', format: 'number' },
      { key: 'avg_order_value', name: 'Average Order Value', category: 'sales', aggregationType: 'AVG', sourceEvent: 'SALE_COMPLETED', sourceField: 'amount', format: 'currency' },
      { key: 'pos_sales', name: 'POS Sales', category: 'sales', aggregationType: 'SUM', sourceEvent: 'POS_SALE_COMPLETED', sourceField: 'amount', format: 'currency' },
      { key: 'online_sales', name: 'Online Sales', category: 'sales', aggregationType: 'SUM', sourceEvent: 'ONLINE_SALE_COMPLETED', sourceField: 'amount', format: 'currency' },
      
      // Inventory metrics
      { key: 'low_stock_count', name: 'Low Stock Items', category: 'inventory', aggregationType: 'COUNT', sourceEvent: 'INVENTORY_LOW', format: 'number' },
      { key: 'inventory_value', name: 'Inventory Value', category: 'inventory', aggregationType: 'SUM', sourceEvent: 'INVENTORY_VALUED', sourceField: 'value', format: 'currency' },
      
      // Customer metrics
      { key: 'new_customers', name: 'New Customers', category: 'customers', aggregationType: 'COUNT', sourceEvent: 'CUSTOMER_CREATED', format: 'number' },
      { key: 'repeat_customers', name: 'Repeat Customers', category: 'customers', aggregationType: 'COUNT', sourceEvent: 'REPEAT_PURCHASE', format: 'number' },
      { key: 'customer_retention_rate', name: 'Customer Retention Rate', category: 'customers', aggregationType: 'AVG', sourceEvent: 'CALCULATED', format: 'percentage' },

      // Operations metrics
      { key: 'pending_orders', name: 'Pending Orders', category: 'operations', aggregationType: 'COUNT', sourceEvent: 'ORDER_PENDING', format: 'number' },
      { key: 'fulfillment_rate', name: 'Fulfillment Rate', category: 'operations', aggregationType: 'AVG', sourceEvent: 'CALCULATED', format: 'percentage' },
    ]

    for (const metric of defaultMetrics) {
      await prisma.analyticsMetricDefinition.upsert({
        where: { tenantId_key: { tenantId, key: metric.key } },
        create: {
          tenantId,
          ...metric,
          isSystem: true,
          isActive: true,
        },
        update: {},
      })
    }
  }

  /**
   * Create default dashboards
   */
  private static async createDefaultDashboards(tenantId: string): Promise<void> {
    const defaultDashboards = [
      {
        key: 'business_overview',
        name: 'Business Overview',
        description: 'High-level business performance metrics',
        isDefault: true,
        layout: { columns: 4, rows: 4 },
        widgets: [
          { title: 'Total Sales', type: 'card', metricKeys: ['total_sales'], gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'Order Count', type: 'card', metricKeys: ['order_count'], gridX: 1, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'Avg Order Value', type: 'card', metricKeys: ['avg_order_value'], gridX: 2, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'New Customers', type: 'card', metricKeys: ['new_customers'], gridX: 3, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'Sales Trend', type: 'line_chart', metricKeys: ['total_sales'], gridX: 0, gridY: 1, gridW: 2, gridH: 2 },
          { title: 'Sales by Channel', type: 'pie_chart', metricKeys: ['pos_sales', 'online_sales'], gridX: 2, gridY: 1, gridW: 2, gridH: 2 },
        ],
      },
      {
        key: 'sales_performance',
        name: 'Sales Performance',
        description: 'Detailed sales analytics',
        isDefault: false,
        layout: { columns: 4, rows: 4 },
        widgets: [
          { title: 'Total Sales', type: 'card', metricKeys: ['total_sales'], gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'POS Sales', type: 'card', metricKeys: ['pos_sales'], gridX: 1, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'Online Sales', type: 'card', metricKeys: ['online_sales'], gridX: 2, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'Avg Order Value', type: 'card', metricKeys: ['avg_order_value'], gridX: 3, gridY: 0, gridW: 1, gridH: 1 },
        ],
      },
      {
        key: 'inventory_health',
        name: 'Inventory Health',
        description: 'Inventory status and alerts',
        isDefault: false,
        layout: { columns: 4, rows: 3 },
        widgets: [
          { title: 'Low Stock Items', type: 'card', metricKeys: ['low_stock_count'], gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
          { title: 'Inventory Value', type: 'card', metricKeys: ['inventory_value'], gridX: 1, gridY: 0, gridW: 1, gridH: 1 },
        ],
      },
    ]

    for (const dashboard of defaultDashboards) {
      const existing = await prisma.analytics_dashboards.findUnique({
        where: { tenantId_key: { tenantId, key: dashboard.key } },
      })

      if (!existing) {
        const created = await prisma.analytics_dashboards.create({
          data: {
            tenantId,
            key: dashboard.key,
            name: dashboard.name,
            description: dashboard.description,
            isDefault: dashboard.isDefault,
            isSystem: true,
            layout: dashboard.layout as Prisma.InputJsonValue,
          },
        })

        // Create widgets
        for (const widget of dashboard.widgets) {
          await prisma.analytics_dashboard_widgets.create({
            data: {
              dashboardId: created.id,
              title: widget.title,
              type: widget.type,
              metricKeys: widget.metricKeys as Prisma.InputJsonValue,
              config: {} as Prisma.InputJsonValue,
              gridX: widget.gridX,
              gridY: widget.gridY,
              gridW: widget.gridW,
              gridH: widget.gridH,
            },
          })
        }
      }
    }
  }

  /**
   * Format config for output
   */
  private static formatConfig(config: {
    id: string
    tenantId: string
    analyticsEnabled: boolean
    dashboardsEnabled: boolean
    reportsEnabled: boolean
    forecastingEnabled: boolean
    exportEnabled: boolean
    snapshotRetentionDays: number
    autoRefreshEnabled: boolean
    refreshIntervalMins: number
    lastRefreshedAt: Date | null
    defaultCurrency: string
    timezone: string
    fiscalYearStart: number
    metadata: unknown
    createdAt: Date
    updatedAt: Date
  }): AnalyticsConfigOutput {
    return {
      id: config.id,
      tenantId: config.tenantId,
      analyticsEnabled: config.analyticsEnabled,
      dashboardsEnabled: config.dashboardsEnabled,
      reportsEnabled: config.reportsEnabled,
      forecastingEnabled: config.forecastingEnabled,
      exportEnabled: config.exportEnabled,
      snapshotRetentionDays: config.snapshotRetentionDays,
      autoRefreshEnabled: config.autoRefreshEnabled,
      refreshIntervalMins: config.refreshIntervalMins,
      lastRefreshedAt: config.lastRefreshedAt,
      defaultCurrency: config.defaultCurrency,
      timezone: config.timezone,
      fiscalYearStart: config.fiscalYearStart,
      metadata: config.metadata as Record<string, unknown> | null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  }
}
