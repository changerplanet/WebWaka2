/**
 * MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE
 * Insights Service - AI/Rule-based insights and forecasting
 * 
 * PHASE 6: Basic Forecasting & Insights
 * 
 * Capabilities:
 * - Sales trend projection
 * - Inventory depletion estimates
 * - Simple "attention needed" insights
 * 
 * Nigeria-first: Conservative forecasting, explainable logic
 * CRITICAL: Rule-based only, no AI/ML models yet.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { MetricsService, DateRange } from './metrics-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface InsightOutput {
  id: string
  type: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: string
  data: Record<string, unknown>
  suggestedAction: string | null
  actionUrl: string | null
  status: string
  validUntil: Date | null
  createdAt: Date
}

export interface ForecastOutput {
  metricKey: string
  metricName: string
  currentValue: number
  projectedValue: number
  projectionPeriod: string
  confidence: 'low' | 'medium' | 'high'
  trend: 'up' | 'down' | 'stable'
  explanation: string
}

// ============================================================================
// INSIGHT RULES
// ============================================================================

const INSIGHT_RULES = {
  LOW_STOCK_CRITICAL: {
    type: 'low_stock_alert',
    title: 'Critical Low Stock',
    severity: 'critical' as const,
    category: 'inventory',
    threshold: 5,
    action: 'Create purchase request for low stock items',
  },
  LOW_STOCK_WARNING: {
    type: 'low_stock_alert',
    title: 'Low Stock Warning',
    severity: 'warning' as const,
    category: 'inventory',
    threshold: 10,
    action: 'Review inventory levels and consider restocking',
  },
  SALES_DROP: {
    type: 'sales_trend',
    title: 'Sales Decline Detected',
    severity: 'warning' as const,
    category: 'sales',
    threshold: -20, // 20% drop
    action: 'Review recent sales activity and marketing efforts',
  },
  SALES_SURGE: {
    type: 'sales_trend',
    title: 'Sales Surge',
    severity: 'info' as const,
    category: 'sales',
    threshold: 30, // 30% increase
    action: 'Ensure adequate inventory and staff capacity',
  },
  CUSTOMER_CHURN_RISK: {
    type: 'customer_churn_risk',
    title: 'Customer Retention Alert',
    severity: 'warning' as const,
    category: 'customers',
    threshold: 30, // 30% inactive
    action: 'Consider re-engagement campaigns',
  },
}

// ============================================================================
// SERVICE
// ============================================================================

export class InsightsService {
  /**
   * Get all active insights for tenant
   */
  static async getInsights(tenantId: string, options?: {
    status?: string[]
    severity?: string[]
    category?: string
    limit?: number
  }): Promise<InsightOutput[]> {
    const where: Prisma.ai_insightsWhereInput = {
      tenantId,
      ...(options?.status && { status: { in: options.status } }),
      ...(options?.severity && { severity: { in: options.severity } }),
      ...(options?.category && { insightType: options.category }),
      OR: [
        { validTo: null },
        { validTo: { gte: new Date() } },
      ],
    }

    const insights = await prisma.ai_insights.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options?.limit || 50,
    })

    return insights.map(i => this.formatInsight(i))
  }

  /**
   * Generate insights based on current data
   */
  static async generateInsights(tenantId: string): Promise<InsightOutput[]> {
    const newInsights: InsightOutput[] = []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateRange = { start: thirtyDaysAgo, end: now }

    // Get current metrics
    const metrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)
    const metricsMap = new Map(metrics.map(m => [m.key, m]))

    // Check low stock
    const lowStockMetric = metricsMap.get('low_stock_count')
    if (lowStockMetric) {
      if (lowStockMetric.value >= INSIGHT_RULES.LOW_STOCK_CRITICAL.threshold) {
        const insight = await this.createInsight(tenantId, {
          type: INSIGHT_RULES.LOW_STOCK_CRITICAL.type,
          title: INSIGHT_RULES.LOW_STOCK_CRITICAL.title,
          description: `${lowStockMetric.value} items are critically low on stock and need immediate attention.`,
          severity: INSIGHT_RULES.LOW_STOCK_CRITICAL.severity,
          category: INSIGHT_RULES.LOW_STOCK_CRITICAL.category,
          data: { lowStockCount: lowStockMetric.value },
          suggestedAction: INSIGHT_RULES.LOW_STOCK_CRITICAL.action,
          actionUrl: '/dashboard/inventory?filter=low_stock',
          validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Valid for 24 hours
        })
        newInsights.push(insight)
      } else if (lowStockMetric.value >= INSIGHT_RULES.LOW_STOCK_WARNING.threshold) {
        const insight = await this.createInsight(tenantId, {
          type: INSIGHT_RULES.LOW_STOCK_WARNING.type,
          title: INSIGHT_RULES.LOW_STOCK_WARNING.title,
          description: `${lowStockMetric.value} items are running low on stock.`,
          severity: INSIGHT_RULES.LOW_STOCK_WARNING.severity,
          category: INSIGHT_RULES.LOW_STOCK_WARNING.category,
          data: { lowStockCount: lowStockMetric.value },
          suggestedAction: INSIGHT_RULES.LOW_STOCK_WARNING.action,
          actionUrl: '/dashboard/inventory?filter=low_stock',
          validUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Valid for 48 hours
        })
        newInsights.push(insight)
      }
    }

    // Check sales trend
    const salesMetric = metricsMap.get('total_sales')
    if (salesMetric && salesMetric.changePercent !== null) {
      if (salesMetric.changePercent <= INSIGHT_RULES.SALES_DROP.threshold) {
        const insight = await this.createInsight(tenantId, {
          type: INSIGHT_RULES.SALES_DROP.type,
          title: INSIGHT_RULES.SALES_DROP.title,
          description: `Sales have dropped ${Math.abs(salesMetric.changePercent).toFixed(1)}% compared to the previous period.`,
          severity: INSIGHT_RULES.SALES_DROP.severity,
          category: INSIGHT_RULES.SALES_DROP.category,
          data: { 
            currentSales: salesMetric.value,
            previousSales: salesMetric.previousValue,
            changePercent: salesMetric.changePercent,
          },
          suggestedAction: INSIGHT_RULES.SALES_DROP.action,
          actionUrl: '/dashboard/analytics?view=sales',
          validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        })
        newInsights.push(insight)
      } else if (salesMetric.changePercent >= INSIGHT_RULES.SALES_SURGE.threshold) {
        const insight = await this.createInsight(tenantId, {
          type: INSIGHT_RULES.SALES_SURGE.type,
          title: INSIGHT_RULES.SALES_SURGE.title,
          description: `Sales have increased ${salesMetric.changePercent.toFixed(1)}% compared to the previous period!`,
          severity: INSIGHT_RULES.SALES_SURGE.severity,
          category: INSIGHT_RULES.SALES_SURGE.category,
          data: { 
            currentSales: salesMetric.value,
            previousSales: salesMetric.previousValue,
            changePercent: salesMetric.changePercent,
          },
          suggestedAction: INSIGHT_RULES.SALES_SURGE.action,
          actionUrl: '/dashboard/analytics?view=sales',
          validUntil: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Valid for 3 days
        })
        newInsights.push(insight)
      }
    }

    return newInsights
  }

  /**
   * Generate basic forecasts
   */
  static async generateForecasts(tenantId: string): Promise<ForecastOutput[]> {
    const forecasts: ForecastOutput[] = []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateRange = { start: thirtyDaysAgo, end: now }

    // Get current metrics
    const metrics = await MetricsService.calculateLiveMetrics(tenantId, dateRange)

    // Sales forecast (simple linear projection)
    const salesMetric = metrics.find(m => m.key === 'total_sales')
    if (salesMetric) {
      const trend = salesMetric.trend
      const changeRate = salesMetric.changePercent || 0

      // Conservative projection: half the change rate
      const conservativeRate = changeRate / 2
      const projectedValue = salesMetric.value * (1 + conservativeRate / 100)

      forecasts.push({
        metricKey: 'total_sales',
        metricName: 'Total Sales',
        currentValue: salesMetric.value,
        projectedValue,
        projectionPeriod: 'next_30_days',
        confidence: Math.abs(changeRate) < 10 ? 'high' : Math.abs(changeRate) < 30 ? 'medium' : 'low',
        trend,
        explanation: this.generateForecastExplanation('sales', changeRate, projectedValue),
      })
    }

    // Order volume forecast
    const orderMetric = metrics.find(m => m.key === 'order_count')
    if (orderMetric) {
      const changeRate = orderMetric.changePercent || 0
      const conservativeRate = changeRate / 2
      const projectedValue = Math.round(orderMetric.value * (1 + conservativeRate / 100))

      forecasts.push({
        metricKey: 'order_count',
        metricName: 'Order Count',
        currentValue: orderMetric.value,
        projectedValue,
        projectionPeriod: 'next_30_days',
        confidence: Math.abs(changeRate) < 10 ? 'high' : Math.abs(changeRate) < 30 ? 'medium' : 'low',
        trend: orderMetric.trend,
        explanation: this.generateForecastExplanation('orders', changeRate, projectedValue),
      })
    }

    return forecasts
  }

  /**
   * Acknowledge insight
   */
  static async acknowledgeInsight(tenantId: string, insightId: string, userId: string): Promise<InsightOutput> {
    const insight = await prisma.analytics_insights.update({
      where: { id: insightId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    })

    return this.formatInsight(insight)
  }

  /**
   * Dismiss insight
   */
  static async dismissInsight(tenantId: string, insightId: string): Promise<void> {
    await prisma.analytics_insights.update({
      where: { id: insightId },
      data: { status: 'DISMISSED' },
    })
  }

  /**
   * Resolve insight
   */
  static async resolveInsight(tenantId: string, insightId: string): Promise<InsightOutput> {
    const insight = await prisma.analytics_insights.update({
      where: { id: insightId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    })

    return this.formatInsight(insight)
  }

  /**
   * Get insight statistics
   */
  static async getStatistics(tenantId: string) {
    const [bySeverity, byCategory, byStatus] = await Promise.all([
      prisma.analytics_insights.groupBy({
        by: ['severity'],
        where: { tenantId },
        _count: true,
      }),
      prisma.analytics_insights.groupBy({
        by: ['category'],
        where: { tenantId },
        _count: true,
      }),
      prisma.analytics_insights.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
    ])

    return {
      bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count])),
      byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static async createInsight(tenantId: string, input: {
    type: string
    title: string
    description: string
    severity: 'info' | 'warning' | 'critical'
    category: string
    data: Record<string, unknown>
    suggestedAction?: string
    actionUrl?: string
    validUntil?: Date
  }): Promise<InsightOutput> {
    // Check for existing similar insight
    const existing = await prisma.ai_insights.findFirst({
      where: {
        tenantId,
        insightType: input.type,
        status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within 24 hours
      },
    })

    if (existing) {
      return this.formatInsight(existing)
    }

    // Map service interface fields → Prisma model fields
    const insight = await prisma.ai_insights.create({
      data: withPrismaDefaults({
        tenantId,
        insightType: input.type,
        title: input.title,
        summary: input.description,
        details: input.data as Prisma.InputJsonValue,
        explanation: input.suggestedAction || '',
        dataSourcesUsed: [input.category],
        confidence: 0.8,
        severity: input.severity.toUpperCase(),
        relatedType: input.actionUrl ? 'URL' : null,
        relatedId: input.actionUrl || null,
        status: 'ACTIVE',
        validFrom: new Date(),
        validTo: input.validUntil || null,
      }),
    })

    return this.formatInsight(insight)
  }

  private static generateForecastExplanation(type: string, changeRate: number, projected: number): string {
    const trend = changeRate > 1 ? 'upward' : changeRate < -1 ? 'downward' : 'stable'
    const magnitude = Math.abs(changeRate)

    if (type === 'sales') {
      if (trend === 'stable') {
        return `Sales are expected to remain stable around ₦${projected.toLocaleString()} based on current trends.`
      }
      return `Based on ${magnitude.toFixed(1)}% ${trend} trend, sales are projected at ₦${projected.toLocaleString()}.`
    }

    if (type === 'orders') {
      if (trend === 'stable') {
        return `Order volume is expected to remain around ${projected} orders based on current patterns.`
      }
      return `Based on ${magnitude.toFixed(1)}% ${trend} trend, expect approximately ${projected} orders.`
    }

    return `Projection based on historical trends.`
  }

  /**
   * Map Prisma ai_insights model to service InsightOutput interface
   * 
   * Prisma fields → Service fields:
   * - insightType → type
   * - summary → description  
   * - insightType (derived) → category
   * - details → data
   * - explanation → suggestedAction
   * - (none) → actionUrl (null)
   * - validTo → validUntil
   */
  private static formatInsight(insight: {
    id: string
    insightType: string
    title: string
    summary: string
    severity: string
    details: unknown
    explanation: string
    relatedType?: string | null
    relatedId?: string | null
    status: string
    validTo: Date | null
    createdAt: Date
  }): InsightOutput {
    return {
      id: insight.id,
      type: insight.insightType,
      title: insight.title,
      description: insight.summary,
      severity: insight.severity.toLowerCase() as 'info' | 'warning' | 'critical',
      category: insight.insightType.split('_')[0] || 'GENERAL',
      data: insight.details as Record<string, unknown>,
      suggestedAction: insight.explanation,
      actionUrl: insight.relatedType && insight.relatedId 
        ? `/dashboard/${insight.relatedType.toLowerCase()}/${insight.relatedId}` 
        : null,
      status: insight.status,
      validUntil: insight.validTo,
      createdAt: insight.createdAt,
    }
  }
}
