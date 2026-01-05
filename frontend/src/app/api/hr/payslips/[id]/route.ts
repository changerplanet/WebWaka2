/**
 * MODULE 5: HR & PAYROLL
 * Payslip Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PayslipService } from '@/lib/hr/payslip-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/hr/payslips/[id]
 * Get payslip by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const payslip = await PayslipService.getPayslipById(tenantId, id)

    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })
    }

    // Mark as viewed
    await PayslipService.markAsViewed(tenantId, id)

    return NextResponse.json({ payslip })
  } catch (error) {
    console.error('Error getting payslip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/payslips/[id]
 * Perform action: update-payment-status, mark-delivered
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
      case 'update-payment-status':
        if (!body.status || !['PENDING', 'PAID', 'HELD'].includes(body.status)) {
          return NextResponse.json(
            { error: 'Valid status (PENDING, PAID, HELD) is required' },
            { status: 400 }
          )
        }
        result = await PayslipService.updatePaymentStatus(tenantId, id, body.status, {
          paymentReference: body.paymentReference,
          paidBy: session.user.id,
        })
        break

      case 'mark-delivered':
        if (!body.method || !['EMAIL', 'PRINT', 'PORTAL'].includes(body.method)) {
          return NextResponse.json(
            { error: 'Valid method (EMAIL, PRINT, PORTAL) is required' },
            { status: 400 }
          )
        }
        result = await PayslipService.markAsDelivered(tenantId, id, body.method)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update-payment-status, mark-delivered' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      payslip: result,
    })
  } catch (error) {
    console.error('Error processing payslip action:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
