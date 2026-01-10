/**
 * HOSPITALITY SUITE: Shifts API
 * 
 * GET - List shifts, today's shifts, active staff, week schedule
 * POST - Create shift
 * PATCH - Update shift, start/end shift, cancel, no-show
 * 
 * @module api/hospitality/shifts
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as StaffShiftService from '@/lib/hospitality/services/staff-shift-service'
import { HospitalityShiftType, HospitalityShiftStatus, HospitalityStaffRole } from '@prisma/client'

// ============================================================================
// GET - List shifts or get by ID
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

    // Get shift by ID
    if (id) {
      const shift = await StaffShiftService.getShift(tenantId, id)
      if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, shift })
    }

    // Special actions requiring venueId
    if (venueId) {
      switch (action) {
        case 'today':
          const todayShifts = await StaffShiftService.getTodayShifts(tenantId, venueId)
          return NextResponse.json({ success: true, shifts: todayShifts })

        case 'active':
          const activeStaff = await StaffShiftService.getActiveStaff(tenantId, venueId)
          return NextResponse.json({ success: true, shifts: activeStaff })

        case 'weekSchedule':
          const weekStart = searchParams.get('weekStart') ? new Date(searchParams.get('weekStart')!) : new Date()
          const schedule = await StaffShiftService.getWeekSchedule(tenantId, venueId, weekStart)
          return NextResponse.json({ success: true, schedule })

        case 'available':
          const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()
          const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : new Date()
          const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : new Date()
          const role = searchParams.get('role') as HospitalityStaffRole | null
          const availableStaff = await StaffShiftService.getAvailableStaff(
            tenantId, venueId, date, startTime, endTime, role || undefined
          )
          return NextResponse.json({ success: true, staff: availableStaff })
      }
    }

    // List shifts
    const staffId = searchParams.get('staffId') || undefined
    const shiftType = searchParams.get('shiftType') as HospitalityShiftType | null
    const status = searchParams.get('status') as HospitalityShiftStatus | null
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await StaffShiftService.listShifts(tenantId, {
      staffId,
      venueId: venueId || undefined,
      shiftType: shiftType || undefined,
      status: status || undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Shifts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create shift
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

    if (!body.staffId || !body.shiftType || !body.shiftDate || !body.scheduledStart || !body.scheduledEnd) {
      return NextResponse.json({ 
        error: 'staffId, shiftType, shiftDate, scheduledStart, and scheduledEnd are required' 
      }, { status: 400 })
    }

    const shift = await StaffShiftService.createShift({
      tenantId,
      staffId: body.staffId,
      shiftType: body.shiftType as HospitalityShiftType,
      shiftDate: new Date(body.shiftDate),
      scheduledStart: new Date(body.scheduledStart),
      scheduledEnd: new Date(body.scheduledEnd),
      station: body.station,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, shift })
  } catch (error) {
    console.error('Shifts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update shift or change status
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
      return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })
    }

    let shift
    switch (body.action) {
      case 'start':
        shift = await StaffShiftService.startShift(tenantId, body.id)
        break
      case 'end':
        shift = await StaffShiftService.endShift(tenantId, body.id)
        break
      case 'cancel':
        shift = await StaffShiftService.cancelShift(tenantId, body.id)
        break
      case 'noShow':
        shift = await StaffShiftService.markNoShowShift(tenantId, body.id)
        break
      default:
        // Update shift details
        shift = await StaffShiftService.updateShift(tenantId, body.id, {
          shiftType: body.shiftType,
          shiftDate: body.shiftDate ? new Date(body.shiftDate) : undefined,
          scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
          scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : undefined,
          station: body.station,
          notes: body.notes,
        })
    }

    return NextResponse.json({ success: true, shift })
  } catch (error) {
    console.error('Shifts PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
