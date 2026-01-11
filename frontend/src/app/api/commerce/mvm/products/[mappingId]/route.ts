export const dynamic = 'force-dynamic'

/**
 * MVM Single Product Mapping API
 * 
 * GET /api/commerce/mvm/products/[mappingId] - Get mapping
 * PUT /api/commerce/mvm/products/[mappingId] - Update mapping
 * DELETE /api/commerce/mvm/products/[mappingId] - Delete mapping
 * POST /api/commerce/mvm/products/[mappingId]?action=... - Toggle actions
 * 
 * @module api/commerce/mvm/products/[mappingId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { ProductMappingService } from '@/lib/mvm'

// ============================================================================
// GET - Get Product Mapping
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { mappingId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { mappingId } = params
    const mapping = await ProductMappingService.getById(mappingId)

    if (!mapping) {
      return NextResponse.json(
        { success: false, error: 'Product mapping not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: mapping.id,
        tenantId: mapping.tenantId,
        vendorId: mapping.vendorId,
        vendor: mapping.vendor,
        productId: mapping.productId,
        variantId: mapping.variantId,
        vendorPrice: mapping.vendorPrice?.toNumber() || null,
        compareAtPrice: mapping.compareAtPrice?.toNumber() || null,
        minPrice: mapping.minPrice?.toNumber() || null,
        maxPrice: mapping.maxPrice?.toNumber() || null,
        allocatedStock: mapping.allocatedStock,
        commissionOverride: mapping.commissionOverride?.toNumber() || null,
        isActive: mapping.isActive,
        isFeatured: mapping.isFeatured,
        salesCount: mapping.salesCount,
        revenue: mapping.revenue.toNumber()
      }
    })
  } catch (error) {
    console.error('[MVM Product API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update Product Mapping
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { mappingId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { mappingId } = params
    const body = await request.json()

    const mapping = await ProductMappingService.getById(mappingId)
    if (!mapping) {
      return NextResponse.json(
        { success: false, error: 'Product mapping not found' },
        { status: 404 }
      )
    }

    const updated = await ProductMappingService.update(mappingId, body)

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        vendorPrice: updated.vendorPrice?.toNumber() || null,
        isActive: updated.isActive,
        isFeatured: updated.isFeatured
      }
    })
  } catch (error: any) {
    console.error('[MVM Product API] PUT Error:', error)
    
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

// ============================================================================
// DELETE - Delete Product Mapping
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { mappingId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { mappingId } = params

    const mapping = await ProductMappingService.getById(mappingId)
    if (!mapping) {
      return NextResponse.json(
        { success: false, error: 'Product mapping not found' },
        { status: 404 }
      )
    }

    await ProductMappingService.delete(mappingId)

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })
  } catch (error) {
    console.error('[MVM Product API] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Toggle Actions
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { mappingId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { mappingId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const mapping = await ProductMappingService.getById(mappingId)
    if (!mapping) {
      return NextResponse.json(
        { success: false, error: 'Product mapping not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'toggle-active':
        result = await ProductMappingService.toggleActive(mappingId)
        break
      
      case 'toggle-featured':
        // Check featured limit
        if (!mapping.isFeatured) {
          const canAdd = await ProductMappingService.canAddFeatured(mapping.vendorId)
          if (!canAdd.allowed) {
            return NextResponse.json(
              { 
                success: false, 
                error: `Featured limit reached (${canAdd.current}/${canAdd.limit})` 
              },
              { status: 400 }
            )
          }
        }
        result = await ProductMappingService.toggleFeatured(mappingId)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        isActive: result.isActive,
        isFeatured: result.isFeatured
      }
    })
  } catch (error) {
    console.error('[MVM Product API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
