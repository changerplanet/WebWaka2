export const dynamic = 'force-dynamic'

/**
 * PARTNER ANALYTICS: Overview API - Phase E1.4
 * 
 * Partner dashboard overview metrics
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
    const overview = await PartnerAnalyticsService.getOverview(partnerInfo.partnerId, {
      timeFilter: timeFilter && VALID_TIME_FILTERS.includes(timeFilter) ? timeFilter : '30d',
      includeDemo,
    })

    return NextResponse.json({ success: true, overview })
  } catch (error: any) {
    console.error('Partner analytics overview error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
