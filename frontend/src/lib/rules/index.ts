/**
 * COMMERCE RULES ENGINE
 * Main Entry Point
 * 
 * CANONICAL NAMESPACE - S2-S3
 * 
 * This is the single canonical entry point for all Commerce Rules.
 * All rule engines are re-exported from their respective modules.
 * 
 * Usage:
 * ```ts
 * import { CommissionEngine, PricingRulesService, applyPromotionsToCart } from '@/lib/rules'
 * ```
 * 
 * @module lib/rules
 */

// =============================================================================
// COMMISSION RULES
// Partner commission calculation
// =============================================================================
export {
  CommissionEngine,
  CommissionCalculator,
  type CommissionRule,
  type CommissionRuleConfig,
  type CommissionTier,
  type CommissionCalculation,
  type CommissionResult,
  type CommissionType,
  type TierType
} from './commission'

// =============================================================================
// PRICING RULES
// B2B wholesale pricing, tiers, quantity breaks
// =============================================================================
export {
  B2BPricingService,
  PricingRulesService,
  type PriceTier,
  type PricingTier,
  type PriceRule,
  type PricingRule,
  type ResolvedPrice,
  type PricingResult
} from './pricing'

// =============================================================================
// PROMOTION RULES
// Coupons, flash sales, buy-x-get-y, automatic discounts
// =============================================================================
export {
  // Types
  type Promotion,
  type PromotionRule,
  type PromotionType,
  type DiscountType,
  type PromotionUsage,
  type PromotionCartItem,
  type AppliedPromotion,
  type PromotionResult,
  
  // CRUD
  createPromotion,
  createPromotionRule,
  getPromotion,
  getPromotionRule,
  updatePromotion,
  updatePromotionRule,
  deletePromotion,
  deletePromotionRule,
  listPromotions,
  listPromotionRules,
  
  // Application
  getActivePromotions,
  validatePromoCode,
  applyPromotionsToCart,
  recordPromotionUsage,
  getPromotionUsageStats
} from './promotions'

// =============================================================================
// INVENTORY RULES
// Reorder thresholds, auto-replenishment
// =============================================================================
export {
  ReorderRuleService,
  InventoryRulesService,
  ReorderSuggestionEngine,
  InventoryReorderEngine
} from './inventory'

// =============================================================================
// DISCOUNT RULES
// Billing-side discounts, promo codes
// =============================================================================
export {
  createDiscountRule,
  getDiscountRule,
  getDiscountByCode,
  listDiscountRules,
  updateDiscountRule,
  deleteDiscountRule,
  validateDiscountCode,
  applyDiscountToOrder,
  getDiscountUsageStats,
  type DiscountRule,
  type DiscountResult
} from './discounts'

// =============================================================================
// RULE CATEGORIES (For Discovery)
// =============================================================================
export const RULE_CATEGORIES = {
  COMMISSION: {
    id: 'commission',
    name: 'Commission Rules',
    description: 'Partner commission calculation (percentage, fixed, tiered)',
    module: 'commission'
  },
  PRICING: {
    id: 'pricing',
    name: 'Pricing Rules',
    description: 'B2B wholesale pricing, tiers, quantity breaks',
    module: 'pricing'
  },
  PROMOTIONS: {
    id: 'promotions',
    name: 'Promotion Rules',
    description: 'Coupons, flash sales, buy-x-get-y, automatic discounts',
    module: 'promotions'
  },
  INVENTORY: {
    id: 'inventory',
    name: 'Inventory Rules',
    description: 'Reorder thresholds, auto-replenishment triggers',
    module: 'inventory'
  },
  DISCOUNTS: {
    id: 'discounts',
    name: 'Discount Rules',
    description: 'Billing-side discounts, promo codes',
    module: 'discounts'
  }
} as const

export type RuleCategory = keyof typeof RULE_CATEGORIES
