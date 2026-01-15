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

interface OrderDetailClientProps {
  tenant: OrderPortalTenant
  order: UnifiedOrder
  tenantSlug: string
}

export default function OrderDetailClient({ tenant, order, tenantSlug }: OrderDetailClientProps) {
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
            <Link 
              href={`/${tenantSlug}/orders`}
              className="text-white hover:opacity-80"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-white">Order Details</h1>
          </div>
          {tenant.isDemo && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
              DEMO
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getOrderTypeIcon(order.orderType)}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  #{order.orderNumber}
                </h2>
                <p className="text-sm text-gray-500">{order.orderTypeLabel}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Time</p>
              <p className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleTimeString('en-NG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.variantName && (
                    <p className="text-sm text-gray-500">{item.variantName}</p>
                  )}
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-sm text-gray-600">
                      Qty: {item.quantity} × {formatNGN(item.unitPrice)}
                    </span>
                    <span className="font-medium" style={{ color: tenant.primaryColor }}>
                      {formatNGN(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method</span>
              <span className="font-medium text-gray-900">
                {getPaymentMethodLabel(order.paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOrderStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold" style={{ color: tenant.primaryColor }}>
                {formatNGN(order.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {order.trackingNumber && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tracking</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tracking Number</span>
                <span className="font-mono font-medium text-gray-900">
                  {order.trackingNumber}
                </span>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 rounded-lg text-white font-medium mt-3"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  Track Shipment
                </a>
              )}
            </div>
          </div>
        )}

        {order.shippingAddress && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
            <div className="text-sm text-gray-700">
              {typeof order.shippingAddress === 'object' ? (
                <>
                  {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                  {order.shippingAddress.landmark && <p className="text-gray-500">Near: {order.shippingAddress.landmark}</p>}
                  {order.shippingAddress.city && order.shippingAddress.state && (
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  )}
                  {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                </>
              ) : (
                <p>{String(order.shippingAddress)}</p>
              )}
            </div>
          </div>
        )}

        {order.customerName && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-900">{order.customerName}</span>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900">{order.customerEmail}</span>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium text-gray-900">{order.customerPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {order.orderType === 'PARKHUB' && order.verificationUrl && (
          <Link
            href={order.verificationUrl}
            className="block w-full text-center py-3 rounded-xl text-white font-medium"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            View Ticket
          </Link>
        )}
      </main>
    </div>
  )
}
