export const dynamic = 'force-dynamic'

/**
 * MVM Vendor Orders API
 * 
 * Vendor-specific order views (sub-orders).
 * Vendors see ONLY their sub-orders, not the full parent order.
 */

import { NextRequest, NextResponse } from 'next/server'

// Temporary storage for vendor sub-orders
const subOrderStore = new Map<string, any[]>()

function getStoreKey(tenantId: string, vendorId: string) {
  return `${tenantId}:${vendorId}`
}

interface RouteParams {
  params: Promise<{ vendorId: string }>
}

/**
 * GET /api/mvm/vendors/:vendorId/orders
 * List sub-orders for this vendor
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const key = getStoreKey(tenantId, vendorId)
    let orders = subOrderStore.get(key) || []
    
    // Filter by status
    if (status) {
      orders = orders.filter(o => o.status === status)
    }
    
    // Paginate
    const total = orders.length
    orders = orders.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      vendorId,
      orders,
      total,
      hasMore: offset + orders.length < total,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error fetching vendor orders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
