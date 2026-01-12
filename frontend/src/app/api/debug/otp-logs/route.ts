export const dynamic = 'force-dynamic'

/**
 * DEBUG ENDPOINT - OTP TEST LOGS
 * 
 * ⚠️ WARNING: This is for DEVELOPMENT/TESTING ONLY
 * MUST be disabled in production
 * 
 * This endpoint exposes recently generated OTP codes so external reviewers
 * can complete authentication flows in the preview environment.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDebugOtpLogs, getDebugOtpLogsForIdentifier } from '@/lib/debug/otp-logger'

export async function GET(request: NextRequest) {
  // Only allow in development/preview
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const identifier = searchParams.get('identifier')

  const now = new Date()

  // Get in-memory logs
  const logs = identifier 
    ? getDebugOtpLogsForIdentifier(identifier)
    : getDebugOtpLogs()

  const sortedLogs = logs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  return NextResponse.json({
    warning: '⚠️ DEBUG ENDPOINT - For testing only. Disabled in production.',
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
