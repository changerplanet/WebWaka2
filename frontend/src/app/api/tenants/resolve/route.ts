export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromHost, resolveTenantFromQuery, TenantContext } from '@/lib/tenant-resolver'

// GET /api/tenants/resolve - Resolve tenant from host or slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const host = searchParams.get('host') || request.headers.get('host')

    let context: TenantContext | null = null

    // Try slug first (uses resolveTenantFromQuery)
    if (slug) {
      context = await resolveTenantFromQuery(slug)
    }
    // Then try host resolution
    else if (host) {
      context = await resolveTenantFromHost(host)
    }

    if (!context) {
      return NextResponse.json({
        success: true,
        tenant: null,
        message: 'No tenant resolved - showing default/super admin view'
      })
    }

    const tenant = context.tenant

    // Transform to include branding for backwards compatibility
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        domains: tenant.domains,
        resolvedVia: context.resolvedVia,
        // Legacy branding object
        branding: {
          id: tenant.id,
          tenantId: tenant.id,
          appName: tenant.appName,
          logoUrl: tenant.logoUrl,
          faviconUrl: tenant.faviconUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor
        },
        // Also include flat for convenience
        appName: tenant.appName,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor
      }
    })
  } catch (error) {
    console.error('Failed to resolve tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resolve tenant' },
      { status: 500 }
    )
  }
}
