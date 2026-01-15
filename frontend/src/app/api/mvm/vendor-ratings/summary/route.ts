/**
 * MVM Vendor Rating Summary API (Wave G1)
 * 
 * GET /api/mvm/vendor-ratings/summary - Get vendor rating summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { VendorRatingService } from '@/lib/mvm/vendor-rating-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const vendorId = searchParams.get('vendorId')
    
    if (!tenantId || !vendorId) {
      return NextResponse.json(
        { error: 'tenantId and vendorId are required' },
        { status: 400 }
      )
    }
    
    const summary = await VendorRatingService.getRatingSummary(tenantId, vendorId)
    
    if (!summary) {
      return NextResponse.json({
        vendorId,
        totalRatings: 0,
        averageRating: 0,
        scoreBand: 'NEW',
        rating1Count: 0,
        rating2Count: 0,
        rating3Count: 0,
        rating4Count: 0,
        rating5Count: 0
      })
    }
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Failed to get rating summary:', error)
    return NextResponse.json(
      { error: 'Failed to get rating summary' },
      { status: 500 }
    )
  }
}
