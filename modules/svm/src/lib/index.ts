/**
 * SVM Module - Public API
 * 
 * Single Vendor Marketplace Module
 * 
 * This module owns:
 * - Online Orders
 * - Shipping Rules
 * - Promotions
 * - Reviews
 * - Storefront CMS
 * 
 * This module does NOT own:
 * - Products (reads from Core)
 * - Inventory (reads from Core)
 * - Customers (references Core)
 * - Payments (processed by Core)
 */

// Product Consumer (READ-ONLY)
export {
  SVMProductService,
  InMemoryProductCache,
  getStockStatus,
  formatPrice,
  isInStock,
  getLowestPrice,
  getPriceRange,
  type CoreProduct,
  type CoreProductVariant,
  type ProductImage,
  type ProductOption,
  type CoreInventoryLevel,
  type StockStatus,
  type AvailabilityResult,
  type AvailabilityCheckItem,
  type CoreCatalogService,
  type ListProductsOptions,
  type SearchOptions,
  type ProductListResult,
  type ProductCategory,
  type ProductCache,
  type CachedProduct,
  type CachedList
} from './product-consumer'

// Inventory Consumer (READ-ONLY)
export {
  SVMInventoryService,
  OfflineAwareInventoryService,
  type CoreInventoryService,
  type ReservationItem,
  type ReservationResult,
  type InventoryDisplay,
  type CartAvailabilityItem,
  type CartAvailabilityResult,
  type UnavailableItem,
  type OfflineInventoryStore
} from './inventory-consumer'

// Order Engine
export {
  OrderEngine,
  canTransition,
  getValidTransitions,
  isTerminalState,
  canCancel,
  canRefund,
  generateId,
  generateEventId,
  generateOrderNumber,
  ORDER_TRANSITIONS,
  type OrderState,
  type OrderEventType,
  type OrderEvent,
  type OrderCreatedEvent,
  type OrderPlacedEvent,
  type PaymentRequestedEvent,
  type OrderPaidEvent,
  type OrderShippedEvent,
  type OrderDeliveredEvent,
  type OrderCancelledEvent,
  type RefundRequestedEvent,
  type OrderRefundedEvent,
  type OrderStatusChangedEvent,
  type OrderItemSnapshot,
  type ShippingAddress,
  type OrderEngineConfig,
  type OrderEventEmitter,
  type OrderData,
  type CreateOrderInput
} from './order-engine'

// Shipping Engine
export {
  ShippingEngine,
  ShippingRuleBuilder,
  SVMShippingService,
  getShippingService,
  formatDeliveryEstimate,
  getEstimatedDeliveryDate,
  type ShippingZone,
  type ShippingRate,
  type ShippingRateType,
  type ShippingDestination,
  type ShippingCartItem,
  type ShippingCalculationRequest,
  type ShippingOption,
  type ShippingCalculationResult
} from './shipping-engine'

// Promotions Engine
export {
  PromotionsEngine,
  PromotionBuilder,
  SVMPromotionsService,
  getPromotionsService,
  formatDiscount,
  type Promotion,
  type PromotionType,
  type DiscountType,
  type PromotionUsage,
  type PromotionCartItem,
  type PromotionContext,
  type AppliedPromotion,
  type PromotionValidation,
  type PromotionErrorCode,
  type DiscountCalculation
} from './promotions-engine'

// Offline Behavior
export {
  // Action classification
  OFFLINE_SAFE_ACTIONS,
  ONLINE_REQUIRED_ACTIONS,
  QUEUEABLE_ACTIONS,
  
  // Connectivity
  isOnline,
  getNetworkInfo,
  getConnectionStatus,
  validateAction,
  ConnectivityListener,
  
  // Offline cart
  OfflineCartManager,
  
  // Offline queue
  OfflineQueue,
  
  // Cache configs
  CACHE_CONFIGS,
  STORAGE_KEYS,
  OFFLINE_MESSAGES,
  
  // Types
  type OfflineSafeAction,
  type OnlineRequiredAction,
  type MarketplaceAction,
  type ConnectionStatus,
  type ConnectivityState,
  type ActionValidation,
  type QueuedAction,
  type CacheStrategy,
  type CacheConfig,
  type OfflineMessage,
  type OfflineCartItem,
  type OfflineCart,
  type ConnectivityCallback
} from './offline-behavior'

// Event Bus
export {
  SVM_EVENT_TYPES,
  SVMEventEmitter,
  initEventEmitter,
  getEventEmitter,
  emitEvent,
  generateIdempotencyKey,
  generateUniqueIdempotencyKey,
  createOrderPlacedEvent,
  createOrderPaidEvent,
  createOrderFulfilledEvent,
  createOrderCancelledEvent,
  createCartItemAddedEvent,
  createProductViewedEvent,
  type SVMEventType,
  type SVMEventBase,
  type SVMEventEmitterConfig,
  type OrderPlacedPayload,
  type OrderPaidPayload,
  type OrderFulfilledPayload,
  type OrderCancelledPayload,
  type CartItemAddedPayload,
  type CartAbandonedPayload,
  type ProductViewedPayload,
  type PromotionAppliedPayload,
  type ReviewSubmittedPayload
} from './event-bus'

// Entitlements
export {
  SVMEntitlementService,
  initEntitlementService,
  getEntitlementService,
  checkEntitlement,
  SVM_ENTITLEMENT_FEATURES,
  SVM_ENTITLEMENT_LIMITS,
  type SVMEntitlements,
  type SVMFeature,
  type SVMLimitKey,
  type EntitlementCheckResult,
  type LimitCheckResult,
  type FeatureCheckResult,
  type SVMEntitlementServiceConfig
} from './entitlements'
