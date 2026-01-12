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
  type EnumMismatchLog,
  createEnumMapper,
  createEnumMapperWithResult,
  isValidEnumValue,
  validateEnumValue,
  logEnumMismatch
} from './types'

// Civic module enums
export {
  // Service layer values (for API → Service boundary)
  CIVIC_REQUEST_STATUS_SERVICE,
  CIVIC_PRIORITY_SERVICE,
  CIVIC_CATEGORY_SERVICE,
  CIVIC_EVENT_STATUS_SERVICE,
  CIVIC_EVENT_TYPE_SERVICE,
  CIVIC_MEMBERSHIP_STATUS_SERVICE,
  CIVIC_MEMBERSHIP_TYPE_SERVICE,
  CIVIC_CERTIFICATE_STATUS_SERVICE,
  CIVIC_CERTIFICATE_TYPE_SERVICE,
  CIVIC_PAYMENT_STATUS_SERVICE,
  CIVIC_DUES_TYPE_SERVICE,
  CIVIC_POLL_STATUS_SERVICE,
  CIVIC_POLL_TYPE_SERVICE,
  type CivicRequestStatusService,
  type CivicPriorityService,
  type CivicCategoryService,
  type CivicEventStatusService,
  type CivicEventTypeService,
  type CivicMembershipStatusService,
  type CivicMembershipTypeService,
  type CivicCertificateStatusService,
  type CivicCertificateTypeService,
  type CivicPaymentStatusService,
  type CivicDuesTypeService,
  type CivicPollStatusService,
  type CivicPollTypeService,
  
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
  validateEventStatus,
  validateEventType,
  validateMembershipStatus,
  validateMembershipType,
  validateCertificateStatus,
  validateCertificateType,
  validatePaymentStatus,
  validateDuesType,
  validatePollStatus,
  validatePollType,
  
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
  LOGISTICS_VEHICLE_STATUS_SERVICE,
  LOGISTICS_DELIVERY_STATUS_SERVICE,
  type LogisticsJobStatusService,
  type LogisticsJobTypeService,
  type LogisticsJobPriorityService,
  type LogisticsLicenseTypeService,
  type LogisticsDriverStatusService,
  type LogisticsVehicleStatusService,
  type LogisticsDeliveryStatusService,
  
  // Validation functions
  validateVehicleType,
  validateAgentStatus,
  validateJobStatus,
  validateJobType,
  validateJobPriority,
  validateLicenseType,
  validateDriverStatus,
  validateVehicleStatus,
  validateDeliveryStatus,
  validateDeliveryStatusArray,
  
  // Phase 10E - Delivery status mapping (domain approved)
  mapDeliveryStatusToPrisma
} from './logistics'

// Procurement module enums (Phase 11B)
export {
  PROC_PRIORITY,
  PROC_PURCHASE_ORDER_STATUS,
  PROC_PURCHASE_REQUEST_STATUS,
  PROC_RECEIPT_STATUS,
  PROC_ORDER_ORDER_BY_FIELDS,
  PROC_REQUEST_ORDER_BY_FIELDS,
  type ProcPriorityType,
  type ProcPurchaseOrderStatusType,
  type ProcPurchaseRequestStatusType,
  type ProcReceiptStatusType,
  type ProcOrderOrderByField,
  type ProcRequestOrderByField,
  type OrderDir,
  validateProcPriority,
  validateProcPriorityArray,
  validatePurchaseOrderStatus,
  validatePurchaseOrderStatusArray,
  validatePurchaseRequestStatus,
  validatePurchaseRequestStatusArray,
  validateReceiptStatus,
  validateReceiptStatusArray,
  validateProcOrderOrderBy,
  validateProcRequestOrderBy,
  validateOrderDir
} from './procurement'

// Project Management module enums (Phase 11B)
export {
  PM_PROJECT_STATUS,
  PM_PROJECT_PRIORITY,
  PM_PROJECT_HEALTH,
  PM_TASK_STATUS,
  PM_TASK_PRIORITY,
  PM_TEAM_ROLE,
  type PmProjectStatusType,
  type PmProjectPriorityType,
  type PmProjectHealthType,
  type PmTaskStatusType,
  type PmTaskPriorityType,
  type PmTeamRoleType,
  validateProjectStatus,
  validateProjectPriority,
  validateProjectHealth,
  validateTaskStatus,
  validateTaskPriority,
  validateTeamRole
} from './project-management'

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
