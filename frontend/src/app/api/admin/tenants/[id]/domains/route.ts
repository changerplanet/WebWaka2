export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/admin/tenants/[id]/domains - List tenant domains
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
    
    const domains = await prisma.tenantDomain.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      domains
    })
  } catch (error) {
    console.error('Failed to fetch domains:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tenants/[id]/domains - Add a domain to tenant
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { domain, type, isPrimary } = body
    
    if (!domain || !type) {
      return NextResponse.json(
        { success: false, error: 'Domain and type are required' },
        { status: 400 }
      )
    }
    
    // Validate domain format
    const normalizedDomain = domain.toLowerCase().trim()
    
    if (type === 'SUBDOMAIN' && !/^[a-z0-9-]+$/.test(normalizedDomain)) {
      return NextResponse.json(
        { success: false, error: 'Subdomain must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }
    
    // Check if domain already exists
    const existingDomain = await prisma.tenantDomain.findUnique({
      where: { domain: normalizedDomain }
    })
    
    if (existingDomain) {
      return NextResponse.json(
        { success: false, error: 'Domain is already in use' },
        { status: 409 }
      )
    }
    
    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.tenantDomain.updateMany({
        where: { tenantId: id, isPrimary: true },
        data: { isPrimary: false }
      })
    }
    
    // Create domain
    const tenantDomain = await prisma.tenantDomain.create({
      data: {
        id: uuidv4(),
        tenantId: id,
        domain: normalizedDomain,
        type: type,
        status: type === 'SUBDOMAIN' ? 'VERIFIED' : 'PENDING',
        isPrimary: isPrimary || false,
        verificationToken: type === 'CUSTOM' ? uuidv4() : null,
        verifiedAt: type === 'SUBDOMAIN' ? new Date() : null
      } as any
    })
    
    await createAuditLog({
      action: 'DOMAIN_ADDED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: id,
      targetType: 'TenantDomain',
      targetId: tenantDomain.id,
      metadata: { domain: normalizedDomain, type }
    })
    
    return NextResponse.json({
      success: true,
      domain: tenantDomain
    }, { status: 201 })
    
  } catch (error) {
    console.error('Failed to add domain:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add domain' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tenants/[id]/domains - Remove a domain
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
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')
    
    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'domainId is required' },
        { status: 400 }
      )
    }
    
    const domain = await prisma.tenantDomain.findFirst({
      where: { id: domainId, tenantId: id }
    })
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deleting the last domain
    const domainCount = await prisma.tenantDomain.count({
      where: { tenantId: id }
    })
    
    if (domainCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last domain' },
        { status: 400 }
      )
    }
    
    await prisma.tenantDomain.delete({
      where: { id: domainId }
    })
    
    await createAuditLog({
      action: 'DOMAIN_REMOVED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      tenantId: id,
      targetType: 'TenantDomain',
      targetId: domainId,
      metadata: { domain: domain.domain, type: domain.type }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Domain removed successfully'
    })
    
  } catch (error) {
    console.error('Failed to remove domain:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove domain' },
      { status: 500 }
    )
  }
}
