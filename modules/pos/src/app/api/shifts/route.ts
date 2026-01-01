/**
 * POS Shifts API
 * 
 * POST /api/pos/shifts - Start a shift
 * GET /api/pos/shifts - List shifts
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../lib/permissions'

/**
 * POST /api/pos/shifts
 * Start a new shift
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, staffId, sessionId, notes } = body

    if (!tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and staffId are required' },
        { status: 400 }
      )
    }

    // Get staff context
    const staff: POSStaffContext = {
      userId: staffId,
      tenantId,
      email: body.staffEmail || 'staff@tenant.com',
      coreRole: body.coreRole || 'TENANT_USER',
      posRole: body.posRole || 'POS_CASHIER',
      sessionId
    }

    // Check permission
    const permCheck = hasPermission(staff, 'pos.shift.start')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // Generate shift ID
    const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const shift = {
      id: shiftId,
      tenantId,
      staffId,
      sessionId: sessionId || null,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      endedAt: null,
      totalBreakMinutes: 0,
      totalSales: 0,
      totalRevenue: 0,
      notes: notes || null
    }

    return NextResponse.json({
      success: true,
      shift
    })

  } catch (error) {
    console.error('Error starting shift:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/shifts
 * List shifts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const date = searchParams.get('date') // YYYY-MM-DD
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    return NextResponse.json({
      success: true,
      shifts: [],
      filters: {
        tenantId,
        staffId: staffId || null,
        status: status || 'all',
        date: date || null,
        limit
      }
    })

  } catch (error) {
    console.error('Error listing shifts:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
