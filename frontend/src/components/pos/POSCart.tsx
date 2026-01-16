'use client'

import { useState } from 'react'
import { usePOS } from './POSProvider'
import { Minus, Plus, Trash2, ShoppingCart, User, AlertTriangle, X } from 'lucide-react'

export function POSCart() {
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    setCustomer 
  } = usePOS()
  
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  
  const handleClearCart = () => {
    clearCart()
    setShowClearConfirm(false)
  }
  
  const formatNGN = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  }

  if (cart.items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8" data-testid="cart-empty">
        <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Cart is empty</p>
        <p className="text-sm mt-1">Search for products to add</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" data-testid="cart-content">
      {/* Customer badge */}
      {cart.customerName && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-100 flex items-center gap-2">
          <User className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{cart.customerName}</span>
          <button 
            onClick={() => setCustomer('', '')}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        {cart.items.map((item) => (
          <div 
            key={item.id}
            className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">
                  {item.product.name}
                </div>
                <div className="text-sm text-slate-500">
                  {formatNGN(item.unitPrice)} each
                </div>
                {item.discount > 0 && (
                  <div className="text-sm text-emerald-600">
                    -{formatNGN(item.discount)} discount
                  </div>
                )}
              </div>

              {/* Line total */}
              <div className="text-right font-semibold text-slate-900">
                {formatNGN(item.total)}
              </div>
            </div>

            {/* Quantity controls - Mobile optimized with larger touch targets */}
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => updateCartItem(item.id, item.quantity - 1)}
                className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors touch-manipulation"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <span className="w-12 h-12 flex items-center justify-center text-lg font-semibold bg-slate-50 border border-slate-200 rounded-xl">
                {item.quantity}
              </span>
              
              <button
                onClick={() => updateCartItem(item.id, item.quantity + 1)}
                className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors touch-manipulation"
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={() => removeFromCart(item.id)}
                className="ml-auto w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors touch-manipulation"
                aria-label="Remove item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart summary */}
      <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium">{formatNGN(cart.subtotal)}</span>
        </div>
        
        {cart.discountTotal > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discounts</span>
            <span>-{formatNGN(cart.discountTotal)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">VAT (7.5%)</span>
          <span className="font-medium">{formatNGN(cart.taxTotal)}</span>
        </div>
        
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
          <span>Total</span>
          <span>{formatNGN(cart.grandTotal)}</span>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full mt-2 py-3 text-sm text-slate-500 hover:text-red-500 active:text-red-600 transition-colors touch-manipulation"
        >
          Clear Cart
        </button>
      </div>
      
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Clear Cart?</h3>
                <p className="text-sm text-slate-500">This will remove all {cart.items.length} item{cart.items.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <p className="text-slate-600 mb-6">
              You are about to clear the entire cart. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCart}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors touch-manipulation"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
