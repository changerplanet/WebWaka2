'use client'

import { useEffect, useState } from 'react'
import { useMVM, OrderStatus, VendorOrder } from './MVMProvider'
import { 
  Search, 
  Filter, 
  Eye,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  Loader2,
  ChevronDown,
  X
} from 'lucide-react'

// ============================================================================
// ORDER STATUS BADGE
// ============================================================================

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { bg: string; text: string; icon: any }> = {
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
    PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Package },
    SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Truck },
    DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  }
  
  const { bg, text, icon: Icon } = config[status]
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}

// ============================================================================
// ORDER DETAIL MODAL
// ============================================================================

function OrderDetailModal({ order, onClose }: { order: VendorOrder; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Order Number</p>
                <p className="text-xl font-bold text-slate-900">{order.orderNumber}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-500">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Customer Info */}
          {(order.customerName || order.customerEmail) && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-medium text-slate-900 mb-2">Customer</h3>
              {order.customerName && <p className="text-slate-700">{order.customerName}</p>}
              {order.customerEmail && <p className="text-sm text-slate-500">{order.customerEmail}</p>}
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    {item.variantName && <p className="text-sm text-slate-500">{item.variantName}</p>}
                    <p className="text-sm text-slate-500">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <p className="font-medium text-slate-900">${item.lineTotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Platform Commission ({((order.commissionAmount / order.subtotal) * 100).toFixed(0)}%)</span>
              <span>-${order.commissionAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-emerald-600 pt-2 border-t border-slate-200">
              <span>Your Payout</span>
              <span>${order.vendorPayout.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions (Read-only in demo) */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Order actions are managed by the marketplace admin
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// ORDERS VIEW
// ============================================================================

export function VendorOrdersView() {
  const { orders, isLoadingOrders, totalOrders, fetchOrders } = useMVM()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)

  useEffect(() => {
    fetchOrders(selectedStatus === 'ALL' ? undefined : selectedStatus)
  }, [fetchOrders, selectedStatus])

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.items.some(item => item.productName.toLowerCase().includes(q))
      )
    }
    return true
  })

  const statuses: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  return (
    <div className="space-y-6" data-testid="vendor-orders">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500">Manage your marketplace orders</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
          <p className="text-sm text-slate-500">Total Orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            data-testid="order-search"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              data-testid={`filter-${status}`}
            >
              {status === 'ALL' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoadingOrders ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium text-right">Subtotal</th>
                  <th className="px-6 py-4 font-medium text-right">Your Payout</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    data-testid={`order-row-${order.id}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{order.orderNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{order.customerName || 'Guest'}</p>
                      {order.customerEmail && (
                        <p className="text-sm text-slate-500">{order.customerEmail}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ${order.subtotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      ${order.vendorPayout.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
