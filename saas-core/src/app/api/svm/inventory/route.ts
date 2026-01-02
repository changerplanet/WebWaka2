/**
 * SVM Inventory API
 * 
 * READ-ONLY endpoints for SVM module to check Core inventory.
 * SVM emits order events - Core handles inventory mutations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { coreInventoryService } from '@/lib/core-services'

/**
 * GET /api/svm/inventory
 * Get inventory levels for products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const productId = searchParams.get('productId')
    const variantId = searchParams.get('variantId') || undefined
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
    
    return NextResponse.json({
      success: true,
      inventory: {
        productId: inventory.productId,
        variantId: inventory.variantId,
        available: inventory.quantityAvailable,
        reserved: inventory.quantityReserved,
        committed: 0,
        onHand: inventory.quantityOnHand,
        allowBackorder: inventory.allowNegative,
        lowStockThreshold: inventory.lowStockThreshold,
        locationId: inventory.locationId,
        locationName: inventory.locationName,
        updatedAt: inventory.lastUpdated?.toISOString()
      },
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[SVM] Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/svm/inventory
 * Check availability for cart items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, items, action } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Single item availability check
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
        variantId
      )
      
      return NextResponse.json({
        success: true,
        result: {
          productId: result.productId,
          variantId: result.variantId,
          requestedQty: result.requestedQuantity,
          available: result.availableQuantity,
          canPurchase: result.canFulfill,
          status: result.status,
          message: result.message
        },
        source: 'CORE'
      })
    }
    
    // Batch availability check for cart
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
        canPurchase: r.canFulfill,
        status: r.status,
        message: r.message
      })),
      unavailableItems: result.unavailableItems.map(r => ({
        productId: r.productId,
        variantId: r.variantId,
        requestedQty: r.requestedQuantity,
        availableQty: r.availableQuantity,
        message: r.message
      })),
      source: 'CORE'
    })
    
  } catch (error) {
    console.error('[SVM] Error checking availability:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
