/**
 * MODULE 9: B2B & WHOLESALE
 * Pricing Service
 * 
 * PHASE 3: Wholesale Pricing & Tiers
 * 
 * CRITICAL: Pricing is resolved at order time.
 * No price mutation in Core products.
 */

import { prisma } from '@/lib/prisma'
import { B2BPriceType, B2BDiscountType } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface PriceTier {
  id: string
  tenantId: string
  name: string
  code: string
  description: string | null
  defaultDiscount: number
  discountType: B2BDiscountType
  minOrderValue: number
  minOrderQuantity: number
  priority: number
  isActive: boolean
}

export interface PriceRule {
  id: string
  tenantId: string
  name: string
  description: string | null
  productId: string | null
  categoryId: string | null
  priceTierId: string | null
  priceType: B2BPriceType
  value: number
  quantityBreaks: Array<{ minQty: number; discount: number }> | null
  validFrom: Date | null
  validTo: Date | null
  priority: number
  isActive: boolean
}

export interface ResolvedPrice {
  originalPrice: number
  wholesalePrice: number
  discount: number
  discountPercent: number
  appliedRule: string | null
  appliedTier: string | null
  quantityBreakApplied: boolean
}

// ============================================================================
// SERVICE
// ============================================================================

export class B2BPricingService {
  /**
   * Resolve wholesale price for a product
   */
  static async resolvePrice(
    tenantId: string,
    productId: string,
    quantity: number,
    options?: {
      customerId?: string
      priceTierId?: string
      categoryId?: string
    }
  ): Promise<ResolvedPrice> {
    // Get product's base price
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true, categoryId: true },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const originalPrice = product.price?.toNumber() || 0
    const categoryId = options?.categoryId || product.categoryId

    // Get customer's price tier if provided
    let tierId = options?.priceTierId
    if (!tierId && options?.customerId) {
      const profile = await prisma.b2b_customer_profiles.findFirst({
        where: { tenantId, customerId: options.customerId },
        select: { priceTierId: true },
      })
      tierId = profile?.priceTierId || undefined
    }

    // Find applicable price rules (ordered by priority)
    const rules = await prisma.b2b_wholesale_price_rules.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { productId },
          { categoryId },
          { productId: null, categoryId: null }, // Global rules
        ],
        AND: [
          { OR: [{ priceTierId: tierId }, { priceTierId: null }] },
          { OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }] },
          { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { productId: 'desc' }, // Product-specific rules take precedence
      ],
    })

    // Get tier's default discount
    let tierDiscount = 0
    let tierName: string | null = null
    if (tierId) {
      const tier = await prisma.b2b_price_tiers.findUnique({
        where: { id: tierId },
        select: { name: true, defaultDiscount: true },
      })
      if (tier) {
        tierDiscount = tier.defaultDiscount.toNumber()
        tierName = tier.name
      }
    }

    // Calculate best price
    let bestDiscount = tierDiscount
    let appliedRule: string | null = null
    let quantityBreakApplied = false

    for (const rule of rules) {
      let ruleDiscount = 0

      if (rule.priceType === 'DISCOUNT_PERCENTAGE') {
        ruleDiscount = rule.value.toNumber()
      } else if (rule.priceType === 'DISCOUNT_AMOUNT') {
        ruleDiscount = (rule.value.toNumber() / originalPrice) * 100
      } else if (rule.priceType === 'FIXED_PRICE') {
        ruleDiscount = ((originalPrice - rule.value.toNumber()) / originalPrice) * 100
      } else if (rule.priceType === 'TIERED_PRICE' && rule.quantityBreaks) {
        // Find applicable quantity break
        const breaks = rule.quantityBreaks as Array<{ minQty: number; discount: number }>
        const applicableBreak = breaks
          .filter(b => quantity >= b.minQty)
          .sort((a, b) => b.minQty - a.minQty)[0]
        
        if (applicableBreak) {
          ruleDiscount = applicableBreak.discount
          quantityBreakApplied = true
        }
      }

      if (ruleDiscount > bestDiscount) {
        bestDiscount = ruleDiscount
        appliedRule = rule.name
      }
    }

    const discount = (originalPrice * bestDiscount) / 100
    const wholesalePrice = originalPrice - discount

    return {
      originalPrice,
      wholesalePrice: Math.max(0, wholesalePrice),
      discount,
      discountPercent: bestDiscount,
      appliedRule,
      appliedTier: tierName,
      quantityBreakApplied,
    }
  }

  /**
   * List price tiers
   */
  static async listPriceTiers(
    tenantId: string,
    activeOnly: boolean = true
  ): Promise<PriceTier[]> {
    const tiers = await prisma.b2b_price_tiers.findMany({
      where: {
        tenantId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { priority: 'asc' },
    })

    return tiers.map(t => ({
      id: t.id,
      tenantId: t.tenantId,
      name: t.name,
      code: t.code,
      description: t.description,
      defaultDiscount: t.defaultDiscount.toNumber(),
      discountType: t.discountType,
      minOrderValue: t.minOrderValue.toNumber(),
      minOrderQuantity: t.minOrderQuantity,
      priority: t.priority,
      isActive: t.isActive,
    }))
  }

  /**
   * Create price tier
   */
  static async createPriceTier(
    tenantId: string,
    input: {
      name: string
      code: string
      description?: string
      defaultDiscount: number
      minOrderValue?: number
      minOrderQuantity?: number
      priority?: number
    }
  ): Promise<PriceTier> {
    const tier = await prisma.b2b_price_tiers.create({
      data: withPrismaDefaults({
        tenantId,
        name: input.name,
        code: input.code,
        description: input.description,
        defaultDiscount: input.defaultDiscount,
        minOrderValue: input.minOrderValue || 0,
        minOrderQuantity: input.minOrderQuantity || 1,
        priority: input.priority || 0,
      }),
    })

    return {
      id: tier.id,
      tenantId: tier.tenantId,
      name: tier.name,
      code: tier.code,
      description: tier.description,
      defaultDiscount: tier.defaultDiscount.toNumber(),
      discountType: tier.discountType,
      minOrderValue: tier.minOrderValue.toNumber(),
      minOrderQuantity: tier.minOrderQuantity,
      priority: tier.priority,
      isActive: tier.isActive,
    }
  }

  /**
   * List price rules
   */
  static async listPriceRules(
    tenantId: string,
    options?: {
      productId?: string
      categoryId?: string
      priceTierId?: string
      activeOnly?: boolean
    }
  ): Promise<PriceRule[]> {
    const rules = await prisma.b2b_wholesale_price_rules.findMany({
      where: {
        tenantId,
        ...(options?.productId && { productId: options.productId }),
        ...(options?.categoryId && { categoryId: options.categoryId }),
        ...(options?.priceTierId && { priceTierId: options.priceTierId }),
        ...(options?.activeOnly !== false && { isActive: true }),
      },
      orderBy: { priority: 'desc' },
    })

    return rules.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      description: r.description,
      productId: r.productId,
      categoryId: r.categoryId,
      priceTierId: r.priceTierId,
      priceType: r.priceType,
      value: r.value.toNumber(),
      quantityBreaks: r.quantityBreaks as Array<{ minQty: number; discount: number }> | null,
      validFrom: r.validFrom,
      validTo: r.validTo,
      priority: r.priority,
      isActive: r.isActive,
    }))
  }

  /**
   * Create price rule
   */
  static async createPriceRule(
    tenantId: string,
    input: {
      name: string
      description?: string
      productId?: string
      categoryId?: string
      priceTierId?: string
      priceType: B2BPriceType
      value: number
      quantityBreaks?: Array<{ minQty: number; discount: number }>
      validFrom?: Date
      validTo?: Date
      priority?: number
    },
    createdBy?: string
  ): Promise<PriceRule> {
    const rule = await prisma.b2b_wholesale_price_rules.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        productId: input.productId,
        categoryId: input.categoryId,
        priceTierId: input.priceTierId,
        priceType: input.priceType,
        value: input.value,
        quantityBreaks: input.quantityBreaks || undefined,
        validFrom: input.validFrom,
        validTo: input.validTo,
        priority: input.priority || 0,
        createdBy,
      },
    })

    return {
      id: rule.id,
      tenantId: rule.tenantId,
      name: rule.name,
      description: rule.description,
      productId: rule.productId,
      categoryId: rule.categoryId,
      priceTierId: rule.priceTierId,
      priceType: rule.priceType,
      value: rule.value.toNumber(),
      quantityBreaks: rule.quantityBreaks as Array<{ minQty: number; discount: number }> | null,
      validFrom: rule.validFrom,
      validTo: rule.validTo,
      priority: rule.priority,
      isActive: rule.isActive,
    }
  }
}
