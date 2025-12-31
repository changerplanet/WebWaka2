import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{ slug: string }>
}

// GET /api/tenants/[slug] - Get tenant by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        branding: true,
        _count: {
          select: { users: true }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tenant
    })
  } catch (error) {
    console.error('Failed to fetch tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

// PATCH /api/tenants/[slug] - Update tenant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Find existing tenant
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { branding: true }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Extract branding fields
    const { appName, logoUrl, faviconUrl, primaryColor, secondaryColor, ...tenantFields } = body

    // Update tenant and branding
    const tenant = await prisma.tenant.update({
      where: { slug },
      data: {
        ...tenantFields,
        branding: existingTenant.branding ? {
          update: {
            ...(appName !== undefined && { appName }),
            ...(logoUrl !== undefined && { logoUrl }),
            ...(faviconUrl !== undefined && { faviconUrl }),
            ...(primaryColor !== undefined && { primaryColor }),
            ...(secondaryColor !== undefined && { secondaryColor })
          }
        } : {
          create: {
            appName: appName || existingTenant.name,
            logoUrl: logoUrl || null,
            faviconUrl: faviconUrl || null,
            primaryColor: primaryColor || '#6366f1',
            secondaryColor: secondaryColor || '#8b5cf6'
          }
        }
      },
      include: {
        branding: true,
        _count: {
          select: { users: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      tenant
    })
  } catch (error: any) {
    console.error('Failed to update tenant:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A tenant with this slug or domain already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[slug] - Delete tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    await prisma.tenant.delete({
      where: { slug }
    })

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}
