'use client'

import { Clock, AlertTriangle } from 'lucide-react'

interface ShiftBannerProps {
  shiftStatus: 'OPEN' | 'CLOSED' | 'RECONCILED' | null
  shiftNumber?: string
  openedAt?: string
  onOpenShift?: () => void
}

export function ShiftBanner({ shiftStatus, shiftNumber, openedAt, onOpenShift }: ShiftBannerProps) {
  if (shiftStatus === 'OPEN' && shiftNumber) {
    const openedTime = openedAt ? new Date(openedAt).toLocaleTimeString('en-NG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : ''
    
    return (
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-700">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <Clock className="w-4 h-4" />
          <span className="font-medium">{shiftNumber}</span>
          {openedTime && (
            <span className="text-emerald-600 text-sm">Started at {openedTime}</span>
          )}
        </div>
        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
          Shift Open
        </span>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">No shift is currently open</span>
      </div>
      {onOpenShift && (
        <button
          onClick={onOpenShift}
          className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          Open Shift
        </button>
      )}
    </div>
  )
}
