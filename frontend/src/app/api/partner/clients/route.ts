export const dynamic = 'force-dynamic'

/**
 * PHASE 4A: Partner Clients API
 * 
 * GET /api/partner/clients - List partner's client platforms
 * POST /api/partner/clients - Create new client platform
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createClientPlatform, 
  getClientPlatforms,
  CreateClientPlatformInput 
} from '@/lib/partner-first/client-service'
import { requirePartnerUser } from '@/lib/partner-authorization'

export async function GET(request: NextRequest) {
  try {
    // Verify partner access
    const authResult = await requirePartnerUser()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const partnerId = authResult.partner.id
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')?.split(',') as any
    const search = searchParams.get('search') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Get client platforms
    const result = await getClientPlatforms(partnerId, {
      status,
      search,
      limit,
      offset,
    })
    
    return NextResponse.json({
      success: true,
      platforms: result.platforms,
      total: result.total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to get client platforms:', error)
    return NextResponse.json(
      { error: 'Failed to get client platforms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify partner access
    const authResult = await requirePartnerUser()
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const partnerId = authResult.partner.id
    
    // Parse body
    const body = await request.json()
    const input: CreateClientPlatformInput = {
      name: body.name,
      slug: body.slug,
      adminEmail: body.adminEmail,
      adminName: body.adminName,
      adminPhone: body.adminPhone,
      branding: body.branding,
      customDomain: body.customDomain,
      requestedCapabilities: body.requestedCapabilities,
      notes: body.notes,
    }
    
    // Create client platform
    const result = await createClientPlatform(partnerId, input)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      tenant: result.tenant,
      instance: result.instance,
      domain: result.domain,
      invitationUrl: result.invitationUrl,
    })
  } catch (error) {
    console.error('Failed to create client platform:', error)
    return NextResponse.json(
      { error: 'Failed to create client platform' },
      { status: 500 }
    )
  }
}
