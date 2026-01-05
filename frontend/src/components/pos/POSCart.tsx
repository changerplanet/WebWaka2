'use client'

import { usePOS } from './POSProvider'
import { Minus, Plus, Trash2, ShoppingCart, User } from 'lucide-react'

export function POSCart() {
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    setCustomer 
  } = usePOS()

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
                  ${item.unitPrice.toFixed(2)} each
                </div>
                {item.discount > 0 && (
                  <div className="text-sm text-emerald-600">
                    -${item.discount.toFixed(2)} discount
                  </div>
                )}
              </div>

              {/* Line total */}
              <div className="text-right font-semibold text-slate-900">
                ${item.total.toFixed(2)}
              </div>
            </div>

            {/* Quantity controls */}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => updateCartItem(item.id, item.quantity - 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors touch-manipulation"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateCartItem(item.id, parseInt(e.target.value) || 0)}
                className="w-16 h-10 text-center font-medium bg-slate-50 border border-slate-200 rounded-lg"
                min="0"
              />
              
              <button
                onClick={() => updateCartItem(item.id, item.quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors touch-manipulation"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => removeFromCart(item.id)}
                className="ml-auto w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart summary */}
      <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
        </div>
        
        {cart.discountTotal > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discounts</span>
            <span>-${cart.discountTotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tax</span>
          <span className="font-medium">${cart.taxTotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
          <span>Total</span>
          <span>${cart.grandTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={clearCart}
          className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
        >
          Clear Cart
        </button>
      </div>
    </div>
  )
}
