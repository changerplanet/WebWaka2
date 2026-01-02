/**
 * SVM Order by ID API - Database Persistent
 * 
 * GET /api/svm/orders/:orderId - Get order details
 * PUT /api/svm/orders/:orderId - Update order status
 * DELETE /api/svm/orders/:orderId - Cancel order
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Status enums from schema
type SvmOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
type SvmPaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED' | 'CANCELLED'
type SvmFulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'RETURNED'

// Valid status transitions
const validOrderTransitions: Record<string, string[]> = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': ['REFUNDED', 'PARTIALLY_REFUNDED'],
  'CANCELLED': [],
  'REFUNDED': [],
  'PARTIALLY_REFUNDED': ['REFUNDED']
}

const validPaymentTransitions: Record<string, string[]> = {
  'PENDING': ['AUTHORIZED', 'CAPTURED', 'FAILED'],
  'AUTHORIZED': ['CAPTURED', 'FAILED'],
  'CAPTURED': ['PARTIALLY_REFUNDED', 'REFUNDED'],
  'PARTIALLY_REFUNDED': ['REFUNDED'],
  'REFUNDED': [],
  'FAILED': ['PENDING']
}

const validFulfillmentTransitions: Record<string, string[]> = {
  'UNFULFILLED': ['PARTIALLY_FULFILLED', 'FULFILLED'],
  'PARTIALLY_FULFILLED': ['FULFILLED', 'RETURNED'],
  'FULFILLED': ['RETURNED'],
  'RETURNED': []
}

interface RouteParams {
  params: Promise<{ orderId: string }>
}

/**
 * GET /api/svm/orders/:orderId
 * Get order details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const order = await prisma.svmOrder.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Order does not belong to this tenant' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        tenantId: order.tenantId,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        channel: order.channel,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          variantName: item.variantName,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          discountAmount: Number(item.discountAmount),
          taxAmount: Number(item.taxAmount),
          fulfilledQuantity: item.fulfilledQuantity,
          refundedQuantity: item.refundedQuantity,
          customizations: item.customizations
        })),
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        taxTotal: Number(order.taxTotal),
        discountTotal: Number(order.discountTotal),
        grandTotal: Number(order.grandTotal),
        refundedAmount: Number(order.refundedAmount),
        promotionCode: order.promotionCode,
        promotionId: order.promotionId,
        currency: order.currency,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        shippingMethod: order.shippingMethod,
        shippingCarrier: order.shippingCarrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        paymentMethod: order.paymentMethod,
        paymentRef: order.paymentRef,
        customerNotes: order.customerNotes,
        internalNotes: order.internalNotes,
        refundReason: order.refundReason,
        paidAt: order.paidAt?.toISOString() || null,
        shippedAt: order.shippedAt?.toISOString() || null,
        deliveredAt: order.deliveredAt?.toISOString() || null,
        cancelledAt: order.cancelledAt?.toISOString() || null,
        refundedAt: order.refundedAt?.toISOString() || null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
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
 * Update order status or details
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { 
      tenantId, 
      status, 
      paymentStatus,
      fulfillmentStatus,
      trackingNumber, 
      trackingUrl, 
      shippingCarrier,
      estimatedDelivery,
      paymentMethod,
      paymentRef,
      internalNotes,
      refundReason,
      refundedAmount,
      shippingAddress,
      billingAddress
    } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const order = await prisma.svmOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Order does not belong to this tenant' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const now = new Date()
    const events: { type: string; from: string; to: string }[] = []

    // Handle order status transition
    if (status && status !== order.status) {
      const allowed = validOrderTransitions[order.status] || []
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid status transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}` 
          },
          { status: 400 }
        )
      }
      updateData.status = status
      events.push({ type: 'status', from: order.status, to: status })

      // Set timestamps based on status
      if (status === 'CANCELLED') {
        updateData.cancelledAt = now
      } else if (status === 'REFUNDED') {
        updateData.refundedAt = now
        if (refundReason) updateData.refundReason = refundReason
      }
    }

    // Handle payment status transition
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      const allowed = validPaymentTransitions[order.paymentStatus] || []
      if (!allowed.includes(paymentStatus)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid payment status transition from ${order.paymentStatus} to ${paymentStatus}. Allowed: ${allowed.join(', ') || 'none'}` 
          },
          { status: 400 }
        )
      }
      updateData.paymentStatus = paymentStatus
      events.push({ type: 'paymentStatus', from: order.paymentStatus, to: paymentStatus })

      // Set paid timestamp
      if (paymentStatus === 'CAPTURED') {
        updateData.paidAt = now
      }
    }

    // Handle fulfillment status transition
    if (fulfillmentStatus && fulfillmentStatus !== order.fulfillmentStatus) {
      const allowed = validFulfillmentTransitions[order.fulfillmentStatus] || []
      if (!allowed.includes(fulfillmentStatus)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid fulfillment status transition from ${order.fulfillmentStatus} to ${fulfillmentStatus}. Allowed: ${allowed.join(', ') || 'none'}` 
          },
          { status: 400 }
        )
      }
      updateData.fulfillmentStatus = fulfillmentStatus
      events.push({ type: 'fulfillmentStatus', from: order.fulfillmentStatus, to: fulfillmentStatus })
    }

    // Handle other field updates
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber
      // If tracking added, assume shipped
      if (trackingNumber && !order.shippedAt) {
        updateData.shippedAt = now
      }
    }
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl
    if (shippingCarrier !== undefined) updateData.shippingCarrier = shippingCarrier
    if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : null
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (paymentRef !== undefined) updateData.paymentRef = paymentRef
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (refundedAmount !== undefined) updateData.refundedAmount = refundedAmount
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.svmOrder.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true }
    })

    // Log events
    if (events.length > 0) {
      console.log('[SVM] Order Event: svm.order.updated', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        tenantId,
        changes: events
      })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        fulfillmentStatus: updatedOrder.fulfillmentStatus,
        tenantId: updatedOrder.tenantId,
        customerId: updatedOrder.customerId,
        customerEmail: updatedOrder.customerEmail,
        customerPhone: updatedOrder.customerPhone,
        customerName: updatedOrder.customerName,
        channel: updatedOrder.channel,
        items: updatedOrder.items.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          variantName: item.variantName,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          discountAmount: Number(item.discountAmount),
          taxAmount: Number(item.taxAmount),
          fulfilledQuantity: item.fulfilledQuantity,
          refundedQuantity: item.refundedQuantity
        })),
        subtotal: Number(updatedOrder.subtotal),
        shippingTotal: Number(updatedOrder.shippingTotal),
        taxTotal: Number(updatedOrder.taxTotal),
        discountTotal: Number(updatedOrder.discountTotal),
        grandTotal: Number(updatedOrder.grandTotal),
        refundedAmount: Number(updatedOrder.refundedAmount),
        promotionCode: updatedOrder.promotionCode,
        currency: updatedOrder.currency,
        shippingAddress: updatedOrder.shippingAddress,
        billingAddress: updatedOrder.billingAddress,
        shippingMethod: updatedOrder.shippingMethod,
        shippingCarrier: updatedOrder.shippingCarrier,
        trackingNumber: updatedOrder.trackingNumber,
        trackingUrl: updatedOrder.trackingUrl,
        estimatedDelivery: updatedOrder.estimatedDelivery?.toISOString() || null,
        paymentMethod: updatedOrder.paymentMethod,
        paymentRef: updatedOrder.paymentRef,
        internalNotes: updatedOrder.internalNotes,
        refundReason: updatedOrder.refundReason,
        paidAt: updatedOrder.paidAt?.toISOString() || null,
        shippedAt: updatedOrder.shippedAt?.toISOString() || null,
        deliveredAt: updatedOrder.deliveredAt?.toISOString() || null,
        cancelledAt: updatedOrder.cancelledAt?.toISOString() || null,
        refundedAt: updatedOrder.refundedAt?.toISOString() || null,
        createdAt: updatedOrder.createdAt.toISOString(),
        updatedAt: updatedOrder.updatedAt.toISOString()
      },
      events: events.map(e => ({
        eventId: `evt_${Date.now().toString(36)}`,
        eventType: `svm.order.${e.type}_changed`,
        previous: e.from,
        current: e.to,
        timestamp: now.toISOString()
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
 * Cancel an order (soft delete via status change)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId')

    // Try body if not in query params
    if (!tenantId) {
      try {
        const body = await request.json()
        tenantId = body.tenantId
      } catch {
        // Body parse failed
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const order = await prisma.svmOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: 'Order does not belong to this tenant' },
        { status: 403 }
      )
    }

    // Check if cancellation is allowed
    const allowed = validOrderTransitions[order.status] || []
    if (!allowed.includes('CANCELLED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot cancel order in ${order.status} status. Order can only be cancelled from: PENDING, CONFIRMED, PROCESSING, or ON_HOLD` 
        },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.svmOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    })

    console.log('[SVM] Order Event: svm.order.cancelled', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      previousStatus: order.status,
      tenantId
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        cancelledAt: updatedOrder.cancelledAt?.toISOString()
      },
      events: [{
        eventId: `evt_${Date.now().toString(36)}`,
        eventType: 'svm.order.cancelled',
        timestamp: new Date().toISOString()
      }]
    })

  } catch (error) {
    console.error('[SVM] Error cancelling order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
