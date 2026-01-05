'use client'

/**
 * PHASE 4B: Partner SaaS Dashboard
 * 
 * Business health view for partners operating as SaaS providers:
 * - Revenue Overview (MRR, ARR, growth)
 * - Client Lifecycle (trial, active, at-risk)
 * - Platform Counts
 * - Expansion Signals
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Zap,
  Package,
  UserPlus,
  BarChart3,
  Bell,
  Shield,
} from 'lucide-react'

interface DashboardData {
  revenue: {
    mrr: number
    arr: number
    mrrGrowthPercent: number
    totalActiveClients: number
    averageRevenuePerClient: number
    currency: string
  }
  lifecycle: {
    trial: number
    active: number
    suspended: number
    atRisk: number
    cancelled: number
    total: number
  }
  platforms: {
    totalTenants: number
    totalInstances: number
    avgInstancesPerTenant: number
    activeInstances: number
    suspendedInstances: number
  }
  churnIndicators: Array<{
    id: string
    type: string
    instanceId: string
    instanceName: string
    tenantName: string
    indicator: string
    severity: string
    occurredAt: string
  }>
}

interface SignalSummary {
  total: number
  byPriority: {
    high: number
    medium: number
    low: number
  }
  topSignals: Array<{
    id: string
    type: string
    priority: string
    title: string
    description: string
    recommendation: string
    instanceName: string
    tenantName: string
  }>
}

export default function PartnerSaaSDashboard() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [signals, setSignals] = useState<SignalSummary | null>(null)
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      setLoading(true)
      setError(null)

      const [dashRes, signalsRes] = await Promise.all([
        fetch('/api/partner/dashboard'),
        fetch('/api/partner/signals?summary=true'),
      ])

      const dashData = await dashRes.json()
      const signalsData = await signalsRes.json()

      if (!dashData.success) {
        if (dashRes.status === 403) {
          setError('Partner access required')
        } else {
          setError(dashData.error || 'Failed to load dashboard')
        }
        return
      }

      setDashboard(dashData.dashboard)
      setPartner(dashData.partner)
      
      if (signalsData.success) {
        setSignals(signalsData.summary)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="saas-dashboard-loading">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="saas-dashboard-error">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Required</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href="/dashboard" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="min-h-screen bg-slate-50" data-testid="partner-saas-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                SaaS Dashboard
              </h1>
              <p className="text-slate-600 text-sm mt-1">{partner?.name} • Business Health Overview</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboard}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                data-testid="refresh-dashboard"
              >
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </button>
              <a
                href="/dashboard/partner/packages"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                data-testid="manage-packages-btn"
              >
                <Package className="w-4 h-4" />
                Packages
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Revenue Overview */}
        <section className="mb-8" data-testid="revenue-overview">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Revenue Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MRR Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200" data-testid="mrr-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Monthly Revenue</span>
                <div className={`flex items-center gap-1 text-sm ${dashboard.revenue.mrrGrowthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dashboard.revenue.mrrGrowthPercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(dashboard.revenue.mrrGrowthPercent)}%
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(dashboard.revenue.mrr, dashboard.revenue.currency)}
              </p>
              <p className="text-xs text-slate-500 mt-1">MRR</p>
            </div>

            {/* ARR Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200" data-testid="arr-card">
              <span className="text-sm font-medium text-slate-500">Annual Revenue</span>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {formatCurrency(dashboard.revenue.arr, dashboard.revenue.currency)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ARR (MRR × 12)</p>
            </div>

            {/* Active Clients */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200" data-testid="active-clients-card">
              <span className="text-sm font-medium text-slate-500">Active Clients</span>
              <p className="text-3xl font-bold text-slate-900 mt-2">{dashboard.revenue.totalActiveClients}</p>
              <p className="text-xs text-slate-500 mt-1">Paying subscriptions</p>
            </div>

            {/* ARPC */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200" data-testid="arpc-card">
              <span className="text-sm font-medium text-slate-500">Avg Revenue/Client</span>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {formatCurrency(dashboard.revenue.averageRevenuePerClient, dashboard.revenue.currency)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ARPC</p>
            </div>
          </div>
        </section>

        {/* Client Lifecycle & Platforms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Client Lifecycle */}
          <section data-testid="client-lifecycle">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Client Lifecycle
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Trial</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{dashboard.lifecycle.trial}</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{dashboard.lifecycle.active}</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">At Risk</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{dashboard.lifecycle.atRisk}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 grid grid-cols-2 divide-x divide-slate-200">
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Suspended</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{dashboard.lifecycle.suspended}</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Cancelled</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{dashboard.lifecycle.cancelled}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Clients</span>
                  <span className="text-lg font-bold text-slate-900">{dashboard.lifecycle.total}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Counts */}
          <section data-testid="platform-counts">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Platform Instances
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Tenants</p>
                  <p className="text-3xl font-bold text-slate-900">{dashboard.platforms.totalTenants}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Instances</p>
                  <p className="text-3xl font-bold text-slate-900">{dashboard.platforms.totalInstances}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Active Instances</span>
                  <span className="font-medium text-emerald-600">{dashboard.platforms.activeInstances}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Suspended Instances</span>
                  <span className="font-medium text-red-600">{dashboard.platforms.suspendedInstances}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Avg Instances/Tenant</span>
                  <span className="font-medium text-slate-900">{dashboard.platforms.avgInstancesPerTenant}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Expansion Signals */}
        {signals && signals.total > 0 && (
          <section className="mb-8" data-testid="expansion-signals">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Expansion Signals
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  {signals.total}
                </span>
              </h2>
              <a href="/dashboard/partner/signals" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
              {signals.topSignals.slice(0, 3).map((signal) => (
                <div key={signal.id} className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    signal.priority === 'high' ? 'bg-red-100' : 
                    signal.priority === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <Zap className={`w-4 h-4 ${
                      signal.priority === 'high' ? 'text-red-600' : 
                      signal.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{signal.title}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        signal.priority === 'high' ? 'bg-red-100 text-red-700' : 
                        signal.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {signal.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{signal.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{signal.tenantName} • {signal.instanceName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Churn Indicators */}
        {dashboard.churnIndicators.length > 0 && (
          <section data-testid="churn-indicators">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Churn Indicators
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
              {dashboard.churnIndicators.slice(0, 5).map((indicator) => (
                <div key={indicator.id} className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    indicator.severity === 'high' ? 'bg-red-100' : 
                    indicator.severity === 'medium' ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    {indicator.type === 'subscription_cancelled' ? (
                      <XCircle className={`w-4 h-4 ${
                        indicator.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 ${
                        indicator.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{indicator.tenantName}</p>
                    <p className="text-sm text-slate-600">{indicator.indicator}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {indicator.instanceName} • {new Date(indicator.occurredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="mt-8" data-testid="quick-actions">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/dashboard/partner/clients"
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition group"
            >
              <UserPlus className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Manage Clients</h3>
              <p className="text-sm text-slate-600">Create, view, and manage client platforms</p>
            </a>
            <a
              href="/dashboard/partner/packages"
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition group"
            >
              <Package className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Configure Packages</h3>
              <p className="text-sm text-slate-600">Set up pricing plans for your clients</p>
            </a>
            <a
              href="/dashboard/partner/staff"
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition group"
            >
              <Users className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Manage Team</h3>
              <p className="text-sm text-slate-600">Add sales and support staff</p>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
