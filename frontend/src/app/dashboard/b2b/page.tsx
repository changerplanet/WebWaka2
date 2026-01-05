'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Building2, 
  ShoppingCart,
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  Percent
} from 'lucide-react'

interface B2BStats {
  totalClients: number
  activeOrders: number
  pendingQuotes: number
  monthlyRevenue: string
  avgOrderValue: string
  creditExtended: string
}

interface ClientSummary {
  id: string
  companyName: string
  contactName: string
  email: string
  creditLimit: string
  outstandingBalance: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  lastOrderDate: string
}

export default function B2BDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<B2BStats | null>(null)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchB2BData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchB2BData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        totalClients: 0,
        activeOrders: 0,
        pendingQuotes: 0,
        monthlyRevenue: '₦0',
        avgOrderValue: '₦0',
        creditExtended: '₦0'
      })
      setClients([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch B2B data:', err)
      setError('Failed to load B2B data. Make sure the B2B module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'SUSPENDED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="b2b-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading B2B dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="b2b-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load B2B</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchB2BData}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="b2b-dashboard">
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
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">B2B & Wholesale</h1>
                  <p className="text-sm text-slate-500">Business Sales</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchB2BData}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="total-clients-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Clients</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.totalClients || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="active-orders-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Orders</p>
            <p className="text-2xl font-bold text-green-600">{stats?.activeOrders || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="pending-quotes-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Pending Quotes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingQuotes || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="monthly-revenue-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Monthly Revenue</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.monthlyRevenue || '₦0'}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="clients-list">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Business Clients</h2>
                <a 
                  href={`/dashboard/b2b/clients?tenant=${tenantSlug}`}
                  className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{client.companyName}</p>
                          <p className="text-sm text-slate-500">{client.contactName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">Credit: {client.creditLimit}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No B2B clients yet</p>
                  <a 
                    href={`/dashboard/b2b/clients/new?tenant=${tenantSlug}`}
                    className="text-sm text-cyan-600 hover:text-cyan-700 mt-2 inline-block"
                  >
                    Add your first client →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="credit-stats-card">
              <h2 className="font-semibold text-slate-800 mb-4">Credit Overview</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Avg Order Value</span>
                  <span className="font-semibold text-slate-800">{stats?.avgOrderValue || '₦0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Credit Extended</span>
                  <span className="font-semibold text-slate-800">{stats?.creditExtended || '₦0'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Building2, label: 'Add Client', href: `/dashboard/b2b/clients/new?tenant=${tenantSlug}` },
                  { icon: FileText, label: 'Create Quote', href: `/dashboard/b2b/quotes/new?tenant=${tenantSlug}` },
                  { icon: ShoppingCart, label: 'New Order', href: `/dashboard/b2b/orders/new?tenant=${tenantSlug}` },
                  { icon: Percent, label: 'Price Lists', href: `/dashboard/b2b/pricing?tenant=${tenantSlug}` },
                  { icon: DollarSign, label: 'Credit Terms', href: `/dashboard/b2b/credit?tenant=${tenantSlug}` },
                  { icon: Package, label: 'Bulk Catalog', href: `/dashboard/b2b/catalog?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-cyan-600" />
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
