/**
 * Cart Component
 * 
 * Shopping cart with touch-friendly controls
 */

'use client'

import type { CartItem } from '../../lib/client/offline-store'

interface CartProps {
  items: CartItem[]
  subtotal: number
  taxAmount: number
  total: number
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onPay: () => void
  onHold: () => void
  onDiscount: () => void
  disabled?: boolean
}

export function Cart({
  items,
  subtotal,
  taxAmount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onPay,
  onHold,
  onDiscount,
  disabled
}: CartProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l" data-testid="cart">
      {/* Cart Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">
          Current Sale
        </h2>
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <span className="text-4xl mb-2">🛒</span>
            <span>Cart is empty</span>
            <span className="text-sm">Tap products to add</span>
          </div>
        ) : (
          <div className="divide-y">
            {items.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Totals */}
      <div className="border-t bg-gray-50 p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax (8.25%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
          <span>Total</span>
          <span data-testid="cart-total">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Cart Actions */}
      <div className="p-4 border-t space-y-3">
        {/* Secondary Actions */}
        <div className="flex gap-2">
          <button
            onClick={onHold}
            disabled={items.length === 0 || disabled}
            className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-98"
            data-testid="hold-sale-btn"
          >
            Hold
          </button>
          <button
            onClick={onDiscount}
            disabled={items.length === 0 || disabled}
            className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-98"
            data-testid="discount-btn"
          >
            Discount
          </button>
        </div>

        {/* Pay Button */}
        <button
          onClick={onPay}
          disabled={items.length === 0 || disabled}
          className="w-full py-4 rounded-xl bg-blue-600 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-98 transition-all"
          data-testid="pay-btn"
        >
          Pay ${total.toFixed(2)}
        </button>
      </div>
    </div>
  )
}

// Cart Item Row Component
interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <div className="p-3 hover:bg-gray-50" data-testid={`cart-item-${item.id}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.productName}</p>
          {item.productSku && (
            <p className="text-xs text-gray-500">{item.productSku}</p>
          )}
          <p className="text-sm text-gray-600">${item.unitPrice.toFixed(2)} each</p>
        </div>
        <p className="font-bold text-gray-900 ml-2">
          ${item.lineTotal.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 active:scale-95"
            data-testid={`qty-minus-${item.id}`}
          >
            −
          </button>
          <span className="w-12 text-center font-medium text-lg">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 active:scale-95"
            data-testid={`qty-plus-${item.id}`}
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="w-10 h-10 rounded-lg text-red-500 hover:bg-red-50 active:scale-95"
          data-testid={`remove-${item.id}`}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
