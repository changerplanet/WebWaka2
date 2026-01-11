export const dynamic = 'force-dynamic'

/**
 * HOSPITALITY SUITE: Rooms API
 * 
 * GET - List rooms, get room by ID, get available rooms
 * POST - Create room
 * PATCH - Update room status
 * 
 * @module api/hospitality/rooms
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as VenueService from '@/lib/hospitality/services/venue-service'
import { HospitalityRoomType, HospitalityRoomStatus } from '@prisma/client'

// ============================================================================
// GET - List rooms or get by ID
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
    const venueId = searchParams.get('venueId')
    const action = searchParams.get('action')

    // Get single room
    if (id) {
      const room = await VenueService.getRoom(tenantId, id)
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, room })
    }

    if (!venueId) {
      return NextResponse.json({ error: 'venueId is required' }, { status: 400 })
    }

    // Get available rooms for date range
    if (action === 'available') {
      const checkInDate = searchParams.get('checkInDate') ? new Date(searchParams.get('checkInDate')!) : undefined
      const checkOutDate = searchParams.get('checkOutDate') ? new Date(searchParams.get('checkOutDate')!) : undefined
      const roomType = searchParams.get('roomType') as HospitalityRoomType | null
      const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined

      const rooms = await VenueService.getAvailableRooms(tenantId, venueId, {
        checkInDate,
        checkOutDate,
        roomType: roomType || undefined,
        guests,
      })

      return NextResponse.json({ success: true, rooms })
    }

    // List all rooms
    const floorId = searchParams.get('floorId') || undefined
    const roomType = searchParams.get('roomType') as HospitalityRoomType | null
    const status = searchParams.get('status') as HospitalityRoomStatus | null
    const maxOccupancy = searchParams.get('maxOccupancy') ? parseInt(searchParams.get('maxOccupancy')!) : undefined

    const rooms = await VenueService.listRooms(tenantId, venueId, {
      floorId,
      roomType: roomType || undefined,
      status: status || undefined,
      maxOccupancy,
    })

    return NextResponse.json({ success: true, rooms })
  } catch (error) {
    console.error('Rooms GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create room
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

    if (!body.venueId || !body.roomNumber) {
      return NextResponse.json({ error: 'venueId and roomNumber are required' }, { status: 400 })
    }

    const room = await VenueService.createRoom({
      tenantId,
      venueId: body.venueId,
      floorId: body.floorId,
      roomNumber: body.roomNumber,
      roomType: body.roomType,
      bedCount: body.bedCount,
      bedType: body.bedType,
      maxOccupancy: body.maxOccupancy,
      maxAdults: body.maxAdults,
      maxChildren: body.maxChildren,
      baseRate: body.baseRate,
      amenities: body.amenities,
    })

    return NextResponse.json({ success: true, room })
  } catch (error) {
    console.error('Rooms POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update room status
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

    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const room = await VenueService.updateRoomStatus(tenantId, body.id, body.status as HospitalityRoomStatus)
    return NextResponse.json({ success: true, room })
  } catch (error) {
    console.error('Rooms PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
