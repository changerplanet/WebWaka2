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
 * ⚠️ CONDITIONAL: Not authorized for Phase 10B execution
 * 
 * TODO: Phase 10C - Service-only enum, no Prisma equivalent
 * 
 * Service values (full workflow):
 * - CREATED, PENDING, ASSIGNED, ACCEPTED, EN_ROUTE_PICKUP, AT_PICKUP,
 * - PICKED_UP, IN_TRANSIT, AT_DELIVERY, DELIVERED, COMPLETED, CANCELLED, FAILED
 * 
 * This is a UI/workflow enum only - no Prisma mapping needed.
 * May need validation utilities in Phase 10C.
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
