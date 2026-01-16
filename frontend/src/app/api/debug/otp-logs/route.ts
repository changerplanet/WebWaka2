export const dynamic = 'force-dynamic'

/**
 * DEBUG ENDPOINT - OTP TEST LOGS
 * 
 * ⚠️ SECURED: Requires BOTH Super Admin authentication AND development environment
 * 
 * Wave C1: Security hardened - dual gate protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'

export async function GET(request: NextRequest) {
  // GATE 1: Environment check - MUST be development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    )
  }

  // GATE 2: Require Super Admin authentication
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  // Only reach here if BOTH gates pass
  const { getDebugOtpLogs, getDebugOtpLogsForIdentifier } = await import('@/lib/debug/otp-logger')
  
  const searchParams = request.nextUrl.searchParams
  const identifier = searchParams.get('identifier')

  const now = new Date()

  const logs = identifier 
    ? getDebugOtpLogsForIdentifier(identifier)
    : getDebugOtpLogs()

  const sortedLogs = logs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  return NextResponse.json({
    warning: '⚠️ DEBUG ENDPOINT - Super Admin only, development environment only.',
    authenticatedAs: authResult.user.email,
    environment: process.env.NODE_ENV,
    otps: sortedLogs.map(entry => ({
      identifier: entry.identifier,
      code: entry.code,
      type: entry.type,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      expiresIn: Math.max(0, Math.floor((new Date(entry.expiresAt).getTime() - now.getTime()) / 1000)) + ' seconds'
    })),
    count: sortedLogs.length,
    timestamp: now.toISOString()
  })
}
