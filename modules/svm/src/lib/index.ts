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
