'use client'

import { usePOS } from './POSProvider'
import { Wifi, WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react'

export function POSStatusBar() {
  const { 
    isOnline, 
    isSyncing, 
    lastSyncTime, 
    pendingTransactions,
    locationName,
    staffName,
    syncOfflineTransactions
  } = usePOS()

  return (
    <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-sm">
      {/* Left: Location & Staff */}
      <div className="flex items-center gap-4">
        {locationName && (
          <span className="text-slate-300">
            📍 {locationName}
          </span>
        )}
        {staffName && (
          <span className="text-slate-400">
            👤 {staffName}
          </span>
        )}
      </div>

      {/* Right: Connection status */}
      <div className="flex items-center gap-4">
        {/* Pending transactions */}
        {pendingTransactions > 0 && (
          <button
            onClick={syncOfflineTransactions}
            disabled={!isOnline || isSyncing}
            className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {pendingTransactions} pending
            {isSyncing && <RefreshCw className="w-3 h-3 animate-spin" />}
          </button>
        )}

        {/* Last sync */}
        {lastSyncTime && (
          <span className="text-slate-400 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastSyncTime.toLocaleTimeString()}
          </span>
        )}

        {/* Online status */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
          isOnline ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
