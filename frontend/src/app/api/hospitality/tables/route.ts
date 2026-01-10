/**
 * HOSPITALITY SUITE: Tables API
 * 
 * GET - List tables, get table by ID, get available tables
 * POST - Create table
 * PATCH - Update table status
 * 
 * @module api/hospitality/tables
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as VenueService from '@/lib/hospitality/services/venue-service'
import { HospitalityTableStatus } from '@prisma/client'

// ============================================================================
// GET - List tables or get by ID
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
    const venueId = searchParams.get('venueId')
    const action = searchParams.get('action')

    // Get single table
    if (id) {
      const table = await VenueService.getTable(tenantId, id)
      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, table })
    }

    if (!venueId) {
      return NextResponse.json({ error: 'venueId is required' }, { status: 400 })
    }

    // Get available tables for party size
    if (action === 'available') {
      const partySize = parseInt(searchParams.get('partySize') || '2')
      const tables = await VenueService.getAvailableTables(tenantId, venueId, partySize)
      return NextResponse.json({ success: true, tables, partySize })
    }

    // List all tables
    const floorId = searchParams.get('floorId') || undefined
    const status = searchParams.get('status') as HospitalityTableStatus | null
    const minCapacity = searchParams.get('minCapacity') ? parseInt(searchParams.get('minCapacity')!) : undefined

    const tables = await VenueService.listTables(tenantId, venueId, {
      floorId,
      status: status || undefined,
      minCapacity,
    })

    return NextResponse.json({ success: true, tables })
  } catch (error) {
    console.error('Tables GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create table
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

    if (!body.venueId || !body.tableNumber) {
      return NextResponse.json({ error: 'venueId and tableNumber are required' }, { status: 400 })
    }

    const table = await VenueService.createTable({
      tenantId,
      venueId: body.venueId,
      floorId: body.floorId,
      tableNumber: body.tableNumber,
      capacity: body.capacity,
      minCapacity: body.minCapacity,
      location: body.location,
    })

    return NextResponse.json({ success: true, table })
  } catch (error) {
    console.error('Tables POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update table status
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

    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const table = await VenueService.updateTableStatus(tenantId, body.id, body.status as HospitalityTableStatus)
    return NextResponse.json({ success: true, table })
  } catch (error) {
    console.error('Tables PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
