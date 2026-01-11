export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Staff API
 * 
 * GET - List staff, get staff by ID/number
 * POST - Create staff
 * PATCH - Update staff, deactivate
 * 
 * @module api/civic/staff
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as AgencyService from '@/lib/civic/services/agency-service'
import { CivicStaffRole } from '@prisma/client'

// ============================================================================
// GET - List staff or get by ID
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
    const staffNumber = searchParams.get('staffNumber')
    const agencyId = searchParams.get('agencyId')
    const role = searchParams.get('role')

    // Get staff by ID
    if (id) {
      const staff = await AgencyService.getStaff(tenantId, id)
      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, staff })
    }

    // Get staff by number
    if (staffNumber) {
      const staff = await AgencyService.getStaffByNumber(tenantId, staffNumber)
      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, staff })
    }

    // Get staff by role for agency
    if (agencyId && role) {
      const staff = await AgencyService.getStaffByRole(
        tenantId,
        agencyId,
        role as CivicStaffRole
      )
      return NextResponse.json({ success: true, staff })
    }

    // List staff with filters
    const departmentId = searchParams.get('departmentId') || undefined
    const unitId = searchParams.get('unitId') || undefined
    const isActive = searchParams.get('isActive') !== 'false'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await AgencyService.listStaff(tenantId, {
      agencyId: agencyId || undefined,
      departmentId,
      unitId,
      role: role as CivicStaffRole | undefined,
      isActive,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create staff
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

    if (!body.firstName || !body.lastName || !body.role) {
      return NextResponse.json({ error: 'firstName, lastName, and role are required' }, { status: 400 })
    }

    const staff = await AgencyService.createStaff({
      tenantId,
      agencyId: body.agencyId,
      departmentId: body.departmentId,
      unitId: body.unitId,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      phone: body.phone,
      email: body.email,
      role: body.role,
      designation: body.designation,
      hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Staff POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update staff or deactivate
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
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Handle deactivate action
    if (body.action === 'deactivate') {
      const staff = await AgencyService.deactivateStaff(tenantId, body.id)
      return NextResponse.json({ success: true, staff })
    }

    // Update staff
    const staff = await AgencyService.updateStaff(tenantId, body.id, {
      agencyId: body.agencyId,
      departmentId: body.departmentId,
      unitId: body.unitId,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      phone: body.phone,
      email: body.email,
      role: body.role,
      designation: body.designation,
      hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Staff PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
