import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession, isSuperAdmin } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

type RouteParams = {
  params: Promise<{ slug: string }>
}

// GET /api/tenants/[slug]/members - List tenant members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const session = await getCurrentSession()
    
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Authorization: Must be Super Admin or Tenant Admin
    if (session) {
      const isTenantAdmin = session.user.memberships.some(
        m => m.tenantId === tenant.id && m.role === 'TENANT_ADMIN'
      )
      
      if (!isSuperAdmin(session.user) && !isTenantAdmin) {
        return NextResponse.json(
          { success: false, error: 'Not authorized' },
          { status: 403 }
        )
      }
    }
    
    // Get members
    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId: tenant.id },
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
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      members: memberships.map(m => ({
        id: m.id,
        role: m.role,
        isActive: m.isActive,
        joinedAt: m.joinedAt,
        user: m.user
      }))
    })
    
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST /api/tenants/[slug]/members - Add a member to tenant
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const session = await getCurrentSession()
    const body = await request.json()
    const { email, role = 'TENANT_USER' } = body
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Authorization check (skip for now in MVP - in production, require auth)
    // For MVP, allow adding members without auth for testing
    
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
    
    // Check if already a member
    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id
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
        tenantId: tenant.id,
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
    
    return NextResponse.json({
      success: true,
      membership: {
        id: membership.id,
        role: membership.role,
        isActive: membership.isActive,
        joinedAt: membership.joinedAt,
        user: membership.user
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    )
  }
}
