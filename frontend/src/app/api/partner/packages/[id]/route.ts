/**
 * PHASE 4B: Single Package API
 * 
 * GET /api/partner/packages/[id] - Get package details
 * PATCH /api/partner/packages/[id] - Update package
 * DELETE /api/partner/packages/[id] - Archive package
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPackageById,
  updatePartnerPackage,
  archivePartnerPackage,
  calculatePackageMargin,
} from '@/lib/phase-4b/partner-packages'
import { hasPermission } from '@/lib/phase-4b/partner-staff'

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
    
    const pkg = await getPackageById(id)
    
    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }
    
    if (pkg.partnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      package: {
        ...pkg,
        margin: calculatePackageMargin(pkg),
      },
    })
  } catch (error) {
    console.error('Package GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch package' },
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
    
    if (!partnerUser || !hasPermission(partnerUser.role, 'canManagePackages')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage packages' },
        { status: 403 }
      )
    }
    
    // Verify package belongs to partner
    const existing = await getPackageById(id)
    if (!existing || existing.partnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Package not found or access denied' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    
    const result = await updatePartnerPackage(id, body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      package: result.package,
    })
  } catch (error) {
    console.error('Package update error:', error)
    return NextResponse.json(
      { error: 'Failed to update package' },
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
    
    if (!partnerUser || !hasPermission(partnerUser.role, 'canManagePackages')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage packages' },
        { status: 403 }
      )
    }
    
    // Verify package belongs to partner
    const existing = await getPackageById(id)
    if (!existing || existing.partnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Package not found or access denied' },
        { status: 404 }
      )
    }
    
    const result = await archivePartnerPackage(id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Package delete error:', error)
    return NextResponse.json(
      { error: 'Failed to archive package' },
      { status: 500 }
    )
  }
}
