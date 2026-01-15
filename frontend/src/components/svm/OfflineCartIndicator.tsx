/**
 * Offline Cart Indicator Component (Wave G2)
 * 
 * Visual indicators for cart persistence status and conflicts.
 * Nigeria-appropriate mobile-first design.
 * 
 * @module components/svm/OfflineCartIndicator
 */

'use client'

import { useState } from 'react'
import { formatConflictNotice, type CartConflict, type CartStatusSignal } from '@/lib/svm'

interface OfflineCartIndicatorProps {
  statusSignal: CartStatusSignal
  conflicts?: CartConflict[]
  onRestore?: () => void
  onDismiss?: () => void
  className?: string
}

export function OfflineCartIndicator({
  statusSignal,
  conflicts = [],
  onRestore,
  onDismiss,
  className = ''
}: OfflineCartIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (statusSignal.status === 'synced' && conflicts.length === 0) {
    return null
  }
  
  const getStatusColor = () => {
    switch (statusSignal.status) {
      case 'saved':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'conflict':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'restored':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }
  
  return (
    <div className={`rounded-lg border p-3 ${getStatusColor()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={statusSignal.status}>
            {statusSignal.icon}
          </span>
          <div>
            <p className="font-medium text-sm">{statusSignal.message}</p>
            {statusSignal.details && (
              <p className="text-xs opacity-75 mt-0.5">{statusSignal.details}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRestore && statusSignal.status === 'saved' && (
            <button
              onClick={onRestore}
              className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Restore
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-current opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {conflicts.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium underline hover:no-underline"
          >
            {isExpanded ? 'Hide details' : `View ${conflicts.length} update(s)`}
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {conflicts.map((conflict, index) => {
                const notice = formatConflictNotice(conflict)
                return (
                  <div
                    key={`${conflict.productId}-${index}`}
                    className={`p-2 rounded text-xs ${
                      notice.severity === 'error' ? 'bg-red-100' :
                      notice.severity === 'warning' ? 'bg-amber-100' :
                      'bg-blue-100'
                    }`}
                  >
                    <p className="font-medium">{notice.title}</p>
                    <p className="opacity-75">{notice.description}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SavedCartBannerProps {
  itemCount: number
  savedAge: string
  onRestore: () => void
  onDiscard: () => void
  isRestoring?: boolean
}

export function SavedCartBanner({
  itemCount,
  savedAge,
  onRestore,
  onDiscard,
  isRestoring = false
}: SavedCartBannerProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label="saved">💾</span>
        <div className="flex-1">
          <p className="font-medium text-blue-900">
            You have a saved cart
          </p>
          <p className="text-sm text-blue-700">
            {itemCount} item{itemCount !== 1 ? 's' : ''} saved {savedAge}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={onRestore}
          disabled={isRestoring}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRestoring ? 'Restoring...' : 'Restore Cart'}
        </button>
        <button
          onClick={onDiscard}
          disabled={isRestoring}
          className="px-4 py-2 border border-blue-300 text-blue-700 font-medium rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Fresh
        </button>
      </div>
    </div>
  )
}

interface ConflictResolutionCardProps {
  conflict: CartConflict
  onAccept: () => void
  onRemove: () => void
}

export function ConflictResolutionCard({
  conflict,
  onAccept,
  onRemove
}: ConflictResolutionCardProps) {
  const notice = formatConflictNotice(conflict)
  
  const getBgColor = () => {
    switch (notice.severity) {
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-amber-50 border-amber-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }
  
  const getIcon = () => {
    switch (conflict.type) {
      case 'price_changed':
        return '💰'
      case 'stock_changed':
        return '📦'
      case 'item_removed':
      case 'item_unavailable':
        return '❌'
      default:
        return '⚠️'
    }
  }
  
  return (
    <div className={`rounded-lg border p-3 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl" role="img" aria-label={conflict.type}>
          {getIcon()}
        </span>
        <div className="flex-1">
          <p className="font-medium text-sm">{notice.title}</p>
          <p className="text-xs opacity-75 mt-0.5">{notice.description}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        {conflict.type !== 'item_removed' && conflict.type !== 'item_unavailable' && conflict.newValue !== 0 && (
          <button
            onClick={onAccept}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {notice.actionLabel}
          </button>
        )}
        <button
          onClick={onRemove}
          className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          Remove Item
        </button>
      </div>
    </div>
  )
}

export function OfflineStatusBadge({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null
  
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
      Offline
    </div>
  )
}

export function SyncStatusIndicator({ status }: { status: 'synced' | 'syncing' | 'error' }) {
  const getConfig = () => {
    switch (status) {
      case 'synced':
        return { icon: '✓', color: 'text-green-600', label: 'Synced' }
      case 'syncing':
        return { icon: '↻', color: 'text-blue-600 animate-spin', label: 'Syncing' }
      case 'error':
        return { icon: '!', color: 'text-red-600', label: 'Sync error' }
    }
  }
  
  const config = getConfig()
  
  return (
    <div className={`inline-flex items-center gap-1 text-xs ${config.color}`}>
      <span className={status === 'syncing' ? 'animate-spin' : ''}>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  )
}
