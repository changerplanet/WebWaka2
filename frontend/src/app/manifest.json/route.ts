export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromQuery, resolveTenantFromHost, TenantContext } from '@/lib/tenant-resolver'

/**
 * Dynamic PWA Manifest per Tenant
 * 
 * Resolution order:
 * 1. ?tenant= query param
 * 2. Host-based resolution (subdomain/custom domain)
 * 3. Fallback to default branding
 * 
 * Caching Strategy:
 * - Cache-Control: private (per-user, per-tenant)
 * - ETag based on tenant ID + updatedAt for invalidation
 * - Vary: Host header for CDN awareness
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantSlug = searchParams.get('tenant')
    const host = request.headers.get('host') || ''
    
    // Default branding
    let branding = {
      id: 'default',
      name: 'WebWaka',
      slug: 'default',
      appName: 'WebWaka',
      shortName: 'WebWaka',
      description: 'WebWaka Commerce Platform',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      logoUrl: null as string | null,
      faviconUrl: null as string | null,
      updatedAt: new Date().toISOString()
    }
    
    // Try to resolve tenant
    let context: TenantContext | null = null
    if (tenantSlug) {
      context = await resolveTenantFromQuery(tenantSlug)
    } else if (host) {
      context = await resolveTenantFromHost(host)
    }
    
    if (context) {
      const tenant = context.tenant
      branding = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        appName: tenant.appName,
        shortName: tenant.appName.substring(0, 12), // PWA short name limit
        description: `${tenant.appName} - Powered by WebWaka`,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        backgroundColor: '#ffffff',
        logoUrl: tenant.logoUrl,
        faviconUrl: tenant.faviconUrl,
        updatedAt: tenant.updatedAt.toISOString()
      }
    }
    
    // Generate manifest
    const manifest = {
      name: branding.appName,
      short_name: branding.shortName,
      description: branding.description,
      start_url: `/?tenant=${branding.slug}`,
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: branding.backgroundColor,
      theme_color: branding.primaryColor,
      
      // Icons - use tenant favicon or defaults
      icons: [
        {
          src: branding.faviconUrl || `/api/icons/icon-72?tenant=${branding.slug}`,
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-96?tenant=${branding.slug}`,
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-128?tenant=${branding.slug}`,
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-144?tenant=${branding.slug}`,
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-152?tenant=${branding.slug}`,
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-192?tenant=${branding.slug}`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-384?tenant=${branding.slug}`,
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: branding.faviconUrl || `/api/icons/icon-512?tenant=${branding.slug}`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      
      // Categories for app stores
      categories: ['business', 'productivity'],
      
      // Shortcuts for quick actions
      shortcuts: [
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          url: `/dashboard?tenant=${branding.slug}`,
          icons: [{ src: `/api/icons/icon-96?tenant=${branding.slug}`, sizes: '96x96' }]
        }
      ],
      
      // Screenshots (optional, for app store listings)
      screenshots: [],
      
      // Related applications (optional)
      related_applications: [],
      prefer_related_applications: false,
      
      // Custom extension for tenant identification
      // This helps Service Worker know which tenant's cache to use
      _tenant: {
        id: branding.id,
        slug: branding.slug,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor
      }
    }
    
    // Generate ETag for cache invalidation
    const etag = `"${branding.id}-${new Date(branding.updatedAt).getTime()}"`
    
    // Check If-None-Match header for 304 response
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        // Cache privately per user/tenant, revalidate after 1 hour
        'Cache-Control': 'private, max-age=3600, must-revalidate',
        'ETag': etag,
        // Vary by Host for CDN to cache differently per domain
        'Vary': 'Host',
        // CORS for cross-origin manifest requests
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Failed to generate manifest:', error)
    
    // Return minimal valid manifest on error
    return NextResponse.json({
      name: 'WebWaka',
      short_name: 'WebWaka',
      start_url: '/',
      display: 'standalone',
      theme_color: '#6366f1',
      background_color: '#ffffff',
      icons: []
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache'
      }
    })
  }
}
