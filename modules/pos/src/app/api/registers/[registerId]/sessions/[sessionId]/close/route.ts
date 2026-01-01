/**
 * POS Register Session Close API
 * 
 * POST /api/pos/registers/:registerId/sessions/:sessionId/close - Close a register session
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '@pos/lib/permissions'

interface RouteParams {
  params: Promise<{ registerId: string; sessionId: string }>
}

/**
 * POST /api/pos/registers/:registerId/sessions/:sessionId/close
 * Close a register session
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { registerId, sessionId } = await context.params
    const body = await request.json()

    const { 
      tenantId, 
      staffId, 
      closingCash, 
      closingNotes,
      openedByStaffId, // ID of staff who opened (to check if closing others')
      blindClose // Close without counting
    } = body

    if (!registerId || !sessionId || !tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'registerId, sessionId, tenantId, and staffId are required' },
        { status: 400 }
      )
    }

    // Closing cash required unless blind close
    if (!blindClose && closingCash === undefined) {
      return NextResponse.json(
        { success: false, error: 'closingCash is required (or set blindClose: true)' },
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
      registerId,
      sessionId
    }

    // Determine required permission
    let requiredPermission: 'pos.register.close' | 'pos.register.close_others' | 'pos.register.blind_close'

    if (blindClose) {
      requiredPermission = 'pos.register.blind_close'
    } else if (openedByStaffId && openedByStaffId !== staffId) {
      requiredPermission = 'pos.register.close_others'
    } else {
      requiredPermission = 'pos.register.close'
    }

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

    const closedAt = new Date().toISOString()

    // Calculate expected vs actual (mock)
    const openingCash = body.openingCash || 100 // Would come from session record
    const salesCash = body.salesCash || 0 // Would be calculated from sales
    const expectedCash = openingCash + salesCash
    const cashDifference = blindClose ? null : (closingCash - expectedCash)

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        registerId,
        status: 'CLOSED',
        closingCash: blindClose ? null : closingCash,
        expectedCash: blindClose ? null : expectedCash,
        cashDifference,
        closedAt,
        closedByStaffId: staffId,
        closingNotes: closingNotes || null,
        blindClose: blindClose || false
      },
      summary: blindClose ? null : {
        openingCash,
        salesCash,
        expectedCash,
        actualCash: closingCash,
        difference: cashDifference,
        status: cashDifference === 0 ? 'BALANCED' : (cashDifference > 0 ? 'OVER' : 'SHORT')
      }
    })

  } catch (error) {
    console.error('Error closing register session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
