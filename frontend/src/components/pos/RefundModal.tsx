'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Lock, Loader2, RotateCcw, Minus, Plus } from 'lucide-react'
import { hasPOSPermission, POSRole } from '@/app/pos/layout'

interface SaleItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  returnedQuantity: number
  refundedAmount: number
}

interface RefundModalProps {
  saleId: string
  saleNumber: string
  saleTotal: number
  items: SaleItem[]
  currentRole: POSRole
  onConfirm: (data: {
    refundType: 'FULL' | 'PARTIAL'
    reason: string
    items?: Array<{ saleItemId: string; quantity: number; amount: number }>
    supervisorPin?: string
  }) => Promise<boolean>
  onCancel: () => void
}

const REFUND_REASONS = [
  'Customer returned item',
  'Item defective',
  'Wrong item sold',
  'Customer dissatisfied',
  'Price adjustment',
  'Other'
]

export function RefundModal({ 
  saleId, 
  saleNumber,
  saleTotal,
  items,
  currentRole,
  onConfirm, 
  onCancel,
}: RefundModalProps) {
  const [supervisorPin, setSupervisorPin] = useState('')
  const [reason, setReason] = useState('')
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refundItems, setRefundItems] = useState<Map<string, { quantity: number; amount: number }>>(new Map())
  
  const canRefundWithoutPin = hasPOSPermission(currentRole, 'pos.sale.refund')

  const availableItems = items.filter(item => 
    (item.quantity - (item.returnedQuantity || 0)) > 0
  )

  const totalAvailableForRefund = availableItems.reduce((sum, item) => 
    sum + (Number(item.lineTotal) - Number(item.refundedAmount || 0)), 0
  )

  const calculateRefundTotal = () => {
    if (refundType === 'FULL') {
      return totalAvailableForRefund
    }
    let total = 0
    refundItems.forEach((value) => {
      total += value.amount
    })
    return total
  }

  const handleItemQuantityChange = (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const current = refundItems.get(itemId) || { quantity: 0, amount: 0 }
    const maxQty = item.quantity - (item.returnedQuantity || 0)
    const newQty = Math.max(0, Math.min(maxQty, current.quantity + delta))
    
    const unitRefundPrice = (Number(item.lineTotal) - Number(item.refundedAmount || 0)) / (item.quantity - (item.returnedQuantity || 0))
    const newAmount = newQty * unitRefundPrice

    if (newQty === 0) {
      const newMap = new Map(refundItems)
      newMap.delete(itemId)
      setRefundItems(newMap)
    } else {
      setRefundItems(new Map(refundItems).set(itemId, { quantity: newQty, amount: newAmount }))
    }
  }

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for refund')
      return
    }
    
    if (!canRefundWithoutPin && !supervisorPin) {
      setError('Supervisor PIN required')
      return
    }

    if (refundType === 'PARTIAL' && refundItems.size === 0) {
      setError('Please select items to refund')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      const refundItemsArray = refundType === 'PARTIAL' 
        ? Array.from(refundItems.entries()).map(([saleItemId, data]) => ({
            saleItemId,
            quantity: data.quantity,
            amount: data.amount,
          }))
        : undefined

      const success = await onConfirm({
        refundType,
        reason,
        items: refundItemsArray,
        supervisorPin: supervisorPin || undefined,
      })
      if (!success) {
        setError('Failed to process refund. Check supervisor PIN.')
      }
    } catch (e) {
      setError('An error occurred while processing the refund')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatNGN = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Process Refund</h2>
                <p className="text-sm text-slate-500">Sale #{saleNumber}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-600">Refunds will return items to inventory and record cash outflow.</p>
            <p className="text-lg font-bold text-amber-700 mt-1">
              Available to refund: {formatNGN(totalAvailableForRefund)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Refund Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRefundType('FULL')}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  refundType === 'FULL' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium">Full Refund</div>
                <div className="text-sm text-slate-500">Refund entire sale</div>
              </button>
              <button
                onClick={() => setRefundType('PARTIAL')}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  refundType === 'PARTIAL' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-medium">Partial Refund</div>
                <div className="text-sm text-slate-500">Select specific items</div>
              </button>
            </div>
          </div>

          {refundType === 'PARTIAL' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Items to Refund
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableItems.map(item => {
                  const refundData = refundItems.get(item.id) || { quantity: 0, amount: 0 }
                  const maxQty = item.quantity - (item.returnedQuantity || 0)
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{item.productName}</div>
                        <div className="text-sm text-slate-500">
                          {formatNGN(Number(item.unitPrice))} x {maxQty} available
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleItemQuantityChange(item.id, -1)}
                          disabled={refundData.quantity === 0}
                          className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-slate-300 disabled:opacity-50 rounded-lg transition-colors touch-manipulation"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {refundData.quantity}
                        </span>
                        <button
                          onClick={() => handleItemQuantityChange(item.id, 1)}
                          disabled={refundData.quantity >= maxQty}
                          className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-slate-300 disabled:opacity-50 rounded-lg transition-colors touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Refund <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          {!canRefundWithoutPin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Supervisor PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-6 digit PIN"
                className="w-full text-xl text-center p-4 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none tracking-widest"
              />
              <p className="text-xs text-slate-500 mt-1">
                Requires supervisor or manager authorization
              </p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="p-4 bg-slate-100 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Refund Amount:</span>
              <span className="text-xl font-bold text-amber-600">{formatNGN(calculateRefundTotal())}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !reason || (!canRefundWithoutPin && !supervisorPin) || (refundType === 'PARTIAL' && refundItems.size === 0)}
            className="flex-1 py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
