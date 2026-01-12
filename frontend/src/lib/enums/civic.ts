/**
 * CIVIC ENUM MAPPERS
 * ==================
 * 
 * Bidirectional mapping layer for Civic module enums.
 * 
 * ARCHITECTURE:
 * - API → Service: Validates URL params against service enum values
 * - Service → Prisma: Maps service values to Prisma values at DB write boundaries
 * 
 * AUTHORITY: 
 * - Service layer is canonical for filter operations (uses config.ts)
 * - Prisma schema is canonical for database storage
 * 
 * @module lib/enums/civic
 */

import { createEnumMapper, validateEnumValue } from './types'

// =============================================================================
// SERVICE LAYER VALUES (Source of truth for API → Service boundary)
// From: lib/civic/config.ts
// =============================================================================

/**
 * ServiceRequestStatus - Service layer values
 * These are the values the service functions expect
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
 * ServiceRequestPriority - Service layer values
 */
export const CIVIC_PRIORITY_SERVICE = [
  'LOW',
  'MEDIUM',
  'HIGH', 
  'URGENT'
] as const

export type CivicPriorityService = typeof CIVIC_PRIORITY_SERVICE[number]

/**
 * ServiceRequestCategory - Service layer values
 * From: lib/civic/config.ts - SERVICE_REQUEST_CATEGORIES
 */
export const CIVIC_CATEGORY_SERVICE = [
  'INFRASTRUCTURE',
  'SECURITY',
  'SANITATION',
  'UTILITIES',
  'COMPLAINT',
  'GENERAL_INQUIRY',
  'CERTIFICATE',
  'PERMIT'
] as const

export type CivicCategoryService = typeof CIVIC_CATEGORY_SERVICE[number]

// =============================================================================
// PRISMA CANONICAL VALUES (Source of truth for DB storage)
// From: prisma/schema.prisma
// =============================================================================

/**
 * CivicRequestStatus - Prisma schema values
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
// API → SERVICE VALIDATORS (Bidirectional - Part 1)
// Use these at API boundaries when calling service functions
// =============================================================================

/**
 * Validates URL param against service-layer status values.
 * Use this when passing status to service functions.
 * 
 * @param value - URL search param value
 * @returns Valid service status or undefined
 */
export function validateServiceRequestStatus(
  value: string | null | undefined
): CivicRequestStatusService | undefined {
  return validateEnumValue(value, CIVIC_REQUEST_STATUS_SERVICE)
}

/**
 * Validates URL param against service-layer priority values.
 * Use this when passing priority to service functions.
 */
export function validateServiceRequestPriority(
  value: string | null | undefined
): CivicPriorityService | undefined {
  return validateEnumValue(value, CIVIC_PRIORITY_SERVICE)
}

/**
 * Validates URL param against service-layer category values.
 * Use this when passing category to service functions.
 */
export function validateServiceRequestCategory(
  value: string | null | undefined
): CivicCategoryService | undefined {
  return validateEnumValue(value, CIVIC_CATEGORY_SERVICE)
}

// =============================================================================
// SERVICE → PRISMA MAPPERS (Bidirectional - Part 2)
// Use these when persisting data to database
// =============================================================================

/**
 * Maps service-layer request status to Prisma-compatible status.
 * Use this when writing data to the database.
 * 
 * Mapping decisions:
 * - IN_PROGRESS → UNDER_REVIEW (closest semantic match)
 * - ESCALATED → UNDER_REVIEW (still being processed)
 * - RESOLVED → APPROVED (successful completion)
 * - CLOSED → APPROVED (completed and archived)
 */
export const mapServiceStatusToPrisma = createEnumMapper<
  CivicRequestStatusService,
  CivicRequestStatusPrisma
>(
  'CivicRequestStatus:Service→Prisma',
  {
    'SUBMITTED': 'SUBMITTED',
    'UNDER_REVIEW': 'UNDER_REVIEW',
    'IN_PROGRESS': 'UNDER_REVIEW',
    'ESCALATED': 'UNDER_REVIEW',
    'RESOLVED': 'APPROVED',
    'CLOSED': 'APPROVED',
    'REJECTED': 'REJECTED'
  },
  'DRAFT'
)

/**
 * Maps service-layer priority to Prisma-compatible priority.
 * Key mapping: MEDIUM → NORMAL
 */
export const mapServicePriorityToPrisma = createEnumMapper<
  CivicPriorityService,
  CivicCasePriorityPrisma
>(
  'CivicPriority:Service→Prisma',
  {
    'LOW': 'LOW',
    'MEDIUM': 'NORMAL',
    'HIGH': 'HIGH',
    'URGENT': 'URGENT'
  },
  'NORMAL'
)

/**
 * Maps service-layer category to Prisma-compatible category.
 * 
 * Service layer has: INFRASTRUCTURE, SECURITY, SANITATION, UTILITIES,
 *                    COMPLAINT, GENERAL_INQUIRY, CERTIFICATE, PERMIT
 * Prisma has: PERMITS, LICENSES, CERTIFICATES, REGISTRATIONS, APPROVALS,
 *             RENEWALS, COMPLAINTS, INQUIRIES, OTHER
 */
export const mapServiceCategoryToPrisma = createEnumMapper<
  CivicCategoryService,
  CivicServiceCategoryPrisma
>(
  'CivicCategory:Service→Prisma',
  {
    'INFRASTRUCTURE': 'OTHER',
    'SECURITY': 'OTHER',
    'SANITATION': 'OTHER',
    'UTILITIES': 'OTHER',
    'COMPLAINT': 'COMPLAINTS',
    'GENERAL_INQUIRY': 'INQUIRIES',
    'CERTIFICATE': 'CERTIFICATES',
    'PERMIT': 'PERMITS'
  },
  'OTHER'
)

// =============================================================================
// PRISMA VALIDATORS (For reading from DB)
// =============================================================================

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

/**
 * Validates and returns a Prisma-compatible category value.
 */
export function validateCivicCategory(
  value: string | null | undefined
): CivicServiceCategoryPrisma | undefined {
  return validateEnumValue(value, CIVIC_SERVICE_CATEGORY_PRISMA)
}

// =============================================================================
// LEGACY ALIASES (Backwards compatibility)
// =============================================================================

/** @deprecated Use mapServiceStatusToPrisma */
export const mapCivicRequestStatusToPrisma = mapServiceStatusToPrisma

/** @deprecated Use mapServicePriorityToPrisma */
export const mapCivicPriorityToPrisma = mapServicePriorityToPrisma
