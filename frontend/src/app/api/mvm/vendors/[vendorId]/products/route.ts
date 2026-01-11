export const dynamic = 'force-dynamic'

/**
 * MVM Vendor Product Mappings API
 * 
 * Manages vendor-to-Core-product mappings.
 * Products are NOT duplicated - vendors map to existing Core products.
 */

import { NextRequest, NextResponse } from 'next/server'

// Temporary storage for product mappings
const productMappingStore = new Map<string, any[]>()

function getMappingKey(tenantId: string, vendorId: string) {
  return `${tenantId}:${vendorId}`
}

interface RouteParams {
  params: Promise<{ vendorId: string }>
}

/**
 * GET /api/mvm/vendors/:vendorId/products
 * List products mapped to this vendor
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const key = getMappingKey(tenantId, vendorId)
    const mappings = productMappingStore.get(key) || []
    
    return NextResponse.json({
      success: true,
      vendorId,
      mappings,
      count: mappings.length,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error fetching vendor products:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/vendors/:vendorId/products
 * Map Core products to this vendor
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const body = await request.json()
    const { tenantId, productId, commissionOverride, isActive = true } = body
    
    if (!tenantId || !productId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and productId are required' },
        { status: 400 }
      )
    }
    
    const key = getMappingKey(tenantId, vendorId)
    const mappings = productMappingStore.get(key) || []
    
    // Check for existing mapping
    const existing = mappings.find(m => m.productId === productId)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product already mapped to this vendor' },
        { status: 400 }
      )
    }
    
    const mapping = {
      id: `mapping_${Date.now().toString(36)}`,
      vendorId,
      productId,
      commissionOverride,
      isActive,
      createdAt: new Date().toISOString()
    }
    
    mappings.push(mapping)
    productMappingStore.set(key, mappings)
    
    return NextResponse.json({
      success: true,
      mapping,
      module: 'MVM'
    }, { status: 201 })
    
  } catch (error) {
    console.error('[MVM] Error mapping product:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mvm/vendors/:vendorId/products
 * Remove product mapping
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const productId = searchParams.get('productId')
    
    if (!tenantId || !productId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and productId are required' },
        { status: 400 }
      )
    }
    
    const key = getMappingKey(tenantId, vendorId)
    const mappings = productMappingStore.get(key) || []
    const index = mappings.findIndex(m => m.productId === productId)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Product mapping not found' },
        { status: 404 }
      )
    }
    
    const [removed] = mappings.splice(index, 1)
    productMappingStore.set(key, mappings)
    
    return NextResponse.json({
      success: true,
      message: 'Product mapping removed',
      removedMapping: removed,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error removing product mapping:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
