/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Goods Receipts API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { GoodsReceiptService } from '@/lib/procurement/goods-receipt-service'

/**
 * GET /api/procurement/receipts
 * List goods receipts
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
      const stats = await GoodsReceiptService.getStatistics(tenantId)
      return NextResponse.json(stats)
    }

    const options = {
      filters: {
        ...(searchParams.get('status') && { status: searchParams.get('status')!.split(',') as any }),
        ...(searchParams.get('purchaseOrderId') && { purchaseOrderId: searchParams.get('purchaseOrderId')! }),
        ...(searchParams.get('locationId') && { locationId: searchParams.get('locationId')! }),
        ...(searchParams.get('fromDate') && { fromDate: new Date(searchParams.get('fromDate')!) }),
        ...(searchParams.get('toDate') && { toDate: new Date(searchParams.get('toDate')!) }),
        ...(searchParams.get('search') && { search: searchParams.get('search')! }),
      },
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      orderBy: (searchParams.get('orderBy') as any) || 'receivedDate',
      orderDir: (searchParams.get('orderDir') as any) || 'desc',
    }

    const result = await GoodsReceiptService.listGoodsReceipts(tenantId, options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing goods receipts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/receipts
 * Create goods receipt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    const receipt = await GoodsReceiptService.createGoodsReceipt(tenantId, {
      ...body,
      receivedBy: body.receivedBy || session.user.id,
    })

    return NextResponse.json({ success: true, receipt }, { status: 201 })
  } catch (error) {
    console.error('Error creating goods receipt:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Cannot receive')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
