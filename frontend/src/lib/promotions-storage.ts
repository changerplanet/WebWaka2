/**
 * SVM Promotions Storage
 * 
 * Database-backed storage for promotions using Prisma.
 * All data is tenant-isolated and persists across restarts.
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'
import Decimal from 'decimal.js'
import { withPrismaDefaults } from './db/prismaDefaults'

// ============================================================================
// TYPES (maintained for API compatibility)
// ============================================================================

export type PromotionType = 'COUPON' | 'AUTOMATIC' | 'FLASH_SALE'
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PER_ITEM' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

export interface Promotion {
  id: string
  tenantId: string
  name: string
  description?: string | null
  code?: string | null
  type: PromotionType
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number | null
  minOrderTotal?: number | null
  minQuantity?: number | null
  productIds: string[]
  categoryIds: string[]
  excludeProductIds: string[]
  customerIds: string[]
  firstOrderOnly: boolean
  usageLimit?: number | null
  usageCount: number
  perCustomerLimit?: number | null
  startsAt: Date
  endsAt?: Date | null
  isActive: boolean
  stackable: boolean
  priority: number
  buyQuantity?: number | null
  getQuantity?: number | null
  getDiscountPercent?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface PromotionUsage {
  id: string
  promotionId: string
  orderId: string
  customerId?: string
  discountApplied: number
  createdAt: Date
}

export interface PromotionCartItem {
  productId: string
  variantId?: string
  categoryId?: string
  productName: string
  unitPrice: number
  quantity: number
}

export interface AppliedPromotion {
  promotionId: string
  promotionName: string
  code?: string | null
  discountType: DiscountType
  discountAmount: number
  originalAmount?: number
  cappedAmount?: number
  affectedItems?: string[]
  freeShipping?: boolean
  message: string
}

// ============================================================================
// HELPERS
// ============================================================================

export function generateId(prefix: string = 'promo'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

function decimalToNumber(val: Prisma.Decimal | null | undefined): number | null {
  if (val === null || val === undefined) return null
  return Number(val)
}

function mapDbPromotionToInterface(dbPromo: any): Promotion {
  return {
    id: dbPromo.id,
    tenantId: dbPromo.tenantId,
    name: dbPromo.name,
    description: dbPromo.description,
    code: dbPromo.code,
    type: dbPromo.type as PromotionType,
    discountType: dbPromo.discountType as DiscountType,
    discountValue: Number(dbPromo.discountValue),
    maxDiscount: decimalToNumber(dbPromo.maxDiscount),
    minOrderTotal: decimalToNumber(dbPromo.minOrderTotal),
    minQuantity: dbPromo.minQuantity,
    productIds: dbPromo.productIds || [],
    categoryIds: dbPromo.categoryIds || [],
    excludeProductIds: dbPromo.excludeProductIds || [],
    customerIds: dbPromo.customerIds || [],
    firstOrderOnly: dbPromo.firstOrderOnly,
    usageLimit: dbPromo.usageLimit,
    usageCount: dbPromo.usageCount,
    perCustomerLimit: dbPromo.perCustomerLimit,
    startsAt: dbPromo.startsAt,
    endsAt: dbPromo.endsAt,
    isActive: dbPromo.isActive,
    stackable: dbPromo.stackable,
    priority: dbPromo.priority,
    buyQuantity: dbPromo.buyQuantity,
    getQuantity: dbPromo.getQuantity,
    getDiscountPercent: dbPromo.getDiscountPercent,
    createdAt: dbPromo.createdAt?.toISOString(),
    updatedAt: dbPromo.updatedAt?.toISOString()
  }
}

// ============================================================================
// DEFAULT PROMOTIONS SEEDING
// ============================================================================

async function seedDefaultPromotions(tenantId: string): Promise<Promotion[]> {
  const now = new Date()
  
  const promotions = await prisma.$transaction([
    prisma.svm_promotions.create({
      data: withPrismaDefaults({
        tenantId,
        name: 'Welcome Discount',
        description: '10% off your first order',
        code: 'WELCOME10',
        type: 'COUPON',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        productIds: [],
        categoryIds: [],
        excludeProductIds: [],
        customerIds: [],
        firstOrderOnly: true,
        usageCount: 0,
        startsAt: now,
        isActive: true,
        stackable: false,
        priority: 0
      })
    }),
    prisma.svm_promotions.create({
      data: withPrismaDefaults({
        tenantId,
        name: 'Seasonal Sale',
        description: '15% off orders over ₦20,000 (max ₦10,000 discount)',
        code: null,
        type: 'AUTOMATIC',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maxDiscount: 10000,
        minOrderTotal: 20000,
        productIds: [],
        categoryIds: [],
        excludeProductIds: [],
        customerIds: [],
        firstOrderOnly: false,
        usageCount: 0,
        startsAt: now,
        isActive: true,
        stackable: true,
        priority: 10
      })
    }),
    prisma.svm_promotions.create({
      data: withPrismaDefaults({
        tenantId,
        name: 'Free Delivery',
        description: 'Free delivery on orders over ₦10,000',
        code: 'FREEDELIVERY',
        type: 'COUPON',
        discountType: 'FREE_SHIPPING',
        discountValue: 0,
        minOrderTotal: 10000,
        productIds: [],
        categoryIds: [],
        excludeProductIds: [],
        customerIds: [],
        firstOrderOnly: false,
        usageCount: 0,
        startsAt: now,
        isActive: true,
        stackable: true,
        priority: 5
      }
    }),
    prisma.svm_promotions.create({
      data: withPrismaDefaults({
        tenantId,
        name: 'Buy 2 Get 1 Free',
        description: 'Buy any 2 items, get 1 free',
        code: 'BOGO',
        type: 'COUPON',
        discountType: 'BUY_X_GET_Y',
        discountValue: 100,
        buyQuantity: 2,
        getQuantity: 1,
        getDiscountPercent: 100,
        productIds: [],
        categoryIds: [],
        excludeProductIds: [],
        customerIds: [],
        firstOrderOnly: false,
        usageCount: 0,
        startsAt: now,
        isActive: true,
        stackable: false,
        priority: 0
      }
    }),
    prisma.svm_promotions.create({
      data: withPrismaDefaults({
        tenantId,
        name: '₦4,000 Off',
        description: '₦4,000 off orders over ₦15,000 (limit 100 uses)',
        code: 'SAVE4000',
        type: 'COUPON',
        discountType: 'FIXED_AMOUNT',
        discountValue: 4000,
        minOrderTotal: 15000,
        usageLimit: 100,
        perCustomerLimit: 1,
        productIds: [],
        categoryIds: [],
        excludeProductIds: [],
        customerIds: [],
        firstOrderOnly: false,
        usageCount: 0,
        startsAt: now,
        isActive: true,
        stackable: false,
        priority: 0
      }
    })
  ])
  
  return promotions.map(mapDbPromotionToInterface)
}

// ============================================================================
// PROMOTION CRUD
// ============================================================================

/**
 * Get or create sample promotions for a tenant
 */
export async function getOrCreatePromotions(tenantId: string): Promise<Promotion[]> {
  const existing = await prisma.svm_promotions.findMany({
    where: { tenantId }
  })
  
  if (existing.length > 0) {
    return existing.map(mapDbPromotionToInterface)
  }
  
  return seedDefaultPromotions(tenantId)
}

export async function getPromotions(tenantId: string): Promise<Promotion[]> {
  return getOrCreatePromotions(tenantId)
}

export async function getActivePromotions(tenantId: string): Promise<Promotion[]> {
  const now = new Date()
  
  const promotions = await prisma.svm_promotions.findMany({
    where: {
      tenantId,
      isActive: true,
      startsAt: { lte: now },
      OR: [
        { endsAt: null },
        { endsAt: { gt: now } }
      ]
    }
  })
  
  // Filter by usage limit in application layer
  return promotions
    .map(mapDbPromotionToInterface)
    .filter(p => !p.usageLimit || p.usageCount < p.usageLimit)
}

export async function getAutomaticPromotions(tenantId: string): Promise<Promotion[]> {
  const active = await getActivePromotions(tenantId)
  return active.filter(p => p.type === 'AUTOMATIC' || p.type === 'FLASH_SALE')
}

export async function findByCode(tenantId: string, code: string): Promise<Promotion | null> {
  const promotion = await prisma.svm_promotions.findFirst({
    where: {
      tenantId,
      code: { equals: code, mode: 'insensitive' },
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gt: new Date() } }
      ]
    }
  })
  
  if (!promotion) return null
  
  const mapped = mapDbPromotionToInterface(promotion)
  
  // Check usage limit
  if (mapped.usageLimit && mapped.usageCount >= mapped.usageLimit) {
    return null
  }
  
  return mapped
}

export async function getPromotion(tenantId: string, promotionId: string): Promise<Promotion | null> {
  const promotion = await prisma.svm_promotions.findFirst({
    where: { id: promotionId, tenantId }
  })
  
  return promotion ? mapDbPromotionToInterface(promotion) : null
}

export async function addPromotion(promotion: Promotion): Promise<void> {
  await prisma.svm_promotions.create({
    data: withPrismaDefaults({
      id: promotion.id,
      tenantId: promotion.tenantId,
      name: promotion.name,
      description: promotion.description,
      code: promotion.code,
      type: promotion.type,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      maxDiscount: promotion.maxDiscount,
      minOrderTotal: promotion.minOrderTotal,
      minQuantity: promotion.minQuantity,
      productIds: promotion.productIds,
      categoryIds: promotion.categoryIds,
      excludeProductIds: promotion.excludeProductIds,
      customerIds: promotion.customerIds,
      firstOrderOnly: promotion.firstOrderOnly,
      usageLimit: promotion.usageLimit,
      usageCount: promotion.usageCount,
      perCustomerLimit: promotion.perCustomerLimit,
      buyQuantity: promotion.buyQuantity,
      getQuantity: promotion.getQuantity,
      getDiscountPercent: promotion.getDiscountPercent,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      isActive: promotion.isActive,
      stackable: promotion.stackable,
      priority: promotion.priority
    }
  })
}

export async function updatePromotion(tenantId: string, promotionId: string, updates: Partial<Promotion>): Promise<Promotion | null> {
  const existing = await prisma.svm_promotions.findFirst({
    where: { id: promotionId, tenantId }
  })
  
  if (!existing) return null
  
  const updated = await prisma.svm_promotions.update({
    where: { id: promotionId },
    data: {
      name: updates.name,
      description: updates.description,
      discountValue: updates.discountValue,
      maxDiscount: updates.maxDiscount,
      minOrderTotal: updates.minOrderTotal,
      minQuantity: updates.minQuantity,
      productIds: updates.productIds,
      categoryIds: updates.categoryIds,
      excludeProductIds: updates.excludeProductIds,
      customerIds: updates.customerIds,
      firstOrderOnly: updates.firstOrderOnly,
      usageLimit: updates.usageLimit,
      perCustomerLimit: updates.perCustomerLimit,
      buyQuantity: updates.buyQuantity,
      getQuantity: updates.getQuantity,
      getDiscountPercent: updates.getDiscountPercent,
      startsAt: updates.startsAt,
      endsAt: updates.endsAt,
      isActive: updates.isActive,
      stackable: updates.stackable,
      priority: updates.priority
    }
  })
  
  return mapDbPromotionToInterface(updated)
}

export async function deletePromotion(tenantId: string, promotionId: string): Promise<Promotion | null> {
  const existing = await prisma.svm_promotions.findFirst({
    where: { id: promotionId, tenantId }
  })
  
  if (!existing) return null
  
  await prisma.svm_promotions.delete({
    where: { id: promotionId }
  })
  
  return mapDbPromotionToInterface(existing)
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export async function recordUsage(
  promotionId: string,
  orderId: string,
  customerId: string | undefined,
  discountApplied: number
): Promise<PromotionUsage> {
  const usage = await prisma.svm_promotion_usages.create({
    data: withPrismaDefaults({
      promotionId,
      orderId,
      customerId,
      discountApplied
    })
  })
  
  // Increment usage count on promotion
  await prisma.svm_promotions.update({
    where: { id: promotionId },
    data: { usageCount: { increment: 1 } }
  })
  
  return {
    id: usage.id,
    promotionId: usage.promotionId,
    orderId: usage.orderId,
    customerId: usage.customerId || undefined,
    discountApplied: Number(usage.discountApplied),
    createdAt: usage.createdAt
  }
}

export async function getCustomerUsageCount(promotionId: string, customerId?: string): Promise<number> {
  if (!customerId) return 0
  
  const count = await prisma.svm_promotion_usages.count({
    where: { promotionId, customerId }
  })
  
  return count
}

// ============================================================================
// VALIDATION & CALCULATION
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
}

export async function validatePromotion(
  promotion: Promotion,
  subtotal: number,
  totalQuantity: number,
  customerId?: string,
  isFirstOrder?: boolean,
  currentDiscounts: AppliedPromotion[] = []
): Promise<ValidationResult> {
  const now = new Date()
  
  if (!promotion.isActive) {
    return { valid: false, error: 'This promotion is no longer active', errorCode: 'INACTIVE' }
  }
  
  if (promotion.startsAt > now) {
    return { valid: false, error: 'This promotion has not started yet', errorCode: 'NOT_STARTED' }
  }
  
  if (promotion.endsAt && promotion.endsAt < now) {
    return { valid: false, error: 'This promotion has expired', errorCode: 'EXPIRED' }
  }
  
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    return { valid: false, error: 'This promotion has reached its usage limit', errorCode: 'USAGE_LIMIT_REACHED' }
  }
  
  const customerUsageCount = await getCustomerUsageCount(promotion.id, customerId)
  if (promotion.perCustomerLimit && customerUsageCount >= promotion.perCustomerLimit) {
    return { valid: false, error: 'You have already used this promotion the maximum number of times', errorCode: 'CUSTOMER_LIMIT_REACHED' }
  }
  
  if (promotion.customerIds.length > 0 && customerId) {
    if (!promotion.customerIds.includes(customerId)) {
      return { valid: false, error: 'This promotion is not available for your account', errorCode: 'CUSTOMER_NOT_ELIGIBLE' }
    }
  }
  
  if (promotion.firstOrderOnly && !isFirstOrder) {
    return { valid: false, error: 'This promotion is only valid for first-time orders', errorCode: 'FIRST_ORDER_ONLY' }
  }
  
  if (promotion.minOrderTotal && subtotal < promotion.minOrderTotal) {
    return { 
      valid: false, 
      error: `Minimum order total of $${promotion.minOrderTotal.toFixed(2)} required`,
      errorCode: 'MIN_ORDER_NOT_MET'
    }
  }
  
  if (promotion.minQuantity && totalQuantity < promotion.minQuantity) {
    return { 
      valid: false, 
      error: `Minimum of ${promotion.minQuantity} items required`,
      errorCode: 'MIN_QUANTITY_NOT_MET'
    }
  }
  
  if (!promotion.stackable && currentDiscounts.length > 0) {
    return { valid: false, error: 'This promotion cannot be combined with other discounts', errorCode: 'NOT_STACKABLE' }
  }
  
  if (currentDiscounts.some(d => d.promotionId === promotion.id)) {
    return { valid: false, error: 'This promotion is already applied', errorCode: 'ALREADY_APPLIED' }
  }
  
  return { valid: true }
}

export function getEligibleItems(promotion: Promotion, items: PromotionCartItem[]): PromotionCartItem[] {
  return items.filter(item => {
    if (promotion.excludeProductIds.includes(item.productId)) {
      return false
    }
    
    if (promotion.productIds.length === 0 && promotion.categoryIds.length === 0) {
      return true
    }
    
    if (promotion.productIds.length > 0 && promotion.productIds.includes(item.productId)) {
      return true
    }
    
    if (promotion.categoryIds.length > 0 && item.categoryId && promotion.categoryIds.includes(item.categoryId)) {
      return true
    }
    
    return false
  })
}

export function calculateDiscount(
  promotion: Promotion,
  items: PromotionCartItem[],
  subtotal: number,
  shippingTotal?: number
): AppliedPromotion | null {
  const eligibleItems = getEligibleItems(promotion, items)
  
  let discountAmount = new Decimal(0)
  let originalAmount: number | undefined
  let freeShipping = false
  let affectedItems: string[] = []
  let message = ''
  
  switch (promotion.discountType) {
    case 'PERCENTAGE': {
      const eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + (item.unitPrice * item.quantity), 0
      )
      
      const percentDiscount = new Decimal(eligibleSubtotal)
        .times(promotion.discountValue)
        .dividedBy(100)
      
      originalAmount = percentDiscount.toDecimalPlaces(2).toNumber()
      
      if (promotion.maxDiscount && percentDiscount.greaterThan(promotion.maxDiscount)) {
        discountAmount = new Decimal(promotion.maxDiscount)
      } else {
        discountAmount = percentDiscount
      }
      
      affectedItems = eligibleItems.map(i => i.productId)
      message = `${promotion.discountValue}% off${affectedItems.length < items.length ? ' eligible items' : ''}`
      break
    }
    
    case 'FIXED_AMOUNT': {
      discountAmount = new Decimal(promotion.discountValue)
      if (discountAmount.greaterThan(subtotal)) {
        discountAmount = new Decimal(subtotal)
      }
      message = `$${promotion.discountValue.toFixed(2)} off your order`
      break
    }
    
    case 'FIXED_PER_ITEM': {
      const totalEligibleQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0)
      discountAmount = new Decimal(promotion.discountValue).times(totalEligibleQty)
      
      const eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + (item.unitPrice * item.quantity), 0
      )
      if (discountAmount.greaterThan(eligibleSubtotal)) {
        discountAmount = new Decimal(eligibleSubtotal)
      }
      
      affectedItems = eligibleItems.map(i => i.productId)
      message = `$${promotion.discountValue.toFixed(2)} off each eligible item`
      break
    }
    
    case 'FREE_SHIPPING': {
      freeShipping = true
      message = 'Free shipping'
      break
    }
    
    case 'BUY_X_GET_Y': {
      if (!promotion.buyQuantity || !promotion.getQuantity) {
        return null
      }
      
      const sortedItems = [...eligibleItems].sort((a, b) => b.unitPrice - a.unitPrice)
      const totalQty = sortedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      const dealSize = promotion.buyQuantity + promotion.getQuantity
      const numDeals = Math.floor(totalQty / dealSize)
      
      if (numDeals === 0) {
        return null
      }
      
      const discountPercent = promotion.getDiscountPercent || 100
      let discountedItems = 0
      let totalDiscount = new Decimal(0)
      
      const reversedItems = [...sortedItems].reverse()
      for (const item of reversedItems) {
        const itemsToDiscount = Math.min(
          item.quantity,
          (numDeals * promotion.getQuantity) - discountedItems
        )
        
        if (itemsToDiscount > 0) {
          const itemDiscount = new Decimal(item.unitPrice)
            .times(itemsToDiscount)
            .times(discountPercent)
            .dividedBy(100)
          
          totalDiscount = totalDiscount.plus(itemDiscount)
          discountedItems += itemsToDiscount
        }
        
        if (discountedItems >= numDeals * promotion.getQuantity) {
          break
        }
      }
      
      discountAmount = totalDiscount
      affectedItems = eligibleItems.map(i => i.productId)
      
      const getDesc = discountPercent === 100 ? 'free' : `${discountPercent}% off`
      message = `Buy ${promotion.buyQuantity} get ${promotion.getQuantity} ${getDesc}`
      break
    }
  }
  
  const finalDiscount = discountAmount.toDecimalPlaces(2).toNumber()
  
  if (finalDiscount === 0 && !freeShipping) {
    return null
  }
  
  return {
    promotionId: promotion.id,
    promotionName: promotion.name,
    code: promotion.code,
    discountType: promotion.discountType,
    discountAmount: finalDiscount,
    originalAmount,
    cappedAmount: originalAmount && originalAmount > finalDiscount ? finalDiscount : undefined,
    affectedItems: affectedItems.length > 0 ? affectedItems : undefined,
    freeShipping,
    message
  }
}
