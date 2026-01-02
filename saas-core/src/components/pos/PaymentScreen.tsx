'use client'

import { useState } from 'react'
import { usePOS } from './POSProvider'
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  Smartphone, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Receipt
} from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote, color: 'emerald' },
  { id: 'CARD', label: 'Card', icon: CreditCard, color: 'blue' },
  { id: 'MOBILE', label: 'Mobile Pay', icon: Smartphone, color: 'purple' },
  { id: 'WALLET', label: 'Store Credit', icon: Wallet, color: 'amber' },
]

interface PaymentScreenProps {
  onComplete?: (saleId: string) => void
  onCancel?: () => void
}

export function PaymentScreen({ onComplete, onCancel }: PaymentScreenProps) {
  const { cart, checkout, isOnline } = usePOS()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; saleId?: string; error?: string } | null>(null)
  const [cashReceived, setCashReceived] = useState('')
  const [finalChangeAmount, setFinalChangeAmount] = useState<number>(0)

  const handlePayment = async () => {
    if (!selectedMethod) return
    
    // Store the change amount before checkout clears the cart
    if (selectedMethod === 'CASH' && cashReceived) {
      setFinalChangeAmount(parseFloat(cashReceived) - cart.grandTotal)
    }
    
    setIsProcessing(true)
    const paymentResult = await checkout(selectedMethod)
    setResult(paymentResult)
    setIsProcessing(false)

    if (paymentResult.success && paymentResult.saleId && onComplete) {
      setTimeout(() => {
        onComplete(paymentResult.saleId!)
      }, 2000)
    }
  }

  const changeAmount = selectedMethod === 'CASH' && cashReceived 
    ? parseFloat(cashReceived) - cart.grandTotal 
    : 0

  // Success state
  if (result?.success) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-emerald-50">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-700 mb-2">Payment Complete!</h2>
        <p className="text-emerald-600 mb-4">Sale #{result.saleId}</p>
        
        {selectedMethod === 'CASH' && finalChangeAmount > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <p className="text-sm text-slate-500 mb-1">Change Due</p>
            <p className="text-4xl font-bold text-emerald-600">${finalChangeAmount.toFixed(2)}</p>
          </div>
        )}
        
        {!isOnline && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            Saved offline - will sync when online
          </div>
        )}
        
        <button
          onClick={() => onComplete?.(result.saleId!)}
          className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          <Receipt className="w-5 h-5 inline mr-2" />
          New Sale
        </button>
      </div>
    )
  }

  // Error state
  if (result?.error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-red-50">
        <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Payment Failed</h2>
        <p className="text-red-600 mb-6">{result.error}</p>
        
        <button
          onClick={() => setResult(null)}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment</h2>
            <p className="text-sm text-slate-500">{cart.items.length} items</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-3xl font-bold text-slate-900">${cart.grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="flex-1 p-6 overflow-y-auto">
        <p className="text-sm font-medium text-slate-500 mb-4">Select Payment Method</p>
        
        <div className="grid grid-cols-2 gap-4">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id
            const colorClasses = {
              emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
              blue: 'border-blue-500 bg-blue-50 text-blue-700',
              purple: 'border-purple-500 bg-purple-50 text-purple-700',
              amber: 'border-amber-500 bg-amber-50 text-amber-700',
            }
            
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-6 rounded-xl border-2 transition-all touch-manipulation ${
                  isSelected 
                    ? colorClasses[method.color as keyof typeof colorClasses]
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon className={`w-10 h-10 mx-auto mb-3 ${isSelected ? '' : 'text-slate-400'}`} />
                <p className={`font-medium ${isSelected ? '' : 'text-slate-700'}`}>{method.label}</p>
              </button>
            )
          })}
        </div>

        {/* Cash input */}
        {selectedMethod === 'CASH' && (
          <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cash Received
            </label>
            <input
              type="number"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
              className="w-full text-3xl font-bold text-center p-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              step="0.01"
              min="0"
            />
            
            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[20, 50, 100, cart.grandTotal].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCashReceived(amount.toFixed(2))}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  ${amount.toFixed(0)}
                </button>
              ))}
            </div>

            {cashReceived && parseFloat(cashReceived) >= cart.grandTotal && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-600">Change</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ${(parseFloat(cashReceived) - cart.grandTotal).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Offline notice */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700">You're offline</p>
              <p className="text-sm text-amber-600">
                Payment will be saved and synced when back online.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-6 bg-white border-t border-slate-200 flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 px-6 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors touch-manipulation"
        >
          Cancel
        </button>
        
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing || (selectedMethod === 'CASH' && (!cashReceived || parseFloat(cashReceived) < cart.grandTotal))}
          className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete Sale
            </>
          )}
        </button>
      </div>
    </div>
  )
}
