'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  CreditCard, 
  RefreshCw as Refresh,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Settings
} from 'lucide-react'

interface SubscriptionStats {
  activeSubscriptions: number
  mrr: string
  churnRate: string
  avgLifetimeValue: string
  trialUsers: number
  renewalsThisMonth: number
}

interface SubscriptionItem {
  id: string
  customerName: string
  planName: string
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED'
  amount: string
  nextBillingDate: string
  startDate: string
}

export default function SubscriptionsDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchSubscriptionData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchSubscriptionData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        activeSubscriptions: 0,
        mrr: '₦0',
        churnRate: '0%',
        avgLifetimeValue: '₦0',
        trialUsers: 0,
        renewalsThisMonth: 0
      })
      setSubscriptions([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch subscription data:', err)
      setError('Failed to load subscription data. Make sure the subscriptions module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'TRIAL': return 'bg-blue-100 text-blue-700'
      case 'PAST_DUE': return 'bg-red-100 text-red-700'
      case 'CANCELLED': return 'bg-gray-100 text-gray-700'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'TRIAL': return <Clock className="w-4 h-4 text-blue-500" />
      case 'PAST_DUE': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="subscriptions-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading subscriptions dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="subscriptions-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Subscriptions</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchSubscriptionData}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="subscriptions-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Refresh className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">Subscription Extensions</h1>
                  <p className="text-sm text-slate-500">Recurring Revenue</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchSubscriptionData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              data-testid="refresh-dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="active-subscriptions-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Subscriptions</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.activeSubscriptions || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="mrr-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Monthly Recurring Revenue</p>
            <p className="text-2xl font-bold text-green-600">{stats?.mrr || '₦0'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="churn-rate-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Churn Rate</p>
            <p className="text-2xl font-bold text-red-600">{stats?.churnRate || '0%'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="trial-users-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Trial Users</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.trialUsers || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="subscriptions-list">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Recent Subscriptions</h2>
                <a 
                  href={`/dashboard/subscriptions/list?tenant=${tenantSlug}`}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {subscriptions.length > 0 ? (
                subscriptions.map((subscription) => (
                  <div key={subscription.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getStatusIcon(subscription.status)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{subscription.customerName}</p>
                          <p className="text-sm text-slate-500">{subscription.planName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">{subscription.amount}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(subscription.status)}`}>
                          {subscription.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Refresh className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No subscriptions yet</p>
                  <p className="text-sm text-slate-400 mt-1">Customer subscriptions will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="renewals-card">
              <h2 className="font-semibold text-slate-800 mb-4">Upcoming Renewals</h2>
              <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
                <Calendar className="w-8 h-8 text-teal-600" />
                <div>
                  <p className="text-sm text-slate-600">This Month</p>
                  <p className="font-semibold text-slate-800">{stats?.renewalsThisMonth || 0} renewals</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Package, label: 'Manage Plans', href: `/dashboard/subscriptions/plans?tenant=${tenantSlug}` },
                  { icon: Users, label: 'Subscribers', href: `/dashboard/subscriptions/subscribers?tenant=${tenantSlug}` },
                  { icon: CreditCard, label: 'Invoices', href: `/dashboard/subscriptions/invoices?tenant=${tenantSlug}` },
                  { icon: TrendingUp, label: 'Revenue Analytics', href: `/dashboard/subscriptions/analytics?tenant=${tenantSlug}` },
                  { icon: Calendar, label: 'Billing Schedule', href: `/dashboard/subscriptions/schedule?tenant=${tenantSlug}` },
                  { icon: Settings, label: 'Settings', href: `/dashboard/subscriptions/settings?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-teal-600" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
