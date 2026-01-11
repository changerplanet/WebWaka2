export const dynamic = 'force-dynamic'

/**
 * Partner Tenants API
 * 
 * POST /api/partners/[partnerId]/tenants - Create tenant in PENDING state
 * GET /api/partners/[partnerId]/tenants - List tenants created by partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createTenantByPartner, 
  getTenantsByPartner,
  AVAILABLE_MODULES 
} from '@/lib/partner-tenant-creation'
import { requirePartnerAccess } from '@/lib/partner-authorization'

// POST - Create tenant in PENDING_ACTIVATION state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.slug || !body.contactEmail) {
      return NextResponse.json(
        { error: 'name, slug, and contactEmail are required' },
        { status: 400 }
      )
    }
    
    if (!body.requestedModules || !Array.isArray(body.requestedModules) || body.requestedModules.length === 0) {
      return NextResponse.json(
        { error: `requestedModules is required. Available: ${AVAILABLE_MODULES.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Create tenant
    const result = await createTenantByPartner(partnerId, {
      name: body.name,
      slug: body.slug,
      contactEmail: body.contactEmail,
      contactName: body.contactName,
      requestedModules: body.requestedModules,
      branding: body.branding,
      attributionWindowDays: body.attributionWindowDays,
      metadata: body.metadata
    })
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        'UNAUTHORIZED': 403,
        'INVALID_INPUT': 400,
        'SLUG_EXISTS': 409,
        'PARTNER_INACTIVE': 403,
        'MODULE_INVALID': 400
      }
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusMap[result.code || ''] || 500 }
      )
    }
    
    return NextResponse.json({
      tenant: {
        id: result.tenant!.id,
        name: result.tenant!.name,
        slug: result.tenant!.slug,
        status: result.tenant!.status,
        requestedModules: result.tenant!.requestedModules,
        createdAt: result.tenant!.createdAt
      },
      attribution: {
        id: result.referral!.id,
        method: result.referral!.attributionMethod,
        attributionWindowDays: result.referral!.attributionWindowDays,
        isLifetime: !result.referral!.attributionWindowDays
      },
      invitationUrl: result.invitationUrl
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List tenants created by partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params
    
    // Verify partner access
    const authResult = await requirePartnerAccess(partnerId)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')?.split(',').filter(Boolean)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const result = await getTenantsByPartner(partnerId, {
      status: status as any,
      limit,
      offset
    })
    
    return NextResponse.json({
      tenants: result.tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        requestedModules: t.requestedModules,
        activatedModules: t.activatedModules,
        activatedAt: t.activatedAt,
        createdAt: t.createdAt
      })),
      total: result.total,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Error listing tenants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
