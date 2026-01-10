/**
 * SVM Orders API
 * 
 * GET /api/commerce/svm/orders - List orders
 * POST /api/commerce/svm/orders - Create order (via checkout)
 * 
 * @module api/commerce/svm/orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { formatNGN } from '@/lib/currency'
import { getOrderStatusDisplay, type OrderStatus } from '@/lib/svm'

// ============================================================================
// GET - List Orders
// ============================================================================

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const customerEmail = searchParams.get('customerEmail')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    // Build query
    const where: Record<string, unknown> = { tenantId }
    
    if (customerId) {
      where.customerId = customerId
    }
    if (customerEmail) {
      where.customerEmail = customerEmail
    }
    if (status) {
      where.status = status
    }

    // Fetch orders with pagination
    const [orders, total] = await Promise.all([
      prisma.svm_orders.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          customerName: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
          currency: true,
          subtotal: true,
          discountTotal: true,
          taxTotal: true,
          shippingTotal: true,
          grandTotal: true,
          paymentMethod: true,
          createdAt: true,
          _count: {
            select: { svm_order_items: true }
          }
        }
      }),
      prisma.svm_orders.count({ where })
    ])

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      status: order.status,
      statusDisplay: getOrderStatusDisplay(order.status as OrderStatus),
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      itemCount: order._count.svm_order_items,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      taxTotal: Number(order.taxTotal),
      shippingTotal: Number(order.shippingTotal),
      grandTotal: Number(order.grandTotal),
      grandTotalFormatted: formatNGN(Number(order.grandTotal)),
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('[SVM Orders API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Order (Redirect to Checkout)
// ============================================================================

export async function POST(request: NextRequest) {
  // Order creation should go through /api/commerce/svm/checkout?action=finalize
  return NextResponse.json(
    { 
      success: false, 
      error: 'Please use /api/commerce/svm/checkout?action=finalize to create orders',
      redirect: '/api/commerce/svm/checkout?action=finalize'
    },
    { status: 400 }
  )
}
