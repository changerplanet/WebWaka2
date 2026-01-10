/**
 * SVM Core Services
 * 
 * Single Vendor Marketplace service layer exports.
 * All services are Nigeria-first with NGN currency and VAT defaults.
 * 
 * @module lib/svm
 */

// Shipping Service
export {
  // Types
  type NigerianShippingZone,
  type ShippingRateConfig,
  type ShippingCalculation,
  type LocalPickupLocation,
  type NigerianState,
  
  // Constants
  NIGERIAN_STATES,
  NIGERIAN_REGIONS,
  NIGERIAN_SHIPPING_RATES,
  
  // Functions
  getRegionForState,
  isValidNigerianState,
  seedNigerianShippingZones,
  getShippingZones,
  findZoneForState,
  calculateShipping,
  getCheapestShipping,
  getFastestShipping,
  isLocalPickupAvailable,
  enableLocalPickup,
  disableLocalPickup
} from './shipping-service'

// Payment Service
export {
  // Types
  type PaymentMethodCode,
  type PaymentMethod,
  type PaymentMethodAvailability,
  type BankTransferDetails,
  type PODConfig,
  type PaymentStatus,
  
  // Constants
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_POD_CONFIG,
  
  // Functions
  getPaymentMethods,
  getPaymentMethod,
  checkPaymentMethodAvailability,
  getAvailablePaymentMethods,
  getPODConfig,
  isPODAvailable,
  calculatePODFee,
  generateTransferReference,
  createBankTransferDetails,
  isValidTransferReference,
  calculatePaymentTotal,
  getPaymentStatusDisplay
} from './payment-service'

// Order Lifecycle Service
export {
  // Types
  type OrderStatus,
  type FulfillmentStatus,
  type CancellationReason,
  type OrderStateTransition,
  type CancellationEligibility,
  type RefundEligibility,
  type OrderStatusDisplay,
  
  // Constants
  ORDER_TRANSITIONS,
  ORDER_STATUS_DISPLAY,
  
  // Functions
  isValidTransition,
  getAllowedTransitions,
  checkCancellationEligibility,
  cancelOrder,
  checkRefundEligibility,
  updateOrderStatus,
  getOrderStatusDisplay,
  getOrderTimeline
} from './order-lifecycle-service'

// Checkout Service
export {
  // Types
  type CartItem,
  type ShippingAddress,
  type CheckoutSummary,
  type CheckoutValidation,
  type CheckoutSession,
  
  // Functions
  calculateCheckoutSummary,
  validateCheckout,
  createCheckoutSession,
  updateCheckoutShipping,
  updateCheckoutPayment,
  finalizeCheckout,
  getCheckoutShippingOptions,
  getCheckoutPaymentMethods,
  checkLocalPickupAvailable,
  formatCheckoutLine
} from './checkout-service'
