'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  Lightbulb,
  Calendar,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'

interface MetricSummary {
  key: string
  name: string
  value: number
  previousValue: number | null
  changePercent: number | null
  format: string
  unit: string | null
  trend: 'up' | 'down' | 'stable'
}

interface BusinessOverview {
  summary: {
    totalSales: MetricSummary | null
    orderCount: MetricSummary | null
    avgOrderValue: MetricSummary | null
    newCustomers: MetricSummary | null
    lowStockCount: MetricSummary | null
  }
  salesByChannel: {
    pos: number
    online: number
    marketplace: number
  }
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
  dateRange: { start: string; end: string }
  generatedAt: string
}

interface InsightItem {
  id: string
  type: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  category: string
  suggestedAction: string | null
  actionUrl: string | null
  status: string
  createdAt: string
}

interface DashboardInfo {
  id: string
  key: string
  name: string
  description: string | null
  isDefault: boolean
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<BusinessOverview | null>(null)
  const [insights, setInsights] = useState<InsightItem[]>([])
  const [dashboards, setDashboards] = useState<DashboardInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [dateRange, setDateRange] = useState(30)

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const initializeAndFetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check status first
      const statusRes = await fetch('/api/analytics?action=status')
      const statusData = await statusRes.json()

      if (!statusData.initialized) {
        // Initialize analytics
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'initialize' }),
        })
        setInitialized(true)
      } else {
        setInitialized(true)
      }

      // Fetch all data in parallel
      const [overviewRes, insightsRes, dashboardsRes] = await Promise.all([
        fetch(`/api/analytics?action=overview&days=${dateRange}`).then(r => r.json()).catch(() => null),
        fetch('/api/analytics?action=insights').then(r => r.json()).catch(() => ({ insights: [] })),
        fetch('/api/analytics?action=dashboards').then(r => r.json()).catch(() => ({ dashboards: [] })),
      ])

      if (overviewRes) {
        setOverview(overviewRes)
      }
      setInsights(insightsRes.insights || [])
      setDashboards(dashboardsRes.dashboards || [])
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-NG').format(value)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800'
    }
  }

  const MetricCard = ({
    title,
    value,
    metric,
    icon: Icon,
    isCurrency = false,
  }: {
    title: string
    value: number
    metric: MetricSummary | null
    icon: React.ElementType
    isCurrency?: boolean
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        {metric && metric.changePercent !== null && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor(metric.trend)}`}>
            {getTrendIcon(metric.trend)}
            <span>{Math.abs(metric.changePercent).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">
        {isCurrency ? formatCurrency(value) : formatNumber(value)}
      </p>
      {metric && metric.previousValue !== null && (
        <p className="text-xs text-gray-400 mt-1">
          vs {isCurrency ? formatCurrency(metric.previousValue) : formatNumber(metric.previousValue)} last period
        </p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Business Intelligence</h1>
            <p className="text-gray-500 mt-1">Nigeria-first insights for your business</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-indigo-500"
              data-testid="date-range-select"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={initializeAndFetch}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              data-testid="refresh-btn"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8" data-testid="metrics-grid">
        <MetricCard
          title="Total Sales"
          value={overview?.summary?.totalSales?.value || 0}
          metric={overview?.summary?.totalSales || null}
          icon={DollarSign}
          isCurrency
        />
        <MetricCard
          title="Order Count"
          value={overview?.summary?.orderCount?.value || 0}
          metric={overview?.summary?.orderCount || null}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Avg Order Value"
          value={overview?.summary?.avgOrderValue?.value || 0}
          metric={overview?.summary?.avgOrderValue || null}
          icon={TrendingUp}
          isCurrency
        />
        <MetricCard
          title="New Customers"
          value={overview?.summary?.newCustomers?.value || 0}
          metric={overview?.summary?.newCustomers || null}
          icon={Users}
        />
        <MetricCard
          title="Low Stock Items"
          value={overview?.summary?.lowStockCount?.value || 0}
          metric={overview?.summary?.lowStockCount || null}
          icon={Package}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales by Channel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="sales-by-channel">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Sales by Channel</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Online Store', value: overview?.salesByChannel?.online || 0, color: 'bg-indigo-500' },
              { label: 'POS', value: overview?.salesByChannel?.pos || 0, color: 'bg-green-500' },
              { label: 'Marketplace', value: overview?.salesByChannel?.marketplace || 0, color: 'bg-orange-500' },
            ].map((channel) => {
              const total = (overview?.salesByChannel?.online || 0) + 
                           (overview?.salesByChannel?.pos || 0) + 
                           (overview?.salesByChannel?.marketplace || 0)
              const percent = total > 0 ? (channel.value / total) * 100 : 0
              return (
                <div key={channel.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{channel.label}</span>
                    <span className="font-medium">{formatCurrency(channel.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${channel.color} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {((overview?.salesByChannel?.online || 0) + 
            (overview?.salesByChannel?.pos || 0) + 
            (overview?.salesByChannel?.marketplace || 0)) === 0 && (
            <p className="text-sm text-gray-400 text-center mt-4">No sales data yet</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="top-products">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Top Products</h3>
          </div>
          {overview?.topProducts && overview.topProducts.length > 0 ? (
            <div className="space-y-3">
              {overview.topProducts.slice(0, 5).map((product, idx) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
                      {product.productName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-400">{formatNumber(product.quantity)} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No product data yet</p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="insights-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Business Insights</h3>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              {insights.filter(i => i.status === 'NEW').length} new
            </span>
          </div>
          {insights.length > 0 ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {insights.slice(0, 5).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {insight.severity === 'critical' ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs mt-1 opacity-80">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No insights generated yet</p>
              <button
                onClick={async () => {
                  await fetch('/api/analytics?action=generate-insights')
                  initializeAndFetch()
                }}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                Generate insights
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboards & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Available Dashboards */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="dashboards-list">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Dashboards</h3>
          </div>
          {dashboards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-gray-900">{dashboard.name}</span>
                    {dashboard.isDefault && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{dashboard.description || 'No description'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No dashboards configured</p>
          )}
        </div>

        {/* Quick Reports */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="quick-reports">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Quick Reports</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Sales Report', action: 'sales-report', icon: DollarSign },
              { name: 'Inventory Report', action: 'inventory-report', icon: Package },
            ].map((report) => (
              <button
                key={report.action}
                onClick={async () => {
                  const res = await fetch(`/api/analytics?action=${report.action}&days=${dateRange}`)
                  const data = await res.json()
                  console.log(`${report.name}:`, data)
                  alert(`${report.name} generated! Check console for details.`)
                }}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
              >
                <report.icon className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-500">Last {dateRange} days</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nigeria-First Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6" data-testid="nigeria-first-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Nigeria-First Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-green-700">NGN Currency</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Africa/Lagos TZ</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Simple Visuals</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Actionable Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
