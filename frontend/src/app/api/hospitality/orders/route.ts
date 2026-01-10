/**
 * HOSPITALITY SUITE: Orders API
 * 
 * GET - List orders, get by ID, kitchen queue, active orders
 * POST - Create order, add item
 * PATCH - Update order status, update item status, split bills
 * DELETE - Remove order item
 * 
 * @module api/hospitality/orders
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as OrderService from '@/lib/hospitality/services/order-service'
import { HospitalityOrderType, HospitalityOrderStatus, HospitalityOrderItemStatus } from '@prisma/client'

// ============================================================================
// GET - List orders or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_pos')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const orderNumber = searchParams.get('orderNumber')
    const action = searchParams.get('action')
    const venueId = searchParams.get('venueId')

    // Get order by ID
    if (id) {
      if (action === 'total') {
        const total = await OrderService.calculateOrderTotal(tenantId, id)
        return NextResponse.json({ success: true, ...total })
      }

      if (action === 'splitTotals') {
        const splits = await OrderService.getSplitBillTotals(tenantId, id)
        return NextResponse.json({ success: true, splits })
      }

      const order = await OrderService.getOrder(tenantId, id)
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, order })
    }

    // Get order by number
    if (orderNumber) {
      const order = await OrderService.getOrderByNumber(tenantId, orderNumber)
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, order })
    }

    // Kitchen queue
    if (action === 'kitchenQueue' && venueId) {
      const prepStation = searchParams.get('prepStation') || undefined
      const items = await OrderService.getKitchenQueue(tenantId, venueId, prepStation)
      return NextResponse.json({ success: true, items })
    }

    // Active orders
    if (action === 'active' && venueId) {
      const orders = await OrderService.getActiveOrders(tenantId, venueId)
      return NextResponse.json({ success: true, orders })
    }

    // List orders
    const tableId = searchParams.get('tableId') || undefined
    const guestId = searchParams.get('guestId') || undefined
    const stayId = searchParams.get('stayId') || undefined
    const orderType = searchParams.get('orderType') as HospitalityOrderType | null
    const status = searchParams.get('status') as HospitalityOrderStatus | null
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await OrderService.listOrders(tenantId, {
      venueId: venueId || undefined,
      tableId,
      guestId,
      stayId,
      orderType: orderType || undefined,
      status: status || undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create order or add item
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_pos')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Add item to existing order
    if (body.action === 'addItem') {
      if (!body.orderId || !body.itemName || body.unitPrice === undefined) {
        return NextResponse.json({ error: 'orderId, itemName, and unitPrice are required' }, { status: 400 })
      }

      const item = await OrderService.addOrderItem({
        tenantId,
        orderId: body.orderId,
        itemCode: body.itemCode,
        itemName: body.itemName,
        itemDescription: body.itemDescription,
        category: body.category,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        modifiers: body.modifiers,
        specialInstructions: body.specialInstructions,
        prepStation: body.prepStation,
      })

      return NextResponse.json({ success: true, item })
    }

    // Create new order
    if (!body.venueId || !body.orderType) {
      return NextResponse.json({ error: 'venueId and orderType are required' }, { status: 400 })
    }

    const order = await OrderService.createOrder({
      tenantId,
      venueId: body.venueId,
      orderType: body.orderType as HospitalityOrderType,
      guestId: body.guestId,
      tableId: body.tableId,
      stayId: body.stayId,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      covers: body.covers,
      serverId: body.serverId,
      serverName: body.serverName,
      kitchenNotes: body.kitchenNotes,
      specialRequests: body.specialRequests,
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update order/item status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_pos')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    // Order item status update
    if (body.action === 'updateItemStatus') {
      if (!body.itemId || !body.status) {
        return NextResponse.json({ error: 'itemId and status are required' }, { status: 400 })
      }
      const item = await OrderService.updateOrderItemStatus(tenantId, body.itemId, body.status as HospitalityOrderItemStatus)
      return NextResponse.json({ success: true, item })
    }

    // Split bill setup
    if (body.action === 'setSplitBill') {
      if (!body.orderId || !body.splitCount) {
        return NextResponse.json({ error: 'orderId and splitCount are required' }, { status: 400 })
      }
      const order = await OrderService.setSplitBill(tenantId, body.orderId, body.splitCount)
      return NextResponse.json({ success: true, order })
    }

    // Assign item to split
    if (body.action === 'assignItemToSplit') {
      if (!body.itemId || body.splitNumber === undefined) {
        return NextResponse.json({ error: 'itemId and splitNumber are required' }, { status: 400 })
      }
      const item = await OrderService.assignItemToSplit(tenantId, body.itemId, body.splitNumber)
      return NextResponse.json({ success: true, item })
    }

    // Order status updates
    if (!body.orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    let order
    switch (body.action) {
      case 'confirm':
        order = await OrderService.confirmOrder(tenantId, body.orderId)
        break
      case 'preparing':
        order = await OrderService.markOrderPreparing(tenantId, body.orderId)
        break
      case 'ready':
        order = await OrderService.markOrderReady(tenantId, body.orderId)
        break
      case 'served':
        order = await OrderService.markOrderServed(tenantId, body.orderId)
        break
      case 'complete':
        order = await OrderService.completeOrder(tenantId, body.orderId)
        break
      case 'cancel':
        order = await OrderService.cancelOrder(tenantId, body.orderId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error: unknown) {
    console.error('Orders PATCH error:', error)
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// DELETE - Remove order item
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_pos')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    await OrderService.removeOrderItem(tenantId, itemId)
    return NextResponse.json({ success: true, message: 'Item removed' })
  } catch (error: unknown) {
    console.error('Orders DELETE error:', error)
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
