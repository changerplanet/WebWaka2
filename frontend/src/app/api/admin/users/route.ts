/**
 * Admin Users API
 * 
 * GET /api/admin/users - Get all users with filtering and pagination
 * 
 * Only accessible by SUPER_ADMIN users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const tenantId = searchParams.get('tenantId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.globalRole = role
    }

    if (tenantId) {
      where.memberships = {
        some: { tenantId }
      }
    }

    // Fetch users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          memberships: {
            include: {
              Tenant: {
                select: { id: true, name: true, slug: true, status: true }
              }
            }
          },
          partnerMembership: {
            include: {
              Partner: {
                select: { id: true, name: true, slug: true, status: true }
              }
            }
          },
          _count: {
            select: { sessions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.user.count({ where })
    ])

    // Format response - exclude sensitive data
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      globalRole: user.globalRole,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      activeSessions: user._count.sessions,
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
        role: user.partnerMembership.role,
        isActive: user.partnerMembership.isActive
      } : null
    }))

    // Get stats
    const [totalUsers, superAdmins, withTenants, withPartners] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { globalRole: 'SUPER_ADMIN' } }),
      prisma.user.count({ where: { memberships: { some: {} } } }),
      prisma.user.count({ where: { partnerMembership: { isNot: null } } })
    ])

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total,
      limit,
      offset,
      stats: {
        totalUsers,
        superAdmins,
        usersWithTenants: withTenants,
        usersWithPartners: withPartners
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
