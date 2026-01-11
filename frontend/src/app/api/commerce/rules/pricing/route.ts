export const dynamic = 'force-dynamic'

/**
 * COMMERCE RULES ENGINE
 * Pricing Rules API
 * 
 * S4 - API Exposure
 * 
 * GET /api/commerce/rules/pricing - Get pricing rules info
 * POST /api/commerce/rules/pricing - Evaluate pricing for a product/customer
 * 
 * @module api/commerce/rules/pricing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'

/**
 * GET /api/commerce/rules/pricing
 * Get pricing rules configuration info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'commerce')
    if (guardResult) return guardResult

    return NextResponse.json({
      category: 'pricing',
      name: 'Pricing Rules',
      description: 'B2B wholesale pricing, tiers, quantity breaks',
      ruleTypes: [
        { type: 'FIXED', description: 'Fixed price override' },
        { type: 'PERCENTAGE', description: 'Percentage discount from base' },
        { type: 'TIER', description: 'Volume-based pricing tiers' }
      ],
      factors: [
        'Customer tier (wholesale, retail, VIP)',
        'Quantity ordered',
        'Product category',
        'Contract terms'
      ],
      example: {
        productId: 'prod-123',
        basePrice: 10000,
        tiers: [
          { minQty: 1, maxQty: 10, price: 10000 },
          { minQty: 11, maxQty: 50, price: 9500 },
          { minQty: 51, maxQty: null, price: 9000 }
        ]
      }
    })
  } catch (error) {
    console.error('[Rules API] Pricing GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/rules/pricing
 * Evaluate pricing for a product/customer
 * 
 * Body:
 * - productId: string (required)
 * - quantity: number (required)
 * - customerId?: string
 * - customerTier?: string
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'commerce')
    if (guardResult) return guardResult

    const body = await request.json()

    if (!body.productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    if (typeof body.quantity !== 'number' || body.quantity < 1) {
      return NextResponse.json(
        { error: 'quantity must be a positive number' },
        { status: 400 }
      )
    }

    // Demo pricing evaluation (actual would call B2BPricingService)
    const demoBasePrice = 10000
    let discount = 0
    let tierApplied = 'RETAIL'

    if (body.quantity >= 50) {
      discount = 10
      tierApplied = 'WHOLESALE_BULK'
    } else if (body.quantity >= 10) {
      discount = 5
      tierApplied = 'WHOLESALE'
    }

    const unitPrice = Math.round(demoBasePrice * (1 - discount / 100))
    const totalPrice = unitPrice * body.quantity

    return NextResponse.json({
      success: true,
      input: {
        productId: body.productId,
        quantity: body.quantity,
        customerId: body.customerId,
        customerTier: body.customerTier
      },
      result: {
        basePrice: demoBasePrice,
        unitPrice,
        totalPrice,
        discount: `${discount}%`,
        tierApplied,
        currency: 'NGN'
      }
    })
  } catch (error) {
    console.error('[Rules API] Pricing POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
