'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  Play, 
  Square, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react'
import { formatNGNShort } from '@/lib/pos/config'

interface Location {
  id: string
  name: string
}

interface Shift {
  id: string
  shiftNumber: string
  registerId: string
  locationId: string
  status: string
  openedAt: string
  closedAt?: string
  openingFloat: number
  openedByName: string
}

interface ShiftManagementProps {
  tenantId: string
  locations: Location[]
  currentShift: Shift | null
  onShiftChange: (shift: Shift | null) => void
  onClose: () => void
}

export function ShiftManagement({ 
  tenantId, 
  locations, 
  currentShift, 
  onShiftChange,
  onClose 
}: ShiftManagementProps) {
  const [selectedLocationId, setSelectedLocationId] = useState(currentShift?.locationId || '')
  const [openingCash, setOpeningCash] = useState('')
  const [declaredCash, setDeclaredCash] = useState('')
  const [varianceReason, setVarianceReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'open' | 'close'>(currentShift ? 'view' : 'open')

  const handleOpenShift = async () => {
    if (!selectedLocationId) {
      setError('Please select a location')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          locationId: selectedLocationId,
          openingFloat: parseFloat(openingCash) || 0,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onShiftChange(data.shift)
        setMode('view')
      } else {
        setError(data.error || 'Failed to open shift')
      }
    } catch (err) {
      setError('Failed to open shift. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseShift = async () => {
    if (!currentShift) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          shiftId: currentShift.id,
          closingData: {
            actualCash: parseFloat(declaredCash) || 0,
            varianceReason: varianceReason || null,
            notes: notes || null,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        onShiftChange(null)
        onClose()
      } else {
        setError(data.error || 'Failed to close shift')
      }
    } catch (err) {
      setError('Failed to close shift. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg">
              {mode === 'open' ? 'Open Shift' : mode === 'close' ? 'Close Shift' : 'Current Shift'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {mode === 'view' && currentShift && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Shift Active</span>
                </div>
                <p className="text-sm text-emerald-600">{currentShift.shiftNumber}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Register</span>
                  <span className="font-mono">{currentShift.registerId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Opened At</span>
                  <span>{formatTime(currentShift.openedAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Opened By</span>
                  <span>{currentShift.openedByName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Opening Float</span>
                  <span className="font-medium">{formatNGNShort(currentShift.openingFloat)}</span>
                </div>
              </div>

              <button
                onClick={() => setMode('close')}
                className="w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Close Shift
              </button>
            </div>
          )}

          {mode === 'open' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                >
                  <option value="">Select location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Opening Cash (NGN)
                </label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-right font-mono text-lg"
                />
                <p className="text-xs text-slate-500 mt-1">Cash float in the drawer at shift start</p>
              </div>
            </div>
          )}

          {mode === 'close' && currentShift && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shift</span>
                  <span className="font-medium">{currentShift.shiftNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Opening Float</span>
                  <span>{formatNGNShort(currentShift.openingFloat)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Declared Cash (NGN) *
                </label>
                <input
                  type="number"
                  value={declaredCash}
                  onChange={(e) => setDeclaredCash(e.target.value)}
                  placeholder="Count cash in drawer"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-right font-mono text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Variance Reason (if any)
                </label>
                <select
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                >
                  <option value="">No variance</option>
                  <option value="SHORT_CASH">Short Cash</option>
                  <option value="EXCESS_CASH">Excess Cash</option>
                  <option value="TRANSFER_MISMATCH">Transfer Mismatch</option>
                  <option value="ERROR_CORRECTION">Error Correction</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
          {mode === 'view' && (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
            >
              Done
            </button>
          )}

          {mode === 'open' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenShift}
                disabled={!selectedLocationId || isLoading}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Open Shift
              </button>
            </>
          )}

          {mode === 'close' && (
            <>
              <button
                onClick={() => setMode('view')}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseShift}
                disabled={!declaredCash || isLoading}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                Close Shift
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
