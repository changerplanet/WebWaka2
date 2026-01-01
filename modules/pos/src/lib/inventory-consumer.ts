/**
 * POS Inventory Consumer
 * 
 * READ-ONLY access to SaaS Core inventory.
 * 
 * RULES:
 * ✅ POS reads inventory state
 * ✅ POS emits inventory impact events
 * ❌ POS NEVER writes inventory directly
 * 
 * SaaS Core owns inventory reconciliation.
 */

// ============================================================================
// TYPES - INVENTORY READ MODELS
// ============================================================================

/**
 * Product with inventory info (read from Core)
 */
export interface ProductInventory {
  productId: string
  variantId?: string
  sku: string
  name: string
  
  // Inventory levels
  quantityOnHand: number      // Physical stock
  quantityReserved: number    // Reserved (layaway, pending orders)
  quantityAvailable: number   // onHand - reserved
  
  // Thresholds
  lowStockThreshold: number
  outOfStockThreshold: number
  
  // Flags
  isInStock: boolean
  isLowStock: boolean
  allowNegative: boolean      // Can sell when out of stock
  trackInventory: boolean     // Some products don't track (services)
  
  // Location (for multi-location)
  locationId?: string
  locationName?: string
  
  // Timestamps
  lastUpdated: Date
  lastSoldAt?: Date
}

/**
 * Inventory check result
 */
export interface InventoryCheckResult {
  productId: string
  variantId?: string
  requestedQuantity: number
  availableQuantity: number
  
  canFulfill: boolean
  shortfall: number           // How many units short
  
  status: InventoryStatus
  message: string
  
  // Suggestions
  alternatives?: ProductInventory[]  // Alternative products/variants
}

export type InventoryStatus = 
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'RESERVED'
  | 'BACKORDERED'
  | 'NOT_TRACKED'

/**
 * Batch inventory check (multiple products)
 */
export interface BatchInventoryCheck {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
}

export interface BatchInventoryResult {
  allAvailable: boolean
  results: InventoryCheckResult[]
  unavailableItems: InventoryCheckResult[]
}

// ============================================================================
// INVENTORY DELTA EVENTS (Emitted by POS)
// ============================================================================

/**
 * Base event structure
 */
interface InventoryEventBase {
  eventId: string
  eventType: string
  timestamp: Date
  tenantId: string
  locationId?: string
  
  // Source context
  sourceModule: 'POS'
  sourceAction: string
  sourceId: string            // saleId, refundId, etc.
  
  staffId: string
}

/**
 * Request inventory deduction (on sale completion)
 */
export interface InventoryDeductEvent extends InventoryEventBase {
  eventType: 'pos.inventory.deduct'
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    unitCost?: number         // For COGS calculation
    serialNumber?: string
    batchNumber?: string
    reason: 'SALE' | 'DAMAGE' | 'ADJUSTMENT'
  }>
}

/**
 * Request inventory restore (on refund/void)
 */
export interface InventoryRestoreEvent extends InventoryEventBase {
  eventType: 'pos.inventory.restore'
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    reason: 'REFUND' | 'VOID' | 'RETURN' | 'ADJUSTMENT'
    condition: 'SELLABLE' | 'DAMAGED' | 'EXPIRED'
  }>
}

/**
 * Request inventory reservation (layaway, hold)
 */
export interface InventoryReserveEvent extends InventoryEventBase {
  eventType: 'pos.inventory.reserve'
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    reason: 'LAYAWAY' | 'HOLD' | 'PENDING_PAYMENT'
    expiresAt?: Date          // Auto-release after this time
  }>
  reservationId: string       // For tracking/releasing
}

/**
 * Release inventory reservation
 */
export interface InventoryReleaseReservationEvent extends InventoryEventBase {
  eventType: 'pos.inventory.release_reservation'
  reservationId: string
  reason: 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
}

/**
 * Inventory snapshot request (for offline cache)
 */
export interface InventorySnapshotRequestEvent extends InventoryEventBase {
  eventType: 'pos.inventory.snapshot_request'
  productIds?: string[]       // Specific products, or all if empty
  includeZeroStock: boolean
}

export type POSInventoryEvent = 
  | InventoryDeductEvent
  | InventoryRestoreEvent
  | InventoryReserveEvent
  | InventoryReleaseReservationEvent
  | InventorySnapshotRequestEvent

// ============================================================================
// INVENTORY CONSUMER INTERFACE
// ============================================================================

/**
 * Interface for reading inventory from Core
 * Implemented by Core, consumed by POS
 */
export interface InventoryReader {
  /**
   * Get inventory for a single product
   */
  getProductInventory(
    tenantId: string,
    productId: string,
    variantId?: string,
    locationId?: string
  ): Promise<ProductInventory | null>

  /**
   * Get inventory for multiple products
   */
  getMultipleProductInventory(
    tenantId: string,
    productIds: Array<{ productId: string; variantId?: string }>,
    locationId?: string
  ): Promise<Map<string, ProductInventory>>

  /**
   * Check if quantity is available
   */
  checkAvailability(
    tenantId: string,
    productId: string,
    quantity: number,
    variantId?: string,
    locationId?: string
  ): Promise<InventoryCheckResult>

  /**
   * Batch availability check
   */
  checkBatchAvailability(
    tenantId: string,
    items: BatchInventoryCheck,
    locationId?: string
  ): Promise<BatchInventoryResult>

  /**
   * Search products with inventory
   */
  searchProducts(
    tenantId: string,
    query: string,
    options?: {
      inStockOnly?: boolean
      categoryId?: string
      limit?: number
      locationId?: string
    }
  ): Promise<ProductInventory[]>

  /**
   * Get low stock products
   */
  getLowStockProducts(
    tenantId: string,
    locationId?: string
  ): Promise<ProductInventory[]>

  /**
   * Get inventory snapshot for offline cache
   */
  getInventorySnapshot(
    tenantId: string,
    options?: {
      productIds?: string[]
      includeZeroStock?: boolean
      locationId?: string
    }
  ): Promise<ProductInventory[]>
}

// ============================================================================
// POS INVENTORY SERVICE (Consumer Implementation)
// ============================================================================

export class POSInventoryService {
  private reader: InventoryReader
  private eventEmitter: (event: POSInventoryEvent) => Promise<void>
  
  // Local cache for offline
  private cache: Map<string, ProductInventory> = new Map()
  private cacheTimestamp: Date | null = null
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes

  constructor(
    reader: InventoryReader,
    eventEmitter: (event: POSInventoryEvent) => Promise<void>
  ) {
    this.reader = reader
    this.eventEmitter = eventEmitter
  }

  // -------------------------------------------------------------------------
  // READ OPERATIONS (from Core)
  // -------------------------------------------------------------------------

  /**
   * Get product inventory (with cache fallback for offline)
   */
  async getInventory(
    tenantId: string,
    productId: string,
    variantId?: string,
    options?: { useCache?: boolean; locationId?: string }
  ): Promise<ProductInventory | null> {
    const cacheKey = this.getCacheKey(productId, variantId)

    // Try cache first if offline or requested
    if (options?.useCache || !navigator.onLine) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return { ...cached, lastUpdated: cached.lastUpdated }
      }
    }

    try {
      const inventory = await this.reader.getProductInventory(
        tenantId,
        productId,
        variantId,
        options?.locationId
      )

      // Update cache
      if (inventory) {
        this.cache.set(cacheKey, inventory)
      }

      return inventory
    } catch (error) {
      // Fallback to cache on error
      const cached = this.cache.get(cacheKey)
      if (cached) {
        console.warn(`Using cached inventory for ${productId}:`, error)
        return cached
      }
      throw error
    }
  }

  /**
   * Check if product can be sold
   */
  async canSell(
    tenantId: string,
    productId: string,
    quantity: number,
    variantId?: string,
    locationId?: string
  ): Promise<InventoryCheckResult> {
    // Offline mode - use cache with warning
    if (!navigator.onLine) {
      return this.checkFromCache(productId, quantity, variantId)
    }

    return this.reader.checkAvailability(
      tenantId,
      productId,
      quantity,
      variantId,
      locationId
    )
  }

  /**
   * Check multiple products for cart
   */
  async canSellCart(
    tenantId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    locationId?: string
  ): Promise<BatchInventoryResult> {
    // Offline mode - check cache
    if (!navigator.onLine) {
      return this.checkCartFromCache(items)
    }

    return this.reader.checkBatchAvailability(
      tenantId,
      { items },
      locationId
    )
  }

  /**
   * Search products (for product lookup)
   */
  async searchProducts(
    tenantId: string,
    query: string,
    options?: {
      inStockOnly?: boolean
      categoryId?: string
      limit?: number
      locationId?: string
    }
  ): Promise<ProductInventory[]> {
    // Offline - search cache
    if (!navigator.onLine) {
      return this.searchCache(query, options)
    }

    const results = await this.reader.searchProducts(tenantId, query, options)
    
    // Update cache with results
    for (const product of results) {
      const key = this.getCacheKey(product.productId, product.variantId)
      this.cache.set(key, product)
    }

    return results
  }

  // -------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Refresh cache from Core (call when coming online)
   */
  async refreshCache(
    tenantId: string,
    options?: {
      productIds?: string[]
      locationId?: string
    }
  ): Promise<void> {
    const snapshot = await this.reader.getInventorySnapshot(tenantId, {
      ...options,
      includeZeroStock: true
    })

    // Clear old cache
    if (!options?.productIds) {
      this.cache.clear()
    }

    // Populate cache
    for (const product of snapshot) {
      const key = this.getCacheKey(product.productId, product.variantId)
      this.cache.set(key, product)
    }

    this.cacheTimestamp = new Date()

    // Emit snapshot request event
    await this.eventEmitter({
      eventId: generateEventId(),
      eventType: 'pos.inventory.snapshot_request',
      timestamp: new Date(),
      tenantId,
      sourceModule: 'POS',
      sourceAction: 'CACHE_REFRESH',
      sourceId: `cache_${Date.now()}`,
      staffId: 'SYSTEM',
      productIds: options?.productIds,
      includeZeroStock: true
    })
  }

  /**
   * Update single product in cache (from Core event)
   */
  updateCache(product: ProductInventory): void {
    const key = this.getCacheKey(product.productId, product.variantId)
    this.cache.set(key, product)
  }

  /**
   * Get cache age
   */
  getCacheAge(): number | null {
    if (!this.cacheTimestamp) return null
    return Date.now() - this.cacheTimestamp.getTime()
  }

  /**
   * Check if cache is stale
   */
  isCacheStale(): boolean {
    const age = this.getCacheAge()
    return age === null || age > this.cacheTTL
  }

  // -------------------------------------------------------------------------
  // INVENTORY IMPACT EVENTS (Emitted to Core)
  // -------------------------------------------------------------------------

  /**
   * Emit deduction event when sale completes
   * Core will process and update actual inventory
   */
  async emitDeduction(
    tenantId: string,
    saleId: string,
    staffId: string,
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
      serialNumber?: string
      batchNumber?: string
    }>,
    locationId?: string
  ): Promise<void> {
    await this.eventEmitter({
      eventId: generateEventId(),
      eventType: 'pos.inventory.deduct',
      timestamp: new Date(),
      tenantId,
      locationId,
      sourceModule: 'POS',
      sourceAction: 'SALE_COMPLETE',
      sourceId: saleId,
      staffId,
      items: items.map(item => ({
        ...item,
        reason: 'SALE' as const
      }))
    })

    // Optimistically update local cache
    for (const item of items) {
      this.decrementCache(item.productId, item.quantity, item.variantId)
    }
  }

  /**
   * Emit restore event when refund/void
   * Core will process and update actual inventory
   */
  async emitRestore(
    tenantId: string,
    sourceId: string,
    staffId: string,
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
      condition?: 'SELLABLE' | 'DAMAGED' | 'EXPIRED'
    }>,
    reason: 'REFUND' | 'VOID' | 'RETURN',
    locationId?: string
  ): Promise<void> {
    await this.eventEmitter({
      eventId: generateEventId(),
      eventType: 'pos.inventory.restore',
      timestamp: new Date(),
      tenantId,
      locationId,
      sourceModule: 'POS',
      sourceAction: reason,
      sourceId,
      staffId,
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        reason,
        condition: item.condition ?? 'SELLABLE'
      }))
    })

    // Optimistically update local cache (only for sellable)
    for (const item of items) {
      if (!item.condition || item.condition === 'SELLABLE') {
        this.incrementCache(item.productId, item.quantity, item.variantId)
      }
    }
  }

  /**
   * Emit reservation event for layaway/hold
   */
  async emitReservation(
    tenantId: string,
    reservationId: string,
    sourceId: string,
    staffId: string,
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
    }>,
    reason: 'LAYAWAY' | 'HOLD' | 'PENDING_PAYMENT',
    expiresAt?: Date,
    locationId?: string
  ): Promise<void> {
    await this.eventEmitter({
      eventId: generateEventId(),
      eventType: 'pos.inventory.reserve',
      timestamp: new Date(),
      tenantId,
      locationId,
      sourceModule: 'POS',
      sourceAction: 'RESERVE',
      sourceId,
      staffId,
      reservationId,
      items: items.map(item => ({
        ...item,
        reason,
        expiresAt
      }))
    })
  }

  /**
   * Emit release reservation event
   */
  async emitReleaseReservation(
    tenantId: string,
    reservationId: string,
    staffId: string,
    reason: 'COMPLETED' | 'CANCELLED' | 'EXPIRED',
    locationId?: string
  ): Promise<void> {
    await this.eventEmitter({
      eventId: generateEventId(),
      eventType: 'pos.inventory.release_reservation',
      timestamp: new Date(),
      tenantId,
      locationId,
      sourceModule: 'POS',
      sourceAction: 'RELEASE_RESERVATION',
      sourceId: reservationId,
      staffId,
      reservationId,
      reason
    })
  }

  // -------------------------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------------------------

  private getCacheKey(productId: string, variantId?: string): string {
    return variantId ? `${productId}:${variantId}` : productId
  }

  private checkFromCache(
    productId: string,
    quantity: number,
    variantId?: string
  ): InventoryCheckResult {
    const key = this.getCacheKey(productId, variantId)
    const cached = this.cache.get(key)

    if (!cached) {
      return {
        productId,
        variantId,
        requestedQuantity: quantity,
        availableQuantity: 0,
        canFulfill: false,
        shortfall: quantity,
        status: 'OUT_OF_STOCK',
        message: 'Product not in cache - inventory unknown (offline)'
      }
    }

    if (!cached.trackInventory) {
      return {
        productId,
        variantId,
        requestedQuantity: quantity,
        availableQuantity: Infinity,
        canFulfill: true,
        shortfall: 0,
        status: 'NOT_TRACKED',
        message: 'Inventory not tracked for this product'
      }
    }

    const available = cached.quantityAvailable
    const canFulfill = available >= quantity || cached.allowNegative

    return {
      productId,
      variantId,
      requestedQuantity: quantity,
      availableQuantity: available,
      canFulfill,
      shortfall: canFulfill ? 0 : quantity - available,
      status: this.getStatus(cached, quantity),
      message: canFulfill 
        ? 'Available (from cache - may be stale)'
        : `Only ${available} available (from cache)`
    }
  }

  private checkCartFromCache(
    items: Array<{ productId: string; variantId?: string; quantity: number }>
  ): BatchInventoryResult {
    const results = items.map(item => 
      this.checkFromCache(item.productId, item.quantity, item.variantId)
    )

    const unavailable = results.filter(r => !r.canFulfill)

    return {
      allAvailable: unavailable.length === 0,
      results,
      unavailableItems: unavailable
    }
  }

  private searchCache(
    query: string,
    options?: { inStockOnly?: boolean; limit?: number }
  ): ProductInventory[] {
    const lowerQuery = query.toLowerCase()
    const results: ProductInventory[] = []

    for (const product of this.cache.values()) {
      const matches = 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.sku.toLowerCase().includes(lowerQuery)

      if (matches) {
        if (options?.inStockOnly && !product.isInStock) continue
        results.push(product)
        if (options?.limit && results.length >= options.limit) break
      }
    }

    return results
  }

  private getStatus(product: ProductInventory, requestedQty: number): InventoryStatus {
    if (!product.trackInventory) return 'NOT_TRACKED'
    if (product.quantityAvailable <= 0) return 'OUT_OF_STOCK'
    if (product.quantityAvailable < requestedQty) return 'LOW_STOCK'
    if (product.isLowStock) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  private decrementCache(productId: string, quantity: number, variantId?: string): void {
    const key = this.getCacheKey(productId, variantId)
    const cached = this.cache.get(key)
    if (cached && cached.trackInventory) {
      cached.quantityOnHand = Math.max(0, cached.quantityOnHand - quantity)
      cached.quantityAvailable = Math.max(0, cached.quantityAvailable - quantity)
      cached.isInStock = cached.quantityAvailable > 0
      cached.isLowStock = cached.quantityAvailable <= cached.lowStockThreshold
      cached.lastUpdated = new Date()
      cached.lastSoldAt = new Date()
    }
  }

  private incrementCache(productId: string, quantity: number, variantId?: string): void {
    const key = this.getCacheKey(productId, variantId)
    const cached = this.cache.get(key)
    if (cached && cached.trackInventory) {
      cached.quantityOnHand += quantity
      cached.quantityAvailable += quantity
      cached.isInStock = cached.quantityAvailable > 0
      cached.isLowStock = cached.quantityAvailable <= cached.lowStockThreshold
      cached.lastUpdated = new Date()
    }
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateEventId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// EXPORTS
// ============================================================================

export { generateEventId }
