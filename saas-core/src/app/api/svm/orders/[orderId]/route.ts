/**
 * SVM Order by ID API - Core Proxy
 * 
 * GET /api/svm/orders/:orderId - Get order details
 * PUT /api/svm/orders/:orderId - Update order (place, ship, etc.)
 * DELETE /api/svm/orders/:orderId - Cancel order
 */

import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ orderId: string }>
}

// Order state transitions
const ORDER_TRANSITIONS: Record<string, string[]> = {
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

function canTransition(from: string, to: string): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false
}

function getValidTransitions(current: string): string[] {
  return ORDER_TRANSITIONS[current] || []
}

/**
 * GET /api/svm/orders/:orderId
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
    return NextResponse.json(
      { success: false, error: `Order ${orderId} not found` },
      { status: 404 }
    )

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
 * Update order status
 * 
 * Actions: PLACE, MARK_PAID, START_PROCESSING, MARK_SHIPPED, 
 *          MARK_DELIVERED, MARK_FULFILLED, REQUEST_REFUND, MARK_REFUNDED
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

    const validActions = [
      'PLACE', 'MARK_PAID', 'START_PROCESSING', 'MARK_SHIPPED', 
      'MARK_DELIVERED', 'MARK_FULFILLED', 'REQUEST_REFUND', 'MARK_REFUNDED'
    ]

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unknown action: ${action}`,
          validActions
        },
        { status: 400 }
      )
    }

    // In production, load and update order
    // For demo, return success with mock data
    const statusMap: Record<string, string> = {
      'PLACE': 'PLACED',
      'MARK_PAID': 'PAID',
      'START_PROCESSING': 'PROCESSING',
      'MARK_SHIPPED': 'SHIPPED',
      'MARK_DELIVERED': 'DELIVERED',
      'MARK_FULFILLED': 'FULFILLED',
      'MARK_REFUNDED': 'REFUNDED'
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} updated with action: ${action}`,
      order: {
        id: orderId,
        status: statusMap[action] || 'UNKNOWN',
        updatedAt: new Date().toISOString()
      }
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
 * Supports both query params and JSON body
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { orderId } = await context.params
    const { searchParams } = new URL(request.url)
    
    // Try query params first
    let tenantId = searchParams.get('tenantId')
    let reason = searchParams.get('reason')
    let cancelledBy = searchParams.get('cancelledBy')
    let cancelledByUserId = searchParams.get('cancelledByUserId')

    // If not in query params, try body
    if (!tenantId) {
      try {
        const body = await request.json()
        tenantId = body.tenantId
        reason = body.reason
        cancelledBy = body.cancelledBy
        cancelledByUserId = body.cancelledByUserId
      } catch {
        // Body parse failed, use query params only
      }
    }

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

    // In production, verify order can be cancelled and update
    return NextResponse.json({
      success: true,
      message: `Order ${orderId} cancelled`,
      order: {
        id: orderId,
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
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
