/**
 * MVM Module - Public API
 * 
 * Multi Vendor Marketplace module exports.
 * 
 * RULES:
 * - This module EXTENDS Single Vendor Marketplace
 * - No duplication of SVM storefront or order logic
 * - No Core schema modifications
 * - No billing or subscription logic
 * - Vendors are NOT tenants
 */

// Vendor Engine
export {
  VendorEngine,
  ProductMappingEngine,
  VendorTierEngine,
  type VendorStatus,
  type VendorStaffRole,
  type OnboardingStep,
  type VendorProfile,
  type VendorAddress,
  type VendorStaffMember,
  type CreateVendorInput,
  type UpdateVendorInput,
  type VendorProductMappingInput,
  type ProductMapping,
  type VendorTier
} from './vendor-engine'

// Order Splitting Engine
export {
  OrderSplittingEngine,
  type VendorSubOrderStatus,
  type OrderLineItem,
  type ParentOrder,
  type ShippingAddress,
  type VendorSubOrder,
  type VendorSubOrderItem,
  type CommissionConfig,
  type SplitResult,
  type OrderSplitEvent
} from './order-splitter'

// Commission Engine
export {
  CommissionEngine,
  type CommissionRuleType,
  type CommissionCalculation,
  type CommissionRule,
  type TieredRate,
  type CommissionContext,
  type CommissionResult,
  type BulkCommissionResult
} from './commission-engine'

// Vendor Dashboard
export {
  VendorDataAccess,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type VendorDashboardOverview,
  type VendorOrdersView,
  type VendorOrderSummary,
  type VendorOrderDetail,
  type VendorProductsView,
  type VendorProductSummary,
  type VendorEarningsView,
  type VendorPerformanceView,
  type VendorNotificationPreferences
} from './vendor-dashboard'

// Event Bus
export {
  MVM_EVENT_TYPES,
  MVMEventEmitter,
  initMVMEventEmitter,
  getMVMEventEmitter,
  emitMVMEvent,
  generateIdempotencyKey,
  createVendorOnboardedEvent,
  createVendorOrderReceivedEvent,
  createVendorOrderFulfilledEvent,
  createCommissionEarnedEvent,
  type MVMEventType,
  type MVMEventBase,
  type MVMEventEmitterConfig,
  type VendorOnboardedPayload,
  type VendorOrderReceivedPayload,
  type VendorOrderFulfilledPayload,
  type CommissionEarnedPayload,
  type OrderSplitPayload,
  type SubOrderCreatedPayload,
  type PayoutReadyPayload
} from './event-bus'

// Entitlements
export {
  MVMEntitlementService,
  initMVMEntitlementService,
  getMVMEntitlementService,
  checkMVMEntitlement,
  MVMEntitlementError,
  MVM_ENTITLEMENT_FEATURES,
  MVM_ENTITLEMENT_LIMITS,
  DEFAULT_MVM_ENTITLEMENTS,
  type MVMEntitlements,
  type MVMFeature,
  type MVMLimitKey,
  type EntitlementCheckResult,
  type LimitCheckResult,
  type FeatureCheckResult,
  type MVMEntitlementServiceConfig
} from './entitlements'

// Offline Behavior
export {
  MVMConnectivityChecker,
  getMVMConnectivityChecker,
  OFFLINE_SAFE_ACTIONS,
  ONLINE_REQUIRED_ACTIONS,
  OFFLINE_MESSAGES,
  MVM_CACHE_STRATEGIES,
  type OfflineSafeAction,
  type OnlineRequiredAction,
  type MVMAction,
  type OfflineState,
  type QueuedAction
} from './offline-behavior'
