/**
 * Phase 16B - Entity Builders Index
 * 
 * Central export point for all entity builders.
 * These builders transform service-layer inputs into Prisma-compliant types.
 */

// CRM Builders
export {
  buildLoyaltyTransactionCreate,
  buildEngagementEventCreate,
  buildCustomerSegmentCreate,
  buildSegmentMembershipCreate,
  buildSegmentMembershipCreateMany,
  buildLoyaltyProgramCreate,
  buildLoyaltyRuleCreate,
  buildCampaignCreate,
  buildCampaignAudienceCreate,
  buildCrmConfigurationUpsert,
  type LoyaltyTransactionInput,
  type EngagementEventInput,
  type CustomerSegmentInput,
  type SegmentMembershipInput,
  type LoyaltyProgramInput,
  type LoyaltyRuleInput,
  type CampaignInput,
  type CampaignAudienceInput,
  type CrmConfigurationInput,
} from './CrmBuilders';

// Logistics Builders
export {
  buildDeliveryAssignmentCreate,
  buildDeliveryAssignmentUpdate,
  buildDeliveryZoneCreate,
  buildDeliveryZoneUpdate,
  buildDeliveryAgentCreate,
  buildDeliveryProofCreate,
  buildLogisticsConfigCreate,
  buildLogisticsConfigUpdate,
  buildStatusHistoryCreate,
  type DeliveryAssignmentInput,
  type DeliveryZoneInput,
  type DeliveryAgentInput,
  type DeliveryProofInput,
  type LogisticsConfigInput,
  type StatusHistoryInput,
} from './LogisticsBuilders';

// Education Builders
export {
  buildAssessmentCreate,
  buildGuardianCreate,
  buildGuardianUpdate,
  buildAttendanceCreate,
  buildAttendanceCreateMany,
  buildFeeStructureCreate,
  buildFeeAssignmentCreate,
  buildFeeAssignmentCreateMany,
  buildResultCreate,
  buildResultUpsert,
  type AssessmentInput,
  type GuardianInput,
  type AttendanceInput,
  type FeeStructureInput,
  type FeeAssignmentInput,
  type ResultInput,
} from './EducationBuilders';

// Procurement Builders
export {
  buildPurchaseOrderCreate,
  buildPurchaseOrderUpdate,
  buildPurchaseOrderItemCreate,
  buildPurchaseRequestCreate,
  buildPurchaseRequestUpdate,
  buildPurchaseRequestItemCreate,
  type PurchaseOrderInput,
  type PurchaseOrderItemInput,
  type PurchaseRequestInput,
  type PurchaseRequestItemInput,
} from './ProcurementBuilders';
