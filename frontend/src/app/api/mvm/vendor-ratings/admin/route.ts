/**
 * MVM Vendor Ratings Admin API (Wave G1)
 * 
 * GET /api/mvm/vendor-ratings/admin - Get vendor quality overview
 */

import { NextRequest, NextResponse } from 'next/server'
import { VendorRatingService, ScoreBand } from '@/lib/mvm/vendor-rating-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || !['ADMIN', 'PARTNER_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const scoreBand = searchParams.get('scoreBand') as ScoreBand | null
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    const result = await VendorRatingService.getAdminQualityOverview(tenantId, {
      scoreBand: scoreBand || undefined,
      minRating,
      page,
      pageSize
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get admin quality overview:', error)
    return NextResponse.json(
      { error: 'Failed to get quality overview' },
      { status: 500 }
    )
  }
}
