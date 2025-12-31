import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink, setSessionCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', baseUrl))
    }
    
    // Verify the magic link
    const result = await verifyMagicLink(token)
    
    if (!result) {
      return NextResponse.redirect(new URL('/login?error=invalid_or_expired', baseUrl))
    }
    
    const { user, session, tenantId } = result
    
    // Set session cookie
    await setSessionCookie(session.token)
    
    // Determine redirect destination
    let redirectPath = '/'
    
    if (tenantId) {
      // Redirect to tenant dashboard
      redirectPath = `/dashboard?tenant=${tenantId}`
    } else if (user.memberships.length === 1) {
      // User has exactly one tenant, go to their dashboard
      redirectPath = `/dashboard?tenant=${user.memberships[0].tenant.slug}`
    } else if (user.globalRole === 'SUPER_ADMIN') {
      // Super admin goes to main dashboard
      redirectPath = '/'
    } else if (user.memberships.length > 1) {
      // Multiple tenants, let them choose
      redirectPath = '/select-tenant'
    }
    
    return NextResponse.redirect(new URL(redirectPath, baseUrl))
    
  } catch (error) {
    console.error('Verify error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://984563f9-f838-4c1b-8d6f-14f4bc5ff050.preview.emergentagent.com'
    return NextResponse.redirect(new URL('/login?error=verification_failed', baseUrl))
  }
}
