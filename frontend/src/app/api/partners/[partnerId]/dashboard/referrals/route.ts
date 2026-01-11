export const dynamic = 'force-dynamic'

/**
 * Partner Referrals API
 * 
 * GET /api/partners/[partnerId]/dashboard/referrals - Get referred tenants list
 * 
 * Returns LIMITED tenant data only - no tenant internals.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReferredTenants } from '@/lib/partner-dashboard'
import { requirePartnerAccess } from '@/lib/partner-authorization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params
    
    // Verify partner access
    const authResult = await requirePartnerAccess(partnerId)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')?.split(',').filter(Boolean)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') as 'referredAt' | 'revenue' | undefined
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined
    
    const result = await getReferredTenants(partnerId, {
      status,
      limit,
      offset,
      sortBy,
      sortOrder
    })
    
    return NextResponse.json({
      tenants: result.tenants,
      total: result.total,
      limit,
      offset,
      _notice: 'Limited tenant data only - no internal details exposed'
    })
    
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
