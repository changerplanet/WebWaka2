/**
 * SVM ENUM MAPPERS
 * ================
 * 
 * Type-safe validators for SVM module enums.
 * 
 * Status:
 * - ✅ ProductStatus (Phase 11C APPROVED - SAFE)
 * - ⚠️ OrderStatus (CONDITIONAL - STUB ONLY)
 * - ⚠️ PaymentStatus (CONDITIONAL - STUB ONLY)
 * 
 * @module lib/enums/svm
 */

import { validateEnumValue } from './types'

// =============================================================================
// PRODUCT STATUS (Phase 11C APPROVED - SAFE)
// =============================================================================

/**
 * Product status values (Prisma: ProductStatus)
 */
export const SVM_PRODUCT_STATUS = [
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
] as const

export type SvmProductStatusType = typeof SVM_PRODUCT_STATUS[number]

/**
 * Validates product status value.
 * Phase 11C: Safe to use at API boundaries.
 */
export function validateProductStatus(
  value: string | null | undefined
): SvmProductStatusType | undefined {
  return validateEnumValue(value, SVM_PRODUCT_STATUS, 'ProductStatus', 'API')
}

// =============================================================================
// CATALOG SORT OPTIONS (Phase 11C APPROVED - SAFE)
// =============================================================================

export const SVM_CATALOG_SORT_BY = [
  'price',
  'createdAt',
  'name'
] as const

export type SvmCatalogSortByType = typeof SVM_CATALOG_SORT_BY[number]

export function validateCatalogSortBy(
  value: string | null | undefined
): SvmCatalogSortByType {
  if (value && SVM_CATALOG_SORT_BY.includes(value as SvmCatalogSortByType)) {
    return value as SvmCatalogSortByType
  }
  return 'name' // default
}

export const SVM_SORT_ORDER = ['asc', 'desc'] as const
export type SvmSortOrderType = typeof SVM_SORT_ORDER[number]

export function validateSortOrder(
  value: string | null | undefined
): SvmSortOrderType {
  if (value === 'asc' || value === 'desc') {
    return value
  }
  return 'asc' // default
}

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
export function mapSvmOrderStatusToPrisma(
  serviceStatus: string | null | undefined
): SvmOrderStatusPrisma {
  // Log the attempted usage for debugging
  console.error('[Phase 10C Required] mapSvmOrderStatusToPrisma called with:', serviceStatus)
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
