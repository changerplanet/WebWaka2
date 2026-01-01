/**
 * Connection Status Indicator
 * 
 * Shows online/offline state with pending sync count
 */

'use client'

import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { useOfflineQueue } from '../../hooks/useOfflineQueue'

export function ConnectionStatus() {
  const { isOnline } = useConnectionStatus()
  const { pendingCount } = useOfflineQueue()

  return (
    <div 
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        ${isOnline 
          ? 'bg-green-100 text-green-800' 
          : pendingCount > 0 
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-600'
        }
      `}
      data-testid="connection-status"
    >
      <span 
        className={`
          w-2 h-2 rounded-full
          ${isOnline ? 'bg-green-500' : 'bg-amber-500'}
        `}
      />
      <span>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {!isOnline && pendingCount > 0 && (
        <span className="bg-amber-200 px-1.5 py-0.5 rounded text-xs">
          {pendingCount} pending
        </span>
      )}
    </div>
  )
}
