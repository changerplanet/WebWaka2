/**
 * HOSPITALITY SUITE: Main API Route
 * 
 * GET - Returns hospitality suite configuration and stats
 * POST - Initialization and management operations
 * 
 * @module api/hospitality
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

// ============================================================================
// GET - Get hospitality suite configuration and stats
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard - check any hospitality capability
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'config'

    switch (action) {
      case 'config':
        // Get hospitality configuration
        const config = await prisma.hospitality_config.findUnique({
          where: { tenantId },
        })

        return NextResponse.json({
          success: true,
          initialized: !!config,
          config: config || null,
          defaults: {
            defaultTableReservationDuration: 120,
            defaultCheckInTime: '14:00',
            defaultCheckOutTime: '12:00',
            allowWalkIns: true,
            allowSplitBills: true,
            defaultServiceChargePercent: 10,
            currency: 'NGN',
          },
        })

      case 'stats':
        // Get hospitality statistics
        const [
          venueCount,
          tableCount,
          roomCount,
          guestCount,
          reservationCount,
          activeStayCount,
          activeOrderCount,
          staffCount,
          pendingChargeFacts,
        ] = await Promise.all([
          prisma.hospitality_venue.count({ where: { tenantId, isActive: true } }),
          prisma.hospitality_table.count({ where: { tenantId, isActive: true } }),
          prisma.hospitality_room.count({ where: { tenantId, isActive: true } }),
          prisma.hospitality_guest.count({ where: { tenantId, isActive: true } }),
          prisma.hospitality_reservation.count({ where: { tenantId } }),
          prisma.hospitality_stay.count({ where: { tenantId, status: { in: ['CHECKED_IN', 'IN_HOUSE'] } } }),
          prisma.hospitality_order.count({ where: { tenantId, status: { in: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'] } } }),
          prisma.hospitality_staff.count({ where: { tenantId, isActive: true } }),
          prisma.hospitality_charge_fact.count({ where: { tenantId, status: 'PENDING' } }),
        ])

        return NextResponse.json({
          success: true,
          stats: {
            venues: venueCount,
            tables: tableCount,
            rooms: roomCount,
            guests: guestCount,
            reservations: reservationCount,
            activeStays: activeStayCount,
            activeOrders: activeOrderCount,
            staff: staffCount,
            pendingChargeFacts,
          },
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Hospitality API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Initialize hospitality suite
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'initialize':
        // Check if already initialized
        const existing = await prisma.hospitality_config.findUnique({
          where: { tenantId },
        })

        if (existing) {
          return NextResponse.json({
            success: true,
            message: 'Hospitality suite already initialized',
            action: 'exists',
            config: existing,
          })
        }

        // Create hospitality configuration
        const config = await prisma.hospitality_config.create({
          data: {
            tenantId,
            venueName: body.venueName,
            venueType: body.venueType,
            defaultTableReservationDuration: body.defaultTableReservationDuration || 120,
            defaultCheckInTime: body.defaultCheckInTime || '14:00',
            defaultCheckOutTime: body.defaultCheckOutTime || '12:00',
            allowWalkIns: body.allowWalkIns ?? true,
            allowSplitBills: body.allowSplitBills ?? true,
            defaultServiceChargePercent: body.defaultServiceChargePercent || 10,
            autoAddServiceCharge: body.autoAddServiceCharge ?? false,
            autoCreateChargeFacts: body.autoCreateChargeFacts ?? true,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Hospitality suite initialized',
          action: 'created',
          config,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Hospitality POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
