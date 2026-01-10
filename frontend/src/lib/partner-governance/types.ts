/**
 * Partner Governance Types
 * 
 * Data models for the Partner Governance, Rights & Pricing Control System.
 * These are governance facts - NOT billing execution.
 * 
 * @module lib/partner-governance/types
 * @phase Stop Point 2 - Super Admin Control Plane
 */

// =============================================================================
// PARTNER TYPES & CATEGORIES
// =============================================================================

export interface PartnerType {
  id: string
  name: string
  description: string
  defaultCapabilities: Partial<PartnerCapabilities>
  allowedCategories: string[]
  createdAt: string
  createdBy: string
}

export interface PartnerCategory {
  id: string
  name: string
  description: string
  tier: number // 1 = highest priority
  capabilityOverrides?: Partial<PartnerCapabilities>
  pricingOverrides?: {
    maxDiscountPercent: number
    canNegotiateCustom: boolean
  }
  createdAt: string
  createdBy: string
}

// =============================================================================
// PARTNER CAPABILITIES (Rights & Privileges)
// =============================================================================

export interface PartnerCapabilities {
  // Client Management
  canCreateClients: boolean
  canSuspendClients: boolean
  maxClients: number | null  // null = unlimited
  
  // Pricing Control
  canAssignPricing: boolean
  canCreatePricingModels: boolean
  canApplyDiscounts: boolean
  maxDiscountPercent: number
  
  // Trial Management
  canOfferTrials: boolean
  maxTrialDays: number
  maxConcurrentTrials: number | null
  
  // Domain Management
  canManageDomains: boolean
  maxDomains: number | null
  
  // Suite Access
  allowedSuites: string[]
  restrictedSuites: string[]
  
  // Administrative
  canViewPricingFacts: boolean
  canExportReports: boolean
  
  // Timestamps
  effectiveFrom: string
  effectiveUntil: string | null  // null = indefinite
}

// Default capabilities (baseline - read-only, no privileges)
export const DEFAULT_PARTNER_CAPABILITIES: PartnerCapabilities = {
  canCreateClients: false,
  canSuspendClients: false,
  maxClients: 0,
  canAssignPricing: false,
  canCreatePricingModels: false,
  canApplyDiscounts: false,
  maxDiscountPercent: 0,
  canOfferTrials: false,
  maxTrialDays: 0,
  maxConcurrentTrials: 0,
  canManageDomains: false,
  maxDomains: 0,
  allowedSuites: [],
  restrictedSuites: [],
  canViewPricingFacts: false,
  canExportReports: false,
  effectiveFrom: new Date().toISOString(),
  effectiveUntil: null,
}

// =============================================================================
// PRICING MODELS
// =============================================================================

export type PricingModelType = 
  | 'flat'        // Fixed price per period
  | 'per-suite'   // Price varies by suite
  | 'per-seat'    // Price by user count (fact only)
  | 'tiered'      // Volume-based tiers
  | 'custom'      // Negotiated custom terms

export type BillingPeriod = 'monthly' | 'quarterly' | 'annually'

export interface PricingModel {
  id: string
  name: string
  description: string
  type: PricingModelType
  config: PricingModelConfig
  currency: string
  billingPeriod: BillingPeriod
  isActive: boolean
  
  // Versioning (append-only)
  version: number
  previousVersionId: string | null
  
  // Governance
  createdAt: string
  createdBy: string
  approvedAt: string | null
  approvedBy: string | null
}

// Model-specific configurations
export type PricingModelConfig = 
  | FlatPricingConfig
  | PerSuitePricingConfig
  | PerSeatPricingConfig
  | TieredPricingConfig
  | CustomPricingConfig

export interface FlatPricingConfig {
  type: 'flat'
  basePrice: number
  includedSuites: string[]
}

export interface PerSuitePricingConfig {
  type: 'per-suite'
  suitePrices: Record<string, number>
}

export interface PerSeatPricingConfig {
  type: 'per-seat'
  pricePerSeat: number
  minSeats: number
  maxSeats: number | null
  includedSuites: string[]
}

export interface TieredPricingConfig {
  type: 'tiered'
  tiers: Array<{
    minUnits: number
    maxUnits: number | null
    pricePerUnit: number
  }>
  unitType: 'clients' | 'seats' | 'transactions'
}

export interface CustomPricingConfig {
  type: 'custom'
  terms: string
  customFields: Record<string, unknown>
}

// =============================================================================
// PRICING ASSIGNMENTS
// =============================================================================

export type AssignmentTargetType = 'partner' | 'partner-group' | 'client'
export type AssignmentStatus = 'active' | 'suspended' | 'expired'

export interface PricingAssignment {
  id: string
  targetType: AssignmentTargetType
  targetId: string
  pricingModelId: string
  
  // Override/customization
  overrides?: {
    discountPercent?: number
    customPrice?: number
    additionalTerms?: string
  }
  
  // Validity
  effectiveFrom: string
  effectiveUntil: string | null
  
  // Status
  status: AssignmentStatus
  
  // Governance
  assignedAt: string
  assignedBy: string
  approvalRequired: boolean
  approvedAt: string | null
  approvedBy: string | null
}

// =============================================================================
// PRICING FACTS (Emitted, NOT Billed)
// =============================================================================

export type PricingFactType = 
  | 'subscription'
  | 'seat-count'
  | 'usage'
  | 'trial-start'
  | 'trial-end'

// CRITICAL: This marker ensures facts are never mistaken for billing records
export type BillingStatus = 'FACT_ONLY_NOT_BILLED'

export interface PricingFact {
  id: string
  partnerId: string
  clientId: string
  factType: PricingFactType
  
  period: {
    start: string
    end: string
  }
  
  // Values (facts only, no billing)
  pricingModelId: string
  computedAmount: number  // What WOULD be charged (fact)
  currency: string
  
  // Breakdown
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  
  // Governance
  emittedAt: string
  emittedBy: string
  
  // CRITICAL: Explicit marker - this is NOT a billing record
  _billingStatus: BillingStatus
}

// =============================================================================
// TRIAL GRANTS
// =============================================================================

export type TrialStatus = 'pending' | 'active' | 'expired' | 'converted' | 'cancelled'
export type ExpiryAction = 'suspend' | 'convert-to-paid' | 'notify-only'

export interface TrialGrant {
  id: string
  clientId: string
  partnerId: string
  
  // Trial Configuration
  allowedSuites: string[]
  maxUsers: number | null
  
  // Duration
  startDate: string
  endDate: string
  durationDays: number
  
  // Expiry Behavior
  expiryAction: ExpiryAction
  expiryNotificationDays: number[]
  
  // Status
  status: TrialStatus
  
  // Governance
  createdAt: string
  createdBy: string
}

// =============================================================================
// PARTNER ENTITLEMENTS (Computed)
// =============================================================================

export interface PartnerEntitlement {
  partnerId: string
  partnerName: string
  partnerType: string
  partnerCategory: string
  
  // Resolved capabilities
  effectiveCapabilities: PartnerCapabilities
  
  // Pricing models available to assign
  availablePricingModels: string[]
  
  // Current assignment
  currentPricingAssignment: PricingAssignment | null
  
  // Client summary
  clientCount: number
  activeTrialCount: number
  
  // Computed timestamps
  computedAt: string
}

// =============================================================================
// AUDIT EVENTS
// =============================================================================

export type PartnerGovernanceAction =
  // Partner management
  | 'partner.type.assigned'
  | 'partner.category.assigned'
  | 'partner.capabilities.updated'
  
  // Pricing models
  | 'pricing-model.created'
  | 'pricing-model.updated'
  | 'pricing-model.activated'
  | 'pricing-model.deactivated'
  
  // Pricing assignments
  | 'pricing.assigned'
  | 'pricing.discount.applied'
  | 'pricing.assignment.revoked'
  
  // Facts
  | 'pricing.fact.emitted'

export interface PartnerGovernanceAuditEvent {
  id: string
  timestamp: string
  
  // Actor
  actorId: string
  actorType: 'super-admin' | 'partner-admin' | 'system'
  actorEmail: string
  
  // Action
  action: PartnerGovernanceAction
  
  // Scope
  scope: {
    partnerId?: string
    clientId?: string
    pricingModelId?: string
    trialId?: string
  }
  
  // Change details
  changeType: 'create' | 'update' | 'assign' | 'revoke' | 'emit'
  previousValue?: unknown
  newValue?: unknown
  
  // Context
  reason?: string
  ipAddress?: string
  sessionId?: string
}

// =============================================================================
// UI DISPLAY HELPERS
// =============================================================================

export interface CapabilityGroupDisplay {
  id: string
  name: string
  description: string
  capabilities: {
    key: keyof PartnerCapabilities
    label: string
    description: string
    type: 'boolean' | 'number' | 'string[]'
    unit?: string
  }[]
}

export const CAPABILITY_GROUPS: CapabilityGroupDisplay[] = [
  {
    id: 'client-management',
    name: 'Client Management',
    description: 'Control over client creation and lifecycle',
    capabilities: [
      { key: 'canCreateClients', label: 'Can Create Clients', description: 'Ability to create new client accounts', type: 'boolean' },
      { key: 'canSuspendClients', label: 'Can Suspend Clients', description: 'Ability to suspend client accounts', type: 'boolean' },
      { key: 'maxClients', label: 'Max Clients', description: 'Maximum number of clients allowed', type: 'number', unit: 'clients' },
    ]
  },
  {
    id: 'pricing-control',
    name: 'Pricing Control',
    description: 'Control over pricing and discount capabilities',
    capabilities: [
      { key: 'canAssignPricing', label: 'Can Assign Pricing', description: 'Ability to assign pricing models to clients', type: 'boolean' },
      { key: 'canCreatePricingModels', label: 'Can Create Pricing Models', description: 'Ability to create new pricing models', type: 'boolean' },
      { key: 'canApplyDiscounts', label: 'Can Apply Discounts', description: 'Ability to apply discounts to pricing', type: 'boolean' },
      { key: 'maxDiscountPercent', label: 'Max Discount %', description: 'Maximum discount percentage allowed', type: 'number', unit: '%' },
    ]
  },
  {
    id: 'trial-management',
    name: 'Trial Management',
    description: 'Control over trial offers',
    capabilities: [
      { key: 'canOfferTrials', label: 'Can Offer Trials', description: 'Ability to offer trial periods', type: 'boolean' },
      { key: 'maxTrialDays', label: 'Max Trial Days', description: 'Maximum trial period duration', type: 'number', unit: 'days' },
      { key: 'maxConcurrentTrials', label: 'Max Concurrent Trials', description: 'Maximum number of active trials', type: 'number', unit: 'trials' },
    ]
  },
  {
    id: 'domain-management',
    name: 'Domain Management',
    description: 'Control over domain configuration',
    capabilities: [
      { key: 'canManageDomains', label: 'Can Manage Domains', description: 'Ability to manage client domains', type: 'boolean' },
      { key: 'maxDomains', label: 'Max Domains', description: 'Maximum number of domains allowed', type: 'number', unit: 'domains' },
    ]
  },
  {
    id: 'suite-access',
    name: 'Suite Access',
    description: 'Control over suite availability',
    capabilities: [
      { key: 'allowedSuites', label: 'Allowed Suites', description: 'Suites this partner can offer', type: 'string[]' },
      { key: 'restrictedSuites', label: 'Restricted Suites', description: 'Suites explicitly denied', type: 'string[]' },
    ]
  },
  {
    id: 'administrative',
    name: 'Administrative',
    description: 'Administrative capabilities',
    capabilities: [
      { key: 'canViewPricingFacts', label: 'Can View Pricing Facts', description: 'Ability to view pricing fact records', type: 'boolean' },
      { key: 'canExportReports', label: 'Can Export Reports', description: 'Ability to export reports', type: 'boolean' },
    ]
  },
]

// =============================================================================
// SUITE DEFINITIONS
// =============================================================================

export const AVAILABLE_SUITES = [
  { id: 'commerce', name: 'Commerce Suite', description: 'E-commerce and retail management' },
  { id: 'education', name: 'Education Suite', description: 'School and learning management' },
  { id: 'health', name: 'Health Suite', description: 'Healthcare and clinic management' },
  { id: 'hospitality', name: 'Hospitality Suite', description: 'Hotel and hospitality management' },
  { id: 'church', name: 'Church Suite', description: 'Church and religious organization management' },
  { id: 'political', name: 'Political Suite', description: 'Political campaign management' },
  { id: 'civic', name: 'Civic Suite', description: 'Government and civic management' },
  { id: 'logistics', name: 'Logistics Suite', description: 'Delivery and logistics management' },
  { id: 'real-estate', name: 'Real Estate Suite', description: 'Property management' },
  { id: 'legal', name: 'Legal Practice Suite', description: 'Law firm management' },
  { id: 'recruitment', name: 'Recruitment Suite', description: 'HR and recruitment management' },
  { id: 'project', name: 'Project Suite', description: 'Project management' },
] as const

export type SuiteId = typeof AVAILABLE_SUITES[number]['id']
