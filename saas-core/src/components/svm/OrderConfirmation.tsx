'use client'

import { useSVM } from './SVMProvider'
import { CheckCircle, Package, Truck, Calendar, Mail, ArrowRight, Printer, Home } from 'lucide-react'

// ============================================================================
// ORDER CONFIRMATION
// ============================================================================

interface OrderConfirmationProps {
  onContinueShopping: () => void
}

export function OrderConfirmation({ onContinueShopping }: OrderConfirmationProps) {
  const { currentOrder, resetOrder } = useSVM()

  if (!currentOrder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-slate-500">No order found</p>
        <button
          onClick={onContinueShopping}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Return to shop
        </button>
      </div>
    )
  }

  const handleContinueShopping = () => {
    resetOrder()
    onContinueShopping()
  }

  const estimatedDelivery = currentOrder.estimatedDelivery
    ? new Date(Date.now() + (currentOrder.estimatedDelivery.max || 7) * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <div className="max-w-3xl mx-auto" data-testid="order-confirmation">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
        <p className="text-slate-600 text-lg">
          Thank you for your purchase. Your order has been received.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Order Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm">Order Number</p>
              <p className="text-2xl font-bold">{currentOrder.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-sm">Order Date</p>
              <p className="font-medium">
                {new Date(currentOrder.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-semibold text-emerald-600">Confirmed</p>
              </div>
            </div>
            
            <div className="flex-1 h-1 bg-slate-200 rounded">
              <div className="w-1/4 h-full bg-emerald-500 rounded" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Est. Delivery</p>
                <p className="font-medium text-slate-900">
                  {estimatedDelivery.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Items Ordered</h3>
          <div className="space-y-4">
            {currentOrder.items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-sm text-slate-500">{item.variantName}</p>
                  )}
                  <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">${item.lineTotal.toFixed(2)}</p>
                  <p className="text-sm text-slate-500">${item.unitPrice.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {/* Shipping Address */}
          <div className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-400" />
              Shipping Address
            </h3>
            {currentOrder.shippingAddress && (
              <div className="text-slate-600 text-sm space-y-1">
                <p className="font-medium text-slate-900">{currentOrder.shippingAddress.name}</p>
                <p>{currentOrder.shippingAddress.address1}</p>
                {currentOrder.shippingAddress.address2 && (
                  <p>{currentOrder.shippingAddress.address2}</p>
                )}
                <p>
                  {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.postalCode}
                </p>
                <p>{currentOrder.shippingAddress.country}</p>
              </div>
            )}
          </div>

          {/* Delivery Method */}
          <div className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              Delivery Method
            </h3>
            <p className="text-slate-600 text-sm">
              {currentOrder.shippingMethod}
            </p>
            {currentOrder.estimatedDelivery && (
              <p className="text-slate-500 text-sm mt-1">
                Estimated {currentOrder.estimatedDelivery.min}-{currentOrder.estimatedDelivery.max} business days
              </p>
            )}
          </div>
        </div>

        {/* Order Totals */}
        <div className="p-6 bg-slate-50">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${currentOrder.subtotal.toFixed(2)}</span>
            </div>
            {currentOrder.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-${currentOrder.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>
                {currentOrder.shippingTotal === 0 ? 'FREE' : `$${currentOrder.shippingTotal.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>${currentOrder.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>${currentOrder.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Notification */}
      <div className="bg-indigo-50 rounded-xl p-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p className="font-medium text-indigo-900">Confirmation email sent</p>
          <p className="text-indigo-700 text-sm">
            We've sent order details to {currentOrder.shippingAddress?.email || 'your email address'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.print()}
          className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print Receipt
        </button>
        <button
          onClick={handleContinueShopping}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          data-testid="continue-shopping-btn"
        >
          Continue Shopping
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Demo Notice */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <p className="text-amber-800 font-medium">Demo Mode</p>
        <p className="text-amber-700 text-sm">
          This is a demonstration order. No actual payment was processed.
        </p>
      </div>
    </div>
  )
}

// Note: OrderConfirmation exported inline with 'export function'
