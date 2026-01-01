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
