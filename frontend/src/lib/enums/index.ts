/**
 * ENUM MAPPING UTILITIES - PUBLIC API
 * ====================================
 * 
 * Central export point for all enum mapping utilities.
 * 
 * USAGE:
 * ```typescript
 * import { mapCivicRequestStatusToPrisma, validateVehicleType } from '@/lib/enums'
 * 
 * // Map service value to Prisma
 * const prismaStatus = mapCivicRequestStatusToPrisma(serviceStatus)
 * 
 * // Validate enum value
 * const vehicleType = validateVehicleType(searchParams.get('vehicleType'))
 * ```
 * 
 * @module lib/enums
 */

// Shared types and utilities
export {
  type EnumMappingResult,
  createEnumMapper,
  createEnumMapperWithResult,
  isValidEnumValue,
  validateEnumValue
} from './types'

// Civic module enums
export {
  // Service layer values (for API → Service boundary)
  CIVIC_REQUEST_STATUS_SERVICE,
  CIVIC_PRIORITY_SERVICE,
  CIVIC_CATEGORY_SERVICE,
  type CivicRequestStatusService,
  type CivicPriorityService,
  type CivicCategoryService,
  
  // Prisma canonical values (for DB storage)
  CIVIC_REQUEST_STATUS_PRISMA,
  CIVIC_CASE_PRIORITY_PRISMA,
  CIVIC_SERVICE_CATEGORY_PRISMA,
  type CivicRequestStatusPrisma,
  type CivicCasePriorityPrisma,
  type CivicServiceCategoryPrisma,
  
  // API → Service validators (bidirectional part 1)
  validateServiceRequestStatus,
  validateServiceRequestPriority,
  validateServiceRequestCategory,
  
  // Service → Prisma mappers (bidirectional part 2)
  mapServiceStatusToPrisma,
  mapServicePriorityToPrisma,
  mapServiceCategoryToPrisma,
  
  // Prisma validators
  validateCivicCategory,
  validateCivicRequestStatus,
  validateCivicPriority,
  
  // Legacy aliases
  mapCivicRequestStatusToPrisma,
  mapCivicPriorityToPrisma
} from './civic'

// Logistics module enums
export {
  // Prisma canonical values
  LOGISTICS_VEHICLE_TYPE_PRISMA,
  LOGISTICS_AGENT_STATUS_PRISMA,
  LOGISTICS_DELIVERY_STATUS_PRISMA,
  type LogisticsVehicleTypePrisma,
  type LogisticsAgentStatusPrisma,
  type LogisticsDeliveryStatusPrisma,
  
  // Service layer values
  LOGISTICS_JOB_STATUS_SERVICE,
  LOGISTICS_JOB_TYPE_SERVICE,
  LOGISTICS_JOB_PRIORITY_SERVICE,
  LOGISTICS_LICENSE_TYPE_SERVICE,
  LOGISTICS_DRIVER_STATUS_SERVICE,
  type LogisticsJobStatusService,
  type LogisticsJobTypeService,
  type LogisticsJobPriorityService,
  type LogisticsLicenseTypeService,
  type LogisticsDriverStatusService,
  
  // Validation functions
  validateVehicleType,
  validateAgentStatus,
  validateJobStatus,
  validateJobType,
  validateJobPriority,
  validateLicenseType,
  validateDriverStatus,
  
  // Stub functions (Phase 10C - CONDITIONAL)
  mapDeliveryStatusToPrisma
} from './logistics'

// SVM module enums (stubs only)
export {
  // Prisma canonical values
  SVM_ORDER_STATUS_PRISMA,
  SVM_PAYMENT_STATUS_PRISMA,
  type SvmOrderStatusPrisma,
  type SvmPaymentStatusPrisma,
  
  // Service layer values
  SVM_ORDER_STATUS_SERVICE,
  type SvmOrderStatusService,
  
  // Stub functions (Phase 10C)
  mapSvmOrderStatusToPrisma
} from './svm'
