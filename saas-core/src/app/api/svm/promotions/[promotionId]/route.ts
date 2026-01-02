/**
 * SVM Promotion by ID API
 * 
 * GET /api/svm/promotions/:promotionId - Get promotion details
 * PUT /api/svm/promotions/:promotionId - Update promotion
 * DELETE /api/svm/promotions/:promotionId - Delete promotion
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPromotion,
  updatePromotion,
  deletePromotion
} from '@/lib/promotions-storage'

interface RouteParams {
  params: Promise<{ promotionId: string }>
}

/**
 * GET /api/svm/promotions/:promotionId
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { promotionId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!promotionId) {
      return NextResponse.json(
        { success: false, error: 'promotionId is required' },
        { status: 400 }
      )
    }
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId query parameter is required' },
        { status: 400 }
      )
    }
    
    const promotion = await getPromotion(tenantId, promotionId)
    
    if (!promotion) {
      return NextResponse.json(
        { success: false, error: `Promotion ${promotionId} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      promotion
    })
    
  } catch (error) {
    console.error('[SVM] Error fetching promotion:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/svm/promotions/:promotionId
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { promotionId } = await context.params
    const body = await request.json()
    const { tenantId } = body
    
    if (!promotionId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'promotionId and tenantId are required' },
        { status: 400 }
      )
    }
    
    const existing = await getPromotion(tenantId, promotionId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Promotion ${promotionId} not found` },
        { status: 404 }
      )
    }
    
    // Extract updatable fields
    const updates: Record<string, unknown> = {}
    const updatableFields = [
      'name', 'description', 'discountValue', 'maxDiscount',
      'minOrderTotal', 'minQuantity', 'productIds', 'categoryIds',
      'excludeProductIds', 'customerIds', 'firstOrderOnly',
      'usageLimit', 'perCustomerLimit', 'endsAt', 'isActive',
      'stackable', 'priority', 'buyQuantity', 'getQuantity', 'getDiscountPercent'
    ]
    
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }
    
    // Handle date fields
    if (body.startsAt) {
      updates.startsAt = new Date(body.startsAt)
    }
    if (body.endsAt) {
      updates.endsAt = new Date(body.endsAt)
    }
    
    const updated = await updatePromotion(tenantId, promotionId, updates)
    
    return NextResponse.json({
      success: true,
      message: `Promotion ${promotionId} updated`,
      promotion: updated
    })
    
  } catch (error) {
    console.error('[SVM] Error updating promotion:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/svm/promotions/:promotionId
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { promotionId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!promotionId || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'promotionId and tenantId are required' },
        { status: 400 }
      )
    }
    
    const deleted = await deletePromotion(tenantId, promotionId)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Promotion ${promotionId} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Promotion ${deleted.name} deleted`,
      deletedPromotionId: promotionId
    })
    
  } catch (error) {
    console.error('[SVM] Error deleting promotion:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
