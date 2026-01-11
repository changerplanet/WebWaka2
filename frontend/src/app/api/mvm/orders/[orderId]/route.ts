export const dynamic = 'force-dynamic'

/**
 * MVM Order by ID API
 * 
 * GET/PUT individual order operations.
 */

import { NextRequest, NextResponse } from 'next/server'

// Temporary storage (same as parent route)
const orderStore = new Map<string, any[]>()

function getTenantOrders(tenantId: string) {
  if (!orderStore.has(tenantId)) {
    orderStore.set(tenantId, [])
  }
  return orderStore.get(tenantId)!
}

interface RouteParams {
  params: Promise<{ orderId: string }>
}

/**
 * GET /api/mvm/orders/:orderId
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { orderId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const orders = getTenantOrders(tenantId)
    const order = orders.find(o => o.id === orderId)
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      order,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/mvm/orders/:orderId
 * Update order or sub-order status
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { orderId } = await context.params
    const body = await request.json()
    const { tenantId, action, subOrderId, status: newStatus } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const orders = getTenantOrders(tenantId)
    const order = orders.find(o => o.id === orderId)
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Update sub-order status
    if (subOrderId && newStatus) {
      const subOrder = order.subOrders?.find((so: any) => so.id === subOrderId)
      if (!subOrder) {
        return NextResponse.json(
          { success: false, error: 'Sub-order not found' },
          { status: 404 }
        )
      }
      subOrder.status = newStatus
      subOrder.updatedAt = new Date().toISOString()
    }
    
    // Update parent order status
    if (newStatus && !subOrderId) {
      order.status = newStatus
    }
    
    order.updatedAt = new Date().toISOString()
    
    return NextResponse.json({
      success: true,
      order,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error updating order:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
