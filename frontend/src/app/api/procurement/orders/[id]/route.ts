export const dynamic = 'force-dynamic'

/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Purchase Order Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PurchaseOrderService } from '@/lib/procurement/purchase-order-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/procurement/orders/[id]
 * Get purchase order by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const po = await PurchaseOrderService.getPurchaseOrderById(tenantId, id)

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ order: po })
  } catch (error) {
    console.error('Error getting purchase order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/orders/[id]
 * Perform action: send, confirm, cancel, close
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    let result

    switch (body.action) {
      case 'send':
        result = await PurchaseOrderService.sendToSupplier(tenantId, id, session.user.id)
        return NextResponse.json({ success: true, order: result })

      case 'confirm':
        result = await PurchaseOrderService.confirmPurchaseOrder(
          tenantId,
          id,
          session.user.id,
          body.confirmedDeliveryDate ? new Date(body.confirmedDeliveryDate) : undefined
        )
        return NextResponse.json({ success: true, order: result })

      case 'cancel':
        if (!body.reason) {
          return NextResponse.json({ error: 'Cancellation reason required' }, { status: 400 })
        }
        result = await PurchaseOrderService.cancelPurchaseOrder(
          tenantId,
          id,
          session.user.id,
          body.reason
        )
        return NextResponse.json({ success: true, order: result })

      case 'close':
        result = await PurchaseOrderService.closePurchaseOrder(tenantId, id, session.user.id)
        return NextResponse.json({ success: true, order: result })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: send, confirm, cancel, close' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing purchase order action:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Only') || error.message.includes('Cannot')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
