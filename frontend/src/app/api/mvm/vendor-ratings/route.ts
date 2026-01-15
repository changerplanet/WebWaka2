/**
 * MVM Vendor Ratings API (Wave G1)
 * 
 * POST /api/mvm/vendor-ratings - Submit a rating
 * GET /api/mvm/vendor-ratings - Get vendor ratings
 * GET /api/mvm/vendor-ratings?summary=true - Get rating summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { VendorRatingService } from '@/lib/mvm/vendor-rating-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await request.json()
    const {
      tenantId,
      vendorId,
      subOrderId,
      parentOrderId,
      rating,
      comment
    } = body
    
    if (!tenantId || !vendorId || !subOrderId || !parentOrderId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    const canRate = await VendorRatingService.canRateOrder(subOrderId)
    if (!canRate.canRate) {
      return NextResponse.json(
        { error: canRate.reason },
        { status: 400 }
      )
    }
    
    const result = await VendorRatingService.submitRating({
      tenantId,
      vendorId,
      subOrderId,
      parentOrderId,
      customerId: session?.user?.id,
      customerName: session?.user?.name || body.customerName,
      customerEmail: session?.user?.email || body.customerEmail,
      rating,
      comment,
      orderDeliveredAt: body.orderDeliveredAt ? new Date(body.orderDeliveredAt) : undefined,
      isDemo: body.isDemo
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to submit rating:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const vendorId = searchParams.get('vendorId')
    const summary = searchParams.get('summary') === 'true'
    
    if (!tenantId || !vendorId) {
      return NextResponse.json(
        { error: 'tenantId and vendorId are required' },
        { status: 400 }
      )
    }
    
    if (summary) {
      const ratingSummary = await VendorRatingService.getRatingSummary(tenantId, vendorId)
      return NextResponse.json(ratingSummary || { vendorId, totalRatings: 0, averageRating: 0, scoreBand: 'NEW' })
    }
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined
    const maxRating = searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) : undefined
    const includeDemo = searchParams.get('includeDemo') === 'true'
    
    const result = await VendorRatingService.getVendorRatings({
      tenantId,
      vendorId,
      minRating,
      maxRating,
      includeDemo,
      page,
      pageSize
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get ratings:', error)
    return NextResponse.json(
      { error: 'Failed to get ratings' },
      { status: 500 }
    )
  }
}
