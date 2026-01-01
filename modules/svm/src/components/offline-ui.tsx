/**
 * SVM Offline UI Components
 * 
 * React components for offline behavior feedback.
 * 
 * Components:
 * - OfflineBanner: Shows when user goes offline
 * - ConnectionStatus: Visual indicator of connection state
 * - OfflineBlocker: Blocks actions that require connectivity
 * - SyncStatus: Shows pending sync actions
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SLOW' | 'UNKNOWN'

export interface OfflineContextValue {
  isOnline: boolean
  connectionStatus: ConnectionStatus
  pendingActions: number
  lastOnline: Date | null
}

// ============================================================================
// CONTEXT
// ============================================================================

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  connectionStatus: 'ONLINE',
  pendingActions: 0,
  lastOnline: null
})

export function useOffline(): OfflineContextValue {
  return useContext(OfflineContext)
}

// ============================================================================
// PROVIDER
// ============================================================================

interface OfflineProviderProps {
  children: React.ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps): JSX.Element {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('ONLINE')
  const [pendingActions, setPendingActions] = useState(0)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  useEffect(() => {
    // Initialize with current state
    setIsOnline(navigator.onLine)
    setConnectionStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE')

    const handleOnline = () => {
      setIsOnline(true)
      setConnectionStatus('ONLINE')
      setLastOnline(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionStatus('OFFLINE')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection quality if available
    const connection = (navigator as any).connection
    if (connection) {
      const handleConnectionChange = () => {
        if (!navigator.onLine) {
          setConnectionStatus('OFFLINE')
          return
        }
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setConnectionStatus('SLOW')
        } else {
          setConnectionStatus('ONLINE')
        }
      }
      
      connection.addEventListener('change', handleConnectionChange)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check for pending actions in localStorage
  useEffect(() => {
    const checkPending = () => {
      try {
        const queue = localStorage.getItem('svm_offline_queue')
        if (queue) {
          const parsed = JSON.parse(queue)
          setPendingActions(Array.isArray(parsed) ? parsed.length : 0)
        }
      } catch {
        setPendingActions(0)
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 5000)
    return () => clearInterval(interval)
  }, [])

  const value: OfflineContextValue = {
    isOnline,
    connectionStatus,
    pendingActions,
    lastOnline
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}

// ============================================================================
// OFFLINE BANNER
// ============================================================================

interface OfflineBannerProps {
  className?: string
}

export function OfflineBanner({ className = '' }: OfflineBannerProps): JSX.Element | null {
  const { isOnline, connectionStatus, pendingActions } = useOffline()
  const [dismissed, setDismissed] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  // Show reconnected message briefly
  useEffect(() => {
    if (isOnline && !dismissed) {
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, dismissed])

  // Don't show if online and not reconnected
  if (isOnline && !showReconnected) {
    return null
  }

  const bannerStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: '14px',
    fontWeight: 500,
    animation: 'slideUp 0.3s ease-out'
  }

  const offlineStyles: React.CSSProperties = {
    ...bannerStyles,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #FCD34D'
  }

  const onlineStyles: React.CSSProperties = {
    ...bannerStyles,
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    border: '1px solid #6EE7B7'
  }

  const slowStyles: React.CSSProperties = {
    ...bannerStyles,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    border: '1px solid #FCA5A5'
  }

  if (showReconnected) {
    return (
      <div style={onlineStyles} className={className} data-testid="online-banner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>You're back online!</span>
        {pendingActions > 0 && (
          <span style={{ opacity: 0.8 }}>({pendingActions} actions syncing...)</span>
        )}
      </div>
    )
  }

  if (connectionStatus === 'SLOW') {
    return (
      <div style={slowStyles} className={className} data-testid="slow-connection-banner">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>Slow connection detected</span>
        <button 
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div style={offlineStyles} className={className} data-testid="offline-banner">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l6.921 6.922c.05.062.105.118.168.167l6.91 6.911a1 1 0 001.414-1.414l-.675-.675a9.001 9.001 0 00-.668-11.982A1 1 0 1014.95 5.05a7.002 7.002 0 01.657 9.143l-1.435-1.435a5.002 5.002 0 00-.636-6.294A1 1 0 0012.12 7.88a3 3 0 01.587 3.415l-1.992-1.992a.922.922 0 00-.018-.018l-6.99-6.991zM3.238 8.187a1 1 0 00-1.933.518 9 9 0 003.399 6.46l-1.414 1.414a1 1 0 001.414 1.414l1.746-1.746a1 1 0 00-.275-1.655 7.001 7.001 0 01-2.937-5.405zM6.5 12a1 1 0 00-1.707.707A5 5 0 009.5 17a1 1 0 100-2 3 3 0 01-3-3z" clipRule="evenodd" />
      </svg>
      <div>
        <div>You're offline</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          Browsing available • Orders require internet
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CONNECTION INDICATOR
// ============================================================================

interface ConnectionIndicatorProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConnectionIndicator({ 
  showLabel = false, 
  size = 'md',
  className = '' 
}: ConnectionIndicatorProps): JSX.Element {
  const { connectionStatus } = useOffline()

  const sizes = {
    sm: { dot: 8, text: 12 },
    md: { dot: 10, text: 14 },
    lg: { dot: 12, text: 16 }
  }

  const colors = {
    ONLINE: '#10B981',
    OFFLINE: '#EF4444',
    SLOW: '#F59E0B',
    UNKNOWN: '#6B7280'
  }

  const labels = {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    SLOW: 'Slow',
    UNKNOWN: 'Unknown'
  }

  const dotStyle: React.CSSProperties = {
    width: sizes[size].dot,
    height: sizes[size].dot,
    borderRadius: '50%',
    backgroundColor: colors[connectionStatus],
    animation: connectionStatus === 'ONLINE' ? 'pulse 2s infinite' : 'none'
  }

  return (
    <div 
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      data-testid="connection-indicator"
      aria-label={`Connection status: ${labels[connectionStatus]}`}
    >
      <div style={dotStyle} />
      {showLabel && (
        <span style={{ fontSize: sizes[size].text, color: colors[connectionStatus] }}>
          {labels[connectionStatus]}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// OFFLINE BLOCKER
// ============================================================================

interface OfflineBlockerProps {
  children: React.ReactNode
  action: string
  fallbackMessage?: string
  onBlocked?: () => void
}

export function OfflineBlocker({
  children,
  action,
  fallbackMessage,
  onBlocked
}: OfflineBlockerProps): JSX.Element {
  const { isOnline } = useOffline()
  const [showBlockedMessage, setShowBlockedMessage] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isOnline) {
      e.preventDefault()
      e.stopPropagation()
      setShowBlockedMessage(true)
      onBlocked?.()
      
      // Hide message after 3 seconds
      setTimeout(() => setShowBlockedMessage(false), 3000)
    }
  }, [isOnline, onBlocked])

  const blockedMessageStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 10
  }

  const defaultMessage = `${action} requires internet connection`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={handleClick} style={{ opacity: isOnline ? 1 : 0.5 }}>
        {children}
      </div>
      {showBlockedMessage && (
        <div style={blockedMessageStyle} data-testid="blocked-message">
          {fallbackMessage || defaultMessage}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SYNC STATUS
// ============================================================================

interface SyncStatusProps {
  className?: string
}

export function SyncStatus({ className = '' }: SyncStatusProps): JSX.Element | null {
  const { isOnline, pendingActions } = useOffline()
  const [syncing, setSyncing] = useState(false)

  // Don't show if no pending actions
  if (pendingActions === 0) {
    return null
  }

  const handleSync = async () => {
    if (!isOnline || syncing) return
    
    setSyncing(true)
    // Sync logic would go here
    setTimeout(() => setSyncing(false), 2000)
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: isOnline ? '#DBEAFE' : '#FEF3C7',
    borderRadius: '6px',
    fontSize: '13px'
  }

  return (
    <div style={containerStyle} className={className} data-testid="sync-status">
      {syncing ? (
        <>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <span>{pendingActions} action{pendingActions > 1 ? 's' : ''} pending</span>
          {isOnline && (
            <button
              onClick={handleSync}
              style={{
                padding: '4px 8px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Sync now
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// OFFLINE PAGE
// ============================================================================

export function OfflinePage(): JSX.Element {
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#F9FAFB'
  }

  const iconStyle: React.CSSProperties = {
    width: 80,
    height: 80,
    marginBottom: 24,
    color: '#9CA3AF'
  }

  return (
    <div style={pageStyle} data-testid="offline-page">
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-.586-7.071m.586 7.071l-2.829-2.829M3 3l18 18" />
      </svg>
      
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
        You're offline
      </h1>
      
      <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 24, maxWidth: 400 }}>
        Check your internet connection and try again.
        Your cart and wishlist are saved locally.
      </p>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Try again
        </button>
        
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#111827',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Go back
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// CSS KEYFRAMES (add to global styles)
// ============================================================================

export const offlineStyles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to check if action can be performed
 */
export function useCanPerformAction(action: string): boolean {
  const { isOnline } = useOffline()
  
  const offlineActions = [
    'VIEW_PRODUCTS', 'VIEW_PRODUCT_DETAILS', 'VIEW_CATEGORIES',
    'VIEW_CART', 'ADD_TO_CART', 'UPDATE_CART_QUANTITY', 'REMOVE_FROM_CART',
    'VIEW_WISHLIST', 'ADD_TO_WISHLIST', 'VIEW_ORDER_HISTORY', 
    'VIEW_SAVED_ADDRESSES', 'SEARCH_CACHED'
  ]
  
  if (offlineActions.includes(action)) {
    return true
  }
  
  return isOnline
}

/**
 * Hook to register service worker
 */
export function useServiceWorker(): { registered: boolean; error: Error | null } {
  const [registered, setRegistered] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
          setRegistered(true)
        })
        .catch((err) => {
          console.error('SW registration failed:', err)
          setError(err)
        })
    }
  }, [])

  return { registered, error }
}
