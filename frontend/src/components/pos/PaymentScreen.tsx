'use client'

import { useState, useRef } from 'react'
import { usePOS } from './POSProvider'
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  Smartphone, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Receipt,
  Building2,
  Camera,
  X
} from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote, color: 'emerald' },
  { id: 'TRANSFER', label: 'Bank Transfer', icon: Building2, color: 'purple' },
  { id: 'CARD', label: 'Card', icon: CreditCard, color: 'blue' },
  { id: 'MOBILE', label: 'Mobile Pay', icon: Smartphone, color: 'green' },
  { id: 'WALLET', label: 'Store Credit', icon: Wallet, color: 'amber' },
]

const ROUNDING_OPTIONS = [
  { id: null, label: 'No Rounding' },
  { id: 'N5', label: 'Round to ₦5' },
  { id: 'N10', label: 'Round to ₦10' },
]

function roundToNearest(amount: number, mode: 'N5' | 'N10' | null): number {
  if (!mode) return amount
  const divisor = mode === 'N5' ? 5 : 10
  return Math.round(amount / divisor) * divisor
}

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
  
  const [transferReference, setTransferReference] = useState('')
  const [transferImage, setTransferImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [roundingMode, setRoundingMode] = useState<'N5' | 'N10' | null>(null)
  const roundedTotal = selectedMethod === 'CASH' ? roundToNearest(cart.grandTotal, roundingMode) : cart.grandTotal
  const roundingAdjustment = roundedTotal - cart.grandTotal

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTransferImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) return
    
    // Store the change amount before checkout clears the cart
    if (selectedMethod === 'CASH' && cashReceived) {
      setFinalChangeAmount(parseFloat(cashReceived) - roundedTotal)
    }
    
    setIsProcessing(true)
    
    const paymentData = {
      paymentMethod: selectedMethod,
      transferReference: selectedMethod === 'TRANSFER' ? transferReference : undefined,
      transferImage: selectedMethod === 'TRANSFER' ? transferImage : undefined,
      roundingMode: selectedMethod === 'CASH' ? roundingMode : undefined,
      roundingAdjustment: selectedMethod === 'CASH' ? roundingAdjustment : undefined,
      amountPaid: selectedMethod === 'CASH' ? roundedTotal : cart.grandTotal
    }
    
    const paymentResult = await checkout(selectedMethod, paymentData)
    setResult(paymentResult)
    setIsProcessing(false)

    if (paymentResult.success && paymentResult.saleId && onComplete) {
      setTimeout(() => {
        onComplete(paymentResult.saleId!)
      }, 2000)
    }
  }

  const changeAmount = selectedMethod === 'CASH' && cashReceived 
    ? parseFloat(cashReceived) - roundedTotal 
    : 0
  
  const isTransferValid = selectedMethod !== 'TRANSFER' || transferReference.trim().length > 0
  const isCashValid = selectedMethod !== 'CASH' || (cashReceived && parseFloat(cashReceived) >= roundedTotal)

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
            <p className="text-4xl font-bold text-emerald-600">₦{finalChangeAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
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
            <p className="text-3xl font-bold text-slate-900">₦{cart.grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
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
              purple: 'border-purple-500 bg-purple-50 text-purple-700',
              blue: 'border-blue-500 bg-blue-50 text-blue-700',
              green: 'border-green-500 bg-green-50 text-green-700',
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

        {/* Bank Transfer input */}
        {selectedMethod === 'TRANSFER' && (
          <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transfer Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Enter bank transfer reference"
                className="w-full text-lg p-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                inputMode="text"
              />
              <p className="text-xs text-slate-500 mt-1">Enter the reference number from the bank transfer receipt</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Receipt Photo (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
              
              {transferImage ? (
                <div className="relative">
                  <img 
                    src={transferImage} 
                    alt="Transfer receipt" 
                    className="w-full h-40 object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={() => setTransferImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo of Receipt
                </button>
              )}
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Amount to Transfer</p>
              <p className="text-2xl font-bold text-purple-700">
                ₦{cart.grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Cash input */}
        {selectedMethod === 'CASH' && (
          <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200">
            {/* NGN Cash Rounding */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cash Rounding
              </label>
              <div className="flex gap-2">
                {ROUNDING_OPTIONS.map((option) => (
                  <button
                    key={option.id || 'none'}
                    onClick={() => setRoundingMode(option.id as 'N5' | 'N10' | null)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      roundingMode === option.id
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                        : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {roundingAdjustment !== 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Rounding adjustment: {roundingAdjustment > 0 ? '+' : ''}₦{roundingAdjustment.toFixed(2)}
                </p>
              )}
            </div>
            
            {/* Amount due after rounding */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Amount Due</p>
              <p className="text-2xl font-bold text-slate-900">
                ₦{roundedTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cash Received
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
              className="w-full text-3xl font-bold text-center p-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
            
            {/* Quick amount buttons - Nigerian denominations */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[500, 1000, 2000, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCashReceived(amount.toString())}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors touch-manipulation"
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setCashReceived(roundedTotal.toString())}
                className="py-3 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-medium transition-colors touch-manipulation"
              >
                Exact: ₦{roundedTotal.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </button>
              <button
                onClick={() => setCashReceived((Math.ceil(roundedTotal / 1000) * 1000).toString())}
                className="py-3 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors touch-manipulation"
              >
                ₦{(Math.ceil(roundedTotal / 1000) * 1000).toLocaleString()}
              </button>
            </div>

            {cashReceived && parseFloat(cashReceived) >= roundedTotal && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-600">Change</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ₦{(parseFloat(cashReceived) - roundedTotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
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
          disabled={!selectedMethod || isProcessing || !isTransferValid || !isCashValid}
          className="flex-1 py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
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
