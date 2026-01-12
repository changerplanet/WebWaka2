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
 * Phase 10D: Logs mismatches for observability.
 * 
 * @param value - URL search param value
 * @returns Valid service status or undefined
 */
export function validateServiceRequestStatus(
  value: string | null | undefined
): CivicRequestStatusService | undefined {
  return validateEnumValue(value, CIVIC_REQUEST_STATUS_SERVICE, 'CivicRequestStatus', 'API')
}

/**
 * Validates URL param against service-layer priority values.
 * Use this when passing priority to service functions.
 * 
 * Phase 10D: Logs mismatches for observability.
 */
export function validateServiceRequestPriority(
  value: string | null | undefined
): CivicPriorityService | undefined {
  return validateEnumValue(value, CIVIC_PRIORITY_SERVICE, 'CivicPriority', 'API')
}

/**
 * Validates URL param against service-layer category values.
 * Use this when passing category to service functions.
 * 
 * Phase 10D: Logs mismatches for observability.
 */
export function validateServiceRequestCategory(
  value: string | null | undefined
): CivicCategoryService | undefined {
  return validateEnumValue(value, CIVIC_CATEGORY_SERVICE, 'CivicCategory', 'API')
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
 * 
 * Phase 10D: Logs mismatches for observability.
 */
export function validateCivicRequestStatus(
  value: string | null | undefined
): CivicRequestStatusPrisma | undefined {
  return validateEnumValue(value, CIVIC_REQUEST_STATUS_PRISMA, 'CivicRequestStatusPrisma', 'DB')
}

/**
 * Validates and returns a Prisma-compatible priority value.
 * 
 * Phase 10D: Logs mismatches for observability.
 */
export function validateCivicPriority(
  value: string | null | undefined
): CivicCasePriorityPrisma | undefined {
  return validateEnumValue(value, CIVIC_CASE_PRIORITY_PRISMA, 'CivicCasePriorityPrisma', 'DB')
}

/**
 * Validates and returns a Prisma-compatible category value.
 * 
 * Phase 10D: Logs mismatches for observability.
 */
export function validateCivicCategory(
  value: string | null | undefined
): CivicServiceCategoryPrisma | undefined {
  return validateEnumValue(value, CIVIC_SERVICE_CATEGORY_PRISMA, 'CivicServiceCategoryPrisma', 'DB')
}

// =============================================================================
// LEGACY ALIASES (Backwards compatibility)
// =============================================================================

/** @deprecated Use mapServiceStatusToPrisma */
export const mapCivicRequestStatusToPrisma = mapServiceStatusToPrisma

/** @deprecated Use mapServicePriorityToPrisma */
export const mapCivicPriorityToPrisma = mapServicePriorityToPrisma

// =============================================================================
// EVENT STATUS & TYPE VALIDATORS (Phase 10C APPROVED)
// =============================================================================

/**
 * Civic event status values.
 * From: lib/civic/config.ts - EVENT_STATUS
 */
export const CIVIC_EVENT_STATUS_SERVICE = [
  'DRAFT',
  'SCHEDULED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED'
] as const

export type CivicEventStatusService = typeof CIVIC_EVENT_STATUS_SERVICE[number]

/**
 * Validates event status URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateEventStatus(
  value: string | null | undefined
): CivicEventStatusService | undefined {
  return validateEnumValue(value, CIVIC_EVENT_STATUS_SERVICE, 'CivicEventStatus', 'API')
}

/**
 * Civic event type values.
 * From: lib/civic/config.ts - EVENT_TYPES
 */
export const CIVIC_EVENT_TYPE_SERVICE = [
  'AGM',
  'EGM',
  'EXECUTIVE',
  'WARD',
  'TOWN_HALL',
  'COMMUNITY',
  'SANITATION',
  'CULTURAL',
  'INAUGURATION',
  'FUNDRAISING'
] as const

export type CivicEventTypeService = typeof CIVIC_EVENT_TYPE_SERVICE[number]

/**
 * Validates event type URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateEventType(
  value: string | null | undefined
): CivicEventTypeService | undefined {
  return validateEnumValue(value, CIVIC_EVENT_TYPE_SERVICE, 'CivicEventType', 'API')
}

// =============================================================================
// MEMBERSHIP STATUS & TYPE VALIDATORS (Phase 10C APPROVED)
// =============================================================================

/**
 * Membership status values (for constituents).
 * From: lib/civic/config.ts - MEMBERSHIP_STATUS
 */
export const CIVIC_MEMBERSHIP_STATUS_SERVICE = [
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'PENDING',
  'DECEASED'
] as const

export type CivicMembershipStatusService = typeof CIVIC_MEMBERSHIP_STATUS_SERVICE[number]

/**
 * Validates membership status URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateMembershipStatus(
  value: string | null | undefined
): CivicMembershipStatusService | undefined {
  return validateEnumValue(value, CIVIC_MEMBERSHIP_STATUS_SERVICE, 'CivicMembershipStatus', 'API')
}

/**
 * Membership type values (for constituents).
 * From: lib/civic/config.ts - MEMBERSHIP_TYPES
 */
export const CIVIC_MEMBERSHIP_TYPE_SERVICE = [
  'RESIDENT',
  'LANDLORD',
  'TENANT',
  'BUSINESS',
  'HONORARY',
  'ASSOCIATE'
] as const

export type CivicMembershipTypeService = typeof CIVIC_MEMBERSHIP_TYPE_SERVICE[number]

/**
 * Validates membership type URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateMembershipType(
  value: string | null | undefined
): CivicMembershipTypeService | undefined {
  return validateEnumValue(value, CIVIC_MEMBERSHIP_TYPE_SERVICE, 'CivicMembershipType', 'API')
}

// =============================================================================
// CERTIFICATE STATUS & TYPE VALIDATORS (Phase 10C APPROVED)
// =============================================================================

/**
 * Certificate status values.
 * From: lib/civic/config.ts - CERTIFICATE_STATUS
 */
export const CIVIC_CERTIFICATE_STATUS_SERVICE = [
  'PENDING',
  'APPROVED',
  'ISSUED',
  'REJECTED',
  'REVOKED',
  'EXPIRED'
] as const

export type CivicCertificateStatusService = typeof CIVIC_CERTIFICATE_STATUS_SERVICE[number]

/**
 * Validates certificate status URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateCertificateStatus(
  value: string | null | undefined
): CivicCertificateStatusService | undefined {
  return validateEnumValue(value, CIVIC_CERTIFICATE_STATUS_SERVICE, 'CivicCertificateStatus', 'API')
}

/**
 * Certificate type values.
 * From: lib/civic/config.ts - CERTIFICATE_TYPES
 */
export const CIVIC_CERTIFICATE_TYPE_SERVICE = [
  'GOOD_STANDING',
  'RESIDENCY',
  'CHARACTER',
  'MEMBERSHIP',
  'CLEARANCE',
  'INTRODUCTION_LETTER',
  'INDIGENE',
  'BUSINESS_PERMIT'
] as const

export type CivicCertificateTypeService = typeof CIVIC_CERTIFICATE_TYPE_SERVICE[number]

/**
 * Validates certificate type URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateCertificateType(
  value: string | null | undefined
): CivicCertificateTypeService | undefined {
  return validateEnumValue(value, CIVIC_CERTIFICATE_TYPE_SERVICE, 'CivicCertificateType', 'API')
}

// =============================================================================
// DUES STATUS & TYPE VALIDATORS (Phase 10C APPROVED)
// =============================================================================

/**
 * Payment/dues status values.
 * From: lib/civic/config.ts - PAYMENT_STATUS
 */
export const CIVIC_PAYMENT_STATUS_SERVICE = [
  'PAID',
  'PARTIAL',
  'PENDING',
  'OVERDUE',
  'WAIVED',
  'EXEMPT'
] as const

export type CivicPaymentStatusService = typeof CIVIC_PAYMENT_STATUS_SERVICE[number]

/**
 * Validates payment/dues status URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validatePaymentStatus(
  value: string | null | undefined
): CivicPaymentStatusService | undefined {
  return validateEnumValue(value, CIVIC_PAYMENT_STATUS_SERVICE, 'CivicPaymentStatus', 'API')
}

/**
 * Dues type values.
 * From: lib/civic/config.ts - DUES_TYPES
 */
export const CIVIC_DUES_TYPE_SERVICE = [
  'DEVELOPMENT_LEVY',
  'SERVICE_CHARGE',
  'SECURITY_LEVY',
  'TENEMENT_RATE',
  'MEMBERSHIP_DUES',
  'SPECIAL_LEVY',
  'TITHE',
  'OFFERING',
  'WELFARE'
] as const

export type CivicDuesTypeService = typeof CIVIC_DUES_TYPE_SERVICE[number]

/**
 * Validates dues type URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateDuesType(
  value: string | null | undefined
): CivicDuesTypeService | undefined {
  return validateEnumValue(value, CIVIC_DUES_TYPE_SERVICE, 'CivicDuesType', 'API')
}

// =============================================================================
// POLL/VOTING STATUS & TYPE VALIDATORS (Phase 10C APPROVED)
// =============================================================================

/**
 * Poll status values.
 * From: lib/civic/config.ts - POLL_STATUS
 */
export const CIVIC_POLL_STATUS_SERVICE = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'CLOSED',
  'CANCELLED',
  'RESULTS_DECLARED'
] as const

export type CivicPollStatusService = typeof CIVIC_POLL_STATUS_SERVICE[number]

/**
 * Validates poll status URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validatePollStatus(
  value: string | null | undefined
): CivicPollStatusService | undefined {
  return validateEnumValue(value, CIVIC_POLL_STATUS_SERVICE, 'CivicPollStatus', 'API')
}

/**
 * Poll type values.
 * From: lib/civic/config.ts - POLL_TYPES
 */
export const CIVIC_POLL_TYPE_SERVICE = [
  'ELECTION',
  'DECISION',
  'SURVEY',
  'BUDGET_APPROVAL'
] as const

export type CivicPollTypeService = typeof CIVIC_POLL_TYPE_SERVICE[number]

/**
 * Validates poll type URL param.
 * Phase 10D: Logs mismatches for observability.
 */
export function validatePollType(
  value: string | null | undefined
): CivicPollTypeService | undefined {
  return validateEnumValue(value, CIVIC_POLL_TYPE_SERVICE, 'CivicPollType', 'API')
}
