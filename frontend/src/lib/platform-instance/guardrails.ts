/**
 * PHASE 2 GUARDRAILS - EXPLICIT NON-GOALS
 * 
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  CRITICAL: These features are INTENTIONALLY OUT OF SCOPE for Phase 2        ║
 * ║  DO NOT implement these without explicit Phase 3 approval                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * PHASE 2 SCOPE:
 * ✅ Platform Instance as a UX boundary concept
 * ✅ Domain → Instance routing
 * ✅ Instance-level branding (with tenant fallback)
 * ✅ Instance-scoped navigation filtering
 * ✅ Session context extension (not separation)
 * ✅ Default instance for simple tenants
 * 
 * PHASE 3 (NOT IMPLEMENTED - DO NOT ADD):
 * ❌ Per-instance billing
 * ❌ Per-instance subscriptions
 * ❌ Per-instance partner attribution
 * ❌ Per-instance financial isolation
 * ❌ Cross-instance accounting
 * ❌ Per-instance RBAC/permissions
 * ❌ Instance-level data isolation
 * ❌ Separate auth per instance
 * 
 * ARCHITECTURAL DECISIONS (FROZEN):
 * 
 * 1. BILLING REMAINS TENANT-WIDE
 *    - One subscription per tenant
 *    - One invoice covers all instances
 *    - No per-instance billing splits
 *    Reason: Financial complexity, accounting challenges, partner attribution
 * 
 * 2. PARTNER ATTRIBUTION REMAINS TENANT-WIDE
 *    - One partner per tenant (immutable after lock)
 *    - Partner gets credit for ALL tenant activity
 *    - No per-instance partner splits
 *    Reason: Attribution complexity, commission calculation, partner disputes
 * 
 * 3. RBAC REMAINS TENANT-WIDE
 *    - User roles apply across all instances
 *    - TENANT_ADMIN can access all instances
 *    - Instance filtering is VISIBILITY only
 *    Reason: User management simplicity, no permission duplication
 * 
 * 4. DATA REMAINS TENANT-WIDE
 *    - All data belongs to tenant, not instance
 *    - Instances are UX views, not data silos
 *    - No cross-instance data isolation
 *    Reason: Data integrity, reporting, shared entities (customers, products)
 * 
 * 5. AUTHENTICATION REMAINS UNIFIED
 *    - One login per user
 *    - Session includes instance context (not separation)
 *    - No re-auth required per instance
 *    Reason: User experience, single identity
 * 
 * VALIDATION CHECKLIST:
 * Before any Phase 2 PR, confirm:
 * □ No per-instance billing logic added
 * □ No per-instance subscription handling
 * □ No per-instance partner attribution
 * □ No separate auth systems
 * □ No data isolation per instance
 * □ Existing tenants work unchanged
 * □ Offline sync unaffected
 * □ No module rewrites
 * 
 * FUTURE PHASE 3 CONSIDERATIONS:
 * If Phase 3 is approved, consider:
 * - Instance-level subscription add-ons (not replacement)
 * - Instance-level partner referral tracking (not attribution)
 * - Instance-level usage analytics (not billing)
 * - Instance-level feature flags (not permissions)
 */

// Guardrail validation functions

/**
 * Validates that billing is tenant-wide (Phase 2 guardrail)
 * @throws Error if per-instance billing is detected
 */
export function validateTenantWideBilling(data: any): void {
  if (data.instanceId && (data.billing || data.subscription || data.invoice)) {
    throw new Error(
      'PHASE 2 GUARDRAIL VIOLATION: Per-instance billing is not supported. ' +
      'Billing must be tenant-wide. This is a Phase 3 feature.'
    )
  }
}

/**
 * Validates that partner attribution is tenant-wide (Phase 2 guardrail)
 * @throws Error if per-instance attribution is detected
 */
export function validateTenantWideAttribution(data: any): void {
  if (data.instanceId && (data.partnerId || data.referralCode || data.attribution)) {
    throw new Error(
      'PHASE 2 GUARDRAIL VIOLATION: Per-instance partner attribution is not supported. ' +
      'Attribution must be tenant-wide. This is a Phase 3 feature.'
    )
  }
}

/**
 * Validates that RBAC is tenant-wide (Phase 2 guardrail)
 * Instance filtering is allowed, but permission changes are not
 */
export function validateTenantWideRBAC(data: any): void {
  if (data.instanceId && (data.role || data.permissions || data.accessLevel)) {
    throw new Error(
      'PHASE 2 GUARDRAIL VIOLATION: Per-instance RBAC is not supported. ' +
      'Permissions must be tenant-wide. Instance filtering is visibility only.'
    )
  }
}

/**
 * Phase 2 constants - DO NOT MODIFY
 */
export const PHASE_2_CONSTANTS = {
  // Billing scope
  BILLING_SCOPE: 'TENANT_WIDE',
  
  // Attribution scope
  ATTRIBUTION_SCOPE: 'TENANT_WIDE',
  
  // RBAC scope
  RBAC_SCOPE: 'TENANT_WIDE',
  
  // Data scope
  DATA_SCOPE: 'TENANT_WIDE',
  
  // Auth scope
  AUTH_SCOPE: 'UNIFIED',
  
  // Instance purpose
  INSTANCE_PURPOSE: 'UX_BOUNDARY_ONLY',
} as const

export type Phase2Scope = typeof PHASE_2_CONSTANTS[keyof typeof PHASE_2_CONSTANTS]
