import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/admin/tenants/[id]/members - List tenant members
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    
    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            globalRole: true,
            isActive: true,
            lastLoginAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      members: memberships
    })
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tenants/[id]/members - Add a member to tenant
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    const body = await request.json()
    const { email, role = 'TENANT_USER' } = body
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Check tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: email.toLowerCase(),
          globalRole: 'USER'
        }
      })
    }
    
    // Check existing membership
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: id
        }
      }
    })
    
    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this tenant' },
        { status: 409 }
      )
    }
    
    // Create membership
    const membership = await prisma.tenantMembership.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        tenantId: id,
        role: role === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_USER'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    })
    
    await createAuditLog({
      action: 'USER_INVITED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: id,
      targetType: 'User',
      targetId: user.id,
      metadata: { email: email.toLowerCase(), role }
    })
    
    return NextResponse.json({
      success: true,
      membership
    }, { status: 201 })
    
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/tenants/[id]/members - Update member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    const body = await request.json()
    const { membershipId, role, isActive } = body
    
    if (!membershipId) {
      return NextResponse.json(
        { success: false, error: 'membershipId is required' },
        { status: 400 }
      )
    }
    
    const membership = await prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId: id },
      include: { user: true }
    })
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Membership not found' },
        { status: 404 }
      )
    }
    
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    
    const updated = await prisma.tenantMembership.update({
      where: { id: membershipId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
    
    await createAuditLog({
      action: 'USER_ROLE_CHANGED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: id,
      targetType: 'User',
      targetId: membership.userId,
      metadata: { 
        email: membership.user.email,
        oldRole: membership.role,
        newRole: role,
        oldActive: membership.isActive,
        newActive: isActive
      }
    })
    
    return NextResponse.json({
      success: true,
      membership: updated
    })
    
  } catch (error) {
    console.error('Failed to update member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tenants/[id]/members - Remove member from tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')
    
    if (!membershipId) {
      return NextResponse.json(
        { success: false, error: 'membershipId is required' },
        { status: 400 }
      )
    }
    
    const membership = await prisma.tenantMembership.findFirst({
      where: { id: membershipId, tenantId: id },
      include: { user: true }
    })
    
    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Membership not found' },
        { status: 404 }
      )
    }
    
    await prisma.tenantMembership.delete({
      where: { id: membershipId }
    })
    
    await createAuditLog({
      action: 'USER_REMOVED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: id,
      targetType: 'User',
      targetId: membership.userId,
      metadata: { email: membership.user.email, role: membership.role }
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
