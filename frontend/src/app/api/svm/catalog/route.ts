export const dynamic = 'force-dynamic'

/**
 * SVM Catalog API
 * 
 * READ-ONLY endpoints for SVM module to access Core product catalog.
 * SVM does NOT modify products - only reads for storefront display.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { validateProductStatus, validateCatalogSortBy, validateSortOrder } from '@/lib/enums'

// ============================================================================
// HELPERS
// ============================================================================

function decimalToNumber(val: Prisma.Decimal | null): number {
  return val ? Number(val) : 0
}

function mapProductToResponse(product: any, includeVariants = true) {
  return {
    id: product.id,
    tenantId: product.tenantId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    
    categoryId: product.categoryId,
    categoryName: product.category?.name,
    tags: product.tags || [],
    
    basePrice: decimalToNumber(product.price),
    compareAtPrice: product.compareAtPrice ? decimalToNumber(product.compareAtPrice) : null,
    currency: 'USD',
    
    taxable: product.taxable ?? true,
    taxCategoryId: product.taxCategoryId,
    
    images: product.images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      position: img.position,
      isDefault: img.isDefault
    })) || [],
    
    status: product.status,
    publishedAt: product.publishedAt?.toISOString(),
    
    hasVariants: product.variants?.length > 1,
    variants: includeVariants ? product.variants?.map((v: any) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      sku: v.sku,
      barcode: v.barcode,
      price: decimalToNumber(v.price || product.price),
      compareAtPrice: v.compareAtPrice ? decimalToNumber(v.compareAtPrice) : null,
      options: v.optionValues || {},
      imageUrl: v.imageUrl,
      weight: v.weight ? decimalToNumber(v.weight) : null,
      isActive: v.isActive ?? true,
      inventoryQuantity: 0, // Will be enriched by inventory API
      inventoryPolicy: product.allowBackorder ? 'CONTINUE' : 'DENY',
      createdAt: v.createdAt?.toISOString(),
      updatedAt: v.updatedAt?.toISOString()
    })) : [],
    
    options: product.options || [],
    
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    
    weight: product.weight ? decimalToNumber(product.weight) : null,
    weightUnit: product.weightUnit || 'lb',
    
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString()
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/svm/catalog
 * List or search products for storefront
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const productId = searchParams.get('productId')
    const slug = searchParams.get('slug')
    const categoryId = searchParams.get('categoryId')
    const query = searchParams.get('query')
    const inStockOnly = searchParams.get('inStockOnly') === 'true'
    const status = searchParams.get('status') || 'ACTIVE'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '24', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required', hint: 'Pass tenantId as a query parameter: ?tenantId=your-tenant-id' },
        { status: 400 }
      )
    }
    
    // Get single product by ID
    if (productId) {
      const product = await prisma.product.findFirst({
        where: { id: productId, tenantId },
        include: {
          ProductCategory: true,
          ProductVariant: true
        }
      })
      
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        product: mapProductToResponse(product),
        source: 'CORE'
      })
    }
    
    // Get product by slug
    if (slug) {
      const product = await prisma.product.findFirst({
        where: { slug, tenantId },
        include: {
          ProductCategory: true,
          ProductVariant: true
        }
      })
      
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        product: mapProductToResponse(product),
        source: 'CORE'
      })
    }
    
    // Build where clause for list/search
    // Phase 11C: Using type-safe enum validator
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: validateProductStatus(status)
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ]
    }
    
    // Get total count
    const total = await prisma.product.count({ where })
    
    // Get products
    // Phase 11C: Using type-safe sort validators
    const validatedSortBy = validateCatalogSortBy(sortBy)
    const validatedSortOrder = validateSortOrder(sortOrder)
    
    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    if (validatedSortBy === 'price') {
      orderBy.price = validatedSortOrder
    } else if (validatedSortBy === 'createdAt') {
      orderBy.createdAt = validatedSortOrder
    } else {
      orderBy.name = validatedSortOrder
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        ProductCategory: true,
        ProductVariant: true
      },
      orderBy,
      take: limit,
      skip: offset
    })
    
    return NextResponse.json({
      success: true,
      products: products.map(p => mapProductToResponse(p)),
      total,
      hasMore: offset + products.length < total,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[SVM] Error fetching catalog:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/svm/catalog
 * Batch get products by IDs
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, productIds } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required', hint: 'Pass tenantId in the request body: { "tenantId": "your-tenant-id", "productIds": [...] }' },
        { status: 400 }
      )
    }
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'productIds array is required' },
        { status: 400 }
      )
    }
    
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId
      },
      include: {
        ProductCategory: true,
        ProductVariant: true
      }
    })
    
    return NextResponse.json({
      success: true,
      products: products.map(p => mapProductToResponse(p)),
      count: products.length,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[SVM] Error batch fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
