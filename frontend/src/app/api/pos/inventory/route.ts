/**
 * POS Inventory API
 * 
 * READ-ONLY endpoints for POS module to check inventory.
 * POS emits events - Core handles inventory mutations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreInventoryService } from '@/lib/core-services'
import { checkCapabilityGuard } from '@/lib/capabilities'

/**
 * GET /api/pos/inventory
 * Get inventory snapshot for offline cache
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const locationId = searchParams.get('locationId') || undefined
    const includeZeroStock = searchParams.get('includeZeroStock') === 'true'
    const productIdsParam = searchParams.get('productIds')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const productIds = productIdsParam ? productIdsParam.split(',') : undefined
    
    const inventory = await coreInventoryService.getInventorySnapshot(tenantId, {
      productIds,
      includeZeroStock,
      locationId
    })
    
    return NextResponse.json({
      success: true,
      inventory,
      count: inventory.length,
      source: 'CORE',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[POS] Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pos/inventory
 * Check availability for cart items
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, items, locationId, action } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Single item check
    if (action === 'CHECK_SINGLE') {
      const { productId, variantId, quantity } = body
      
      if (!productId || quantity === undefined) {
        return NextResponse.json(
          { success: false, error: 'productId and quantity are required' },
          { status: 400 }
        )
      }
      
      const result = await coreInventoryService.checkAvailability(
        tenantId,
        productId,
        quantity,
        variantId,
        locationId
      )
      
      return NextResponse.json({
        success: true,
        result,
        source: 'CORE'
      })
    }
    
    // Batch check for cart
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'items array is required' },
        { status: 400 }
      )
    }
    
    const result = await coreInventoryService.checkBatchAvailability(
      tenantId,
      { items },
      locationId
    )
    
    return NextResponse.json({
      success: true,
      ...result,
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[POS] Error checking inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
