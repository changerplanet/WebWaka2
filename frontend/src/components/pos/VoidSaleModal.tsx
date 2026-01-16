'use client'

import { useState } from 'react'
import { X, AlertTriangle, Lock, Loader2 } from 'lucide-react'
import { hasPOSPermission, POSRole, getPOSRole } from '@/app/pos/layout'

interface VoidSaleModalProps {
  saleId: string
  saleTotal: number
  onConfirm: (supervisorPin: string, reason: string) => Promise<boolean>
  onCancel: () => void
  currentRole: POSRole
}

export function VoidSaleModal({ 
  saleId, 
  saleTotal, 
  onConfirm, 
  onCancel,
  currentRole 
}: VoidSaleModalProps) {
  const [supervisorPin, setSupervisorPin] = useState('')
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const canVoidWithoutPin = hasPOSPermission(currentRole, 'pos.sale.void')
  
  const VOID_REASONS = [
    'Customer changed mind',
    'Payment declined',
    'Wrong items entered',
    'Price dispute',
    'Duplicate transaction',
    'Other'
  ]

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for voiding')
      return
    }
    
    if (!canVoidWithoutPin && !supervisorPin) {
      setError('Supervisor PIN required')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      const success = await onConfirm(supervisorPin, reason)
      if (!success) {
        setError('Failed to void sale. Check supervisor PIN.')
      }
    } catch (e) {
      setError('An error occurred while voiding the sale')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Void Sale</h2>
                <p className="text-sm text-slate-500">Sale #{saleId}</p>
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
        
        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <p className="text-lg font-bold text-red-700 mt-1">
              Amount: ₦{saleTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Void <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            >
              <option value="">Select a reason</option>
              {VOID_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          {!canVoidWithoutPin && (
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
                className="w-full text-xl text-center p-4 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none tracking-widest"
              />
              <p className="text-xs text-slate-500 mt-1">
                Requires supervisor or manager authorization
              </p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
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
            disabled={isProcessing || !reason || (!canVoidWithoutPin && !supervisorPin)}
            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Void'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
