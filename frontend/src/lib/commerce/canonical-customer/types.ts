/**
 * CANONICAL CUSTOMER TYPES
 * Wave J.2: Unified Customer Identity (Read-Only)
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
 * @module lib/commerce/canonical-customer/types
 */

export type SourceSystem = 'SVM' | 'MVM' | 'PARKHUB'

export interface OriginalReferences {
  svmOrderIds?: string[]
  mvmOrderIds?: string[]
  parkTicketIds?: string[]
}

export interface CanonicalCustomer {
  canonicalId: string
  email?: string
  phone?: string
  name?: string
  sourceSystems: SourceSystem[]
  originalReferences: OriginalReferences
  metadata: Record<string, unknown>
}

export interface CustomerResolutionResult {
  customers: CanonicalCustomer[]
  isAmbiguous: boolean
  ambiguityReason?: string
}

export interface AmbiguousCustomerEntry {
  canonicalId: string
  email?: string
  phone?: string
  sourceSystems: SourceSystem[]
  reason: string
}
