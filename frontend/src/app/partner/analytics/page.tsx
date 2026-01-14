'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, Users, FileText, CreditCard, 
  TrendingUp, TrendingDown, Building2, ArrowUpRight,
  Loader2, AlertTriangle, Calendar, Filter,
  DollarSign, CheckCircle2, Clock, XCircle
} from 'lucide-react'

type TimeFilter = 'today' | '7d' | '30d' | 'all'

interface OverviewData {
  partnerId: string
  partnerName: string
  timeFilter: TimeFilter
  tenants: { total: number; active: number; inactive: number }
  forms: { total: number; active: number; withPayments: number; demo: number; live: number }
  submissions: { total: number; completed: number; pending: number; demo: number; live: number }
  payments: { 
    initiated: number; successful: number; failed: number; pending: number; 
    demo: number; live: number; totalRevenue: number; currency: string 
  }
  generatedAt: string
}

interface TenantPerformance {
  tenantId: string
  tenantName: string
  tenantSlug: string
  isActive: boolean
  submissions: number
  paymentAttempts: number
  successfulPayments: number
  conversionRate: number
  revenue: number
  currency: string
  isDemo: boolean
}

interface FormPerformance {
  formId: string
  formName: string
  formSlug: string
  tenantId: string
  tenantName: string
  status: string
  paymentEnabled: boolean
  paymentAmount: number | null
  totalSubmissions: number
  completedSubmissions: number
  pendingSubmissions: number
  revenueGenerated: number
  currency: string
  isDemo: boolean
  createdAt: string
}

interface PaymentsData {
  timeFilter: TimeFilter
  summary: {
    totalTransactions: number
    pending: number
    success: number
    failed: number
    abandoned: number
    expired: number
    demo: number
    live: number
  }
  revenue: {
    total: number
    currency: string
    byStatus: { successful: number; pending: number }
  }
  bySource: { sourceModule: string; count: number; revenue: number }[]
}

function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'blue'
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function DemoLabel({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
      Demo
    </span>
  )
}

export default function PartnerAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d')
  const [includeDemo, setIncludeDemo] = useState(true)
  
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [tenants, setTenants] = useState<TenantPerformance[]>([])
  const [forms, setForms] = useState<FormPerformance[]>([])
  const [payments, setPayments] = useState<PaymentsData | null>(null)

  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'forms' | 'payments'>('overview')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        timeFilter,
        includeDemo: String(includeDemo),
      })

      const [overviewRes, tenantsRes, formsRes, paymentsRes] = await Promise.all([
        fetch(`/api/partner/analytics/overview?${params}`),
        fetch(`/api/partner/analytics/tenants?${params}`),
        fetch(`/api/partner/analytics/forms?${params}`),
        fetch(`/api/partner/analytics/payments?${params}`),
      ])

      const [overviewData, tenantsData, formsData, paymentsData] = await Promise.all([
        overviewRes.json(),
        tenantsRes.json(),
        formsRes.json(),
        paymentsRes.json(),
      ])

      if (!overviewData.success) {
        if (overviewRes.status === 403) {
          router.push('/auth/login')
          return
        }
        throw new Error(overviewData.error || 'Failed to fetch analytics')
      }

      setOverview(overviewData.overview)
      setTenants(tenantsData.tenants || [])
      setForms(formsData.forms || [])
      setPayments(paymentsData.success ? paymentsData : null)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [timeFilter, includeDemo, router])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Analytics</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              {overview?.partnerName || 'Partner'} performance overview
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              {(['today', '7d', '30d', 'all'] as TimeFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    timeFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter === 'today' ? 'Today' : filter === 'all' ? 'All Time' : filter}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <input
                type="checkbox"
                checked={includeDemo}
                onChange={(e) => setIncludeDemo(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Include Demo
            </label>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tenants', label: 'Tenants', icon: Building2 },
            { id: 'forms', label: 'Forms', icon: FileText },
            { id: 'payments', label: 'Payments', icon: CreditCard },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Tenants"
                value={overview.tenants.total}
                subtitle={`${overview.tenants.active} active`}
                icon={Building2}
                color="blue"
              />
              <StatCard
                title="Total Forms"
                value={overview.forms.total}
                subtitle={`${overview.forms.active} active`}
                icon={FileText}
                color="purple"
              />
              <StatCard
                title="Total Submissions"
                value={overview.submissions.total}
                subtitle={`${overview.submissions.completed} completed`}
                icon={Users}
                color="green"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(overview.payments.totalRevenue, overview.payments.currency)}
                subtitle={`${overview.payments.successful} successful payments`}
                icon={DollarSign}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Forms Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Forms</span>
                    <span className="font-medium">{overview.forms.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">With Payments</span>
                    <span className="font-medium">{overview.forms.withPayments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Live Forms</span>
                    <span className="font-medium">{overview.forms.live}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Demo Forms</span>
                    <span className="font-medium text-amber-600">{overview.forms.demo}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payments Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Initiated</span>
                    <span className="font-medium">{overview.payments.initiated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Successful
                    </span>
                    <span className="font-medium text-green-600">{overview.payments.successful}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-yellow-500" /> Pending
                    </span>
                    <span className="font-medium text-yellow-600">{overview.payments.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-500" /> Failed
                    </span>
                    <span className="font-medium text-red-600">{overview.payments.failed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tenant Performance</h3>
              <p className="text-sm text-gray-500">Performance breakdown by tenant</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No tenant data available
                      </td>
                    </tr>
                  ) : (
                    tenants.map((tenant) => (
                      <tr key={tenant.tenantId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{tenant.tenantName}</span>
                            <DemoLabel isDemo={tenant.isDemo} />
                          </div>
                          <span className="text-sm text-gray-500">{tenant.tenantSlug}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                            tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">{tenant.submissions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-green-600">{tenant.successfulPayments}</span>
                          <span className="text-gray-400"> / {tenant.paymentAttempts}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">{tenant.conversionRate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                          {formatCurrency(tenant.revenue, tenant.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'forms' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Form Performance</h3>
              <p className="text-sm text-gray-500">Analytics for all forms across tenants</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No form data available
                      </td>
                    </tr>
                  ) : (
                    forms.map((form) => (
                      <tr key={form.formId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{form.formName}</span>
                            <DemoLabel isDemo={form.isDemo} />
                            {form.paymentEnabled && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                <DollarSign className="w-3 h-3 mr-0.5" />
                                {form.paymentAmount ? formatCurrency(form.paymentAmount, form.currency) : 'Payment'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.tenantName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                            form.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            form.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            form.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {form.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-gray-900">{form.totalSubmissions}</span>
                          {form.pendingSubmissions > 0 && (
                            <span className="text-yellow-600 text-sm ml-1">({form.pendingSubmissions} pending)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                          {formatCurrency(form.revenueGenerated, form.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && payments && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Transactions"
                value={payments.summary.totalTransactions}
                subtitle={`${payments.summary.live} live, ${payments.summary.demo} demo`}
                icon={CreditCard}
                color="blue"
              />
              <StatCard
                title="Successful"
                value={payments.summary.success}
                icon={CheckCircle2}
                color="green"
              />
              <StatCard
                title="Failed"
                value={payments.summary.failed}
                icon={XCircle}
                color="red"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(payments.revenue.total, payments.revenue.currency)}
                subtitle={`${formatCurrency(payments.revenue.byStatus.pending, payments.revenue.currency)} pending`}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {payments.bySource.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h3>
                <div className="space-y-3">
                  {payments.bySource.map((source) => (
                    <div key={source.sourceModule} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{source.sourceModule}</span>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{formatCurrency(source.revenue, 'NGN')}</span>
                        <span className="text-sm text-gray-500 ml-2">({source.count} txns)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
