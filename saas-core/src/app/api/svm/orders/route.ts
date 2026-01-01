/**
 * SVM Orders API - Core Proxy
 * 
 * POST /api/svm/orders - Create a new order
 * GET /api/svm/orders - List orders
 * 
 * This route proxies to the SVM module's order logic.
 * In a full production setup, these could be imported directly from the module.
 */

import { NextRequest, NextResponse } from 'next/server'

// Re-export from SVM module logic
// For now, implementing inline (in production, import from @saas-core/svm)

interface OrderItemInput {
  productId: string
  variantId?: string
  productName: string
  productSku?: string
  variantName?: string
  unitPrice: number
  quantity: number
}

interface ShippingAddress {
  name: string
  address1: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  phone?: string
}

interface OrderItem {
  productId: string
  variantId?: string
  productName: string
  productSku?: string
  variantName?: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}${random}`
}

function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `ORD-${year}${month}${day}-${seq}`
}

/**
 * POST /api/svm/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tenantId, 
      customerId, 
      guestEmail, 
      items, 
      shippingAddress, 
      shippingMethod, 
      currency,
      shippingTotal,
      taxTotal,
      discountTotal
    } = body

    // Validation
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    if (!customerId && !guestEmail) {
      return NextResponse.json(
        { success: false, error: 'Either customerId or guestEmail is required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.productName || item.unitPrice === undefined || !item.quantity) {
        return NextResponse.json(
          { success: false, error: 'Each item must have productId, productName, unitPrice, and quantity' },
          { status: 400 }
        )
      }
    }

    // Create order
    const orderId = generateId('order')
    const orderNumber = generateOrderNumber()
    const now = new Date()

    const orderItems: OrderItem[] = items.map((item: OrderItemInput) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      productSku: item.productSku,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity
    }))

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const grandTotal = subtotal + (shippingTotal || 0) + (taxTotal || 0) - (discountTotal || 0)

    // Emit order created event (logged)
    console.log('[SVM] Order Event: svm.order.created', {
      orderId,
      orderNumber,
      tenantId,
      itemCount: orderItems.length
    })

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        status: 'DRAFT',
        tenantId,
        customerId,
        guestEmail,
        items: orderItems,
        subtotal,
        shippingTotal: shippingTotal || 0,
        taxTotal: taxTotal || 0,
        discountTotal: discountTotal || 0,
        grandTotal,
        currency: currency || 'USD',
        shippingAddress,
        shippingMethod,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      events: [{
        eventId: generateId('evt'),
        eventType: 'svm.order.created',
        timestamp: now.toISOString()
      }]
    }, { status: 201 })

  } catch (error) {
    console.error('[SVM] Error creating order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/svm/orders
 * List orders for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // In production, query database
    // For now, return mock structure
    return NextResponse.json({
      success: true,
      orders: [],
      pagination: {
        limit,
        offset,
        total: 0
      },
      filters: {
        tenantId,
        customerId: customerId || null,
        status: status || 'all'
      }
    })

  } catch (error) {
    console.error('[SVM] Error listing orders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
