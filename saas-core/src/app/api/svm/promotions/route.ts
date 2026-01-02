/**
 * SVM Promotions API
 * 
 * POST /api/svm/promotions/validate - Validate coupon code
 * POST /api/svm/promotions/calculate - Calculate discounts for cart
 * GET /api/svm/promotions - List promotions
 * POST /api/svm/promotions - Create promotion
 * 
 * IMPORTANT:
 * - Promotions apply ONLY to this module (SVM)
 * - Final payable amount sent to Core
 * - No global pricing mutation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPromotions,
  getActivePromotions,
  getAutomaticPromotions,
  findByCode,
  addPromotion,
  validatePromotion,
  getEligibleItems,
  calculateDiscount,
  generateId,
  type Promotion,
  type PromotionCartItem,
  type AppliedPromotion
} from '@/lib/promotions-storage'
import Decimal from 'decimal.js'

/**
 * POST /api/svm/promotions - Create a new promotion OR validate/calculate
 * 
 * For action: 'CREATE' - Create new promotion
 * For action: 'VALIDATE' - Validate coupon code
 * For action: 'CALCULATE' - Calculate discounts for cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, action } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    switch (action) {
      case 'VALIDATE': {
        // Validate a coupon code
        const { code, subtotal, items, customerId, isFirstOrder } = body
        
        if (!code) {
          return NextResponse.json(
            { success: false, error: 'Coupon code is required' },
            { status: 400 }
          )
        }
        
        const promotion = await findByCode(tenantId, code)
        
        if (!promotion) {
          return NextResponse.json({
            success: false,
            valid: false,
            error: 'Invalid coupon code',
            errorCode: 'NOT_FOUND'
          })
        }
        
        const totalQuantity = (items || []).reduce(
          (sum: number, item: PromotionCartItem) => sum + item.quantity, 0
        )
        
        const validation = await validatePromotion(
          promotion,
          subtotal || 0,
          totalQuantity,
          customerId,
          isFirstOrder,
          []
        )
        
        if (!validation.valid) {
          return NextResponse.json({
            success: true,
            valid: false,
            error: validation.error,
            errorCode: validation.errorCode
          })
        }
        
        // Calculate potential discount
        const discount = calculateDiscount(
          promotion,
          items || [],
          subtotal || 0,
          body.shippingTotal
        )
        
        return NextResponse.json({
          success: true,
          valid: true,
          promotion: {
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            code: promotion.code,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue
          },
          potentialDiscount: discount
        })
      }
      
      case 'CALCULATE': {
        // Calculate all applicable discounts
        const { items, subtotal, shippingTotal, couponCodes, customerId, isFirstOrder } = body
        
        if (subtotal === undefined) {
          return NextResponse.json(
            { success: false, error: 'subtotal is required' },
            { status: 400 }
          )
        }
        
        const cartItems: PromotionCartItem[] = items || []
        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
        
        // Get automatic promotions
        const autoPromotions = await getAutomaticPromotions(tenantId)
        
        // Get coupon promotions
        const couponPromotionPromises = (couponCodes || []).map((code: string) => findByCode(tenantId, code))
        const couponPromotionsResults = await Promise.all(couponPromotionPromises)
        const couponPromotions: Promotion[] = couponPromotionsResults.filter((p): p is Promotion => p !== null)
        
        // Combine and sort by priority
        const allPromotions = [...autoPromotions, ...couponPromotions]
          .sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority
            return b.discountValue - a.discountValue
          })
        
        const appliedPromotions: AppliedPromotion[] = []
        const errors: string[] = []
        let discountTotal = new Decimal(0)
        let shippingDiscount = new Decimal(0)
        
        for (const promotion of allPromotions) {
          const validation = await validatePromotion(
            promotion,
            subtotal,
            totalQuantity,
            customerId,
            isFirstOrder,
            appliedPromotions
          )
          
          if (!validation.valid) {
            if (promotion.type === 'COUPON') {
              errors.push(`${promotion.code}: ${validation.error}`)
            }
            continue
          }
          
          // Check product eligibility
          const eligibleItems = getEligibleItems(promotion, cartItems)
          if (eligibleItems.length === 0 && promotion.discountType !== 'FREE_SHIPPING') {
            if (promotion.type === 'COUPON') {
              errors.push(`${promotion.code}: No eligible items in your cart`)
            }
            continue
          }
          
          const applied = calculateDiscount(promotion, cartItems, subtotal, shippingTotal)
          
          if (applied) {
            appliedPromotions.push(applied)
            
            if (applied.freeShipping && shippingTotal) {
              shippingDiscount = new Decimal(shippingTotal)
            } else {
              discountTotal = discountTotal.plus(applied.discountAmount)
            }
            
            if (!promotion.stackable) {
              break
            }
          }
        }
        
        // Don't exceed subtotal
        if (discountTotal.greaterThan(subtotal)) {
          discountTotal = new Decimal(subtotal)
        }
        
        const finalSubtotal = new Decimal(subtotal)
          .minus(discountTotal)
          .toDecimalPlaces(2)
          .toNumber()
        
        return NextResponse.json({
          success: true,
          appliedPromotions,
          subtotal,
          discountTotal: discountTotal.toDecimalPlaces(2).toNumber(),
          shippingDiscount: shippingDiscount.toDecimalPlaces(2).toNumber(),
          finalSubtotal,
          shippingTotal: shippingTotal ? 
            new Decimal(shippingTotal).minus(shippingDiscount).toNumber() : 
            undefined,
          errors: errors.length > 0 ? errors : undefined
        })
      }
      
      case 'CREATE':
      default: {
        // Create a new promotion
        const { name, description, code, type, discountType, discountValue, maxDiscount,
          minOrderTotal, minQuantity, productIds, categoryIds, excludeProductIds,
          customerIds, firstOrderOnly, usageLimit, perCustomerLimit, startsAt, endsAt,
          stackable, priority, buyQuantity, getQuantity, getDiscountPercent } = body
        
        if (!name || !discountType) {
          return NextResponse.json(
            { success: false, error: 'name and discountType are required' },
            { status: 400 }
          )
        }
        
        // Check for duplicate code
        if (code) {
          const existing = await findByCode(tenantId, code)
          if (existing) {
            return NextResponse.json(
              { success: false, error: 'A promotion with this code already exists' },
              { status: 400 }
            )
          }
        }
        
        const newPromotion: Promotion = {
          id: generateId('promo'),
          tenantId,
          name,
          description,
          code: code?.toUpperCase(),
          type: type || (code ? 'COUPON' : 'AUTOMATIC'),
          discountType,
          discountValue: discountValue || 0,
          maxDiscount,
          minOrderTotal,
          minQuantity,
          productIds: productIds || [],
          categoryIds: categoryIds || [],
          excludeProductIds: excludeProductIds || [],
          customerIds: customerIds || [],
          firstOrderOnly: firstOrderOnly || false,
          usageLimit,
          usageCount: 0,
          perCustomerLimit,
          startsAt: startsAt ? new Date(startsAt) : new Date(),
          endsAt: endsAt ? new Date(endsAt) : undefined,
          isActive: true,
          stackable: stackable || false,
          priority: priority || 0,
          buyQuantity,
          getQuantity,
          getDiscountPercent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await addPromotion(newPromotion)
        
        return NextResponse.json({
          success: true,
          promotion: newPromotion
        }, { status: 201 })
      }
    }
    
  } catch (error) {
    console.error('[SVM] Error processing promotions request:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/svm/promotions - List promotions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const type = searchParams.get('type') as 'COUPON' | 'AUTOMATIC' | 'FLASH_SALE' | null
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    let promotions = activeOnly ? await getActivePromotions(tenantId) : await getPromotions(tenantId)
    
    if (type) {
      promotions = promotions.filter(p => p.type === type)
    }
    
    return NextResponse.json({
      success: true,
      promotions: promotions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        code: p.code,
        type: p.type,
        discountType: p.discountType,
        discountValue: p.discountValue,
        maxDiscount: p.maxDiscount,
        minOrderTotal: p.minOrderTotal,
        minQuantity: p.minQuantity,
        firstOrderOnly: p.firstOrderOnly,
        usageLimit: p.usageLimit,
        usageCount: p.usageCount,
        perCustomerLimit: p.perCustomerLimit,
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        isActive: p.isActive,
        stackable: p.stackable,
        priority: p.priority,
        // BUY_X_GET_Y specific
        buyQuantity: p.buyQuantity,
        getQuantity: p.getQuantity,
        getDiscountPercent: p.getDiscountPercent,
        // Formatted display
        displayValue: formatDiscountDisplay(p)
      })),
      total: promotions.length,
      activeCount: promotions.filter(p => p.isActive).length
    })
    
  } catch (error) {
    console.error('[SVM] Error listing promotions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatDiscountDisplay(p: Promotion): string {
  switch (p.discountType) {
    case 'PERCENTAGE':
      return `${p.discountValue}% off${p.maxDiscount ? ` (max $${p.maxDiscount})` : ''}`
    case 'FIXED_AMOUNT':
      return `$${p.discountValue.toFixed(2)} off`
    case 'FIXED_PER_ITEM':
      return `$${p.discountValue.toFixed(2)} off per item`
    case 'FREE_SHIPPING':
      return 'Free shipping'
    case 'BUY_X_GET_Y':
      const getDesc = p.getDiscountPercent === 100 ? 'free' : `${p.getDiscountPercent}% off`
      return `Buy ${p.buyQuantity} get ${p.getQuantity} ${getDesc}`
    default:
      return ''
  }
}
