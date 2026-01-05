'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  FileText,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  Truck,
  BarChart3,
  Plus,
  RefreshCw,
} from 'lucide-react'

interface ProcurementStats {
  purchaseRequests: {
    pending: number
    approved: number
    total: number
  }
  purchaseOrders: {
    draft: number
    pending: number
    confirmed: number
    partiallyReceived: number
    totalValue: number
  }
  goodsReceipts: {
    pendingVerification: number
    last30Days: number
  }
  suppliers: {
    active: number
    topPerformers: Array<{
      supplierId: string
      supplierName: string
      overallScore: number
      onTimeRate: number
    }>
  }
}

export default function ProcurementDashboard() {
  const [stats, setStats] = useState<ProcurementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch all procurement statistics in parallel
      const [prStats, poStats, grStats, supplierStats] = await Promise.all([
        fetch('/api/procurement/requests?statistics=true').then(r => r.json()).catch(() => ({})),
        fetch('/api/procurement/orders?statistics=true').then(r => r.json()).catch(() => ({})),
        fetch('/api/procurement/receipts?statistics=true').then(r => r.json()).catch(() => ({})),
        fetch('/api/procurement/suppliers?top=true&limit=5').then(r => r.json()).catch(() => ({ suppliers: [] })),
      ])

      // Calculate totals from status counts
      const prPending = prStats.byStatus?.SUBMITTED || 0
      const prApproved = prStats.byStatus?.APPROVED || 0
      const prTotal = Object.values(prStats.byStatus || {}).reduce((a: number, b: unknown) => a + (b as number), 0) as number

      const poDraft = poStats.byStatus?.find((s: { status: string }) => s.status === 'DRAFT')?.count || 0
      const poPending = poStats.byStatus?.find((s: { status: string }) => s.status === 'PENDING')?.count || 0
      const poConfirmed = poStats.byStatus?.find((s: { status: string }) => s.status === 'CONFIRMED')?.count || 0
      const poPartial = poStats.byStatus?.find((s: { status: string }) => s.status === 'PARTIALLY_RECEIVED')?.count || 0
      const poValue = poStats.pendingValue || 0

      setStats({
        purchaseRequests: {
          pending: prPending,
          approved: prApproved,
          total: prTotal,
        },
        purchaseOrders: {
          draft: poDraft,
          pending: poPending,
          confirmed: poConfirmed,
          partiallyReceived: poPartial,
          totalValue: poValue,
        },
        goodsReceipts: {
          pendingVerification: grStats.byStatus?.PENDING || 0,
          last30Days: grStats.receiptsLast30Days || 0,
        },
        suppliers: {
          active: poStats.activeSuppliers || 0,
          topPerformers: supplierStats.suppliers || [],
        },
      })
      setError(null)
    } catch (err) {
      setError('Failed to load procurement data')
      console.error('Error fetching procurement stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" data-testid="procurement-dashboard-loading">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" data-testid="procurement-dashboard-error">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertTriangle className="inline-block mr-2" size={20} />
          {error}
          <button 
            onClick={fetchStats}
            className="ml-4 text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="procurement-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Procurement Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor purchase requests, orders, and supplier performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="refresh-btn"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pending PRs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="pending-pr-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats?.purchaseRequests.pending || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
          </div>

          {/* Active POs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="active-po-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Orders</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {(stats?.purchaseOrders.pending || 0) + (stats?.purchaseOrders.confirmed || 0) + (stats?.purchaseOrders.partiallyReceived || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">In progress</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Pending Receipts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="pending-receipts-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Verification</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats?.goodsReceipts.pendingVerification || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Goods receipts</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Package className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Outstanding Value */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="outstanding-value-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Outstanding Value</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats?.purchaseOrders.totalValue || 0)}</p>
                <p className="text-xs text-gray-400 mt-1">Pending delivery</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Order Pipeline */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="po-pipeline">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-500" />
              Purchase Order Pipeline
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats?.purchaseOrders.draft || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Draft</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{stats?.purchaseOrders.pending || 0}</div>
                <div className="text-xs text-amber-600 mt-1">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.purchaseOrders.confirmed || 0}</div>
                <div className="text-xs text-blue-600 mt-1">Confirmed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.purchaseOrders.partiallyReceived || 0}</div>
                <div className="text-xs text-green-600 mt-1">Receiving</div>
              </div>
            </div>

            {/* Purchase Requests Summary */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Purchase Requests</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Pending: {stats?.purchaseRequests.pending || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Approved: {stats?.purchaseRequests.approved || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total: {stats?.purchaseRequests.total || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="top-suppliers">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-gray-500" />
              Top Suppliers
            </h2>
            {stats?.suppliers.topPerformers && stats.suppliers.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {stats.suppliers.topPerformers.slice(0, 5).map((supplier, index) => (
                  <div key={supplier.supplierId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{supplier.supplierName}</p>
                        <p className="text-xs text-gray-500">On-time: {supplier.onTimeRate?.toFixed(0) || 0}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        (supplier.overallScore || 0) >= 80 ? 'text-green-600' : 
                        (supplier.overallScore || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {supplier.overallScore?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No supplier performance data yet</p>
                <p className="text-xs mt-1">Complete some purchase orders to see rankings</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="quick-actions">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-gray-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              data-testid="new-pr-btn"
            >
              <Plus size={24} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">New PR</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              data-testid="new-po-btn"
            >
              <ShoppingCart size={24} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">New PO</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              data-testid="receive-goods-btn"
            >
              <Truck size={24} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Receive Goods</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
              data-testid="view-suppliers-btn"
            >
              <Users size={24} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Suppliers</span>
            </button>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-testid="activity-summary">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Goods Received (30 days)</span>
                <span className="font-semibold text-gray-900">{stats?.goodsReceipts.last30Days || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Suppliers</span>
                <span className="font-semibold text-gray-900">{stats?.suppliers.active || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Purchase Requests</span>
                <span className="font-semibold text-gray-900">{stats?.purchaseRequests.total || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white" data-testid="nigeria-first-card">
            <h2 className="text-lg font-semibold mb-2">Nigeria-First Procurement</h2>
            <p className="text-sm text-emerald-100 mb-4">
              Optimized for Nigerian businesses with cash purchases, informal suppliers, and offline support.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle size={16} />
                <span>NGN Default</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={16} />
                <span>Cash Support</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={16} />
                <span>Offline Ready</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
