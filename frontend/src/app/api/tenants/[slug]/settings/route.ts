import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdminBySlug } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'

type RouteParams = {
  params: Promise<{ slug: string }>
}

// GET /api/tenants/[slug]/settings - Get tenant settings
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        domains: { orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }] },
        _count: { select: { memberships: true } }
      }
    })
    
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant!.id,
        name: tenant!.name,
        slug: tenant!.slug,
        status: tenant!.status,
        branding: {
          appName: tenant!.appName,
          logoUrl: tenant!.logoUrl,
          faviconUrl: tenant!.faviconUrl,
          primaryColor: tenant!.primaryColor,
          secondaryColor: tenant!.secondaryColor
        },
        domains: tenant!.domains,
        memberCount: tenant!._count.memberships,
        createdAt: tenant!.createdAt,
        updatedAt: tenant!.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/tenants/[slug]/settings - Update tenant settings
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
        domains: { orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }] }
      }
    })
    
    await createAuditLog({
      action: 'TENANT_UPDATED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: tenant.id,
      targetType: 'Tenant',
      targetId: tenant.id,
      metadata: { updates: Object.keys(updateData) }
    })
    
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        branding: {
          appName: tenant.appName,
          logoUrl: tenant.logoUrl,
          faviconUrl: tenant.faviconUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor
        },
        domains: tenant.domains
      }
    })
    
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
