/**
 * POS Shift by ID API
 * 
 * GET /api/pos/shifts/:shiftId - Get shift details
 * PUT /api/pos/shifts/:shiftId - Update shift (break, notes)
 * POST /api/pos/shifts/:shiftId/end - End shift
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../../lib/permissions'

interface RouteParams {
  params: Promise<{ shiftId: string }>
}

/**
 * GET /api/pos/shifts/:shiftId
 * Get shift details
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { shiftId } = await context.params

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'shiftId is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    return NextResponse.json(
      { success: false, error: `Shift ${shiftId} not found` },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pos/shifts/:shiftId
 * Update shift (take break, add notes)
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { shiftId } = await context.params
    const body = await request.json()

    const { tenantId, staffId, action, breakMinutes, notes } = body

    if (!shiftId || !tenantId || !staffId || !action) {
      return NextResponse.json(
        { success: false, error: 'shiftId, tenantId, staffId, and action are required' },
        { status: 400 }
      )
    }

    // In production, update shift in database
    return NextResponse.json({
      success: true,
      message: `Shift ${shiftId} updated`,
      action,
      shiftId
    })

  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pos/shifts/:shiftId/end
 * End a shift
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { shiftId } = await context.params
    const body = await request.json()

    const { 
      tenantId, 
      staffId, 
      shiftStaffId, // The staff whose shift is being ended
      notes 
    } = body

    if (!shiftId || !tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'shiftId, tenantId, and staffId are required' },
        { status: 400 }
      )
    }

    // Get staff context
    const staff: POSStaffContext = {
      userId: staffId,
      tenantId,
      email: body.staffEmail || 'staff@tenant.com',
      coreRole: body.coreRole || 'TENANT_USER',
      posRole: body.posRole || 'POS_CASHIER'
    }

    // Determine permission based on whether ending own shift or others'
    const isEndingOthers = shiftStaffId && shiftStaffId !== staffId
    const requiredPermission = isEndingOthers ? 'pos.shift.end_others' : 'pos.shift.end'

    const permCheck = hasPermission(staff, requiredPermission)
    if (!permCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: permCheck.reason,
          requiresApproval: permCheck.requiresApproval,
          approverRole: permCheck.approverRole
        },
        { status: 403 }
      )
    }

    const endedAt = new Date().toISOString()

    return NextResponse.json({
      success: true,
      shift: {
        id: shiftId,
        status: 'ENDED',
        endedAt,
        endedBy: staffId,
        notes: notes || null
      },
      summary: {
        totalHours: 0, // Would be calculated
        totalBreakMinutes: 0,
        totalSales: 0,
        totalRevenue: 0
      }
    })

  } catch (error) {
    console.error('Error ending shift:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
