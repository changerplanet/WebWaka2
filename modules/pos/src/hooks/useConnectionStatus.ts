/**
 * Connection Status Hook
 * 
 * Tracks online/offline state with debouncing
 */

import { useState, useEffect, useCallback } from 'react'

export interface ConnectionState {
  isOnline: boolean
  lastOnlineAt: Date | null
  lastOfflineAt: Date | null
}

export function useConnectionStatus() {
  const [state, setState] = useState<ConnectionState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastOnlineAt: null,
    lastOfflineAt: null
  })

  const handleOnline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: true,
      lastOnlineAt: new Date()
    }))
  }, [])

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
      lastOfflineAt: new Date()
    }))
  }, [])

  useEffect(() => {
    // Set initial state
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine
    }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return state
}
