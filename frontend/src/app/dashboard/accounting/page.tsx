'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  FileText, 
  Calendar,
  PieChart,
  BarChart3,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react'

interface DashboardMetrics {
  cashBalance: string
  recentExpenses: ExpenseSummary[]
  vatPayable: string
  vatRefundable: string
  monthlyExpenseTotal: string
  pendingExpenses: number
  currentPeriod: PeriodInfo | null
}

interface ExpenseSummary {
  id: string
  expenseNumber: string
  description: string
  amount: string
  status: string
  expenseDate: string
  categoryName: string | null
}

interface PeriodInfo {
  code: string
  name: string
  status: string
}

export default function AccountingDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchDashboardData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchDashboardData() {
    try {
      setRefreshing(true)
      
      // Fetch multiple endpoints in parallel
      const [ledgerRes, expensesRes, periodsRes, vatRes] = await Promise.all([
        fetch('/api/accounting/ledger/accounts?hasActivity=true'),
        fetch('/api/accounting/expenses?limit=5&status=POSTED'),
        fetch('/api/accounting/periods'),
        fetch(`/api/accounting/tax?action=vat-summary&periodCode=${getCurrentPeriodCode()}`),
      ])

      // Process ledger accounts for cash balance
      let cashBalance = '0.00'
      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json()
        const cashAccounts = ledgerData.accounts?.filter((a: { code: string }) => 
          ['1110', '1120', '1130'].includes(a.code)
        ) || []
        const totalCash = cashAccounts.reduce((sum: number, a: { currentBalance: string }) => 
          sum + parseFloat(a.currentBalance || '0'), 0)
        cashBalance = totalCash.toFixed(2)
      }

      // Process recent expenses
      let recentExpenses: ExpenseSummary[] = []
      let pendingExpenses = 0
      let monthlyExpenseTotal = '0.00'
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        recentExpenses = expensesData.expenses?.slice(0, 5) || []
        
        // Get pending count
        const pendingRes = await fetch('/api/accounting/expenses?status=SUBMITTED')
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          pendingExpenses = pendingData.total || 0
        }
        
        // Get monthly total
        const summaryRes = await fetch('/api/accounting/expenses/summary?groupBy=category')
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json()
          monthlyExpenseTotal = summaryData.grandTotal || '0.00'
        }
      }

      // Process current period
      let currentPeriod: PeriodInfo | null = null
      if (periodsRes.ok) {
        const periodsData = await periodsRes.json()
        currentPeriod = periodsData.currentPeriod || null
      }

      // Process VAT
      let vatPayable = '0.00'
      let vatRefundable = '0.00'
      if (vatRes.ok) {
        const vatData = await vatRes.json()
        vatPayable = vatData.vatPayable || '0.00'
        vatRefundable = vatData.vatRefundable || '0.00'
      }

      setMetrics({
        cashBalance,
        recentExpenses,
        vatPayable,
        vatRefundable,
        monthlyExpenseTotal,
        pendingExpenses,
        currentPeriod,
      })
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load accounting data. Make sure the accounting module is initialized.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getCurrentPeriodCode() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  function formatCurrency(amount: string) {
    const num = parseFloat(amount)
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(num)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'POSTED': return 'bg-green-100 text-green-700'
      case 'APPROVED': return 'bg-blue-100 text-blue-700'
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-700'
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      case 'REJECTED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="accounting-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading accounting dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="accounting-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Dashboard</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="accounting-dashboard">
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
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">Accounting Dashboard</h1>
                  <p className="text-sm text-slate-500">
                    {metrics?.currentPeriod?.name || 'Current Period'}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchDashboardData}
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
          {/* Cash Balance */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="cash-balance-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Cash & Bank
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Cash Balance</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics?.cashBalance || '0')}</p>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="monthly-expenses-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-amber-600" />
              </div>
              {(metrics?.pendingExpenses || 0) > 0 && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  {metrics?.pendingExpenses} pending
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">Monthly Expenses</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics?.monthlyExpenseTotal || '0')}</p>
          </div>

          {/* VAT Payable */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="vat-payable-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">VAT 7.5%</span>
            </div>
            <p className="text-sm text-slate-500 mb-1">VAT Payable</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.vatPayable || '0')}</p>
          </div>

          {/* VAT Refundable */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="vat-refundable-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">Input VAT</span>
            </div>
            <p className="text-sm text-slate-500 mb-1">VAT Refundable</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.vatRefundable || '0')}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Expenses */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="recent-expenses-card">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Recent Expenses</h2>
                <a 
                  href={`/dashboard/accounting/expenses?tenant=${tenantSlug}`}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {(metrics?.recentExpenses?.length || 0) > 0 ? (
                metrics?.recentExpenses?.map((expense) => (
                  <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{expense.description}</p>
                          <p className="text-sm text-slate-500">
                            {expense.categoryName || expense.expenseNumber} • {new Date(expense.expenseDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">{formatCurrency(expense.amount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No expenses recorded yet</p>
                  <a 
                    href={`/dashboard/accounting/expenses/new?tenant=${tenantSlug}`}
                    className="text-sm text-green-600 hover:text-green-700 mt-2 inline-block"
                  >
                    Record your first expense →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Period Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="period-status-card">
              <h2 className="font-semibold text-slate-800 mb-4">Current Period</h2>
              {metrics?.currentPeriod ? (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    metrics.currentPeriod.status === 'OPEN' ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    {metrics.currentPeriod.status === 'OPEN' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{metrics.currentPeriod.name}</p>
                    <p className={`text-sm ${
                      metrics.currentPeriod.status === 'OPEN' ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {metrics.currentPeriod.status}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No active period</p>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Receipt, label: 'New Expense', href: `/dashboard/accounting/expenses/new?tenant=${tenantSlug}` },
                  { icon: FileText, label: 'Journal Entry', href: `/dashboard/accounting/journals/new?tenant=${tenantSlug}` },
                  { icon: PieChart, label: 'P&L Report', href: `/dashboard/accounting/reports?type=profit-loss&tenant=${tenantSlug}` },
                  { icon: BarChart3, label: 'Balance Sheet', href: `/dashboard/accounting/reports?type=balance-sheet&tenant=${tenantSlug}` },
                  { icon: Calendar, label: 'VAT Summary', href: `/dashboard/accounting/tax?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-green-600" />
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
