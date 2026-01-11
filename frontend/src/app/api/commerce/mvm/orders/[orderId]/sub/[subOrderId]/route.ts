export const dynamic = 'force-dynamic'

/**
 * MVM Single Sub-Order API
 * 
 * GET /api/commerce/mvm/orders/[orderId]/sub/[subOrderId] - Get sub-order
 * POST /api/commerce/mvm/orders/[orderId]/sub/[subOrderId]?action=... - Status actions
 * 
 * @module api/commerce/mvm/orders/[orderId]/sub/[subOrderId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { OrderSplitService, SubOrderService, CommissionService } from '@/lib/mvm'

// ============================================================================
// GET - Get Sub-Order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string; subOrderId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { subOrderId } = params
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include') // timeline, commission

    const subOrder = await OrderSplitService.getSubOrder(subOrderId)
    if (!subOrder) {
      return NextResponse.json(
        { success: false, error: 'Sub-order not found' },
        { status: 404 }
      )
    }

    let response: any = {
      id: subOrder.id,
      subOrderNumber: subOrder.subOrderNumber,
      parentOrderNumber: subOrder.parentOrder.orderNumber,
      vendorId: subOrder.vendorId,
      vendorName: subOrder.vendor.name,
      vendorSlug: subOrder.vendor.slug,
      status: subOrder.status,
      customerName: subOrder.customerName,
      shippingCity: subOrder.shippingCity,
      shippingState: subOrder.shippingState,
      currency: subOrder.currency,
      subtotal: subOrder.subtotal.toNumber(),
      shippingTotal: subOrder.shippingTotal.toNumber(),
      taxTotal: subOrder.taxTotal.toNumber(),
      discountTotal: subOrder.discountTotal.toNumber(),
      grandTotal: subOrder.grandTotal.toNumber(),
      commissionRate: subOrder.commissionRate.toNumber(),
      commissionAmount: subOrder.commissionAmount.toNumber(),
      vendorPayout: subOrder.vendorPayout.toNumber(),
      items: subOrder.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        imageUrl: i.imageUrl,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toNumber(),
        discount: i.discount.toNumber(),
        tax: i.tax.toNumber(),
        lineTotal: i.lineTotal.toNumber(),
        fulfilledQuantity: i.fulfilledQuantity
      })),
      trackingNumber: subOrder.trackingNumber,
      trackingUrl: subOrder.trackingUrl,
      shippingCarrier: subOrder.shippingCarrier,
      shippingMethod: subOrder.shippingMethod,
      estimatedDelivery: subOrder.estimatedDelivery,
      vendorNotes: subOrder.vendorNotes,
      createdAt: subOrder.createdAt,
      confirmedAt: subOrder.confirmedAt,
      processingAt: subOrder.processingAt,
      shippedAt: subOrder.shippedAt,
      deliveredAt: subOrder.deliveredAt,
      cancelledAt: subOrder.cancelledAt,
      cancelReason: subOrder.cancelReason
    }

    // Include timeline if requested
    if (include?.includes('timeline')) {
      response.timeline = await SubOrderService.getTimeline(subOrderId)
    }

    // Include commission if requested
    if (include?.includes('commission')) {
      response.commission = await CommissionService.getBySubOrderId(subOrderId)
    }

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('[MVM Sub-Order API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Sub-Order Status Actions
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string; subOrderId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { subOrderId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    // Check sub-order exists
    const subOrder = await OrderSplitService.getSubOrder(subOrderId)
    if (!subOrder) {
      return NextResponse.json(
        { success: false, error: 'Sub-order not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'confirm':
        result = await SubOrderService.confirm(subOrderId, body.confirmedBy || 'vendor')
        break
      
      case 'start-processing':
        result = await SubOrderService.startProcessing(subOrderId)
        break
      
      case 'ship':
        if (!body.carrier || !body.trackingNumber) {
          return NextResponse.json(
            { success: false, error: 'Carrier and tracking number required' },
            { status: 400 }
          )
        }
        result = await SubOrderService.markShipped(subOrderId, {
          carrier: body.carrier,
          trackingNumber: body.trackingNumber,
          trackingUrl: body.trackingUrl,
          estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
          shippingMethod: body.shippingMethod
        })
        break
      
      case 'deliver':
        result = await SubOrderService.markDelivered(subOrderId)
        break
      
      case 'cancel':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Cancellation reason required' },
            { status: 400 }
          )
        }
        result = await SubOrderService.cancel(subOrderId, body.cancelledBy || 'system', body.reason)
        break
      
      case 'refund':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Refund reason required' },
            { status: 400 }
          )
        }
        result = await SubOrderService.refund(subOrderId, body.refundedBy || 'system', body.reason)
        break
      
      case 'update-tracking':
        result = await SubOrderService.updateTracking(
          subOrderId,
          body.trackingNumber,
          body.trackingUrl,
          body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined
        )
        break
      
      case 'add-notes':
        result = await SubOrderService.addVendorNotes(subOrderId, body.notes)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    if (result && 'success' in result && !result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Sub-Order API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
