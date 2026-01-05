import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Header names for tenant context
export const TENANT_ID_HEADER = 'x-tenant-id'
export const TENANT_SLUG_HEADER = 'x-tenant-slug'
export const TENANT_RESOLVED_VIA_HEADER = 'x-tenant-resolved-via'

// Routes that don't require tenant resolution
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/icons',
  '/robots.txt',
  '/sitemap.xml'
]

// Super Admin routes (no tenant needed, require SUPER_ADMIN role)
const SUPER_ADMIN_PATHS = [
  '/admin',
  '/api/admin'
]

// Static file extensions to skip
const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']

function isStaticFile(pathname: string): boolean {
  return STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

function isSuperAdminPath(pathname: string): boolean {
  return SUPER_ADMIN_PATHS.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Skip static files
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }
  
  // Skip public paths (login, register, auth APIs, health check)
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }
  
  // Super Admin paths - don't require tenant, but auth is checked in route handlers
  if (isSuperAdminPath(pathname)) {
    return NextResponse.next()
  }
  
  // Create response to modify headers
  const response = NextResponse.next()
  
  // === TENANT RESOLUTION ORDER ===
  
  // 1. Check for X-Tenant-ID header (internal tools)
  const headerTenantId = request.headers.get('x-tenant-id')
  if (headerTenantId) {
    response.headers.set(TENANT_ID_HEADER, headerTenantId)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'header')
    return response
  }
  
  // 2. Check for ?tenant= query parameter (testing/preview)
  const tenantQuery = request.nextUrl.searchParams.get('tenant')
  if (tenantQuery) {
    response.headers.set(TENANT_SLUG_HEADER, tenantQuery)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'query')
    return response
  }
  
  // 3. Check for tenant cookie (session persistence)
  const tenantCookie = request.cookies.get('tenant_slug')?.value
  if (tenantCookie) {
    response.headers.set(TENANT_SLUG_HEADER, tenantCookie)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'cookie')
    return response
  }
  
  // 4. Extract from hostname
  const host = hostname.split(':')[0].toLowerCase()
  const parts = host.split('.')
  
  // Check if this could be a custom domain (doesn't match our platform domain pattern)
  const platformDomains = ['localhost', 'emergentagent.com', 'webwaka.com', 'vercel.app']
  const isPlatformDomain = platformDomains.some(d => host.endsWith(d))
  
  if (!isPlatformDomain) {
    // This is a custom domain - pass the full hostname for resolution
    response.headers.set(TENANT_SLUG_HEADER, host)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'custom_domain')
    return response
  }
  
  // 5. Extract subdomain from platform domain
  if (parts.length >= 3) {
    const subdomain = parts[0]
    
    // Skip common non-tenant subdomains
    if (!['www', 'api', 'app', 'admin', 'preview'].includes(subdomain)) {
      response.headers.set(TENANT_SLUG_HEADER, subdomain)
      response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'subdomain')
      return response
    }
  }
  
  // No tenant resolved - this is fine for homepage, super admin, etc.
  // Individual API routes will handle tenant requirement
  return response
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
