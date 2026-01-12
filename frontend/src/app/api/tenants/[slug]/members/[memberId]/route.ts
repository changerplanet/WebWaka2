export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdminBySlug, requireTenantMemberBySlug } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'

type RouteParams = {
  params: Promise<{ slug: string; memberId: string }>
}

// PATCH /api/tenants/[slug]/members/[memberId] - Update member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, memberId } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    const { role, isActive } = body
    
    // Find the membership
    const membership = await prisma.tenantMembership.findFirst({
      where: { id: memberId, tenantId: authResult.tenantId },
      include: { user: true }
    })
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }
    
    // Prevent self-demotion if they're the only admin
    if (membership.userId === authResult.user.id && role === 'TENANT_USER') {
      const adminCount = await prisma.tenantMembership.count({
        where: {
          tenantId: authResult.tenantId,
          role: 'TENANT_ADMIN',
          isActive: true
        }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot demote the only admin. Promote another user first.' },
          { status: 400 }
        )
      }
    }
    
    const updateData: any = {}
    if (role !== undefined && ['TENANT_ADMIN', 'TENANT_USER'].includes(role)) {
      updateData.role = role
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }
    
    const updated = await prisma.tenantMembership.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            globalRole: true,
            lastLoginAt: true
          }
        }
      }
    })
    
    await createAuditLog({
      action: 'USER_ROLE_CHANGED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: authResult.tenantId,
      targetType: 'TenantMembership',
      targetId: memberId,
      metadata: {
        userId: membership.userId,
        email: membership.user.email,
        changes: updateData
      }
    })
    
    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        role: updated.role,
        isActive: updated.isActive,
        joinedAt: updated.joinedAt,
        user: updated.user
      }
    })
    
  } catch (error) {
    console.error('Failed to update member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[slug]/members/[memberId] - Remove member from tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, memberId } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    // Find the membership
    const membership = await prisma.tenantMembership.findFirst({
      where: { id: memberId, tenantId: authResult.tenantId },
      include: { user: true }
    })
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      )
    }
    
    // Prevent self-removal if they're the only admin
    if (membership.role === 'TENANT_ADMIN') {
      const adminCount = await prisma.tenantMembership.count({
        where: {
          tenantId: authResult.tenantId,
          role: 'TENANT_ADMIN',
          isActive: true
        }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot remove the only admin. Promote another user first.' },
          { status: 400 }
        )
      }
    }
    
    await prisma.tenantMembership.delete({
      where: { id: memberId }
    })
    
    await createAuditLog({
      action: 'USER_REMOVED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: authResult.tenantId,
      targetType: 'TenantMembership',
      targetId: memberId,
      metadata: {
        userId: membership.userId,
        email: membership.user.email
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
    
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
