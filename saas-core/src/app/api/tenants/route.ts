import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET /api/tenants - List all tenants (Super Admin only in production)
export async function GET(request: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        branding: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      tenants
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

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check for existing slug
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug }
    })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: 'This subdomain is already taken' },
        { status: 409 }
      )
    }

    // Check for existing custom domain if provided
    if (customDomain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { customDomain }
      })
      if (existingDomain) {
        return NextResponse.json(
          { success: false, error: 'This custom domain is already in use' },
          { status: 409 }
        )
      }
    }

    // Create tenant with branding in a transaction
    const tenantId = uuidv4()
    const brandingId = uuidv4()

    const tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name,
        slug,
        customDomain: customDomain || null,
        branding: {
          create: {
            id: brandingId,
            appName: appName || name,
            logoUrl: logoUrl || null,
            faviconUrl: faviconUrl || null,
            primaryColor: primaryColor || '#6366f1',
            secondaryColor: secondaryColor || '#8b5cf6'
          }
        }
      },
      include: {
        branding: true
      }
    })

    return NextResponse.json({
      success: true,
      tenant
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
