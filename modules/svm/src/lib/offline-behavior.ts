/**
 * SVM Offline & PWA Behavior
 * 
 * Defines offline behavior rules for Single Vendor Marketplace.
 * 
 * RULES:
 * - Browsing allowed offline (cached)
 * - Order placement REQUIRES connectivity
 * - Graceful degradation when offline
 * - Clear user feedback on connectivity status
 * 
 * NO OFFLINE ORDER PLACEMENT - Orders must be submitted online
 */

// ============================================================================
// OFFLINE ACTION CLASSIFICATION
// ============================================================================

/**
 * Actions that are safe to perform offline (cached data)
 */
export const OFFLINE_SAFE_ACTIONS = [
  'VIEW_PRODUCTS',           // Browse cached product catalog
  'VIEW_PRODUCT_DETAILS',    // View cached product information
  'VIEW_CATEGORIES',         // Browse cached categories
  'VIEW_CART',               // View local cart (stored in localStorage)
  'ADD_TO_CART',             // Add items to local cart
  'UPDATE_CART_QUANTITY',    // Update cart quantities locally
  'REMOVE_FROM_CART',        // Remove items from cart
  'VIEW_WISHLIST',           // View local wishlist
  'ADD_TO_WISHLIST',         // Add to local wishlist
  'VIEW_ORDER_HISTORY',      // View cached previous orders
  'VIEW_SAVED_ADDRESSES',    // View cached addresses
  'SEARCH_CACHED',           // Search within cached products
] as const

/**
 * Actions that REQUIRE online connectivity
 */
export const ONLINE_REQUIRED_ACTIONS = [
  'PLACE_ORDER',             // Submit order - NEVER offline
  'CHECKOUT',                // Proceed to checkout
  'PROCESS_PAYMENT',         // Payment processing
  'VALIDATE_COUPON',         // Validate promotion codes
  'CALCULATE_SHIPPING',      // Get live shipping rates
  'CHECK_INVENTORY',         // Real-time inventory check
  'CREATE_ACCOUNT',          // User registration
  'LOGIN',                   // Authentication
  'UPDATE_PROFILE',          // Profile changes
  'TRACK_ORDER',             // Real-time order tracking
  'SUBMIT_REVIEW',           // Submit product review
  'CONTACT_SUPPORT',         // Contact merchant
] as const

export type OfflineSafeAction = typeof OFFLINE_SAFE_ACTIONS[number]
export type OnlineRequiredAction = typeof ONLINE_REQUIRED_ACTIONS[number]
export type MarketplaceAction = OfflineSafeAction | OnlineRequiredAction

// ============================================================================
// CONNECTIVITY STATUS
// ============================================================================

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SLOW' | 'UNKNOWN'

export interface ConnectivityState {
  status: ConnectionStatus
  lastOnline: Date | null
  lastChecked: Date
  latency?: number           // ms
  effectiveType?: string     // 4g, 3g, 2g, slow-2g
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Get network information (if available)
 */
export function getNetworkInfo(): { effectiveType?: string; downlink?: number; rtt?: number } {
  if (typeof navigator === 'undefined') return {}
  
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection
  
  if (!connection) return {}
  
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt
  }
}

/**
 * Determine connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  if (!isOnline()) return 'OFFLINE'
  
  const networkInfo = getNetworkInfo()
  
  if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
    return 'SLOW'
  }
  
  if (networkInfo.rtt && networkInfo.rtt > 1000) {
    return 'SLOW'
  }
  
  return 'ONLINE'
}

// ============================================================================
// ACTION VALIDATOR
// ============================================================================

export interface ActionValidation {
  allowed: boolean
  reason?: string
  fallback?: string
  canQueue?: boolean
}

/**
 * Validate if an action can be performed given current connectivity
 */
export function validateAction(
  action: MarketplaceAction,
  isConnected: boolean
): ActionValidation {
  // Check if action is offline-safe
  if (OFFLINE_SAFE_ACTIONS.includes(action as OfflineSafeAction)) {
    return { allowed: true }
  }
  
  // Action requires connectivity
  if (!isConnected) {
    return getOfflineFallback(action as OnlineRequiredAction)
  }
  
  return { allowed: true }
}

/**
 * Get fallback behavior for offline actions
 */
function getOfflineFallback(action: OnlineRequiredAction): ActionValidation {
  const fallbacks: Record<OnlineRequiredAction, ActionValidation> = {
    'PLACE_ORDER': {
      allowed: false,
      reason: 'You need an internet connection to place your order.',
      fallback: 'Your cart will be saved. Please try again when connected.',
      canQueue: false
    },
    'CHECKOUT': {
      allowed: false,
      reason: 'Checkout requires an internet connection.',
      fallback: 'Please connect to the internet to complete your purchase.',
      canQueue: false
    },
    'PROCESS_PAYMENT': {
      allowed: false,
      reason: 'Payment processing requires a secure internet connection.',
      fallback: 'Your payment information is not stored offline.',
      canQueue: false
    },
    'VALIDATE_COUPON': {
      allowed: false,
      reason: 'Cannot validate coupon codes offline.',
      fallback: 'You can still add items to cart. Apply coupon when back online.',
      canQueue: true
    },
    'CALCULATE_SHIPPING': {
      allowed: false,
      reason: 'Shipping rates require internet connection.',
      fallback: 'Shipping will be calculated at checkout.',
      canQueue: false
    },
    'CHECK_INVENTORY': {
      allowed: false,
      reason: 'Real-time inventory check unavailable offline.',
      fallback: 'Product availability shown may not be current.',
      canQueue: false
    },
    'CREATE_ACCOUNT': {
      allowed: false,
      reason: 'Account creation requires internet connection.',
      fallback: 'You can browse products. Create account when connected.',
      canQueue: false
    },
    'LOGIN': {
      allowed: false,
      reason: 'Login requires internet connection.',
      fallback: 'You can browse products as a guest.',
      canQueue: false
    },
    'UPDATE_PROFILE': {
      allowed: false,
      reason: 'Profile updates require internet connection.',
      fallback: 'Changes will be saved when you reconnect.',
      canQueue: true
    },
    'TRACK_ORDER': {
      allowed: false,
      reason: 'Order tracking requires internet connection.',
      fallback: 'Check your order status when back online.',
      canQueue: false
    },
    'SUBMIT_REVIEW': {
      allowed: false,
      reason: 'Cannot submit reviews offline.',
      fallback: 'Your review will be saved and submitted when connected.',
      canQueue: true
    },
    'CONTACT_SUPPORT': {
      allowed: false,
      reason: 'Contacting support requires internet connection.',
      fallback: 'Your message will be sent when you reconnect.',
      canQueue: true
    }
  }
  
  return fallbacks[action]
}

// ============================================================================
// OFFLINE QUEUE
// ============================================================================

export interface QueuedAction {
  id: string
  action: OnlineRequiredAction
  payload: Record<string, unknown>
  createdAt: Date
  retryCount: number
  maxRetries: number
}

/**
 * Actions that can be queued for later execution
 */
export const QUEUEABLE_ACTIONS: OnlineRequiredAction[] = [
  'VALIDATE_COUPON',
  'UPDATE_PROFILE',
  'SUBMIT_REVIEW',
  'CONTACT_SUPPORT'
]

/**
 * Offline action queue manager
 */
export class OfflineQueue {
  private static STORAGE_KEY = 'svm_offline_queue'
  
  /**
   * Add action to queue
   */
  static enqueue(action: OnlineRequiredAction, payload: Record<string, unknown>): QueuedAction | null {
    if (!QUEUEABLE_ACTIONS.includes(action)) {
      return null
    }
    
    const queuedAction: QueuedAction = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      action,
      payload,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    }
    
    const queue = this.getQueue()
    queue.push(queuedAction)
    this.saveQueue(queue)
    
    return queuedAction
  }
  
  /**
   * Get all queued actions
   */
  static getQueue(): QueuedAction[] {
    if (typeof localStorage === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  
  /**
   * Save queue to storage
   */
  private static saveQueue(queue: QueuedAction[]): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue))
  }
  
  /**
   * Remove action from queue
   */
  static dequeue(id: string): void {
    const queue = this.getQueue().filter(a => a.id !== id)
    this.saveQueue(queue)
  }
  
  /**
   * Clear all queued actions
   */
  static clear(): void {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }
  
  /**
   * Get queue count
   */
  static count(): number {
    return this.getQueue().length
  }
  
  /**
   * Process queue when back online
   */
  static async processQueue(
    executor: (action: QueuedAction) => Promise<boolean>
  ): Promise<{ success: number; failed: number }> {
    const queue = this.getQueue()
    let success = 0
    let failed = 0
    
    for (const action of queue) {
      try {
        const result = await executor(action)
        if (result) {
          this.dequeue(action.id)
          success++
        } else {
          action.retryCount++
          if (action.retryCount >= action.maxRetries) {
            this.dequeue(action.id)
            failed++
          }
        }
      } catch {
        action.retryCount++
        if (action.retryCount >= action.maxRetries) {
          this.dequeue(action.id)
          failed++
        }
      }
    }
    
    return { success, failed }
  }
}

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

export type CacheStrategy = 
  | 'CACHE_FIRST'      // Use cache, fallback to network
  | 'NETWORK_FIRST'    // Use network, fallback to cache
  | 'CACHE_ONLY'       // Only use cache
  | 'NETWORK_ONLY'     // Only use network (no caching)
  | 'STALE_WHILE_REVALIDATE'  // Return cache, update in background

/**
 * Cache configuration for different resources
 */
export interface CacheConfig {
  strategy: CacheStrategy
  maxAge: number          // seconds
  maxItems?: number       // max items in cache
}

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static assets - cache first, long TTL
  'static-assets': {
    strategy: 'CACHE_FIRST',
    maxAge: 60 * 60 * 24 * 30  // 30 days
  },
  
  // Product catalog - stale while revalidate
  'products': {
    strategy: 'STALE_WHILE_REVALIDATE',
    maxAge: 60 * 60,          // 1 hour
    maxItems: 500
  },
  
  // Product details - stale while revalidate
  'product-details': {
    strategy: 'STALE_WHILE_REVALIDATE',
    maxAge: 60 * 30,          // 30 minutes
    maxItems: 100
  },
  
  // Categories - cache first, medium TTL
  'categories': {
    strategy: 'CACHE_FIRST',
    maxAge: 60 * 60 * 24      // 24 hours
  },
  
  // Product images - cache first, long TTL
  'product-images': {
    strategy: 'CACHE_FIRST',
    maxAge: 60 * 60 * 24 * 7  // 7 days
  },
  
  // Shipping rates - network only (real-time)
  'shipping': {
    strategy: 'NETWORK_ONLY',
    maxAge: 0
  },
  
  // Inventory - network first, short cache
  'inventory': {
    strategy: 'NETWORK_FIRST',
    maxAge: 60 * 5            // 5 minutes
  },
  
  // Promotions - network first
  'promotions': {
    strategy: 'NETWORK_FIRST',
    maxAge: 60 * 15           // 15 minutes
  },
  
  // User data - network only
  'user-data': {
    strategy: 'NETWORK_ONLY',
    maxAge: 0
  },
  
  // Orders - network only
  'orders': {
    strategy: 'NETWORK_ONLY',
    maxAge: 0
  }
}

// ============================================================================
// UI FEEDBACK MESSAGES
// ============================================================================

export interface OfflineMessage {
  title: string
  message: string
  type: 'info' | 'warning' | 'error'
  action?: {
    label: string
    handler: string  // function name to call
  }
}

export const OFFLINE_MESSAGES: Record<string, OfflineMessage> = {
  'OFFLINE_BANNER': {
    title: 'You\'re offline',
    message: 'Some features may be limited. Your cart is saved locally.',
    type: 'info'
  },
  'SLOW_CONNECTION': {
    title: 'Slow connection detected',
    message: 'Some features may take longer to load.',
    type: 'warning'
  },
  'BACK_ONLINE': {
    title: 'You\'re back online',
    message: 'All features are now available.',
    type: 'info',
    action: {
      label: 'Sync cart',
      handler: 'syncCart'
    }
  },
  'CHECKOUT_BLOCKED': {
    title: 'Cannot checkout offline',
    message: 'Please connect to the internet to complete your purchase.',
    type: 'error'
  },
  'ORDER_BLOCKED': {
    title: 'Cannot place order',
    message: 'Orders require an active internet connection for security.',
    type: 'error'
  },
  'INVENTORY_STALE': {
    title: 'Inventory may be outdated',
    message: 'Product availability shown was last updated when you were online.',
    type: 'warning'
  },
  'CART_SYNCED': {
    title: 'Cart synced',
    message: 'Your cart has been synced with the server.',
    type: 'info'
  },
  'QUEUE_PENDING': {
    title: 'Actions pending',
    message: 'Some actions will be completed when you\'re back online.',
    type: 'info'
  }
}

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  CART: 'svm_cart',
  WISHLIST: 'svm_wishlist',
  RECENT_PRODUCTS: 'svm_recent_products',
  CACHED_PRODUCTS: 'svm_cached_products',
  CACHED_CATEGORIES: 'svm_cached_categories',
  SAVED_ADDRESSES: 'svm_saved_addresses',
  PENDING_REVIEWS: 'svm_pending_reviews',
  OFFLINE_QUEUE: 'svm_offline_queue',
  LAST_SYNC: 'svm_last_sync',
  CONNECTION_STATUS: 'svm_connection_status'
} as const

// ============================================================================
// OFFLINE CART MANAGER
// ============================================================================

export interface OfflineCartItem {
  productId: string
  variantId?: string
  productName: string
  unitPrice: number
  quantity: number
  imageUrl?: string
  addedAt: Date
  syncedWithServer: boolean
}

export interface OfflineCart {
  tenantId: string
  items: OfflineCartItem[]
  lastModified: Date
  syncedAt?: Date
}

/**
 * Manage cart in offline mode
 */
export class OfflineCartManager {
  private static getStorageKey(tenantId: string): string {
    return `${STORAGE_KEYS.CART}_${tenantId}`
  }
  
  /**
   * Get cart from local storage
   */
  static getCart(tenantId: string): OfflineCart {
    if (typeof localStorage === 'undefined') {
      return { tenantId, items: [], lastModified: new Date() }
    }
    
    try {
      const stored = localStorage.getItem(this.getStorageKey(tenantId))
      if (!stored) {
        return { tenantId, items: [], lastModified: new Date() }
      }
      return JSON.parse(stored)
    } catch {
      return { tenantId, items: [], lastModified: new Date() }
    }
  }
  
  /**
   * Save cart to local storage
   */
  static saveCart(cart: OfflineCart): void {
    if (typeof localStorage === 'undefined') return
    cart.lastModified = new Date()
    localStorage.setItem(this.getStorageKey(cart.tenantId), JSON.stringify(cart))
  }
  
  /**
   * Add item to cart
   */
  static addItem(tenantId: string, item: Omit<OfflineCartItem, 'addedAt' | 'syncedWithServer'>): void {
    const cart = this.getCart(tenantId)
    
    const existingIndex = cart.items.findIndex(
      i => i.productId === item.productId && i.variantId === item.variantId
    )
    
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity
      cart.items[existingIndex].syncedWithServer = false
    } else {
      cart.items.push({
        ...item,
        addedAt: new Date(),
        syncedWithServer: false
      })
    }
    
    this.saveCart(cart)
  }
  
  /**
   * Update item quantity
   */
  static updateQuantity(tenantId: string, productId: string, variantId: string | undefined, quantity: number): void {
    const cart = this.getCart(tenantId)
    
    const index = cart.items.findIndex(
      i => i.productId === productId && i.variantId === variantId
    )
    
    if (index >= 0) {
      if (quantity <= 0) {
        cart.items.splice(index, 1)
      } else {
        cart.items[index].quantity = quantity
        cart.items[index].syncedWithServer = false
      }
      this.saveCart(cart)
    }
  }
  
  /**
   * Remove item from cart
   */
  static removeItem(tenantId: string, productId: string, variantId?: string): void {
    const cart = this.getCart(tenantId)
    cart.items = cart.items.filter(
      i => !(i.productId === productId && i.variantId === variantId)
    )
    this.saveCart(cart)
  }
  
  /**
   * Clear cart
   */
  static clearCart(tenantId: string): void {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(this.getStorageKey(tenantId))
  }
  
  /**
   * Mark cart as synced with server
   */
  static markSynced(tenantId: string): void {
    const cart = this.getCart(tenantId)
    cart.syncedAt = new Date()
    cart.items.forEach(item => {
      item.syncedWithServer = true
    })
    this.saveCart(cart)
  }
  
  /**
   * Check if cart needs sync
   */
  static needsSync(tenantId: string): boolean {
    const cart = this.getCart(tenantId)
    return cart.items.some(item => !item.syncedWithServer)
  }
  
  /**
   * Get cart summary
   */
  static getSummary(tenantId: string): {
    itemCount: number
    subtotal: number
    needsSync: boolean
  } {
    const cart = this.getCart(tenantId)
    return {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      needsSync: cart.items.some(item => !item.syncedWithServer)
    }
  }
}

// ============================================================================
// CONNECTIVITY LISTENER
// ============================================================================

export type ConnectivityCallback = (online: boolean, status: ConnectionStatus) => void

/**
 * Listen for connectivity changes
 */
export class ConnectivityListener {
  private static listeners: ConnectivityCallback[] = []
  private static initialized = false
  
  /**
   * Initialize connectivity listeners
   */
  static init(): void {
    if (this.initialized || typeof window === 'undefined') return
    
    window.addEventListener('online', () => {
      const status = getConnectionStatus()
      this.notifyListeners(true, status)
    })
    
    window.addEventListener('offline', () => {
      this.notifyListeners(false, 'OFFLINE')
    })
    
    // Check connection quality periodically
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', () => {
        const status = getConnectionStatus()
        this.notifyListeners(isOnline(), status)
      })
    }
    
    this.initialized = true
  }
  
  /**
   * Subscribe to connectivity changes
   */
  static subscribe(callback: ConnectivityCallback): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }
  
  /**
   * Notify all listeners
   */
  private static notifyListeners(online: boolean, status: ConnectionStatus): void {
    this.listeners.forEach(callback => callback(online, status))
  }
  
  /**
   * Get current state
   */
  static getCurrentState(): { online: boolean; status: ConnectionStatus } {
    return {
      online: isOnline(),
      status: getConnectionStatus()
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  isOnline,
  getNetworkInfo,
  getConnectionStatus,
  validateAction
}
