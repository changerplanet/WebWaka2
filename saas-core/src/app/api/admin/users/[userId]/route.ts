/**
 * Admin User Detail API
 * 
 * GET /api/admin/users/[userId] - Get user details
 * PATCH /api/admin/users/[userId] - Update user (role, name)
 * 
 * Only accessible by SUPER_ADMIN users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Super Admin access required' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            tenant: {
              select: { id: true, name: true, slug: true, status: true }
            }
          }
        },
        partnerMembership: {
          include: {
            partner: {
              select: { id: true, name: true, slug: true, status: true, tier: true }
            }
          }
        },
        sessions: {
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { sessions: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        globalRole: user.globalRole,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        totalSessions: user._count.sessions,
        recentSessions: user.sessions.map(s => ({
          id: s.id,
          createdAt: s.createdAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          ipAddress: s.ipAddress,
          userAgent: s.userAgent
        })),
        memberships: user.memberships.map(m => ({
          id: m.id,
          tenantId: m.tenantId,
          tenantName: m.tenant.name,
          tenantSlug: m.tenant.slug,
          tenantStatus: m.tenant.status,
          role: m.role,
          createdAt: m.createdAt.toISOString()
        })),
        partnerMembership: user.partnerMembership ? {
          partnerId: user.partnerMembership.partnerId,
          partnerName: user.partnerMembership.partner.name,
          partnerSlug: user.partnerMembership.partner.slug,
          partnerTier: user.partnerMembership.partner.tier,
          role: user.partnerMembership.role,
          isActive: user.partnerMembership.isActive
        } : null
      }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Super Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { globalRole, name } = body

    // Validate role if provided
    if (globalRole && !['USER', 'SUPER_ADMIN'].includes(globalRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be USER or SUPER_ADMIN' },
        { status: 400 }
      )
    }

    // Prevent demoting yourself
    if (userId === session.user.id && globalRole === 'USER') {
      return NextResponse.json(
        { success: false, error: 'Cannot demote yourself' },
        { status: 400 }
      )
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (globalRole !== undefined) updateData.globalRole = globalRole
    if (name !== undefined) updateData.name = name

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        globalRole: true
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: globalRole ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
        actorId: session.user.id,
        actorEmail: session.user.email,
        targetType: 'User',
        targetId: userId,
        metadata: {
          previousRole: existingUser.globalRole,
          newRole: globalRole || existingUser.globalRole,
          changes: updateData
        }
      }
    })

    return NextResponse.json({
      success: true,
      user,
      message: globalRole 
        ? `User role changed to ${globalRole}`
        : 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
