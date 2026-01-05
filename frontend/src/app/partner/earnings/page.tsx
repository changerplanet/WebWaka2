'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, LogOut, ChevronRight, Loader2, AlertTriangle, 
  Activity, Wallet, DollarSign, TrendingUp, ArrowUpRight,
  ArrowDownRight, Calendar, Clock, CheckCircle, PieChart,
  BarChart3, HandCoins, ChevronLeft
} from 'lucide-react'

interface PartnerDashboard {
  partner: {
    id: string
    name: string
    tier: string
    currentAgreement: {
      commissionRate: number
      commissionType: string
    } | null
  }
  summary: {
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
      inBatch: number
      totalPayable: number
      totalPaid: number
      totalReversed: number
      meetsMinimum: boolean
      minimumPayout: number
      currency: string
    }
    monthlyTrend: { month: string; earned: number; paid: number }[]
    byStatus: { pending: number; cleared: number; approved: number; paid: number }
  }
}

interface PerformanceMetrics {
  partnerId: string
  period: { start: string; end: string }
  conversionRate: number
  totalRevenue: number
  averageRevenuePerReferral: number
  retentionRate: number
  churnRate: number
  newReferralsThisPeriod: number
  growthRate: number
  monthlyRevenue: { month: string; amount: number }[]
}

interface User {
  id: string
  email: string
  name: string | null
}

export default function EarningsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('12')

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  useEffect(() => {
    if (partnerId) {
      fetchPerformance()
    }
  }, [partnerId, selectedPeriod])

  async function checkAuthAndFetchData() {
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated) {
        router.push('/login')
        return
      }
      
      setUser(sessionData.user)
      
      const partnerRes = await fetch('/api/partners/me')
      const partnerData = await partnerRes.json()
      
      if (!partnerData.success || !partnerData.partnerId) {
        setError('You are not associated with a partner organization')
        setLoading(false)
        return
      }
      
      setPartnerId(partnerData.partnerId)
      
      // Fetch dashboard for earnings data
      const dashboardRes = await fetch(`/api/partners/${partnerData.partnerId}/dashboard`)
      const dashboardData = await dashboardRes.json()
      
      if (dashboardData.error) {
        setError(dashboardData.error)
      } else {
        setDashboard(dashboardData)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPerformance() {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - parseInt(selectedPeriod))
      
      const res = await fetch(
        `/api/partners/${partnerId}/dashboard/performance?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      )
      const data = await res.json()
      
      if (!data.error) {
        setPerformance(data)
      }
    } catch (err) {
      console.error('Failed to fetch performance:', err)
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

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error || 'Unable to load earnings'}</p>
          <button
            onClick={() => router.push('/partner')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const earningsChange = dashboard.summary.lastMonthEarnings > 0 
    ? ((dashboard.summary.thisMonthEarnings - dashboard.summary.lastMonthEarnings) / dashboard.summary.lastMonthEarnings * 100)
    : dashboard.summary.thisMonthEarnings > 0 ? 100 : 0

  const balanceData = dashboard.earnings.balance
  const totalBalance = balanceData.pending + balanceData.cleared + balanceData.approved

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold">Partner Portal</h1>
              <p className="text-xs text-slate-400">Earnings</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/partner' },
              { icon: Users, label: 'Referrals', href: '/partner/referrals' },
              { icon: Wallet, label: 'Earnings', href: '/partner/earnings', active: true },
              { icon: Activity, label: 'Audit Log', href: '/partner/audit' },
            ].map((item, i) => (
              <li key={i}>
                <a
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    item.active 
                      ? 'bg-green-600/20 text-green-400' 
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
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
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <a href="/partner" className="hover:text-white transition">Dashboard</a>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Earnings</span>
            </div>
            <h1 className="text-3xl font-bold">Earnings & Performance</h1>
            <p className="text-slate-400 mt-1">
              Track your commissions and payout status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="24">Last 24 months</option>
            </select>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              {balanceData.meetsMinimum ? (
                <span className="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-1 rounded-full">
                  Payout Ready
                </span>
              ) : (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Min: {formatCurrency(balanceData.minimumPayout)}
                </span>
              )}
            </div>
            <p className="text-4xl font-bold">{formatCurrency(balanceData.totalPayable, balanceData.currency)}</p>
            <p className="text-green-200 mt-1">Available for Payout</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(balanceData.pending, balanceData.currency)}</p>
            <p className="text-slate-400 text-sm">Pending Clearance</p>
            <p className="text-xs text-slate-500 mt-2">30-day clearance period</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className={`text-xs flex items-center gap-1 ${earningsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {earningsChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatPercent(earningsChange)}
              </span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard.summary.thisMonthEarnings, dashboard.summary.currency)}</p>
            <p className="text-slate-400 text-sm">This Month</p>
            <p className="text-xs text-slate-500 mt-2">
              Last month: {formatCurrency(dashboard.summary.lastMonthEarnings)}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(balanceData.totalPaid, balanceData.currency)}</p>
            <p className="text-slate-400 text-sm">Total Paid Out</p>
            <p className="text-xs text-slate-500 mt-2">
              Lifetime earnings: {formatCurrency(dashboard.summary.totalEarnings)}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-6">Monthly Earnings</h2>
            <div className="h-64 flex items-end gap-2">
              {dashboard.earnings.monthlyTrend.slice(-12).map((month, i) => {
                const maxEarned = Math.max(...dashboard.earnings.monthlyTrend.map(m => m.earned), 1)
                const earnedHeight = (month.earned / maxEarned) * 100
                const paidHeight = (month.paid / maxEarned) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center h-48 justify-end gap-0.5">
                      {month.earned > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {formatCurrency(month.earned).replace('$', '')}
                        </span>
                      )}
                      <div className="w-full flex gap-0.5 items-end">
                        <div 
                          className="flex-1 bg-green-500/50 rounded-t transition-all hover:bg-green-500/70"
                          style={{ height: `${Math.max(earnedHeight, 2)}%`, minHeight: month.earned > 0 ? '4px' : '0' }}
                          title={`Earned: ${formatCurrency(month.earned)}`}
                        />
                        <div 
                          className="flex-1 bg-emerald-500/50 rounded-t transition-all hover:bg-emerald-500/70"
                          style={{ height: `${Math.max(paidHeight, 2)}%`, minHeight: month.paid > 0 ? '4px' : '0' }}
                          title={`Paid: ${formatCurrency(month.paid)}`}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">{month.month.slice(-2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500/50" />
                <span className="text-xs text-slate-400">Earned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/50" />
                <span className="text-xs text-slate-400">Paid</span>
              </div>
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-6">Balance Breakdown</h2>
            <div className="space-y-6">
              {[
                { label: 'Pending Clearance', amount: balanceData.pending, color: 'bg-amber-500', desc: 'In 30-day clearance period' },
                { label: 'Cleared', amount: balanceData.cleared, color: 'bg-green-500', desc: 'Ready to be approved' },
                { label: 'Approved', amount: balanceData.approved, color: 'bg-emerald-500', desc: 'Waiting for payout batch' },
                { label: 'In Payout Batch', amount: balanceData.inBatch, color: 'bg-green-500', desc: 'Processing' },
              ].map((item, i) => {
                const percentage = totalBalance > 0 ? (item.amount / totalBalance * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.amount, balanceData.currency)}</p>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-6">Performance Metrics</h2>
            <div className="grid grid-cols-5 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-3xl font-bold text-green-400">{performance.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">Conversion Rate</p>
                <p className="text-xs text-slate-500">Referrals → Active</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-3xl font-bold text-emerald-400">{performance.retentionRate.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">Retention Rate</p>
                <p className="text-xs text-slate-500">After 3 months</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-3xl font-bold text-green-400">{formatCurrency(performance.averageRevenuePerReferral)}</p>
                <p className="text-sm text-slate-400 mt-1">Avg per Referral</p>
                <p className="text-xs text-slate-500">Revenue earned</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-3xl font-bold text-amber-400">{performance.newReferralsThisPeriod}</p>
                <p className="text-sm text-slate-400 mt-1">New Referrals</p>
                <p className="text-xs text-slate-500">This period</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className={`text-3xl font-bold ${performance.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(performance.growthRate)}
                </p>
                <p className="text-sm text-slate-400 mt-1">Growth Rate</p>
                <p className="text-xs text-slate-500">vs previous period</p>
              </div>
            </div>
          </div>
        )}

        {/* Commission Info */}
        <div className="mt-6 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Commission Agreement</h3>
              <p className="text-slate-400 text-sm">
                Your current commission rate: {' '}
                <span className="text-white font-semibold">
                  {dashboard.partner.currentAgreement 
                    ? `${(dashboard.partner.currentAgreement.commissionRate * 100).toFixed(0)}% ${dashboard.partner.currentAgreement.commissionType}`
                    : 'No active agreement'}
                </span>
              </p>
            </div>
            <div className="text-right text-sm text-slate-400">
              <p>Minimum payout: {formatCurrency(balanceData.minimumPayout)}</p>
              <p>Clearance period: 30 days</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
