/**
 * HOSPITALITY SUITE: Reservations API
 * 
 * GET - List reservations, get by ID, today's arrivals/departures, availability check
 * POST - Create table/room reservation
 * PATCH - Update reservation status (confirm, cancel, no-show, deposit paid)
 * 
 * @module api/hospitality/reservations
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as ReservationService from '@/lib/hospitality/services/reservation-service'
import { HospitalityReservationType, HospitalityReservationStatus } from '@prisma/client'

// ============================================================================
// GET - List reservations or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_reservations')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const reservationNumber = searchParams.get('reservationNumber')
    const action = searchParams.get('action')
    const venueId = searchParams.get('venueId')

    // Get reservation by ID
    if (id) {
      const reservation = await ReservationService.getReservation(tenantId, id)
      if (!reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, reservation })
    }

    // Get reservation by number
    if (reservationNumber) {
      const reservation = await ReservationService.getReservationByNumber(tenantId, reservationNumber)
      if (!reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, reservation })
    }

    // Special actions
    if (action && venueId) {
      switch (action) {
        case 'todayTables':
          const todayTables = await ReservationService.getTodayTableReservations(tenantId, venueId)
          return NextResponse.json({ success: true, reservations: todayTables })

        case 'todayArrivals':
          const arrivals = await ReservationService.getTodayArrivals(tenantId, venueId)
          return NextResponse.json({ success: true, reservations: arrivals })

        case 'todayDepartures':
          const departures = await ReservationService.getTodayDepartures(tenantId, venueId)
          return NextResponse.json({ success: true, stays: departures })

        case 'checkTableAvailability':
          const date = new Date(searchParams.get('date')!)
          const time = searchParams.get('time')!
          const partySize = parseInt(searchParams.get('partySize') || '2')
          const tableAvailability = await ReservationService.checkTableAvailability(tenantId, venueId, date, time, partySize)
          return NextResponse.json({ success: true, ...tableAvailability })

        case 'checkRoomAvailability':
          const checkInDate = new Date(searchParams.get('checkInDate')!)
          const checkOutDate = new Date(searchParams.get('checkOutDate')!)
          const roomType = searchParams.get('roomType') || undefined
          const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined
          const roomAvailability = await ReservationService.checkRoomAvailability(tenantId, venueId, checkInDate, checkOutDate, roomType, guests)
          return NextResponse.json({ success: true, ...roomAvailability })
      }
    }

    // List reservations
    const guestId = searchParams.get('guestId') || undefined
    const reservationType = searchParams.get('reservationType') as HospitalityReservationType | null
    const status = searchParams.get('status') as HospitalityReservationStatus | null
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await ReservationService.listReservations(tenantId, {
      venueId: venueId || undefined,
      guestId,
      reservationType: reservationType || undefined,
      status: status || undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Reservations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create reservation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_reservations')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.venueId || !body.guestName) {
      return NextResponse.json({ error: 'venueId and guestName are required' }, { status: 400 })
    }

    // Create table reservation
    if (body.reservationType === 'TABLE' || body.reservationDate) {
      if (!body.reservationDate || !body.reservationTime || !body.partySize) {
        return NextResponse.json({ error: 'reservationDate, reservationTime, and partySize are required for table reservations' }, { status: 400 })
      }

      const reservation = await ReservationService.createTableReservation({
        tenantId,
        venueId: body.venueId,
        guestId: body.guestId,
        guestName: body.guestName,
        guestPhone: body.guestPhone,
        guestEmail: body.guestEmail,
        tableId: body.tableId,
        partySize: body.partySize,
        reservationDate: new Date(body.reservationDate),
        reservationTime: body.reservationTime,
        duration: body.duration,
        specialRequests: body.specialRequests,
        occasion: body.occasion,
        source: body.source,
      })

      return NextResponse.json({ success: true, reservation })
    }

    // Create room reservation
    if (body.reservationType === 'ROOM' || body.checkInDate) {
      if (!body.checkInDate || !body.checkOutDate) {
        return NextResponse.json({ error: 'checkInDate and checkOutDate are required for room reservations' }, { status: 400 })
      }

      const reservation = await ReservationService.createRoomReservation({
        tenantId,
        venueId: body.venueId,
        guestId: body.guestId,
        guestName: body.guestName,
        guestPhone: body.guestPhone,
        guestEmail: body.guestEmail,
        roomId: body.roomId,
        checkInDate: new Date(body.checkInDate),
        checkOutDate: new Date(body.checkOutDate),
        adults: body.adults,
        children: body.children,
        specialRequests: body.specialRequests,
        source: body.source,
        depositRequired: body.depositRequired,
        depositAmount: body.depositAmount,
      })

      return NextResponse.json({ success: true, reservation })
    }

    return NextResponse.json({ error: 'Could not determine reservation type' }, { status: 400 })
  } catch (error) {
    console.error('Reservations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update reservation status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_reservations')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id || !body.action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
    }

    let reservation
    switch (body.action) {
      case 'confirm':
        reservation = await ReservationService.confirmReservation(tenantId, body.id)
        break
      case 'cancel':
        reservation = await ReservationService.cancelReservation(tenantId, body.id, body.reason)
        break
      case 'noShow':
        reservation = await ReservationService.markNoShow(tenantId, body.id)
        break
      case 'depositPaid':
        reservation = await ReservationService.markDepositPaid(tenantId, body.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, reservation })
  } catch (error) {
    console.error('Reservations PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
