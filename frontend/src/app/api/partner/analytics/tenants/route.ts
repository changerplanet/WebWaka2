export const dynamic = 'force-dynamic'

/**
 * PARTNER ANALYTICS: Tenants API - Phase E1.4
 * 
 * Tenant performance breakdown
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { getPartnerUserInfo } from '@/lib/auth/authorization'
import { PartnerAnalyticsService, TimeFilter } from '@/lib/partner-analytics'

const VALID_TIME_FILTERS: TimeFilter[] = ['today', '7d', '30d', 'all']

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const partnerInfo = await getPartnerUserInfo(session.user.id)
  
  if (!partnerInfo) {
    return NextResponse.json({ 
      success: false, 
      error: 'Access denied. Partner role required.' 
    }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const timeFilter = searchParams.get('timeFilter') as TimeFilter | null
  const includeDemo = searchParams.get('includeDemo') !== 'false'

  try {
    const performance = await PartnerAnalyticsService.getTenantPerformance(partnerInfo.partnerId, {
      timeFilter: timeFilter && VALID_TIME_FILTERS.includes(timeFilter) ? timeFilter : '30d',
      includeDemo,
    })

    return NextResponse.json({ success: true, ...performance })
  } catch (error: any) {
    console.error('Partner analytics tenants error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
