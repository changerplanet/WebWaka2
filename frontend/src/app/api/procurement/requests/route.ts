export const dynamic = 'force-dynamic'

/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Purchase Requests API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PurchaseRequestService } from '@/lib/procurement/purchase-request-service'
import { ProcEntitlementsService } from '@/lib/procurement/entitlements-service'
import {
  validatePurchaseRequestStatusArray,
  validateProcPriorityArray,
  validateProcRequestOrderBy,
  validateOrderDir,
} from '@/lib/enums'

/**
 * GET /api/procurement/requests
 * List purchase requests
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
      const stats = await PurchaseRequestService.getStatistics(tenantId)
      return NextResponse.json(stats)
    }

    const options = {
      filters: {
        ...(searchParams.get('status') && { status: searchParams.get('status')!.split(',') as any }),
        ...(searchParams.get('priority') && { priority: searchParams.get('priority')!.split(',') as any }),
        ...(searchParams.get('requestedBy') && { requestedBy: searchParams.get('requestedBy')! }),
        ...(searchParams.get('supplierId') && { preferredSupplierId: searchParams.get('supplierId')! }),
        ...(searchParams.get('fromDate') && { fromDate: new Date(searchParams.get('fromDate')!) }),
        ...(searchParams.get('toDate') && { toDate: new Date(searchParams.get('toDate')!) }),
        ...(searchParams.get('search') && { search: searchParams.get('search')! }),
      },
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      orderBy: (searchParams.get('orderBy') as any) || 'createdAt',
      orderDir: (searchParams.get('orderDir') as any) || 'desc',
    }

    const result = await PurchaseRequestService.listPurchaseRequests(tenantId, options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing purchase requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/requests
 * Create purchase request
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
    await ProcEntitlementsService.enforceEntitlement(tenantId, 'maxPurchaseRequests')

    const pr = await PurchaseRequestService.createPurchaseRequest(tenantId, {
      ...body,
      requestedBy: body.requestedBy || session.user.id,
    })

    return NextResponse.json({ success: true, request: pr }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase request:', error)
    
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
