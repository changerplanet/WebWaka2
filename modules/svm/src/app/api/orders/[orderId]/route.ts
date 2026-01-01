/**
 * SVM Order by ID API
 * 
 * GET /api/svm/orders/:orderId - Get order details
 * PUT /api/svm/orders/:orderId - Update order status (place, ship, etc.)
 * DELETE /api/svm/orders/:orderId - Cancel order
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  OrderEngine,
  canTransition,
  getValidTransitions,
  canCancel,
  type OrderData,
  type OrderState,
  type OrderEventEmitter,
  type OrderEvent
} from '../../../../lib'
import Decimal from 'decimal.js'

interface RouteParams {
  params: Promise<{ orderId: string }>
}

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
    }
  }
}

/**
 * Mock function to load order from database
 * In production, this would query the SVM database
 */
async function loadOrderFromDB(orderId: string): Promise<OrderData | null> {
  // In production: query svm_online_orders table
  // For now, return null to indicate not found
  return null
}

/**
 * GET /api/svm/orders/:orderId
 * Get order details
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { orderId } = await context.params

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    const order = await loadOrderFromDB(orderId)
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        subtotal: order.subtotal.toNumber(),
        shippingTotal: order.shippingTotal.toNumber(),
        taxTotal: order.taxTotal.toNumber(),
        discountTotal: order.discountTotal.toNumber(),
        grandTotal: order.grandTotal.toNumber()
      }
    })

  } catch (error) {
    console.error('[SVM] Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/svm/orders/:orderId
 * Update order status (place, mark paid, ship, deliver, etc.)
 * 
 * Actions:
 * - PLACE: Submit order for payment
 * - MARK_PAID: Confirm payment (called by Core webhook)
 * - START_PROCESSING: Begin order fulfillment
 * - MARK_SHIPPED: Add tracking info and ship
 * - MARK_DELIVERED: Confirm delivery
 * - MARK_FULFILLED: Complete order
 * - REQUEST_REFUND: Request refund from Core
 * - MARK_REFUNDED: Confirm refund (called by Core webhook)
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { orderId } = await context.params
    const body = await request.json()
    const { tenantId, action } = body

    if (!orderId || !tenantId || !action) {
      return NextResponse.json(
        { success: false, error: 'orderId, tenantId, and action are required' },
        { status: 400 }
      )
    }

    // In production, load from database
    const orderData = await loadOrderFromDB(orderId)
    
    if (!orderData) {
      // For demo purposes, create a mock order to demonstrate state machine
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found` },
        { status: 404 }
      )
    }

    // Load order into engine
    const eventEmitter = createOrderEventEmitter()
    const engine = OrderEngine.load(orderData, { tenantId, eventEmitter })

    // Execute action based on request
    switch (action) {
      case 'PLACE': {
        const { reservationId } = body
        await engine.place(reservationId)
        break
      }

      case 'MARK_PAID': {
        const { corePaymentId } = body
        if (!corePaymentId) {
          return NextResponse.json(
            { success: false, error: 'corePaymentId is required for MARK_PAID' },
            { status: 400 }
          )
        }
        await engine.markPaid(corePaymentId)
        break
      }

      case 'START_PROCESSING': {
        await engine.startProcessing()
        break
      }

      case 'MARK_SHIPPED': {
        const { carrier, trackingNumber, trackingUrl, estimatedDelivery, notifyCustomer } = body
        if (!carrier || !trackingNumber) {
          return NextResponse.json(
            { success: false, error: 'carrier and trackingNumber are required for MARK_SHIPPED' },
            { status: 400 }
          )
        }
        await engine.markShipped(carrier, trackingNumber, {
          trackingUrl,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
          notifyCustomer
        })
        break
      }

      case 'MARK_DELIVERED': {
        const { deliveryProof } = body
        await engine.markDelivered(deliveryProof)
        break
      }

      case 'MARK_FULFILLED': {
        await engine.markFulfilled()
        break
      }

      case 'REQUEST_REFUND': {
        const { refundType, amount, reason, requestedBy, items } = body
        if (!refundType || !amount || !reason || !requestedBy) {
          return NextResponse.json(
            { success: false, error: 'refundType, amount, reason, and requestedBy are required for REQUEST_REFUND' },
            { status: 400 }
          )
        }
        await engine.requestRefund(refundType, amount, reason, requestedBy, items)
        break
      }

      case 'MARK_REFUNDED': {
        const { coreRefundId, refundAmount } = body
        if (!coreRefundId || refundAmount === undefined) {
          return NextResponse.json(
            { success: false, error: 'coreRefundId and refundAmount are required for MARK_REFUNDED' },
            { status: 400 }
          )
        }
        await engine.markRefunded(coreRefundId, refundAmount)
        break
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Unknown action: ${action}`,
            validActions: ['PLACE', 'MARK_PAID', 'START_PROCESSING', 'MARK_SHIPPED', 'MARK_DELIVERED', 'MARK_FULFILLED', 'REQUEST_REFUND', 'MARK_REFUNDED']
          },
          { status: 400 }
        )
    }

    const state = engine.getState()

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} updated with action: ${action}`,
      order: {
        id: state.id,
        orderNumber: state.orderNumber,
        status: state.status,
        subtotal: state.subtotal.toNumber(),
        shippingTotal: state.shippingTotal.toNumber(),
        taxTotal: state.taxTotal.toNumber(),
        discountTotal: state.discountTotal.toNumber(),
        grandTotal: state.grandTotal.toNumber(),
        currency: state.currency,
        updatedAt: state.updatedAt.toISOString()
      },
      events: engine.getEvents().map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        timestamp: e.timestamp
      }))
    })

  } catch (error) {
    console.error('[SVM] Error updating order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/svm/orders/:orderId
 * Cancel an order
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { orderId } = await context.params
    const body = await request.json()
    const { tenantId, reason, cancelledBy, cancelledByUserId } = body

    if (!orderId || !tenantId || !reason || !cancelledBy) {
      return NextResponse.json(
        { success: false, error: 'orderId, tenantId, reason, and cancelledBy are required' },
        { status: 400 }
      )
    }

    if (!['CUSTOMER', 'MERCHANT', 'SYSTEM'].includes(cancelledBy)) {
      return NextResponse.json(
        { success: false, error: 'cancelledBy must be CUSTOMER, MERCHANT, or SYSTEM' },
        { status: 400 }
      )
    }

    // In production, load from database
    const orderData = await loadOrderFromDB(orderId)
    
    if (!orderData) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found` },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    if (!canCancel(orderData.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Order cannot be cancelled in ${orderData.status} status`,
          validTransitions: getValidTransitions(orderData.status)
        },
        { status: 400 }
      )
    }

    // Load and cancel order
    const eventEmitter = createOrderEventEmitter()
    const engine = OrderEngine.load(orderData, { tenantId, eventEmitter })
    await engine.cancel(reason, cancelledBy, cancelledByUserId)

    const state = engine.getState()

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} cancelled`,
      order: {
        id: state.id,
        orderNumber: state.orderNumber,
        status: state.status,
        updatedAt: state.updatedAt.toISOString()
      },
      cancellation: {
        reason,
        cancelledBy,
        cancelledByUserId,
        cancelledAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[SVM] Error cancelling order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
