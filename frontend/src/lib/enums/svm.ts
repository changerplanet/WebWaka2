/**
 * SVM ENUM MAPPERS (STUB)
 * =======================
 * 
 * ⚠️ CONDITIONAL: Not authorized for Phase 10B execution
 * 
 * This file contains stub definitions only.
 * Actual mapping implementation requires domain approval in Phase 10C.
 * 
 * @module lib/enums/svm
 */

// =============================================================================
// ORDER STATUS (CONDITIONAL - STUB ONLY)
// =============================================================================

/**
 * ⚠️ CONDITIONAL: Requires domain/product approval
 * 
 * Prisma values:
 * - PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED,
 * - CANCELLED, REFUNDED, PARTIALLY_REFUNDED
 * 
 * Service values:
 * - PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY,
 * - DELIVERED, CANCELLED, RETURNED
 * 
 * Mapping decisions required (with business impact):
 * - OUT_FOR_DELIVERY → SHIPPED? (loses granularity)
 * - RETURNED → REFUNDED? (different semantics - return vs refund)
 * 
 * These decisions affect:
 * - Order tracking display
 * - Inventory management
 * - Refund workflows
 */

export const SVM_ORDER_STATUS_PRISMA = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
] as const

export type SvmOrderStatusPrisma = typeof SVM_ORDER_STATUS_PRISMA[number]

export const SVM_ORDER_STATUS_SERVICE = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
] as const

export type SvmOrderStatusService = typeof SVM_ORDER_STATUS_SERVICE[number]

/**
 * TODO: Phase 10C Implementation
 * 
 * Proposed mapping (REQUIRES APPROVAL):
 * - OUT_FOR_DELIVERY → SHIPPED (in transit, closest match)
 * - RETURNED → REFUNDED (requires business rule confirmation)
 * 
 * Questions for domain approval:
 * 1. Should RETURNED trigger automatic refund status?
 * 2. Should OUT_FOR_DELIVERY be preserved in a separate field?
 * 3. What about partial returns?
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mapSvmOrderStatusToPrisma(
  _serviceStatus: string | null | undefined
): SvmOrderStatusPrisma {
  throw new Error(
    '[Phase 10C Required] mapSvmOrderStatusToPrisma is not yet implemented. ' +
    'Requires product owner approval for mapping decisions.'
  )
}

// =============================================================================
// PAYMENT STATUS (ALIGNED - No mapping needed)
// =============================================================================

/**
 * SvmPaymentStatus - Already aligned between service and Prisma
 */
export const SVM_PAYMENT_STATUS_PRISMA = [
  'PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'PARTIALLY_CAPTURED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
] as const

export type SvmPaymentStatusPrisma = typeof SVM_PAYMENT_STATUS_PRISMA[number]
