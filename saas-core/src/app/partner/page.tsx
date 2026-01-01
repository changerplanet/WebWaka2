'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, Users, DollarSign, TrendingUp, LogOut, 
  ChevronRight, Loader2, AlertTriangle, Activity,
  Wallet, ArrowUpRight, ArrowDownRight, Calendar,
  BarChart3, PieChart, Clock, ExternalLink, HandCoins
} from 'lucide-react'

interface PartnerDashboard {
  partner: {
    id: string
    name: string
    slug: string
    status: string
    tier: string
    joinedAt: string
    currentAgreement: {
      version: number
      commissionRate: number
      commissionType: string
      effectiveFrom: string
    } | null
  }
  summary: {
    totalReferrals: number
    activeReferrals: number
    pendingReferrals: number
    totalEarnings: number
    thisMonthEarnings: number
    lastMonthEarnings: number
    currentBalance: number
    pendingClearance: number
    currency: string
  }
  earnings: {
    balance: {
      pending: number
      cleared: number
      approved: number
      totalPayable: number
      totalPaid: number
      meetsMinimum: boolean
      minimumPayout: number
      currency: string
    }
    monthlyTrend: { month: string; earned: number; paid: number }[]
    byStatus: { pending: number; cleared: number; approved: number; paid: number }
  }
  referrals: {
    total: number
    byStatus: { active: number; pending: number; suspended: number; churned: number }
    recent: ReferredTenant[]
    topPerformers: ReferredTenant[]
  }
  recentActivity: ActivityItem[]
}

interface ReferredTenant {
  referralId: string
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantStatus: string
  referredAt: string
  attributionMethod: string
  isLifetime: boolean
  totalRevenue: number
  lastPaymentDate: string | null
}

interface ActivityItem {
  id: string
  type: 'REFERRAL' | 'EARNING' | 'PAYOUT' | 'AGREEMENT'
  title: string
  description: string
  amount?: number
  currency?: string
  timestamp: string
}

interface User {
  id: string
  email: string
  name: string | null
  globalRole: string
}

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndFetchDashboard()
  }, [])

  async function checkAuthAndFetchDashboard() {
    try {
      // Check session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated) {
        router.push('/login')
        return
      }
      
      setUser(sessionData.user)
      
      // Get partner ID from partner membership
      const partnerRes = await fetch('/api/partners/me')
      const partnerData = await partnerRes.json()
      
      if (!partnerData.success || !partnerData.partnerId) {
        setError('You are not associated with a partner organization')
        setLoading(false)
        return
      }
      
      setPartnerId(partnerData.partnerId)
      
      // Fetch dashboard
      const dashboardRes = await fetch(`/api/partners/${partnerData.partnerId}/dashboard`)
      const dashboardData = await dashboardRes.json()
      
      if (dashboardData.error) {
        setError(dashboardData.error)
      } else {
        setDashboard(dashboardData)
      }
    } catch (err) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400'
      case 'PENDING': case 'PENDING_ACTIVATION': return 'bg-amber-500/20 text-amber-400'
      case 'SUSPENDED': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'PLATINUM': return 'bg-gradient-to-r from-slate-300 to-slate-500 text-slate-900'
      case 'GOLD': return 'bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900'
      case 'SILVER': return 'bg-gradient-to-r from-slate-400 to-slate-500 text-slate-900'
      default: return 'bg-gradient-to-r from-orange-600 to-orange-800 text-orange-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error || 'Unable to load dashboard'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const earningsChange = dashboard.summary.lastMonthEarnings > 0 
    ? ((dashboard.summary.thisMonthEarnings - dashboard.summary.lastMonthEarnings) / dashboard.summary.lastMonthEarnings * 100)
    : dashboard.summary.thisMonthEarnings > 0 ? 100 : 0

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold">Partner Portal</h1>
              <p className="text-xs text-slate-400">{dashboard.partner.name}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/partner', active: true },
              { icon: Users, label: 'Referrals', href: '/partner/referrals' },
              { icon: Wallet, label: 'Earnings', href: '/partner/earnings' },
              { icon: Activity, label: 'Audit Log', href: '/partner/audit' },
            ].map((item, i) => (
              <li key={i}>
                <a
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    item.active 
                      ? 'bg-indigo-600/20 text-indigo-400' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Partner Info Card */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Partner Tier</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTierColor(dashboard.partner.tier)}`}>
                {dashboard.partner.tier}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Commission Rate</span>
              <span className="text-sm font-semibold text-white">
                {dashboard.partner.currentAgreement 
                  ? `${(dashboard.partner.currentAgreement.commissionRate * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-slate-500">Partner Owner</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Welcome back! Here's your partner performance overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dashboard.partner.status)}`}>
              {dashboard.partner.status}
            </span>
            <span className="text-sm text-slate-400">
              Partner since {formatDate(dashboard.partner.joinedAt)}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <p className="text-3xl font-bold">{dashboard.summary.totalReferrals}</p>
            <p className="text-slate-400 text-sm">Referrals</p>
            <div className="mt-2 text-xs">
              <span className="text-emerald-400">{dashboard.summary.activeReferrals} active</span>
              <span className="text-slate-600 mx-1">•</span>
              <span className="text-amber-400">{dashboard.summary.pendingReferrals} pending</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className={`text-xs flex items-center gap-1 ${earningsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {earningsChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(earningsChange).toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard.summary.thisMonthEarnings, dashboard.summary.currency)}</p>
            <p className="text-slate-400 text-sm">This Month</p>
            <p className="mt-2 text-xs text-slate-500">
              Last month: {formatCurrency(dashboard.summary.lastMonthEarnings, dashboard.summary.currency)}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs text-slate-500">Lifetime</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard.summary.totalEarnings, dashboard.summary.currency)}</p>
            <p className="text-slate-400 text-sm">Total Earned</p>
            <p className="mt-2 text-xs text-slate-500">
              Paid: {formatCurrency(dashboard.earnings.balance.totalPaid, dashboard.summary.currency)}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              {dashboard.earnings.balance.meetsMinimum ? (
                <span className="text-xs text-emerald-400">Ready for payout</span>
              ) : (
                <span className="text-xs text-slate-500">Min: {formatCurrency(dashboard.earnings.balance.minimumPayout)}</span>
              )}
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard.summary.currentBalance, dashboard.summary.currency)}</p>
            <p className="text-slate-400 text-sm">Available Balance</p>
            <p className="mt-2 text-xs text-slate-500">
              Pending clearance: {formatCurrency(dashboard.summary.pendingClearance, dashboard.summary.currency)}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Earnings Trend */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Earnings Trend</h2>
              <a href="/partner/earnings" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="h-48 flex items-end gap-2">
              {dashboard.earnings.monthlyTrend.slice(-6).map((month, i) => {
                const maxEarned = Math.max(...dashboard.earnings.monthlyTrend.map(m => m.earned), 1)
                const height = (month.earned / maxEarned) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-slate-400 mb-1">
                        {month.earned > 0 ? formatCurrency(month.earned) : '-'}
                      </span>
                      <div 
                        className="w-full bg-indigo-500/30 rounded-t-lg transition-all hover:bg-indigo-500/50"
                        style={{ height: `${Math.max(height, 4)}%`, minHeight: '8px' }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{month.month.slice(-2)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Referral Status Breakdown */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Referral Status</h2>
              <a href="/partner/referrals" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Active', count: dashboard.referrals.byStatus.active, color: 'bg-emerald-500' },
                { label: 'Pending', count: dashboard.referrals.byStatus.pending, color: 'bg-amber-500' },
                { label: 'Suspended', count: dashboard.referrals.byStatus.suspended, color: 'bg-red-500' },
                { label: 'Churned', count: dashboard.referrals.byStatus.churned, color: 'bg-slate-500' },
              ].map((status, i) => {
                const percentage = dashboard.referrals.total > 0 
                  ? (status.count / dashboard.referrals.total * 100) 
                  : 0
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">{status.label}</span>
                      <span className="text-slate-400">{status.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${status.color} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Top Performing Referrals</h2>
              <a href="/partner/referrals?sort=revenue" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            {dashboard.referrals.topPerformers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.referrals.topPerformers.slice(0, 5).map((tenant, i) => (
                  <div key={tenant.referralId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/50 transition">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tenant.tenantName}</p>
                      <p className="text-xs text-slate-500">{tenant.tenantSlug}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
                        {formatCurrency(tenant.totalRevenue)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tenant.tenantStatus)}`}>
                        {tenant.tenantStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <a href="/partner/audit" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View Log <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            {dashboard.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-700/50 transition">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.type === 'EARNING' ? 'bg-emerald-500/20 text-emerald-400' :
                      activity.type === 'REFERRAL' ? 'bg-indigo-500/20 text-indigo-400' :
                      activity.type === 'PAYOUT' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {activity.type === 'EARNING' && <DollarSign className="w-5 h-5" />}
                      {activity.type === 'REFERRAL' && <Users className="w-5 h-5" />}
                      {activity.type === 'PAYOUT' && <Wallet className="w-5 h-5" />}
                      {activity.type === 'AGREEMENT' && <Building2 className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-slate-400 truncate">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    {activity.amount !== undefined && (
                      <div className="text-right">
                        <p className="font-semibold text-emerald-400">
                          +{formatCurrency(activity.amount, activity.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
