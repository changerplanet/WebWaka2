/**
 * POS Register Sessions API
 * 
 * POST /api/pos/registers/:registerId/sessions - Open a register session
 * GET /api/pos/registers/:registerId/sessions - List sessions for register
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../../lib/permissions'

interface RouteParams {
  params: Promise<{ registerId: string }>
}

/**
 * POST /api/pos/registers/:registerId/sessions
 * Open a register session (cash drawer)
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { registerId } = await context.params
    const body = await request.json()

    const { tenantId, staffId, openingCash, openingNotes } = body

    if (!registerId || !tenantId || !staffId || openingCash === undefined) {
      return NextResponse.json(
        { success: false, error: 'registerId, tenantId, staffId, and openingCash are required' },
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
      registerId
    }

    // Check permission
    const permCheck = hasPermission(staff, 'pos.register.open')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // Generate session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const session = {
      id: sessionId,
      tenantId,
      registerId,
      staffId,
      status: 'OPEN',
      openingCash,
      closingCash: null,
      expectedCash: null,
      cashDifference: null,
      openedAt: new Date().toISOString(),
      closedAt: null,
      closedByStaffId: null,
      openingNotes: openingNotes || null,
      closingNotes: null
    }

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('Error opening register session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/registers/:registerId/sessions
 * List sessions for register
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { registerId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!registerId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'registerId and tenantId are required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    return NextResponse.json({
      success: true,
      sessions: [],
      filters: {
        registerId,
        tenantId,
        status: status || 'all',
        limit
      }
    })

  } catch (error) {
    console.error('Error listing sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
