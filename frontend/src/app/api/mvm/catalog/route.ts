export const dynamic = 'force-dynamic'

/**
 * MVM Catalog API
 * 
 * READ-ONLY endpoints for MVM module to access Core product catalog.
 * MVM does NOT modify products - vendors map to Core products.
 * 
 * IMPORTANT:
 * - Products are owned by Core (master catalog)
 * - Vendors create MAPPINGS to Core products
 * - No product duplication occurs
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { checkCapabilityGuard } from '@/lib/capabilities'

// ============================================================================
// HELPERS
// ============================================================================

function decimalToNumber(val: Prisma.Decimal | null): number {
  return val ? Number(val) : 0
}

function mapProductToResponse(product: any) {
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
    
    images: product.images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      position: img.position,
      isDefault: img.isDefault
    })) || [],
    
    status: product.status,
    
    hasVariants: product.ProductVariant?.length > 1,
    variants: product.ProductVariant?.map((v: any) => ({
      id: v.id,
      productId: v.productId,
      name: v.name,
      sku: v.sku,
      barcode: v.barcode,
      price: decimalToNumber(v.price || product.price),
      options: v.optionValues || {},
      isActive: v.isActive ?? true
    })) || [],
    
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
 * GET /api/mvm/catalog
 * List products available for vendor mapping
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')
    const query = searchParams.get('query')
    const vendorId = searchParams.get('vendorId') // To check existing mappings
    const unmappedOnly = searchParams.get('unmappedOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '24', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
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
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: 'ACTIVE'
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    // Get total count
    const total = await prisma.product.count({ where })
    
    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        ProductCategory: true,
        ProductVariant: true
      },
      orderBy: { name: 'asc' },
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
    console.error('[MVM] Error fetching catalog:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/catalog
 * Batch get products by IDs (for vendor product mappings)
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, productIds } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
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
    console.error('[MVM] Error batch fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
