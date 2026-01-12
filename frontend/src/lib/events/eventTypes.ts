/**
 * EVENT TYPE SYSTEM
 * =================
 * 
 * Discriminated union types for all module event systems.
 * Provides type-safe event routing without unsafe casts.
 * 
 * ARCHITECTURE:
 * - Each module (POS, SVM, MVM) has its own event discriminated union
 * - The `eventType` field serves as the discriminant
 * - Type guards enable narrowing in switch statements
 * 
 * USAGE:
 * ```typescript
 * function handleEvent(event: POSEvent) {
 *   switch (event.eventType) {
 *     case 'pos.sale.completed':
 *       // TypeScript knows event.payload is SaleCompletedPayload
 *       break;
 *   }
 * }
 * ```
 * 
 * @module lib/events/eventTypes
 */

// ============================================================================
// POS EVENT TYPES
// ============================================================================

/**
 * Base fields present on all POS events
 */
interface POSEventBase {
  eventId: string
  timestamp: string
  idempotencyKey: string
}

/**
 * Payload for pos.sale.completed events
 */
export interface SaleCompletedPayload {
  saleId: string
  saleNumber: string
  tenantId: string
  staffId: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  lineItems: Array<{
    lineItemId: string
    productId: string
    variantId?: string
    quantity: number
    unitPrice: number
  }>
  payments: Array<{
    paymentId: string
    method: string
    amount: number
  }>
  completedAt: string
  offlineId?: string
}

/**
 * Payload for pos.sale.cancelled / pos.sale.voided events
 */
export interface SaleCancelledPayload {
  saleId: string
  saleNumber: string
  tenantId: string
  staffId: string
  voidedByStaffId: string
  reason: string
  lineItems: Array<{
    lineItemId: string
    productId: string
    quantity: number
  }>
  cancelledAt: string
}

/**
 * Payload for pos.payment.captured events
 */
export interface PaymentCapturedPayload {
  paymentId: string
  saleId: string
  tenantId: string
  staffId: string
  method: 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'SPLIT'
  amount: number
  tipAmount?: number
  totalAmount: number
  currency: string
  cashReceived?: number
  changeGiven?: number
  processedAt: string
  offlineId?: string
}

/**
 * Payload for pos.refund.created events
 */
export interface RefundCreatedPayload {
  refundId: string
  refundNumber: string
  tenantId: string
  staffId: string
  saleId: string
  saleNumber: string
  reason: string
  totalRefunded: number
  items: Array<{
    lineItemId: string
    productId: string
    quantity: number
    refundAmount: number
    restockItem: boolean
  }>
  refundedAt: string
}

/**
 * POS Sale Completed Event
 */
export interface POSSaleCompletedEvent extends POSEventBase {
  eventType: 'pos.sale.completed'
  payload: SaleCompletedPayload
}

/**
 * POS Sale Cancelled Event
 */
export interface POSSaleCancelledEvent extends POSEventBase {
  eventType: 'pos.sale.cancelled' | 'pos.sale.voided'
  payload: SaleCancelledPayload
}

/**
 * POS Payment Captured Event
 */
export interface POSPaymentCapturedEvent extends POSEventBase {
  eventType: 'pos.payment.captured'
  payload: PaymentCapturedPayload
}

/**
 * POS Refund Created Event
 */
export interface POSRefundCreatedEvent extends POSEventBase {
  eventType: 'pos.refund.created'
  payload: RefundCreatedPayload
}

/**
 * Union of all POS events with discriminated eventType
 */
export type POSEvent = 
  | POSSaleCompletedEvent
  | POSSaleCancelledEvent
  | POSPaymentCapturedEvent
  | POSRefundCreatedEvent

/**
 * POS event with unknown payload (for ingress before validation)
 */
export interface POSEventUnknown extends POSEventBase {
  eventType: string
  payload: Record<string, unknown>
}

/**
 * Type guard: Checks if event is a known POS event type
 */
export function isPOSEvent(event: POSEventUnknown): event is POSEvent {
  return [
    'pos.sale.completed',
    'pos.sale.cancelled',
    'pos.sale.voided',
    'pos.payment.captured',
    'pos.refund.created'
  ].includes(event.eventType)
}

// ============================================================================
// SVM EVENT TYPES
// ============================================================================

/**
 * Base fields present on all SVM events
 */
interface SVMEventBase {
  eventId: string
  timestamp: string
  idempotencyKey: string
}

/**
 * Payload for svm.order.placed events
 */
export interface OrderPlacedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string
  guestEmail?: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  currency: string
  shippingAddress: {
    name: string
    address1: string
    address2?: string
    city: string
    state?: string
    postalCode: string
    country: string
    phone?: string
  }
  shippingMethod?: string
  reservationId?: string
}

/**
 * Payload for svm.order.payment_requested events
 */
export interface PaymentRequestedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string
  guestEmail?: string
  amount: number
  currency: string
  returnUrl?: string
  metadata?: Record<string, string>
}

/**
 * Payload for svm.order.cancelled events
 */
export interface OrderCancelledPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  reason: string
  cancelledBy: 'CUSTOMER' | 'MERCHANT' | 'SYSTEM'
  cancelledByUserId?: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
  wasPaymentCaptured: boolean
  corePaymentId?: string
  refundAmount?: number
}

/**
 * Payload for svm.order.refund_requested events
 */
export interface SVMRefundRequestedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  corePaymentId: string
  refundType: 'FULL' | 'PARTIAL'
  refundAmount: number
  reason: string
  items?: Array<{
    productId: string
    variantId?: string
    quantity: number
    restockItem: boolean
  }>
  requestedBy: string
}

/**
 * Payload for svm.order.shipped events
 */
export interface OrderShippedPayload {
  orderId: string
  orderNumber: string
  tenantId: string
  customerId?: string
  carrier: string
  trackingNumber: string
  trackingUrl?: string
  estimatedDelivery?: string
  shippedAt: string
  notifyCustomer: boolean
  customerEmail?: string
}

/**
 * SVM Order Placed Event
 */
export interface SVMOrderPlacedEvent extends SVMEventBase {
  eventType: 'svm.order.placed'
  payload: OrderPlacedPayload
}

/**
 * SVM Payment Requested Event
 */
export interface SVMPaymentRequestedEvent extends SVMEventBase {
  eventType: 'svm.order.payment_requested'
  payload: PaymentRequestedPayload
}

/**
 * SVM Order Cancelled Event
 */
export interface SVMOrderCancelledEvent extends SVMEventBase {
  eventType: 'svm.order.cancelled'
  payload: OrderCancelledPayload
}

/**
 * SVM Refund Requested Event
 */
export interface SVMRefundRequestedEvent extends SVMEventBase {
  eventType: 'svm.order.refund_requested'
  payload: SVMRefundRequestedPayload
}

/**
 * SVM Order Shipped Event
 */
export interface SVMOrderShippedEvent extends SVMEventBase {
  eventType: 'svm.order.shipped'
  payload: OrderShippedPayload
}

/**
 * Union of all actionable SVM events with discriminated eventType
 */
export type SVMEvent =
  | SVMOrderPlacedEvent
  | SVMPaymentRequestedEvent
  | SVMOrderCancelledEvent
  | SVMRefundRequestedEvent
  | SVMOrderShippedEvent

/**
 * SVM event with unknown payload (for ingress before validation)
 */
export interface SVMEventUnknown extends SVMEventBase {
  eventType: string
  payload: Record<string, unknown>
}

/**
 * Type guard: Checks if event is a known actionable SVM event type
 */
export function isSVMEvent(event: SVMEventUnknown): event is SVMEvent {
  return [
    'svm.order.placed',
    'svm.order.payment_requested',
    'svm.order.cancelled',
    'svm.order.refund_requested',
    'svm.order.shipped'
  ].includes(event.eventType)
}

// ============================================================================
// MVM EVENT TYPES
// ============================================================================

/**
 * Base fields present on all MVM events
 */
interface MVMEventBase {
  eventId: string
  timestamp: string
  idempotencyKey: string
  tenantId: string
  version: '1.0'
}

/**
 * Payload for mvm.vendor.onboarding_completed events
 */
export interface VendorOnboardedPayload {
  vendorId: string
  vendorName: string
  tenantId: string
  email: string
  tierId?: string
  tierName?: string
  commissionRate: number
  onboardedAt: string
}

/**
 * Payload for mvm.vendor.approved / mvm.vendor.suspended events
 */
export interface VendorStatusChangedPayload {
  vendorId: string
  vendorName: string
  tenantId: string
  previousStatus: string
  newStatus: string
  reason?: string
  changedBy?: string
  changedAt: string
}

/**
 * Payload for mvm.order.split events
 */
export interface OrderSplitPayload {
  tenantId: string
  parentOrderId: string
  parentOrderNumber: string
  vendorCount: number
  subOrderIds: string[]
  subOrderNumbers: string[]
  totalAmount: number
  totalCommission: number
  splitAt: string
}

/**
 * Payload for mvm.suborder.created events
 */
export interface SubOrderCreatedPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  parentOrderId: string
  parentOrderNumber: string
  itemCount: number
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
  grandTotal: number
  commissionAmount: number
  vendorEarnings: number
  createdAt: string
}

/**
 * Payload for mvm.suborder.delivered events
 */
export interface SubOrderDeliveredPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  parentOrderId: string
  grandTotal: number
  commissionAmount: number
  vendorEarnings: number
  customerId?: string
  deliveredAt: string
}

/**
 * Payload for mvm.suborder.cancelled events
 */
export interface SubOrderCancelledPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  parentOrderId: string
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
  reason: string
  cancelledAt: string
}

/**
 * Payload for mvm.commission.earned events
 */
export interface CommissionEarnedPayload {
  tenantId: string
  vendorId: string
  subOrderId: string
  subOrderNumber: string
  orderTotal: number
  commissionRate: number
  commissionAmount: number
  vendorEarnings: number
  earnedAt: string
}

/**
 * Payload for mvm.payout.ready events
 */
export interface PayoutReadyPayload {
  tenantId: string
  vendorId: string
  payoutRecordId: string
  grossAmount: number
  commissionAmount: number
  netAmount: number
  currency: string
  subOrderIds: string[]
  scheduledAt: string
}

/**
 * MVM Vendor Onboarded Event
 */
export interface MVMVendorOnboardedEvent extends MVMEventBase {
  eventType: 'mvm.vendor.onboarding_completed'
  payload: VendorOnboardedPayload
}

/**
 * MVM Vendor Approved Event
 */
export interface MVMVendorApprovedEvent extends MVMEventBase {
  eventType: 'mvm.vendor.approved'
  payload: VendorStatusChangedPayload
}

/**
 * MVM Vendor Suspended Event
 */
export interface MVMVendorSuspendedEvent extends MVMEventBase {
  eventType: 'mvm.vendor.suspended'
  payload: VendorStatusChangedPayload
}

/**
 * MVM Order Split Event
 */
export interface MVMOrderSplitEvent extends MVMEventBase {
  eventType: 'mvm.order.split'
  payload: OrderSplitPayload
}

/**
 * MVM SubOrder Created Event
 */
export interface MVMSubOrderCreatedEvent extends MVMEventBase {
  eventType: 'mvm.suborder.created'
  payload: SubOrderCreatedPayload
}

/**
 * MVM SubOrder Delivered Event
 */
export interface MVMSubOrderDeliveredEvent extends MVMEventBase {
  eventType: 'mvm.suborder.delivered'
  payload: SubOrderDeliveredPayload
}

/**
 * MVM SubOrder Cancelled Event
 */
export interface MVMSubOrderCancelledEvent extends MVMEventBase {
  eventType: 'mvm.suborder.cancelled'
  payload: SubOrderCancelledPayload
}

/**
 * MVM Commission Earned Event
 */
export interface MVMCommissionEarnedEvent extends MVMEventBase {
  eventType: 'mvm.commission.earned'
  payload: CommissionEarnedPayload
}

/**
 * MVM Payout Ready Event
 */
export interface MVMPayoutReadyEvent extends MVMEventBase {
  eventType: 'mvm.payout.ready'
  payload: PayoutReadyPayload
}

/**
 * Union of all MVM events with discriminated eventType
 */
export type MVMEvent =
  | MVMVendorOnboardedEvent
  | MVMVendorApprovedEvent
  | MVMVendorSuspendedEvent
  | MVMOrderSplitEvent
  | MVMSubOrderCreatedEvent
  | MVMSubOrderDeliveredEvent
  | MVMSubOrderCancelledEvent
  | MVMCommissionEarnedEvent
  | MVMPayoutReadyEvent

/**
 * MVM event with unknown payload (for ingress before validation)
 */
export interface MVMEventUnknown extends MVMEventBase {
  eventType: string
  payload: Record<string, unknown>
}

/**
 * Type guard: Checks if event is a known MVM event type
 */
export function isMVMEvent(event: MVMEventUnknown): event is MVMEvent {
  return [
    'mvm.vendor.onboarding_completed',
    'mvm.vendor.approved',
    'mvm.vendor.suspended',
    'mvm.order.split',
    'mvm.suborder.created',
    'mvm.suborder.delivered',
    'mvm.suborder.cancelled',
    'mvm.commission.earned',
    'mvm.payout.ready'
  ].includes(event.eventType)
}

// ============================================================================
// EVENT RESULT TYPES
// ============================================================================

/**
 * Standard result type for event handlers
 */
export interface EventHandlerResult {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}
