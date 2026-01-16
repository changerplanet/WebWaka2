'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator, 
  Banknote, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  X,
  Shield
} from 'lucide-react'
import { formatNGNShort } from '@/lib/pos/config'

interface ReconciliationProps {
  shiftId: string
  onComplete: () => void
  onClose: () => void
}

interface ReconciliationData {
  shift: {
    id: string
    shiftNumber: string
    locationId: string
    status: string
    openedAt: string
    closedAt?: string
    openedByName: string
    closedByName?: string
  }
  cash: {
    openingFloat: number
    cashSales: number
    systemTotal: number
    declaredTotal: number | null
    variance: number | null
    varianceReason: string | null
  }
  paymentBreakdown: Array<{
    method: string
    total: number
    count: number
  }>
  cashMovements: Array<{
    id: string
    type: string
    amount: number
    notes: string | null
    performedByName: string
    createdAt: string
  }>
  isReconciled: boolean
  notes: string | null
  varianceReasons: string[]
}

const VARIANCE_REASON_LABELS: Record<string, string> = {
  SHORT_CASH: 'Short Cash',
  EXCESS_CASH: 'Excess Cash',
  TRANSFER_MISMATCH: 'Transfer Mismatch',
  ERROR_CORRECTION: 'Error Correction',
  CHANGE_ERROR: 'Change Error',
  COUNTERFEIT_DETECTED: 'Counterfeit Detected',
  OTHER: 'Other',
}

export function Reconciliation({ shiftId, onComplete, onClose }: ReconciliationProps) {
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [declaredCash, setDeclaredCash] = useState('')
  const [varianceReason, setVarianceReason] = useState('')
  const [notes, setNotes] = useState('')
  const [supervisorPin, setSupervisorPin] = useState('')
  const [showSupervisorApproval, setShowSupervisorApproval] = useState(false)

  useEffect(() => {
    fetchData()
  }, [shiftId])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pos/reconciliation?shiftId=${shiftId}`)
      const result = await res.json()

      if (result.success) {
        setData(result.reconciliation)
        if (result.reconciliation.cash.declaredTotal !== null) {
          setDeclaredCash(String(result.reconciliation.cash.declaredTotal))
        }
        if (result.reconciliation.cash.varianceReason) {
          setVarianceReason(result.reconciliation.cash.varianceReason)
        }
        if (result.reconciliation.notes) {
          setNotes(result.reconciliation.notes)
        }
      } else {
        setError(result.error || 'Failed to load reconciliation data')
      }
    } catch (err) {
      setError('Failed to load reconciliation data')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateVariance = (): number => {
    if (!data) return 0
    const declared = parseFloat(declaredCash) || 0
    return declared - data.cash.systemTotal
  }

  const handleSubmit = async () => {
    if (!data) return

    const variance = calculateVariance()
    
    if (variance !== 0 && !showSupervisorApproval) {
      setShowSupervisorApproval(true)
      return
    }

    if (variance !== 0 && !supervisorPin) {
      setError('Supervisor PIN is required to approve variance')
      return
    }

    if (variance !== 0 && !varianceReason) {
      setError('Please select a variance reason')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/pos/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          declaredCash: parseFloat(declaredCash) || 0,
          varianceReason: varianceReason || null,
          notes: notes || null,
          supervisorApproval: variance !== 0 ? { pin: supervisorPin } : null,
        }),
      })

      const result = await res.json()
      
      if (result.success) {
        onComplete()
      } else if (result.requiresSupervisorApproval) {
        setShowSupervisorApproval(true)
      } else {
        setError(result.error || 'Failed to reconcile')
      }
    } catch (err) {
      setError('Failed to submit reconciliation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const variance = calculateVariance()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg">Cash Reconciliation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : error && !data ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : data ? (
            <>
              {data.isReconciled && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-700">Reconciliation Complete</p>
                    <p className="text-sm text-emerald-600">This shift has been reconciled and is read-only.</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700">{data.shift.shiftNumber}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Opening Float</span>
                  <span>{formatNGNShort(data.cash.openingFloat)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cash Sales</span>
                  <span>+{formatNGNShort(data.cash.cashSales)}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-slate-200 pt-2 mt-2">
                  <span>System Total</span>
                  <span>{formatNGNShort(data.cash.systemTotal)}</span>
                </div>
              </div>

              {!data.isReconciled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Banknote className="w-4 h-4 inline mr-1" />
                      Declared Cash (Count the drawer)
                    </label>
                    <input
                      type="number"
                      value={declaredCash}
                      onChange={(e) => {
                        setDeclaredCash(e.target.value)
                        setShowSupervisorApproval(false)
                      }}
                      placeholder="Enter cash count"
                      className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-right font-mono text-lg"
                    />
                  </div>

                  {declaredCash && (
                    <div className={`rounded-xl p-4 ${variance === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${variance === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          Variance
                        </span>
                        <span className={`font-bold text-lg ${variance === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {variance > 0 ? '+' : ''}{formatNGNShort(variance)}
                        </span>
                      </div>
                      {variance === 0 ? (
                        <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Cash drawer balances perfectly!
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {variance > 0 ? 'Excess cash detected' : 'Cash shortage detected'}
                        </p>
                      )}
                    </div>
                  )}

                  {showSupervisorApproval && variance !== 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Supervisor Approval Required</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Variance Reason *
                        </label>
                        <select
                          value={varianceReason}
                          onChange={(e) => setVarianceReason(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                        >
                          <option value="">Select reason...</option>
                          {data.varianceReasons.map(reason => (
                            <option key={reason} value={reason}>
                              {VARIANCE_REASON_LABELS[reason] || reason}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Supervisor PIN *
                        </label>
                        <input
                          type="password"
                          value={supervisorPin}
                          onChange={(e) => setSupervisorPin(e.target.value)}
                          placeholder="Enter supervisor PIN"
                          maxLength={6}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-center font-mono text-lg tracking-widest"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                      rows={2}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                </>
              )}

              {data.isReconciled && data.cash.variance !== null && (
                <div className={`rounded-xl p-4 ${data.cash.variance === 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Final Variance</span>
                    <span className="font-bold">
                      {data.cash.variance > 0 ? '+' : ''}{formatNGNShort(data.cash.variance)}
                    </span>
                  </div>
                  {data.cash.varianceReason && (
                    <p className="text-sm text-slate-500 mt-1">
                      Reason: {VARIANCE_REASON_LABELS[data.cash.varianceReason] || data.cash.varianceReason}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            {data?.isReconciled ? 'Close' : 'Cancel'}
          </button>
          {data && !data.isReconciled && (
            <button
              onClick={handleSubmit}
              disabled={!declaredCash || isSubmitting}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : showSupervisorApproval && variance !== 0 ? (
                'Approve & Complete'
              ) : (
                'Complete Reconciliation'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
