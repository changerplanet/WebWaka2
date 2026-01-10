/**
 * SVM Order Status API
 * 
 * POST /api/commerce/svm/orders/[orderId]/status - Update order status
 * GET /api/commerce/svm/orders/[orderId]/status - Get status info
 * 
 * @module api/commerce/svm/orders/[orderId]/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { 
  updateOrderStatus,
  getAllowedTransitions,
  getOrderStatusDisplay,
  getOrderTimeline,
  type OrderStatus
} from '@/lib/svm'

// ============================================================================
// POST - Update Order Status
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { orderId } = params
    const body = await request.json()
    const { 
      status,
      actor = 'MERCHANT',
      trackingNumber,
      carrier,
      notes
    } = body as {
      status: OrderStatus
      actor?: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
      trackingNumber?: string
      carrier?: string
      notes?: string
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'New status required' },
        { status: 400 }
      )
    }

    // Verify order belongs to tenant
    const order = await prisma.svm_orders.findFirst({
      where: { id: orderId, tenantId },
      select: { id: true, status: true }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if transition is allowed
    const allowedTransitions = getAllowedTransitions(order.status as OrderStatus, actor)
    
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot transition from ${order.status} to ${status}`,
        allowedTransitions,
        currentStatus: order.status
      }, { status: 400 })
    }

    // Update status
    const result = await updateOrderStatus(orderId, status, actor, {
      trackingNumber,
      carrier,
      notes
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    // Get updated status display
    const statusDisplay = getOrderStatusDisplay(status)
    const timeline = getOrderTimeline(status)

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        previousStatus: order.status,
        newStatus: status,
        statusDisplay,
        timeline,
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[SVM Order Status API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get Status Info & Allowed Transitions
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { orderId } = params
    const { searchParams } = new URL(request.url)
    const actor = (searchParams.get('actor') || 'MERCHANT') as 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'

    // Fetch order
    const order = await prisma.svm_orders.findFirst({
      where: { id: orderId, tenantId },
      select: { 
        id: true, 
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const currentStatus = order.status as OrderStatus
    const statusDisplay = getOrderStatusDisplay(currentStatus)
    const timeline = getOrderTimeline(currentStatus)
    const allowedTransitions = getAllowedTransitions(currentStatus, actor)

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        currentStatus,
        statusDisplay,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        timeline,
        allowedTransitions: allowedTransitions.map((s: any) => ({
          status: s,
          display: getOrderStatusDisplay(s)
        })),
        timestamps: {
          createdAt: order.createdAt,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
          cancelledAt: order.cancelledAt
        }
      }
    })
  } catch (error) {
    console.error('[SVM Order Status API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
