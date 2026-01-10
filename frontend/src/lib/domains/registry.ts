/**
 * Domain Governance Registry
 * 
 * Config-based domain registry for partner governance.
 * NO DATABASE SCHEMA CHANGES - static/env-driven only.
 * 
 * @module lib/domains/registry
 * @phase Partner Domain Governance Layer
 */

// =============================================================================
// DOMAIN LIFECYCLE STATES
// =============================================================================

export type DomainLifecycleState = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

// =============================================================================
// DOMAIN CONFIGURATION
// =============================================================================

export interface DomainConfig {
  /** The domain name (e.g., 'retailstore.ng', 'school.webwaka.com') */
  domain: string
  
  /** Partner slug that owns this domain */
  partner_slug: string
  
  /** Tenant slug this domain resolves to */
  tenant_slug: string
  
  /** Current lifecycle state */
  lifecycle_state: DomainLifecycleState
  
  /** List of suites enabled for this domain */
  enabled_suites: string[]
  
  /** Primary suite (resolves at root) */
  primary_suite: string
  
  /** Optional: Regulator access mode */
  regulator_mode?: boolean
  
  /** Last verification timestamp (ISO string) */
  last_verified?: string
  
  /** Human-readable description */
  description?: string
}

// =============================================================================
// DOMAIN REGISTRY (CONFIG-BASED)
// =============================================================================

/**
 * Static domain registry.
 * In production, this would be loaded from environment or external config.
 * NO DATABASE - purely config-driven.
 */
export const DOMAIN_REGISTRY: DomainConfig[] = [
  // Demo Partner Domains (for demonstration purposes)
  {
    domain: 'demo-retail.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-retail-store',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['commerce', 'inventory', 'accounting'],
    primary_suite: 'commerce',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo Retail Store - Commerce Suite',
  },
  {
    domain: 'demo-school.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-school',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['education'],
    primary_suite: 'education',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo School - Education Suite',
  },
  {
    domain: 'demo-clinic.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-clinic',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['health'],
    primary_suite: 'health',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo Clinic - Health Suite',
  },
  {
    domain: 'demo-hotel.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-hotel',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['hospitality'],
    primary_suite: 'hospitality',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo Hotel - Hospitality Suite',
  },
  {
    domain: 'demo-church.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-church',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['church'],
    primary_suite: 'church',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo Church - Church Suite',
  },
  {
    domain: 'demo-political.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-political',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['political'],
    primary_suite: 'political',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo Campaign - Political Suite',
  },
  {
    domain: 'demo-civic.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-civic',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['civic'],
    primary_suite: 'civic',
    regulator_mode: true,
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Demo Civic Agency - Civic Suite (Regulator Mode)',
  },
  
  // Example: Pending domain (activation in progress)
  {
    domain: 'newpartner.example.com',
    partner_slug: 'example-partner',
    tenant_slug: 'example-tenant',
    lifecycle_state: 'PENDING',
    enabled_suites: ['commerce'],
    primary_suite: 'commerce',
    description: 'Example pending domain',
  },
  
  // Example: Suspended domain (governance action)
  {
    domain: 'suspended.example.com',
    partner_slug: 'suspended-partner',
    tenant_slug: 'suspended-tenant',
    lifecycle_state: 'SUSPENDED',
    enabled_suites: ['commerce'],
    primary_suite: 'commerce',
    description: 'Example suspended domain',
  },
  
  // Example: Multi-suite domain
  {
    domain: 'multisuite.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-retail-store',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['commerce', 'inventory', 'accounting', 'crm'],
    primary_suite: 'commerce',
    last_verified: '2026-01-09T00:00:00Z',
    description: 'Multi-Suite Demo - Commerce + Inventory + Accounting + CRM',
  },
]

// =============================================================================
// REGISTRY LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get domain configuration by domain name
 */
export function getDomainConfig(domain: string): DomainConfig | undefined {
  const normalizedDomain = domain.toLowerCase().trim()
  return DOMAIN_REGISTRY.find((d: any) => d.domain.toLowerCase() === normalizedDomain)
}

/**
 * Get all domains for a partner
 */
export function getDomainsForPartner(partnerSlug: string): DomainConfig[] {
  return DOMAIN_REGISTRY.filter((d: any) => d.partner_slug === partnerSlug)
}

/**
 * Get all domains for a tenant
 */
export function getDomainsForTenant(tenantSlug: string): DomainConfig[] {
  return DOMAIN_REGISTRY.filter((d: any) => d.tenant_slug === tenantSlug)
}

/**
 * Check if a suite is enabled for a domain
 */
export function isSuiteEnabledForDomain(domain: string, suite: string): boolean {
  const config = getDomainConfig(domain)
  if (!config) return false
  return config.enabled_suites.includes(suite.toLowerCase())
}

/**
 * Get primary suite for a domain
 */
export function getPrimarySuiteForDomain(domain: string): string | undefined {
  const config = getDomainConfig(domain)
  return config?.primary_suite
}

/**
 * Check if domain is in active state
 */
export function isDomainActive(domain: string): boolean {
  const config = getDomainConfig(domain)
  return config?.lifecycle_state === 'ACTIVE'
}

/**
 * Check if domain is pending
 */
export function isDomainPending(domain: string): boolean {
  const config = getDomainConfig(domain)
  return config?.lifecycle_state === 'PENDING'
}

/**
 * Check if domain is suspended
 */
export function isDomainSuspended(domain: string): boolean {
  const config = getDomainConfig(domain)
  return config?.lifecycle_state === 'SUSPENDED'
}

/**
 * Get lifecycle state display information
 */
export function getLifecycleStateDisplay(state: DomainLifecycleState): {
  label: string
  color: string
  description: string
} {
  switch (state) {
    case 'ACTIVE':
      return {
        label: 'Active',
        color: 'green',
        description: 'Domain is live and resolving normally',
      }
    case 'PENDING':
      return {
        label: 'Pending',
        color: 'amber',
        description: 'Domain activation in progress',
      }
    case 'SUSPENDED':
      return {
        label: 'Suspended',
        color: 'red',
        description: 'Domain access has been suspended',
      }
  }
}
