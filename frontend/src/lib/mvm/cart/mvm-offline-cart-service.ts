/**
 * MVM Offline Cart Persistence Service (Wave K.1)
 * 
 * IndexedDB-backed cart storage for resilient multi-vendor checkout.
 * Survives network drops, app refresh, and browser close.
 * 
 * Key Features:
 * - Multi-vendor cart with vendor groups
 * - Versioned schema for upgrades
 * - Conflict detection (price, stock, vendor status)
 * - User-triggered sync only (no automation)
 * - Demo-safe labeling
 * 
 * @module lib/mvm/cart/mvm-offline-cart-service
 * @canonical Wave K.1
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MvmOfflineCartItem {
  id: string
  vendorId: string
  vendorName: string
  vendorSlug: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  variantId: string | null
  variantName: string | null
  quantity: number
  priceSnapshot: number
  currency: string
  addedAt: number
  lastPriceCheck?: number
  serverPrice?: number
  serverStock?: number
}

export interface MvmOfflineVendorGroup {
  vendorId: string
  vendorName: string
  vendorSlug: string
  items: MvmOfflineCartItem[]
  subtotal: number
}

export interface MvmOfflineCart {
  id: string
  tenantId: string
  cartKey: string
  items: MvmOfflineCartItem[]
  vendorGroups: MvmOfflineVendorGroup[]
  totalItems: number
  totalAmount: number
  currency: string
  savedAt: number
  lastModifiedAt: number
  schemaVersion: number
  isDemo: boolean
  syncStatus: MvmCartSyncStatus
  deviceId: string
}

export interface MvmCartConflict {
  type: 'price_changed' | 'stock_changed' | 'item_removed' | 'vendor_disabled' | 'product_unavailable'
  itemId: string
  productId: string
  productName: string
  vendorId: string
  vendorName: string
  oldValue?: number
  newValue?: number
  message: string
}

export interface MvmCartMergeResult {
  success: boolean
  cart: MvmOfflineCart | null
  conflicts: MvmCartConflict[]
  hadConflicts: boolean
  mergedItemCount: number
  removedItemCount: number
}

export type MvmCartSyncStatus = 'saved' | 'syncing' | 'synced' | 'conflict'

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'webwaka-mvm-cart'
const DB_VERSION = 1
const STORE_NAME = 'carts'
const CURRENT_SCHEMA_VERSION = 1
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null

function initCartDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('[MvmOfflineCart] Failed to open IndexedDB:', request.error)
      reject(request.error)
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('byTenant', 'tenantId', { unique: false })
        store.createIndex('byCartKey', 'cartKey', { unique: false })
        store.createIndex('byTenantCartKey', ['tenantId', 'cartKey'], { unique: true })
        store.createIndex('bySavedAt', 'savedAt', { unique: false })
      }
    }
  })
  
  return dbPromise
}

async function getDB(): Promise<IDBDatabase> {
  return initCartDB()
}

// ============================================================================
// DEVICE ID MANAGEMENT
// ============================================================================

function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'server'
  
  let deviceId = localStorage.getItem('webwaka-mvm-device-id')
  if (!deviceId) {
    deviceId = `mvm_device_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem('webwaka-mvm-device-id', deviceId)
  }
  return deviceId
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function groupItemsByVendor(items: MvmOfflineCartItem[]): MvmOfflineVendorGroup[] {
  const groupMap = new Map<string, MvmOfflineCartItem[]>()
  
  for (const item of items) {
    const existing = groupMap.get(item.vendorId) || []
    existing.push(item)
    groupMap.set(item.vendorId, existing)
  }
  
  const groups: MvmOfflineVendorGroup[] = []
  for (const [vendorId, vendorItems] of groupMap) {
    const firstItem = vendorItems[0]
    groups.push({
      vendorId,
      vendorName: firstItem.vendorName,
      vendorSlug: firstItem.vendorSlug,
      items: vendorItems,
      subtotal: vendorItems.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0)
    })
  }
  
  return groups
}

// ============================================================================
// MVM OFFLINE CART SERVICE
// ============================================================================

export const MvmOfflineCartService = {
  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
  },
  
  generateCartId(): string {
    return `mvm_cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
  },
  
  async saveCart(
    tenantId: string,
    cartKey: string,
    items: MvmOfflineCartItem[],
    options: {
      isDemo?: boolean
    } = {}
  ): Promise<{ success: boolean; cartId: string }> {
    if (!this.isAvailable()) {
      return { success: false, cartId: '' }
    }
    
    try {
      const db = await getDB()
      const existingCart = await this.getCartByKey(tenantId, cartKey)
      
      const now = Date.now()
      const vendorGroups = groupItemsByVendor(items)
      
      const cart: MvmOfflineCart = {
        id: existingCart?.id || this.generateCartId(),
        tenantId,
        cartKey,
        items,
        vendorGroups,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        totalAmount: items.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0),
        currency: 'NGN',
        savedAt: existingCart?.savedAt || now,
        lastModifiedAt: now,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        isDemo: options.isDemo ?? false,
        syncStatus: 'saved',
        deviceId: getDeviceId()
      }
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.put(cart)
        
        request.onsuccess = () => {
          console.log('[MvmOfflineCart] Cart saved:', cart.id)
          resolve({ success: true, cartId: cart.id })
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to save cart:', error)
      return { success: false, cartId: '' }
    }
  },
  
  async getCartByKey(tenantId: string, cartKey: string): Promise<MvmOfflineCart | null> {
    if (!this.isAvailable()) return null
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('byTenantCartKey')
        const request = index.get([tenantId, cartKey])
        
        request.onsuccess = () => {
          const cart = request.result as MvmOfflineCart | undefined
          if (cart && this.isCartValid(cart)) {
            resolve(cart)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to get cart:', error)
      return null
    }
  },
  
  async getCartById(cartId: string): Promise<MvmOfflineCart | null> {
    if (!this.isAvailable()) return null
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(cartId)
        
        request.onsuccess = () => {
          const cart = request.result as MvmOfflineCart | undefined
          if (cart && this.isCartValid(cart)) {
            resolve(cart)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to get cart:', error)
      return null
    }
  },
  
  isCartValid(cart: MvmOfflineCart): boolean {
    const now = Date.now()
    return cart.savedAt + CART_TTL_MS > now && cart.items.length > 0
  },
  
  async updateCartItems(
    cartId: string,
    items: MvmOfflineCartItem[]
  ): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false }
    
    try {
      const cart = await this.getCartById(cartId)
      if (!cart) return { success: false }
      
      const db = await getDB()
      const now = Date.now()
      const vendorGroups = groupItemsByVendor(items)
      
      const updatedCart: MvmOfflineCart = {
        ...cart,
        items,
        vendorGroups,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        totalAmount: items.reduce((sum, i) => sum + (i.priceSnapshot * i.quantity), 0),
        lastModifiedAt: now,
        syncStatus: 'saved'
      }
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.put(updatedCart)
        
        request.onsuccess = () => resolve({ success: true })
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to update cart:', error)
      return { success: false }
    }
  },
  
  async updateSyncStatus(
    cartId: string,
    status: MvmCartSyncStatus
  ): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false }
    
    try {
      const cart = await this.getCartById(cartId)
      if (!cart) return { success: false }
      
      const db = await getDB()
      
      const updatedCart: MvmOfflineCart = {
        ...cart,
        syncStatus: status,
        lastModifiedAt: Date.now()
      }
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.put(updatedCart)
        
        request.onsuccess = () => resolve({ success: true })
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to update sync status:', error)
      return { success: false }
    }
  },
  
  async deleteCart(cartId: string): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false }
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.delete(cartId)
        
        request.onsuccess = () => {
          console.log('[MvmOfflineCart] Cart deleted:', cartId)
          resolve({ success: true })
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to delete cart:', error)
      return { success: false }
    }
  },
  
  async clearTenantCarts(tenantId: string): Promise<{ success: boolean; count: number }> {
    if (!this.isAvailable()) return { success: false, count: 0 }
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
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
            resolve({ success: true, count: deletedCount })
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[MvmOfflineCart] Failed to clear carts:', error)
      return { success: false, count: 0 }
    }
  },
  
  async hasRestorable(tenantId: string, cartKey: string): Promise<boolean> {
    const cart = await this.getCartByKey(tenantId, cartKey)
    return cart !== null && cart.items.length > 0
  },
  
  getCartAge(cart: MvmOfflineCart): string {
    const now = Date.now()
    const ageMs = now - cart.lastModifiedAt
    
    const minutes = Math.floor(ageMs / (1000 * 60))
    const hours = Math.floor(ageMs / (1000 * 60 * 60))
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    return 'just now'
  }
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

export interface MvmProductCheckResult {
  productId: string
  vendorId: string
  vendorStatus: string
  exists: boolean
  available: boolean
  currentPrice: number
  currentStock: number
  name: string
}

export const MvmCartConflictDetector = {
  detectConflicts(
    cart: MvmOfflineCart,
    serverProducts: MvmProductCheckResult[]
  ): MvmCartConflict[] {
    const conflicts: MvmCartConflict[] = []
    const productMap = new Map(serverProducts.map(p => [p.productId, p]))
    
    for (const item of cart.items) {
      const serverProduct = productMap.get(item.productId)
      
      if (!serverProduct) {
        conflicts.push({
          type: 'item_removed',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          message: `"${item.productName}" is no longer available`
        })
        continue
      }
      
      if (serverProduct.vendorStatus !== 'APPROVED') {
        conflicts.push({
          type: 'vendor_disabled',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          message: `Vendor "${item.vendorName}" is no longer accepting orders`
        })
        continue
      }
      
      if (!serverProduct.exists) {
        conflicts.push({
          type: 'item_removed',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          message: `"${item.productName}" has been removed`
        })
        continue
      }
      
      if (!serverProduct.available) {
        conflicts.push({
          type: 'product_unavailable',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          message: `"${item.productName}" is currently unavailable`
        })
        continue
      }
      
      if (Math.abs(serverProduct.currentPrice - item.priceSnapshot) > 0.01) {
        const priceDiff = serverProduct.currentPrice - item.priceSnapshot
        const direction = priceDiff > 0 ? 'increased' : 'decreased'
        conflicts.push({
          type: 'price_changed',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          oldValue: item.priceSnapshot,
          newValue: serverProduct.currentPrice,
          message: `Price of "${item.productName}" has ${direction} from ₦${item.priceSnapshot.toLocaleString()} to ₦${serverProduct.currentPrice.toLocaleString()}`
        })
      }
      
      if (serverProduct.currentStock < item.quantity && serverProduct.currentStock > 0) {
        conflicts.push({
          type: 'stock_changed',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          oldValue: item.quantity,
          newValue: serverProduct.currentStock,
          message: `Only ${serverProduct.currentStock} of "${item.productName}" available`
        })
      }
      
      if (serverProduct.currentStock === 0) {
        conflicts.push({
          type: 'stock_changed',
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          oldValue: item.quantity,
          newValue: 0,
          message: `"${item.productName}" is now out of stock`
        })
      }
    }
    
    return conflicts
  },
  
  categorizeConflicts(conflicts: MvmCartConflict[]): {
    blocking: MvmCartConflict[]
    warnings: MvmCartConflict[]
  } {
    const blocking: MvmCartConflict[] = []
    const warnings: MvmCartConflict[] = []
    
    for (const conflict of conflicts) {
      if (
        conflict.type === 'item_removed' ||
        conflict.type === 'vendor_disabled' ||
        conflict.type === 'product_unavailable' ||
        (conflict.type === 'stock_changed' && conflict.newValue === 0)
      ) {
        blocking.push(conflict)
      } else {
        warnings.push(conflict)
      }
    }
    
    return { blocking, warnings }
  }
}
