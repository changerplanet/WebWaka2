import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/authorization'
import { createAuditLog } from '@/lib/audit'
import { v4 as uuidv4 } from 'uuid'
import { CapabilityActivationService } from '@/lib/capabilities/activation-service'

// GET /api/admin/tenants - List all tenants (Super Admin only)
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          domains: true,
          _count: {
            select: { memberships: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.tenant.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      tenants,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Failed to fetch tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tenants - Create a new tenant (Super Admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }
  
  try {
    const body = await request.json()
    const {
      name,
      slug,
      appName,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      adminEmail // Optional: create initial admin
    } = body
    
    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }
    
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    
    // Check for existing slug
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug }
    })
    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Slug is already taken' },
        { status: 409 }
      )
    }
    
    // Create tenant with subdomain
    const tenantId = uuidv4()
    const tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name,
        slug: normalizedSlug,
        appName: appName || name,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor: primaryColor || '#6366f1',
        secondaryColor: secondaryColor || '#8b5cf6',
        domains: {
          create: {
            id: uuidv4(),
            domain: normalizedSlug,
            type: 'SUBDOMAIN',
            status: 'VERIFIED',
            isPrimary: true,
            verifiedAt: new Date()
          } as any
        }
      } as any,
      include: {
        domains: true
      }
    })
    
    // Create initial admin if email provided
    if (adminEmail) {
      let user = await prisma.user.findUnique({
        where: { email: adminEmail.toLowerCase() }
      })
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: uuidv4(),
            email: adminEmail.toLowerCase(),
            globalRole: 'USER'
          } as any
        })
      }
      
      await prisma.tenantMembership.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          tenantId: tenant.id,
          role: 'TENANT_ADMIN'
        } as any
      })
    }
    
    // Audit log
    await createAuditLog({
      action: 'TENANT_CREATED',
      actorId: authResult.user.id,
      actorEmail: authResult.user.email || 'unknown',
      targetType: 'Tenant',
      targetId: tenant.id,
      metadata: { name, slug: normalizedSlug, adminEmail }
    })
    
    // Initialize tenant with zero active capabilities (log for audit)
    await CapabilityActivationService.initializeTenant(tenant.id)
    
    return NextResponse.json({
      success: true,
      tenant
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Failed to create tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
