export const dynamic = 'force-dynamic'

/**
 * COMMERCE RULES ENGINE
 * Main API Route
 * 
 * S4 - API Exposure
 * 
 * GET /api/commerce/rules - Get all rule categories and summary
 * 
 * @module api/commerce/rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { RULE_CATEGORIES } from '@/lib/rules'

/**
 * GET /api/commerce/rules
 * Get rule categories and summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard - rules requires commerce capability
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'commerce')
    if (guardResult) return guardResult

    return NextResponse.json({
      suite: 'commerce-rules',
      version: '1.0.0',
      status: 'active',
      categories: Object.values(RULE_CATEGORIES),
      endpoints: {
        commission: '/api/commerce/rules/commission',
        pricing: '/api/commerce/rules/pricing',
        promotions: '/api/commerce/rules/promotions',
        inventory: '/api/commerce/rules/inventory',
        discounts: '/api/commerce/rules/discounts'
      },
      documentation: '/commerce-rules-demo'
    })
  } catch (error) {
    console.error('[Rules API] Get categories error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
