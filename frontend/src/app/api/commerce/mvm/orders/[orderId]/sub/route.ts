/**
 * MVM Sub-Orders API
 * 
 * GET /api/commerce/mvm/orders/[orderId]/sub - List sub-orders for parent
 * 
 * @module api/commerce/mvm/orders/[orderId]/sub
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { OrderSplitService } from '@/lib/mvm'

// ============================================================================
// GET - List Sub-Orders for Parent Order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { orderId } = params
    const order = await OrderSplitService.getParentOrder(orderId)

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Parent order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order.subOrders.map(so => ({
        id: so.id,
        subOrderNumber: so.subOrderNumber,
        vendorId: so.vendorId,
        vendorName: so.vendor.name,
        vendorSlug: so.vendor.slug,
        status: so.status,
        currency: so.currency,
        subtotal: so.subtotal.toNumber(),
        shippingTotal: so.shippingTotal.toNumber(),
        taxTotal: so.taxTotal.toNumber(),
        discountTotal: so.discountTotal.toNumber(),
        grandTotal: so.grandTotal.toNumber(),
        commissionRate: so.commissionRate.toNumber(),
        commissionAmount: so.commissionAmount.toNumber(),
        vendorPayout: so.vendorPayout.toNumber(),
        items: so.items.map((i: any) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toNumber(),
          lineTotal: i.lineTotal.toNumber()
        })),
        trackingNumber: so.trackingNumber,
        trackingUrl: so.trackingUrl,
        shippingCarrier: so.shippingCarrier,
        createdAt: so.createdAt,
        confirmedAt: so.confirmedAt,
        shippedAt: so.shippedAt,
        deliveredAt: so.deliveredAt
      }))
    })
  } catch (error) {
    console.error('[MVM Sub-Orders API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
