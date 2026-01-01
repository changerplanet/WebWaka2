/**
 * SVM Promotions Storage
 * 
 * Shared in-memory storage for promotions.
 * Using globalThis to ensure single instance across all Next.js API routes.
 * 
 * In production, this would be replaced with database queries.
 */

import Decimal from 'decimal.js'

// ============================================================================
// TYPES
// ============================================================================

export type PromotionType = 'COUPON' | 'AUTOMATIC' | 'FLASH_SALE'
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PER_ITEM' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

export interface Promotion {
  id: string
  tenantId: string
  name: string
  description?: string
  code?: string
  type: PromotionType
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number
  minOrderTotal?: number
  minQuantity?: number
  productIds: string[]
  categoryIds: string[]
  excludeProductIds: string[]
  customerIds: string[]
  firstOrderOnly: boolean
  usageLimit?: number
  usageCount: number
  perCustomerLimit?: number
  startsAt: Date
  endsAt?: Date
  isActive: boolean
  stackable: boolean
  priority: number
  buyQuantity?: number
  getQuantity?: number
  getDiscountPercent?: number
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
  code?: string
  discountType: DiscountType
  discountAmount: number
  originalAmount?: number
  cappedAmount?: number
  affectedItems?: string[]
  freeShipping?: boolean
  message: string
}

// ============================================================================
// SHARED STORAGE (Singleton using globalThis)
// ============================================================================

const PROMOTIONS_STORAGE_KEY = '__svm_promotions_storage__'
const USAGE_STORAGE_KEY = '__svm_promotion_usage_storage__'

function getPromotionsStorage(): Map<string, Promotion[]> {
  if (!(globalThis as any)[PROMOTIONS_STORAGE_KEY]) {
    (globalThis as any)[PROMOTIONS_STORAGE_KEY] = new Map<string, Promotion[]>()
  }
  return (globalThis as any)[PROMOTIONS_STORAGE_KEY]
}

function getUsageStorage(): Map<string, PromotionUsage[]> {
  if (!(globalThis as any)[USAGE_STORAGE_KEY]) {
    (globalThis as any)[USAGE_STORAGE_KEY] = new Map<string, PromotionUsage[]>()
  }
  return (globalThis as any)[USAGE_STORAGE_KEY]
}

export function generateId(prefix: string = 'promo'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// PROMOTION CRUD
// ============================================================================

/**
 * Get or create sample promotions for a tenant
 */
export function getOrCreatePromotions(tenantId: string): Promotion[] {
  const storage = getPromotionsStorage()
  
  if (storage.has(tenantId)) {
    return storage.get(tenantId)!
  }
  
  // Create sample promotions
  const now = new Date()
  const samplePromotions: Promotion[] = [
    {
      id: generateId('promo'),
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
      priority: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: generateId('promo'),
      tenantId,
      name: 'Summer Sale',
      description: '15% off orders over $100 (max $50 discount)',
      type: 'AUTOMATIC',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxDiscount: 50,
      minOrderTotal: 100,
      productIds: [],
      categoryIds: [],
      excludeProductIds: [],
      customerIds: [],
      firstOrderOnly: false,
      usageCount: 0,
      startsAt: now,
      isActive: true,
      stackable: true,
      priority: 10,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: generateId('promo'),
      tenantId,
      name: 'Free Shipping',
      description: 'Free shipping on orders over $50',
      code: 'FREESHIP',
      type: 'COUPON',
      discountType: 'FREE_SHIPPING',
      discountValue: 0,
      minOrderTotal: 50,
      productIds: [],
      categoryIds: [],
      excludeProductIds: [],
      customerIds: [],
      firstOrderOnly: false,
      usageCount: 0,
      startsAt: now,
      isActive: true,
      stackable: true,
      priority: 5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: generateId('promo'),
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
      priority: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: generateId('promo'),
      tenantId,
      name: '$20 Off',
      description: '$20 off orders over $75 (limit 100 uses)',
      code: 'SAVE20',
      type: 'COUPON',
      discountType: 'FIXED_AMOUNT',
      discountValue: 20,
      minOrderTotal: 75,
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
      priority: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ]
  
  storage.set(tenantId, samplePromotions)
  return samplePromotions
}

export function getPromotions(tenantId: string): Promotion[] {
  return getOrCreatePromotions(tenantId)
}

export function getActivePromotions(tenantId: string): Promotion[] {
  const now = new Date()
  return getPromotions(tenantId).filter(p => 
    p.isActive && 
    p.startsAt <= now && 
    (!p.endsAt || p.endsAt > now) &&
    (!p.usageLimit || p.usageCount < p.usageLimit)
  )
}

export function getAutomaticPromotions(tenantId: string): Promotion[] {
  return getActivePromotions(tenantId).filter(p => 
    p.type === 'AUTOMATIC' || p.type === 'FLASH_SALE'
  )
}

export function findByCode(tenantId: string, code: string): Promotion | null {
  const promotions = getActivePromotions(tenantId)
  return promotions.find(p => p.code?.toUpperCase() === code.toUpperCase()) || null
}

export function getPromotion(tenantId: string, promotionId: string): Promotion | null {
  const promotions = getPromotions(tenantId)
  return promotions.find(p => p.id === promotionId) || null
}

export function addPromotion(promotion: Promotion): void {
  const storage = getPromotionsStorage()
  const promotions = getOrCreatePromotions(promotion.tenantId)
  promotions.push(promotion)
}

export function updatePromotion(tenantId: string, promotionId: string, updates: Partial<Promotion>): Promotion | null {
  const promotions = getPromotions(tenantId)
  const index = promotions.findIndex(p => p.id === promotionId)
  if (index < 0) return null
  
  promotions[index] = { ...promotions[index], ...updates, updatedAt: new Date().toISOString() }
  return promotions[index]
}

export function deletePromotion(tenantId: string, promotionId: string): Promotion | null {
  const storage = getPromotionsStorage()
  const promotions = storage.get(tenantId) || []
  const index = promotions.findIndex(p => p.id === promotionId)
  if (index < 0) return null
  
  const [deleted] = promotions.splice(index, 1)
  return deleted
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export function recordUsage(
  promotionId: string,
  orderId: string,
  customerId: string | undefined,
  discountApplied: number
): PromotionUsage {
  const usageStorage = getUsageStorage()
  const promotionsStorage = getPromotionsStorage()
  
  const usage: PromotionUsage = {
    id: generateId('usage'),
    promotionId,
    orderId,
    customerId,
    discountApplied,
    createdAt: new Date()
  }
  
  // Store usage
  const usages = usageStorage.get(promotionId) || []
  usages.push(usage)
  usageStorage.set(promotionId, usages)
  
  // Increment usage count on promotion
  for (const [tenantId, promotions] of promotionsStorage) {
    const promotion = promotions.find(p => p.id === promotionId)
    if (promotion) {
      promotion.usageCount++
      break
    }
  }
  
  return usage
}

export function getCustomerUsageCount(promotionId: string, customerId?: string): number {
  if (!customerId) return 0
  
  const usageStorage = getUsageStorage()
  const usages = usageStorage.get(promotionId) || []
  return usages.filter(u => u.customerId === customerId).length
}

// ============================================================================
// VALIDATION & CALCULATION
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
}

export function validatePromotion(
  promotion: Promotion,
  subtotal: number,
  totalQuantity: number,
  customerId?: string,
  isFirstOrder?: boolean,
  currentDiscounts: AppliedPromotion[] = []
): ValidationResult {
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
  
  const customerUsageCount = getCustomerUsageCount(promotion.id, customerId)
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
