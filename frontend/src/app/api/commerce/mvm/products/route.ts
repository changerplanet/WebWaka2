/**
 * MVM Product Mappings API
 * 
 * GET /api/commerce/mvm/products - List product mappings
 * POST /api/commerce/mvm/products - Create product mapping
 * 
 * @module api/commerce/mvm/products
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { ProductMappingService } from '@/lib/mvm'

// ============================================================================
// GET - List Product Mappings
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const productId = searchParams.get('productId')
    const isActive = searchParams.get('isActive')
    const isFeatured = searchParams.get('isFeatured')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const result = await ProductMappingService.list({
      tenantId,
      vendorId: vendorId || undefined,
      productId: productId || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
      page,
      pageSize
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Products API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Product Mapping
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { vendorId, productId, variantId, vendorPrice, ...rest } = body

    if (!vendorId || !productId) {
      return NextResponse.json(
        { success: false, error: 'vendorId and productId are required' },
        { status: 400 }
      )
    }

    // Check if mapping already exists
    const existing = await ProductMappingService.getByVendorProduct(vendorId, productId, variantId)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product mapping already exists for this vendor' },
        { status: 409 }
      )
    }

    const mapping = await ProductMappingService.create({
      tenantId,
      vendorId,
      productId,
      variantId,
      vendorPrice,
      ...rest
    })

    return NextResponse.json({
      success: true,
      data: {
        id: mapping.id,
        vendorId: mapping.vendorId,
        productId: mapping.productId,
        vendorPrice: mapping.vendorPrice?.toNumber() || null,
        isActive: mapping.isActive
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('[MVM Products API] POST Error:', error)
    
    if (error.message?.includes('Invalid pricing')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
