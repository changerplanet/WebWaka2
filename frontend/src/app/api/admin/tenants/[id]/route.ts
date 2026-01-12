export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'
import { TenantStatus } from '@prisma/client'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/admin/tenants/[id] - Get tenant details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        domains: true,
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                globalRole: true,
                lastLoginAt: true
              }
            }
          }
        },
        entitlements: {
          select: {
            module: true,
            status: true,
            validUntil: true
          }
        },
        platformInstances: {
          select: {
            id: true,
            name: true,
            slug: true,
            isDefault: true,
            suiteKeys: true
          }
        },
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

// PATCH /api/admin/tenants/[id] - Update tenant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    })
    
    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Extract allowed fields
    const { name, appName, logoUrl, faviconUrl, primaryColor, secondaryColor, status } = body
    
    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (appName !== undefined) updateData.appName = appName
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor
    
    // Handle status change with audit logging
    if (status !== undefined && status !== existingTenant.status) {
      updateData.status = status
      
      let auditAction: 'TENANT_SUSPENDED' | 'TENANT_ACTIVATED' | 'TENANT_DEACTIVATED' | 'TENANT_UPDATED'
      switch (status) {
        case 'SUSPENDED':
          auditAction = 'TENANT_SUSPENDED'
          break
        case 'ACTIVE':
          auditAction = 'TENANT_ACTIVATED'
          break
        case 'DEACTIVATED':
          auditAction = 'TENANT_DEACTIVATED'
          break
        default:
          auditAction = 'TENANT_UPDATED'
      }
      
      await createAuditLog({
        action: auditAction,
        actorId: authResult.user.id,
        actorEmail: authResult.user.email || 'unknown',
        targetType: 'Tenant',
        targetId: id,
        metadata: { oldStatus: existingTenant.status, newStatus: status }
      })
    } else if (Object.keys(updateData).length > 0) {
      await createAuditLog({
        action: 'TENANT_UPDATED',
        actorId: authResult.user.id,
        actorEmail: authResult.user.email || 'unknown',
        targetType: 'Tenant',
        targetId: id,
        metadata: updateData
      })
    }
    
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
      include: {
        domains: true
      }
    })
    
    return NextResponse.json({
      success: true,
      tenant
    })
  } catch (error) {
    console.error('Failed to update tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tenants/[id] - Deactivate tenant (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { id } = await params
    
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Soft delete - set to DEACTIVATED
    await prisma.tenant.update({
      where: { id },
      data: { status: 'DEACTIVATED' }
    })
    
    await createAuditLog({
      action: 'TENANT_DEACTIVATED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      targetType: 'Tenant',
      targetId: id,
      metadata: { name: tenant.name, slug: tenant.slug }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tenant deactivated successfully'
    })
  } catch (error) {
    console.error('Failed to deactivate tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate tenant' },
      { status: 500 }
    )
  }
}
