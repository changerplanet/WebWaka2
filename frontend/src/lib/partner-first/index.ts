/**
 * PHASE 4A: Partner-First Policy
 * 
 * Central policy configuration for Partner-First Control Plane.
 * All tenant operations must respect these policies.
 */

export * from './guards'
export * from './client-service'

// Re-export types
export type {
  TenantCreatorType,
  TenantCreationContext,
  GuardResult,
} from './guards'

export type {
  CreateClientPlatformInput,
  CreateClientPlatformResult,
  ClientPlatform,
} from './client-service'

// Re-export constants
export {
  WEBWAKA_INTERNAL_PARTNER_SLUG,
  PHASE_4A_POLICY,
} from './guards'
