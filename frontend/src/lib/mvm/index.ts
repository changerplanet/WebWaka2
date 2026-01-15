/**
 * MVM (Multi-Vendor Marketplace) Suite - Service Index
 * 
 * Canonical exports for all MVM domain services.
 * 
 * @module lib/mvm
 * @canonical PC-SCP Phase S3
 * @version 1.0.0
 * 
 * Nigeria-First Features:
 * - NGN currency defaults
 * - 7.5% VAT (Nigerian standard)
 * - Nigerian bank details support
 * - Bi-weekly payout cycles
 * - ₦5,000 minimum payout threshold
 */

// ============================================================================
// VENDOR MANAGEMENT
// ============================================================================

export { VendorService } from './vendor-service'
export type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorListFilters,
  VendorListResult,
  VendorSummary
} from './vendor-service'

export { VendorStatusService } from './vendor-status-service'
export type { StatusTransitionResult } from './vendor-status-service'

export { VendorOnboardingService } from './vendor-onboarding-service'
export type { 
  OnboardingStatus, 
  StepRequirements 
} from './vendor-onboarding-service'

export { VendorTierService } from './vendor-tier-service'
export type {
  CreateTierInput,
  UpdateTierInput,
  TierQualification
} from './vendor-tier-service'

// ============================================================================
// PRODUCT MAPPING
// ============================================================================

export { ProductMappingService } from './product-mapping-service'
export type {
  CreateProductMappingInput,
  UpdateProductMappingInput,
  ProductMappingListFilters,
  PricingValidationResult
} from './product-mapping-service'

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export { OrderSplitService } from './order-split-service'
export type {
  CreateParentOrderInput,
  ShippingAddress,
  ParentOrderItemInput,
  SubOrderSummary
} from './order-split-service'

export { SubOrderService } from './sub-order-service'
export type { ShippingInfo } from './sub-order-service'

// ============================================================================
// FINANCIAL SERVICES
// ============================================================================

export { CommissionService } from './commission-service'
export type {
  CommissionCalculation,
  CommissionListFilters,
  CommissionSummary
} from './commission-service'

export { PayoutService } from './payout-service'
export type {
  CreatePayoutInput,
  PayoutListFilters,
  PayoutEligibility
} from './payout-service'

// ============================================================================
// MARKETPLACE CONFIGURATION
// ============================================================================

export { MarketplaceConfigService } from './marketplace-config-service'
export type {
  UpdateMarketplaceConfigInput,
  MarketplaceConfigSummary
} from './marketplace-config-service'

// ============================================================================
// VENDOR RATINGS (Wave G1)
// ============================================================================

export { VendorRatingService } from './vendor-rating-service'
export type {
  SubmitRatingInput,
  VendorRatingResult,
  RatingSummary,
  RatingListFilters,
  RatingListResult,
  ScoreBand
} from './vendor-rating-service'

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// All services bundled for single import
export const MVM = {
  Vendor: () => import('./vendor-service').then(m => m.VendorService),
  VendorStatus: () => import('./vendor-status-service').then(m => m.VendorStatusService),
  VendorOnboarding: () => import('./vendor-onboarding-service').then(m => m.VendorOnboardingService),
  VendorTier: () => import('./vendor-tier-service').then(m => m.VendorTierService),
  VendorRating: () => import('./vendor-rating-service').then(m => m.VendorRatingService),
  ProductMapping: () => import('./product-mapping-service').then(m => m.ProductMappingService),
  OrderSplit: () => import('./order-split-service').then(m => m.OrderSplitService),
  SubOrder: () => import('./sub-order-service').then(m => m.SubOrderService),
  Commission: () => import('./commission-service').then(m => m.CommissionService),
  Payout: () => import('./payout-service').then(m => m.PayoutService),
  MarketplaceConfig: () => import('./marketplace-config-service').then(m => m.MarketplaceConfigService)
}
