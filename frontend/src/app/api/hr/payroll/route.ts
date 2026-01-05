/**
 * MODULE 5: HR & PAYROLL
 * Payroll API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PayrollService } from '@/lib/hr/payroll-service'
import { HrEntitlementsService } from '@/lib/hr/entitlements-service'

/**
 * GET /api/hr/payroll
 * Get payroll periods
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get('status') as any
    const payFrequency = searchParams.get('payFrequency') as any
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await PayrollService.getPayrollPeriods(tenantId, {
      status,
      payFrequency,
      year,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting payroll periods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/payroll
 * Create payroll period
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check payroll entitlement
    await HrEntitlementsService.enforceEntitlement(tenantId, 'payroll_enabled')
    
    const body = await request.json()

    if (!body.name || !body.payFrequency || !body.periodStart || !body.periodEnd || !body.payDate) {
      return NextResponse.json(
        { error: 'name, payFrequency, periodStart, periodEnd, and payDate are required' },
        { status: 400 }
      )
    }

    const period = await PayrollService.createPayrollPeriod(tenantId, {
      name: body.name,
      payFrequency: body.payFrequency,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      payDate: new Date(body.payDate),
      notes: body.notes,
      metadata: body.metadata,
    })

    return NextResponse.json({
      success: true,
      period,
    })
  } catch (error) {
    console.error('Error creating payroll period:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
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
