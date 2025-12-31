import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromQuery, resolveTenantFromHost } from '@/lib/tenant-resolver'
import { generateManifest } from '@/lib/branding'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantSlug = searchParams.get('tenant')
    const host = request.headers.get('host') || ''
    
    let branding = {
      appName: 'SaaS Core',
      primaryColor: '#6366f1',
      faviconUrl: null as string | null
    }
    
    // Try to resolve tenant
    let context = null
    if (tenantSlug) {
      context = await resolveTenantFromQuery(tenantSlug)
    } else if (host) {
      context = await resolveTenantFromHost(host)
    }
    
    if (context) {
      branding = {
        appName: context.tenant.appName,
        primaryColor: context.tenant.primaryColor,
        faviconUrl: context.tenant.faviconUrl
      }
    }
    
    const manifest = {
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
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json'
      }
    })
  } catch (error) {
    console.error('Failed to generate manifest:', error)
    
    // Return default manifest
    return NextResponse.json({
      name: 'SaaS Core',
      short_name: 'SaaS Core',
      start_url: '/',
      display: 'standalone',
      theme_color: '#6366f1'
    }, {
      headers: {
        'Content-Type': 'application/manifest+json'
      }
    })
  }
}
