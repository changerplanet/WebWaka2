/**
 * COMMERCE RULES ENGINE
 * Pricing Rules Module
 * 
 * CANONICAL WRAPPER - S2-S3
 * 
 * Re-exports B2B pricing service with unified interface.
 * 
 * @module lib/rules/pricing
 */

// Re-export B2B pricing service
export {
  B2BPricingService,
  type PriceTier,
  type PriceRule,
  type ResolvedPrice
} from '../b2b/pricing-service'

// Import for aliasing
import { B2BPricingService as _B2BPricingService } from '../b2b/pricing-service'

// Canonical aliases
export const PricingRulesService = _B2BPricingService
export type { PriceTier as PricingTier } from '../b2b/pricing-service'
export type { PriceRule as PricingRule } from '../b2b/pricing-service'
export type { ResolvedPrice as PricingResult } from '../b2b/pricing-service'
