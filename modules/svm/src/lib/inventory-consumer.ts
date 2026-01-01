/**
 * SVM Inventory Consumer
 * 
 * READ-ONLY access to Core inventory.
 * SVM never writes to inventory directly - updates happen via events.
 * 
 * IMPORTANT:
 * - All inventory mutations go through Core
 * - SVM emits events (svm.order.placed) → Core deducts inventory
 * - SVM reads inventory for display and availability checks
 */

import type {
  CoreInventoryLevel,
  AvailabilityResult,
  AvailabilityCheckItem,
  StockStatus
} from './product-consumer'

// ============================================================================
// INVENTORY SERVICE INTERFACE (Core implements this)
// ============================================================================

export interface CoreInventoryService {
  /**
   * Get inventory level for a product/variant
   */
  getInventory(
    tenantId: string,
    productId: string,
    variantId?: string,
    locationId?: string
  ): Promise<CoreInventoryLevel | null>

  /**
   * Batch check availability for multiple items
   * Used during checkout to verify all items can be fulfilled
   */
  checkAvailability(
    tenantId: string,
    items: AvailabilityCheckItem[]
  ): Promise<AvailabilityResult[]>

  /**
   * Reserve inventory for a pending order
   * Returns reservation ID if successful
   * 
   * NOTE: This is the ONLY "write" - and it's a reservation, not a deduction.
   * Actual deduction happens when order is confirmed via event.
   */
  reserveInventory(
    tenantId: string,
    orderId: string,
    items: ReservationItem[]
  ): Promise<ReservationResult>

  /**
   * Release a reservation (e.g., order cancelled, cart expired)
   */
  releaseReservation(
    tenantId: string,
    reservationId: string
  ): Promise<{ success: boolean }>
}

export interface ReservationItem {
  productId: string
  variantId?: string
  quantity: number
}

export interface ReservationResult {
  success: boolean
  reservationId?: string
  expiresAt?: string
  failedItems?: Array<{
    productId: string
    variantId?: string
    requestedQty: number
    availableQty: number
    reason: string
  }>
}

// ============================================================================
// SVM INVENTORY SERVICE
// ============================================================================

export class SVMInventoryService {
  private cache: InventoryCache
  private coreService: CoreInventoryService

  constructor(
    coreService: CoreInventoryService,
    cache?: InventoryCache
  ) {
    this.coreService = coreService
    this.cache = cache || new InMemoryInventoryCache()
  }

  /**
   * Get inventory for display purposes
   * Uses short-lived cache (inventory changes frequently)
   */
  async getInventoryForDisplay(
    tenantId: string,
    productId: string,
    variantId?: string
  ): Promise<InventoryDisplay> {
    // Try cache (very short TTL for inventory)
    const cacheKey = this.buildCacheKey(productId, variantId)
    const cached = this.cache.get(cacheKey)
    
    if (cached && !this.isStale(cached.timestamp, 30000)) { // 30 second cache
      return cached.data
    }

    try {
      const inventory = await this.coreService.getInventory(
        tenantId,
        productId,
        variantId
      )

      const display = this.formatForDisplay(inventory)
      this.cache.set(cacheKey, display)
      
      return display
    } catch (error) {
      console.error('[SVM] Error fetching inventory:', error)
      
      // Return cached data if available (even if stale)
      if (cached) {
        return {
          ...cached.data,
          isStale: true
        }
      }

      // Return unknown status
      return {
        available: 0,
        status: 'UNKNOWN',
        canPurchase: false,
        message: 'Unable to check availability',
        isStale: true
      }
    }
  }

  /**
   * Check availability before checkout
   * This should NEVER be cached - always hit Core
   */
  async checkCartAvailability(
    tenantId: string,
    items: CartAvailabilityItem[]
  ): Promise<CartAvailabilityResult> {
    const checkItems: AvailabilityCheckItem[] = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      requestedQty: item.quantity
    }))

    try {
      const results = await this.coreService.checkAvailability(tenantId, checkItems)
      
      const allAvailable = results.every(r => r.canPurchase)
      const unavailableItems = results.filter(r => !r.canPurchase)

      return {
        allAvailable,
        items: results,
        unavailableItems: unavailableItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          requestedQty: items.find(i => 
            i.productId === item.productId && i.variantId === item.variantId
          )?.quantity || 0,
          availableQty: item.available,
          message: item.message || this.getUnavailableMessage(item)
        }))
      }
    } catch (error) {
      console.error('[SVM] Cart availability check failed:', error)
      
      return {
        allAvailable: false,
        items: [],
        error: 'Unable to verify product availability. Please try again.',
        unavailableItems: []
      }
    }
  }

  /**
   * Reserve inventory for checkout
   * Called when customer starts checkout process
   */
  async reserveForCheckout(
    tenantId: string,
    orderId: string,
    items: CartAvailabilityItem[]
  ): Promise<ReservationResult> {
    const reservationItems: ReservationItem[] = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity
    }))

    try {
      return await this.coreService.reserveInventory(
        tenantId,
        orderId,
        reservationItems
      )
    } catch (error) {
      console.error('[SVM] Reservation failed:', error)
      
      return {
        success: false,
        failedItems: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          requestedQty: item.quantity,
          availableQty: 0,
          reason: 'Reservation service unavailable'
        }))
      }
    }
  }

  /**
   * Release reservation (cart abandoned, order cancelled)
   */
  async releaseReservation(
    tenantId: string,
    reservationId: string
  ): Promise<boolean> {
    try {
      const result = await this.coreService.releaseReservation(
        tenantId,
        reservationId
      )
      return result.success
    } catch (error) {
      console.error('[SVM] Release reservation failed:', error)
      return false
    }
  }

  /**
   * Format inventory for storefront display
   */
  private formatForDisplay(inventory: CoreInventoryLevel | null): InventoryDisplay {
    if (!inventory) {
      return {
        available: 0,
        status: 'UNKNOWN',
        canPurchase: false,
        message: 'Availability unknown'
      }
    }

    const status = this.determineStatus(inventory)
    const canPurchase = inventory.available > 0 || inventory.allowBackorder

    return {
      available: inventory.available,
      status,
      canPurchase,
      lowStockWarning: status === 'LOW_STOCK',
      message: this.getStatusMessage(status, inventory),
      showQuantity: inventory.available <= 10 && inventory.available > 0
    }
  }

  /**
   * Determine stock status
   */
  private determineStatus(inventory: CoreInventoryLevel): StockStatus | 'UNKNOWN' {
    const { available, allowBackorder, lowStockThreshold = 5 } = inventory

    if (available <= 0) {
      return allowBackorder ? 'BACKORDER' : 'OUT_OF_STOCK'
    }
    if (available <= lowStockThreshold) {
      return 'LOW_STOCK'
    }
    return 'IN_STOCK'
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(
    status: StockStatus | 'UNKNOWN',
    inventory: CoreInventoryLevel
  ): string {
    switch (status) {
      case 'IN_STOCK':
        return 'In Stock'
      case 'LOW_STOCK':
        return `Only ${inventory.available} left`
      case 'OUT_OF_STOCK':
        return 'Out of Stock'
      case 'BACKORDER':
        return 'Available for Backorder'
      default:
        return 'Check Availability'
    }
  }

  /**
   * Get message for unavailable item
   */
  private getUnavailableMessage(item: AvailabilityResult): string {
    if (item.available === 0) {
      return 'This item is out of stock'
    }
    return `Only ${item.available} available (you requested more)`
  }

  /**
   * Build cache key
   */
  private buildCacheKey(productId: string, variantId?: string): string {
    return variantId ? `${productId}:${variantId}` : productId
  }

  /**
   * Check if cache entry is stale
   */
  private isStale(timestamp: number, maxAge: number): boolean {
    return Date.now() - timestamp > maxAge
  }

  /**
   * Invalidate cache for a product
   */
  invalidateCache(productId: string, variantId?: string): void {
    const key = this.buildCacheKey(productId, variantId)
    this.cache.delete(key)
  }

  /**
   * Clear all cached inventory
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryDisplay {
  available: number
  status: StockStatus | 'UNKNOWN'
  canPurchase: boolean
  lowStockWarning?: boolean
  message?: string
  showQuantity?: boolean
  isStale?: boolean
}

export interface CartAvailabilityItem {
  productId: string
  variantId?: string
  quantity: number
  productName?: string
}

export interface CartAvailabilityResult {
  allAvailable: boolean
  items: AvailabilityResult[]
  unavailableItems: UnavailableItem[]
  error?: string
}

export interface UnavailableItem {
  productId: string
  variantId?: string
  requestedQty: number
  availableQty: number
  message: string
}

// ============================================================================
// CACHE INTERFACE
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface InventoryCache {
  get(key: string): CacheEntry<InventoryDisplay> | undefined
  set(key: string, data: InventoryDisplay): void
  delete(key: string): void
  clear(): void
}

/**
 * Simple in-memory cache for inventory
 */
class InMemoryInventoryCache implements InventoryCache {
  private cache = new Map<string, CacheEntry<InventoryDisplay>>()
  private maxSize = 1000

  get(key: string): CacheEntry<InventoryDisplay> | undefined {
    return this.cache.get(key)
  }

  set(key: string, data: InventoryDisplay): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

// ============================================================================
// OFFLINE HANDLING
// ============================================================================

/**
 * Offline inventory cache using IndexedDB
 * For when Core is unavailable
 */
export interface OfflineInventoryStore {
  /**
   * Save inventory snapshot for offline use
   */
  saveSnapshot(
    tenantId: string,
    products: Array<{ productId: string; variantId?: string; available: number }>
  ): Promise<void>

  /**
   * Get cached inventory (for offline display)
   */
  getCached(
    productId: string,
    variantId?: string
  ): Promise<{ available: number; cachedAt: number } | null>

  /**
   * Clear all cached inventory
   */
  clearAll(): Promise<void>
}

/**
 * Offline-aware inventory service
 */
export class OfflineAwareInventoryService extends SVMInventoryService {
  private offlineStore: OfflineInventoryStore
  private isOnline: boolean = true

  constructor(
    coreService: CoreInventoryService,
    offlineStore: OfflineInventoryStore
  ) {
    super(coreService)
    this.offlineStore = offlineStore
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      this.isOnline = navigator.onLine
    }
  }

  private handleOnline(): void {
    this.isOnline = true
    this.clearCache() // Clear in-memory cache to force refresh
  }

  private handleOffline(): void {
    this.isOnline = false
  }

  /**
   * Get inventory with offline fallback
   */
  async getInventoryForDisplay(
    tenantId: string,
    productId: string,
    variantId?: string
  ): Promise<InventoryDisplay> {
    // If online, use parent implementation
    if (this.isOnline) {
      try {
        const result = await super.getInventoryForDisplay(tenantId, productId, variantId)
        
        // Save to offline store for later
        // (fire and forget - don't await)
        this.offlineStore.saveSnapshot(tenantId, [{
          productId,
          variantId,
          available: result.available
        }]).catch(() => {})
        
        return result
      } catch (error) {
        // Fall through to offline handling
      }
    }

    // Offline or error - use cached data
    const cached = await this.offlineStore.getCached(productId, variantId)
    
    if (cached) {
      const ageMinutes = Math.floor((Date.now() - cached.cachedAt) / 60000)
      
      return {
        available: cached.available,
        status: cached.available > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        canPurchase: cached.available > 0,
        message: `Cached data (${ageMinutes}m old)`,
        isStale: true
      }
    }

    // No cached data
    return {
      available: 0,
      status: 'UNKNOWN',
      canPurchase: false,
      message: 'Offline - availability unknown',
      isStale: true
    }
  }

  /**
   * Check cart availability with offline handling
   */
  async checkCartAvailability(
    tenantId: string,
    items: CartAvailabilityItem[]
  ): Promise<CartAvailabilityResult> {
    if (!this.isOnline) {
      return {
        allAvailable: false,
        items: [],
        unavailableItems: [],
        error: 'Cannot verify availability while offline. Please connect to complete your order.'
      }
    }

    return super.checkCartAvailability(tenantId, items)
  }
}
