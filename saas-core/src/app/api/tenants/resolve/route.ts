import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantFromHost, resolveTenantBySlug } from '@/lib/tenant-resolver'

// GET /api/tenants/resolve - Resolve tenant from host or slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const host = searchParams.get('host') || request.headers.get('host')

    let tenant = null

    // Try slug first
    if (slug) {
      tenant = await resolveTenantBySlug(slug)
    }
    // Then try host resolution
    else if (host) {
      tenant = await resolveTenantFromHost(host)
    }

    if (!tenant) {
      return NextResponse.json({
        success: true,
        tenant: null,
        message: 'No tenant resolved - showing default/super admin view'
      })
    }

    // Transform to include branding for backwards compatibility
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        domains: tenant.domains,
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
