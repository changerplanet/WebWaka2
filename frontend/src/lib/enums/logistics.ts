/**
 * LOGISTICS ENUM MAPPERS
 * ======================
 * 
 * Compatibility mapping layer for Logistics module enums.
 * 
 * SCOPE:
 * - ✅ VehicleType (APPROVED for Phase 10B)
 * - ⚠️ DeliveryStatus (CONDITIONAL - stub only)
 * - ⚠️ JobStatus (CONDITIONAL - stub only)
 * 
 * @module lib/enums/logistics
 */

import { validateEnumValue } from './types'

// =============================================================================
// VEHICLE TYPE (APPROVED)
// =============================================================================

/**
 * LogisticsAgentType - Prisma schema values
 * Used for vehicle categorization
 */
export const LOGISTICS_VEHICLE_TYPE_PRISMA = [
  'MOTORCYCLE',
  'CAR',
  'VAN',
  'PICKUP',
  'TRICYCLE',
  'TRUCK_SMALL',
  'BUS_MINI',
  'TRUCK_MEDIUM',
  'BUS_STANDARD',
  'BUS_LUXURY',
  'TRUCK_LARGE'
] as const

export type LogisticsVehicleTypePrisma = typeof LOGISTICS_VEHICLE_TYPE_PRISMA[number]

/**
 * Validates and returns a Prisma-compatible vehicle type.
 * Vehicle types are aligned between service and Prisma.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateVehicleType(
  value: string | null | undefined
): LogisticsVehicleTypePrisma | undefined {
  return validateEnumValue(value, LOGISTICS_VEHICLE_TYPE_PRISMA, 'LogisticsVehicleType', 'API')
}

// =============================================================================
// AGENT STATUS (APPROVED)
// =============================================================================

/**
 * LogisticsAgentStatus - Prisma schema values
 */
export const LOGISTICS_AGENT_STATUS_PRISMA = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED'
] as const

export type LogisticsAgentStatusPrisma = typeof LOGISTICS_AGENT_STATUS_PRISMA[number]

/**
 * Validates and returns a Prisma-compatible agent status.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateAgentStatus(
  value: string | null | undefined
): LogisticsAgentStatusPrisma | undefined {
  return validateEnumValue(value, LOGISTICS_AGENT_STATUS_PRISMA, 'LogisticsAgentStatus', 'API')
}

// =============================================================================
// DELIVERY STATUS (PHASE 10E - DOMAIN APPROVED)
// =============================================================================

/**
 * ✅ PHASE 10E: Domain approval received (December 2025)
 * 
 * AUTHORITATIVE DECISION:
 * - Database (Prisma schema) is the single source of truth
 * - Service/UI statuses are semantic aliases mapped to Prisma statuses
 * 
 * CANONICAL STATUS MAPPING (Approved):
 * - READY → ASSIGNED
 * - OUT_FOR_DELIVERY → IN_TRANSIT
 * - COMPLETED → DELIVERED
 * - RETURNED → FAILED
 * 
 * TERMINAL STATES (Final, no transitions allowed):
 * - DELIVERED
 * - FAILED
 * - CANCELLED (maps to FAILED)
 * 
 * POLICY: Raw values preserved for audit, canonical values for business logic.
 */
export const LOGISTICS_DELIVERY_STATUS_PRISMA = [
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'PICKING_UP',
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVING',
  'DELIVERED',
  'FAILED',
  'RETURNED'
] as const

export type LogisticsDeliveryStatusPrisma = typeof LOGISTICS_DELIVERY_STATUS_PRISMA[number]

/**
 * Service-layer delivery status aliases.
 * These are semantic aliases that map to canonical Prisma statuses.
 */
export const LOGISTICS_DELIVERY_STATUS_SERVICE = [
  // Direct mappings (same as Prisma)
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'PICKING_UP',
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVING',
  'DELIVERED',
  'FAILED',
  'RETURNED',
  // Semantic aliases (approved mappings)
  'READY',           // → ASSIGNED
  'OUT_FOR_DELIVERY', // → IN_TRANSIT  
  'COMPLETED',       // → DELIVERED
  'CANCELLED'        // → FAILED (terminal)
] as const

export type LogisticsDeliveryStatusService = typeof LOGISTICS_DELIVERY_STATUS_SERVICE[number]

/**
 * Maps service-layer delivery status to canonical Prisma status.
 * 
 * PHASE 10E: Domain-approved mapping implementation.
 * 
 * @param serviceStatus - Service/UI status value
 * @returns Canonical Prisma status
 */
export function mapDeliveryStatusToPrisma(
  serviceStatus: string | null | undefined
): LogisticsDeliveryStatusPrisma | undefined {
  if (!serviceStatus) {
    return undefined
  }
  
  // Direct mappings (already Prisma-compatible)
  if (isValidEnumValue(serviceStatus, LOGISTICS_DELIVERY_STATUS_PRISMA)) {
    return serviceStatus
  }
  
  // Semantic alias mappings (approved by domain)
  const aliasMap: Record<string, LogisticsDeliveryStatusPrisma> = {
    'READY': 'ASSIGNED',
    'OUT_FOR_DELIVERY': 'IN_TRANSIT',
    'COMPLETED': 'DELIVERED',
    'CANCELLED': 'FAILED'
  }
  
  if (serviceStatus in aliasMap) {
    return aliasMap[serviceStatus]
  }
  
  // Unknown value - log and return undefined
  logEnumMismatch({
    enumName: 'LogisticsDeliveryStatus',
    value: serviceStatus,
    source: 'API'
  })
  
  return undefined
}

/**
 * Validates a delivery status value against Prisma canonical statuses.
 * 
 * PHASE 10E: Use this at API boundaries when the service expects Prisma types.
 * Phase 10D: Logs mismatches for observability.
 * 
 * @param value - URL search param or input value
 * @returns Valid Prisma delivery status or undefined
 */
export function validateDeliveryStatus(
  value: string | null | undefined
): LogisticsDeliveryStatusPrisma | undefined {
  return validateEnumValue(value, LOGISTICS_DELIVERY_STATUS_PRISMA, 'LogisticsDeliveryStatus', 'API')
}

/**
 * Validates and maps a comma-separated list of delivery statuses.
 * 
 * PHASE 10E: Handles array inputs from URL params (e.g., "PENDING,ASSIGNED,DELIVERED")
 * 
 * @param value - Comma-separated status string
 * @returns Array of valid Prisma delivery statuses
 */
export function validateDeliveryStatusArray(
  value: string | null | undefined
): LogisticsDeliveryStatusPrisma[] | undefined {
  if (!value) {
    return undefined
  }
  
  const statuses = value.split(',').map(s => s.trim())
  const validStatuses: LogisticsDeliveryStatusPrisma[] = []
  
  for (const status of statuses) {
    // First try direct Prisma mapping
    const prismaStatus = mapDeliveryStatusToPrisma(status)
    if (prismaStatus) {
      // Avoid duplicates
      if (!validStatuses.includes(prismaStatus)) {
        validStatuses.push(prismaStatus)
      }
    }
  }
  
  return validStatuses.length > 0 ? validStatuses : undefined
}

// =============================================================================
// JOB STATUS (CONDITIONAL - STUB ONLY)
// =============================================================================

/**
 * JOB STATUS - SERVICE-ONLY ENUM (Phase 10C APPROVED)
 * 
 * This is a UI/workflow enum only - no Prisma mapping needed.
 * Per PHASE_10_ENUM_AUTHORITY_MATRIX: SERVICE-ONLY enums don't need DB alignment.
 * 
 * Service values (full workflow):
 * - CREATED, PENDING, ASSIGNED, ACCEPTED, EN_ROUTE_PICKUP, AT_PICKUP,
 * - PICKED_UP, IN_TRANSIT, AT_DELIVERY, DELIVERED, COMPLETED, CANCELLED, FAILED
 */
export const LOGISTICS_JOB_STATUS_SERVICE = [
  'CREATED',
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'FAILED'
] as const

export type LogisticsJobStatusService = typeof LOGISTICS_JOB_STATUS_SERVICE[number]

/**
 * Validates and returns a valid job status value.
 * Used at API boundaries for filter params.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateJobStatus(
  value: string | null | undefined
): LogisticsJobStatusService | undefined {
  return validateEnumValue(value, LOGISTICS_JOB_STATUS_SERVICE, 'LogisticsJobStatus', 'API')
}

// =============================================================================
// JOB TYPE - SERVICE-ONLY ENUM (Phase 10C APPROVED)
// =============================================================================

/**
 * Job types used in logistics service layer.
 * No Prisma equivalent - these are UI/workflow enums.
 */
export const LOGISTICS_JOB_TYPE_SERVICE = [
  'DELIVERY',
  'PICKUP',
  'PICKUP_DELIVERY',
  'MULTI_STOP',
  'TRANSPORT',
  'FREIGHT',
  'TRANSFER'
] as const

export type LogisticsJobTypeService = typeof LOGISTICS_JOB_TYPE_SERVICE[number]

/**
 * Validates and returns a valid job type value.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateJobType(
  value: string | null | undefined
): LogisticsJobTypeService | undefined {
  return validateEnumValue(value, LOGISTICS_JOB_TYPE_SERVICE, 'LogisticsJobType', 'API')
}

// =============================================================================
// JOB PRIORITY - SERVICE-ONLY ENUM (Phase 10C APPROVED)
// =============================================================================

/**
 * Job priority levels used in logistics service layer.
 * No Prisma equivalent - these are UI/workflow enums.
 */
export const LOGISTICS_JOB_PRIORITY_SERVICE = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
  'EXPRESS'
] as const

export type LogisticsJobPriorityService = typeof LOGISTICS_JOB_PRIORITY_SERVICE[number]

/**
 * Validates and returns a valid job priority value.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateJobPriority(
  value: string | null | undefined
): LogisticsJobPriorityService | undefined {
  return validateEnumValue(value, LOGISTICS_JOB_PRIORITY_SERVICE, 'LogisticsJobPriority', 'API')
}

// =============================================================================
// LICENSE TYPE - SERVICE-ONLY ENUM (Phase 10C APPROVED)
// =============================================================================

/**
 * Driver license types used in logistics service layer.
 * No Prisma equivalent - these are UI/workflow enums.
 */
export const LOGISTICS_LICENSE_TYPE_SERVICE = [
  'CLASS_A',
  'CLASS_B',
  'CLASS_C',
  'CLASS_D',
  'CLASS_E'
] as const

export type LogisticsLicenseTypeService = typeof LOGISTICS_LICENSE_TYPE_SERVICE[number]

/**
 * Validates and returns a valid license type value.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateLicenseType(
  value: string | null | undefined
): LogisticsLicenseTypeService | undefined {
  return validateEnumValue(value, LOGISTICS_LICENSE_TYPE_SERVICE, 'LogisticsLicenseType', 'API')
}

// =============================================================================
// DRIVER STATUS - SERVICE-ONLY ENUM (Phase 10C APPROVED)
// =============================================================================

/**
 * Driver status values used in logistics service layer.
 * Different from Prisma LogisticsAgentStatus - this is operational status.
 */
export const LOGISTICS_DRIVER_STATUS_SERVICE = [
  'AVAILABLE',
  'ON_TRIP',
  'OFF_DUTY',
  'ON_BREAK',
  'SUSPENDED'
] as const

export type LogisticsDriverStatusService = typeof LOGISTICS_DRIVER_STATUS_SERVICE[number]

/**
 * Validates and returns a valid driver status value.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateDriverStatus(
  value: string | null | undefined
): LogisticsDriverStatusService | undefined {
  return validateEnumValue(value, LOGISTICS_DRIVER_STATUS_SERVICE, 'LogisticsDriverStatus', 'API')
}

// =============================================================================
// VEHICLE STATUS - SERVICE-ONLY ENUM (Phase 10C APPROVED)
// =============================================================================

/**
 * Vehicle status values used in logistics service layer.
 * From: lib/logistics/config.ts - VEHICLE_STATUS
 */
export const LOGISTICS_VEHICLE_STATUS_SERVICE = [
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'RESERVED'
] as const

export type LogisticsVehicleStatusService = typeof LOGISTICS_VEHICLE_STATUS_SERVICE[number]

/**
 * Validates and returns a valid vehicle status value.
 * Phase 10D: Logs mismatches for observability.
 */
export function validateVehicleStatus(
  value: string | null | undefined
): LogisticsVehicleStatusService | undefined {
  return validateEnumValue(value, LOGISTICS_VEHICLE_STATUS_SERVICE, 'LogisticsVehicleStatus', 'API')
}
