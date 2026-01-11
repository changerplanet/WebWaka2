export const dynamic = 'force-dynamic'

/**
 * MVM Entitlements API
 * 
 * Returns entitlements for the MVM module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMVMEntitlements } from '@/lib/mvm-event-handlers'
import { checkCapabilityGuard } from '@/lib/capabilities'

export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const entitlements = await getMVMEntitlements(tenantId)
    
    return NextResponse.json(entitlements)
  } catch (error) {
    console.error('[MVM Entitlements API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
