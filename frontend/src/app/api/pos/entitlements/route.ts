export const dynamic = 'force-dynamic'

/**
 * POS Entitlements API
 * 
 * GET /api/pos/entitlements?tenantId=xxx - Get POS entitlements for tenant
 * 
 * This endpoint is called by the POS module to check what features
 * and limits are available for a tenant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPOSEntitlements } from '@/lib/pos-event-handlers'
import { checkCapabilityGuard } from '@/lib/capabilities'

export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const entitlements = await getPOSEntitlements(tenantId)

    if (!entitlements) {
      return NextResponse.json(
        { success: false, error: 'POS not enabled for this tenant' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...entitlements
    })
  } catch (error) {
    console.error('Error fetching POS entitlements:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
