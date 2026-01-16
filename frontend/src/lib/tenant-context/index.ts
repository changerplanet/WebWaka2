/**
 * TENANT CONTEXT MODULE
 * Wave J.4: Tenant Context Hardening
 * 
 * Unified tenant context resolution for all public surfaces.
 * 
 * @module lib/tenant-context
 */

export { TenantContextResolver, isDemo, hasRequiredModules } from './resolver'
export type { 
  TenantContext, 
  TenantContextResolutionResult, 
  TenantContextOptions,
  TenantContextSource,
  ModuleRequirement,
} from './types'
export { MODULE_ALIASES } from './types'
