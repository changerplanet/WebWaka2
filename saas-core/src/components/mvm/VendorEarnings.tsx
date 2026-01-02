'use client'

import { useEffect, useState } from 'react'
import { useMVM, Commission } from './MVMProvider'
import { 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  Calendar
} from 'lucide-react'

// ============================================================================
// COMMISSION STATUS BADGE
// ============================================================================

function CommissionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2 },
    PAID: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  }
  
  const { bg, text, icon: Icon } = config[status] || config.PENDING
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}

// ============================================================================
// EARNINGS/COMMISSION VIEW
// ============================================================================

export function VendorEarningsView() {
  const { commissions, isLoadingCommissions, pendingEarnings, fetchCommissions, dashboard } = useMVM()
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  const totalEarnings = commissions.reduce((sum, c) => sum + c.vendorPayout, 0)
  const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0)
  const paidEarnings = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.vendorPayout, 0)
  const processingEarnings = commissions
    .filter(c => c.status === 'PROCESSING')
    .reduce((sum, c) => sum + c.vendorPayout, 0)

  const periods = [
    { key: 'all', label: 'All Time' },
    { key: 'month', label: 'This Month' },
    { key: 'week', label: 'This Week' },
  ]

  return (
    <div className="space-y-6" data-testid="vendor-earnings">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
          <p className="text-slate-500">Track your revenue and commissions</p>
        </div>
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-emerald-200" />
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
          <p className="text-emerald-200 text-sm mt-1">Total Earnings</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">${pendingEarnings.toFixed(2)}</p>
          <p className="text-slate-500 text-sm mt-1">Pending Payout</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">${processingEarnings.toFixed(2)}</p>
          <p className="text-slate-500 text-sm mt-1">Processing</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">${paidEarnings.toFixed(2)}</p>
          <p className="text-slate-500 text-sm mt-1">Paid Out</p>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Commission History</h2>
          
          {isLoadingCommissions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No commission records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium text-right">Sale Amount</th>
                    <th className="pb-3 font-medium text-right">Commission</th>
                    <th className="pb-3 font-medium text-right">Your Payout</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr 
                      key={commission.id} 
                      className="border-b border-slate-100 last:border-0"
                      data-testid={`commission-row-${commission.id}`}
                    >
                      <td className="py-3">
                        <p className="font-medium text-slate-900 text-sm">{commission.subOrderId}</p>
                      </td>
                      <td className="py-3 text-right text-slate-900">
                        ${commission.saleAmount.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-red-600">
                        -${commission.commissionAmount.toFixed(2)}
                        <span className="text-xs text-slate-400 ml-1">({commission.commissionRate}%)</span>
                      </td>
                      <td className="py-3 text-right font-medium text-emerald-600">
                        ${commission.vendorPayout.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <CommissionStatusBadge status={commission.status} />
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {new Date(commission.calculatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Commission Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Sales</span>
                <span className="font-semibold text-slate-900">
                  ${(totalEarnings + totalCommissions).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Platform Commission</span>
                <span className="font-semibold text-red-600">
                  -${totalCommissions.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-900">Your Earnings</span>
                <span className="font-bold text-emerald-600">
                  ${totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700">
                <strong>Commission Rate:</strong> {dashboard?.commissionRate || 15}%
              </p>
            </div>
          </div>

          {/* Payout Info */}
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Payouts (Read-Only)</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Payouts are processed by marketplace administrators. 
                  You will receive funds according to the payout schedule.
                </p>
              </div>
            </div>
          </div>

          {dashboard?.earnings.lastPayoutDate && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Last Payout</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    ${dashboard.earnings.lastPayoutAmount?.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(dashboard.earnings.lastPayoutDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
