export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Departments API
 * 
 * GET - List departments, get department by ID
 * POST - Create department
 * PATCH - Update department
 * 
 * @module api/civic/departments
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as AgencyService from '@/lib/civic/services/agency-service'

// ============================================================================
// GET - List departments or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_agencies')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const agencyId = searchParams.get('agencyId')

    // Get department by ID
    if (id) {
      const department = await AgencyService.getDepartment(tenantId, id)
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, department })
    }

    // List departments for agency
    if (!agencyId) {
      return NextResponse.json({ error: 'agencyId is required' }, { status: 400 })
    }

    const departments = await AgencyService.listDepartments(tenantId, agencyId)
    return NextResponse.json({ success: true, departments })
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create department
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_agencies')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.agencyId || !body.code || !body.name) {
      return NextResponse.json({ error: 'agencyId, code, and name are required' }, { status: 400 })
    }

    const department = await AgencyService.createDepartment({
      tenantId,
      agencyId: body.agencyId,
      code: body.code,
      name: body.name,
      description: body.description,
      headName: body.headName,
      headTitle: body.headTitle,
    })

    return NextResponse.json({ success: true, department })
  } catch (error) {
    console.error('Departments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update department
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_agencies')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }

    const department = await AgencyService.updateDepartment(tenantId, body.id, {
      code: body.code,
      name: body.name,
      description: body.description,
      headName: body.headName,
      headTitle: body.headTitle,
    })

    return NextResponse.json({ success: true, department })
  } catch (error) {
    console.error('Departments PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
