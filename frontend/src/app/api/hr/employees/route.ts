export const dynamic = 'force-dynamic'

/**
 * MODULE 5: HR & PAYROLL
 * Employees API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { EmployeeService } from '@/lib/hr/employee-service'
import { HrEntitlementsService } from '@/lib/hr/entitlements-service'
import { HrConfigurationService } from '@/lib/hr/config-service'

/**
 * GET /api/hr/employees
 * List employee profiles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    
    const employmentType = searchParams.get('employmentType') as any
    const department = searchParams.get('department') || undefined
    const active = searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined
    const search = searchParams.get('search') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await EmployeeService.getEmployeeProfiles(tenantId, {
      employmentType,
      department,
      active,
      search,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/employees
 * Create employee profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check if HR is initialized
    const { initialized } = await HrConfigurationService.getConfiguration(tenantId)
    if (!initialized) {
      return NextResponse.json(
        { error: 'HR not initialized' },
        { status: 400 }
      )
    }
    
    // Check employee limit
    await HrEntitlementsService.enforceEntitlement(tenantId, 'create_employee')
    
    const body = await request.json()
    
    if (!body.staffId) {
      return NextResponse.json(
        { error: 'staffId is required' },
        { status: 400 }
      )
    }

    const profile = await EmployeeService.createEmployeeProfile(tenantId, body)

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('not allowed') || error.message.includes('Maximum')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
