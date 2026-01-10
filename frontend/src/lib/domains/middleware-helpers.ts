/**
 * Domain Middleware Helpers
 * 
 * Helper functions for domain lifecycle enforcement in Edge Middleware.
 * 
 * @module lib/domains/middleware-helpers
 * @phase Partner Domain Governance Layer
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getDomainConfig,
  isSuiteEnabledForDomain,
  type DomainConfig,
  type DomainLifecycleState,
} from './registry'

// =============================================================================
// HEADER NAMES
// =============================================================================

export const SUITE_HEADER = 'x-ww-suite'
export const TENANT_HEADER = 'x-ww-tenant'
export const PARTNER_HEADER = 'x-ww-partner'
export const DOMAIN_STATE_HEADER = 'x-ww-domain-state'
export const REGULATOR_MODE_HEADER = 'x-ww-regulator-mode'

// =============================================================================
// DOMAIN RESOLUTION RESULT
// =============================================================================

export interface DomainResolutionResult {
  resolved: boolean
  domain?: string
  config?: DomainConfig
  lifecycleState?: DomainLifecycleState
  shouldBlock: boolean
  blockReason?: 'PENDING' | 'SUSPENDED' | 'NOT_FOUND' | 'SUITE_DISABLED'
  resolvedSuite?: string
}

// =============================================================================
// SUITE PATH MAPPING
// =============================================================================

const SUITE_PATH_PREFIXES: Record<string, string> = {
  '/pos': 'commerce',
  '/inventory': 'inventory',
  '/accounting': 'accounting',
  '/crm': 'crm',
  '/education': 'education',
  '/school': 'education',
  '/health': 'health',
  '/clinic': 'health',
  '/hospitality': 'hospitality',
  '/hotel': 'hospitality',
  '/civic': 'civic',
  '/govtech': 'civic',
  '/logistics': 'logistics',
  '/warehouse': 'warehouse',
  '/parkhub': 'parkhub',
  '/transport': 'parkhub',
  '/political': 'political',
  '/campaign': 'political',
  '/church': 'church',
  '/real-estate': 'real-estate',
  '/recruitment': 'recruitment',
  '/legal': 'legal',
  '/project': 'project',
}

/**
 * Extract suite from pathname
 */
export function getSuiteFromPath(pathname: string): string | null {
  for (const [prefix, suite] of Object.entries(SUITE_PATH_PREFIXES)) {
    if (pathname.startsWith(prefix)) {
      return suite
    }
  }
  return null
}

// =============================================================================
// DOMAIN RESOLUTION
// =============================================================================

/**
 * Resolve domain and determine routing behavior
 */
export function resolveDomainForRequest(
  hostname: string,
  pathname: string
): DomainResolutionResult {
  // Normalize hostname (remove port)
  const domain = hostname.split(':')[0].toLowerCase()
  
  // Look up domain configuration
  const config = getDomainConfig(domain)
  
  // Domain not in registry - not managed, allow normal routing
  if (!config) {
    return {
      resolved: false,
      domain,
      shouldBlock: false,
    }
  }
  
  // Check lifecycle state
  if (config.lifecycle_state === 'PENDING') {
    return {
      resolved: true,
      domain,
      config,
      lifecycleState: 'PENDING',
      shouldBlock: true,
      blockReason: 'PENDING',
    }
  }
  
  if (config.lifecycle_state === 'SUSPENDED') {
    return {
      resolved: true,
      domain,
      config,
      lifecycleState: 'SUSPENDED',
      shouldBlock: true,
      blockReason: 'SUSPENDED',
    }
  }
  
  // Domain is ACTIVE - check suite access
  const requestedSuite = getSuiteFromPath(pathname)
  
  // If requesting a specific suite, verify it's enabled
  if (requestedSuite && !isSuiteEnabledForDomain(domain, requestedSuite)) {
    return {
      resolved: true,
      domain,
      config,
      lifecycleState: 'ACTIVE',
      shouldBlock: true,
      blockReason: 'SUITE_DISABLED',
    }
  }
  
  // Determine which suite to use
  const resolvedSuite = requestedSuite || config.primary_suite
  
  return {
    resolved: true,
    domain,
    config,
    lifecycleState: 'ACTIVE',
    shouldBlock: false,
    resolvedSuite,
  }
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Create redirect to domain pending page
 */
export function createPendingRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/domain-pending'
  return NextResponse.rewrite(url)
}

/**
 * Create redirect to domain suspended page
 */
export function createSuspendedRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/domain-suspended'
  return NextResponse.rewrite(url)
}

/**
 * Create 404 response for disabled suite
 */
export function createSuiteDisabledResponse(): NextResponse {
  return new NextResponse('Suite not enabled for this domain', { status: 404 })
}

/**
 * Inject governance headers into response
 */
export function injectGovernanceHeaders(
  response: NextResponse,
  result: DomainResolutionResult
): NextResponse {
  if (result.config) {
    response.headers.set(PARTNER_HEADER, result.config.partner_slug)
    response.headers.set(TENANT_HEADER, result.config.tenant_slug)
    response.headers.set(DOMAIN_STATE_HEADER, result.config.lifecycle_state)
    
    if (result.resolvedSuite) {
      response.headers.set(SUITE_HEADER, result.resolvedSuite)
    }
    
    if (result.config.regulator_mode) {
      response.headers.set(REGULATOR_MODE_HEADER, 'true')
    }
  }
  
  return response
}
