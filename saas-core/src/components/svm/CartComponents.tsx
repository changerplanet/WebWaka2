'use client'

import { useState } from 'react'
import { useSVM } from './SVMProvider'
import { X, Plus, Minus, Trash2, ShoppingBag, Tag, ArrowRight, Percent } from 'lucide-react'

// ============================================================================
// CART DRAWER
// ============================================================================

interface CartDrawerProps {
  onCheckout: () => void
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { 
    cart, 
    isCartOpen, 
    toggleCart, 
    updateCartQuantity, 
    removeFromCart,
    applyPromoCode,
    removePromoCode 
  } = useSVM()
  
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    
    setIsApplyingPromo(true)
    setPromoError(null)
    
    const result = await applyPromoCode(promoInput.trim())
    
    if (result.success) {
      setPromoInput('')
    } else {
      setPromoError(result.error || 'Invalid code')
    }
    
    setIsApplyingPromo(false)
  }

  if (!isCartOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={toggleCart}
        data-testid="cart-overlay"
      />

      {/* Drawer */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        data-testid="cart-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Your Cart</h2>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              {cart.itemCount}
            </span>
          </div>
          <button 
            onClick={toggleCart}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="close-cart"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Your cart is empty</h3>
              <p className="text-slate-500 mb-6">Add some products to get started</p>
              <button
                onClick={toggleCart}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div 
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4 p-4 bg-slate-50 rounded-xl"
                  data-testid={`cart-item-${item.productId}`}
                >
                  {/* Image */}
                  <div className="w-20 h-20 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{item.productName}</h4>
                    {item.variantName && (
                      <p className="text-sm text-slate-500">{item.variantName}</p>
                    )}
                    <p className="text-indigo-600 font-semibold mt-1">
                      ${item.unitPrice.toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        data-testid={`decrease-${item.productId}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        data-testid={`increase-${item.productId}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        data-testid={`remove-${item.productId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-slate-200 p-6 space-y-4">
            {/* Promo Code */}
            {!cart.promotionCode ? (
              <div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                      data-testid="promo-input"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoInput.trim()}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    data-testid="apply-promo"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-sm mt-1">{promoError}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">Try: SAVE10 or DEMO</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">{cart.promotionCode}</span>
                  <span className="text-emerald-600 text-sm">applied</span>
                </div>
                <button
                  onClick={removePromoCode}
                  className="text-emerald-600 hover:text-emerald-700 text-sm"
                  data-testid="remove-promo"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-${cart.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{cart.shippingTotal > 0 ? `$${cart.shippingTotal.toFixed(2)}` : 'Calculated at checkout'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax</span>
                <span>${cart.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                toggleCart()
                onCheckout()
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              data-testid="checkout-btn"
            >
              Checkout
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-xs text-slate-400">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// ============================================================================
// MINI CART (Header Icon)
// ============================================================================

export function MiniCart() {
  const { cart, toggleCart } = useSVM()

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      data-testid="mini-cart"
    >
      <ShoppingBag className="w-6 h-6 text-slate-700" />
      {cart.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {cart.itemCount > 9 ? '9+' : cart.itemCount}
        </span>
      )}
    </button>
  )
}

export { CartDrawer, MiniCart }
