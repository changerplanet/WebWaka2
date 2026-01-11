export const dynamic = 'force-dynamic'

/**
 * MODULE 5: HR & PAYROLL
 * Employee Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { EmployeeService } from '@/lib/hr/employee-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/hr/employees/[id]
 * Get employee profile by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const profile = await EmployeeService.getEmployeeProfileById(tenantId, id)

    if (!profile) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error getting employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/hr/employees/[id]
 * Update employee profile
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    const profile = await EmployeeService.updateEmployeeProfile(tenantId, id, body)

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hr/employees/[id]
 * Terminate employee
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const reason = searchParams.get('reason') || 'Terminated'

    await EmployeeService.terminateEmployee(tenantId, id, new Date(), reason)

    return NextResponse.json({
      success: true,
      message: 'Employee terminated',
    })
  } catch (error) {
    console.error('Error terminating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
