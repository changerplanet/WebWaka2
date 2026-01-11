export const dynamic = 'force-dynamic'

/**
 * COMMERCE RULES ENGINE
 * Inventory Rules API
 * 
 * S4 - API Exposure
 * 
 * GET /api/commerce/rules/inventory - Get inventory rule info
 * POST /api/commerce/rules/inventory - Preview reorder suggestions
 * 
 * @module api/commerce/rules/inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'

/**
 * GET /api/commerce/rules/inventory
 * Get inventory rules configuration info
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
      category: 'inventory',
      name: 'Inventory Rules',
      description: 'Reorder thresholds, auto-replenishment triggers',
      ruleTypes: [
        { type: 'MIN_THRESHOLD', description: 'Trigger when stock falls below minimum' },
        { type: 'REORDER_POINT', description: 'Economic order quantity calculation' },
        { type: 'SAFETY_STOCK', description: 'Buffer for supply chain delays' },
        { type: 'LEAD_TIME', description: 'Account for supplier delivery time' }
      ],
      nigeriaFactors: [
        'Extended lead times (port delays, logistics)',
        'Cash flow constraints (batch ordering)',
        'Seasonal demand variations',
        'Multi-location support (Lagos, Abuja, PH)'
      ],
      example: {
        productId: 'prod-123',
        minThreshold: 50,
        reorderQuantity: 200,
        safetyStock: 25,
        leadTimeDays: 14
      }
    })
  } catch (error) {
    console.error('[Rules API] Inventory GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/rules/inventory
 * Preview reorder suggestion for a product
 * 
 * Body:
 * - productId: string (required)
 * - currentStock: number (required)
 * - avgDailySales?: number
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

    if (typeof body.currentStock !== 'number') {
      return NextResponse.json(
        { error: 'currentStock is required' },
        { status: 400 }
      )
    }

    // Demo reorder calculation
    const minThreshold = 50
    const reorderQuantity = 200
    const safetyStock = 25
    const leadTimeDays = 14
    const avgDailySales = body.avgDailySales || 10

    const daysOfStock = Math.floor(body.currentStock / avgDailySales)
    const needsReorder = body.currentStock <= minThreshold
    const urgentReorder = body.currentStock <= safetyStock

    return NextResponse.json({
      success: true,
      input: {
        productId: body.productId,
        currentStock: body.currentStock,
        avgDailySales
      },
      rule: {
        minThreshold,
        reorderQuantity,
        safetyStock,
        leadTimeDays
      },
      result: {
        daysOfStock,
        needsReorder,
        urgentReorder,
        suggestedQuantity: needsReorder ? reorderQuantity : 0,
        reason: urgentReorder 
          ? 'URGENT: Below safety stock level'
          : needsReorder 
            ? 'Stock below minimum threshold'
            : 'Stock adequate'
      }
    })
  } catch (error) {
    console.error('[Rules API] Inventory POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
