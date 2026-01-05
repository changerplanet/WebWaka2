/**
 * MVM Orders API
 * 
 * Multi-vendor order operations.
 * Orders are split into vendor sub-orders.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'

// Temporary storage
const orderStore = new Map<string, any[]>()

function getTenantOrders(tenantId: string) {
  if (!orderStore.has(tenantId)) {
    orderStore.set(tenantId, [])
  }
  return orderStore.get(tenantId)!
}

/**
 * GET /api/mvm/orders
 * List MVM orders (tenant admin view)
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    let orders = getTenantOrders(tenantId)
    
    // Filter by status
    if (status) {
      orders = orders.filter(o => o.status === status)
    }
    
    // Filter by vendor
    if (vendorId) {
      orders = orders.filter(o => 
        o.subOrders?.some((so: any) => so.vendorId === vendorId)
      )
    }
    
    // Paginate
    const total = orders.length
    orders = orders.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      orders,
      total,
      hasMore: offset + orders.length < total,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error listing orders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/orders
 * Create a multi-vendor order (splits into sub-orders)
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, customerId, items, shippingAddress, paymentMethod } = body
    
    if (!tenantId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tenantId and items are required' },
        { status: 400 }
      )
    }
    
    const orders = getTenantOrders(tenantId)
    
    const orderId = `order_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
    const orderNumber = `MVM-${Date.now().toString().slice(-8)}`
    
    // Group items by vendor
    const itemsByVendor = new Map<string, any[]>()
    for (const item of items) {
      const vendorId = item.vendorId || 'UNASSIGNED'
      if (!itemsByVendor.has(vendorId)) {
        itemsByVendor.set(vendorId, [])
      }
      itemsByVendor.get(vendorId)!.push(item)
    }
    
    // Create sub-orders
    const subOrders = Array.from(itemsByVendor.entries()).map(([vendorId, vendorItems], index) => {
      const subtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      return {
        id: `suborder_${orderId}_${index}`,
        subOrderNumber: `${orderNumber}-${String(index + 1).padStart(2, '0')}`,
        vendorId,
        items: vendorItems,
        subtotal,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    })
    
    const grandTotal = subOrders.reduce((sum, so) => sum + so.subtotal, 0)
    
    const order = {
      id: orderId,
      orderNumber,
      tenantId,
      customerId,
      subOrders,
      grandTotal,
      status: 'PENDING',
      shippingAddress,
      paymentMethod,
      // Single payment to Core
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    orders.push(order)
    
    return NextResponse.json({
      success: true,
      order,
      message: `Order split into ${subOrders.length} vendor sub-orders`,
      module: 'MVM'
    }, { status: 201 })
    
  } catch (error) {
    console.error('[MVM] Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
