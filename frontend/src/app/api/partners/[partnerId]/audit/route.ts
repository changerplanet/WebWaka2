export const dynamic = 'force-dynamic'

/**
 * Partner Audit Log API
 * 
 * GET /api/partners/[partnerId]/audit - Get audit logs for a partner
 * 
 * Only returns partner-related audit entries.
 * Super Admins can see all entries, Partner Owners can see their own partner's logs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePartnerOwnerAccess } from '@/lib/partner-authorization'
import { getPartnerAuditLogs, generatePartnerActivityReport } from '@/lib/partner-audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params
    
    // Require owner access for audit logs
    const authResult = await requirePartnerOwnerAccess(partnerId)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const reportType = searchParams.get('report') // 'activity' for activity report
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Generate activity report if requested
    if (reportType === 'activity') {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days default
      const end = endDate ? new Date(endDate) : new Date()
      
      const report = await generatePartnerActivityReport(partnerId, start, end)
      return NextResponse.json(report)
    }
    
    // Default: return audit logs
    const result = await getPartnerAuditLogs(partnerId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset
    })
    
    return NextResponse.json({
      entries: result.entries,
      total: result.total,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
