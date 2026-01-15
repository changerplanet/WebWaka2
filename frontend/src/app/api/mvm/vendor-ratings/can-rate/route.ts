/**
 * MVM Vendor Ratings - Can Rate Check API (Wave G1)
 * 
 * GET /api/mvm/vendor-ratings/can-rate?subOrderId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { VendorRatingService } from '@/lib/mvm/vendor-rating-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subOrderId = searchParams.get('subOrderId')
    
    if (!subOrderId) {
      return NextResponse.json(
        { error: 'subOrderId is required' },
        { status: 400 }
      )
    }
    
    const result = await VendorRatingService.canRateOrder(subOrderId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to check rating eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to check rating eligibility' },
      { status: 500 }
    )
  }
}
