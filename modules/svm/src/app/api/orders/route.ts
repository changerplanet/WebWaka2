/**
 * SVM Orders API
 * 
 * POST /api/svm/orders - Create a new order from cart
 * GET /api/svm/orders - List orders for the tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  OrderEngine,
  generateOrderNumber,
  type CreateOrderInput,
  type OrderEventEmitter,
  type OrderEvent
} from '../../../lib'

/**
 * Event emitter that logs events (in production, send to Core)
 */
function createOrderEventEmitter(): OrderEventEmitter {
  return {
    async emit(event: OrderEvent): Promise<void> {
      console.log('[SVM] Order Event:', event.eventType, {
        eventId: event.eventId,
        orderId: event.payload.orderId,
        orderNumber: event.payload.orderNumber
      })
      // In production: POST to Core's event endpoint
      // await fetch(`${CORE_URL}/api/events`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    }
  }
}

/**
 * POST /api/svm/orders
 * Create a new order from cart items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, customerId, guestEmail, items, shippingAddress, shippingMethod, currency } = body

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

    // Validate items have required fields
    for (const item of items) {
      if (!item.productId || !item.productName || item.unitPrice === undefined || !item.quantity) {
        return NextResponse.json(
          { success: false, error: 'Each item must have productId, productName, unitPrice, and quantity' },
          { status: 400 }
        )
      }
    }

    // Create event emitter
    const eventEmitter = createOrderEventEmitter()

    // Prepare order input
    const orderInput: CreateOrderInput = {
      customerId,
      guestEmail,
      items: items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSku: item.productSku,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      shippingTotal: body.shippingTotal || 0,
      taxTotal: body.taxTotal || 0,
      discountTotal: body.discountTotal || 0,
      currency: currency || 'USD',
      shippingAddress: shippingAddress ? {
        name: shippingAddress.name,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone
      } : undefined,
      shippingMethod
    }

    // Create the order (starts in DRAFT state)
    const engine = OrderEngine.create(orderInput, {
      tenantId,
      eventEmitter
    })

    const state = engine.getState()

    return NextResponse.json({
      success: true,
      order: {
        id: state.id,
        orderNumber: state.orderNumber,
        status: state.status,
        tenantId: state.tenantId,
        customerId: state.customerId,
        guestEmail: state.guestEmail,
        items: state.items,
        subtotal: state.subtotal.toNumber(),
        shippingTotal: state.shippingTotal.toNumber(),
        taxTotal: state.taxTotal.toNumber(),
        discountTotal: state.discountTotal.toNumber(),
        grandTotal: state.grandTotal.toNumber(),
        currency: state.currency,
        shippingAddress: state.shippingAddress,
        shippingMethod: state.shippingMethod,
        createdAt: state.createdAt.toISOString(),
        updatedAt: state.updatedAt.toISOString()
      },
      events: engine.getEvents().map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        timestamp: e.timestamp
      }))
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

    // In production, this would query the SVM database
    // For now, return mock structure showing the expected response
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
