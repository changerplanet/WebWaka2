/**
 * Partner Performance Metrics API
 * 
 * GET /api/partners/[partnerId]/dashboard/performance - Get performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPartnerPerformance } from '@/lib/partner-dashboard'
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
    
    // Parse query params for period
    const { searchParams } = new URL(request.url)
    const periodStart = searchParams.get('start')
    const periodEnd = searchParams.get('end')
    
    // Default to last 12 months if not specified
    const end = periodEnd ? new Date(periodEnd) : new Date()
    const start = periodStart 
      ? new Date(periodStart) 
      : new Date(end.getFullYear(), end.getMonth() - 12, 1)
    
    const metrics = await getPartnerPerformance(partnerId, start, end)
    
    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
