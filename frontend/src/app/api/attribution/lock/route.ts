export const dynamic = 'force-dynamic'

/**
 * Attribution Lock API (Internal)
 * 
 * POST /api/attribution/lock - Lock attribution after first billing
 * 
 * This endpoint is called by the subscription/billing system.
 * Once locked, attribution can NEVER be modified.
 */

import { NextRequest, NextResponse } from 'next/server'
import { lockAttribution, isAttributionLocked } from '@/lib/partner-attribution'
import { getCurrentSession } from '@/lib/auth'

// POST - Lock attribution
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    // This endpoint should only be called by:
    // 1. Super Admin
    // 2. Internal billing system (via API key in future)
    if (!session?.user || session.user.globalRole !== 'SUPER_ADMIN') {
      // Check for internal API key (placeholder for future implementation)
      const apiKey = request.headers.get('x-internal-api-key')
      if (apiKey !== process.env.INTERNAL_API_KEY) {
        return NextResponse.json(
          { error: 'Unauthorized. Super Admin or internal API access required.' },
          { status: 403 }
        )
      }
    }
    
    const body = await request.json()
    
    if (!body.tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    // Check if already locked
    const alreadyLocked = await isAttributionLocked(body.tenantId)
    if (alreadyLocked) {
      return NextResponse.json({
        message: 'Attribution is already locked',
        tenantId: body.tenantId,
        locked: true
      })
    }
    
    // Lock the attribution
    const result = await lockAttribution(body.tenantId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Attribution locked successfully',
      tenantId: body.tenantId,
      locked: true,
      lockedAt: result.referral!.lockedAt,
      partnerId: result.referral!.partnerId
    })
    
  } catch (error) {
    console.error('Error locking attribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
