'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, Vault, DollarSign, Shield, Check, AlertTriangle, History } from 'lucide-react'

interface Transfer {
  id: string
  transferNumber: string
  transferType: string
  amount: number
  reason: string
  notes: string | null
  initiatedByName: string
  approvedByName: string
  initiatedAt: string
  status: string
}

interface Shift {
  id: string
  shiftNumber: string
  registerId: string | null
  status: string
  openedByName: string
}

const TRANSFER_TYPES = [
  { 
    value: 'DRAWER_TO_SAFE', 
    label: 'Drawer → Safe',
    description: 'Move excess cash to safe',
    icon: Vault,
  },
  { 
    value: 'SAFE_TO_DRAWER', 
    label: 'Safe → Drawer',
    description: 'Get change from safe',
    icon: DollarSign,
  },
  { 
    value: 'DRAWER_TO_DRAWER', 
    label: 'Drawer → Drawer',
    description: 'Transfer between registers',
    icon: ArrowRight,
  },
]

interface CashTransferProps {
  locationId: string
  currentShiftId?: string
  onClose: () => void
}

export function CashTransfer({ locationId, currentShiftId, onClose }: CashTransferProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [openShifts, setOpenShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'history' | 'new'>('history')

  const [transferType, setTransferType] = useState<string>('DRAWER_TO_SAFE')
  const [fromShiftId, setFromShiftId] = useState<string>(currentShiftId || '')
  const [toShiftId, setToShiftId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  
  const [showSupervisorApproval, setShowSupervisorApproval] = useState(false)
  const [supervisorPin, setSupervisorPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [locationId, currentShiftId])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    
    try {
      const [transfersRes, shiftsRes] = await Promise.all([
        fetch(`/api/pos/transfers?locationId=${locationId}`),
        fetch(`/api/pos/shifts?locationId=${locationId}&status=OPEN`),
      ])

      const transfersData = await transfersRes.json()
      const shiftsData = await shiftsRes.json()

      if (transfersData.success) {
        setTransfers(transfersData.transfers || [])
      }

      if (shiftsData.success) {
        setOpenShifts(shiftsData.shifts || [])
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  function validateAndSubmit() {
    const parsedAmount = parseFloat(amount)
    
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a reason (at least 5 characters)')
      return
    }

    if (transferType === 'DRAWER_TO_DRAWER' && !toShiftId) {
      setError('Please select a destination drawer')
      return
    }

    if ((transferType === 'DRAWER_TO_SAFE' || transferType === 'DRAWER_TO_DRAWER') && !fromShiftId) {
      setError('Please select a source drawer')
      return
    }

    setShowSupervisorApproval(true)
  }

  async function confirmTransfer() {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/pos/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          transferType,
          fromRegisterId: null,
          fromShiftId: transferType === 'SAFE_TO_DRAWER' ? null : fromShiftId,
          toRegisterId: null,
          toShiftId: transferType === 'DRAWER_TO_SAFE' ? null : (toShiftId || fromShiftId),
          amount: parseFloat(amount),
          reason: reason.trim(),
          notes: notes.trim() || null,
          supervisorApproval: {
            pin: supervisorPin,
            approvedAt: new Date().toISOString(),
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowSupervisorApproval(false)
        setSupervisorPin('')
        setAmount('')
        setReason('')
        setNotes('')
        setView('history')
        fetchData()
      } else {
        setError(data.error || 'Failed to create transfer')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => 
    `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Cash Transfers
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('history')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'history' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4 inline mr-1" />
              History
            </button>
            <button
              onClick={() => setView('new')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'new' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              New Transfer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {view === 'history' ? (
            isLoading ? (
              <div className="text-center py-12 text-slate-500">Loading transfers...</div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-12">
                <Vault className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No transfers yet</p>
                <button
                  onClick={() => setView('new')}
                  className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  Create First Transfer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-500">{transfer.transferNumber}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                            {transfer.transferType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="font-semibold text-lg text-slate-900 mt-1">
                          {formatCurrency(transfer.amount)}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">{transfer.reason}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>By: {transfer.initiatedByName}</p>
                        <p>Approved: {transfer.approvedByName}</p>
                        <p className="mt-1">
                          {new Date(transfer.initiatedAt).toLocaleString('en-NG')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Transfer Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TRANSFER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setTransferType(type.value)}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        transferType === type.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 mb-1 ${
                        transferType === type.value ? 'text-emerald-600' : 'text-slate-400'
                      }`} />
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {(transferType === 'DRAWER_TO_SAFE' || transferType === 'DRAWER_TO_DRAWER') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Drawer</label>
                  <select
                    value={fromShiftId}
                    onChange={(e) => setFromShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select shift...</option>
                    {openShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shiftNumber} ({shift.openedByName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {transferType === 'DRAWER_TO_DRAWER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Drawer</label>
                  <select
                    value={toShiftId}
                    onChange={(e) => setToShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select shift...</option>
                    {openShifts
                      .filter((s) => s.id !== fromShiftId)
                      .map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.shiftNumber} ({shift.openedByName})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {transferType === 'SAFE_TO_DRAWER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Drawer</label>
                  <select
                    value={toShiftId || fromShiftId}
                    onChange={(e) => setToShiftId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select shift...</option>
                    {openShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.shiftNumber} ({shift.openedByName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-3 border border-slate-200 rounded-lg text-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Required)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Need change for customers"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={validateAndSubmit}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-lg flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Submit for Approval
              </button>
            </div>
          )}
        </div>

        {showSupervisorApproval && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold">Supervisor Approval</h3>
                  <p className="text-sm text-slate-500">Dual-control required for cash transfers</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-slate-600">Transfer: <strong>{formatCurrency(parseFloat(amount) || 0)}</strong></p>
                <p className="text-slate-600">Type: <strong>{transferType.replace(/_/g, ' ')}</strong></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor PIN</label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="Enter 4+ digit PIN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center text-xl tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSupervisorApproval(false); setSupervisorPin('') }}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransfer}
                  disabled={supervisorPin.length < 4 || isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : (
                    <>
                      <Check className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
