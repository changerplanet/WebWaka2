/**
 * PHASE 4B: Single Staff Member API
 * 
 * GET /api/partner/staff/[id] - Get staff member details
 * PATCH /api/partner/staff/[id] - Update staff member
 * DELETE /api/partner/staff/[id] - Remove staff member
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getStaffById,
  updatePartnerStaff,
  removePartnerStaff,
  hasPermission,
  ROLE_PERMISSIONS,
} from '@/lib/phase-4b/partner-staff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    
    const staff = await getStaffById(id)
    
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }
    
    if (staff.partnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      staff: {
        ...staff,
        permissions: ROLE_PERMISSIONS[staff.role],
      },
    })
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser || !hasPermission(partnerUser.role, 'canManageStaff')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage staff' },
        { status: 403 }
      )
    }
    
    // Verify staff belongs to partner
    const existing = await getStaffById(id)
    if (!existing || existing.partnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Staff member not found or access denied' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    
    const result = await updatePartnerStaff(id, body)
    
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
    console.error('Staff update error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser || !hasPermission(partnerUser.role, 'canManageStaff')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage staff' },
        { status: 403 }
      )
    }
    
    // Verify staff belongs to partner
    const existing = await getStaffById(id)
    if (!existing || existing.partnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Staff member not found or access denied' },
        { status: 404 }
      )
    }
    
    const result = await removePartnerStaff(id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Staff delete error:', error)
    return NextResponse.json(
      { error: 'Failed to remove staff member' },
      { status: 500 }
    )
  }
}
