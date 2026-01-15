/**
 * MVM Vendor Trust Badge API (Wave G1)
 * 
 * GET /api/mvm/vendor-ratings/trust-badge?vendorId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { VendorRatingService } from '@/lib/mvm/vendor-rating-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      )
    }
    
    const badge = await VendorRatingService.getTrustBadge(vendorId)
    
    if (!badge) {
      return NextResponse.json({
        scoreBand: 'NEW',
        averageRating: 0,
        totalRatings: 0,
        displayText: 'New Seller'
      })
    }
    
    return NextResponse.json(badge)
  } catch (error) {
    console.error('Failed to get trust badge:', error)
    return NextResponse.json(
      { error: 'Failed to get trust badge' },
      { status: 500 }
    )
  }
}
