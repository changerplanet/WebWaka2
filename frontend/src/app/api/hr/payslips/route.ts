export const dynamic = 'force-dynamic'

/**
 * MODULE 5: HR & PAYROLL
 * Payslips API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PayslipService } from '@/lib/hr/payslip-service'

/**
 * GET /api/hr/payslips
 * Get payslips for an employee
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams

    // Check if requesting statistics
    if (searchParams.get('statistics') === 'true') {
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
      const periodId = searchParams.get('periodId') || undefined
      const stats = await PayslipService.getPayrollStatistics(tenantId, { year, periodId })
      return NextResponse.json(stats)
    }
    
    const employeeProfileId = searchParams.get('employeeProfileId')
    if (!employeeProfileId) {
      return NextResponse.json(
        { error: 'employeeProfileId is required' },
        { status: 400 }
      )
    }

    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await PayslipService.getPayslipsByEmployee(tenantId, employeeProfileId, {
      year,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting payslips:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
