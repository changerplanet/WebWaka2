export const dynamic = 'force-dynamic'

/**
 * HOSPITALITY SUITE: Venues API
 * 
 * GET - List venues, get venue by ID
 * POST - Create venue
 * PATCH - Update venue
 * 
 * @module api/hospitality/venues
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as VenueService from '@/lib/hospitality/services/venue-service'
import { HospitalityVenueType } from '@prisma/client'

// ============================================================================
// GET - List venues or get by ID
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
    const id = searchParams.get('id')

    if (id) {
      const venue = await VenueService.getVenue(tenantId, id)
      if (!venue) {
        return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, venue })
    }

    // List venues
    const type = searchParams.get('type') as HospitalityVenueType | null
    const venues = await VenueService.listVenues(tenantId, { type: type || undefined })

    return NextResponse.json({ success: true, venues })
  } catch (error) {
    console.error('Venues GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create venue
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

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
    }

    const venue = await VenueService.createVenue({
      tenantId,
      name: body.name,
      code: body.code,
      type: body.type as HospitalityVenueType,
      description: body.description,
      phone: body.phone,
      email: body.email,
      address: body.address,
      operatingHours: body.operatingHours,
    })

    return NextResponse.json({ success: true, venue })
  } catch (error) {
    console.error('Venues POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update venue
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 })
    }

    const venue = await VenueService.updateVenue(tenantId, body.id, {
      name: body.name,
      code: body.code,
      type: body.type,
      description: body.description,
      phone: body.phone,
      email: body.email,
      address: body.address,
      operatingHours: body.operatingHours,
    })

    return NextResponse.json({ success: true, venue })
  } catch (error) {
    console.error('Venues PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
