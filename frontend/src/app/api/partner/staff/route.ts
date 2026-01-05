/**
 * PHASE 4B: Partner Staff API
 * 
 * GET /api/partner/staff - List all staff
 * POST /api/partner/staff - Add new staff member
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPartnerStaff,
  addPartnerStaff,
  hasPermission,
  ROLE_PERMISSIONS,
} from '@/lib/phase-4b/partner-staff'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true'
    const department = request.nextUrl.searchParams.get('department') || undefined
    
    const staff = await getPartnerStaff(partnerUser.partnerId, {
      includeInactive,
      department,
    })
    
    // Add permissions info for each staff member
    const staffWithPermissions = staff.map(s => ({
      ...s,
      permissions: ROLE_PERMISSIONS[s.role],
    }))
    
    return NextResponse.json({
      success: true,
      staff: staffWithPermissions,
    })
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    if (!hasPermission(partnerUser.role, 'canManageStaff')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage staff' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate userId exists
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId }
    })
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const result = await addPartnerStaff({
      partnerId: partnerUser.partnerId,
      userId: body.userId,
      role: body.role || 'PARTNER_STAFF',
      displayName: body.displayName,
      department: body.department,
      assignedTenantIds: body.assignedTenantIds,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      staff: result.staff,
    })
  } catch (error) {
    console.error('Staff create error:', error)
    return NextResponse.json(
      { error: 'Failed to add staff member' },
      { status: 500 }
    )
  }
}
