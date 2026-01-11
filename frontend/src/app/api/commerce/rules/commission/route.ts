/**
 * COMMERCE RULES ENGINE
 * Commission Rules API
 * 
 * S4 - API Exposure
 * 
 * GET /api/commerce/rules/commission - Get commission rules info
 * POST /api/commerce/rules/commission - Preview commission calculation
 * 
 * @module api/commerce/rules/commission
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { calculateCommission, COMMISSION_EXAMPLES } from '@/lib/rules'

/**
 * GET /api/commerce/rules/commission
 * Get commission rules configuration info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'commerce')
    if (guardResult) return guardResult

    // Return available commission models
    return NextResponse.json({
      category: 'commission',
      name: 'Commission Rules',
      description: 'Partner commission calculation (percentage, fixed, tiered, hybrid)',
      supportedTypes: ['PERCENTAGE', 'FIXED', 'TIERED', 'HYBRID'],
      tierTypes: ['VOLUME', 'REVENUE'],
      examples: COMMISSION_EXAMPLES,
      example: {
        type: 'TIERED',
        tiers: [
          { min: 0, max: 100000, rate: 5 },
          { min: 100000, max: 500000, rate: 7.5 },
          { min: 500000, max: null, rate: 10 }
        ]
      }
    })
  } catch (error) {
    console.error('[Rules API] Commission GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/rules/commission
 * Preview commission calculation
 * 
 * Body:
 * - amount: number (required) - Transaction amount
 * - rule: CommissionRule (required) - Rule to apply
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

    if (typeof body.amount !== 'number' || body.amount < 0) {
      return NextResponse.json(
        { error: 'amount must be a non-negative number' },
        { status: 400 }
      )
    }

    if (!body.rule) {
      return NextResponse.json(
        { error: 'rule configuration is required' },
        { status: 400 }
      )
    }

    // Build agreement config from rule
    const agreement = {
      id: 'preview',
      partnerId: 'preview',
      commissionType: body.rule.type || 'PERCENTAGE',
      commissionTrigger: body.rule.trigger || 'ON_PAYMENT',
      commissionRate: body.rule.rate ? body.rule.rate / 100 : 0,
      fixedAmount: body.rule.fixedAmount || 0,
      setupFee: body.rule.setupFee || 0,
      tiers: body.rule.tiers || [],
      clearanceDays: body.rule.clearanceDays || 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Build calculation input
    const input = {
      grossAmount: body.amount,
      netAmount: body.amount,
      currency: body.currency || 'USD',
      eventType: body.eventType || 'SUBSCRIPTION_RENEWED',
      isFirstPayment: body.isFirstPayment || false,
      periodStart: new Date(),
      periodEnd: new Date()
    }

    // Calculate commission using the actual function
    const result = calculateCommission(agreement as unknown as Parameters<typeof calculateCommission>[0], input as unknown as Parameters<typeof calculateCommission>[1])

    return NextResponse.json({
      success: result.success,
      input: {
        amount: body.amount,
        rule: body.rule
      },
      result: {
        commission: result.commissionAmount,
        currency: result.currency,
        effectiveRate: body.amount > 0 ? (result.commissionAmount / body.amount) * 100 : 0,
        breakdown: result.details?.breakdown || [],
        formula: result.details?.formula
      }
    })
  } catch (error) {
    console.error('[Rules API] Commission POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
