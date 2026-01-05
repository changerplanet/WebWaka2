/**
 * PLATFORM INSTANCE MODULE (Phase 2)
 * 
 * Enables multi-suite, multi-domain operation within a single tenant.
 * 
 * EXPORTS:
 * - Instance management (create, update, delete)
 * - Branding resolution with fallback
 * - Domain → Instance mapping
 * - Capability visibility filtering
 * - Navigation filtering
 * - Default instance management
 * - Phase 2 guardrails
 */

export {
  createDefaultInstance,
  migrateExistingTenants,
  getInstance,
  getDefaultInstance,
  getTenantInstances,
  resolveInstanceBranding,
  createInstance,
  updateInstanceBranding,
  updateInstanceSuites,
  mapDomainToInstance,
  isCapabilityVisibleInInstance,
  filterCapabilitiesByInstance,
} from './instance-service'

export type {
  PlatformInstanceBranding,
  PlatformInstanceWithTenant,
  ResolvedBranding,
} from './instance-service'

export {
  filterNavigationByInstance,
  getVisibleCapabilities,
  getDashboardNavigation,
  canUserAccessInstance,
  getInstanceNavigationConfig,
} from './navigation-service'

export type {
  NavigationItem,
  InstanceForNavigation,
} from './navigation-service'

export {
  createDefaultInstanceForTenant,
  ensureAllTenantsHaveDefaultInstance,
} from './default-instance'

export {
  validateTenantWideBilling,
  validateTenantWideAttribution,
  validateTenantWideRBAC,
  PHASE_2_CONSTANTS,
} from './guardrails'
