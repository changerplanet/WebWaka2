import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink, setSessionCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing_token', request.url)
      )
    }
    
    // Verify the magic link
    const result = await verifyMagicLink(token)
    
    if (!result) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_or_expired', request.url)
      )
    }
    
    const { user, session, tenantId } = result
    
    // Set session cookie
    await setSessionCookie(session.token)
    
    // Determine redirect destination
    let redirectUrl = '/'
    
    if (tenantId) {
      // Redirect to tenant dashboard
      redirectUrl = `/dashboard?tenant=${tenantId}`
    } else if (user.memberships.length === 1) {
      // User has exactly one tenant, go to their dashboard
      redirectUrl = `/dashboard?tenant=${user.memberships[0].tenant.slug}`
    } else if (user.globalRole === 'SUPER_ADMIN') {
      // Super admin goes to main dashboard
      redirectUrl = '/'
    } else if (user.memberships.length > 1) {
      // Multiple tenants, let them choose
      redirectUrl = '/select-tenant'
    }
    
    return NextResponse.redirect(new URL(redirectUrl, request.url))
    
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    )
  }
}
