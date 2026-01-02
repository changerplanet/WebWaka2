/**
 * MVM Offline Behavior
 * 
 * Defines offline behavior rules for Multi Vendor Marketplace.
 * 
 * RULES:
 * - Browsing allowed offline (cached vendor data)
 * - Vendor management requires connectivity
 * - Order operations require connectivity
 * - Clear UX degradation when offline
 * - No unsafe offline mutations
 */

// ============================================================================
// ACTION CLASSIFICATION
// ============================================================================

/**
 * Actions that are safe to perform offline
 */
export const OFFLINE_SAFE_ACTIONS = [
  // Browsing
  'VIEW_VENDOR_LIST',
  'VIEW_VENDOR_PROFILE',
  'VIEW_VENDOR_PRODUCTS',
  'VIEW_VENDOR_DASHBOARD', // Cached data
  
  // Cached data viewing
  'VIEW_CACHED_ORDERS',
  'VIEW_CACHED_EARNINGS',
  'VIEW_CACHED_METRICS',
  
  // Draft operations
  'DRAFT_PRODUCT_LISTING',
  'DRAFT_VENDOR_UPDATE',
] as const

/**
 * Actions that require online connectivity
 */
export const ONLINE_REQUIRED_ACTIONS = [
  // Vendor management
  'CREATE_VENDOR',
  'UPDATE_VENDOR',
  'APPROVE_VENDOR',
  'SUSPEND_VENDOR',
  'DELETE_VENDOR',
  
  // Staff management
  'INVITE_STAFF',
  'REMOVE_STAFF',
  'UPDATE_STAFF_ROLE',
  
  // Product mapping
  'ADD_PRODUCT_MAPPING',
  'UPDATE_PRODUCT_MAPPING',
  'REMOVE_PRODUCT_MAPPING',
  
  // Order operations
  'ACCEPT_ORDER',
  'REJECT_ORDER',
  'SHIP_ORDER',
  'MARK_DELIVERED',
  'CANCEL_ORDER',
  'PROCESS_REFUND',
  
  // Commission management
  'CREATE_COMMISSION_RULE',
  'UPDATE_COMMISSION_RULE',
  'DELETE_COMMISSION_RULE',
  
  // Payout operations
  'REQUEST_PAYOUT',
  'SCHEDULE_PAYOUT',
  
  // Real-time data
  'FETCH_LIVE_ORDERS',
  'FETCH_LIVE_INVENTORY',
  'FETCH_LIVE_EARNINGS',
] as const

export type OfflineSafeAction = typeof OFFLINE_SAFE_ACTIONS[number]
export type OnlineRequiredAction = typeof ONLINE_REQUIRED_ACTIONS[number]
export type MVMAction = OfflineSafeAction | OnlineRequiredAction

// ============================================================================
// OFFLINE STATE
// ============================================================================

export interface OfflineState {
  isOnline: boolean
  lastOnlineAt: string | null
  pendingActions: QueuedAction[]
  cachedData: {
    vendors: boolean
    products: boolean
    orders: boolean
    earnings: boolean
    lastSyncAt: string | null
  }
}

export interface QueuedAction {
  id: string
  action: OnlineRequiredAction
  payload: Record<string, unknown>
  queuedAt: string
  retryCount: number
  maxRetries: number
}

// ============================================================================
// CONNECTIVITY CHECKER
// ============================================================================

export class MVMConnectivityChecker {
  private state: OfflineState = {
    isOnline: true,
    lastOnlineAt: new Date().toISOString(),
    pendingActions: [],
    cachedData: {
      vendors: false,
      products: false,
      orders: false,
      earnings: false,
      lastSyncAt: null
    }
  }
  
  private listeners: Array<(isOnline: boolean) => void> = []
  
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      this.state.isOnline = navigator.onLine
    }
  }
  
  /**
   * Get current online status
   */
  isOnline(): boolean {
    return this.state.isOnline
  }
  
  /**
   * Check if an action can be performed
   */
  canPerformAction(action: MVMAction): {
    canPerform: boolean
    reason?: string
    fallback?: string
  } {
    if (OFFLINE_SAFE_ACTIONS.includes(action as OfflineSafeAction)) {
      return { canPerform: true }
    }
    
    if (!this.state.isOnline) {
      return {
        canPerform: false,
        reason: 'This action requires an internet connection',
        fallback: this.getFallbackMessage(action as OnlineRequiredAction)
      }
    }
    
    return { canPerform: true }
  }
  
  /**
   * Get fallback message for offline action
   */
  private getFallbackMessage(action: OnlineRequiredAction): string {
    const messages: Partial<Record<OnlineRequiredAction, string>> = {
      'CREATE_VENDOR': 'Vendor registration will be available when you\'re back online.',
      'ACCEPT_ORDER': 'You can view order details offline but must go online to accept it.',
      'SHIP_ORDER': 'Shipping updates require connectivity. Please reconnect to update.',
      'REQUEST_PAYOUT': 'Payout requests require an active connection.',
      'FETCH_LIVE_ORDERS': 'Showing cached orders. Reconnect for live data.',
    }
    
    return messages[action] || 'This action will be available when you\'re back online.'
  }
  
  /**
   * Add connectivity listener
   */
  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }
  
  /**
   * Handle coming online
   */
  private handleOnline(): void {
    this.state.isOnline = true
    this.state.lastOnlineAt = new Date().toISOString()
    this.listeners.forEach(l => l(true))
    this.processPendingActions()
  }
  
  /**
   * Handle going offline
   */
  private handleOffline(): void {
    this.state.isOnline = false
    this.listeners.forEach(l => l(false))
  }
  
  /**
   * Process pending actions when back online
   */
  private processPendingActions(): void {
    // This would be implemented to retry queued actions
    console.log('[MVM Offline] Processing pending actions:', this.state.pendingActions.length)
  }
  
  /**
   * Get offline state
   */
  getState(): OfflineState {
    return { ...this.state }
  }
  
  /**
   * Update cached data status
   */
  setCachedData(key: keyof OfflineState['cachedData'], value: boolean | string | null): void {
    if (key === 'lastSyncAt') {
      this.state.cachedData.lastSyncAt = value as string | null
    } else if (typeof value === 'boolean') {
      this.state.cachedData[key] = value
    }
  }
}

// ============================================================================
// OFFLINE MESSAGES
// ============================================================================

export const OFFLINE_MESSAGES = {
  BANNER: 'You are currently offline. Some features may be limited.',
  VENDOR_MANAGEMENT: 'Vendor management is not available offline.',
  ORDER_ACTIONS: 'Order actions require an internet connection.',
  PAYOUT_REQUEST: 'Payout requests are not available offline.',
  DATA_STALE: 'Showing cached data. Last updated: ',
  RECONNECTING: 'Reconnecting...',
  CONNECTED: 'You are back online!',
  SYNC_REQUIRED: 'Please sync your data when you reconnect.',
} as const

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

export const MVM_CACHE_STRATEGIES = {
  VENDOR_LIST: {
    maxAge: 15 * 60 * 1000, // 15 minutes
    staleWhileRevalidate: true
  },
  VENDOR_PROFILE: {
    maxAge: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: true
  },
  VENDOR_ORDERS: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true
  },
  VENDOR_EARNINGS: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    staleWhileRevalidate: true
  },
  COMMISSION_RULES: {
    maxAge: 60 * 60 * 1000, // 1 hour
    staleWhileRevalidate: true
  }
} as const

// ============================================================================
// SINGLETON
// ============================================================================

let checkerInstance: MVMConnectivityChecker | null = null

export function getMVMConnectivityChecker(): MVMConnectivityChecker {
  if (!checkerInstance) {
    checkerInstance = new MVMConnectivityChecker()
  }
  return checkerInstance
}

// All constants and classes are exported inline with their declarations
