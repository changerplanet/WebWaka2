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
 */
export function validateVehicleType(
  value: string | null | undefined
): LogisticsVehicleTypePrisma | undefined {
  return validateEnumValue(value, LOGISTICS_VEHICLE_TYPE_PRISMA)
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
 */
export function validateAgentStatus(
  value: string | null | undefined
): LogisticsAgentStatusPrisma | undefined {
  return validateEnumValue(value, LOGISTICS_AGENT_STATUS_PRISMA)
}

// =============================================================================
// DELIVERY STATUS (CONDITIONAL - STUB ONLY)
// =============================================================================

/**
 * ⚠️ CONDITIONAL: Not authorized for Phase 10B execution
 * 
 * TODO: Phase 10C - Requires domain approval for mapping decisions
 * 
 * Prisma values:
 * - PENDING, ASSIGNED, ACCEPTED, PICKING_UP, PICKED_UP, 
 * - IN_TRANSIT, ARRIVING, DELIVERED, FAILED, RETURNED
 * 
 * Service values (richer workflow):
 * - CREATED, PENDING, ASSIGNED, ACCEPTED, EN_ROUTE_PICKUP, AT_PICKUP,
 * - PICKED_UP, IN_TRANSIT, AT_DELIVERY, DELIVERED, COMPLETED, CANCELLED, FAILED
 * 
 * Mapping decisions required:
 * - CREATED → ? (no Prisma equivalent)
 * - EN_ROUTE_PICKUP → PICKING_UP?
 * - AT_PICKUP → PICKING_UP?
 * - AT_DELIVERY → ARRIVING?
 * - COMPLETED → DELIVERED?
 * - CANCELLED → FAILED?
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

// Stub function - NOT IMPLEMENTED
export function mapDeliveryStatusToPrisma(
  serviceStatus: string | null | undefined
): LogisticsDeliveryStatusPrisma {
  // Log the attempted usage for debugging
  console.error('[Phase 10C Required] mapDeliveryStatusToPrisma called with:', serviceStatus)
  throw new Error(
    '[Phase 10C Required] mapDeliveryStatusToPrisma is not yet implemented. ' +
    'Requires domain approval for mapping decisions.'
  )
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
 */
export function validateJobStatus(
  value: string | null | undefined
): LogisticsJobStatusService | undefined {
  return validateEnumValue(value, LOGISTICS_JOB_STATUS_SERVICE)
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
 */
export function validateJobType(
  value: string | null | undefined
): LogisticsJobTypeService | undefined {
  return validateEnumValue(value, LOGISTICS_JOB_TYPE_SERVICE)
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
 */
export function validateJobPriority(
  value: string | null | undefined
): LogisticsJobPriorityService | undefined {
  return validateEnumValue(value, LOGISTICS_JOB_PRIORITY_SERVICE)
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
 */
export function validateLicenseType(
  value: string | null | undefined
): LogisticsLicenseTypeService | undefined {
  return validateEnumValue(value, LOGISTICS_LICENSE_TYPE_SERVICE)
}
