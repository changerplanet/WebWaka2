/**
 * MODULE 7: ANALYTICS & BUSINESS INTELLIGENCE
 * Main API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { AnalyticsConfigService } from '@/lib/analytics/config-service'
import { MetricsService } from '@/lib/analytics/metrics-service'
import { DashboardService } from '@/lib/analytics/dashboard-service'
import { ReportsService } from '@/lib/analytics/reports-service'
import { InsightsService } from '@/lib/analytics/insights-service'
import { AnalyticsEntitlementsService, AnalyticsValidationService } from '@/lib/analytics/entitlements-service'

/**
 * GET /api/analytics
 * Get analytics status, dashboards, or specific data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Status
    if (action === 'status' || !action) {
      const status = await AnalyticsConfigService.getStatus(tenantId)
      return NextResponse.json(status)
    }

    // Overview with live metrics
    if (action === 'overview') {
      const days = parseInt(searchParams.get('days') || '30')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const overview = await DashboardService.getBusinessOverview(tenantId, { start, end })
      return NextResponse.json(overview)
    }

    // Dashboards
    if (action === 'dashboards') {
      const dashboards = await DashboardService.listDashboards(tenantId)
      return NextResponse.json({ dashboards })
    }

    // Specific dashboard
    if (action === 'dashboard') {
      const key = searchParams.get('key') || 'business_overview'
      const days = parseInt(searchParams.get('days') || '30')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const dashboard = await DashboardService.getDashboardWithData(tenantId, key, { start, end })
      return NextResponse.json({ dashboard })
    }

    // Metrics
    if (action === 'metrics') {
      const days = parseInt(searchParams.get('days') || '30')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const metrics = await MetricsService.calculateLiveMetrics(tenantId, { start, end })
      return NextResponse.json({ metrics })
    }

    // Metric definitions
    if (action === 'metric-definitions') {
      const definitions = await MetricsService.getMetricDefinitions(tenantId)
      return NextResponse.json({ definitions })
    }

    // Reports
    if (action === 'reports') {
      const reports = await ReportsService.listReports(tenantId)
      return NextResponse.json({ reports })
    }

    // Generate report
    if (action === 'generate-report') {
      const key = searchParams.get('key')
      if (!key) {
        return NextResponse.json({ error: 'Report key required' }, { status: 400 })
      }
      const days = parseInt(searchParams.get('days') || '30')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const report = await ReportsService.generateReport(tenantId, key, { start, end })
      return NextResponse.json({ report })
    }

    // Sales report
    if (action === 'sales-report') {
      const days = parseInt(searchParams.get('days') || '30')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const report = await ReportsService.generateSalesReport(tenantId, { start, end })
      return NextResponse.json({ report })
    }

    // Inventory report
    if (action === 'inventory-report') {
      const report = await ReportsService.generateInventoryReport(tenantId)
      return NextResponse.json({ report })
    }

    // Insights
    if (action === 'insights') {
      const severity = searchParams.get('severity')?.split(',')
      const category = searchParams.get('category') || undefined
      const insights = await InsightsService.getInsights(tenantId, { severity, category })
      return NextResponse.json({ insights })
    }

    // Generate insights
    if (action === 'generate-insights') {
      const insights = await InsightsService.generateInsights(tenantId)
      return NextResponse.json({ insights })
    }

    // Forecasts
    if (action === 'forecasts') {
      const entitlement = await AnalyticsEntitlementsService.checkEntitlement(tenantId, 'forecastingEnabled')
      if (!entitlement.allowed) {
        return NextResponse.json({ error: 'Forecasting not enabled for your plan' }, { status: 403 })
      }
      const forecasts = await InsightsService.generateForecasts(tenantId)
      return NextResponse.json({ forecasts })
    }

    // Top products
    if (action === 'top-products') {
      const days = parseInt(searchParams.get('days') || '30')
      const limit = parseInt(searchParams.get('limit') || '10')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const products = await MetricsService.getTopProducts(tenantId, { start, end }, limit)
      return NextResponse.json({ products })
    }

    // Sales by channel
    if (action === 'sales-by-channel') {
      const days = parseInt(searchParams.get('days') || '30')
      const end = new Date()
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
      const salesByChannel = await MetricsService.calculateSalesByChannel(tenantId, { start, end })
      return NextResponse.json({ salesByChannel })
    }

    // Entitlements
    if (action === 'entitlements') {
      const entitlements = await AnalyticsEntitlementsService.getEntitlements(tenantId)
      return NextResponse.json(entitlements)
    }

    // Validation
    if (action === 'validate') {
      const result = await AnalyticsValidationService.validateModule(tenantId)
      return NextResponse.json(result)
    }

    // Manifest
    if (action === 'manifest') {
      const manifest = AnalyticsValidationService.getManifest()
      return NextResponse.json(manifest)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/analytics
 * Initialize analytics, create dashboards/reports, acknowledge insights
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Initialize
    if (body.action === 'initialize') {
      const config = await AnalyticsConfigService.initialize(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Create dashboard
    if (body.action === 'create-dashboard') {
      const dashboard = await DashboardService.createDashboard(tenantId, body.dashboard, session.user.id)
      return NextResponse.json({ success: true, dashboard })
    }

    // Create report
    if (body.action === 'create-report') {
      const report = await ReportsService.createReport(tenantId, body.report, session.user.id)
      return NextResponse.json({ success: true, report })
    }

    // Acknowledge insight
    if (body.action === 'acknowledge-insight') {
      const insight = await InsightsService.acknowledgeInsight(tenantId, body.insightId, session.user.id)
      return NextResponse.json({ success: true, insight })
    }

    // Dismiss insight
    if (body.action === 'dismiss-insight') {
      await InsightsService.dismissInsight(tenantId, body.insightId)
      return NextResponse.json({ success: true })
    }

    // Resolve insight
    if (body.action === 'resolve-insight') {
      const insight = await InsightsService.resolveInsight(tenantId, body.insightId)
      return NextResponse.json({ success: true, insight })
    }

    // Export report to CSV
    if (body.action === 'export-csv') {
      const entitlement = await AnalyticsEntitlementsService.checkEntitlement(tenantId, 'exportEnabled')
      if (!entitlement.allowed) {
        return NextResponse.json({ error: 'Export not enabled for your plan' }, { status: 403 })
      }
      const csv = await ReportsService.exportToCSV(body.report)
      return NextResponse.json({ success: true, csv })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Analytics POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/analytics
 * Update configuration or dashboards
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Update config
    if (body.action === 'update-config') {
      const config = await AnalyticsConfigService.updateConfig(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Update dashboard
    if (body.action === 'update-dashboard') {
      const dashboard = await DashboardService.updateDashboard(tenantId, body.key, body.dashboard)
      return NextResponse.json({ success: true, dashboard })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Analytics PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
