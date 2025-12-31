import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink } from '@/lib/auth'
import { cookies } from 'next/headers'

const SESSION_EXPIRY_DAYS = 7

function getBaseUrl(request: NextRequest): string {
  // Try environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  // Fall back to request origin
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // Get the base URL dynamically
    const baseUrl = getBaseUrl(request)
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', baseUrl))
    }
    
    // Verify the magic link
    const result = await verifyMagicLink(token)
    
    if (!result) {
      return NextResponse.redirect(new URL('/login?error=invalid_or_expired', baseUrl))
    }
    
    const { user, session, tenantId } = result
    
    // Determine redirect destination
    let redirectPath = '/'
    
    if (tenantId) {
      // Redirect to tenant dashboard
      redirectPath = `/dashboard?tenant=${tenantId}`
    } else if (user.memberships.length === 1) {
      // User has exactly one tenant, go to their dashboard
      redirectPath = `/dashboard?tenant=${user.memberships[0].tenant.slug}`
    } else if (user.globalRole === 'SUPER_ADMIN') {
      // Super admin goes to admin dashboard
      redirectPath = '/admin'
    } else if (user.memberships.length > 1) {
      // Multiple tenants, let them choose
      redirectPath = '/select-tenant'
    } else if (user.memberships.length === 0) {
      // No memberships, go to homepage
      redirectPath = '/'
    }
    
    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectPath, baseUrl))
    
    // Set session cookie directly on the response
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/'
    })
    
    return response
    
  } catch (error) {
    console.error('Verify error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tenanthub-3.preview.emergentagent.com'
    return NextResponse.redirect(new URL('/login?error=verification_failed', baseUrl))
  }
}
