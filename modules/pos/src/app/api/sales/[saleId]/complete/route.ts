/**
 * POS Sale Completion API
 * 
 * POST /api/pos/sales/:saleId/complete - Complete/finalize a sale
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../../../lib/permissions'

interface RouteParams {
  params: Promise<{ saleId: string }>
}

/**
 * POST /api/pos/sales/:saleId/complete
 * Complete/finalize a sale
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { saleId } = await context.params
    const body = await request.json()

    const { tenantId, staffId } = body

    if (!saleId || !tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'saleId, tenantId, and staffId are required' },
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

    // Check permission
    const permCheck = hasPermission(staff, 'pos.sale.complete')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // In production:
    // 1. Verify sale exists and is in valid state
    // 2. Verify amount due is 0 (fully paid)
    // 3. Transition to COMPLETED status
    // 4. Emit pos.sale.completed event
    // 5. Emit pos.inventory.deduction_requested event

    const completedAt = new Date().toISOString()

    return NextResponse.json({
      success: true,
      message: `Sale ${saleId} completed successfully`,
      sale: {
        id: saleId,
        status: 'COMPLETED',
        completedAt,
        completedBy: staffId
      },
      events: [
        {
          eventType: 'pos.sale.completed',
          timestamp: completedAt
        },
        {
          eventType: 'pos.inventory.deduction_requested',
          timestamp: completedAt,
          note: 'Core will process inventory deduction'
        }
      ]
    })

  } catch (error) {
    console.error('Error completing sale:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
