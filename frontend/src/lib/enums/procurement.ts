/**
 * PROCUREMENT ENUM VALIDATORS
 * ===========================
 * 
 * Phase 11B: Type-safe validators for procurement module enums.
 * Uses Prisma schema as source of truth.
 * 
 * @module lib/enums/procurement
 */

import { validateEnumValue } from './types'

// =============================================================================
// PROCUREMENT PRIORITY (Prisma: ProcPriority)
// =============================================================================

export const PROC_PRIORITY = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
] as const

export type ProcPriorityType = typeof PROC_PRIORITY[number]

/**
 * Validates procurement priority value.
 * Phase 11B: Logs mismatches for observability.
 */
export function validateProcPriority(
  value: string | null | undefined
): ProcPriorityType | undefined {
  return validateEnumValue(value, PROC_PRIORITY, 'ProcPriority', 'API')
}

/**
 * Validates comma-separated priority array.
 */
export function validateProcPriorityArray(
  value: string | null | undefined
): ProcPriorityType[] | undefined {
  if (!value) return undefined
  const values = value.split(',').map(v => v.trim())
  const valid = values.filter(v => PROC_PRIORITY.includes(v as ProcPriorityType)) as ProcPriorityType[]
  return valid.length > 0 ? valid : undefined
}

// =============================================================================
// PURCHASE ORDER STATUS (Prisma: ProcPurchaseOrderStatus)
// =============================================================================

export const PROC_PURCHASE_ORDER_STATUS = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
  'CLOSED'
] as const

export type ProcPurchaseOrderStatusType = typeof PROC_PURCHASE_ORDER_STATUS[number]

/**
 * Validates purchase order status value.
 */
export function validatePurchaseOrderStatus(
  value: string | null | undefined
): ProcPurchaseOrderStatusType | undefined {
  return validateEnumValue(value, PROC_PURCHASE_ORDER_STATUS, 'ProcPurchaseOrderStatus', 'API')
}

/**
 * Validates comma-separated status array.
 */
export function validatePurchaseOrderStatusArray(
  value: string | null | undefined
): ProcPurchaseOrderStatusType[] | undefined {
  if (!value) return undefined
  const values = value.split(',').map(v => v.trim())
  const valid = values.filter(v => 
    PROC_PURCHASE_ORDER_STATUS.includes(v as ProcPurchaseOrderStatusType)
  ) as ProcPurchaseOrderStatusType[]
  return valid.length > 0 ? valid : undefined
}

// =============================================================================
// PURCHASE REQUEST STATUS (Prisma: ProcPurchaseRequestStatus)
// =============================================================================

export const PROC_PURCHASE_REQUEST_STATUS = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'CONVERTED'
] as const

export type ProcPurchaseRequestStatusType = typeof PROC_PURCHASE_REQUEST_STATUS[number]

/**
 * Validates purchase request status value.
 */
export function validatePurchaseRequestStatus(
  value: string | null | undefined
): ProcPurchaseRequestStatusType | undefined {
  return validateEnumValue(value, PROC_PURCHASE_REQUEST_STATUS, 'ProcPurchaseRequestStatus', 'API')
}

/**
 * Validates comma-separated status array.
 */
export function validatePurchaseRequestStatusArray(
  value: string | null | undefined
): ProcPurchaseRequestStatusType[] | undefined {
  if (!value) return undefined
  const values = value.split(',').map(v => v.trim())
  const valid = values.filter(v => 
    PROC_PURCHASE_REQUEST_STATUS.includes(v as ProcPurchaseRequestStatusType)
  ) as ProcPurchaseRequestStatusType[]
  return valid.length > 0 ? valid : undefined
}

// =============================================================================
// RECEIPT STATUS (Common pattern)
// =============================================================================

export const PROC_RECEIPT_STATUS = [
  'PENDING',
  'PARTIAL',
  'COMPLETE',
  'CANCELLED'
] as const

export type ProcReceiptStatusType = typeof PROC_RECEIPT_STATUS[number]

/**
 * Validates receipt status value.
 */
export function validateReceiptStatus(
  value: string | null | undefined
): ProcReceiptStatusType | undefined {
  return validateEnumValue(value, PROC_RECEIPT_STATUS, 'ProcReceiptStatus', 'API')
}

/**
 * Validates comma-separated status array.
 */
export function validateReceiptStatusArray(
  value: string | null | undefined
): ProcReceiptStatusType[] | undefined {
  if (!value) return undefined
  const values = value.split(',').map(v => v.trim())
  const valid = values.filter(v => 
    PROC_RECEIPT_STATUS.includes(v as ProcReceiptStatusType)
  ) as ProcReceiptStatusType[]
  return valid.length > 0 ? valid : undefined
}

// =============================================================================
// ORDER BY FIELDS
// =============================================================================

export const PROC_ORDER_ORDER_BY_FIELDS = [
  'createdAt',
  'orderDate',
  'expectedDelivery',
  'totalAmount'
] as const

export type ProcOrderOrderByField = typeof PROC_ORDER_ORDER_BY_FIELDS[number]

export function validateProcOrderOrderBy(
  value: string | null | undefined
): ProcOrderOrderByField {
  if (value && PROC_ORDER_ORDER_BY_FIELDS.includes(value as ProcOrderOrderByField)) {
    return value as ProcOrderOrderByField
  }
  return 'createdAt'
}

export const PROC_REQUEST_ORDER_BY_FIELDS = [
  'createdAt',
  'requestDate',
  'requiredDate',
  'estimatedTotal'
] as const

export type ProcRequestOrderByField = typeof PROC_REQUEST_ORDER_BY_FIELDS[number]

export function validateProcRequestOrderBy(
  value: string | null | undefined
): ProcRequestOrderByField {
  if (value && PROC_REQUEST_ORDER_BY_FIELDS.includes(value as ProcRequestOrderByField)) {
    return value as ProcRequestOrderByField
  }
  return 'createdAt'
}

// =============================================================================
// ORDER DIRECTION
// =============================================================================

export type OrderDir = 'asc' | 'desc'

export function validateOrderDir(value: string | null | undefined): OrderDir {
  if (value === 'asc' || value === 'desc') {
    return value
  }
  return 'desc'
}
