/**
 * SVM Product Consumer
 * 
 * READ-ONLY access to Core product catalog.
 * SVM never writes to products - only reads and caches.
 */

// ============================================================================
// TYPES - Core Product Structure (as received from Core)
// ============================================================================

export interface CoreProduct {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  
  // Categorization
  categoryId?: string
  categoryName?: string
  tags: string[]
  
  // Pricing
  basePrice: number
  compareAtPrice?: number // Original price for "sale" display
  currency: string
  
  // Tax
  taxable: boolean
  taxCategoryId?: string
  
  // Media
  images: ProductImage[]
  
  // Status
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  publishedAt?: string
  
  // Variants
  hasVariants: boolean
  variants: CoreProductVariant[]
  
  // Options (Size, Color, etc.)
  options: ProductOption[]
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  
  // Physical properties
  weight?: number
  weightUnit?: 'lb' | 'kg' | 'oz' | 'g'
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CoreProductVariant {
  id: string
  productId: string
  
  name: string
  sku: string
  barcode?: string
  
  // Pricing (can override product base price)
  price: number
  compareAtPrice?: number
  
  // Options (e.g., { "Size": "Large", "Color": "Blue" })
  options: Record<string, string>
  
  // Media
  imageUrl?: string
  
  // Physical
  weight?: number
  
  // Status
  isActive: boolean
  
  // Inventory (from Core)
  inventoryQuantity: number
  inventoryPolicy: 'DENY' | 'CONTINUE' // Sell when out of stock?
  
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  altText?: string
  position: number
  isDefault: boolean
}

export interface ProductOption {
  name: string      // "Size", "Color"
  values: string[]  // ["S", "M", "L", "XL"]
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface CoreInventoryLevel {
  productId: string
  variantId?: string
  
  // Quantities
  available: number    // Can be sold
  reserved: number     // Held for pending orders
  committed: number    // Allocated to confirmed orders
  onHand: number       // Physical count (available + reserved + committed)
  
  // Policy
  allowBackorder: boolean
  lowStockThreshold?: number
  
  // Location (if multi-location)
  locationId?: string
  locationName?: string
  
  updatedAt: string
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER'

export interface AvailabilityResult {
  productId: string
  variantId?: string
  available: number
  status: StockStatus
  canPurchase: boolean
  maxPurchaseQty?: number
  estimatedRestockDate?: string
  message?: string
}

// ============================================================================
// CORE SERVICE INTERFACE
// ============================================================================

/**
 * Interface for Core's Product/Inventory service
 * SVM calls this; Core implements it
 */
export interface CoreCatalogService {
  // Products
  getProduct(tenantId: string, productId: string): Promise<CoreProduct | null>
  getProductBySlug(tenantId: string, slug: string): Promise<CoreProduct | null>
  listProducts(tenantId: string, options: ListProductsOptions): Promise<ProductListResult>
  searchProducts(tenantId: string, query: string, options?: SearchOptions): Promise<ProductListResult>
  
  // Variants
  getVariant(tenantId: string, variantId: string): Promise<CoreProductVariant | null>
  
  // Inventory
  getInventory(tenantId: string, productId: string, variantId?: string): Promise<CoreInventoryLevel | null>
  checkAvailability(tenantId: string, items: AvailabilityCheckItem[]): Promise<AvailabilityResult[]>
  
  // Categories
  listCategories(tenantId: string): Promise<ProductCategory[]>
}

export interface ListProductsOptions {
  categoryId?: string
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SearchOptions {
  categoryId?: string
  inStock?: boolean
  limit?: number
}

export interface ProductListResult {
  products: CoreProduct[]
  total: number
  hasMore: boolean
}

export interface AvailabilityCheckItem {
  productId: string
  variantId?: string
  requestedQty: number
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  parentId?: string
  productCount: number
}

// ============================================================================
// PRODUCT CONSUMER SERVICE
// ============================================================================

export class SVMProductService {
  constructor(
    private coreService: CoreCatalogService,
    private cache: ProductCache
  ) {}

  /**
   * Get a product with inventory status
   * Uses cache when available, falls back to Core
   */
  async getProduct(
    tenantId: string, 
    productId: string,
    options?: { includeInventory?: boolean }
  ): Promise<CoreProduct | null> {
    // Try cache first
    const cached = await this.cache.getProduct(productId)
    if (cached && !this.cache.isStale(cached.cachedAt)) {
      return cached.product
    }

    // Fetch from Core
    try {
      const product = await this.coreService.getProduct(tenantId, productId)
      
      if (product) {
        // Update cache
        await this.cache.setProduct(productId, product)
        
        // Optionally enrich with live inventory
        if (options?.includeInventory) {
          await this.enrichWithInventory(tenantId, product)
        }
      }
      
      return product
    } catch (error) {
      console.error('[SVM] Error fetching product:', error)
      
      // Return stale cache if available
      if (cached) {
        console.log('[SVM] Using stale cache for product:', productId)
        return cached.product
      }
      
      throw error
    }
  }

  /**
   * Get product by URL slug
   */
  async getProductBySlug(
    tenantId: string,
    slug: string
  ): Promise<CoreProduct | null> {
    // Try cache
    const cached = await this.cache.getProductBySlug(slug)
    if (cached && !this.cache.isStale(cached.cachedAt)) {
      return cached.product
    }

    try {
      const product = await this.coreService.getProductBySlug(tenantId, slug)
      
      if (product) {
        await this.cache.setProduct(product.id, product)
        await this.cache.setSlugMapping(slug, product.id)
      }
      
      return product
    } catch (error) {
      if (cached) return cached.product
      throw error
    }
  }

  /**
   * List products with filtering
   */
  async listProducts(
    tenantId: string,
    options: ListProductsOptions = {}
  ): Promise<ProductListResult> {
    // For listings, check cache freshness
    const cacheKey = this.buildListCacheKey(tenantId, options)
    const cached = await this.cache.getList(cacheKey)
    
    if (cached && !this.cache.isStale(cached.cachedAt, 60000)) { // 1 min cache for lists
      return cached.result
    }

    try {
      const result = await this.coreService.listProducts(tenantId, options)
      
      // Cache individual products
      for (const product of result.products) {
        await this.cache.setProduct(product.id, product)
      }
      
      // Cache list result
      await this.cache.setList(cacheKey, result)
      
      return result
    } catch (error) {
      if (cached) return cached.result
      throw error
    }
  }

  /**
   * Search products
   */
  async searchProducts(
    tenantId: string,
    query: string,
    options?: SearchOptions
  ): Promise<ProductListResult> {
    // Search always goes to Core (no caching for search results)
    return this.coreService.searchProducts(tenantId, query, options)
  }

  /**
   * Check real-time availability for cart items
   * This should NOT be cached - always check Core
   */
  async checkAvailability(
    tenantId: string,
    items: AvailabilityCheckItem[]
  ): Promise<AvailabilityResult[]> {
    try {
      return await this.coreService.checkAvailability(tenantId, items)
    } catch (error) {
      console.error('[SVM] Availability check failed:', error)
      
      // Return conservative estimates from cache
      return items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        available: 0,
        status: 'OUT_OF_STOCK' as StockStatus,
        canPurchase: false,
        message: 'Unable to verify availability. Please try again.'
      }))
    }
  }

  /**
   * Enrich product with live inventory data
   */
  private async enrichWithInventory(
    tenantId: string,
    product: CoreProduct
  ): Promise<void> {
    try {
      if (product.hasVariants) {
        // Get inventory for each variant
        const inventoryPromises = product.variants.map(v =>
          this.coreService.getInventory(tenantId, product.id, v.id)
        )
        const inventories = await Promise.all(inventoryPromises)
        
        // Update variant inventory quantities
        product.variants.forEach((variant, index) => {
          const inv = inventories[index]
          if (inv) {
            variant.inventoryQuantity = inv.available
          }
        })
      } else {
        // Simple product - single inventory
        const inv = await this.coreService.getInventory(tenantId, product.id)
        if (inv && product.variants[0]) {
          product.variants[0].inventoryQuantity = inv.available
        }
      }
    } catch (error) {
      console.error('[SVM] Error enriching inventory:', error)
      // Continue without inventory enrichment
    }
  }

  /**
   * Build cache key for list queries
   */
  private buildListCacheKey(tenantId: string, options: ListProductsOptions): string {
    const parts = [
      'list',
      tenantId,
      options.categoryId || 'all',
      options.status || 'ACTIVE',
      options.sortBy || 'name',
      options.sortOrder || 'asc',
      String(options.limit || 24),
      String(options.offset || 0)
    ]
    return parts.join(':')
  }
}

// ============================================================================
// CACHING INTERFACE
// ============================================================================

export interface ProductCache {
  // Products
  getProduct(productId: string): Promise<CachedProduct | null>
  setProduct(productId: string, product: CoreProduct): Promise<void>
  
  // Slug mapping
  getProductBySlug(slug: string): Promise<CachedProduct | null>
  setSlugMapping(slug: string, productId: string): Promise<void>
  
  // List results
  getList(cacheKey: string): Promise<CachedList | null>
  setList(cacheKey: string, result: ProductListResult): Promise<void>
  
  // Invalidation
  invalidateProduct(productId: string): Promise<void>
  invalidateAll(): Promise<void>
  
  // Staleness check
  isStale(cachedAt: number, maxAge?: number): boolean
}

export interface CachedProduct {
  product: CoreProduct
  cachedAt: number
}

export interface CachedList {
  result: ProductListResult
  cachedAt: number
}

// ============================================================================
// DEFAULT CACHE IMPLEMENTATION (In-Memory + Optional IndexedDB)
// ============================================================================

const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export class InMemoryProductCache implements ProductCache {
  private products = new Map<string, CachedProduct>()
  private slugMap = new Map<string, string>()
  private lists = new Map<string, CachedList>()
  private ttl: number

  constructor(ttlMs: number = DEFAULT_CACHE_TTL) {
    this.ttl = ttlMs
  }

  async getProduct(productId: string): Promise<CachedProduct | null> {
    return this.products.get(productId) || null
  }

  async setProduct(productId: string, product: CoreProduct): Promise<void> {
    this.products.set(productId, {
      product,
      cachedAt: Date.now()
    })
    
    // Also map slug
    if (product.slug) {
      this.slugMap.set(product.slug, productId)
    }
  }

  async getProductBySlug(slug: string): Promise<CachedProduct | null> {
    const productId = this.slugMap.get(slug)
    if (!productId) return null
    return this.getProduct(productId)
  }

  async setSlugMapping(slug: string, productId: string): Promise<void> {
    this.slugMap.set(slug, productId)
  }

  async getList(cacheKey: string): Promise<CachedList | null> {
    return this.lists.get(cacheKey) || null
  }

  async setList(cacheKey: string, result: ProductListResult): Promise<void> {
    this.lists.set(cacheKey, {
      result,
      cachedAt: Date.now()
    })
  }

  async invalidateProduct(productId: string): Promise<void> {
    const cached = this.products.get(productId)
    if (cached?.product.slug) {
      this.slugMap.delete(cached.product.slug)
    }
    this.products.delete(productId)
  }

  async invalidateAll(): Promise<void> {
    this.products.clear()
    this.slugMap.clear()
    this.lists.clear()
  }

  isStale(cachedAt: number, maxAge?: number): boolean {
    const age = Date.now() - cachedAt
    return age > (maxAge || this.ttl)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine stock status from quantity
 */
export function getStockStatus(
  available: number,
  lowThreshold: number = 5,
  allowBackorder: boolean = false
): StockStatus {
  if (available <= 0) {
    return allowBackorder ? 'BACKORDER' : 'OUT_OF_STOCK'
  }
  if (available <= lowThreshold) {
    return 'LOW_STOCK'
  }
  return 'IN_STOCK'
}

/**
 * Format price for display
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Check if product has any available inventory
 */
export function isInStock(product: CoreProduct): boolean {
  if (!product.hasVariants && product.variants[0]) {
    return product.variants[0].inventoryQuantity > 0 ||
           product.variants[0].inventoryPolicy === 'CONTINUE'
  }
  
  return product.variants.some(v => 
    v.inventoryQuantity > 0 || v.inventoryPolicy === 'CONTINUE'
  )
}

/**
 * Get the lowest price variant
 */
export function getLowestPrice(product: CoreProduct): number {
  if (product.variants.length === 0) {
    return product.basePrice
  }
  return Math.min(...product.variants.map(v => v.price))
}

/**
 * Get price range for display
 */
export function getPriceRange(product: CoreProduct): { min: number; max: number } {
  if (product.variants.length === 0) {
    return { min: product.basePrice, max: product.basePrice }
  }
  const prices = product.variants.map(v => v.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
}
