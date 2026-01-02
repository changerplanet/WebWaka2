/**
 * SVM Order by ID API - Database Persistent
 * 
 * GET /api/svm/orders/:orderId - Get order details
 * PUT /api/svm/orders/:orderId - Update order status
 * DELETE /api/svm/orders/:orderId - Cancel order
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  'DRAFT': ['PLACED', 'CANCELLED'],
  'PLACED': ['PAID', 'CANCELLED'],
  'PAID': ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  'PROCESSING': ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  'SHIPPED': ['DELIVERED', 'REFUNDED'],
  'DELIVERED': ['FULFILLED', 'REFUNDED'],
  'FULFILLED': ['REFUNDED'],
  'CANCELLED': [],
  'REFUNDED': []
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
        tenantId: order.tenantId,
        customerId: order.customerId,
        sessionId: order.sessionId,
        guestEmail: order.guestEmail,
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
          taxAmount: Number(item.taxAmount)
        })),
        itemCount: order.itemCount,
        subtotal: Number(order.subtotal),
        shippingTotal: Number(order.shippingTotal),
        taxTotal: Number(order.taxTotal),
        discountTotal: Number(order.discountTotal),
        grandTotal: Number(order.grandTotal),
        promotionCode: order.promotionCode,
        currency: order.currency,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        shippingMethod: order.shippingMethod,
        shippingZoneId: order.shippingZoneId,
        shippingRateId: order.shippingRateId,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        notes: order.notes,
        cancelReason: order.cancelReason,
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
      trackingNumber, 
      trackingUrl, 
      notes,
      cancelReason,
      refundReason,
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

    // Handle status transition
    if (status && status !== order.status) {
      const allowed = validTransitions[order.status] || []
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

      // Set timestamp based on status
      switch (status) {
        case 'PAID':
          updateData.paidAt = now
          break
        case 'SHIPPED':
          updateData.shippedAt = now
          break
        case 'DELIVERED':
          updateData.deliveredAt = now
          break
        case 'CANCELLED':
          updateData.cancelledAt = now
          if (cancelReason) updateData.cancelReason = cancelReason
          break
        case 'REFUNDED':
          updateData.refundedAt = now
          if (refundReason) updateData.refundReason = refundReason
          break
      }
    }

    // Handle other field updates
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl
    if (notes !== undefined) updateData.notes = notes
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

    // Emit status change event if status changed
    if (status && status !== order.status) {
      console.log('[SVM] Order Event: svm.order.status_changed', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        previousStatus: order.status,
        newStatus: status,
        tenantId
      })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        tenantId: updatedOrder.tenantId,
        customerId: updatedOrder.customerId,
        sessionId: updatedOrder.sessionId,
        guestEmail: updatedOrder.guestEmail,
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
          taxAmount: Number(item.taxAmount)
        })),
        itemCount: updatedOrder.itemCount,
        subtotal: Number(updatedOrder.subtotal),
        shippingTotal: Number(updatedOrder.shippingTotal),
        taxTotal: Number(updatedOrder.taxTotal),
        discountTotal: Number(updatedOrder.discountTotal),
        grandTotal: Number(updatedOrder.grandTotal),
        promotionCode: updatedOrder.promotionCode,
        currency: updatedOrder.currency,
        shippingAddress: updatedOrder.shippingAddress,
        billingAddress: updatedOrder.billingAddress,
        shippingMethod: updatedOrder.shippingMethod,
        trackingNumber: updatedOrder.trackingNumber,
        trackingUrl: updatedOrder.trackingUrl,
        notes: updatedOrder.notes,
        cancelReason: updatedOrder.cancelReason,
        refundReason: updatedOrder.refundReason,
        paidAt: updatedOrder.paidAt?.toISOString() || null,
        shippedAt: updatedOrder.shippedAt?.toISOString() || null,
        deliveredAt: updatedOrder.deliveredAt?.toISOString() || null,
        cancelledAt: updatedOrder.cancelledAt?.toISOString() || null,
        refundedAt: updatedOrder.refundedAt?.toISOString() || null,
        createdAt: updatedOrder.createdAt.toISOString(),
        updatedAt: updatedOrder.updatedAt.toISOString()
      },
      events: status && status !== order.status ? [{
        eventId: `evt_${Date.now().toString(36)}`,
        eventType: 'svm.order.status_changed',
        previousStatus: order.status,
        newStatus: status,
        timestamp: now.toISOString()
      }] : []
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
    let cancelReason = searchParams.get('cancelReason')

    // Try body if not in query params
    if (!tenantId) {
      try {
        const body = await request.json()
        tenantId = body.tenantId
        cancelReason = body.cancelReason || cancelReason
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
    const allowed = validTransitions[order.status] || []
    if (!allowed.includes('CANCELLED')) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot cancel order in ${order.status} status. Order can only be cancelled from: DRAFT, PLACED, PAID, or PROCESSING` 
        },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.svmOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: cancelReason || 'Cancelled by request'
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
        cancelledAt: updatedOrder.cancelledAt?.toISOString(),
        cancelReason: updatedOrder.cancelReason
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
