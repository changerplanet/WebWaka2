/**
 * PHASE 4A: Partner Client Detail API
 * 
 * GET /api/partner/clients/[id] - Get client platform details
 * PATCH /api/partner/clients/[id] - Update client platform
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getClientPlatform, 
  updateClientBranding,
  resendClientInvitation 
} from '@/lib/partner-first/client-service'
import { requirePartnerUser } from '@/lib/partner-authorization'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const tenantId = params.id
    
    // Get client platform
    const platform = await getClientPlatform(partnerId, tenantId)
    
    if (!platform) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      platform,
    })
  } catch (error) {
    console.error('Failed to get client platform:', error)
    return NextResponse.json(
      { error: 'Failed to get client platform' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const tenantId = params.id
    const body = await request.json()
    
    // Handle different update types
    if (body.action === 'resend_invitation') {
      const result = await resendClientInvitation(partnerId, tenantId)
      return NextResponse.json(result)
    }
    
    // Default: update branding
    if (body.branding) {
      const result = await updateClientBranding(partnerId, tenantId, body.branding)
      return NextResponse.json(result)
    }
    
    return NextResponse.json(
      { error: 'No valid update action provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to update client platform:', error)
    return NextResponse.json(
      { error: 'Failed to update client platform' },
      { status: 500 }
    )
  }
}
