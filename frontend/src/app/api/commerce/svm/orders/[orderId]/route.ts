/**
 * SVM Single Order API
 * 
 * GET /api/commerce/svm/orders/[orderId] - Get order details
 * 
 * @module api/commerce/svm/orders/[orderId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { formatNGN } from '@/lib/currency'
import { 
  getOrderStatusDisplay, 
  getOrderTimeline,
  checkCancellationEligibility,
  checkRefundEligibility,
  type OrderStatus 
} from '@/lib/svm'

// ============================================================================
// GET - Get Order Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { orderId } = params

    // Fetch order with items
    const order = await prisma.svm_orders.findFirst({
      where: { 
        id: orderId,
        tenantId 
      },
      include: {
        svm_order_items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            productName: true,
            variantName: true,
            sku: true,
            imageUrl: true,
            unitPrice: true,
            quantity: true,
            lineTotal: true,
            discountAmount: true,
            taxAmount: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get eligibility info
    const [cancellationEligibility, refundEligibility] = await Promise.all([
      checkCancellationEligibility(orderId),
      checkRefundEligibility(orderId)
    ])

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      
      // Customer
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      
      // Status
      status: order.status,
      statusDisplay: getOrderStatusDisplay(order.status as OrderStatus),
      timeline: getOrderTimeline(order.status as OrderStatus),
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      
      // Addresses
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      
      // Shipping
      shippingMethod: order.shippingMethod,
      shippingCarrier: order.shippingCarrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      
      // Amounts
      currency: order.currency,
      subtotal: Number(order.subtotal),
      subtotalFormatted: formatNGN(Number(order.subtotal)),
      discountTotal: Number(order.discountTotal),
      discountFormatted: formatNGN(Number(order.discountTotal)),
      taxTotal: Number(order.taxTotal),
      taxFormatted: formatNGN(Number(order.taxTotal)),
      shippingTotal: Number(order.shippingTotal),
      shippingFormatted: formatNGN(Number(order.shippingTotal)),
      grandTotal: Number(order.grandTotal),
      grandTotalFormatted: formatNGN(Number(order.grandTotal)),
      refundedAmount: Number(order.refundedAmount),
      refundedFormatted: formatNGN(Number(order.refundedAmount)),
      
      // Payment
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef,
      paidAt: order.paidAt,
      
      // Promo
      promotionCode: order.promotionCode,
      promotionId: order.promotionId,
      
      // Notes
      customerNotes: order.customerNotes,
      
      // Dates
      createdAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      estimatedDelivery: order.estimatedDelivery,
      
      // Items
      items: order.svm_order_items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        imageUrl: item.imageUrl,
        unitPrice: Number(item.unitPrice),
        unitPriceFormatted: formatNGN(Number(item.unitPrice)),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
        lineTotalFormatted: formatNGN(Number(item.lineTotal)),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount)
      })),
      
      // Eligibility
      cancellation: cancellationEligibility,
      refund: refundEligibility
    }

    return NextResponse.json({
      success: true,
      data: formattedOrder
    })
  } catch (error) {
    console.error('[SVM Order API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
