/**
 * IndexedDB Storage for Offline-First eMarketWaka Commerce
 * 
 * Database Structure:
 * - offlineActions: Queued mutations waiting to sync
 * - cachedData: Read-only cached data per tenant
 * - syncMeta: Sync status and metadata
 * 
 * Key Design Decisions:
 * - Every record includes tenantId for isolation
 * - Composite indexes for efficient tenant-scoped queries
 * - Automatic cleanup of old synced actions
 */

import { QueuedAction, CachedData, SyncStatus, SYNC_CONFIG } from './strategy'

const DB_NAME = 'saas-core-offline'
const DB_VERSION = 1

// Store names
const STORES = {
  ACTIONS: 'offlineActions',
  CACHE: 'cachedData',
  META: 'syncMeta'
}

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Initialize IndexedDB database
 */
export function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error)
      reject(request.error)
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Offline Actions Store
      if (!db.objectStoreNames.contains(STORES.ACTIONS)) {
        const actionStore = db.createObjectStore(STORES.ACTIONS, { keyPath: 'id' })
        // Index for querying by tenant
        actionStore.createIndex('byTenant', 'tenantId', { unique: false })
        // Index for querying pending actions
        actionStore.createIndex('byStatus', 'syncStatus', { unique: false })
        // Composite index for tenant + status
        actionStore.createIndex('byTenantStatus', ['tenantId', 'syncStatus'], { unique: false })
        // Index for ordering by timestamp
        actionStore.createIndex('byTimestamp', 'clientTimestamp', { unique: false })
      }
      
      // Cached Data Store
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: ['tenantId', 'key'] })
        // Index for querying by tenant
        cacheStore.createIndex('byTenant', 'tenantId', { unique: false })
        // Index for cleanup of expired data
        cacheStore.createIndex('byExpiry', 'expiresAt', { unique: false })
      }
      
      // Sync Metadata Store
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' })
      }
    }
  })
  
  return dbPromise
}

/**
 * Get database instance
 */
async function getDB(): Promise<IDBDatabase> {
  return initDB()
}

// ============================================================================
// QUEUED ACTIONS OPERATIONS
// ============================================================================

/**
 * Add an action to the offline queue
 */
export async function queueAction(action: Omit<QueuedAction, 'id' | 'clientTimestamp' | 'syncStatus' | 'retryCount'>): Promise<QueuedAction> {
  const db = await getDB()
  
  const fullAction: QueuedAction = {
    ...action,
    id: crypto.randomUUID(),
    clientTimestamp: Date.now(),
    syncStatus: 'pending',
    retryCount: 0
  }
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readwrite')
    const store = tx.objectStore(STORES.ACTIONS)
    const request = store.add(fullAction)
    
    request.onsuccess = () => resolve(fullAction)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all pending actions for a tenant (ordered by timestamp)
 */
export async function getPendingActions(tenantId: string): Promise<QueuedAction[]> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readonly')
    const store = tx.objectStore(STORES.ACTIONS)
    const index = store.index('byTenantStatus')
    const request = index.getAll(IDBKeyRange.only([tenantId, 'pending']))
    
    request.onsuccess = () => {
      const actions = request.result as QueuedAction[]
      // Sort by timestamp
      actions.sort((a, b) => a.clientTimestamp - b.clientTimestamp)
      resolve(actions)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all actions for a tenant (any status)
 */
export async function getAllActions(tenantId: string): Promise<QueuedAction[]> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readonly')
    const store = tx.objectStore(STORES.ACTIONS)
    const index = store.index('byTenant')
    const request = index.getAll(IDBKeyRange.only(tenantId))
    
    request.onsuccess = () => {
      const actions = request.result as QueuedAction[]
      actions.sort((a, b) => a.clientTimestamp - b.clientTimestamp)
      resolve(actions)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Update action status
 */
export async function updateActionStatus(
  actionId: string, 
  status: SyncStatus, 
  errorMessage?: string,
  conflictData?: any
): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readwrite')
    const store = tx.objectStore(STORES.ACTIONS)
    const getRequest = store.get(actionId)
    
    getRequest.onsuccess = () => {
      const action = getRequest.result as QueuedAction
      if (!action) {
        reject(new Error('Action not found'))
        return
      }
      
      action.syncStatus = status
      if (status === 'syncing' || status === 'failed') {
        action.retryCount += 1
        action.lastRetryAt = Date.now()
      }
      if (errorMessage) action.errorMessage = errorMessage
      if (conflictData) action.conflictData = conflictData
      
      const putRequest = store.put(action)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * Mark action as synced and optionally remove it
 */
export async function markActionSynced(actionId: string, remove: boolean = false): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readwrite')
    const store = tx.objectStore(STORES.ACTIONS)
    
    if (remove) {
      const request = store.delete(actionId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } else {
      const getRequest = store.get(actionId)
      getRequest.onsuccess = () => {
        const action = getRequest.result as QueuedAction
        if (action) {
          action.syncStatus = 'synced'
          const putRequest = store.put(action)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}

/**
 * Delete an action from the queue
 */
export async function deleteAction(actionId: string): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readwrite')
    const store = tx.objectStore(STORES.ACTIONS)
    const request = store.delete(actionId)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all actions for a tenant
 */
export async function clearActions(tenantId: string, statusFilter?: SyncStatus): Promise<number> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readwrite')
    const store = tx.objectStore(STORES.ACTIONS)
    const index = store.index('byTenant')
    const request = index.openCursor(IDBKeyRange.only(tenantId))
    let deletedCount = 0
    
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const action = cursor.value as QueuedAction
        if (!statusFilter || action.syncStatus === statusFilter) {
          cursor.delete()
          deletedCount++
        }
        cursor.continue()
      } else {
        resolve(deletedCount)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Retry all failed actions for a tenant
 */
export async function retryFailedActions(tenantId: string): Promise<number> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIONS, 'readwrite')
    const store = tx.objectStore(STORES.ACTIONS)
    const index = store.index('byTenantStatus')
    const request = index.openCursor(IDBKeyRange.only([tenantId, 'failed']))
    let retriedCount = 0
    
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const action = cursor.value as QueuedAction
        action.syncStatus = 'pending'
        action.retryCount = 0
        action.errorMessage = undefined
        cursor.update(action)
        retriedCount++
        cursor.continue()
      } else {
        resolve(retriedCount)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// ============================================================================
// CACHED DATA OPERATIONS
// ============================================================================

/**
 * Cache data for a tenant
 */
export async function cacheData(
  tenantId: string, 
  key: string, 
  data: any, 
  ttlMs: number = SYNC_CONFIG.cacheTTL.dashboardData
): Promise<void> {
  const db = await getDB()
  
  const cached: CachedData = {
    tenantId,
    key,
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  }
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite')
    const store = tx.objectStore(STORES.CACHE)
    const request = store.put(cached)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get cached data for a tenant
 */
export async function getCachedData<T = any>(tenantId: string, key: string): Promise<T | null> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readonly')
    const store = tx.objectStore(STORES.CACHE)
    const request = store.get([tenantId, key])
    
    request.onsuccess = () => {
      const cached = request.result as CachedData | undefined
      if (!cached) {
        resolve(null)
        return
      }
      
      // Check if expired
      if (cached.expiresAt < Date.now()) {
        // Delete expired data
        const deleteTx = db.transaction(STORES.CACHE, 'readwrite')
        deleteTx.objectStore(STORES.CACHE).delete([tenantId, key])
        resolve(null)
        return
      }
      
      resolve(cached.data as T)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear cached data for a tenant
 */
export async function clearCache(tenantId: string): Promise<number> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite')
    const store = tx.objectStore(STORES.CACHE)
    const index = store.index('byTenant')
    const request = index.openCursor(IDBKeyRange.only(tenantId))
    let deletedCount = 0
    
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        cursor.delete()
        deletedCount++
        cursor.continue()
      } else {
        resolve(deletedCount)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const db = await getDB()
  const now = Date.now()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE, 'readwrite')
    const store = tx.objectStore(STORES.CACHE)
    const index = store.index('byExpiry')
    const request = index.openCursor(IDBKeyRange.upperBound(now))
    let deletedCount = 0
    
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        cursor.delete()
        deletedCount++
        cursor.continue()
      } else {
        resolve(deletedCount)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// ============================================================================
// SYNC METADATA OPERATIONS
// ============================================================================

/**
 * Get sync metadata
 */
export async function getSyncMeta(key: string): Promise<any> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.META, 'readonly')
    const store = tx.objectStore(STORES.META)
    const request = store.get(key)
    
    request.onsuccess = () => resolve(request.result?.value)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Set sync metadata
 */
export async function setSyncMeta(key: string, value: any): Promise<void> {
  const db = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.META, 'readwrite')
    const store = tx.objectStore(STORES.META)
    const request = store.put({ key, value })
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get sync statistics for a tenant
 */
export async function getSyncStats(tenantId: string): Promise<{
  pending: number
  syncing: number
  synced: number
  failed: number
  conflict: number
  total: number
}> {
  const actions = await getAllActions(tenantId)
  
  return {
    pending: actions.filter(a => a.syncStatus === 'pending').length,
    syncing: actions.filter(a => a.syncStatus === 'syncing').length,
    synced: actions.filter(a => a.syncStatus === 'synced').length,
    failed: actions.filter(a => a.syncStatus === 'failed').length,
    conflict: actions.filter(a => a.syncStatus === 'conflict').length,
    total: actions.length
  }
}

/**
 * Check if there are pending actions to sync
 */
export async function hasPendingActions(tenantId: string): Promise<boolean> {
  const pending = await getPendingActions(tenantId)
  return pending.length > 0
}
