'use client'

import Link from 'next/link'
import { 
  OrderPortalTenant, 
  UnifiedOrder, 
  formatNGN, 
  getOrderStatusColor,
  getOrderTypeIcon,
  getPaymentMethodLabel
} from '@/lib/orders/public-order-resolver'

interface OrdersIndexClientProps {
  tenant: OrderPortalTenant
  orders: UnifiedOrder[]
  tenantSlug: string
  requiresIdentifier?: boolean
}

export default function OrdersIndexClient({ tenant, orders, tenantSlug, requiresIdentifier }: OrdersIndexClientProps) {
  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ '--tenant-primary': tenant.primaryColor } as React.CSSProperties}
    >
      <header 
        className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3"
        style={{ backgroundColor: tenant.primaryColor }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.appName}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <h1 className="text-lg font-semibold text-white">My Orders</h1>
          </div>
          {tenant.isDemo && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
              DEMO
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {requiresIdentifier ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Find Your Orders</h2>
            <p className="text-gray-600 mb-6">
              Enter your email or phone number to view your orders.
            </p>
            <form className="max-w-sm mx-auto space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tenant.primaryColor } as React.CSSProperties}
              />
              <p className="text-gray-400 text-sm">or</p>
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tenant.primaryColor } as React.CSSProperties}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                Find My Orders
              </button>
            </form>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-600">
              When you place an order, it will appear here.
            </p>
            <Link
              href={`/${tenantSlug}/store`}
              className="inline-block mt-6 px-6 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
            
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/${tenantSlug}/orders/${order.orderNumber}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getOrderTypeIcon(order.orderType)}</span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.orderTypeLabel}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items</span>
                    <span className="text-gray-900">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment</span>
                    <span className="text-gray-900">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date</span>
                    <span className="text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Total</span>
                  <span className="text-lg font-bold" style={{ color: tenant.primaryColor }}>
                    {formatNGN(order.grandTotal)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
