/**
 * PAYMENTS & COLLECTIONS SUITE
 * Payment Status Resolver
 * 
 * CANONICAL SERVICE - S3
 * 
 * Deterministic payment status resolution and display formatting.
 * Single source of truth for payment status logic.
 * 
 * @module lib/payments/status-resolver
 */

import { PayPaymentStatus, PayIntentStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentStatusDisplay {
  text: string
  color: 'gray' | 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'orange'
  description: string
  icon: string
  isTerminal: boolean
  allowsRetry: boolean
  nextActions: string[]
}

export interface IntentStatusDisplay {
  text: string
  color: 'gray' | 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'orange'
  description: string
  isTerminal: boolean
}

// ============================================================================
// PAYMENT STATUS RESOLVER
// ============================================================================

export class PaymentStatusResolver {
  /**
   * Get display information for a payment status
   */
  static getPaymentStatusDisplay(status: PayPaymentStatus): PaymentStatusDisplay {
    const statusMap: Record<PayPaymentStatus, PaymentStatusDisplay> = {
      PENDING: {
        text: 'Pending',
        color: 'gray',
        description: 'Payment not yet initiated',
        icon: 'clock',
        isTerminal: false,
        allowsRetry: true,
        nextActions: ['Initiate payment', 'Cancel order']
      },
      PROCESSING: {
        text: 'Processing',
        color: 'blue',
        description: 'Payment is being verified',
        icon: 'loader',
        isTerminal: false,
        allowsRetry: false,
        nextActions: ['Wait for confirmation', 'Contact support']
      },
      CONFIRMED: {
        text: 'Paid',
        color: 'green',
        description: 'Payment completed successfully',
        icon: 'check-circle',
        isTerminal: true,
        allowsRetry: false,
        nextActions: []
      },
      FAILED: {
        text: 'Failed',
        color: 'red',
        description: 'Payment could not be processed',
        icon: 'x-circle',
        isTerminal: true,
        allowsRetry: true,
        nextActions: ['Retry payment', 'Try different method', 'Contact support']
      },
      CANCELLED: {
        text: 'Cancelled',
        color: 'gray',
        description: 'Payment was cancelled',
        icon: 'ban',
        isTerminal: true,
        allowsRetry: false,
        nextActions: ['Create new order']
      },
      REFUNDED: {
        text: 'Refunded',
        color: 'purple',
        description: 'Payment has been fully refunded',
        icon: 'refresh-ccw',
        isTerminal: true,
        allowsRetry: false,
        nextActions: []
      },
      PARTIALLY_REFUNDED: {
        text: 'Partially Refunded',
        color: 'orange',
        description: 'Part of the payment has been refunded',
        icon: 'refresh-ccw',
        isTerminal: false,
        allowsRetry: false,
        nextActions: ['View refund details']
      }
    }

    return statusMap[status] || statusMap.PENDING
  }

  /**
   * Get display information for an intent status
   */
  static getIntentStatusDisplay(status: PayIntentStatus): IntentStatusDisplay {
    const statusMap: Record<PayIntentStatus, IntentStatusDisplay> = {
      CREATED: {
        text: 'Created',
        color: 'gray',
        description: 'Payment intent created, awaiting action',
        isTerminal: false
      },
      REQUIRES_ACTION: {
        text: 'Action Required',
        color: 'yellow',
        description: 'Additional action needed to complete payment',
        isTerminal: false
      },
      PROCESSING: {
        text: 'Processing',
        color: 'blue',
        description: 'Payment is being processed',
        isTerminal: false
      },
      SUCCEEDED: {
        text: 'Succeeded',
        color: 'green',
        description: 'Payment completed successfully',
        isTerminal: true
      },
      FAILED: {
        text: 'Failed',
        color: 'red',
        description: 'Payment failed',
        isTerminal: true
      },
      CANCELLED: {
        text: 'Cancelled',
        color: 'gray',
        description: 'Payment was cancelled',
        isTerminal: true
      },
      EXPIRED: {
        text: 'Expired',
        color: 'orange',
        description: 'Payment intent expired',
        isTerminal: true
      }
    }

    return statusMap[status] || statusMap.CREATED
  }

  /**
   * Check if a payment can be refunded
   */
  static canRefund(status: PayPaymentStatus): boolean {
    return status === 'CONFIRMED' || status === 'PARTIALLY_REFUNDED'
  }

  /**
   * Check if a payment can be retried
   */
  static canRetry(status: PayPaymentStatus): boolean {
    return status === 'PENDING' || status === 'FAILED'
  }

  /**
   * Check if a payment is in a terminal state
   */
  static isTerminal(status: PayPaymentStatus): boolean {
    return this.getPaymentStatusDisplay(status).isTerminal
  }

  /**
   * Get the next logical status after an action
   */
  static getNextStatus(
    currentStatus: PayPaymentStatus,
    action: 'confirm' | 'fail' | 'cancel' | 'refund' | 'partial_refund'
  ): PayPaymentStatus | null {
    const transitions: Record<PayPaymentStatus, Partial<Record<typeof action, PayPaymentStatus>>> = {
      PENDING: {
        confirm: 'PROCESSING',
        cancel: 'CANCELLED',
        fail: 'FAILED'
      },
      PROCESSING: {
        confirm: 'CONFIRMED',
        fail: 'FAILED',
        cancel: 'CANCELLED'
      },
      CONFIRMED: {
        refund: 'REFUNDED',
        partial_refund: 'PARTIALLY_REFUNDED'
      },
      PARTIALLY_REFUNDED: {
        refund: 'REFUNDED',
        partial_refund: 'PARTIALLY_REFUNDED'
      },
      FAILED: {},
      CANCELLED: {},
      REFUNDED: {}
    }

    return transitions[currentStatus]?.[action] || null
  }

  /**
   * Resolve order payment status from multiple payments
   * Used when an order has partial payments
   */
  static resolveOrderPaymentStatus(
    payments: Array<{ status: PayPaymentStatus; amount: number }>,
    orderTotal: number
  ): {
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'OVERPAID' | 'REFUNDED'
    paidAmount: number
    remainingAmount: number
    percentage: number
  } {
    const confirmedPayments = payments.filter((p: any) => p.status === 'CONFIRMED')
    const paidAmount = confirmedPayments.reduce((sum: any, p: any) => sum + p.amount, 0)
    const remainingAmount = Math.max(0, orderTotal - paidAmount)
    const percentage = Math.min(100, Math.round((paidAmount / orderTotal) * 100))

    // Check for refunds
    const hasRefunds = payments.some((p: any) => 
      p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED'
    )

    if (hasRefunds && paidAmount === 0) {
      return { status: 'REFUNDED', paidAmount, remainingAmount: orderTotal, percentage: 0 }
    }

    if (paidAmount === 0) {
      return { status: 'UNPAID', paidAmount, remainingAmount, percentage: 0 }
    }

    if (paidAmount < orderTotal) {
      return { status: 'PARTIALLY_PAID', paidAmount, remainingAmount, percentage }
    }

    if (paidAmount > orderTotal) {
      return { status: 'OVERPAID', paidAmount, remainingAmount: 0, percentage: 100 }
    }

    return { status: 'FULLY_PAID', paidAmount, remainingAmount: 0, percentage: 100 }
  }
}

// ============================================================================
// DISPLAY HELPERS (Nigeria-First)
// ============================================================================

/**
 * Format payment status for customer display (Nigeria-first language)
 */
export function formatPaymentStatusForCustomer(status: PayPaymentStatus): string {
  const display = PaymentStatusResolver.getPaymentStatusDisplay(status)
  return display.text
}

/**
 * Get status badge class for UI
 */
export function getStatusBadgeClass(status: PayPaymentStatus): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800'
  }

  const display = PaymentStatusResolver.getPaymentStatusDisplay(status)
  return colorMap[display.color] || colorMap.gray
}
