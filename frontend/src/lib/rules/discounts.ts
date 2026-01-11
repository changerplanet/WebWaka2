/**
 * COMMERCE RULES ENGINE
 * Discount Rules Module
 * 
 * CANONICAL WRAPPER - S2-S3
 * 
 * Re-exports billing discount service.
 * 
 * @module lib/rules/discounts
 */

// Re-export from billing discount service
export {
  createDiscountRule,
  getDiscountRule,
  getDiscountByCode,
  listDiscountRules,
  deactivateDiscountRule,
  validateDiscount,
  calculateDiscount,
  recordDiscountUsage,
  getPartnerDiscounts,
  createPartnerDiscount
} from '../billing/discount-service'

// Type alias for canonical naming
export type DiscountRule = {
  id: string
  tenantId: string | null
  name: string
  code: string | null
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  planIds: string[]
  moduleIds: string[]
  partnerId: string | null
  maxUses: number | null
  maxUsesPerTenant: number | null
  currentUses: number
  validFrom: Date | null
  validTo: Date | null
  minOrderValue: number | null
  firstTimeOnly: boolean
  isActive: boolean
  createdAt: Date
}

export type DiscountResult = {
  success: boolean
  discount?: number
  discountedTotal?: number
  ruleApplied?: string
  error?: string
}
