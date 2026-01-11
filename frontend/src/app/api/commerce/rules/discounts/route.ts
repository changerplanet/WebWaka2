export const dynamic = 'force-dynamic'

/**
 * COMMERCE RULES ENGINE
 * Discount Rules API
 * 
 * S4 - API Exposure
 * 
 * GET /api/commerce/rules/discounts - Get discount rules info
 * POST /api/commerce/rules/discounts - Validate discount code
 * 
 * @module api/commerce/rules/discounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'

/**
 * GET /api/commerce/rules/discounts
 * Get discount rules configuration info
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
      category: 'discounts',
      name: 'Discount Rules',
      description: 'Billing-side discounts, promo codes',
      discountTypes: [
        { type: 'PERCENTAGE', description: 'Percentage off order total' },
        { type: 'FIXED_AMOUNT', description: 'Fixed naira amount off' }
      ],
      constraints: [
        'maxUses - Total usage limit',
        'maxUsesPerTenant - Per-customer limit',
        'validFrom/validTo - Date range',
        'minOrderValue - Minimum cart value',
        'firstTimeOnly - New customers only',
        'planIds - Specific subscription plans',
        'moduleIds - Specific product categories'
      ],
      example: {
        name: 'New Customer 20% Off',
        code: 'WELCOME20',
        discountType: 'PERCENTAGE',
        value: 20,
        minOrderValue: 50000,
        firstTimeOnly: true,
        validTo: '2025-12-31'
      }
    })
  } catch (error) {
    console.error('[Rules API] Discounts GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/rules/discounts
 * Validate and preview discount application
 * 
 * Body:
 * - code: string (required)
 * - orderTotal: number (required)
 * - isFirstOrder?: boolean
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

    if (!body.code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      )
    }

    if (typeof body.orderTotal !== 'number' || body.orderTotal <= 0) {
      return NextResponse.json(
        { error: 'orderTotal must be a positive number' },
        { status: 400 }
      )
    }

    // Demo discount validation
    const demoDiscounts: Record<string, { type: string; value: number; minOrder: number; firstTimeOnly: boolean }> = {
      'WELCOME20': { type: 'PERCENTAGE', value: 20, minOrder: 50000, firstTimeOnly: true },
      'SAVE5000': { type: 'FIXED_AMOUNT', value: 5000, minOrder: 25000, firstTimeOnly: false },
      'VIP10': { type: 'PERCENTAGE', value: 10, minOrder: 0, firstTimeOnly: false }
    }

    const discount = demoDiscounts[body.code.toUpperCase()]

    if (!discount) {
      return NextResponse.json({
        success: false,
        code: body.code,
        valid: false,
        error: 'Invalid discount code'
      })
    }

    if (body.orderTotal < discount.minOrder) {
      return NextResponse.json({
        success: false,
        code: body.code,
        valid: false,
        error: `Minimum order value of ₦${discount.minOrder.toLocaleString()} required`
      })
    }

    if (discount.firstTimeOnly && body.isFirstOrder === false) {
      return NextResponse.json({
        success: false,
        code: body.code,
        valid: false,
        error: 'This code is for first-time customers only'
      })
    }

    const discountAmount = discount.type === 'PERCENTAGE'
      ? Math.round(body.orderTotal * discount.value / 100)
      : discount.value

    const finalTotal = body.orderTotal - discountAmount

    return NextResponse.json({
      success: true,
      code: body.code,
      valid: true,
      input: {
        orderTotal: body.orderTotal,
        isFirstOrder: body.isFirstOrder
      },
      result: {
        discountType: discount.type,
        discountValue: discount.type === 'PERCENTAGE' ? `${discount.value}%` : `₦${discount.value.toLocaleString()}`,
        discountAmount,
        finalTotal,
        savings: `₦${discountAmount.toLocaleString()}`
      }
    })
  } catch (error) {
    console.error('[Rules API] Discounts POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
