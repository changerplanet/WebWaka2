/**
 * COMMERCE RULES ENGINE
 * Promotion Rules API
 * 
 * S4 - API Exposure
 * 
 * GET /api/commerce/rules/promotions - Get active promotions
 * POST /api/commerce/rules/promotions - Validate promo code
 * 
 * @module api/commerce/rules/promotions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { getActivePromotions, validatePromoCode } from '@/lib/rules'

/**
 * GET /api/commerce/rules/promotions
 * Get active promotions for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'commerce')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId

    try {
      const promotions = await getActivePromotions(tenantId)
      return NextResponse.json({
        category: 'promotions',
        name: 'Promotion Rules',
        description: 'Coupons, flash sales, buy-x-get-y, automatic discounts',
        activePromotions: promotions,
        promotionTypes: [
          'COUPON - Manual code entry',
          'AUTOMATIC - Auto-applied based on cart',
          'FLASH_SALE - Time-limited discount',
          'BUY_X_GET_Y - Quantity-based offers',
          'FREE_SHIPPING - Shipping discount'
        ]
      })
    } catch {
      // Return info if promotions service not fully configured
      return NextResponse.json({
        category: 'promotions',
        name: 'Promotion Rules',
        description: 'Coupons, flash sales, buy-x-get-y, automatic discounts',
        activePromotions: [],
        promotionTypes: [
          'COUPON - Manual code entry',
          'AUTOMATIC - Auto-applied based on cart',
          'FLASH_SALE - Time-limited discount',
          'BUY_X_GET_Y - Quantity-based offers',
          'FREE_SHIPPING - Shipping discount'
        ]
      })
    }
  } catch (error) {
    console.error('[Rules API] Promotions GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/rules/promotions
 * Validate a promo code
 * 
 * Body:
 * - code: string (required)
 * - cartTotal?: number
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'commerce')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      )
    }

    try {
      const validation = await validatePromoCode(tenantId, body.code, body.cartTotal || 0)
      return NextResponse.json({
        success: true,
        code: body.code,
        validation
      })
    } catch (err) {
      return NextResponse.json({
        success: false,
        code: body.code,
        error: err instanceof Error ? err.message : 'Invalid promo code'
      })
    }
  } catch (error) {
    console.error('[Rules API] Promotions POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
