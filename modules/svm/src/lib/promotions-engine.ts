/**
 * SVM Promotions Engine
 * 
 * Handles promotions and discounts for the marketplace.
 * 
 * IMPORTANT:
 * - Promotions apply ONLY to this module (SVM)
 * - Final payable amount is sent to Core
 * - No global pricing mutation - discounts applied at checkout
 * - SVM does NOT process payments
 */

import Decimal from 'decimal.js'

// ============================================================================
// TYPES
// ============================================================================

export type PromotionType = 'COUPON' | 'AUTOMATIC' | 'FLASH_SALE'
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_PER_ITEM' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

/**
 * Promotion definition
 */
export interface Promotion {
  id: string
  tenantId: string
  
  name: string
  description?: string
  code?: string          // Null for automatic promotions
  
  type: PromotionType
  discountType: DiscountType
  
  // Value
  discountValue: number  // Percentage (0-100) or fixed amount
  maxDiscount?: number   // Cap for percentage discounts
  
  // Conditions
  minOrderTotal?: number
  minQuantity?: number
  
  // Product restrictions (empty = all products)
  productIds: string[]         // Only these products eligible
  categoryIds: string[]        // Only these categories eligible
  excludeProductIds: string[]  // Never apply to these
  
  // Customer restrictions
  customerIds: string[]        // Only these customers (empty = all)
  firstOrderOnly: boolean
  
  // Usage limits
  usageLimit?: number          // Total uses allowed
  usageCount: number           // Current usage count
  perCustomerLimit?: number    // Max uses per customer
  
  // Validity
  startsAt: Date
  endsAt?: Date
  isActive: boolean
  
  // Stacking
  stackable: boolean           // Can combine with other promotions
  priority: number             // Higher = applied first
  
  // BUY_X_GET_Y specific
  buyQuantity?: number         // Buy X
  getQuantity?: number         // Get Y
  getDiscountPercent?: number  // At % off (100 = free)
}

/**
 * Promotion usage record
 */
export interface PromotionUsage {
  id: string
  promotionId: string
  orderId: string
  customerId?: string
  discountApplied: number
  createdAt: Date
}

/**
 * Cart item for promotion calculation
 */
export interface PromotionCartItem {
  productId: string
  variantId?: string
  categoryId?: string
  productName: string
  unitPrice: number
  quantity: number
  originalPrice?: number  // For sale items
}

/**
 * Cart context for promotion validation
 */
export interface PromotionContext {
  tenantId: string
  customerId?: string
  isFirstOrder?: boolean
  items: PromotionCartItem[]
  subtotal: number
  shippingTotal?: number
  currentDiscounts?: AppliedPromotion[]  // For stacking validation
}

/**
 * Applied promotion result
 */
export interface AppliedPromotion {
  promotionId: string
  promotionName: string
  code?: string
  discountType: DiscountType
  discountAmount: number
  originalAmount?: number      // Before cap
  cappedAmount?: number        // After cap applied
  affectedItems?: string[]     // Product IDs affected
  freeShipping?: boolean
  message: string
}

/**
 * Promotion validation result
 */
export interface PromotionValidation {
  valid: boolean
  promotion?: Promotion
  error?: string
  errorCode?: PromotionErrorCode
}

export type PromotionErrorCode = 
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'NOT_STARTED'
  | 'USAGE_LIMIT_REACHED'
  | 'CUSTOMER_LIMIT_REACHED'
  | 'MIN_ORDER_NOT_MET'
  | 'MIN_QUANTITY_NOT_MET'
  | 'NO_ELIGIBLE_ITEMS'
  | 'CUSTOMER_NOT_ELIGIBLE'
  | 'FIRST_ORDER_ONLY'
  | 'NOT_STACKABLE'
  | 'ALREADY_APPLIED'

/**
 * Discount calculation result
 */
export interface DiscountCalculation {
  success: boolean
  appliedPromotions: AppliedPromotion[]
  subtotal: number
  discountTotal: number
  shippingDiscount: number
  finalSubtotal: number
  errors: string[]
}

// ============================================================================
// PROMOTIONS ENGINE
// ============================================================================

export class PromotionsEngine {
  
  /**
   * Validate a promotion code
   */
  validatePromotion(
    promotion: Promotion,
    context: PromotionContext,
    customerUsageCount: number = 0
  ): PromotionValidation {
    const now = new Date()
    
    // Check if active
    if (!promotion.isActive) {
      return { valid: false, error: 'This promotion is no longer active', errorCode: 'INACTIVE' }
    }
    
    // Check dates
    if (promotion.startsAt > now) {
      return { valid: false, error: 'This promotion has not started yet', errorCode: 'NOT_STARTED' }
    }
    
    if (promotion.endsAt && promotion.endsAt < now) {
      return { valid: false, error: 'This promotion has expired', errorCode: 'EXPIRED' }
    }
    
    // Check global usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return { valid: false, error: 'This promotion has reached its usage limit', errorCode: 'USAGE_LIMIT_REACHED' }
    }
    
    // Check per-customer limit
    if (promotion.perCustomerLimit && customerUsageCount >= promotion.perCustomerLimit) {
      return { valid: false, error: 'You have already used this promotion the maximum number of times', errorCode: 'CUSTOMER_LIMIT_REACHED' }
    }
    
    // Check customer restrictions
    if (promotion.customerIds.length > 0 && context.customerId) {
      if (!promotion.customerIds.includes(context.customerId)) {
        return { valid: false, error: 'This promotion is not available for your account', errorCode: 'CUSTOMER_NOT_ELIGIBLE' }
      }
    }
    
    // Check first order only
    if (promotion.firstOrderOnly && !context.isFirstOrder) {
      return { valid: false, error: 'This promotion is only valid for first-time orders', errorCode: 'FIRST_ORDER_ONLY' }
    }
    
    // Check minimum order total
    if (promotion.minOrderTotal && context.subtotal < promotion.minOrderTotal) {
      return { 
        valid: false, 
        error: `Minimum order total of $${promotion.minOrderTotal.toFixed(2)} required`,
        errorCode: 'MIN_ORDER_NOT_MET'
      }
    }
    
    // Check minimum quantity
    const totalQuantity = context.items.reduce((sum, item) => sum + item.quantity, 0)
    if (promotion.minQuantity && totalQuantity < promotion.minQuantity) {
      return { 
        valid: false, 
        error: `Minimum of ${promotion.minQuantity} items required`,
        errorCode: 'MIN_QUANTITY_NOT_MET'
      }
    }
    
    // Check product eligibility
    const eligibleItems = this.getEligibleItems(promotion, context.items)
    if (eligibleItems.length === 0 && promotion.discountType !== 'FREE_SHIPPING') {
      return { valid: false, error: 'No eligible items in your cart for this promotion', errorCode: 'NO_ELIGIBLE_ITEMS' }
    }
    
    // Check stacking
    if (!promotion.stackable && context.currentDiscounts && context.currentDiscounts.length > 0) {
      return { valid: false, error: 'This promotion cannot be combined with other discounts', errorCode: 'NOT_STACKABLE' }
    }
    
    // Check if already applied
    if (context.currentDiscounts?.some(d => d.promotionId === promotion.id)) {
      return { valid: false, error: 'This promotion is already applied', errorCode: 'ALREADY_APPLIED' }
    }
    
    return { valid: true, promotion }
  }

  /**
   * Get items eligible for a promotion
   */
  getEligibleItems(promotion: Promotion, items: PromotionCartItem[]): PromotionCartItem[] {
    return items.filter(item => {
      // Check exclusions first
      if (promotion.excludeProductIds.includes(item.productId)) {
        return false
      }
      
      // If no restrictions, all items are eligible
      if (promotion.productIds.length === 0 && promotion.categoryIds.length === 0) {
        return true
      }
      
      // Check product IDs
      if (promotion.productIds.length > 0 && promotion.productIds.includes(item.productId)) {
        return true
      }
      
      // Check category IDs
      if (promotion.categoryIds.length > 0 && item.categoryId && promotion.categoryIds.includes(item.categoryId)) {
        return true
      }
      
      return false
    })
  }

  /**
   * Calculate discount for a promotion
   */
  calculateDiscount(
    promotion: Promotion,
    context: PromotionContext
  ): AppliedPromotion | null {
    const eligibleItems = this.getEligibleItems(promotion, context.items)
    
    let discountAmount = new Decimal(0)
    let originalAmount: number | undefined
    let freeShipping = false
    let affectedItems: string[] = []
    let message = ''
    
    switch (promotion.discountType) {
      case 'PERCENTAGE': {
        // Calculate eligible subtotal
        const eligibleSubtotal = eligibleItems.reduce(
          (sum, item) => sum + (item.unitPrice * item.quantity),
          0
        )
        
        // Calculate percentage discount
        const percentDiscount = new Decimal(eligibleSubtotal)
          .times(promotion.discountValue)
          .dividedBy(100)
        
        originalAmount = percentDiscount.toDecimalPlaces(2).toNumber()
        
        // Apply cap if set
        if (promotion.maxDiscount && percentDiscount.greaterThan(promotion.maxDiscount)) {
          discountAmount = new Decimal(promotion.maxDiscount)
        } else {
          discountAmount = percentDiscount
        }
        
        affectedItems = eligibleItems.map(i => i.productId)
        message = `${promotion.discountValue}% off${affectedItems.length < context.items.length ? ' eligible items' : ''}`
        break
      }
      
      case 'FIXED_AMOUNT': {
        // Fixed amount off the order
        discountAmount = new Decimal(promotion.discountValue)
        
        // Don't exceed subtotal
        if (discountAmount.greaterThan(context.subtotal)) {
          discountAmount = new Decimal(context.subtotal)
        }
        
        message = `$${promotion.discountValue.toFixed(2)} off your order`
        break
      }
      
      case 'FIXED_PER_ITEM': {
        // Fixed amount off each eligible item
        const totalEligibleQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0)
        discountAmount = new Decimal(promotion.discountValue).times(totalEligibleQty)
        
        // Don't exceed eligible subtotal
        const eligibleSubtotal = eligibleItems.reduce(
          (sum, item) => sum + (item.unitPrice * item.quantity),
          0
        )
        if (discountAmount.greaterThan(eligibleSubtotal)) {
          discountAmount = new Decimal(eligibleSubtotal)
        }
        
        affectedItems = eligibleItems.map(i => i.productId)
        message = `$${promotion.discountValue.toFixed(2)} off each eligible item`
        break
      }
      
      case 'FREE_SHIPPING': {
        // Free shipping
        discountAmount = new Decimal(0) // Actual shipping discount applied separately
        freeShipping = true
        message = 'Free shipping'
        break
      }
      
      case 'BUY_X_GET_Y': {
        if (!promotion.buyQuantity || !promotion.getQuantity) {
          return null
        }
        
        // Sort eligible items by price (highest first to give best deal)
        const sortedItems = [...eligibleItems].sort((a, b) => b.unitPrice - a.unitPrice)
        
        // Calculate total eligible quantity
        const totalQty = sortedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        // Calculate how many "deals" can be applied
        const dealSize = promotion.buyQuantity + promotion.getQuantity
        const numDeals = Math.floor(totalQty / dealSize)
        
        if (numDeals === 0) {
          return null
        }
        
        // Calculate discount (discount on the "get" items)
        const discountPercent = promotion.getDiscountPercent || 100
        let discountedItems = 0
        let totalDiscount = new Decimal(0)
        
        // Apply discount to lowest-priced items first (customer gets best value)
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

  /**
   * Apply promotions to cart and calculate final totals
   */
  calculateDiscounts(
    promotions: Promotion[],
    context: PromotionContext
  ): DiscountCalculation {
    const appliedPromotions: AppliedPromotion[] = []
    const errors: string[] = []
    let discountTotal = new Decimal(0)
    let shippingDiscount = new Decimal(0)
    
    // Sort by priority (higher first), then by value (higher first for same priority)
    const sortedPromotions = [...promotions].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return b.discountValue - a.discountValue
    })
    
    for (const promotion of sortedPromotions) {
      // Validate with current applied discounts
      const contextWithApplied: PromotionContext = {
        ...context,
        currentDiscounts: appliedPromotions
      }
      
      const validation = this.validatePromotion(promotion, contextWithApplied)
      
      if (!validation.valid) {
        if (promotion.type === 'COUPON') {
          errors.push(`${promotion.code}: ${validation.error}`)
        }
        continue
      }
      
      // Calculate discount
      const applied = this.calculateDiscount(promotion, context)
      
      if (applied) {
        appliedPromotions.push(applied)
        
        if (applied.freeShipping && context.shippingTotal) {
          shippingDiscount = new Decimal(context.shippingTotal)
        } else {
          discountTotal = discountTotal.plus(applied.discountAmount)
        }
        
        // Check if non-stackable (stop after first)
        if (!promotion.stackable) {
          break
        }
      }
    }
    
    // Don't exceed subtotal
    if (discountTotal.greaterThan(context.subtotal)) {
      discountTotal = new Decimal(context.subtotal)
    }
    
    const finalSubtotal = new Decimal(context.subtotal)
      .minus(discountTotal)
      .toDecimalPlaces(2)
      .toNumber()
    
    return {
      success: true,
      appliedPromotions,
      subtotal: context.subtotal,
      discountTotal: discountTotal.toDecimalPlaces(2).toNumber(),
      shippingDiscount: shippingDiscount.toDecimalPlaces(2).toNumber(),
      finalSubtotal,
      errors
    }
  }
}

// ============================================================================
// PROMOTION BUILDER
// ============================================================================

export class PromotionBuilder {
  private promotion: Partial<Promotion>
  
  constructor(tenantId: string, name: string) {
    this.promotion = {
      id: generatePromotionId(),
      tenantId,
      name,
      type: 'COUPON',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      productIds: [],
      categoryIds: [],
      excludeProductIds: [],
      customerIds: [],
      firstOrderOnly: false,
      usageCount: 0,
      startsAt: new Date(),
      isActive: true,
      stackable: false,
      priority: 0
    }
  }

  /**
   * Set promotion type
   */
  setType(type: PromotionType): this {
    this.promotion.type = type
    return this
  }

  /**
   * Set coupon code
   */
  withCode(code: string): this {
    this.promotion.code = code.toUpperCase()
    return this
  }

  /**
   * Set percentage discount
   */
  percentageOff(percent: number, maxDiscount?: number): this {
    this.promotion.discountType = 'PERCENTAGE'
    this.promotion.discountValue = percent
    this.promotion.maxDiscount = maxDiscount
    return this
  }

  /**
   * Set fixed amount discount
   */
  fixedAmountOff(amount: number): this {
    this.promotion.discountType = 'FIXED_AMOUNT'
    this.promotion.discountValue = amount
    return this
  }

  /**
   * Set per-item discount
   */
  fixedPerItemOff(amount: number): this {
    this.promotion.discountType = 'FIXED_PER_ITEM'
    this.promotion.discountValue = amount
    return this
  }

  /**
   * Set free shipping
   */
  freeShipping(): this {
    this.promotion.discountType = 'FREE_SHIPPING'
    this.promotion.discountValue = 0
    return this
  }

  /**
   * Set buy X get Y deal
   */
  buyXGetY(buyQty: number, getQty: number, discountPercent: number = 100): this {
    this.promotion.discountType = 'BUY_X_GET_Y'
    this.promotion.discountValue = discountPercent
    this.promotion.buyQuantity = buyQty
    this.promotion.getQuantity = getQty
    this.promotion.getDiscountPercent = discountPercent
    return this
  }

  /**
   * Set minimum order total
   */
  minOrderTotal(amount: number): this {
    this.promotion.minOrderTotal = amount
    return this
  }

  /**
   * Set minimum quantity
   */
  minQuantity(qty: number): this {
    this.promotion.minQuantity = qty
    return this
  }

  /**
   * Restrict to specific products
   */
  forProducts(...productIds: string[]): this {
    this.promotion.productIds = productIds
    return this
  }

  /**
   * Restrict to specific categories
   */
  forCategories(...categoryIds: string[]): this {
    this.promotion.categoryIds = categoryIds
    return this
  }

  /**
   * Exclude specific products
   */
  excludeProducts(...productIds: string[]): this {
    this.promotion.excludeProductIds = productIds
    return this
  }

  /**
   * Restrict to specific customers
   */
  forCustomers(...customerIds: string[]): this {
    this.promotion.customerIds = customerIds
    return this
  }

  /**
   * First order only
   */
  firstOrderOnly(): this {
    this.promotion.firstOrderOnly = true
    return this
  }

  /**
   * Set usage limits
   */
  withUsageLimits(total?: number, perCustomer?: number): this {
    this.promotion.usageLimit = total
    this.promotion.perCustomerLimit = perCustomer
    return this
  }

  /**
   * Set validity period
   */
  validBetween(start: Date, end: Date): this {
    this.promotion.startsAt = start
    this.promotion.endsAt = end
    return this
  }

  /**
   * Set end date only
   */
  expiresAt(date: Date): this {
    this.promotion.endsAt = date
    return this
  }

  /**
   * Make stackable
   */
  stackable(priority: number = 0): this {
    this.promotion.stackable = true
    this.promotion.priority = priority
    return this
  }

  /**
   * Add description
   */
  withDescription(description: string): this {
    this.promotion.description = description
    return this
  }

  /**
   * Build the promotion
   */
  build(): Promotion {
    return this.promotion as Promotion
  }
}

// ============================================================================
// PROMOTIONS SERVICE
// ============================================================================

export class SVMPromotionsService {
  private engine: PromotionsEngine
  private promotionsStore: Map<string, Promotion[]> = new Map()  // tenantId -> promotions
  private usageStore: Map<string, PromotionUsage[]> = new Map()  // promotionId -> usages
  
  constructor() {
    this.engine = new PromotionsEngine()
  }

  /**
   * Get promotions for a tenant
   */
  getPromotions(tenantId: string): Promotion[] {
    return this.promotionsStore.get(tenantId) || []
  }

  /**
   * Get active promotions
   */
  getActivePromotions(tenantId: string): Promotion[] {
    const now = new Date()
    return this.getPromotions(tenantId).filter(p => 
      p.isActive && 
      p.startsAt <= now && 
      (!p.endsAt || p.endsAt > now) &&
      (!p.usageLimit || p.usageCount < p.usageLimit)
    )
  }

  /**
   * Get automatic promotions
   */
  getAutomaticPromotions(tenantId: string): Promotion[] {
    return this.getActivePromotions(tenantId).filter(p => 
      p.type === 'AUTOMATIC' || p.type === 'FLASH_SALE'
    )
  }

  /**
   * Find promotion by code
   */
  findByCode(tenantId: string, code: string): Promotion | null {
    const promotions = this.getActivePromotions(tenantId)
    return promotions.find(p => p.code?.toUpperCase() === code.toUpperCase()) || null
  }

  /**
   * Add a promotion
   */
  addPromotion(promotion: Promotion): void {
    const promotions = this.promotionsStore.get(promotion.tenantId) || []
    promotions.push(promotion)
    this.promotionsStore.set(promotion.tenantId, promotions)
  }

  /**
   * Update a promotion
   */
  updatePromotion(tenantId: string, promotionId: string, updates: Partial<Promotion>): Promotion | null {
    const promotions = this.promotionsStore.get(tenantId) || []
    const index = promotions.findIndex(p => p.id === promotionId)
    if (index < 0) return null
    
    promotions[index] = { ...promotions[index], ...updates }
    return promotions[index]
  }

  /**
   * Delete a promotion
   */
  deletePromotion(tenantId: string, promotionId: string): boolean {
    const promotions = this.promotionsStore.get(tenantId) || []
    const index = promotions.findIndex(p => p.id === promotionId)
    if (index < 0) return false
    
    promotions.splice(index, 1)
    return true
  }

  /**
   * Validate a coupon code
   */
  validateCoupon(
    tenantId: string, 
    code: string, 
    context: PromotionContext
  ): PromotionValidation {
    const promotion = this.findByCode(tenantId, code)
    
    if (!promotion) {
      return { valid: false, error: 'Invalid coupon code', errorCode: 'NOT_FOUND' }
    }
    
    const customerUsageCount = this.getCustomerUsageCount(promotion.id, context.customerId)
    return this.engine.validatePromotion(promotion, context, customerUsageCount)
  }

  /**
   * Calculate discounts for cart
   */
  calculateDiscounts(
    tenantId: string,
    context: PromotionContext,
    couponCodes: string[] = []
  ): DiscountCalculation {
    // Get automatic promotions
    const autoPromotions = this.getAutomaticPromotions(tenantId)
    
    // Get coupon promotions
    const couponPromotions = couponCodes
      .map(code => this.findByCode(tenantId, code))
      .filter((p): p is Promotion => p !== null)
    
    // Combine and calculate
    const allPromotions = [...autoPromotions, ...couponPromotions]
    return this.engine.calculateDiscounts(allPromotions, context)
  }

  /**
   * Record promotion usage
   */
  recordUsage(
    promotionId: string,
    orderId: string,
    customerId: string | undefined,
    discountApplied: number
  ): PromotionUsage {
    const usage: PromotionUsage = {
      id: generatePromotionId('usage'),
      promotionId,
      orderId,
      customerId,
      discountApplied,
      createdAt: new Date()
    }
    
    // Store usage
    const usages = this.usageStore.get(promotionId) || []
    usages.push(usage)
    this.usageStore.set(promotionId, usages)
    
    // Increment usage count on promotion
    for (const [tenantId, promotions] of this.promotionsStore) {
      const promotion = promotions.find(p => p.id === promotionId)
      if (promotion) {
        promotion.usageCount++
        break
      }
    }
    
    return usage
  }

  /**
   * Get customer usage count for a promotion
   */
  getCustomerUsageCount(promotionId: string, customerId?: string): number {
    if (!customerId) return 0
    
    const usages = this.usageStore.get(promotionId) || []
    return usages.filter(u => u.customerId === customerId).length
  }

  /**
   * Create sample promotions for a tenant
   */
  createSamplePromotions(tenantId: string): Promotion[] {
    const promotions: Promotion[] = [
      // Welcome discount
      new PromotionBuilder(tenantId, 'Welcome Discount')
        .withCode('WELCOME10')
        .percentageOff(10)
        .firstOrderOnly()
        .withDescription('10% off your first order')
        .build(),
      
      // Summer sale (automatic)
      new PromotionBuilder(tenantId, 'Summer Sale')
        .setType('AUTOMATIC')
        .percentageOff(15, 50) // 15% off, max $50
        .minOrderTotal(100)
        .stackable(10)
        .withDescription('15% off orders over $100')
        .build(),
      
      // Free shipping
      new PromotionBuilder(tenantId, 'Free Shipping')
        .withCode('FREESHIP')
        .freeShipping()
        .minOrderTotal(50)
        .withDescription('Free shipping on orders over $50')
        .build(),
      
      // BOGO deal
      new PromotionBuilder(tenantId, 'Buy 2 Get 1 Free')
        .withCode('BOGO')
        .buyXGetY(2, 1, 100)
        .withDescription('Buy any 2 items, get 1 free')
        .build(),
      
      // Fixed amount off
      new PromotionBuilder(tenantId, '$20 Off')
        .withCode('SAVE20')
        .fixedAmountOff(20)
        .minOrderTotal(75)
        .withUsageLimits(100, 1)
        .withDescription('$20 off orders over $75 (limit 100 uses)')
        .build()
    ]
    
    promotions.forEach(p => this.addPromotion(p))
    return promotions
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generatePromotionId(prefix: string = 'promo'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}${random}`
}

/**
 * Format discount for display
 */
export function formatDiscount(promotion: Promotion): string {
  switch (promotion.discountType) {
    case 'PERCENTAGE':
      return `${promotion.discountValue}% off`
    case 'FIXED_AMOUNT':
      return `$${promotion.discountValue.toFixed(2)} off`
    case 'FIXED_PER_ITEM':
      return `$${promotion.discountValue.toFixed(2)} off each item`
    case 'FREE_SHIPPING':
      return 'Free shipping'
    case 'BUY_X_GET_Y':
      const getDesc = promotion.getDiscountPercent === 100 ? 'free' : `${promotion.getDiscountPercent}% off`
      return `Buy ${promotion.buyQuantity} get ${promotion.getQuantity} ${getDesc}`
    default:
      return ''
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let promotionsServiceInstance: SVMPromotionsService | null = null

export function getPromotionsService(): SVMPromotionsService {
  if (!promotionsServiceInstance) {
    promotionsServiceInstance = new SVMPromotionsService()
  }
  return promotionsServiceInstance
}
