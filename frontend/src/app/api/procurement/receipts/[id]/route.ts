export const dynamic = 'force-dynamic'

/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Goods Receipt Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { GoodsReceiptService } from '@/lib/procurement/goods-receipt-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/procurement/receipts/[id]
 * Get goods receipt by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const receipt = await GoodsReceiptService.getGoodsReceiptById(tenantId, id)

    if (!receipt) {
      return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
    }

    return NextResponse.json({ receipt })
  } catch (error) {
    console.error('Error getting goods receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/procurement/receipts/[id]
 * Update receipt items (pending receipts only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    const receipt = await GoodsReceiptService.updateReceiptItems(tenantId, id, body.items)

    return NextResponse.json({ success: true, receipt })
  } catch (error) {
    console.error('Error updating goods receipt:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Only pending')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/receipts/[id]
 * Perform action: verify, reject
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
      case 'verify':
      case 'accept':
        result = await GoodsReceiptService.verifyAndAccept(
          tenantId,
          id,
          session.user.id,
          body.notes
        )
        return NextResponse.json({ success: true, receipt: result })

      case 'reject':
        if (!body.reason) {
          return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
        }
        result = await GoodsReceiptService.rejectReceipt(
          tenantId,
          id,
          session.user.id,
          body.reason
        )
        return NextResponse.json({ success: true, receipt: result })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: verify, accept, reject' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing goods receipt action:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Only pending')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
