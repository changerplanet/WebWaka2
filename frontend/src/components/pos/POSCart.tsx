'use client'

import { useState } from 'react'
import { usePOS } from './POSProvider'
import { Minus, Plus, Trash2, ShoppingCart, User, AlertTriangle, X, Percent, Tag } from 'lucide-react'

export function POSCart() {
  const { 
    cart, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    setCustomer,
    applyDiscount
  } = usePOS()
  
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [discountItemId, setDiscountItemId] = useState<string | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('percent')
  
  const handleClearCart = () => {
    clearCart()
    setShowClearConfirm(false)
  }
  
  const handleApplyDiscount = () => {
    if (!discountItemId || !discountValue) return
    
    const item = cart.items.find(i => i.id === discountItemId)
    if (!item) return
    
    let discountAmount: number
    if (discountType === 'percent') {
      const percent = Math.min(parseFloat(discountValue), 100)
      discountAmount = (item.unitPrice * item.quantity) * (percent / 100)
    } else {
      discountAmount = Math.min(parseFloat(discountValue), item.unitPrice * item.quantity)
    }
    
    applyDiscount(discountItemId, Math.round(discountAmount * 100) / 100)
    setDiscountItemId(null)
    setDiscountValue('')
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
                onClick={() => {
                  setDiscountItemId(item.id)
                  setDiscountValue('')
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors touch-manipulation ${
                  item.discount > 0 
                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                aria-label="Apply discount"
              >
                <Percent className="w-5 h-5" />
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
      
      {discountItemId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Apply Discount</h3>
              </div>
              <button
                onClick={() => setDiscountItemId(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {(() => {
              const item = cart.items.find(i => i.id === discountItemId)
              if (!item) return null
              return (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.quantity} x {formatNGN(item.unitPrice)} = {formatNGN(item.unitPrice * item.quantity)}
                  </p>
                </div>
              )
            })()}
            
            <div className="mb-4">
              <label className="text-sm text-slate-600 mb-2 block">Discount Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                    discountType === 'percent'
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  <Percent className="w-4 h-4 inline mr-1" />
                  Percentage
                </button>
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  ₦ Fixed
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="text-sm text-slate-600 mb-2 block">
                {discountType === 'percent' ? 'Discount Percentage' : 'Discount Amount (₦)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 500'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  max={discountType === 'percent' ? '100' : undefined}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {discountType === 'percent' ? '%' : '₦'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (discountItemId) {
                    applyDiscount(discountItemId, 0)
                  }
                  setDiscountItemId(null)
                }}
                className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors touch-manipulation"
              >
                Remove Discount
              </button>
              <button
                onClick={handleApplyDiscount}
                disabled={!discountValue || parseFloat(discountValue) <= 0}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors touch-manipulation"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
