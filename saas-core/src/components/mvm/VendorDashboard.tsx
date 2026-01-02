'use client'

import { useMVM } from './MVMProvider'
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Clock,
  ArrowUpRight,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

// ============================================================================
// METRIC CARD
// ============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: any
  iconBg: string
  iconColor: string
  prefix?: string
  suffix?: string
}

function MetricCard({ title, value, change, icon: Icon, iconBg, iconColor, prefix = '', suffix = '' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  )
}

// ============================================================================
// VENDOR DASHBOARD
// ============================================================================

export function VendorDashboard() {
  const { vendor, dashboard, isLoadingDashboard, orders, fetchOrders } = useMVM()

  if (isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Unable to load dashboard</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    APPROVED: 'bg-emerald-100 text-emerald-700',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-6" data-testid="vendor-dashboard">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, {vendor?.name || 'Vendor'}</h1>
            <p className="text-indigo-200">Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[dashboard.vendorStatus] || 'bg-slate-100 text-slate-700'}`}>
              {dashboard.vendorStatus.replace('_', ' ')}
            </span>
            {dashboard.tierName && (
              <span className="px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-sm font-medium">
                {dashboard.tierName} Tier
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sales"
          value={dashboard.metrics.totalSales.toFixed(2)}
          prefix="$"
          change={dashboard.comparison.salesChange}
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Total Orders"
          value={dashboard.metrics.totalOrders}
          change={dashboard.comparison.ordersChange}
          icon={ShoppingBag}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Pending Orders"
          value={dashboard.metrics.pendingOrders}
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <MetricCard
          title="Avg. Rating"
          value={dashboard.metrics.averageRating?.toFixed(1) || 'N/A'}
          suffix={dashboard.metrics.averageRating ? ' ★' : ''}
          icon={Star}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Earnings & Commission */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Earnings Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Earnings Overview</h2>
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div>
                <p className="text-sm text-emerald-600">Pending Payout</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ${dashboard.earnings.pendingPayout.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Last Payout</p>
                <p className="text-lg font-semibold text-slate-900">
                  {dashboard.earnings.lastPayoutAmount 
                    ? `$${dashboard.earnings.lastPayoutAmount.toFixed(2)}`
                    : 'N/A'
                  }
                </p>
                {dashboard.earnings.lastPayoutDate && (
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(dashboard.earnings.lastPayoutDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Lifetime Earnings</p>
                <p className="text-lg font-semibold text-slate-900">
                  ${dashboard.earnings.lifetimeEarnings.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              <span className="text-indigo-700">
                Commission rate: <strong>{dashboard.commissionRate}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            <button 
              onClick={() => fetchOrders()}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboard.recentOrders.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No orders yet</p>
            ) : (
              dashboard.recentOrders.slice(0, 4).map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{order.orderNumber}</p>
                    <p className="text-sm text-slate-500">{order.customerName || 'Guest'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${order.subtotal.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Top Products</h2>
          <Package className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium text-right">Price</th>
                <th className="pb-3 font-medium text-right">Sales</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-8">
                    No products mapped yet
                  </td>
                </tr>
              ) : (
                dashboard.topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{product.productName}</p>
                    </td>
                    <td className="py-3 text-slate-500 text-sm">{product.productSku}</td>
                    <td className="py-3 text-right text-slate-900">${product.price?.toFixed(2)}</td>
                    <td className="py-3 text-right text-slate-900">{product.salesCount}</td>
                    <td className="py-3 text-right font-medium text-emerald-600">
                      ${product.revenue?.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      {product.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <AlertCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
