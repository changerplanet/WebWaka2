export const dynamic = 'force-dynamic'

/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Purchase Orders API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PurchaseOrderService } from '@/lib/procurement/purchase-order-service'
import { ProcEntitlementsService } from '@/lib/procurement/entitlements-service'

/**
 * GET /api/procurement/orders
 * List purchase orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams

    // Check for statistics request
    if (searchParams.get('statistics') === 'true') {
      const stats = await PurchaseOrderService.getStatistics(tenantId)
      return NextResponse.json(stats)
    }

    const options = {
      filters: {
        ...(searchParams.get('status') && { status: searchParams.get('status')!.split(',') as any }),
        ...(searchParams.get('priority') && { priority: searchParams.get('priority')!.split(',') as any }),
        ...(searchParams.get('supplierId') && { supplierId: searchParams.get('supplierId')! }),
        ...(searchParams.get('purchaseRequestId') && { purchaseRequestId: searchParams.get('purchaseRequestId')! }),
        ...(searchParams.get('isCashPurchase') && { isCashPurchase: searchParams.get('isCashPurchase') === 'true' }),
        ...(searchParams.get('fromDate') && { fromDate: new Date(searchParams.get('fromDate')!) }),
        ...(searchParams.get('toDate') && { toDate: new Date(searchParams.get('toDate')!) }),
        ...(searchParams.get('search') && { search: searchParams.get('search')! }),
      },
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      orderBy: (searchParams.get('orderBy') as any) || 'createdAt',
      orderDir: (searchParams.get('orderDir') as any) || 'desc',
    }

    const result = await PurchaseOrderService.listPurchaseOrders(tenantId, options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing purchase orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/orders
 * Create purchase order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Check entitlement
    await ProcEntitlementsService.enforceEntitlement(tenantId, 'maxPurchaseOrders')

    const po = await PurchaseOrderService.createPurchaseOrder(tenantId, {
      ...body,
      createdBy: session.user.id,
    })

    return NextResponse.json({ success: true, order: po }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('limit') || error.message.includes('not allowed')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
