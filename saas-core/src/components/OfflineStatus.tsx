'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useOnlineStatus, useServiceWorker, useOfflineQueue } from '@/lib/offline/hooks'

interface OfflineStatusBarProps {
  tenantId: string
}

export function OfflineStatusBar({ tenantId }: OfflineStatusBarProps) {
  const isOnline = useOnlineStatus()
  const { triggerSync, updateAvailable, update } = useServiceWorker()
  const { stats, retryFailed, refresh, loading } = useOfflineQueue(tenantId)
  const [syncing, setSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && stats.pending > 0) {
      handleSync()
    }
  }, [isOnline, stats.pending])

  async function handleSync() {
    setSyncing(true)
    try {
      triggerSync()
      await new Promise(resolve => setTimeout(resolve, 2000))
      await refresh()
    } finally {
      setSyncing(false)
    }
  }

  async function handleRetry() {
    setSyncing(true)
    try {
      await retryFailed()
      triggerSync()
      await new Promise(resolve => setTimeout(resolve, 2000))
      await refresh()
    } finally {
      setSyncing(false)
    }
  }

  // Don't show if online and no pending actions
  if (isOnline && stats.pending === 0 && stats.failed === 0 && !updateAvailable) {
    return null
  }

  return (
    <>
      {/* Main Status Bar */}
      <div 
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 cursor-pointer transition-all ${
          isOnline 
            ? stats.failed > 0 
              ? 'bg-amber-500 text-white'
              : 'bg-green-500 text-white'
            : 'bg-slate-800 text-white'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Online/Offline Icon */}
        {isOnline ? (
          <Wifi className="w-5 h-5" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
        
        {/* Status Text */}
        <span className="text-sm font-medium">
          {!isOnline ? (
            'Offline'
          ) : stats.pending > 0 ? (
            `${stats.pending} pending sync${stats.pending > 1 ? 's' : ''}`
          ) : stats.failed > 0 ? (
            `${stats.failed} failed action${stats.failed > 1 ? 's' : ''}`
          ) : updateAvailable ? (
            'Update available'
          ) : (
            'Online'
          )}
        </span>
        
        {/* Sync Button */}
        {(stats.pending > 0 || stats.failed > 0) && isOnline && (
          <button
            onClick={(e) => { e.stopPropagation(); handleSync() }}
            disabled={syncing}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        )}
        
        {/* Update Button */}
        {updateAvailable && (
          <button
            onClick={(e) => { e.stopPropagation(); update() }}
            className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition"
          >
            Update
          </button>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Sync Status</h3>
            <p className="text-sm text-slate-500">
              {isOnline ? 'Connected' : 'Working offline'}
            </p>
          </div>
          
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <p className="text-lg font-bold text-amber-500">{stats.pending}</p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <p className="text-lg font-bold text-green-500">{stats.synced}</p>
                    <p className="text-xs text-slate-500">Synced</p>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <p className="text-lg font-bold text-red-500">{stats.failed}</p>
                    <p className="text-xs text-slate-500">Failed</p>
                  </div>
                </div>

                {/* Actions */}
                {stats.failed > 0 && isOnline && (
                  <button
                    onClick={handleRetry}
                    disabled={syncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    Retry Failed Actions
                  </button>
                )}

                {/* Offline Message */}
                {!isOnline && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <CloudOff className="w-5 h-5" />
                      <span className="text-sm">Changes will sync when online</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Compact offline indicator for headers
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  
  if (isOnline) return null
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-white rounded-full text-sm">
      <WifiOff className="w-4 h-4" />
      <span>Offline</span>
    </div>
  )
}
