/**
 * Payment Modal Component
 * 
 * Touch-friendly payment flow with offline support
 */

'use client'

import { useState } from 'react'

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT'

interface PaymentModalProps {
  total: number
  isOnline: boolean
  onComplete: (payment: {
    method: PaymentMethod
    amount: number
    cashReceived?: number
    changeGiven?: number
  }) => void
  onCancel: () => void
}

const QUICK_CASH_AMOUNTS = [20, 40, 50, 100]

export function PaymentModal({ total, isOnline, onComplete, onCancel }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const changeGiven = method === 'CASH' && cashReceived > total 
    ? cashReceived - total 
    : 0

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount)
  }

  const handleExactCash = () => {
    setCashReceived(total)
  }

  const handleCompleteCash = () => {
    if (cashReceived < total) return

    setIsProcessing(true)
    setTimeout(() => {
      onComplete({
        method: 'CASH',
        amount: total,
        cashReceived,
        changeGiven
      })
    }, 300)
  }

  const handleCompleteCard = () => {
    if (!isOnline) {
      // Queue for later processing
      onComplete({
        method: 'CARD',
        amount: total
      })
      return
    }

    setIsProcessing(true)
    setTimeout(() => {
      onComplete({
        method: 'CARD',
        amount: total
      })
    }, 1000)
  }

  // Payment Method Selection
  if (!method) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="payment-modal">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-gray-50 border-b text-center">
            <p className="text-sm text-gray-500 mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-gray-900" data-testid="payment-amount">
              ${total.toFixed(2)}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="p-6 space-y-3">
            <button
              onClick={() => setMethod('CASH')}
              className="w-full py-4 px-6 rounded-xl border-2 border-gray-200 flex items-center gap-4 hover:border-blue-500 hover:bg-blue-50 active:scale-98 transition-all"
              data-testid="pay-cash"
            >
              <span className="text-3xl">💵</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Cash</p>
                <p className="text-sm text-gray-500">Available offline</p>
              </div>
            </button>

            <button
              onClick={() => setMethod('CARD')}
              className={`w-full py-4 px-6 rounded-xl border-2 flex items-center gap-4 transition-all ${
                isOnline 
                  ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:scale-98' 
                  : 'border-amber-200 bg-amber-50'
              }`}
              data-testid="pay-card"
            >
              <span className="text-3xl">💳</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Card</p>
                <p className="text-sm text-gray-500">
                  {isOnline ? 'Visa, Mastercard, Amex' : 'Will process when online'}
                </p>
              </div>
              {!isOnline && (
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                  Offline
                </span>
              )}
            </button>

            <button
              onClick={() => setMethod('MOBILE')}
              disabled={!isOnline}
              className={`w-full py-4 px-6 rounded-xl border-2 flex items-center gap-4 transition-all ${
                isOnline 
                  ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:scale-98' 
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
              data-testid="pay-mobile"
            >
              <span className="text-3xl">📱</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Mobile Payment</p>
                <p className="text-sm text-gray-500">
                  {isOnline ? 'Apple Pay, Google Pay' : 'Requires connection'}
                </p>
              </div>
            </button>
          </div>

          {/* Cancel */}
          <div className="p-4 border-t">
            <button
              onClick={onCancel}
              className="w-full py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
              data-testid="cancel-payment"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Cash Payment Flow
  if (method === 'CASH') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="cash-payment">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-green-50 border-b">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setMethod(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <span className="text-2xl">💵</span>
              <span className="font-semibold text-gray-900">Cash Payment</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Change</p>
                <p className="text-2xl font-bold text-green-600" data-testid="change-amount">
                  ${changeGiven.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Cash Received Input */}
          <div className="p-6">
            <label className="block text-sm text-gray-600 mb-2">Cash Received</label>
            <input
              type="number"
              value={cashReceived || ''}
              onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full text-3xl font-bold text-center py-4 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              data-testid="cash-input"
            />

            {/* Quick Cash Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {QUICK_CASH_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => handleQuickCash(amount)}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    cashReceived === amount 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`quick-cash-${amount}`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <button
              onClick={handleExactCash}
              className={`w-full mt-3 py-3 rounded-lg font-medium transition-all ${
                cashReceived === total 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="exact-cash"
            >
              Exact ${total.toFixed(2)}
            </button>
          </div>

          {/* Complete */}
          <div className="p-4 border-t">
            <button
              onClick={handleCompleteCash}
              disabled={cashReceived < total || isProcessing}
              className="w-full py-4 rounded-xl bg-green-600 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 active:scale-98 transition-all"
              data-testid="complete-cash"
            >
              {isProcessing ? 'Processing...' : `Complete (Change $${changeGiven.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Card Payment Flow
  if (method === 'CARD') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="card-payment">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 bg-blue-50 border-b">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setMethod(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <span className="text-2xl">💳</span>
              <span className="font-semibold text-gray-900">Card Payment</span>
            </div>
            <p className="text-3xl font-bold text-center text-gray-900">${total.toFixed(2)}</p>
          </div>

          {/* Card Processing */}
          <div className="p-8 text-center">
            {!isOnline && (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 font-medium">⚠️ Offline Mode</p>
                <p className="text-sm text-amber-600 mt-1">
                  Payment will be processed when connection is restored
                </p>
              </div>
            )}

            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-600">Processing payment...</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💳</div>
                <p className="text-gray-600 mb-6">
                  {isOnline 
                    ? 'Tap, insert, or swipe card' 
                    : 'Complete sale to queue payment'
                  }
                </p>
              </>
            )}
          </div>

          {/* Complete */}
          <div className="p-4 border-t">
            <button
              onClick={handleCompleteCard}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-blue-600 text-white text-lg font-bold disabled:opacity-50 hover:bg-blue-700 active:scale-98 transition-all"
              data-testid="complete-card"
            >
              {isProcessing 
                ? 'Processing...' 
                : isOnline 
                  ? 'Complete Payment' 
                  : 'Complete (Queue Payment)'
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
