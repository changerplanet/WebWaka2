/**
 * SVM Offline Cart Persistence Service (Wave G2)
 * 
 * IndexedDB-backed cart storage for resilient checkout experience.
 * Survives network drops, app refresh, and browser close.
 * 
 * Key Features:
 * - Versioned cart schema for upgrades
 * - Graceful conflict resolution (price, stock, removed items)
 * - User-triggered restore only (no automation)
 * - Demo-safe labeling
 * 
 * @module lib/svm/offline-cart-service
 * @canonical Wave G2 - Differentiators & Scale
 */

import type { CartItem, ShippingAddress } from './checkout-service'

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineCartItem extends CartItem {
  addedAt: number
  lastPriceCheck?: number
  serverPrice?: number
  serverStock?: number
}

export interface OfflineCart {
  id: string
  tenantId: string
  customerId?: string
  sessionId: string
  items: OfflineCartItem[]
  shippingAddress?: ShippingAddress
  promotionCode?: string
  savedAt: number
  lastModifiedAt: number
  schemaVersion: number
  isDemo: boolean
  syncStatus: 'saved' | 'syncing' | 'synced' | 'conflict'
  deviceId: string
}

export interface CartConflict {
  type: 'price_changed' | 'stock_changed' | 'item_removed' | 'item_unavailable'
  productId: string
  productName: string
  oldValue?: number | string
  newValue?: number | string
  message: string
}

export interface CartMergeResult {
  success: boolean
  cart: OfflineCart | null
  conflicts: CartConflict[]
  hadConflicts: boolean
  mergedItemCount: number
  removedItemCount: number
}

export interface CartRestoreResult {
  success: boolean
  cart: OfflineCart | null
  message: string
  wasOffline: boolean
}

export type CartSyncStatus = 'saved' | 'syncing' | 'synced' | 'conflict'

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'webwaka-svm-cart'
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
      console.error('[OfflineCart] Failed to open IndexedDB:', request.error)
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
        store.createIndex('bySession', 'sessionId', { unique: false })
        store.createIndex('byTenantSession', ['tenantId', 'sessionId'], { unique: true })
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
  
  let deviceId = localStorage.getItem('webwaka-device-id')
  if (!deviceId) {
    deviceId = `device_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem('webwaka-device-id', deviceId)
  }
  return deviceId
}

// ============================================================================
// OFFLINE CART SERVICE
// ============================================================================

export const OfflineCartService = {
  /**
   * Check if IndexedDB is available
   */
  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
  },
  
  /**
   * Generate a unique cart ID
   */
  generateCartId(): string {
    return `cart_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
  },
  
  /**
   * Save cart to IndexedDB
   */
  async saveCart(
    tenantId: string,
    sessionId: string,
    items: CartItem[],
    options: {
      customerId?: string
      shippingAddress?: ShippingAddress
      promotionCode?: string
      isDemo?: boolean
    } = {}
  ): Promise<{ success: boolean; cartId: string }> {
    if (!this.isAvailable()) {
      return { success: false, cartId: '' }
    }
    
    try {
      const db = await getDB()
      const existingCart = await this.getCartBySession(tenantId, sessionId)
      
      const now = Date.now()
      const cart: OfflineCart = {
        id: existingCart?.id || this.generateCartId(),
        tenantId,
        sessionId,
        customerId: options.customerId,
        items: items.map(item => ({
          ...item,
          addedAt: now
        })),
        shippingAddress: options.shippingAddress,
        promotionCode: options.promotionCode,
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
          console.log('[OfflineCart] Cart saved:', cart.id)
          resolve({ success: true, cartId: cart.id })
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineCart] Failed to save cart:', error)
      return { success: false, cartId: '' }
    }
  },
  
  /**
   * Get cart by session
   */
  async getCartBySession(tenantId: string, sessionId: string): Promise<OfflineCart | null> {
    if (!this.isAvailable()) return null
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('byTenantSession')
        const request = index.get([tenantId, sessionId])
        
        request.onsuccess = () => {
          const cart = request.result as OfflineCart | undefined
          if (cart && this.isCartValid(cart)) {
            resolve(cart)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineCart] Failed to get cart:', error)
      return null
    }
  },
  
  /**
   * Get cart by ID
   */
  async getCartById(cartId: string): Promise<OfflineCart | null> {
    if (!this.isAvailable()) return null
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(cartId)
        
        request.onsuccess = () => {
          const cart = request.result as OfflineCart | undefined
          if (cart && this.isCartValid(cart)) {
            resolve(cart)
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineCart] Failed to get cart:', error)
      return null
    }
  },
  
  /**
   * Get all carts for a tenant
   */
  async getCartsByTenant(tenantId: string): Promise<OfflineCart[]> {
    if (!this.isAvailable()) return []
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('byTenant')
        const request = index.getAll(IDBKeyRange.only(tenantId))
        
        request.onsuccess = () => {
          const carts = (request.result as OfflineCart[]).filter(c => this.isCartValid(c))
          carts.sort((a, b) => b.lastModifiedAt - a.lastModifiedAt)
          resolve(carts)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineCart] Failed to get carts:', error)
      return []
    }
  },
  
  /**
   * Check if cart is still valid (not expired)
   */
  isCartValid(cart: OfflineCart): boolean {
    const now = Date.now()
    return cart.savedAt + CART_TTL_MS > now && cart.items.length > 0
  },
  
  /**
   * Update cart items
   */
  async updateCartItems(
    cartId: string,
    items: CartItem[]
  ): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false }
    
    try {
      const cart = await this.getCartById(cartId)
      if (!cart) return { success: false }
      
      const db = await getDB()
      const now = Date.now()
      
      const updatedCart: OfflineCart = {
        ...cart,
        items: items.map(item => ({
          ...item,
          addedAt: now
        })),
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
      console.error('[OfflineCart] Failed to update cart:', error)
      return { success: false }
    }
  },
  
  /**
   * Update cart sync status
   */
  async updateSyncStatus(
    cartId: string,
    status: CartSyncStatus
  ): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false }
    
    try {
      const cart = await this.getCartById(cartId)
      if (!cart) return { success: false }
      
      const db = await getDB()
      
      const updatedCart: OfflineCart = {
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
      console.error('[OfflineCart] Failed to update sync status:', error)
      return { success: false }
    }
  },
  
  /**
   * Delete cart
   */
  async deleteCart(cartId: string): Promise<{ success: boolean }> {
    if (!this.isAvailable()) return { success: false }
    
    try {
      const db = await getDB()
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.delete(cartId)
        
        request.onsuccess = () => {
          console.log('[OfflineCart] Cart deleted:', cartId)
          resolve({ success: true })
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineCart] Failed to delete cart:', error)
      return { success: false }
    }
  },
  
  /**
   * Clear all carts for a tenant
   */
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
      console.error('[OfflineCart] Failed to clear carts:', error)
      return { success: false, count: 0 }
    }
  },
  
  /**
   * Cleanup expired carts
   */
  async cleanupExpiredCarts(): Promise<{ success: boolean; count: number }> {
    if (!this.isAvailable()) return { success: false, count: 0 }
    
    try {
      const db = await getDB()
      const expiryTime = Date.now() - CART_TTL_MS
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('bySavedAt')
        const request = index.openCursor(IDBKeyRange.upperBound(expiryTime))
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
      console.error('[OfflineCart] Failed to cleanup carts:', error)
      return { success: false, count: 0 }
    }
  },
  
  /**
   * Check for offline cart that can be restored
   */
  async hasRestorable(tenantId: string, sessionId: string): Promise<boolean> {
    const cart = await this.getCartBySession(tenantId, sessionId)
    return cart !== null && cart.items.length > 0
  },
  
  /**
   * Get cart age in human readable format
   */
  getCartAge(cart: OfflineCart): string {
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

export interface ProductCheckResult {
  productId: string
  exists: boolean
  available: boolean
  currentPrice: number
  currentStock: number
  name: string
}

export const CartConflictDetector = {
  /**
   * Detect conflicts between offline cart and server state
   */
  async detectConflicts(
    cart: OfflineCart,
    serverProducts: ProductCheckResult[]
  ): Promise<CartConflict[]> {
    const conflicts: CartConflict[] = []
    const productMap = new Map(serverProducts.map(p => [p.productId, p]))
    
    for (const item of cart.items) {
      const serverProduct = productMap.get(item.productId)
      
      if (!serverProduct) {
        conflicts.push({
          type: 'item_removed',
          productId: item.productId,
          productName: item.productName,
          message: `"${item.productName}" is no longer available`
        })
        continue
      }
      
      if (!serverProduct.exists) {
        conflicts.push({
          type: 'item_removed',
          productId: item.productId,
          productName: item.productName,
          message: `"${item.productName}" has been removed from the store`
        })
        continue
      }
      
      if (!serverProduct.available) {
        conflicts.push({
          type: 'item_unavailable',
          productId: item.productId,
          productName: item.productName,
          message: `"${item.productName}" is currently unavailable`
        })
        continue
      }
      
      if (serverProduct.currentPrice !== item.unitPrice) {
        const priceDiff = serverProduct.currentPrice - item.unitPrice
        const direction = priceDiff > 0 ? 'increased' : 'decreased'
        conflicts.push({
          type: 'price_changed',
          productId: item.productId,
          productName: item.productName,
          oldValue: item.unitPrice,
          newValue: serverProduct.currentPrice,
          message: `Price of "${item.productName}" has ${direction} from ₦${item.unitPrice.toLocaleString()} to ₦${serverProduct.currentPrice.toLocaleString()}`
        })
      }
      
      if (serverProduct.currentStock < item.quantity && serverProduct.currentStock > 0) {
        conflicts.push({
          type: 'stock_changed',
          productId: item.productId,
          productName: item.productName,
          oldValue: item.quantity,
          newValue: serverProduct.currentStock,
          message: `Only ${serverProduct.currentStock} of "${item.productName}" available (you had ${item.quantity})`
        })
      }
      
      if (serverProduct.currentStock === 0) {
        conflicts.push({
          type: 'stock_changed',
          productId: item.productId,
          productName: item.productName,
          oldValue: item.quantity,
          newValue: 0,
          message: `"${item.productName}" is now out of stock`
        })
      }
    }
    
    return conflicts
  },
  
  /**
   * Categorize conflicts by severity
   */
  categorizeConflicts(conflicts: CartConflict[]): {
    blocking: CartConflict[]
    warnings: CartConflict[]
  } {
    const blocking: CartConflict[] = []
    const warnings: CartConflict[] = []
    
    for (const conflict of conflicts) {
      if (
        conflict.type === 'item_removed' ||
        conflict.type === 'item_unavailable' ||
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

// ============================================================================
// CART MERGE SERVICE
// ============================================================================

export const CartMergeService = {
  /**
   * Merge offline cart with server state
   * User-triggered only - no automation
   */
  async mergeWithServer(
    cart: OfflineCart,
    serverProducts: ProductCheckResult[]
  ): Promise<CartMergeResult> {
    const conflicts = await CartConflictDetector.detectConflicts(cart, serverProducts)
    const productMap = new Map(serverProducts.map(p => [p.productId, p]))
    
    const mergedItems: OfflineCartItem[] = []
    let removedCount = 0
    
    for (const item of cart.items) {
      const serverProduct = productMap.get(item.productId)
      
      if (!serverProduct || !serverProduct.exists || !serverProduct.available) {
        removedCount++
        continue
      }
      
      if (serverProduct.currentStock === 0) {
        removedCount++
        continue
      }
      
      const adjustedQuantity = Math.min(item.quantity, serverProduct.currentStock)
      
      mergedItems.push({
        ...item,
        unitPrice: serverProduct.currentPrice,
        quantity: adjustedQuantity,
        serverPrice: serverProduct.currentPrice,
        serverStock: serverProduct.currentStock,
        lastPriceCheck: Date.now()
      })
    }
    
    const mergedCart: OfflineCart = {
      ...cart,
      items: mergedItems,
      lastModifiedAt: Date.now(),
      syncStatus: conflicts.length > 0 ? 'conflict' : 'synced'
    }
    
    if (OfflineCartService.isAvailable() && mergedItems.length > 0) {
      const db = await initCartDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.put(mergedCart)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
    
    return {
      success: true,
      cart: mergedCart,
      conflicts,
      hadConflicts: conflicts.length > 0,
      mergedItemCount: mergedItems.length,
      removedItemCount: removedCount
    }
  },
  
  /**
   * Restore cart with conflict resolution
   */
  async restoreCart(
    tenantId: string,
    sessionId: string,
    serverProducts: ProductCheckResult[]
  ): Promise<CartRestoreResult> {
    const cart = await OfflineCartService.getCartBySession(tenantId, sessionId)
    
    if (!cart) {
      return {
        success: false,
        cart: null,
        message: 'No saved cart found',
        wasOffline: false
      }
    }
    
    const mergeResult = await this.mergeWithServer(cart, serverProducts)
    
    if (!mergeResult.success || !mergeResult.cart) {
      return {
        success: false,
        cart: null,
        message: 'Failed to restore cart',
        wasOffline: true
      }
    }
    
    if (mergeResult.cart.items.length === 0) {
      await OfflineCartService.deleteCart(cart.id)
      return {
        success: false,
        cart: null,
        message: 'All items in your saved cart are no longer available',
        wasOffline: true
      }
    }
    
    let message = 'Your cart was restored'
    if (mergeResult.hadConflicts) {
      const { blocking, warnings } = CartConflictDetector.categorizeConflicts(mergeResult.conflicts)
      if (blocking.length > 0) {
        message = `Cart restored with changes: ${blocking.length} item(s) removed`
      } else if (warnings.length > 0) {
        message = `Cart restored with ${warnings.length} update(s)`
      }
    }
    
    return {
      success: true,
      cart: mergeResult.cart,
      message,
      wasOffline: true
    }
  }
}

// ============================================================================
// UX SIGNAL HELPERS
// ============================================================================

export interface CartStatusSignal {
  status: 'saved' | 'restored' | 'conflict' | 'synced'
  icon: '💾' | '✓' | '⚠️' | '✅'
  message: string
  details?: string
}

export function getCartStatusSignal(
  cart: OfflineCart | null,
  conflicts: CartConflict[] = []
): CartStatusSignal {
  if (!cart) {
    return {
      status: 'synced',
      icon: '✅',
      message: 'Cart up to date'
    }
  }
  
  if (conflicts.length > 0) {
    const { blocking, warnings } = CartConflictDetector.categorizeConflicts(conflicts)
    if (blocking.length > 0) {
      return {
        status: 'conflict',
        icon: '⚠️',
        message: `${blocking.length} item(s) need attention`,
        details: blocking.map(c => c.message).join('; ')
      }
    }
    if (warnings.length > 0) {
      return {
        status: 'conflict',
        icon: '⚠️',
        message: `${warnings.length} price/stock update(s)`,
        details: warnings.map(c => c.message).join('; ')
      }
    }
  }
  
  switch (cart.syncStatus) {
    case 'saved':
      return {
        status: 'saved',
        icon: '💾',
        message: 'Saved offline',
        details: `Last saved ${OfflineCartService.getCartAge(cart)}`
      }
    case 'syncing':
      return {
        status: 'saved',
        icon: '💾',
        message: 'Syncing...'
      }
    case 'synced':
      return {
        status: 'synced',
        icon: '✅',
        message: 'Cart synced'
      }
    case 'conflict':
      return {
        status: 'conflict',
        icon: '⚠️',
        message: 'Review needed'
      }
    default:
      return {
        status: 'synced',
        icon: '✅',
        message: 'Cart ready'
      }
  }
}

export function formatConflictNotice(conflict: CartConflict): {
  title: string
  description: string
  actionLabel: string
  severity: 'info' | 'warning' | 'error'
} {
  switch (conflict.type) {
    case 'price_changed':
      const increased = (conflict.newValue as number) > (conflict.oldValue as number)
      return {
        title: increased ? 'Price increased' : 'Price decreased',
        description: conflict.message,
        actionLabel: 'Update cart',
        severity: increased ? 'warning' : 'info'
      }
    case 'stock_changed':
      return {
        title: conflict.newValue === 0 ? 'Out of stock' : 'Limited stock',
        description: conflict.message,
        actionLabel: conflict.newValue === 0 ? 'Remove item' : 'Adjust quantity',
        severity: conflict.newValue === 0 ? 'error' : 'warning'
      }
    case 'item_removed':
    case 'item_unavailable':
      return {
        title: 'Item unavailable',
        description: conflict.message,
        actionLabel: 'Remove from cart',
        severity: 'error'
      }
    default:
      return {
        title: 'Cart update',
        description: conflict.message,
        actionLabel: 'Review',
        severity: 'info'
      }
  }
}
