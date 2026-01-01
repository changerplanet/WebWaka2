/**
 * Held Sales Component
 * 
 * Shows list of suspended sales for resumption
 */

'use client'

import type { HeldSale } from '../../lib/client/offline-store'

interface HeldSalesProps {
  sales: HeldSale[]
  onResume: (sale: HeldSale) => void
  onDelete: (saleId: string) => void
  onClose: () => void
}

export function HeldSales({ sales, onResume, onDelete, onClose }: HeldSalesProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatTimeAgo = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    return `${hours}h ago`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="held-sales-modal">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Held Sales ({sales.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            data-testid="close-held-sales"
          >
            ×
          </button>
        </div>

        {/* Sales List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {sales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">📋</span>
              <p>No held sales</p>
            </div>
          ) : (
            <div className="divide-y">
              {sales.map(sale => (
                <div 
                  key={sale.id}
                  className="p-4 hover:bg-gray-50"
                  data-testid={`held-sale-${sale.id}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        ${sale.subtotal.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.items.length} items • {formatTime(sale.heldAt)}
                      </p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {formatTimeAgo(sale.heldAt)}
                    </span>
                  </div>

                  {sale.note && (
                    <p className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded mb-3">
                      "{sale.note}"
                    </p>
                  )}

                  {/* Items Preview */}
                  <div className="text-xs text-gray-500 mb-3">
                    {sale.items.slice(0, 3).map(item => (
                      <span key={item.id} className="inline-block mr-2">
                        {item.quantity}x {item.productName}
                      </span>
                    ))}
                    {sale.items.length > 3 && (
                      <span>+{sale.items.length - 3} more</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onResume(sale)}
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-98"
                      data-testid={`resume-${sale.id}`}
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => onDelete(sale.id)}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 active:scale-98"
                      data-testid={`delete-${sale.id}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
