'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Package, 
  Warehouse,
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Boxes,
  Tag,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react'

interface InventoryStats {
  totalProducts: number
  totalVariants: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
  locationCount: number
}

interface ProductSummary {
  id: string
  name: string
  sku: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  reorderPoint: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

interface LocationSummary {
  id: string
  name: string
  type: string
  productCount: number
  totalUnits: number
}

export default function InventoryDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<ProductSummary[]>([])
  const [locations, setLocations] = useState<LocationSummary[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchInventoryData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchInventoryData() {
    try {
      setRefreshing(true)
      
      // Fetch inventory stats
      const [statsRes, productsRes, locationsRes] = await Promise.all([
        fetch('/api/inventory?action=stats').catch(() => null),
        fetch('/api/inventory/products?lowStock=true&limit=10').catch(() => null),
        fetch('/api/inventory/locations?limit=5').catch(() => null),
      ])

      // Process stats
      if (statsRes?.ok) {
        const data = await statsRes.json()
        setStats(data.stats || {
          totalProducts: 0,
          totalVariants: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalValue: 0,
          locationCount: 0
        })
      } else {
        // Default stats if API not available
        setStats({
          totalProducts: 0,
          totalVariants: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalValue: 0,
          locationCount: 0
        })
      }

      // Process low stock products
      if (productsRes?.ok) {
        const data = await productsRes.json()
        setLowStockProducts(data.products || [])
      }

      // Process locations
      if (locationsRes?.ok) {
        const data = await locationsRes.json()
        setLocations(data.locations || [])
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch inventory data:', err)
      setError('Failed to load inventory data. Make sure the inventory module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  function getStockStatusColor(status: string) {
    switch (status) {
      case 'IN_STOCK': return 'bg-green-100 text-green-700'
      case 'LOW_STOCK': return 'bg-yellow-100 text-yellow-700'
      case 'OUT_OF_STOCK': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getStockStatusIcon(status: string) {
    switch (status) {
      case 'IN_STOCK': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'LOW_STOCK': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'OUT_OF_STOCK': return <XCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="inventory-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading inventory dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="inventory-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Inventory</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchInventoryData}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="inventory-dashboard">
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
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">Inventory & Warehouse</h1>
                  <p className="text-sm text-slate-500">Stock Management</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchInventoryData}
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
          {/* Total Products */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="total-products-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(stats?.totalProducts || 0)}</p>
            <p className="text-xs text-slate-400 mt-1">{stats?.totalVariants || 0} variants</p>
          </div>

          {/* Inventory Value */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="inventory-value-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats?.totalValue || 0)}</p>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="low-stock-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              {(stats?.lowStockCount || 0) > 0 && (
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                  Needs attention
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.lowStockCount || 0}</p>
          </div>

          {/* Out of Stock */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="out-of-stock-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats?.outOfStockCount || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="low-stock-alerts">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Low Stock Alerts</h2>
                <a 
                  href={`/dashboard/inventory/products?tenant=${tenantSlug}&filter=lowStock`}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{product.name}</p>
                          <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">{product.availableQuantity} units</p>
                        <div className="flex items-center gap-1 justify-end">
                          {getStockStatusIcon(product.status)}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStockStatusColor(product.status)}`}>
                            {product.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
                  <p>All products are well stocked!</p>
                </div>
              )}
            </div>
          </div>

          {/* Locations & Quick Actions */}
          <div className="space-y-6">
            {/* Locations */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="locations-card">
              <h2 className="font-semibold text-slate-800 mb-4">Warehouse Locations</h2>
              {locations.length > 0 ? (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{location.name}</p>
                          <p className="text-xs text-slate-500">{location.type}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-600">{location.totalUnits} units</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No locations configured</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Package, label: 'Add Product', href: `/dashboard/inventory/products/new?tenant=${tenantSlug}` },
                  { icon: Boxes, label: 'Stock Transfer', href: `/dashboard/inventory/transfers/new?tenant=${tenantSlug}` },
                  { icon: Tag, label: 'Stock Adjustment', href: `/dashboard/inventory/adjustments/new?tenant=${tenantSlug}` },
                  { icon: BarChart3, label: 'Inventory Report', href: `/dashboard/inventory/reports?tenant=${tenantSlug}` },
                  { icon: MapPin, label: 'Manage Locations', href: `/dashboard/inventory/locations?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-orange-600" />
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
