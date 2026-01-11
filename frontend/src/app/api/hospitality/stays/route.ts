export const dynamic = 'force-dynamic'

/**
 * HOSPITALITY SUITE: Stays API
 * 
 * GET - List stays, get by ID/number, in-house guests, folio
 * POST - Create stay
 * PATCH - Check-in, check-out, extend, change room
 * 
 * @module api/hospitality/stays
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as StayService from '@/lib/hospitality/services/stay-service'
import { HospitalityStayStatus } from '@prisma/client'

// ============================================================================
// GET - List stays or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_rooms')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const stayNumber = searchParams.get('stayNumber')
    const action = searchParams.get('action')
    const venueId = searchParams.get('venueId')

    // Get stay by ID
    if (id) {
      if (action === 'folio') {
        const folio = await StayService.getStayFolio(tenantId, id)
        return NextResponse.json({ success: true, ...folio })
      }

      const stay = await StayService.getStay(tenantId, id)
      if (!stay) {
        return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, stay })
    }

    // Get stay by number
    if (stayNumber) {
      const stay = await StayService.getStayByNumber(tenantId, stayNumber)
      if (!stay) {
        return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, stay })
    }

    // Get in-house guests
    if (action === 'inHouse' && venueId) {
      const stays = await StayService.getInHouseGuests(tenantId, venueId)
      return NextResponse.json({ success: true, stays })
    }

    // List stays
    const guestId = searchParams.get('guestId') || undefined
    const roomId = searchParams.get('roomId') || undefined
    const status = searchParams.get('status') as HospitalityStayStatus | null
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await StayService.listStays(tenantId, {
      venueId: venueId || undefined,
      guestId,
      roomId,
      status: status || undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Stays GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create stay
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_rooms')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.venueId || !body.guestId || !body.roomId || !body.checkInDate || !body.checkOutDate) {
      return NextResponse.json({ error: 'venueId, guestId, roomId, checkInDate, and checkOutDate are required' }, { status: 400 })
    }

    const stay = await StayService.createStay({
      tenantId,
      venueId: body.venueId,
      guestId: body.guestId,
      roomId: body.roomId,
      reservationId: body.reservationId,
      checkInDate: new Date(body.checkInDate),
      checkOutDate: new Date(body.checkOutDate),
      adults: body.adults,
      children: body.children,
      nightlyRate: body.nightlyRate,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, stay })
  } catch (error) {
    console.error('Stays POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update stay (check-in, check-out, extend, change room)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_rooms')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id || !body.action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
    }

    let stay
    switch (body.action) {
      case 'checkIn':
        stay = await StayService.checkIn(tenantId, body.id)
        break
      case 'checkOut':
        stay = await StayService.checkOut(tenantId, body.id)
        break
      case 'inHouse':
        stay = await StayService.markInHouse(tenantId, body.id)
        break
      case 'extend':
        if (!body.newCheckOutDate) {
          return NextResponse.json({ error: 'newCheckOutDate is required for extend action' }, { status: 400 })
        }
        stay = await StayService.extendStay(tenantId, body.id, new Date(body.newCheckOutDate))
        break
      case 'changeRoom':
        if (!body.newRoomId) {
          return NextResponse.json({ error: 'newRoomId is required for changeRoom action' }, { status: 400 })
        }
        stay = await StayService.changeRoom(tenantId, body.id, body.newRoomId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, stay })
  } catch (error: unknown) {
    console.error('Stays PATCH error:', error)
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
