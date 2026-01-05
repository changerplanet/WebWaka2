'use client'

/**
 * GLOBAL FINANCIAL OVERSIGHT DASHBOARD
 * 
 * Read-only financial overview for Super Admins.
 * Shows aggregate platform economics without operational capabilities.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, TrendingUp, Users, CreditCard, ArrowLeft, Loader2,
  RefreshCw, PieChart, BarChart3, Building2, Receipt, Clock,
  CheckCircle, AlertCircle
} from 'lucide-react'

interface FinancialData {
  overview: {
    timestamp: string
    period: string
  }
  subscriptions: {
    total: number
    active: number
    trialing: number
    byStatus: Record<string, number>
  }
  instanceSubscriptions: {
    total: number
    active: number
    byPlan: { planId: string; count: number; totalAmount: number }[]
  }
  revenue: {
    activeSubscriptionRevenue: number
    wholesaleCosts: number
    partnerMargins: number
    activeSubscriptionCount: number
  }
  partnerEarnings: {
    total: { amount: number; count: number }
    pending: { amount: number; count: number }
    cleared: { amount: number; count: number }
    paid: { amount: number; count: number }
  }
  invoices: {
    total: number
    paid: number
    pending: number
    paidRevenue: number
  }
  trends: {
    recentEvents: Record<string, number>
  }
  topPartners: {
    partnerId: string
    partnerName: string
    totalEarnings: number
    earningCount: number
  }[]
}

export default function FinancialDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FinancialData | null>(null)

  useEffect(() => {
    loadFinancials()
  }, [])

  async function loadFinancials() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/financials')
      const result = await res.json()

      if (result.success) {
        setData(result)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Financial Overview</h1>
                <p className="text-slate-400">Platform-wide financial metrics (read-only)</p>
              </div>
            </div>
            <button
              onClick={loadFinancials}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              data-testid="refresh-financials"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Read-Only Notice */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-200 font-medium">Read-Only Dashboard</p>
            <p className="text-slate-400 text-sm">
              This dashboard provides oversight only. No billing, payout, or pricing operations are available here.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-200">
            {error}
          </div>
        </div>
      )}

      {data && (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(data.revenue.activeSubscriptionRevenue)}
                  </p>
                  <p className="text-sm text-slate-400">Active MRR</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.subscriptions.active}</p>
                  <p className="text-sm text-slate-400">Active Subscriptions</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {formatCurrency(data.partnerEarnings.total.amount)}
                  </p>
                  <p className="text-sm text-slate-400">Total Partner Earnings</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(data.invoices.paidRevenue)}</p>
                  <p className="text-sm text-slate-400">Invoice Revenue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Subscription Status */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-400" />
                Subscription Status
              </h3>
              <div className="space-y-3">
                {Object.entries(data.subscriptions.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'ACTIVE' ? 'bg-green-400' :
                        status === 'TRIALING' ? 'bg-blue-400' :
                        status === 'CANCELLED' ? 'bg-red-400' :
                        status === 'PAST_DUE' ? 'bg-amber-400' : 'bg-slate-400'
                      }`} />
                      <span className="text-slate-300 text-sm">{status}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Partner Earnings Breakdown */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Partner Earnings Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-sm">Pending</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-400">
                      {formatCurrency(data.partnerEarnings.pending.amount)}
                    </span>
                    <span className="text-slate-500 text-sm ml-2">
                      ({data.partnerEarnings.pending.count})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Cleared</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-400">
                      {formatCurrency(data.partnerEarnings.cleared.amount)}
                    </span>
                    <span className="text-slate-500 text-sm ml-2">
                      ({data.partnerEarnings.cleared.count})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300 text-sm">Paid</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-400">
                      {formatCurrency(data.partnerEarnings.paid.amount)}
                    </span>
                    <span className="text-slate-500 text-sm ml-2">
                      ({data.partnerEarnings.paid.count})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Status */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                Invoice Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Total Invoices</span>
                  <span className="font-bold">{data.invoices.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Paid</span>
                  <span className="font-bold text-green-400">{data.invoices.paid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Pending</span>
                  <span className="font-bold text-amber-400">{data.invoices.pending}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Revenue Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Client Subscription Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(data.revenue.activeSubscriptionRevenue)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  From {data.revenue.activeSubscriptionCount} active subscriptions
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Wholesale Costs</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(data.revenue.wholesaleCosts)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Platform operational costs</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Partner Margins</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(data.revenue.partnerMargins)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Retained by partners</p>
              </div>
            </div>
          </div>

          {/* Top Partners */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Top Partners by Earnings
            </h3>
            {data.topPartners.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No partner earnings yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                      <th className="pb-3">Rank</th>
                      <th className="pb-3">Partner</th>
                      <th className="pb-3 text-right">Transactions</th>
                      <th className="pb-3 text-right">Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {data.topPartners.map((partner, index) => (
                      <tr key={partner.partnerId}>
                        <td className="py-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-amber-500 text-black' :
                            index === 1 ? 'bg-slate-400 text-black' :
                            index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 font-medium">{partner.partnerName}</td>
                        <td className="py-3 text-right text-slate-400">{partner.earningCount}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">
                          {formatCurrency(partner.totalEarnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
