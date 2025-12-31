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

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        customDomain: tenant.customDomain,
        branding: tenant.branding
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
