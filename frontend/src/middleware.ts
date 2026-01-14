/**
 * Next.js Middleware for Route Protection and Tenant Resolution
 * 
 * This middleware handles:
 * 1. Session validation for protected routes
 * 2. Role-based route blocking (redirects to /login if no session)
 * 3. Tenant resolution via headers, query params, cookies, or hostname
 * 
 * IMPORTANT: Edge runtime cannot access Prisma directly.
 * Deep role checks (e.g., is user a Partner?) are handled by layout guards.
 * Middleware only checks for session existence on protected routes.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const TENANT_ID_HEADER = 'x-tenant-id'
export const TENANT_SLUG_HEADER = 'x-tenant-slug'
export const TENANT_RESOLVED_VIA_HEADER = 'x-tenant-resolved-via'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/signup',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/icons',
  '/robots.txt',
  '/sitemap.xml',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/capabilities',
  '/for-enterprises',
  '/for-regulators',
  '/governance',
  '/impact',
  '/partners',
  '/platform',
  '/suites',
]

const SUPER_ADMIN_PATHS = [
  '/admin',
  '/api/admin'
]

const PARTNER_PATHS = [
  '/partner-portal',
  '/dashboard/partner'
]

const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']

function isStaticFile(pathname: string): boolean {
  return STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
}

function isSuperAdminPath(pathname: string): boolean {
  return SUPER_ADMIN_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
}

function isPartnerPath(pathname: string): boolean {
  return PARTNER_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
}

function isProtectedPath(pathname: string): boolean {
  return isSuperAdminPath(pathname) || isPartnerPath(pathname) || pathname.startsWith('/dashboard')
}

function hasSessionCookie(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('session_token')?.value
  return !!sessionToken && sessionToken.length > 0
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }
  
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }
  
  // SESSION CHECK: Protected routes require a valid session cookie
  // Deep role verification is done by layout guards (they have DB access)
  if (isProtectedPath(pathname)) {
    if (!hasSessionCookie(request)) {
      // No session - redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Super Admin and Partner paths pass through here
  // Layout guards will verify the actual role via API/DB calls
  if (isSuperAdminPath(pathname) || isPartnerPath(pathname)) {
    return NextResponse.next()
  }
  
  // TENANT RESOLUTION for remaining routes
  const response = NextResponse.next()
  
  const headerTenantId = request.headers.get('x-tenant-id')
  if (headerTenantId) {
    response.headers.set(TENANT_ID_HEADER, headerTenantId)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'header')
    return response
  }
  
  const tenantQuery = request.nextUrl.searchParams.get('tenant')
  if (tenantQuery) {
    response.headers.set(TENANT_SLUG_HEADER, tenantQuery)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'query')
    return response
  }
  
  const tenantCookie = request.cookies.get('tenant_slug')?.value
  if (tenantCookie) {
    response.headers.set(TENANT_SLUG_HEADER, tenantCookie)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'cookie')
    return response
  }
  
  const host = hostname.split(':')[0].toLowerCase()
  const parts = host.split('.')
  
  const platformDomains = ['localhost', 'emergentagent.com', 'webwaka.com', 'vercel.app']
  const isPlatformDomain = platformDomains.some(d => host.endsWith(d))
  
  if (!isPlatformDomain) {
    response.headers.set(TENANT_SLUG_HEADER, host)
    response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'custom_domain')
    return response
  }
  
  if (parts.length >= 3) {
    const subdomain = parts[0]
    
    if (!['www', 'api', 'app', 'admin', 'preview'].includes(subdomain)) {
      response.headers.set(TENANT_SLUG_HEADER, subdomain)
      response.headers.set(TENANT_RESOLVED_VIA_HEADER, 'subdomain')
      return response
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
