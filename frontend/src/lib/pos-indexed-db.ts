const DB_NAME = 'WebWakaPOS'
const DB_VERSION = 1
const STORES = {
  PENDING_TRANSACTIONS: 'pending_transactions',
  PRODUCTS_CACHE: 'products_cache'
}

let dbInstance: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB error:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.PENDING_TRANSACTIONS)) {
        const store = db.createObjectStore(STORES.PENDING_TRANSACTIONS, { keyPath: 'offlineId' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCTS_CACHE)) {
        db.createObjectStore(STORES.PRODUCTS_CACHE, { keyPath: 'productId' })
      }
    }
  })
}

export interface PendingTransaction {
  offlineId: string
  timestamp: number
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
  data: {
    tenantId: string
    locationId: string
    items: any[]
    paymentMethod: string
    paymentData?: any
    subtotal: number
    discountTotal: number
    taxTotal: number
    grandTotal: number
    customerId?: string
    customerName?: string
  }
}

export async function addPendingTransaction(transaction: PendingTransaction): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORES.PENDING_TRANSACTIONS, 'readwrite')
    const store = txn.objectStore(STORES.PENDING_TRANSACTIONS)
    const request = store.add(transaction)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORES.PENDING_TRANSACTIONS, 'readonly')
    const store = txn.objectStore(STORES.PENDING_TRANSACTIONS)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function getPendingTransactionCount(): Promise<number> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORES.PENDING_TRANSACTIONS, 'readonly')
    const store = txn.objectStore(STORES.PENDING_TRANSACTIONS)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function removePendingTransaction(offlineId: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORES.PENDING_TRANSACTIONS, 'readwrite')
    const store = txn.objectStore(STORES.PENDING_TRANSACTIONS)
    const request = store.delete(offlineId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function updatePendingTransaction(transaction: PendingTransaction): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORES.PENDING_TRANSACTIONS, 'readwrite')
    const store = txn.objectStore(STORES.PENDING_TRANSACTIONS)
    const request = store.put(transaction)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clearPendingTransactions(): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORES.PENDING_TRANSACTIONS, 'readwrite')
    const store = txn.objectStore(STORES.PENDING_TRANSACTIONS)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}
