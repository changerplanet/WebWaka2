/**
 * BRANDING SERVICE (Phase 2 Enhanced)
 * 
 * Resolves branding with instance-level override and tenant fallback.
 * 
 * BRANDING RESOLUTION ORDER:
 * 1. Platform Instance branding (if set)
 * 2. Tenant branding (fallback)
 * 3. Default WebWaka branding (last resort)
 * 
 * PHASE 2 BOUNDARIES:
 * - Instance branding OVERRIDES tenant branding
 * - Tenant branding is the FALLBACK
 * - No per-page or per-capability branding (out of scope)
 */

import { cookies, headers } from 'next/headers'
import { prisma } from './prisma'
import { TenantContext, resolveTenantFromQuery, resolveTenantFromHost } from './tenant-resolver'

// Phase 2: Extended branding interface to track source
export interface TenantBranding {
  id: string
  name: string
  slug: string
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  // Phase 2: Track branding source
  source: 'instance' | 'tenant' | 'default'
  instanceId?: string
  instanceName?: string
}

const DEFAULT_BRANDING: TenantBranding = {
  id: 'default',
  name: 'WebWaka',
  slug: 'default',
  appName: 'WebWaka',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  source: 'default'
}

/**
 * Get tenant branding from request context
 * Phase 2: Now includes platform instance branding resolution
 */
export async function getTenantBranding(): Promise<TenantBranding> {
  try {
    const headersList = await headers()
    const cookieStore = await cookies()
    
    // Try to get tenant from various sources
    const tenantSlug = headersList.get('x-tenant-slug') || cookieStore.get('tenant_slug')?.value
    const tenantId = headersList.get('x-tenant-id')
    const host = headersList.get('host') || ''
    
    let context: TenantContext | null = null
    
    // 1. Try tenant slug from header/cookie/query
    if (tenantSlug) {
      context = await resolveTenantFromQuery(tenantSlug)
    }
    
    // 2. Try host-based resolution
    if (!context && host) {
      context = await resolveTenantFromHost(host)
    }
    
    // 3. Try tenant ID header
    if (!context && tenantId) {
      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, status: 'ACTIVE' },
        include: { domains: true }
      })
      if (tenant) {
        // Phase 2: Get default instance for header-based resolution
        const defaultInstance = await prisma.platformInstance.findFirst({
          where: { tenantId: tenant.id, isDefault: true, isActive: true }
        })
        context = { 
          tenant, 
          resolvedVia: 'header',
          platformInstance: defaultInstance ? { ...defaultInstance, tenant } : undefined,
          instanceResolvedVia: defaultInstance ? 'default_instance' : undefined
        }
      }
    }
    
    if (!context) {
      return DEFAULT_BRANDING
    }
    
    const tenant = context.tenant
    const instance = context.platformInstance
    
    // Phase 2: Resolve branding with instance override
    return resolveInstanceBranding(tenant, instance)
  } catch (error) {
    console.error('Failed to get tenant branding:', error)
    return DEFAULT_BRANDING
  }
}

/**
 * Phase 2: Resolve branding with instance-level override
 * 
 * Instance branding fields override tenant branding when set.
 * Null/undefined instance fields fall back to tenant values.
 */
export function resolveInstanceBranding(
  tenant: {
    id: string
    name: string
    slug: string
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
  },
  instance?: {
    id: string
    name: string
    displayName: string | null
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string | null
    secondaryColor: string | null
  } | null
): TenantBranding {
  // Check if instance has any branding overrides
  const hasInstanceBranding = instance && (
    instance.displayName ||
    instance.logoUrl ||
    instance.primaryColor ||
    instance.secondaryColor ||
    instance.faviconUrl
  )
  
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    // Phase 2: Instance overrides
    appName: instance?.displayName || tenant.appName,
    logoUrl: instance?.logoUrl || tenant.logoUrl,
    faviconUrl: instance?.faviconUrl || tenant.faviconUrl,
    primaryColor: instance?.primaryColor || tenant.primaryColor,
    secondaryColor: instance?.secondaryColor || tenant.secondaryColor,
    // Phase 2: Track source
    source: hasInstanceBranding ? 'instance' : 'tenant',
    instanceId: instance?.id,
    instanceName: instance?.name
  }
}

/**
 * Get branding by tenant ID (for server-side use)
 */
export async function getBrandingByTenantId(tenantId: string, instanceId?: string): Promise<TenantBranding> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      appName: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      secondaryColor: true
    }
  })
  
  if (!tenant) {
    return DEFAULT_BRANDING
  }
  
  // Phase 2: Get specific or default instance
  let instance = null
  if (instanceId) {
    instance = await prisma.platformInstance.findUnique({
      where: { id: instanceId },
      select: {
        id: true,
        name: true,
        displayName: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true
      }
    })
  } else {
    instance = await prisma.platformInstance.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true
      }
    })
  }
  
  return resolveInstanceBranding(tenant, instance)
}

/**
 * Generate CSS variables for branding
 */
export function generateBrandingCSS(branding: TenantBranding): string {
  // Convert hex to HSL for better color manipulation
  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex)
    if (!result) return '239 84% 67%' // fallback
    
    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }
  
  return `
    :root {
      --brand-primary: ${branding.primaryColor};
      --brand-secondary: ${branding.secondaryColor};
      --primary: ${hexToHSL(branding.primaryColor)};
      --ring: ${hexToHSL(branding.primaryColor)};
    }
  `
}

/**
 * Generate PWA manifest for tenant/instance
 */
export function generateManifest(branding: TenantBranding): object {
  return {
    name: branding.appName,
    short_name: branding.appName,
    description: `${branding.appName} - Powered by WebWaka`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: branding.primaryColor,
    icons: [
      {
        src: branding.faviconUrl || '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: branding.faviconUrl || '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}
