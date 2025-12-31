import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdminBySlug } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'
import { verifyAndUpdateDomain, getVerificationInfo, isDomainAvailable } from '@/lib/domains'
import { v4 as uuidv4 } from 'uuid'

type RouteParams = {
  params: Promise<{ slug: string }>
}

// GET /api/tenants/[slug]/domains - List tenant domains
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
    
    const domains = await prisma.tenantDomain.findMany({
      where: { tenantId: authResult.tenantId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
    })
    
    // Add verification info for pending domains
    const domainsWithInfo = domains.map(domain => {
      if (domain.type === 'CUSTOM' && domain.status === 'PENDING' && domain.verificationToken) {
        return {
          ...domain,
          verificationInfo: getVerificationInfo(domain.domain, domain.verificationToken)
        }
      }
      return domain
    })
    
    return NextResponse.json({
      success: true,
      domains: domainsWithInfo
    })
    
  } catch (error) {
    console.error('Failed to fetch domains:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}

// POST /api/tenants/[slug]/domains - Add a custom domain
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { domain } = body
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      )
    }
    
    const normalizedDomain = domain.toLowerCase().trim()
    
    // Validate domain format
    const domainRegex = /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,}$/
    if (!domainRegex.test(normalizedDomain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain format' },
        { status: 400 }
      )
    }
    
    // Check availability
    const available = await isDomainAvailable(normalizedDomain)
    if (!available) {
      return NextResponse.json(
        { success: false, error: 'Domain is already in use' },
        { status: 409 }
      )
    }
    
    const verificationToken = uuidv4()
    
    const newDomain = await prisma.tenantDomain.create({
      data: {
        id: uuidv4(),
        tenantId: authResult.tenantId,
        domain: normalizedDomain,
        type: 'CUSTOM',
        status: 'PENDING',
        isPrimary: false,
        verificationToken
      }
    })
    
    await createAuditLog({
      action: 'DOMAIN_ADDED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email,
      tenantId: authResult.tenantId,
      targetType: 'TenantDomain',
      targetId: newDomain.id,
      metadata: { domain: normalizedDomain, type: 'CUSTOM' }
    })
    
    return NextResponse.json({
      success: true,
      domain: {
        ...newDomain,
        verificationInfo: getVerificationInfo(normalizedDomain, verificationToken)
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Failed to add domain:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add domain' },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[slug]/domains?domainId=xxx - Remove a domain
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const authResult = await requireTenantAdminBySlug(slug)
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')
    
    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'domainId is required' },
        { status: 400 }
      )
    }
    
    const domain = await prisma.tenantDomain.findFirst({
      where: { id: domainId, tenantId: authResult.tenantId }
    })
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deleting the primary subdomain
    if (domain.type === 'SUBDOMAIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default subdomain' },
        { status: 400 }
      )
    }
    
    await prisma.tenantDomain.delete({
      where: { id: domainId }
    })
    
    await createAuditLog({
      action: 'DOMAIN_REMOVED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email,
      tenantId: authResult.tenantId,
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
