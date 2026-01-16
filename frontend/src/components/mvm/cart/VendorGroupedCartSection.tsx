'use client'

import { Trash2, Minus, Plus, Store } from 'lucide-react'
import { VendorTrustBadge, type ScoreBand } from '../VendorTrustBadge'
import type { MvmVendorGroup, MvmCartItem } from '@/lib/mvm/cart'

interface VendorGroupedCartSectionProps {
  vendorGroup: MvmVendorGroup
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onClearVendor: (vendorId: string) => void
  isLoading?: boolean
}

export function VendorGroupedCartSection({
  vendorGroup,
  onUpdateQuantity,
  onRemoveItem,
  onClearVendor,
  isLoading = false
}: VendorGroupedCartSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vendorGroup.vendorLogo ? (
              <img 
                src={vendorGroup.vendorLogo} 
                alt={vendorGroup.vendorName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <Store className="w-4 h-4 text-slate-500" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-slate-900">{vendorGroup.vendorName}</h3>
              {vendorGroup.trustBadge && vendorGroup.averageRating && (
                <VendorTrustBadge
                  scoreBand={vendorGroup.trustBadge as ScoreBand}
                  averageRating={vendorGroup.averageRating}
                  totalRatings={0}
                  size="sm"
                  showDetails={false}
                />
              )}
            </div>
          </div>
          <button
            onClick={() => onClearVendor(vendorGroup.vendorId)}
            disabled={isLoading}
            className="text-xs text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            Clear vendor items
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {vendorGroup.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Vendor Subtotal</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(vendorGroup.subtotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface CartItemRowProps {
  item: MvmCartItem
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  isLoading: boolean
  formatCurrency: (amount: number) => string
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isLoading,
  formatCurrency
}: CartItemRowProps) {
  const lineTotal = item.priceSnapshot * item.quantity

  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden">
          {item.productImage ? (
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Store className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-900 truncate">
            {item.productName}
          </h4>
          {item.variantName && (
            <p className="text-xs text-slate-500 mt-0.5">{item.variantName}</p>
          )}
          <p className="text-sm font-medium text-slate-700 mt-1">
            {formatCurrency(item.priceSnapshot)}
          </p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                disabled={isLoading || item.quantity <= 1}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={isLoading}
                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(lineTotal)}
              </span>
              <button
                onClick={() => onRemove(item.id)}
                disabled={isLoading}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorGroupedCartSection
