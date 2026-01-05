/**
 * SAAS CORE: Capability Framework
 * 
 * Central export point for all capability-related functionality.
 */

// Registry exports
export {
  CAPABILITY_DOMAINS,
  CAPABILITY_REGISTRY,
  getCapabilityDefinition,
  getCapabilitiesByDomain,
  getAvailableDomains,
  isCapabilityRegistered,
  getAllCapabilityKeys,
  getCoreCapabilities,
  getNonCoreCapabilities,
  getCapabilityDependencies,
  getDependentCapabilities,
  type CapabilityDomain,
  type CapabilityDefinition,
} from './registry';

// Activation service exports
export {
  CapabilityActivationService,
  CAPABILITY_EVENTS,
  type ActivationResult,
  type DeactivationResult,
  type CapabilityActivationInfo,
} from './activation-service';

// Runtime guard exports
export {
  isCapabilityActive,
  checkCapability,
  checkCapabilityAndEntitlement,
  withCapabilityGuard,
  withFullAccessGuard,
  checkMultipleCapabilities,
  getActiveCapabilities,
  assertCapabilityActive,
  assertFullAccess,
  type CapabilityCheckResult,
  type EntitlementAndActivationCheck,
} from './runtime-guard';

// Middleware exports for API routes
export {
  extractTenantId,
  guardWithCapability,
  guardWithCapabilityDetailed,
  checkCapabilityGuard,
  checkCapabilityForTenant,
  checkCapabilityForSession,
} from './middleware';
