/**
 * POS Module - Public API
 * 
 * This is the entry point for the POS module.
 * Only exports that should be used by other modules/Core are exposed here.
 */

// Sale Engine
export {
  SaleEngine,
  type SaleStatus,
  type PaymentMethod,
  type DiscountType,
  type DiscountScope,
  type CreateSaleInput,
  type AddItemInput,
  type ApplyDiscountInput,
  type AddPaymentInput,
  type SuspendSaleInput,
  type VoidSaleInput,
  type SaleState,
  type LineItemState,
  type DiscountState,
  type PaymentState,
  // Event types
  type POSEvent,
  type SaleCreatedEvent,
  type SaleItemAddedEvent,
  type SaleItemRemovedEvent,
  type SaleItemUpdatedEvent,
  type SaleDiscountAppliedEvent,
  type SaleDiscountRemovedEvent,
  type SalePaymentAddedEvent,
  type SalePaymentFailedEvent,
  type SaleSuspendedEvent,
  type SaleResumedEvent,
  type SaleCompletedEvent,
  type SaleVoidedEvent,
  type InventoryReservationRequestedEvent,
  type InventoryDeductionRequestedEvent,
  type InventoryReleaseRequestedEvent,
  // State machine helpers
  canTransition,
  getValidTransitions,
  VALID_TRANSITIONS,
  generateId
} from './sale-engine'

// Event Bus
export {
  posEventBus,
  createEventEmitter,
  registerCoreSubscriber,
  type EventHandler,
  type CoreEventSubscriber
} from './event-bus'

// Offline Queue
export {
  OfflineQueue,
  OfflineSaleManager,
  OfflineSyncService,
  OFFLINE_SAFE_ACTIONS,
  ONLINE_REQUIRED_ACTIONS,
  OFFLINE_PAYMENT_METHODS,
  QUEUED_PAYMENT_METHODS,
  generateOfflineId,
  generateIdempotencyKey,
  type OfflineAction,
  type OfflineActionType,
  type OfflineActionStatus,
  type ConflictData,
  type ConflictType,
  type ConflictResolution,
  type OfflineStorage,
  type QueueStats,
  type SyncResult,
  type SyncHandler
} from './offline-queue'

// Inventory Consumer (READ-ONLY)
export {
  POSInventoryService,
  type ProductInventory,
  type InventoryCheckResult,
  type InventoryStatus,
  type BatchInventoryCheck,
  type BatchInventoryResult,
  type InventoryReader,
  // Inventory events
  type POSInventoryEvent,
  type InventoryDeductEvent,
  type InventoryRestoreEvent,
  type InventoryReserveEvent,
  type InventoryReleaseReservationEvent,
  type InventorySnapshotRequestEvent,
  generateEventId
} from './inventory-consumer'
