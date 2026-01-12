export const dynamic = 'force-dynamic'

/**
 * Partner Dashboard API
 * 
 * GET /api/partners/[partnerId]/dashboard - Get dashboard overview
 * 
 * Returns read-only data for partner dashboard.
 * Partners see ONLY their data, NO tenant internals.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPartnerDashboard } from '@/lib/partner-dashboard'
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
    
    // Get dashboard data
    const dashboard = await getPartnerDashboard(partnerId)
    
    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard data not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(dashboard)
    
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
