/**
 * CIVIC ENUM MAPPERS
 * ==================
 * 
 * Compatibility mapping layer for Civic module enums.
 * Maps between service-layer enum values and Prisma schema enums.
 * 
 * AUTHORITY: Prisma schema is canonical for database storage.
 * Service layer values are mapped to Prisma values at write boundaries.
 * 
 * @module lib/enums/civic
 */

import { createEnumMapper, validateEnumValue } from './types'

// =============================================================================
// PRISMA CANONICAL VALUES (Source of truth)
// =============================================================================

/**
 * CivicRequestStatus - Prisma schema values
 * From: prisma/schema.prisma enum CivicRequestStatus
 */
export const CIVIC_REQUEST_STATUS_PRISMA = [
  'DRAFT',
  'SUBMITTED', 
  'UNDER_REVIEW',
  'PENDING_DOCUMENTS',
  'PENDING_PAYMENT',
  'PENDING_INSPECTION',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED'
] as const

export type CivicRequestStatusPrisma = typeof CIVIC_REQUEST_STATUS_PRISMA[number]

/**
 * CivicCasePriority - Prisma schema values
 */
export const CIVIC_CASE_PRIORITY_PRISMA = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
] as const

export type CivicCasePriorityPrisma = typeof CIVIC_CASE_PRIORITY_PRISMA[number]

/**
 * CivicServiceCategory - Prisma schema values
 */
export const CIVIC_SERVICE_CATEGORY_PRISMA = [
  'PERMITS',
  'LICENSES',
  'CERTIFICATES',
  'REGISTRATIONS',
  'APPROVALS',
  'RENEWALS',
  'COMPLAINTS',
  'INQUIRIES',
  'OTHER'
] as const

export type CivicServiceCategoryPrisma = typeof CIVIC_SERVICE_CATEGORY_PRISMA[number]

// =============================================================================
// SERVICE LAYER VALUES (Legacy/UI values)
// =============================================================================

/**
 * Service layer status values (from lib/civic/config.ts)
 * These may differ from Prisma and need mapping
 */
export const CIVIC_REQUEST_STATUS_SERVICE = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
  'REJECTED'
] as const

export type CivicRequestStatusService = typeof CIVIC_REQUEST_STATUS_SERVICE[number]

/**
 * Service layer priority values
 * Note: Service uses 'MEDIUM' while Prisma uses 'NORMAL'
 */
export const CIVIC_PRIORITY_SERVICE = [
  'LOW',
  'MEDIUM',
  'HIGH', 
  'URGENT'
] as const

export type CivicPriorityService = typeof CIVIC_PRIORITY_SERVICE[number]

// =============================================================================
// MAPPING FUNCTIONS
// =============================================================================

/**
 * Maps service-layer request status to Prisma-compatible status.
 * 
 * Mapping decisions:
 * - IN_PROGRESS → UNDER_REVIEW (closest semantic match)
 * - ESCALATED → UNDER_REVIEW (still being processed)
 * - RESOLVED → APPROVED (successful completion)
 * - CLOSED → APPROVED (completed and archived)
 * 
 * @param serviceStatus - Status value from service layer
 * @returns Prisma-compatible status value
 */
export const mapCivicRequestStatusToPrisma = createEnumMapper<
  CivicRequestStatusService | CivicRequestStatusPrisma,
  CivicRequestStatusPrisma
>(
  'CivicRequestStatus',
  {
    // Direct mappings (same value in both)
    'SUBMITTED': 'SUBMITTED',
    'UNDER_REVIEW': 'UNDER_REVIEW',
    'REJECTED': 'REJECTED',
    
    // Service-specific → Prisma mappings
    'IN_PROGRESS': 'UNDER_REVIEW',
    'ESCALATED': 'UNDER_REVIEW',
    'RESOLVED': 'APPROVED',
    'CLOSED': 'APPROVED',
    
    // Prisma values pass through
    'DRAFT': 'DRAFT',
    'PENDING_DOCUMENTS': 'PENDING_DOCUMENTS',
    'PENDING_PAYMENT': 'PENDING_PAYMENT',
    'PENDING_INSPECTION': 'PENDING_INSPECTION',
    'APPROVED': 'APPROVED',
    'CANCELLED': 'CANCELLED',
    'EXPIRED': 'EXPIRED'
  },
  'DRAFT' // Safe fallback for unknown values
)

/**
 * Maps service-layer priority to Prisma-compatible priority.
 * 
 * Key mapping: MEDIUM → NORMAL
 */
export const mapCivicPriorityToPrisma = createEnumMapper<
  CivicPriorityService | CivicCasePriorityPrisma,
  CivicCasePriorityPrisma
>(
  'CivicPriority',
  {
    'LOW': 'LOW',
    'MEDIUM': 'NORMAL',
    'NORMAL': 'NORMAL',
    'HIGH': 'HIGH',
    'URGENT': 'URGENT'
  },
  'NORMAL'
)

/**
 * Validates and returns a Prisma-compatible category value.
 * Categories are already aligned, so this is a pass-through validation.
 */
export function validateCivicCategory(
  value: string | null | undefined
): CivicServiceCategoryPrisma | undefined {
  return validateEnumValue(value, CIVIC_SERVICE_CATEGORY_PRISMA)
}

/**
 * Validates and returns a Prisma-compatible status value.
 * Use this when you know the input should already be a Prisma value.
 */
export function validateCivicRequestStatus(
  value: string | null | undefined
): CivicRequestStatusPrisma | undefined {
  return validateEnumValue(value, CIVIC_REQUEST_STATUS_PRISMA)
}

/**
 * Validates and returns a Prisma-compatible priority value.
 */
export function validateCivicPriority(
  value: string | null | undefined
): CivicCasePriorityPrisma | undefined {
  return validateEnumValue(value, CIVIC_CASE_PRIORITY_PRISMA)
}
