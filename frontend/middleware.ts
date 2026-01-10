/**
 * Edge Middleware — Production Domain Resolution
 * 
 * Canonical middleware for domain governance.
 * Works identically on Emergent and Vercel.
 * 
 * Features:
 * - Domain → Partner → Tenant → Suite resolution
 * - Lifecycle state enforcement (PENDING, ACTIVE, SUSPENDED)
 * - Governance headers injection
 * 
 * NO environment branching. NO demo-specific logic.
 * 
 * @module middleware
 * @phase Phase 1 — Vercel Dual Deployment
 */

import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// HEADER NAMES (Inlined for Edge compatibility)
// =============================================================================

const PARTNER_HEADER = 'x-ww-partner'
const TENANT_HEADER = 'x-ww-tenant'
const SUITE_HEADER = 'x-ww-suite'

// =============================================================================
// DOMAIN CONTEXT TYPE
// =============================================================================

export interface DomainContext {
  partnerSlug: string
  tenantSlug: string
  primarySuite: string
  state: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  regulatorMode?: boolean
}

// =============================================================================
// DOMAIN REGISTRY (Inlined for Edge compatibility)
// =============================================================================

type DomainLifecycleState = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

interface DomainConfig {
  domain: string
  partner_slug: string
  tenant_slug: string
  lifecycle_state: DomainLifecycleState
  enabled_suites: string[]
  primary_suite: string
  regulator_mode?: boolean
}

/**
 * Static domain registry for Edge Middleware.
 * Must be inlined here because Edge runtime has strict import limitations.
 */
const DOMAIN_REGISTRY: DomainConfig[] = [
  // Demo Partner Domains
  {
    domain: 'demo-retail.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-retail-store',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['commerce', 'inventory', 'accounting'],
    primary_suite: 'commerce',
  },
  {
    domain: 'demo-school.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-school',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['education'],
    primary_suite: 'education',
  },
  {
    domain: 'demo-clinic.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-clinic',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['health'],
    primary_suite: 'health',
  },
  {
    domain: 'demo-hotel.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-hotel',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['hospitality'],
    primary_suite: 'hospitality',
  },
  {
    domain: 'demo-church.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-church',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['church'],
    primary_suite: 'church',
  },
  {
    domain: 'demo-political.webwaka.com',
    partner_slug: 'webwaka-demo-partner',
    tenant_slug: 'demo-political',
    lifecycle_state: 'ACTIVE',
    enabled_suites: ['political'],
    primary_suite: 'political',
  },
]

/**
 * Get domain configuration by domain name
 */
function getDomainConfig(domain: string): DomainConfig | undefined {
  const normalizedDomain = domain.toLowerCase().trim()
  return DOMAIN_REGISTRY.find(d => d.domain.toLowerCase() === normalizedDomain)
}

// =============================================================================
// DOMAIN CONTEXT RESOLUTION
// =============================================================================

/**
 * Resolve domain context from hostname.
 * Returns null if domain is not in registry (normal app routing).
 */
export function resolveDomainContext(host: string): DomainContext | null {
  // Normalize hostname (remove port)
  const domain = host.split(':')[0].toLowerCase()
  
  // Skip resolution for development/preview domains
  if (
    domain.includes('localhost') ||
    domain.includes('127.0.0.1') ||
    domain.includes('.vercel.app') ||
    domain.includes('.emergent.')
  ) {
    return null
  }
  
  // Look up domain in registry
  const config = getDomainConfig(domain)
  
  if (!config) {
    return null
  }
  
  return {
    partnerSlug: config.partner_slug,
    tenantSlug: config.tenant_slug,
    primarySuite: config.primary_suite,
    state: config.lifecycle_state,
    regulatorMode: config.regulator_mode,
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  
  // Resolve domain context
  const domainContext = resolveDomainContext(host)
  
  // If domain not in registry, allow normal routing
  if (!domainContext) {
    return NextResponse.next()
  }
  
  // Handle PENDING domains
  if (domainContext.state === 'PENDING') {
    const url = request.nextUrl.clone()
    url.pathname = '/domain-pending'
    return NextResponse.rewrite(url)
  }
  
  // Handle SUSPENDED domains
  if (domainContext.state === 'SUSPENDED') {
    const url = request.nextUrl.clone()
    url.pathname = '/domain-suspended'
    return NextResponse.rewrite(url)
  }
  
  // Domain is ACTIVE - inject governance headers
  const response = NextResponse.next()
  
  response.headers.set(PARTNER_HEADER, domainContext.partnerSlug)
  response.headers.set(TENANT_HEADER, domainContext.tenantSlug)
  response.headers.set(SUITE_HEADER, domainContext.primarySuite)
  
  if (domainContext.regulatorMode) {
    response.headers.set('x-ww-regulator-mode', 'true')
  }
  
  return response
}

// =============================================================================
// MATCHER CONFIG
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
