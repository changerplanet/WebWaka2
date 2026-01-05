/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Delivery Quote API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ZoneService } from '@/lib/logistics/zone-service'

/**
 * GET /api/logistics/zones/quote
 * Calculate delivery quote
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    
    const zoneId = searchParams.get('zoneId') || undefined
    const city = searchParams.get('city') || undefined
    const state = searchParams.get('state') || undefined
    const lga = searchParams.get('lga') || undefined
    const postalCode = searchParams.get('postalCode') || undefined
    const orderValue = searchParams.get('orderValue') ? parseFloat(searchParams.get('orderValue')!) : undefined
    const weightKg = searchParams.get('weightKg') ? parseFloat(searchParams.get('weightKg')!) : undefined
    const distanceKm = searchParams.get('distanceKm') ? parseFloat(searchParams.get('distanceKm')!) : undefined
    const isExpress = searchParams.get('isExpress') === 'true'
    const isWeekend = searchParams.get('isWeekend') === 'true'
    const isPeakHour = searchParams.get('isPeakHour') === 'true'

    const quote = await ZoneService.calculateDeliveryQuote({
      tenantId,
      zoneId,
      city,
      state,
      lga,
      postalCode,
      orderValue,
      weightKg,
      distanceKm,
      isExpress,
      isWeekend,
      isPeakHour,
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'No delivery zone found for this location' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error calculating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/zones/quote
 * Calculate delivery quote (POST for complex queries)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    const quote = await ZoneService.calculateDeliveryQuote({
      tenantId,
      ...body,
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'No delivery zone found for this location' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error calculating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
