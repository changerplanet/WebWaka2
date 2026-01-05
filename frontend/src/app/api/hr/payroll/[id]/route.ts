/**
 * MODULE 5: HR & PAYROLL
 * Payroll Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PayrollService } from '@/lib/hr/payroll-service'
import { PayslipService } from '@/lib/hr/payslip-service'
import { HrEntitlementsService } from '@/lib/hr/entitlements-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/hr/payroll/[id]
 * Get payroll period by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const searchParams = request.nextUrl.searchParams

    // Check if requesting calculations
    if (searchParams.get('calculations') === 'true') {
      const calculations = await PayrollService.getPayrollCalculations(tenantId, id)
      return NextResponse.json({ calculations })
    }

    // Check if requesting payslips
    if (searchParams.get('payslips') === 'true') {
      const payslips = await PayslipService.getPayslipsByPeriod(tenantId, id)
      return NextResponse.json({ payslips })
    }

    const period = await PayrollService.getPayrollPeriodById(tenantId, id)

    if (!period) {
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 })
    }

    return NextResponse.json({ period })
  } catch (error) {
    console.error('Error getting payroll period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/payroll/[id]
 * Perform action: open, calculate, finalize, mark-paid, close, generate-payslips
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
      case 'open':
        result = await PayrollService.openPayrollPeriod(tenantId, id)
        return NextResponse.json({ success: true, period: result })

      case 'calculate':
        await HrEntitlementsService.enforceEntitlement(tenantId, 'run_payroll')
        result = await PayrollService.calculatePayroll(tenantId, id, session.user.id)
        return NextResponse.json({ success: true, ...result })

      case 'finalize':
        result = await PayrollService.finalizePayrollPeriod(tenantId, id, session.user.id)
        return NextResponse.json({ success: true, period: result })

      case 'mark-paid':
        result = await PayrollService.markPeriodAsPaid(tenantId, id, session.user.id)
        return NextResponse.json({ success: true, period: result })

      case 'close':
        result = await PayrollService.closePayrollPeriod(tenantId, id)
        return NextResponse.json({ success: true, period: result })

      case 'generate-payslips':
        try {
          const payslips = await PayslipService.generatePayslips(
            tenantId,
            { periodId: id, calculationIds: body.calculationIds },
            session.user.id
          )
          if (!payslips || payslips.length === 0) {
            return NextResponse.json(
              { error: 'No calculations found to generate payslips. Run payroll calculation first.' },
              { status: 400 }
            )
          }
          return NextResponse.json({ success: true, payslips })
        } catch (payslipError) {
          console.error('Error generating payslips:', payslipError)
          if (payslipError instanceof Error && payslipError.message.includes('No finalized')) {
            return NextResponse.json(
              { error: payslipError.message },
              { status: 400 }
            )
          }
          throw payslipError
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: open, calculate, finalize, mark-paid, close, generate-payslips' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing payroll action:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('must be') || error.message.includes('Only')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('not allowed') || error.message.includes('limit')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
