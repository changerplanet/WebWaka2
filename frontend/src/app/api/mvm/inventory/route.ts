export const dynamic = 'force-dynamic'

/**
 * MVM Inventory API
 * 
 * READ-ONLY endpoints for MVM module to check Core inventory.
 * MVM emits order/suborder events - Core handles inventory mutations.
 * 
 * IMPORTANT:
 * - Inventory is owned by Core
 * - MVM reads for availability display
 * - Vendor product mappings may have allocated stock limits
 * - Actual inventory mutations happen via events
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreInventoryService } from '@/lib/core-services'

/**
 * GET /api/mvm/inventory
 * Get inventory for a product (can be filtered by vendor allocation)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId') || undefined
    const vendorId = searchParams.get('vendorId') // Optional: for vendor-specific allocation
    const locationId = searchParams.get('locationId') || undefined
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      )
    }
    
    const inventory = await coreInventoryService.getProductInventory(
      tenantId,
      productId,
      variantId,
      locationId
    )
    
    if (!inventory) {
      return NextResponse.json({
        success: true,
        inventory: null,
        source: 'CORE'
      })
    }
    
    // FUTURE: If vendorId provided, check vendor allocation limit
    // Currently returns full Core inventory - vendor allocation is handled at checkout
    // This is safe as vendor cannot oversell beyond Core availability
    
    return NextResponse.json({
      success: true,
      inventory: {
        productId: inventory.productId,
        variantId: inventory.variantId,
        available: inventory.quantityAvailable,
        reserved: inventory.quantityReserved,
        onHand: inventory.quantityOnHand,
        allowBackorder: inventory.allowNegative,
        lowStockThreshold: inventory.lowStockThreshold,
        locationId: inventory.locationId,
        locationName: inventory.locationName,
        updatedAt: inventory.lastUpdated?.toISOString()
      },
      vendorId,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[MVM] Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/inventory
 * Check availability for vendor order items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, items, vendorId } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'items array is required' },
        { status: 400 }
      )
    }
    
    const result = await coreInventoryService.checkBatchAvailability(
      tenantId,
      { items: items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity || item.requestedQty
      })) }
    )
    
    return NextResponse.json({
      success: true,
      allAvailable: result.allAvailable,
      items: result.results.map(r => ({
        productId: r.productId,
        variantId: r.variantId,
        requestedQty: r.requestedQuantity,
        available: r.availableQuantity,
        canFulfill: r.canFulfill,
        status: r.status,
        message: r.message
      })),
      unavailableItems: result.unavailableItems,
      vendorId,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[MVM] Error checking availability:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
