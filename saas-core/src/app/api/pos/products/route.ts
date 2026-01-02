/**
 * POS Products API
 * 
 * READ-ONLY endpoints for POS module to access Core product catalog.
 * POS does NOT modify products - only reads.
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreInventoryService } from '@/lib/core-services'

/**
 * GET /api/pos/products
 * Search products with inventory for POS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const query = searchParams.get('query') || ''
    const categoryId = searchParams.get('categoryId') || undefined
    const inStockOnly = searchParams.get('inStockOnly') === 'true'
    const locationId = searchParams.get('locationId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const products = await coreInventoryService.searchProducts(tenantId, query, {
      inStockOnly,
      categoryId,
      limit,
      locationId
    })
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[POS] Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pos/products
 * Get specific products by ID for POS (batch lookup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, productIds, locationId } = body
    
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
    
    const productsMap = await coreInventoryService.getMultipleProductInventory(
      tenantId,
      productIds,
      locationId
    )
    
    const products = Array.from(productsMap.values())
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[POS] Error fetching products by ID:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
