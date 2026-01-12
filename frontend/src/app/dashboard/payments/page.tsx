'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Users,
  Briefcase,
  ChevronRight,
  Calendar,
  Activity,
  Banknote,
} from 'lucide-react'

interface WalletInfo {
  id: string
  walletNumber: string
  name: string | null
  ownerType: string
  balance: number
  pendingBalance: number
  totalBalance: number
  status: string
  currency: string
}

interface PaymentStats {
  byStatus: Record<string, { count: number; amount: number }>
  byMethod: Record<string, { count: number; amount: number }>
  totals: {
    count: number
    totalAmount: number
    netAmount: number
    platformFees: number
  }
  dailyVolume: Array<{ date: string; volume: number }>
}

interface RefundStats {
  byStatus: Record<string, { count: number; amount: number }>
  totals: { count: number; totalRefunded: number }
}

interface PaymentTransaction {
  id: string
  transactionNumber: string
  amount: number
  currency: string
  paymentMethod: string
  status: string
  orderId: string | null
  orderNumber: string | null
  confirmedAt: string | null
  createdAt: string
}

interface Refund {
  id: string
  refundNumber: string
  amount: number
  reason: string
  status: string
  createdAt: string
}

export default function PaymentsDashboard() {
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null)
  const [refundStats, setRefundStats] = useState<RefundStats | null>(null)
  const [pendingRefunds, setPendingRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [dateRange] = useState(30)

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const initializeAndFetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check status first
      const statusRes = await fetch('/api/payments?action=status')
      const statusData = await statusRes.json()

      if (!statusData.initialized) {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'initialize' }),
        })
        setInitialized(true)
      } else {
        setInitialized(true)
      }

      // Fetch all data in parallel
      const [walletsRes, paymentsRes, statsRes, refundStatsRes, refundsRes] = await Promise.all([
        fetch('/api/payments?action=wallets&limit=10').then(r => r.json()).catch(() => ({ wallets: [] })),
        fetch('/api/payments?action=payments&limit=10').then(r => r.json()).catch(() => ({ payments: [] })),
        fetch(`/api/payments?action=payment-statistics&days=${dateRange}`).then(r => r.json()).catch(() => null),
        fetch('/api/payments?action=refund-statistics').then(r => r.json()).catch(() => null),
        fetch('/api/payments?action=refunds&limit=5').then(r => r.json()).catch(() => ({ refunds: [] })),
      ])

      setWallets(walletsRes.wallets || [])
      setPayments(paymentsRes.payments || [])
      setPaymentStats(statsRes?.statistics || null)
      setRefundStats(refundStatsRes?.statistics || null)
      setPendingRefunds((refundsRes.refunds || []).filter((r: Refund) => ['PENDING', 'APPROVED'].includes(r.status)))
    } catch (err) {
      setError('Failed to load payments data')
      console.error('Payments error:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    initializeAndFetch()
  }, [initializeAndFetch])
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      FAILED: 'bg-red-100 text-red-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-700',
      SUSPENDED: 'bg-orange-100 text-orange-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'FAILED':
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getWalletIcon = (ownerType: string) => {
    switch (ownerType) {
      case 'BUSINESS':
        return <Building2 className="h-5 w-5" />
      case 'VENDOR':
        return <Briefcase className="h-5 w-5" />
      case 'CUSTOMER':
        return <Users className="h-5 w-5" />
      case 'PLATFORM':
        return <DollarSign className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'Cash',
      CARD: 'Card',
      BANK_TRANSFER: 'Bank Transfer',
      MOBILE_MONEY: 'Mobile Money',
      POS_TERMINAL: 'POS',
      WALLET: 'Wallet',
    }
    return labels[method] || method
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    )
  }

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
  const totalPending = wallets.reduce((sum, w) => sum + w.pendingBalance, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="payments-dashboard">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments & Wallets</h1>
            <p className="text-gray-500 mt-1">Your authoritative money layer</p>
          </div>
          <button
            onClick={initializeAndFetch}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            data-testid="refresh-btn"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="summary-cards">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {wallets.filter(w => w.status === 'ACTIVE').length} active
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Balance</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          {totalPending > 0 && (
            <p className="text-xs text-gray-400 mt-1">+ {formatCurrency(totalPending)} pending</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Last {dateRange} days</span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Volume</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(paymentStats?.totals.totalAmount || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {paymentStats?.totals.count || 0} transactions
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Net Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(paymentStats?.totals.netAmount || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Fees: {formatCurrency(paymentStats?.totals.platformFees || 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-orange-600" />
            </div>
            {pendingRefunds.length > 0 && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {pendingRefunds.length} pending
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Refunded</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(refundStats?.totals.totalRefunded || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {refundStats?.totals.count || 0} refunds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Wallets */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="wallets-list">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Wallets</h3>
            </div>
            <span className="text-xs text-gray-500">{wallets.length} total</span>
          </div>
          {wallets.length > 0 ? (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      wallet.ownerType === 'BUSINESS' ? 'bg-emerald-100 text-emerald-600' :
                      wallet.ownerType === 'PLATFORM' ? 'bg-purple-100 text-purple-600' :
                      wallet.ownerType === 'VENDOR' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getWalletIcon(wallet.ownerType)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {wallet.name || wallet.walletNumber}
                      </p>
                      <p className="text-xs text-gray-500">{wallet.ownerType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(wallet.balance, wallet.currency)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(wallet.status)}`}>
                      {wallet.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No wallets yet</p>
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="payment-methods">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Payment Methods</h3>
          </div>
          {paymentStats?.byMethod && Object.keys(paymentStats.byMethod).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(paymentStats.byMethod).map(([method, data]) => {
                const total = Object.values(paymentStats.byMethod).reduce((sum, d) => sum + d.amount, 0)
                const percent = total > 0 ? (data.amount / total) * 100 : 0
                const colors: Record<string, string> = {
                  CASH: 'bg-green-500',
                  CARD: 'bg-blue-500',
                  BANK_TRANSFER: 'bg-purple-500',
                  MOBILE_MONEY: 'bg-orange-500',
                  POS_TERMINAL: 'bg-indigo-500',
                  WALLET: 'bg-emerald-500',
                }
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{getPaymentMethodLabel(method)}</span>
                      <span className="font-medium">{formatCurrency(data.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[method] || 'bg-gray-500'} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{data.count} transactions</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No payment data yet</p>
            </div>
          )}
        </div>

        {/* Pending Refunds */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="pending-refunds">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Pending Refunds</h3>
            </div>
            {pendingRefunds.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {pendingRefunds.length} pending
              </span>
            )}
          </div>
          {pendingRefunds.length > 0 ? (
            <div className="space-y-3">
              {pendingRefunds.map((refund) => (
                <div
                  key={refund.id}
                  className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{refund.refundNumber}</p>
                    <p className="text-xs text-gray-500">{refund.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{formatCurrency(refund.amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(refund.status)}`}>
                      {refund.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No pending refunds</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8" data-testid="recent-transactions">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <span className="text-xs text-gray-500">{payments.length} shown</span>
        </div>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Transaction</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Method</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Order</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Amount</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-mono text-xs">{payment.transactionNumber}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="flex items-center gap-1">
                        {payment.paymentMethod === 'CASH' ? (
                          <Banknote className="h-4 w-4 text-green-500" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-blue-500" />
                        )}
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {payment.orderNumber || payment.orderId || '-'}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(payment.status)}
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-500 text-xs">
                      {formatDate(payment.confirmedAt || payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Nigeria-First Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6" data-testid="nigeria-first-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900 mb-2">Nigeria-First Money Layer</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Cash Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">NGN Default</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Offline Recording</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Ledger-First</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
