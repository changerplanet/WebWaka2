/**
 * POS Offline Store - IndexedDB Operations
 * 
 * Handles all local data persistence for offline-first POS
 */

// IndexedDB database name and version
const DB_NAME = 'pos-offline-store'
const DB_VERSION = 1

// Store names
export const STORES = {
  PRODUCTS: 'products',
  CART: 'cart',
  HELD_SALES: 'held-sales',
  PENDING_SYNC: 'pending-sync',
  COMPLETED_SALES: 'completed-sales',
  SESSION: 'session'
} as const

export type StoreName = typeof STORES[keyof typeof STORES]

// Types
export interface OfflineProduct {
  id: string
  name: string
  sku: string
  price: number
  imageUrl?: string
  category?: string
  inStock: boolean
  cachedAt: number
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  productSku?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  addedAt: number
}

export interface HeldSale {
  id: string
  items: CartItem[]
  subtotal: number
  note?: string
  customerId?: string
  heldAt: number
  heldBy: string
}

export interface PendingSyncItem {
  id: string
  type: 'SALE' | 'REFUND' | 'REGISTER_OPEN' | 'REGISTER_CLOSE' | 'SHIFT_START' | 'SHIFT_END'
  payload: Record<string, unknown>
  createdAt: number
  retryCount: number
  lastError?: string
}

export interface POSSession {
  registerId?: string
  sessionId?: string
  shiftId?: string
  staffId: string
  staffName: string
  openingCash?: number
  isOpen: boolean
}

/**
 * Initialize IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Products store - cached product catalog
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' })
        productStore.createIndex('category', 'category', { unique: false })
        productStore.createIndex('sku', 'sku', { unique: true })
      }

      // Cart store - current cart items
      if (!db.objectStoreNames.contains(STORES.CART)) {
        db.createObjectStore(STORES.CART, { keyPath: 'id' })
      }

      // Held sales store - suspended sales
      if (!db.objectStoreNames.contains(STORES.HELD_SALES)) {
        const heldStore = db.createObjectStore(STORES.HELD_SALES, { keyPath: 'id' })
        heldStore.createIndex('heldAt', 'heldAt', { unique: false })
      }

      // Pending sync store - items waiting to sync
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' })
        syncStore.createIndex('type', 'type', { unique: false })
        syncStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Completed sales store - local copy of completed sales
      if (!db.objectStoreNames.contains(STORES.COMPLETED_SALES)) {
        const salesStore = db.createObjectStore(STORES.COMPLETED_SALES, { keyPath: 'id' })
        salesStore.createIndex('completedAt', 'completedAt', { unique: false })
      }

      // Session store - current POS session
      if (!db.objectStoreNames.contains(STORES.SESSION)) {
        db.createObjectStore(STORES.SESSION, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Get a single item from a store
 */
export async function getItem<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T | undefined)
  })
}

/**
 * Get all items from a store
 */
export async function getAllItems<T>(storeName: StoreName): Promise<T[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as T[])
  })
}

/**
 * Put an item into a store (add or update)
 */
export async function putItem<T>(storeName: StoreName, item: T): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Delete an item from a store
 */
export async function deleteItem(storeName: StoreName, key: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Count items in a store
 */
export async function countItems(storeName: StoreName): Promise<number> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.count()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Add item to pending sync queue
 */
export async function addToPendingSync(
  type: PendingSyncItem['type'],
  payload: Record<string, unknown>
): Promise<string> {
  const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const item: PendingSyncItem = {
    id,
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0
  }
  await putItem(STORES.PENDING_SYNC, item)
  return id
}

/**
 * Get pending sync count
 */
export async function getPendingSyncCount(): Promise<number> {
  return countItems(STORES.PENDING_SYNC)
}

/**
 * Save current session
 */
export async function saveSession(session: POSSession): Promise<void> {
  await putItem(STORES.SESSION, { id: 'current', ...session })
}

/**
 * Get current session
 */
export async function getSession(): Promise<POSSession | undefined> {
  const session = await getItem<POSSession & { id: string }>(STORES.SESSION, 'current')
  if (session) {
    const { id: _, ...rest } = session
    return rest as POSSession
  }
  return undefined
}

/**
 * Clear current session
 */
export async function clearSession(): Promise<void> {
  await deleteItem(STORES.SESSION, 'current')
}
