import { Tenant, TenantBranding } from '@prisma/client'

export type TenantWithBranding = Tenant & {
  branding: TenantBranding | null
}

// Default branding for when no tenant is resolved (super admin view)
export const DEFAULT_BRANDING: TenantBranding = {
  id: 'default',
  tenantId: 'default',
  appName: 'SaaS Core',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
}

// Tenant context header name
export const TENANT_HEADER = 'x-tenant-id'
export const TENANT_SLUG_HEADER = 'x-tenant-slug'
