/**
 * API PARAMETER TYPES
 * ===================
 * 
 * Phase 11B: Shared types for API route URL parameters.
 * Eliminates `as any` casts for common patterns like sort direction,
 * pagination, and order-by fields.
 * 
 * @module lib/types/api-params
 */

// =============================================================================
// SORT / ORDER DIRECTION
// =============================================================================

/**
 * Standard sort direction for database queries.
 */
export type OrderDirection = 'asc' | 'desc'

/**
 * Validates and returns a valid order direction.
 * Returns default if invalid or not provided.
 */
export function validateOrderDirection(
  value: string | null | undefined,
  defaultDir: OrderDirection = 'desc'
): OrderDirection {
  if (value === 'asc' || value === 'desc') {
    return value
  }
  return defaultDir
}

// =============================================================================
// COMMON ORDER-BY FIELDS
// =============================================================================

/**
 * Common fields that can be used for ordering.
 */
export type CommonOrderByField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'name' 
  | 'title'
  | 'date'
  | 'amount'
  | 'price'
  | 'status'

/**
 * Procurement-specific order-by fields.
 */
export type ProcurementOrderByField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'requestDate'
  | 'requiredDate'
  | 'orderDate'
  | 'receivedDate'
  | 'totalAmount'

/**
 * Validates procurement order-by field.
 */
export function validateProcurementOrderBy(
  value: string | null | undefined,
  defaultField: ProcurementOrderByField = 'createdAt'
): ProcurementOrderByField {
  const validFields: ProcurementOrderByField[] = [
    'createdAt', 'updatedAt', 'requestDate', 'requiredDate', 
    'orderDate', 'receivedDate', 'totalAmount'
  ]
  if (value && validFields.includes(value as ProcurementOrderByField)) {
    return value as ProcurementOrderByField
  }
  return defaultField
}

// =============================================================================
// SVM CATALOG ORDER-BY
// =============================================================================

/**
 * SVM catalog order-by fields.
 */
export type SvmCatalogOrderByField = 'price' | 'createdAt' | 'name'

/**
 * Validates SVM catalog order-by field.
 */
export function validateSvmCatalogOrderBy(
  value: string | null | undefined,
  defaultField: SvmCatalogOrderByField = 'createdAt'
): SvmCatalogOrderByField {
  const validFields: SvmCatalogOrderByField[] = ['price', 'createdAt', 'name']
  if (value && validFields.includes(value as SvmCatalogOrderByField)) {
    return value as SvmCatalogOrderByField
  }
  return defaultField
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

/**
 * Parses pagination parameters with defaults.
 */
export function parsePaginationParams(
  pageParam: string | null,
  limitParam: string | null,
  defaultLimit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(limitParam || String(defaultLimit), 10) || defaultLimit))
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}
