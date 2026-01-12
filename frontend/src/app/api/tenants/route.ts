export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { CapabilityActivationService } from '@/lib/capabilities/activation-service'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// GET /api/tenants - List all tenants (Super Admin only in production)
export async function GET(request: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
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
        // Map _count to users for backwards compatibility
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

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const normalizedSlug = slug.toLowerCase()

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check for existing slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug }
    })
    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'This subdomain is already taken' },
        { status: 409 }
      )
    }

    // Check for existing domain
    const existingDomain = await prisma.tenantDomain.findUnique({
      where: { domain: normalizedSlug }
    })
    if (existingDomain) {
      return NextResponse.json(
        { success: false, error: 'This subdomain is already in use' },
        { status: 409 }
      )
    }

    // Check for existing custom domain if provided
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

    // Create tenant with domains in a transaction
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
            // Always create subdomain
            withPrismaDefaults({
              domain: normalizedSlug,
              type: 'SUBDOMAIN',
              status: 'VERIFIED', // Subdomains are auto-verified
              isPrimary: !customDomain, // Primary if no custom domain
              verifiedAt: new Date()
            }),
            // Optionally create custom domain
            ...(customDomain ? [withPrismaDefaults({
              domain: customDomain.toLowerCase(),
              type: 'CUSTOM' as const,
              status: 'PENDING' as const, // Custom domains need verification
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

    // Initialize tenant with zero active capabilities (log for audit)
    await CapabilityActivationService.initializeTenant(tenant.id)

    // Transform for backwards compatibility
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
    
    // Handle Prisma unique constraint errors
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
