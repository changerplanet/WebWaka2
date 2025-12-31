import { cookies, headers } from 'next/headers'
import { prisma } from './prisma'
import { TenantContext, resolveTenantFromQuery, resolveTenantFromHost } from './tenant-resolver'

export interface TenantBranding {
  id: string
  name: string
  slug: string
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}

const DEFAULT_BRANDING: TenantBranding = {
  id: 'default',
  name: 'SaaS Core',
  slug: 'default',
  appName: 'SaaS Core',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6'
}

/**
 * Get tenant branding from request context
 * Called from Server Components or API routes
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
        context = { tenant, resolvedVia: 'header' }
      }
    }
    
    if (!context) {
      return DEFAULT_BRANDING
    }
    
    const tenant = context.tenant
    
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      appName: tenant.appName,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor
    }
  } catch (error) {
    console.error('Failed to get tenant branding:', error)
    return DEFAULT_BRANDING
  }
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
 * Generate PWA manifest for tenant
 */
export function generateManifest(branding: TenantBranding): object {
  return {
    name: branding.appName,
    short_name: branding.appName,
    description: `${branding.appName} - Powered by SaaS Core`,
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
