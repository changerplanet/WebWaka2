/**
 * COMMERCE RULES ENGINE
 * Promotions Rules Module
 * 
 * CANONICAL WRAPPER - S2-S3
 * 
 * Re-exports SVM promotions engine with unified interface.
 * 
 * @module lib/rules/promotions
 */

// Re-export promotions storage (the actual engine)
export {
  // Types
  type Promotion,
  type PromotionType,
  type DiscountType,
  type PromotionUsage,
  type PromotionCartItem,
  type AppliedPromotion,
  
  // CRUD Operations - Note: addPromotion is the actual export, aliased here for consistency
  addPromotion as createPromotion,
  getPromotion,
  updatePromotion,
  deletePromotion,
  getPromotions as listPromotions,
  
  // Promotion Application
  getActivePromotions,
  validatePromotion,
  calculateDiscount,
  getEligibleItems,
  recordUsage as recordPromotionUsage,
  getCustomerUsageCount as getPromotionUsageStats
} from '../promotions-storage'

// Create applyPromotionsToCart as a convenience wrapper
import { 
  getActivePromotions as _getActivePromotions,
  calculateDiscount as _calculateDiscount,
  getPromotions as _getPromotions,
  validatePromotion as _validatePromotion,
  type Promotion as _Promotion,
  type PromotionCartItem as _PromotionCartItem,
  type AppliedPromotion as _AppliedPromotion
} from '../promotions-storage'

// Validate a promo code by string
export async function validatePromoCode(
  tenantId: string,
  code: string,
  cartTotal: number = 0,
  customerId?: string
): Promise<{ valid: boolean; error?: string; promotion?: _Promotion }> {
  // Get active promotions for tenant
  const promotions = await _getActivePromotions(tenantId)
  
  // Find promotion by code
  const promotion = promotions.find((p: any) => p.code?.toLowerCase() === code.toLowerCase())
  
  if (!promotion) {
    return { valid: false, error: 'Invalid promo code' }
  }
  
  // Validate the promotion
  const result = await _validatePromotion(promotion, cartTotal, 1, customerId)
  
  if (!result.valid) {
    return { valid: false, error: result.error }
  }
  
  return { valid: true, promotion }
}

export async function applyPromotionsToCart(
  tenantId: string,
  items: _PromotionCartItem[],
  subtotal: number,
  shippingTotal?: number
): Promise<_AppliedPromotion[]> {
  const activePromotions = await _getActivePromotions(tenantId)
  const applied: _AppliedPromotion[] = []
  
  for (const promo of activePromotions) {
    const result = _calculateDiscount(promo, items, subtotal, shippingTotal)
    if (result) {
      applied.push(result)
    }
  }
  
  return applied
}

// Canonical aliases for consistent naming
export { addPromotion as createPromotionRule } from '../promotions-storage'
export { getPromotion as getPromotionRule } from '../promotions-storage'
export { updatePromotion as updatePromotionRule } from '../promotions-storage'
export { deletePromotion as deletePromotionRule } from '../promotions-storage'
export { getPromotions as listPromotionRules } from '../promotions-storage'
export type { Promotion as PromotionRule }
export type { AppliedPromotion as PromotionResult }
