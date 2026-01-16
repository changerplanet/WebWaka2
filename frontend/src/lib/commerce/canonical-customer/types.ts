/**
 * CANONICAL CUSTOMER TYPES
 * Wave J.2: Unified Customer Identity (Read-Only)
 * Wave B2-Fix: Identity Coherence Hardening
 * 
 * These interfaces provide a normalized view of customer identity across
 * SVM, MVM, and ParkHub without modifying underlying schemas.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes - read-only abstraction
 * - ❌ No data mutations - these are view models only
 * - ❌ No authentication - identity resolution only
 * - ❌ No customer accounts - no persistent storage
 * - ✅ Maps existing data to canonical format
 * 
 * WAVE B2-FIX ADDITIONS:
 * - B2-F2: FragmentationStatus - explicit fragmentation signaling
 * - B2-F4: PrivacyLimitations - compliance disclosure block
 * 
 * @module lib/commerce/canonical-customer/types
 */

export type SourceSystem = 'SVM' | 'MVM' | 'PARKHUB'

export interface OriginalReferences {
  svmOrderIds?: string[]
  mvmOrderIds?: string[]
  parkTicketIds?: string[]
}

/**
 * B2-F2: Fragmentation Status
 * 
 * Explicit signaling of identity fragmentation for runtime awareness.
 * Systems consuming canonical customers MUST check this status.
 */
export interface FragmentationStatus {
  isFragmented: boolean
  fragmentationLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  fragmentationReasons: string[]
  linkedSystems: SourceSystem[]
  unlinkableSystems: SourceSystem[]
  canMerge: boolean
  mergeBlockers?: string[]
}

/**
 * B2-F4: Privacy Limitations
 * 
 * Compliance disclosure block for GDPR/privacy requirements.
 * Documents current data handling limitations.
 */
export interface PrivacyLimitations {
  canFullyErase: boolean
  erasureBlockers: string[]
  dataRetentionDays: number | null
  crossSystemLinkable: boolean
  consentStatus: 'UNKNOWN' | 'IMPLICIT' | 'EXPLICIT'
  rightToPortability: boolean
  portabilityFormat?: 'JSON' | 'CSV' | 'NONE'
}

/**
 * B2-F3: Canonical Identity Guardrails
 * 
 * RUNTIME ASSERTIONS (enforced in code):
 * 1. Customer identity MUST have at least email OR phone
 * 2. Cross-system merging requires EXACT identifier match
 * 3. ParkHub phone-only identities cannot merge with email-only SVM/MVM
 * 4. Ambiguous identities MUST be flagged before any automated processing
 * 
 * PROHIBITED OPERATIONS:
 * - ❌ Automatic merging of ambiguous identities
 * - ❌ Cross-tenant identity sharing
 * - ❌ Bulk erasure without explicit confirmation
 * - ❌ Silent identity degradation
 */

export interface CanonicalCustomer {
  canonicalId: string
  email?: string
  phone?: string
  name?: string
  sourceSystems: SourceSystem[]
  originalReferences: OriginalReferences
  metadata: Record<string, unknown>
  fragmentation: FragmentationStatus
  privacyLimitations: PrivacyLimitations
}

export interface CustomerResolutionResult {
  customers: CanonicalCustomer[]
  isAmbiguous: boolean
  ambiguityReason?: string
  fragmentationSummary?: {
    totalFragmented: number
    highRiskCount: number
  }
}

export interface AmbiguousCustomerEntry {
  canonicalId: string
  email?: string
  phone?: string
  sourceSystems: SourceSystem[]
  reason: string
  fragmentationLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * B2-F3: Identity Validation Result
 * 
 * Used by guardrail assertions to validate identity completeness.
 */
export interface IdentityValidationResult {
  isValid: boolean
  hasEmail: boolean
  hasPhone: boolean
  identityStrength: 'WEAK' | 'MODERATE' | 'STRONG'
  warnings: string[]
}

/**
 * Validates that a canonical customer meets minimum identity requirements.
 * B2-F3 Guardrail: Customer MUST have at least email OR phone.
 */
export function validateIdentity(customer: Partial<CanonicalCustomer>): IdentityValidationResult {
  const hasEmail = !!(customer.email && customer.email.trim())
  const hasPhone = !!(customer.phone && customer.phone.trim())
  const warnings: string[] = []
  
  if (!hasEmail && !hasPhone) {
    warnings.push('Identity has no email or phone - cannot be resolved')
  }
  
  if (!hasEmail && hasPhone) {
    warnings.push('Phone-only identity cannot link with email-based systems')
  }
  
  if (hasEmail && !hasPhone) {
    warnings.push('Email-only identity cannot link with ParkHub (phone required)')
  }
  
  let identityStrength: 'WEAK' | 'MODERATE' | 'STRONG' = 'WEAK'
  if (hasEmail && hasPhone) {
    identityStrength = 'STRONG'
  } else if (hasEmail || hasPhone) {
    identityStrength = 'MODERATE'
  }
  
  return {
    isValid: hasEmail || hasPhone,
    hasEmail,
    hasPhone,
    identityStrength,
    warnings,
  }
}
