export const dynamic = 'force-dynamic'

/**
 * Tenants API Route with Authorization Enforcement
 * 
 * This route implements role-based data scoping:
 * - SUPER_ADMIN: Can see ALL tenants
 * - Partner users: Can only see tenants referred by their partner
 * - Regular users: Can only see tenants they have membership in
 * 
 * This prevents cross-tenant data leaks by ensuring users only see
 * data they are authorized to access.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { CapabilityActivationService } from '@/lib/capabilities/activation-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { getSessionFromRequest } from '@/lib/auth'
import { 
  isSuperAdmin, 
  getPartnerUserInfo, 
  getUserTenantMemberships 
} from '@/lib/auth/authorization'

// GET /api/tenants - List tenants with role-based scoping
export async function GET(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK: Require valid session
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { user } = session
    let tenantIds: string[] | null = null

    // AUTHORIZATION: Determine which tenants user can access
    // Priority: SUPER_ADMIN > Partner > Regular User
    
    if (isSuperAdmin(user.globalRole)) {
      // SUPER_ADMIN: Return all tenants (no filter)
      tenantIds = null // null means no filter
    } else {
      // Check if user is a Partner member
      const partnerInfo = await getPartnerUserInfo(user.id)
      
      if (partnerInfo) {
        // Partner user: Get tenants referred by their partner
        const partnerReferrals = await prisma.partnerReferral.findMany({
          where: { partnerId: partnerInfo.partnerId },
          select: { tenantId: true }
        })
        
        // Also include tenants user has direct membership in
        const memberships = await getUserTenantMemberships(user.id)
        const membershipTenantIds = memberships.map(m => m.tenantId)
        const partnerTenantIds = partnerReferrals.map(r => r.tenantId)
        
        // Combine and deduplicate
        tenantIds = [...new Set([...partnerTenantIds, ...membershipTenantIds])]
      } else {
        // Regular user: Only tenants they have membership in
        const memberships = await getUserTenantMemberships(user.id)
        tenantIds = memberships.map(m => m.tenantId)
      }
    }

    // Build query with optional tenant ID filter
    const whereClause = tenantIds !== null 
      ? { id: { in: tenantIds } } 
      : {}

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      include: {
        domains: true,
        _count: {
          select: { memberships: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      tenants: tenants.map(t => ({
        ...t,
        _count: { users: t._count.memberships }
      }))
    })
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

// POST /api/tenants - Create a new tenant
export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION CHECK: Require valid session for tenant creation
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      customDomain,
      appName,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const normalizedSlug = slug.toLowerCase()

    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug }
    })
    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'This subdomain is already taken' },
        { status: 409 }
      )
    }

    const existingDomain = await prisma.tenantDomain.findUnique({
      where: { domain: normalizedSlug }
    })
    if (existingDomain) {
      return NextResponse.json(
        { success: false, error: 'This subdomain is already in use' },
        { status: 409 }
      )
    }

    if (customDomain) {
      const existingCustomDomain = await prisma.tenantDomain.findUnique({
        where: { domain: customDomain.toLowerCase() }
      })
      if (existingCustomDomain) {
        return NextResponse.json(
          { success: false, error: 'This custom domain is already in use' },
          { status: 409 }
        )
      }
    }

    const tenant = await prisma.tenant.create({
      data: withPrismaDefaults({
        name,
        slug: normalizedSlug,
        appName: appName || name,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor: primaryColor || '#6366f1',
        secondaryColor: secondaryColor || '#8b5cf6',
        domains: {
          create: [
            withPrismaDefaults({
              domain: normalizedSlug,
              type: 'SUBDOMAIN',
              status: 'VERIFIED',
              isPrimary: !customDomain,
              verifiedAt: new Date()
            }),
            ...(customDomain ? [withPrismaDefaults({
              domain: customDomain.toLowerCase(),
              type: 'CUSTOM' as const,
              status: 'PENDING' as const,
              isPrimary: true,
              verificationToken: uuidv4()
            })] : [])
          ]
        }
      }),
      include: {
        domains: true
      }
    })

    await CapabilityActivationService.initializeTenant(tenant.id)

    const response = {
      ...tenant,
      branding: {
        id: tenant.id,
        tenantId: tenant.id,
        appName: tenant.appName,
        logoUrl: tenant.logoUrl,
        faviconUrl: tenant.faviconUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor
      }
    }

    return NextResponse.json({
      success: true,
      tenant: response
    }, { status: 201 })

  } catch (error: any) {
    console.error('Failed to create tenant:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A tenant with this slug or domain already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
