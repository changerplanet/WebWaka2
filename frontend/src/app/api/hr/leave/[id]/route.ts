export const dynamic = 'force-dynamic'

/**
 * MODULE 5: HR & PAYROLL
 * Leave Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { LeaveService } from '@/lib/hr/leave-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/hr/leave/[id]
 * Get leave request by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const leaveRequest = await LeaveService.getLeaveRequestById(tenantId, id)

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: leaveRequest })
  } catch (error) {
    console.error('Error getting leave request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/leave/[id]
 * Perform action: approve, reject, cancel
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    let result

    switch (body.action) {
      case 'approve':
        result = await LeaveService.approveLeaveRequest(tenantId, id, session.user.id)
        break

      case 'reject':
        if (!body.reason) {
          return NextResponse.json({ error: 'reason is required for rejection' }, { status: 400 })
        }
        result = await LeaveService.rejectLeaveRequest(tenantId, id, session.user.id, body.reason)
        break

      case 'cancel':
        result = await LeaveService.cancelLeaveRequest(
          tenantId,
          id,
          session.user.id,
          body.reason || 'Cancelled by user'
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, reject, or cancel' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      request: result,
    })
  } catch (error) {
    console.error('Error processing leave action:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Cannot')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
