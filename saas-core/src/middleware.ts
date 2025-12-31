import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TENANT_HEADER, TENANT_SLUG_HEADER } from './lib/tenant-context'

// Paths that don't require tenant resolution
const PUBLIC_PATHS = ['/api/health', '/api/tenants', '/api/auth', '/_next', '/favicon.ico']
const SUPER_ADMIN_PATHS = ['/super-admin']

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  
  // Skip middleware for static files and public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // For development/preview, we use query param or header for tenant
  // In production, subdomain/custom domain resolution happens here
  
  const host = hostname || request.headers.get('host') || ''
  const parts = host.split(':')[0].split('.')
  
  // Clone the response to add headers
  const response = NextResponse.next()
  
  // Try to extract tenant from subdomain
  if (parts.length >= 3) {
    const potentialSlug = parts[0]
    // Skip common non-tenant subdomains
    if (!['www', 'api', 'app', 'admin', 'preview', 'localhost'].includes(potentialSlug)) {
      response.headers.set(TENANT_SLUG_HEADER, potentialSlug)
    }
  }
  
  // Check for tenant in query param (for testing/preview)
  const tenantSlug = request.nextUrl.searchParams.get('tenant')
  if (tenantSlug) {
    response.headers.set(TENANT_SLUG_HEADER, tenantSlug)
  }
  
  // Check for tenant in cookie
  const tenantCookie = request.cookies.get('tenant_slug')?.value
  if (tenantCookie && !response.headers.get(TENANT_SLUG_HEADER)) {
    response.headers.set(TENANT_SLUG_HEADER, tenantCookie)
  }
  
  return response
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
