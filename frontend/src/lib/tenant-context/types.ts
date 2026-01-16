/**
 * TENANT CONTEXT TYPES
 * Wave J.4: Tenant Context Hardening
 * 
 * Canonical internal-only tenant context structure.
 * This object:
 * - Must be resolved server-side only
 * - Must NOT be reconstructed client-side
 * - Must NOT be passed verbatim to client components unless unavoidable
 * 
 * @module lib/tenant-context/types
 */

export type TenantContextSource = 'slug' | 'host'

export interface TenantContext {
  tenantId: string
  tenantSlug: string
  tenantName: string
  tenantStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED'
  isDemo: boolean
  enabledModules: string[]
  source: TenantContextSource
  
  primaryColor: string
  secondaryColor: string
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
}

export type ModuleRequirement = 
  | 'svm' 
  | 'mvm' 
  | 'parkhub' 
  | 'sites-funnels' 
  | 'commerce' 
  | 'store' 
  | 'marketplace' 
  | 'transport'

export const MODULE_ALIASES: Record<string, string[]> = {
  'svm': ['svm', 'commerce', 'store'],
  'mvm': ['mvm', 'marketplace', 'commerce'],
  'parkhub': ['parkhub', 'transport'],
  'sites-funnels': ['sites-funnels', 'sites_funnels', 'sites', 'funnels'],
}

export type TenantContextResolutionResult =
  | { success: true; context: TenantContext }
  | { success: false; reason: 'not_found' | 'suspended' | 'module_disabled' }

export interface TenantContextOptions {
  requiredModules?: string[]
  allowDemo?: boolean
  allowInactive?: boolean
}
