/**
 * MODULE 5: HR & PAYROLL
 * Attendance API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { AttendanceService } from '@/lib/hr/attendance-service'
import { HrEntitlementsService } from '@/lib/hr/entitlements-service'

/**
 * GET /api/hr/attendance
 * Get attendance records
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams

    // Check if requesting overview
    if (searchParams.get('overview') === 'today') {
      const overview = await AttendanceService.getTodayAttendanceOverview(tenantId)
      return NextResponse.json(overview)
    }
    
    const employeeProfileId = searchParams.get('employeeProfileId') || undefined
    const status = searchParams.get('status') as any
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await AttendanceService.getAttendanceRecords(tenantId, {
      employeeProfileId,
      status,
      dateFrom,
      dateTo,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/attendance
 * Record attendance (clock-in, clock-out, or manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check attendance entitlement
    await HrEntitlementsService.enforceEntitlement(tenantId, 'attendance_enabled')
    
    const body = await request.json()

    if (!body.employeeProfileId) {
      return NextResponse.json(
        { error: 'employeeProfileId is required' },
        { status: 400 }
      )
    }

    let record

    switch (body.action) {
      case 'clock-in':
        record = await AttendanceService.clockIn(tenantId, {
          employeeProfileId: body.employeeProfileId,
          method: body.method,
          locationId: body.locationId,
          latitude: body.latitude,
          longitude: body.longitude,
          notes: body.notes,
          offlineId: body.offlineId,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
        }, session.user.id)
        break

      case 'clock-out':
        record = await AttendanceService.clockOut(tenantId, {
          employeeProfileId: body.employeeProfileId,
          method: body.method,
          locationId: body.locationId,
          latitude: body.latitude,
          longitude: body.longitude,
          notes: body.notes,
          offlineId: body.offlineId,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
        }, session.user.id)
        break

      case 'manual':
        record = await AttendanceService.createManualAttendance(tenantId, {
          employeeProfileId: body.employeeProfileId,
          date: new Date(body.date),
          clockIn: body.clockIn ? new Date(body.clockIn) : undefined,
          clockOut: body.clockOut ? new Date(body.clockOut) : undefined,
          breakStart: body.breakStart ? new Date(body.breakStart) : undefined,
          breakEnd: body.breakEnd ? new Date(body.breakEnd) : undefined,
          status: body.status,
          notes: body.notes,
          adminNotes: body.adminNotes,
          requiresApproval: body.requiresApproval,
        }, session.user.id)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clock-in, clock-out, or manual' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      record,
    })
  } catch (error) {
    console.error('Error recording attendance:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Already clocked') || error.message.includes('No clock-in')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('not allowed') || error.message.includes('not enabled')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
