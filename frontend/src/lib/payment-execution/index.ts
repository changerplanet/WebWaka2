/**
 * Payment Execution Module
 * 
 * Phase E1.2: Transaction Execution Layer
 * 
 * This module provides the execution layer for payments across all suites.
 * 
 * Usage:
 * ```typescript
 * import { PaymentExecutionService } from '@/lib/payment-execution'
 * 
 * // Check if payments are available
 * const availability = await PaymentExecutionService.isAvailable(partnerId)
 * 
 * // Initiate a payment
 * const result = await PaymentExecutionService.initiatePayment({
 *   tenantId,
 *   partnerId,
 *   amount: 5000,
 *   currency: 'NGN',
 *   customerEmail: 'customer@example.com',
 *   sourceModule: 'svm',
 *   sourceType: 'order',
 *   sourceId: orderId
 * })
 * 
 * // Verify a payment
 * const verification = await PaymentExecutionService.verifyPayment({
 *   tenantId,
 *   partnerId,
 *   reference: result.reference
 * })
 * ```
 */

export { PaymentExecutionService } from './execution-service'
export { TransactionService } from './transaction-service'
export * from './types'
