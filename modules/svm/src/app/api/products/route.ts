/**
 * SVM Products API
 * 
 * GET /api/svm/products - List products from Core (read-only)
 * 
 * This API provides a facade over the Core product catalog.
 * SVM never writes to products - it only reads and caches them.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  SVMProductService,
  InMemoryProductCache,
  getStockStatus,
  formatPrice,
  isInStock,
  getLowestPrice,
  getPriceRange,
  type CoreCatalogService,
  type CoreProduct,
  type CoreProductVariant,
  type CoreInventoryLevel,
  type ListProductsOptions,
  type SearchOptions,
  type ProductListResult,
  type ProductCategory,
  type AvailabilityCheckItem,
  type AvailabilityResult
} from '../../../lib'

/**
 * Mock Core Catalog Service
 * In production, this would make HTTP calls to the Core API
 */
const mockCoreCatalogService: CoreCatalogService = {
  async getProduct(tenantId: string, productId: string): Promise<CoreProduct | null> {
    // In production: GET {CORE_URL}/api/products/{productId}?tenantId={tenantId}
    return null
  },

  async getProductBySlug(tenantId: string, slug: string): Promise<CoreProduct | null> {
    // In production: GET {CORE_URL}/api/products/by-slug/{slug}?tenantId={tenantId}
    return null
  },

  async listProducts(tenantId: string, options: ListProductsOptions): Promise<ProductListResult> {
    // In production: GET {CORE_URL}/api/products?tenantId={tenantId}&...options
    return {
      products: [],
      total: 0,
      hasMore: false
    }
  },

  async searchProducts(tenantId: string, query: string, options?: SearchOptions): Promise<ProductListResult> {
    // In production: GET {CORE_URL}/api/products/search?tenantId={tenantId}&q={query}
    return {
      products: [],
      total: 0,
      hasMore: false
    }
  },

  async getVariant(tenantId: string, variantId: string): Promise<CoreProductVariant | null> {
    // In production: GET {CORE_URL}/api/variants/{variantId}?tenantId={tenantId}
    return null
  },

  async getInventory(tenantId: string, productId: string, variantId?: string): Promise<CoreInventoryLevel | null> {
    // In production: GET {CORE_URL}/api/inventory/{productId}?tenantId={tenantId}&variantId={variantId}
    return null
  },

  async checkAvailability(tenantId: string, items: AvailabilityCheckItem[]): Promise<AvailabilityResult[]> {
    // In production: POST {CORE_URL}/api/inventory/check-availability
    return items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      available: 0,
      status: 'OUT_OF_STOCK' as const,
      canPurchase: false,
      message: 'Product not found in Core'
    }))
  },

  async listCategories(tenantId: string): Promise<ProductCategory[]> {
    // In production: GET {CORE_URL}/api/categories?tenantId={tenantId}
    return []
  }
}

// Create the product service with in-memory cache
const productCache = new InMemoryProductCache()
const productService = new SVMProductService(mockCoreCatalogService, productCache)

/**
 * GET /api/svm/products
 * List or search products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Check for search query
    const query = searchParams.get('q') || searchParams.get('search')
    
    if (query) {
      // Search products
      const searchOptions: SearchOptions = {
        categoryId: searchParams.get('categoryId') || undefined,
        inStock: searchParams.get('inStock') === 'true',
        limit: parseInt(searchParams.get('limit') || '24')
      }

      const result = await productService.searchProducts(tenantId, query, searchOptions)
      
      return NextResponse.json({
        success: true,
        products: result.products.map(formatProductForAPI),
        total: result.total,
        hasMore: result.hasMore,
        query
      })
    }

    // List products with filters
    const listOptions: ListProductsOptions = {
      categoryId: searchParams.get('categoryId') || undefined,
      status: (searchParams.get('status') as 'ACTIVE' | 'DRAFT' | 'ARCHIVED') || 'ACTIVE',
      tags: searchParams.get('tags')?.split(',') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'price' | 'createdAt' | 'updatedAt') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      limit: parseInt(searchParams.get('limit') || '24'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    const result = await productService.listProducts(tenantId, listOptions)

    return NextResponse.json({
      success: true,
      products: result.products.map(formatProductForAPI),
      total: result.total,
      hasMore: result.hasMore,
      pagination: {
        limit: listOptions.limit,
        offset: listOptions.offset,
        total: result.total
      },
      filters: {
        categoryId: listOptions.categoryId,
        status: listOptions.status,
        tags: listOptions.tags,
        priceRange: listOptions.minPrice || listOptions.maxPrice ? {
          min: listOptions.minPrice,
          max: listOptions.maxPrice
        } : null,
        inStock: listOptions.inStock
      }
    })

  } catch (error) {
    console.error('[SVM] Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Format product for API response
 */
function formatProductForAPI(product: CoreProduct) {
  const priceRange = getPriceRange(product)
  const inStock = isInStock(product)
  
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    
    // Category
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    tags: product.tags,
    
    // Pricing
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    priceRange: priceRange.min !== priceRange.max ? priceRange : null,
    formattedPrice: formatPrice(getLowestPrice(product), product.currency),
    currency: product.currency,
    
    // Media
    images: product.images,
    primaryImage: product.images.find(img => img.isDefault) || product.images[0] || null,
    
    // Stock
    inStock,
    hasVariants: product.hasVariants,
    variantCount: product.variants.length,
    
    // SEO
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    
    // Status
    status: product.status,
    publishedAt: product.publishedAt,
    
    // Timestamps
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  }
}
