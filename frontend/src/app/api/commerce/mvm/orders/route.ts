export const dynamic = 'force-dynamic'

/**
 * MVM Orders API
 * 
 * GET /api/commerce/mvm/orders - List parent orders
 * POST /api/commerce/mvm/orders - Create and split order
 * 
 * @module api/commerce/mvm/orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { OrderSplitService } from '@/lib/mvm'
import { prisma } from '@/lib/prisma'

// ============================================================================
// GET - List Parent Orders
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = { tenantId }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (customerId) where.customerId = customerId

    const [orders, total] = await Promise.all([
      prisma.mvm_parent_order.findMany({
        where,
        include: {
          _count: { select: { subOrders: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_parent_order.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerEmail: o.customerEmail,
          customerName: o.customerName,
          status: o.status,
          paymentStatus: o.paymentStatus,
          grandTotal: o.grandTotal.toNumber(),
          currency: o.currency,
          subOrderCount: o._count.subOrders,
          createdAt: o.createdAt
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('[MVM Orders API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create and Split Order
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      customerEmail, 
      shippingAddress, 
      items,
      customerId,
      customerPhone,
      customerName,
      billingAddress,
      paymentMethod,
      promotionCode,
      customerNotes,
      channel,
      sourceCartId
    } = body

    // Validate required fields
    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer email required' },
        { status: 400 }
      )
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order items required' },
        { status: 400 }
      )
    }

    // Validate each item has vendorId
    for (const item of items) {
      if (!item.vendorId) {
        return NextResponse.json(
          { success: false, error: 'Each item must have a vendorId' },
          { status: 400 }
        )
      }
    }

    const result = await OrderSplitService.createAndSplit({
      tenantId,
      customerEmail,
      customerId,
      customerPhone,
      customerName,
      shippingAddress,
      billingAddress,
      items,
      paymentMethod,
      promotionCode,
      customerNotes,
      channel
    })

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })
  } catch (error) {
    console.error('[MVM Orders API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
