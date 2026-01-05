'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Truck, 
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Route,
  Calendar,
  BarChart3
} from 'lucide-react'

interface LogisticsStats {
  activeDeliveries: number
  completedToday: number
  pendingPickup: number
  delayedOrders: number
  totalDrivers: number
  averageDeliveryTime: string
}

interface DeliveryItem {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
  customerName: string
  destination: string
  estimatedTime: string
  driverName: string | null
}

export default function LogisticsDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LogisticsStats | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchLogisticsData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchLogisticsData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        activeDeliveries: 0,
        completedToday: 0,
        pendingPickup: 0,
        delayedOrders: 0,
        totalDrivers: 0,
        averageDeliveryTime: '0 mins'
      })
      setDeliveries([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch logistics data:', err)
      setError('Failed to load logistics data. Make sure the logistics module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-700'
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700'
      case 'PICKED_UP': return 'bg-indigo-100 text-indigo-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'FAILED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'DELIVERED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'IN_TRANSIT': return <Truck className="w-4 h-4 text-blue-500" />
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="logistics-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading logistics dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="logistics-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Logistics</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchLogisticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="logistics-dashboard">
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
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">Logistics & Delivery</h1>
                  <p className="text-sm text-slate-500">Fleet Management</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchLogisticsData}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="active-deliveries-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Deliveries</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.activeDeliveries || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="completed-today-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Completed Today</p>
            <p className="text-2xl font-bold text-green-600">{stats?.completedToday || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="pending-pickup-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Pending Pickup</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingPickup || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="delayed-orders-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Delayed Orders</p>
            <p className="text-2xl font-bold text-red-600">{stats?.delayedOrders || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Deliveries */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="recent-deliveries">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Recent Deliveries</h2>
                <a 
                  href={`/dashboard/logistics/deliveries?tenant=${tenantSlug}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {deliveries.length > 0 ? (
                deliveries.map((delivery) => (
                  <div key={delivery.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getStatusIcon(delivery.status)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{delivery.orderNumber}</p>
                          <p className="text-sm text-slate-500">{delivery.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(delivery.status)}`}>
                          {delivery.status.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{delivery.estimatedTime}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No active deliveries</p>
                  <p className="text-sm text-slate-400 mt-1">Deliveries will appear here when orders are dispatched</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="driver-stats-card">
              <h2 className="font-semibold text-slate-800 mb-4">Fleet Overview</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-slate-700">Total Drivers</span>
                  </div>
                  <span className="font-semibold text-slate-800">{stats?.totalDrivers || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-slate-700">Avg. Delivery Time</span>
                  </div>
                  <span className="font-semibold text-slate-800">{stats?.averageDeliveryTime || '0 mins'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Truck, label: 'New Delivery', href: `/dashboard/logistics/deliveries/new?tenant=${tenantSlug}` },
                  { icon: Users, label: 'Manage Drivers', href: `/dashboard/logistics/drivers?tenant=${tenantSlug}` },
                  { icon: Route, label: 'Route Planning', href: `/dashboard/logistics/routes?tenant=${tenantSlug}` },
                  { icon: MapPin, label: 'Delivery Zones', href: `/dashboard/logistics/zones?tenant=${tenantSlug}` },
                  { icon: BarChart3, label: 'Delivery Reports', href: `/dashboard/logistics/reports?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
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
