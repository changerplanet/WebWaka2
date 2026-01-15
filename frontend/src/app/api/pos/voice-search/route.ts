/**
 * POS Voice Search API (Wave G4)
 * 
 * POST /api/pos/voice-search - Search products by voice query
 * 
 * Constraints:
 * - Product lookup only (no commands)
 * - No auto-add-to-cart
 * - No payments via voice
 * - Tenant-isolated via session.activeTenantId
 * 
 * Security: Session validation enforced - activeTenantId required for non-demo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import {
  searchProductsByVoice,
  generateDemoVoiceSearchResult
} from '@/lib/pos/voice-search-service'

const DEMO_TENANT_ID = 'demo-tenant-001'

function getTenantIdFromSession(session: { activeTenantId?: string | null } | null): string | null {
  return session?.activeTenantId ?? null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const body = await request.json()
    const { tenantId, query, config } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required and must be a string' },
        { status: 400 }
      )
    }
    
    const isDemo = tenantId === DEMO_TENANT_ID
    
    if (isDemo) {
      const demoResult = generateDemoVoiceSearchResult(query)
      return NextResponse.json({
        success: true,
        ...demoResult
      })
    }
    
    if (!activeTenantId) {
      return NextResponse.json(
        { error: 'Authentication required - no active tenant in session' },
        { status: 401 }
      )
    }
    
    if (activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const result = await searchProductsByVoice(activeTenantId, query, config)
    
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('[VoiceSearch API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice search' },
      { status: 500 }
    )
  }
}
