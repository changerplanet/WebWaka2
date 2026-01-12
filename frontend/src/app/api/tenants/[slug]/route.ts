export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantMemberBySlug, requireTenantAdminBySlug } from '@/lib/authorization'

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
        domains: true,
        _count: {
          select: { memberships: true }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Return with branding embedded in response for backwards compatibility
    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        branding: {
          appName: tenant.appName,
          logoUrl: tenant.logoUrl,
          faviconUrl: tenant.faviconUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor
        },
        _count: { users: tenant._count.memberships }
      }
    })
  } catch (error) {
    console.error('Failed to fetch tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

// PATCH /api/tenants/[slug] - Update tenant (requires Tenant Admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()

    // Extract fields
    const { name, appName, logoUrl, faviconUrl, primaryColor, secondaryColor } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (appName !== undefined) updateData.appName = appName
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor

    const tenant = await prisma.tenant.update({
      where: { slug },
      data: updateData,
      include: {
        domains: true,
        _count: {
          select: { memberships: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        branding: {
          appName: tenant.appName,
          logoUrl: tenant.logoUrl,
          faviconUrl: tenant.faviconUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor
        },
        _count: { users: tenant._count.memberships }
      }
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

// DELETE /api/tenants/[slug] - Delete tenant (requires Super Admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // For now, only allow deletion without auth check for testing
    // In production, this should require Super Admin
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
