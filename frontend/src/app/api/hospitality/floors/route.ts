export const dynamic = 'force-dynamic'

/**
 * HOSPITALITY SUITE: Floors API
 * 
 * GET - List floors for a venue
 * POST - Create floor
 * 
 * @module api/hospitality/floors
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as VenueService from '@/lib/hospitality/services/venue-service'

// ============================================================================
// GET - List floors for a venue
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')

    if (!venueId) {
      return NextResponse.json({ error: 'venueId is required' }, { status: 400 })
    }

    const floors = await VenueService.listFloors(tenantId, venueId)
    return NextResponse.json({ success: true, floors })
  } catch (error) {
    console.error('Floors GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create floor
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.venueId || !body.name) {
      return NextResponse.json({ error: 'venueId and name are required' }, { status: 400 })
    }

    const floor = await VenueService.createFloor({
      tenantId,
      venueId: body.venueId,
      name: body.name,
      code: body.code,
      floorNumber: body.floorNumber,
      description: body.description,
    })

    return NextResponse.json({ success: true, floor })
  } catch (error) {
    console.error('Floors POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
