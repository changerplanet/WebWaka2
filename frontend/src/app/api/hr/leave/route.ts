/**
 * MODULE 5: HR & PAYROLL
 * Leave API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { LeaveService } from '@/lib/hr/leave-service'
import { HrEntitlementsService } from '@/lib/hr/entitlements-service'

/**
 * GET /api/hr/leave
 * Get leave requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams

    // Check if requesting balances
    if (searchParams.get('balances') === 'true') {
      const employeeProfileId = searchParams.get('employeeProfileId')
      if (!employeeProfileId) {
        return NextResponse.json({ error: 'employeeProfileId required for balances' }, { status: 400 })
      }
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
      const balances = await LeaveService.getLeaveBalances(tenantId, employeeProfileId, year)
      return NextResponse.json({ balances })
    }

    // Check if requesting calendar
    if (searchParams.get('calendar') === 'true') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate required for calendar' }, { status: 400 })
      }
      const calendar = await LeaveService.getLeaveCalendar(tenantId, new Date(startDate), new Date(endDate))
      return NextResponse.json({ calendar })
    }
    
    const employeeProfileId = searchParams.get('employeeProfileId') || undefined
    const status = searchParams.get('status') as any
    const leaveType = searchParams.get('leaveType') as any
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await LeaveService.getLeaveRequests(tenantId, {
      employeeProfileId,
      status,
      leaveType,
      dateFrom,
      dateTo,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting leave:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/leave
 * Create leave request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check leave entitlement
    await HrEntitlementsService.enforceEntitlement(tenantId, 'leave_enabled')
    
    const body = await request.json()

    if (!body.employeeProfileId || !body.leaveType || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'employeeProfileId, leaveType, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const request_ = await LeaveService.createLeaveRequest(tenantId, {
      employeeProfileId: body.employeeProfileId,
      leaveType: body.leaveType,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      halfDay: body.halfDay,
      halfDayType: body.halfDayType,
      reason: body.reason,
      attachmentUrl: body.attachmentUrl,
      approverStaffId: body.approverStaffId,
      reliefStaffId: body.reliefStaffId,
      handoverNotes: body.handoverNotes,
      offlineId: body.offlineId,
    })

    return NextResponse.json({
      success: true,
      request: request_,
    })
  } catch (error) {
    console.error('Error creating leave request:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || error.message.includes('cannot be before')) {
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
