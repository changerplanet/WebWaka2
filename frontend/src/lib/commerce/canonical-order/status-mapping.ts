/**
 * STATUS MAPPING
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * 
 * Maps existing order statuses from SVM, MVM, and ParkHub to canonical statuses.
 * 
 * IMPORTANT: These mappings document the ACTUAL state of each system.
 * Inconsistencies are documented, NOT corrected.
 * 
 * @module lib/commerce/canonical-order/status-mapping
 */

import { CanonicalOrderStatus } from './types'

/**
 * Maps SVM order status to canonical status
 * 
 * SVM uses SvmOrderStatus enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
 * 
 * GAP: SVM has REFUNDED status but canonical does not have a refund state.
 * Decision: Map REFUNDED → CANCELLED (with metadata flag)
 */
export function mapSvmOrderStatus(status: string): CanonicalOrderStatus {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return CanonicalOrderStatus.CREATED
    case 'CONFIRMED':
      return CanonicalOrderStatus.PAID
    case 'PROCESSING':
      return CanonicalOrderStatus.PAID
    case 'SHIPPED':
      return CanonicalOrderStatus.PAID
    case 'DELIVERED':
      return CanonicalOrderStatus.FULFILLED
    case 'CANCELLED':
      return CanonicalOrderStatus.CANCELLED
    case 'REFUNDED':
      return CanonicalOrderStatus.CANCELLED
    default:
      return CanonicalOrderStatus.CREATED
  }
}

/**
 * Maps SVM payment status to canonical status
 * 
 * SVM uses SvmPaymentStatus enum: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
 */
export function mapSvmPaymentStatus(paymentStatus: string): CanonicalOrderStatus {
  switch (paymentStatus.toUpperCase()) {
    case 'PENDING':
      return CanonicalOrderStatus.PENDING_PAYMENT
    case 'PAID':
      return CanonicalOrderStatus.PAID
    case 'FAILED':
      return CanonicalOrderStatus.FAILED
    case 'REFUNDED':
      return CanonicalOrderStatus.CANCELLED
    case 'PARTIALLY_REFUNDED':
      return CanonicalOrderStatus.PAID
    default:
      return CanonicalOrderStatus.PENDING_PAYMENT
  }
}

/**
 * Maps MVM parent order status to canonical status
 * 
 * MVM uses string status: PENDING, SPLIT, COMPLETED, CANCELLED
 * 
 * GAP: MVM has SPLIT status which represents order decomposition, not a payment state.
 * Decision: Map SPLIT → PAID (order has been paid, now being fulfilled by vendors)
 */
export function mapMvmOrderStatus(status: string): CanonicalOrderStatus {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return CanonicalOrderStatus.CREATED
    case 'SPLIT':
      return CanonicalOrderStatus.PAID
    case 'COMPLETED':
      return CanonicalOrderStatus.FULFILLED
    case 'CANCELLED':
      return CanonicalOrderStatus.CANCELLED
    default:
      return CanonicalOrderStatus.CREATED
  }
}

/**
 * Maps MVM payment status to canonical status
 * 
 * MVM uses string paymentStatus: PENDING, PAID, FAILED
 */
export function mapMvmPaymentStatus(paymentStatus: string): CanonicalOrderStatus {
  switch (paymentStatus.toUpperCase()) {
    case 'PENDING':
      return CanonicalOrderStatus.PENDING_PAYMENT
    case 'PAID':
      return CanonicalOrderStatus.PAID
    case 'FAILED':
      return CanonicalOrderStatus.FAILED
    default:
      return CanonicalOrderStatus.PENDING_PAYMENT
  }
}

/**
 * Maps ParkHub ticket status to canonical status
 * 
 * ParkHub tickets use string status: VALID, USED, CANCELLED, EXPIRED
 * 
 * GAP: ParkHub "tickets" are not "orders" in the traditional sense.
 * They represent purchased travel, not goods. The lifecycle is fundamentally different.
 * Decision: Map as closely as possible, document structural difference.
 */
export function mapParkTicketStatus(status: string): CanonicalOrderStatus {
  switch (status.toUpperCase()) {
    case 'VALID':
      return CanonicalOrderStatus.PAID
    case 'USED':
      return CanonicalOrderStatus.FULFILLED
    case 'CANCELLED':
      return CanonicalOrderStatus.CANCELLED
    case 'EXPIRED':
      return CanonicalOrderStatus.CANCELLED
    default:
      return CanonicalOrderStatus.PAID
  }
}

/**
 * Maps ParkHub payment status to canonical status
 * 
 * ParkHub uses string paymentStatus: PAID, PENDING, REFUNDED
 */
export function mapParkPaymentStatus(paymentStatus: string): CanonicalOrderStatus {
  switch (paymentStatus.toUpperCase()) {
    case 'PAID':
      return CanonicalOrderStatus.PAID
    case 'PENDING':
      return CanonicalOrderStatus.PENDING_PAYMENT
    case 'REFUNDED':
      return CanonicalOrderStatus.CANCELLED
    default:
      return CanonicalOrderStatus.PAID
  }
}

/**
 * Derives the effective canonical status from order status + payment status
 * 
 * Priority: Payment status takes precedence for payment-related states
 */
export function deriveCanonicalStatus(
  orderStatus: CanonicalOrderStatus,
  paymentStatus: CanonicalOrderStatus
): CanonicalOrderStatus {
  if (paymentStatus === CanonicalOrderStatus.FAILED) {
    return CanonicalOrderStatus.FAILED
  }
  if (paymentStatus === CanonicalOrderStatus.PENDING_PAYMENT && orderStatus === CanonicalOrderStatus.CREATED) {
    return CanonicalOrderStatus.PENDING_PAYMENT
  }
  if (orderStatus === CanonicalOrderStatus.CANCELLED) {
    return CanonicalOrderStatus.CANCELLED
  }
  if (orderStatus === CanonicalOrderStatus.FULFILLED) {
    return CanonicalOrderStatus.FULFILLED
  }
  if (paymentStatus === CanonicalOrderStatus.PAID) {
    return CanonicalOrderStatus.PAID
  }
  return orderStatus
}
