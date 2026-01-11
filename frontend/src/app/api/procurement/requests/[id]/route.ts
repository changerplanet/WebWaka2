export const dynamic = 'force-dynamic'

/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Purchase Request Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PurchaseRequestService } from '@/lib/procurement/purchase-request-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/procurement/requests/[id]
 * Get purchase request by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const pr = await PurchaseRequestService.getPurchaseRequestById(tenantId, id)

    if (!pr) {
      return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: pr })
  } catch (error) {
    console.error('Error getting purchase request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/procurement/requests/[id]
 * Update purchase request (drafts only)
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

    const pr = await PurchaseRequestService.updatePurchaseRequest(tenantId, id, body)

    return NextResponse.json({ success: true, request: pr })
  } catch (error) {
    console.error('Error updating purchase request:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Only draft')) {
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
 * POST /api/procurement/requests/[id]
 * Perform action: submit, approve, reject, cancel
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
      case 'submit':
        result = await PurchaseRequestService.submitPurchaseRequest(
          tenantId,
          id,
          session.user.id
        )
        return NextResponse.json({ success: true, request: result })

      case 'approve':
        result = await PurchaseRequestService.approvePurchaseRequest(
          tenantId,
          id,
          session.user.id,
          body.notes
        )
        return NextResponse.json({ success: true, request: result })

      case 'reject':
        if (!body.reason) {
          return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
        }
        result = await PurchaseRequestService.rejectPurchaseRequest(
          tenantId,
          id,
          session.user.id,
          body.reason
        )
        return NextResponse.json({ success: true, request: result })

      case 'cancel':
        result = await PurchaseRequestService.cancelPurchaseRequest(
          tenantId,
          id,
          session.user.id
        )
        return NextResponse.json({ success: true, request: result })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: submit, approve, reject, cancel' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing purchase request action:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Only') || error.message.includes('cannot')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
