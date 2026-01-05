import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdminBySlug } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'
import { verifyAndUpdateDomain } from '@/lib/domains'

type RouteParams = {
  params: Promise<{ slug: string; domainId: string }>
}

// POST /api/tenants/[slug]/domains/[domainId]/verify - Verify a custom domain
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, domainId } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    // Check domain belongs to tenant
    const domain = await prisma.tenantDomain.findFirst({
      where: { id: domainId, tenantId: authResult.tenantId }
    })
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    const result = await verifyAndUpdateDomain(domainId)
    
    if (result.success) {
      await createAuditLog({
        action: 'DOMAIN_VERIFIED',
        actorId: authResult.user.id,
        actorEmail: authResult.user.email || 'unknown',
        tenantId: authResult.tenantId,
        targetType: 'TenantDomain',
        targetId: domainId,
        metadata: { domain: domain.domain }
      })
      
      return NextResponse.json({
        success: true,
        domain: result.domain,
        message: 'Domain verified successfully!'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 400 })
    
  } catch (error) {
    console.error('Failed to verify domain:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}

// PATCH /api/tenants/[slug]/domains/[domainId] - Update domain (e.g., set as primary)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, domainId } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    const { isPrimary } = body
    
    // Check domain belongs to tenant and is verified
    const domain = await prisma.tenantDomain.findFirst({
      where: { id: domainId, tenantId: authResult.tenantId }
    })
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    // Only allow setting verified domains as primary
    if (isPrimary && domain.status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Only verified domains can be set as primary' },
        { status: 400 }
      )
    }
    
    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.tenantDomain.updateMany({
        where: { tenantId: authResult.tenantId, isPrimary: true },
        data: { isPrimary: false }
      })
    }
    
    const updated = await prisma.tenantDomain.update({
      where: { id: domainId },
      data: { isPrimary }
    })
    
    return NextResponse.json({
      success: true,
      domain: updated
    })
    
  } catch (error) {
    console.error('Failed to update domain:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update domain' },
      { status: 500 }
    )
  }
}
