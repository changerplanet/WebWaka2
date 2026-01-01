/**
 * Receipt View Component
 * 
 * Displays completed sale receipt
 */

'use client'

import type { CartItem } from '../../lib/client/offline-store'

interface ReceiptViewProps {
  saleNumber: string
  items: CartItem[]
  subtotal: number
  taxAmount: number
  total: number
  paymentMethod: string
  cashReceived?: number
  changeGiven?: number
  staffName: string
  completedAt: Date
  onNewSale: () => void
  onPrint?: () => void
  onEmail?: () => void
}

export function ReceiptView({
  saleNumber,
  items,
  subtotal,
  taxAmount,
  total,
  paymentMethod,
  cashReceived,
  changeGiven,
  staffName,
  completedAt,
  onNewSale,
  onPrint,
  onEmail
}: ReceiptViewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="receipt-view">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        {/* Success Header */}
        <div className="p-6 bg-green-500 text-white text-center">
          <div className="text-5xl mb-2">✓</div>
          <h2 className="text-2xl font-bold">Sale Complete</h2>
          <p className="text-green-100">{saleNumber}</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Items */}
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.productName}
                </span>
                <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-4" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 my-4" />

          {/* Payment Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">{paymentMethod}</span>
            </div>
            {paymentMethod === 'CASH' && cashReceived && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Received</span>
                  <span>${cashReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Change Given</span>
                  <span>${(changeGiven || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
            <p>Served by: {staffName}</p>
            <p>{completedAt.toLocaleString()}</p>
            <p className="mt-2">Thank you for your purchase!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-3">
          <div className="flex gap-2">
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                data-testid="print-receipt"
              >
                🖨️ Print
              </button>
            )}
            {onEmail && (
              <button
                onClick={onEmail}
                className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                data-testid="email-receipt"
              >
                ✉️ Email
              </button>
            )}
          </div>
          <button
            onClick={onNewSale}
            className="w-full py-4 rounded-xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-98 transition-all"
            data-testid="new-sale-btn"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  )
}
