export const dynamic = 'force-dynamic'

/**
 * HOSPITALITY SUITE: Staff API
 * 
 * GET - List staff, get by ID, get by role
 * POST - Create staff
 * PATCH - Update staff, deactivate
 * 
 * @module api/hospitality/staff
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as StaffShiftService from '@/lib/hospitality/services/staff-shift-service'
import { HospitalityStaffRole } from '@prisma/client'

// ============================================================================
// GET - List staff or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const venueId = searchParams.get('venueId')
    const action = searchParams.get('action')

    // Get staff by ID
    if (id) {
      const staff = await StaffShiftService.getStaff(tenantId, id)
      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, staff })
    }

    // Get staff by role
    if (action === 'byRole' && venueId) {
      const role = searchParams.get('role') as HospitalityStaffRole | null
      if (!role) {
        return NextResponse.json({ error: 'role is required' }, { status: 400 })
      }
      const staff = await StaffShiftService.getStaffByRole(tenantId, venueId, role)
      return NextResponse.json({ success: true, staff })
    }

    // List staff
    const role = searchParams.get('role') as HospitalityStaffRole | null
    const department = searchParams.get('department') || undefined
    const isActive = searchParams.get('isActive') !== 'false'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await StaffShiftService.listStaff(tenantId, {
      venueId: venueId || undefined,
      role: role || undefined,
      department,
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

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.venueId || !body.firstName || !body.lastName || !body.role) {
      return NextResponse.json({ error: 'venueId, firstName, lastName, and role are required' }, { status: 400 })
    }

    const staff = await StaffShiftService.createStaff({
      tenantId,
      venueId: body.venueId,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      phone: body.phone,
      email: body.email,
      role: body.role as HospitalityStaffRole,
      department: body.department,
      designation: body.designation,
      employeeId: body.employeeId,
      hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Staff POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update staff
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_guests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    // Deactivate staff
    if (body.action === 'deactivate') {
      const staff = await StaffShiftService.deactivateStaff(tenantId, body.id)
      return NextResponse.json({ success: true, staff })
    }

    // Update staff
    const staff = await StaffShiftService.updateStaff(tenantId, body.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      phone: body.phone,
      email: body.email,
      role: body.role,
      department: body.department,
      designation: body.designation,
      employeeId: body.employeeId,
      hireDate: body.hireDate ? new Date(body.hireDate) : undefined,
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Staff PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
