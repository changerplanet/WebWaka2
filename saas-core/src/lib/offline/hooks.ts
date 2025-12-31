/**
 * React Hooks for Offline-First functionality
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  queueAction, 
  getPendingActions, 
  getAllActions,
  retryFailedActions, 
  clearActions,
  getSyncStats,
  cacheData,
  getCachedData,
  initDB
} from './indexeddb'
import { 
  QueuedAction, 
  OfflineActionType, 
  isOfflineAllowed,
  calculateRetryDelay 
} from './strategy'

// ============================================================================
// ONLINE STATUS HOOK
// ============================================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

// ============================================================================
// SERVICE WORKER HOOK
// ============================================================================

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registered')
          setRegistration(reg)
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch(err => console.error('SW registration failed:', err))
      
      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, actionId, tenantId, error, conflictData } = event.data || {}
        
        // Dispatch custom events for the app to handle
        window.dispatchEvent(new CustomEvent('sw-message', {
          detail: { type, actionId, tenantId, error, conflictData }
        }))
      })
    }
  }, [])
  
  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [registration])
  
  const triggerSync = useCallback(() => {
    if (registration) {
      const channel = new MessageChannel()
      registration.active?.postMessage({ type: 'TRIGGER_SYNC' }, [channel.port2])
    }
  }, [registration])
  
  const clearTenantCache = useCallback((tenantSlug: string) => {
    if (registration) {
      const channel = new MessageChannel()
      registration.active?.postMessage(
        { type: 'CLEAR_TENANT_CACHE', data: { tenantSlug } },
        [channel.port2]
      )
    }
  }, [registration])
  
  return {
    registration,
    updateAvailable,
    update,
    triggerSync,
    clearTenantCache
  }
}

// ============================================================================
// OFFLINE QUEUE HOOK
// ============================================================================

export function useOfflineQueue(tenantId: string) {
  const [actions, setActions] = useState<QueuedAction[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    conflict: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const isOnline = useOnlineStatus()
  
  // Load actions on mount and when online status changes
  const refresh = useCallback(async () => {
    try {
      await initDB()
      const [allActions, syncStats] = await Promise.all([
        getAllActions(tenantId),
        getSyncStats(tenantId)
      ])
      setActions(allActions)
      setStats(syncStats)
    } catch (error) {
      console.error('Failed to load offline actions:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])
  
  useEffect(() => {
    refresh()
  }, [refresh, isOnline])
  
  // Listen for SW sync events
  useEffect(() => {
    const handleSWMessage = (event: CustomEvent) => {
      const { type, tenantId: msgTenantId } = event.detail
      if (msgTenantId === tenantId || !msgTenantId) {
        refresh()
      }
    }
    
    window.addEventListener('sw-message', handleSWMessage as EventListener)
    return () => window.removeEventListener('sw-message', handleSWMessage as EventListener)
  }, [tenantId, refresh])
  
  // Queue a new action
  const queue = useCallback(async (
    type: OfflineActionType,
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    payload: Record<string, any>,
    userId: string,
    resourceId?: string,
    resourceVersion?: number
  ) => {
    if (!isOfflineAllowed(type)) {
      throw new Error(`Action type ${type} is not allowed offline`)
    }
    
    await initDB()
    const action = await queueAction({
      tenantId,
      userId,
      type,
      endpoint,
      method,
      payload,
      resourceId,
      resourceVersion
    })
    
    await refresh()
    return action
  }, [tenantId, refresh])
  
  // Retry failed actions
  const retryFailed = useCallback(async () => {
    await initDB()
    const count = await retryFailedActions(tenantId)
    await refresh()
    return count
  }, [tenantId, refresh])
  
  // Clear actions by status
  const clear = useCallback(async (status?: 'synced' | 'failed') => {
    await initDB()
    const count = await clearActions(tenantId, status)
    await refresh()
    return count
  }, [tenantId, refresh])
  
  return {
    actions,
    stats,
    loading,
    isOnline,
    queue,
    retryFailed,
    clear,
    refresh
  }
}

// ============================================================================
// CACHED DATA HOOK
// ============================================================================

export function useCachedData<T>(tenantId: string, key: string, ttlMs?: number) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function load() {
      try {
        await initDB()
        const cached = await getCachedData<T>(tenantId, key)
        setData(cached)
      } catch (error) {
        console.error('Failed to load cached data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId, key])
  
  const save = useCallback(async (newData: T) => {
    try {
      await initDB()
      await cacheData(tenantId, key, newData, ttlMs)
      setData(newData)
    } catch (error) {
      console.error('Failed to cache data:', error)
      throw error
    }
  }, [tenantId, key, ttlMs])
  
  return { data, loading, save }
}

// ============================================================================
// OFFLINE-FIRST API HOOK
// ============================================================================

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  offlineAction?: {
    type: OfflineActionType
    userId: string
    resourceId?: string
    resourceVersion?: number
  }
  cacheKey?: string
  cacheTTL?: number
}

export function useOfflineApi(tenantId: string) {
  const isOnline = useOnlineStatus()
  
  const request = useCallback(async <T = any>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<{ data: T | null; fromCache: boolean; queued: boolean; error?: string }> => {
    const { method = 'GET', body, offlineAction, cacheKey, cacheTTL } = options
    
    // Initialize DB
    await initDB()
    
    // For GET requests, try cache first if offline
    if (method === 'GET' && cacheKey) {
      const cached = await getCachedData<T>(tenantId, cacheKey)
      
      if (!isOnline && cached) {
        return { data: cached, fromCache: true, queued: false }
      }
      
      if (isOnline) {
        try {
          const response = await fetch(endpoint, { method })
          if (response.ok) {
            const data = await response.json()
            // Cache the response
            await cacheData(tenantId, cacheKey, data, cacheTTL)
            return { data, fromCache: false, queued: false }
          }
        } catch (error) {
          // Network error, return cache if available
          if (cached) {
            return { data: cached, fromCache: true, queued: false }
          }
          return { data: null, fromCache: false, queued: false, error: 'Network error' }
        }
      }
      
      return { data: cached, fromCache: !!cached, queued: false }
    }
    
    // For mutations, try online first, queue if offline
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const mutationMethod = method as 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      if (isOnline) {
        try {
          const response = await fetch(endpoint, {
            method: mutationMethod,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
          })
          
          const data = await response.json()
          return { data, fromCache: false, queued: false }
        } catch (error) {
          // Network error - queue if offline action provided
          if (offlineAction) {
            await queueAction({
              tenantId,
              userId: offlineAction.userId,
              type: offlineAction.type,
              endpoint,
              method: mutationMethod,
              payload: body || {},
              resourceId: offlineAction.resourceId,
              resourceVersion: offlineAction.resourceVersion
            })
            return { data: null, fromCache: false, queued: true }
          }
          return { data: null, fromCache: false, queued: false, error: 'Network error' }
        }
      } else if (offlineAction) {
        // Offline - queue the action
        await queueAction({
          tenantId,
          userId: offlineAction.userId,
          type: offlineAction.type,
          endpoint,
          method: mutationMethod,
          payload: body || {},
          resourceId: offlineAction.resourceId,
          resourceVersion: offlineAction.resourceVersion
        })
        return { data: null, fromCache: false, queued: true }
      }
      
      return { data: null, fromCache: false, queued: false, error: 'Offline and no queue configured' }
    }
    
    return { data: null, fromCache: false, queued: false, error: 'Invalid request' }
  }, [tenantId, isOnline])
  
  return { request, isOnline }
}
