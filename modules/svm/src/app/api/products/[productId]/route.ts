/**
 * SVM Product by ID API
 * 
 * GET /api/svm/products/:productId - Get product details with inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  SVMProductService,
  InMemoryProductCache,
  formatPrice,
  isInStock,
  getLowestPrice,
  getPriceRange,
  getStockStatus,
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
} from '../../../../lib'

interface RouteParams {
  params: Promise<{ productId: string }>
}

/**
 * Mock Core Catalog Service
 * In production, this would make HTTP calls to the Core API
 */
const mockCoreCatalogService: CoreCatalogService = {
  async getProduct(tenantId: string, productId: string): Promise<CoreProduct | null> {
    return null
  },
  async getProductBySlug(tenantId: string, slug: string): Promise<CoreProduct | null> {
    return null
  },
  async listProducts(tenantId: string, options: ListProductsOptions): Promise<ProductListResult> {
    return { products: [], total: 0, hasMore: false }
  },
  async searchProducts(tenantId: string, query: string, options?: SearchOptions): Promise<ProductListResult> {
    return { products: [], total: 0, hasMore: false }
  },
  async getVariant(tenantId: string, variantId: string): Promise<CoreProductVariant | null> {
    return null
  },
  async getInventory(tenantId: string, productId: string, variantId?: string): Promise<CoreInventoryLevel | null> {
    return null
  },
  async checkAvailability(tenantId: string, items: AvailabilityCheckItem[]): Promise<AvailabilityResult[]> {
    return items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      available: 0,
      status: 'OUT_OF_STOCK' as const,
      canPurchase: false
    }))
  },
  async listCategories(tenantId: string): Promise<ProductCategory[]> {
    return []
  }
}

const productCache = new InMemoryProductCache()
const productService = new SVMProductService(mockCoreCatalogService, productCache)

/**
 * GET /api/svm/products/:productId
 * Get product details with inventory status
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { productId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const includeInventory = searchParams.get('includeInventory') === 'true'

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId query parameter is required' },
        { status: 400 }
      )
    }

    // Check if productId is a slug (contains no underscores, starts with letter)
    const isSlug = !productId.includes('_') && /^[a-z]/.test(productId)

    const product = isSlug
      ? await productService.getProductBySlug(tenantId, productId)
      : await productService.getProduct(tenantId, productId, { includeInventory })

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product ${productId} not found` },
        { status: 404 }
      )
    }

    const priceRange = getPriceRange(product)

    return NextResponse.json({
      success: true,
      product: {
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
        
        // Tax
        taxable: product.taxable,
        taxCategoryId: product.taxCategoryId,
        
        // Media
        images: product.images,
        primaryImage: product.images.find(img => img.isDefault) || product.images[0] || null,
        
        // Variants
        hasVariants: product.hasVariants,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          formattedPrice: formatPrice(v.price, product.currency),
          options: v.options,
          imageUrl: v.imageUrl,
          weight: v.weight,
          isActive: v.isActive,
          inventoryQuantity: v.inventoryQuantity,
          inventoryPolicy: v.inventoryPolicy,
          stockStatus: getStockStatus(
            v.inventoryQuantity,
            5,
            v.inventoryPolicy === 'CONTINUE'
          )
        })),
        options: product.options,
        
        // Stock summary
        inStock: isInStock(product),
        
        // Physical properties
        weight: product.weight,
        weightUnit: product.weightUnit,
        
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
    })

  } catch (error) {
    console.error('[SVM] Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
