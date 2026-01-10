/**
 * MVM Single Parent Order API
 * 
 * GET /api/commerce/mvm/orders/[orderId] - Get parent order with sub-orders
 * POST /api/commerce/mvm/orders/[orderId]?action=... - Order actions
 * 
 * @module api/commerce/mvm/orders/[orderId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { OrderSplitService } from '@/lib/mvm'

// ============================================================================
// GET - Get Parent Order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { orderId } = params
    
    // Check if orderId is an order number (starts with MVM-)
    const order = orderId.startsWith('MVM-')
      ? await OrderSplitService.getByOrderNumber(orderId)
      : await OrderSplitService.getParentOrder(orderId)

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentRef: order.paymentRef,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        currency: order.currency,
        subtotal: order.subtotal.toNumber(),
        discountTotal: order.discountTotal.toNumber(),
        shippingTotal: order.shippingTotal.toNumber(),
        taxTotal: order.taxTotal.toNumber(),
        grandTotal: order.grandTotal.toNumber(),
        customerNotes: order.customerNotes,
        items: order.items.map((i: any) => ({
          id: i.id,
          vendorId: i.vendorId,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toNumber(),
          lineTotal: i.lineTotal.toNumber()
        })),
        subOrders: order.subOrders.map(so => ({
          id: so.id,
          subOrderNumber: so.subOrderNumber,
          vendorId: so.vendorId,
          vendorName: so.vendor.name,
          status: so.status,
          grandTotal: so.grandTotal.toNumber(),
          commissionAmount: so.commissionAmount.toNumber(),
          vendorPayout: so.vendorPayout.toNumber(),
          itemCount: so.items.length
        })),
        createdAt: order.createdAt,
        splitAt: order.splitAt,
        completedAt: order.completedAt
      }
    })
  } catch (error) {
    console.error('[MVM Order API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Order Actions
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { orderId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    // Get order
    const order = await OrderSplitService.getParentOrder(orderId)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'update-payment':
        if (!body.status) {
          return NextResponse.json(
            { success: false, error: 'Payment status required' },
            { status: 400 }
          )
        }
        result = await OrderSplitService.updatePaymentStatus(orderId, body.status, body.paymentRef)
        break
      
      case 'cancel':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Cancellation reason required' },
            { status: 400 }
          )
        }
        result = await OrderSplitService.cancelOrder(orderId, body.reason)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Order API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
