import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession, switchTenant } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null
      })
    }
    
    // Check if user is a partner user
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: session.user.id },
      include: {
        Partner: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.avatarUrl,
        globalRole: session.user.globalRole,
        memberships: session.user.memberships.map(m => ({
          tenantId: m.tenantId,
          tenantName: m.tenant.name,
          tenantSlug: m.tenant.slug,
          role: m.role
        })),
        // Include partner info if user is a partner user
        isPartner: !!partnerUser,
        partner: partnerUser ? {
          id: partnerUser.partner.id,
          name: partnerUser.partner.name,
          slug: partnerUser.partner.slug,
          status: partnerUser.partner.status,
          role: partnerUser.role,
          department: partnerUser.department
        } : null
      },
      activeTenantId: session.activeTenantId
    })
    
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

// PATCH /api/auth/session - Switch active tenant
export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { tenantId } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Get session token from cookie to switch tenant
    const cookies = request.cookies
    const sessionToken = cookies.get('session_token')?.value
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No session token' },
        { status: 401 }
      )
    }
    
    const switched = await switchTenant(sessionToken, tenantId)
    
    if (!switched) {
      return NextResponse.json(
        { success: false, error: 'Cannot switch to this tenant' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      activeTenantId: tenantId
    })
    
  } catch (error) {
    console.error('Switch tenant error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to switch tenant' },
      { status: 500 }
    )
  }
}
