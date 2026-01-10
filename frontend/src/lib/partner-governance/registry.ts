/**
 * Partner Governance Registry
 * 
 * Config-based registry for Partner Types, Categories, and Pricing Models.
 * NO DATABASE SCHEMA CHANGES - static/env-driven only.
 * 
 * @module lib/partner-governance/registry
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import {
  PartnerType,
  PartnerCategory,
  PricingModel,
  PartnerCapabilities,
  DEFAULT_PARTNER_CAPABILITIES,
  PricingAssignment,
  PartnerEntitlement,
} from './types'

// =============================================================================
// PARTNER TYPES REGISTRY
// =============================================================================

export const PARTNER_TYPES: PartnerType[] = [
  {
    id: 'reseller',
    name: 'Reseller',
    description: 'Partners who resell WebWaka to their clients',
    defaultCapabilities: {
      canCreateClients: true,
      canAssignPricing: true,
      canApplyDiscounts: true,
      maxDiscountPercent: 15,
      canOfferTrials: true,
      maxTrialDays: 14,
      maxConcurrentTrials: 5,
      canManageDomains: true,
      maxDomains: 10,
      canViewPricingFacts: true,
      canExportReports: true,
      allowedSuites: ['commerce', 'education', 'health', 'hospitality'],
    },
    allowedCategories: ['standard', 'strategic'],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'system-integrator',
    name: 'System Integrator',
    description: 'Partners who integrate WebWaka into larger solutions',
    defaultCapabilities: {
      canCreateClients: true,
      canCreatePricingModels: true,
      canAssignPricing: true,
      canApplyDiscounts: true,
      maxDiscountPercent: 25,
      canOfferTrials: true,
      maxTrialDays: 30,
      maxConcurrentTrials: 10,
      canManageDomains: true,
      maxDomains: 50,
      canViewPricingFacts: true,
      canExportReports: true,
      allowedSuites: ['commerce', 'education', 'health', 'hospitality', 'logistics', 'real-estate'],
    },
    allowedCategories: ['strategic', 'pilot'],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'government-partner',
    name: 'Government Partner',
    description: 'Partners serving government/civic entities',
    defaultCapabilities: {
      canCreateClients: true,
      canSuspendClients: false,
      canAssignPricing: false,
      canCreatePricingModels: false,
      canApplyDiscounts: false,
      maxDiscountPercent: 0,
      canOfferTrials: true,
      maxTrialDays: 60,
      maxConcurrentTrials: 3,
      canManageDomains: true,
      maxDomains: 5,
      canViewPricingFacts: true,
      canExportReports: true,
      allowedSuites: ['civic', 'education', 'health'],
    },
    allowedCategories: ['strategic', 'restricted'],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'faith-partner',
    name: 'Faith Partner',
    description: 'Partners serving religious organizations',
    defaultCapabilities: {
      canCreateClients: true,
      canSuspendClients: true,
      canAssignPricing: true,
      canApplyDiscounts: true,
      maxDiscountPercent: 20,
      canOfferTrials: true,
      maxTrialDays: 30,
      maxConcurrentTrials: 10,
      canManageDomains: true,
      maxDomains: 20,
      canViewPricingFacts: true,
      canExportReports: true,
      allowedSuites: ['church', 'education'],
    },
    allowedCategories: ['standard', 'pilot'],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'education-partner',
    name: 'Education Partner',
    description: 'Partners serving educational institutions',
    defaultCapabilities: {
      canCreateClients: true,
      canSuspendClients: true,
      canAssignPricing: true,
      canApplyDiscounts: true,
      maxDiscountPercent: 25,
      canOfferTrials: true,
      maxTrialDays: 45,
      maxConcurrentTrials: 15,
      canManageDomains: true,
      maxDomains: 30,
      canViewPricingFacts: true,
      canExportReports: true,
      allowedSuites: ['education'],
    },
    allowedCategories: ['standard', 'strategic', 'pilot'],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
]

// =============================================================================
// PARTNER CATEGORIES REGISTRY
// =============================================================================

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  {
    id: 'strategic',
    name: 'Strategic Partner',
    description: 'High-value, long-term partnership with enhanced capabilities',
    tier: 1,
    capabilityOverrides: {
      canCreatePricingModels: true,
      maxTrialDays: 90,
      maxClients: null, // unlimited
      maxDomains: null, // unlimited
    },
    pricingOverrides: {
      maxDiscountPercent: 30,
      canNegotiateCustom: true,
    },
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'standard',
    name: 'Standard Partner',
    description: 'Standard partnership terms with base capabilities',
    tier: 2,
    capabilityOverrides: {
      maxClients: 100,
      maxDomains: 50,
    },
    pricingOverrides: {
      maxDiscountPercent: 15,
      canNegotiateCustom: false,
    },
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'pilot',
    name: 'Pilot Partner',
    description: 'Evaluation/pilot partnership with limited capabilities',
    tier: 3,
    capabilityOverrides: {
      maxTrialDays: 14,
      maxClients: 10,
      maxConcurrentTrials: 3,
      maxDomains: 5,
      canCreatePricingModels: false,
    },
    pricingOverrides: {
      maxDiscountPercent: 0,
      canNegotiateCustom: false,
    },
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'restricted',
    name: 'Restricted Partner',
    description: 'Limited capabilities pending review or compliance',
    tier: 4,
    capabilityOverrides: {
      canCreateClients: false,
      canAssignPricing: false,
      canApplyDiscounts: false,
      canOfferTrials: false,
      maxClients: 0,
      maxDomains: 0,
    },
    pricingOverrides: {
      maxDiscountPercent: 0,
      canNegotiateCustom: false,
    },
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
]

// =============================================================================
// PRICING MODELS REGISTRY
// =============================================================================

export const PRICING_MODELS: PricingModel[] = [
  {
    id: 'flat-basic',
    name: 'Basic Flat',
    description: 'Simple flat-rate pricing with core suites',
    type: 'flat',
    config: {
      type: 'flat',
      basePrice: 50000,
      includedSuites: ['commerce'],
    },
    currency: 'NGN',
    billingPeriod: 'monthly',
    isActive: true,
    version: 1,
    previousVersionId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    approvedAt: '2026-01-01T00:00:00Z',
    approvedBy: 'system',
  },
  {
    id: 'flat-professional',
    name: 'Professional Flat',
    description: 'Professional tier with multiple suites',
    type: 'flat',
    config: {
      type: 'flat',
      basePrice: 100000,
      includedSuites: ['commerce', 'inventory', 'accounting'],
    },
    currency: 'NGN',
    billingPeriod: 'monthly',
    isActive: true,
    version: 1,
    previousVersionId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    approvedAt: '2026-01-01T00:00:00Z',
    approvedBy: 'system',
  },
  {
    id: 'per-suite-standard',
    name: 'Per-Suite Standard',
    description: 'Pay per suite pricing model',
    type: 'per-suite',
    config: {
      type: 'per-suite',
      suitePrices: {
        commerce: 30000,
        education: 25000,
        health: 35000,
        hospitality: 40000,
        church: 20000,
        civic: 45000,
        logistics: 30000,
        'real-estate': 35000,
      },
    },
    currency: 'NGN',
    billingPeriod: 'monthly',
    isActive: true,
    version: 1,
    previousVersionId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    approvedAt: '2026-01-01T00:00:00Z',
    approvedBy: 'system',
  },
  {
    id: 'per-seat-enterprise',
    name: 'Enterprise Per-Seat',
    description: 'Per-seat pricing for enterprise clients',
    type: 'per-seat',
    config: {
      type: 'per-seat',
      pricePerSeat: 5000,
      minSeats: 10,
      maxSeats: null,
      includedSuites: ['commerce', 'inventory', 'accounting', 'crm', 'hr'],
    },
    currency: 'NGN',
    billingPeriod: 'monthly',
    isActive: true,
    version: 1,
    previousVersionId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    approvedAt: '2026-01-01T00:00:00Z',
    approvedBy: 'system',
  },
  {
    id: 'tiered-volume',
    name: 'Volume Tiered',
    description: 'Volume-based tiered pricing',
    type: 'tiered',
    config: {
      type: 'tiered',
      tiers: [
        { minUnits: 1, maxUnits: 10, pricePerUnit: 50000 },
        { minUnits: 11, maxUnits: 50, pricePerUnit: 40000 },
        { minUnits: 51, maxUnits: 100, pricePerUnit: 30000 },
        { minUnits: 101, maxUnits: null, pricePerUnit: 20000 },
      ],
      unitType: 'clients',
    },
    currency: 'NGN',
    billingPeriod: 'monthly',
    isActive: true,
    version: 1,
    previousVersionId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    approvedAt: '2026-01-01T00:00:00Z',
    approvedBy: 'system',
  },
]

// =============================================================================
// PRICING ASSIGNMENTS STORE (In-memory for demo)
// =============================================================================

// In production, this would be persisted to a database
let PRICING_ASSIGNMENTS: PricingAssignment[] = []

// =============================================================================
// REGISTRY LOOKUP FUNCTIONS
// =============================================================================

// Partner Types
export function getPartnerType(id: string): PartnerType | undefined {
  return PARTNER_TYPES.find((t: any) => t.id === id)
}

export function getAllPartnerTypes(): PartnerType[] {
  return [...PARTNER_TYPES]
}

// Partner Categories
export function getPartnerCategory(id: string): PartnerCategory | undefined {
  return PARTNER_CATEGORIES.find((c: any) => c.id === id)
}

export function getAllPartnerCategories(): PartnerCategory[] {
  return [...PARTNER_CATEGORIES]
}

export function getCategoriesForType(typeId: string): PartnerCategory[] {
  const type = getPartnerType(typeId)
  if (!type) return []
  return PARTNER_CATEGORIES.filter((c: any) => type.allowedCategories.includes(c.id))
}

// Pricing Models
export function getPricingModel(id: string): PricingModel | undefined {
  return PRICING_MODELS.find((m: any) => m.id === id)
}

export function getAllPricingModels(): PricingModel[] {
  return [...PRICING_MODELS]
}

export function getActivePricingModels(): PricingModel[] {
  return PRICING_MODELS.filter((m: any) => m.isActive)
}

// Pricing Assignments
export function getPricingAssignment(id: string): PricingAssignment | undefined {
  return PRICING_ASSIGNMENTS.find((a: any) => a.id === id)
}

export function getAssignmentsForTarget(targetType: string, targetId: string): PricingAssignment[] {
  return PRICING_ASSIGNMENTS.filter((a: any) => a.targetType === targetType && a.targetId === targetId)
}

export function getActiveAssignmentForTarget(targetType: string, targetId: string): PricingAssignment | undefined {
  return PRICING_ASSIGNMENTS.find(
    (a: any) => a.targetType === targetType && a.targetId === targetId && a.status === 'active'
  )
}

export function addPricingAssignment(assignment: PricingAssignment): void {
  PRICING_ASSIGNMENTS.push(assignment)
}

export function updatePricingAssignment(id: string, updates: Partial<PricingAssignment>): boolean {
  const index = PRICING_ASSIGNMENTS.findIndex((a: any) => a.id === id)
  if (index === -1) return false
  PRICING_ASSIGNMENTS[index] = { ...PRICING_ASSIGNMENTS[index], ...updates }
  return true
}

// =============================================================================
// CAPABILITY RESOLUTION
// =============================================================================

/**
 * Resolve effective capabilities for a partner based on type, category, and overrides.
 * Priority: Partner-specific > Category > Type > Default
 */
export function resolvePartnerCapabilities(
  typeId: string,
  categoryId: string,
  partnerOverrides?: Partial<PartnerCapabilities>
): PartnerCapabilities {
  const type = getPartnerType(typeId)
  const category = getPartnerCategory(categoryId)
  
  // Start with defaults
  let capabilities: PartnerCapabilities = { ...DEFAULT_PARTNER_CAPABILITIES }
  
  // Apply type defaults
  if (type?.defaultCapabilities) {
    capabilities = { ...capabilities, ...type.defaultCapabilities }
  }
  
  // Apply category overrides (higher priority)
  if (category?.capabilityOverrides) {
    capabilities = { ...capabilities, ...category.capabilityOverrides }
  }
  
  // Apply partner-specific overrides (highest priority)
  if (partnerOverrides) {
    capabilities = { ...capabilities, ...partnerOverrides }
  }
  
  // Ensure effectiveFrom is set
  if (!capabilities.effectiveFrom) {
    capabilities.effectiveFrom = new Date().toISOString()
  }
  
  return capabilities
}

/**
 * Compute full partner entitlement including resolved capabilities
 */
export function computePartnerEntitlement(
  partnerId: string,
  partnerName: string,
  typeId: string,
  categoryId: string,
  partnerOverrides?: Partial<PartnerCapabilities>,
  clientCount: number = 0,
  activeTrialCount: number = 0
): PartnerEntitlement {
  const effectiveCapabilities = resolvePartnerCapabilities(typeId, categoryId, partnerOverrides)
  const currentAssignment = getActiveAssignmentForTarget('partner', partnerId)
  
  // Get available pricing models based on capabilities
  const availablePricingModels = getActivePricingModels()
    .filter((m: any) => {
      // All partners can be assigned pricing models
      // Custom models require canCreatePricingModels
      if (m.type === 'custom' && !effectiveCapabilities.canCreatePricingModels) {
        return false
      }
      return true
    })
    .map((m: any) => m.id)
  
  return {
    partnerId,
    partnerName,
    partnerType: typeId,
    partnerCategory: categoryId,
    effectiveCapabilities,
    availablePricingModels,
    currentPricingAssignment: currentAssignment || null,
    clientCount,
    activeTrialCount,
    computedAt: new Date().toISOString(),
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate if a category can be assigned to a partner type
 */
export function isValidCategoryForType(typeId: string, categoryId: string): boolean {
  const type = getPartnerType(typeId)
  if (!type) return false
  return type.allowedCategories.includes(categoryId)
}

/**
 * Validate if a discount is within allowed limits
 */
export function isDiscountAllowed(
  discountPercent: number,
  typeId: string,
  categoryId: string
): boolean {
  const capabilities = resolvePartnerCapabilities(typeId, categoryId)
  return capabilities.canApplyDiscounts && discountPercent <= capabilities.maxDiscountPercent
}

/**
 * Check if partner can create more clients
 */
export function canCreateMoreClients(
  currentClientCount: number,
  typeId: string,
  categoryId: string
): boolean {
  const capabilities = resolvePartnerCapabilities(typeId, categoryId)
  if (!capabilities.canCreateClients) return false
  if (capabilities.maxClients === null) return true // unlimited
  return currentClientCount < capabilities.maxClients
}

/**
 * Check if partner can offer more trials
 */
export function canOfferMoreTrials(
  currentTrialCount: number,
  typeId: string,
  categoryId: string
): boolean {
  const capabilities = resolvePartnerCapabilities(typeId, categoryId)
  if (!capabilities.canOfferTrials) return false
  if (capabilities.maxConcurrentTrials === null) return true // unlimited
  return currentTrialCount < capabilities.maxConcurrentTrials
}
