/**
 * SUPER ADMIN IMPERSONATION API
 * 
 * Endpoints for managing impersonation sessions.
 * Only accessible by Super Admins.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { 
  startImpersonation, 
  endImpersonation, 
  getImpersonationTargets,
  getImpersonationLogs,
  ImpersonationContext 
} from '@/lib/admin/impersonation-service'
import { cookies } from 'next/headers'

// In-memory store for impersonation contexts (in production, use Redis or DB)
const impersonationStore = new Map<string, ImpersonationContext>()

/**
 * GET /api/admin/impersonation
 * Get available impersonation targets or current impersonation status
 */
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'status') {
      // Get current impersonation status
      const context = impersonationStore.get(authResult.user.id)
      
      if (context && new Date(context.expiresAt) > new Date()) {
        return NextResponse.json({
          success: true,
          impersonating: true,
          context
        })
      }
      
      return NextResponse.json({
        success: true,
        impersonating: false
      })
    }

    if (action === 'logs') {
      const logs = await getImpersonationLogs(50)
      return NextResponse.json({ success: true, logs })
    }

    // Default: get available targets
    const targets = await getImpersonationTargets()
    return NextResponse.json({ success: true, targets })
  } catch (error) {
    console.error('Impersonation GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get impersonation data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/impersonation
 * Start or end impersonation session
 */
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  try {
    const body = await request.json()
    const { action, targetType, targetId } = body

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    if (action === 'start') {
      if (!targetType || !targetId) {
        return NextResponse.json(
          { success: false, error: 'targetType and targetId required' },
          { status: 400 }
        )
      }

      // Check if already impersonating
      const existing = impersonationStore.get(authResult.user.id)
      if (existing && new Date(existing.expiresAt) > new Date()) {
        return NextResponse.json(
          { success: false, error: 'Already impersonating. End current session first.' },
          { status: 400 }
        )
      }

      const result = await startImpersonation(
        authResult.user.id,
        authResult.user.email || 'unknown',
        targetType,
        targetId,
        authResult.session.sessionToken, // Use the token for session updates
        ipAddress,
        userAgent
      )

      if (result.success && result.context) {
        // Store impersonation context
        impersonationStore.set(authResult.user.id, result.context)
      }

      return NextResponse.json(result)
    }

    if (action === 'end') {
      const context = impersonationStore.get(authResult.user.id)
      
      if (!context) {
        return NextResponse.json(
          { success: false, error: 'No active impersonation session' },
          { status: 400 }
        )
      }

      const result = await endImpersonation(
        authResult.user.id,
        authResult.user.email || 'unknown',
        context,
        ipAddress,
        userAgent
      )

      if (result.success) {
        impersonationStore.delete(authResult.user.id)
      }

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "start" or "end".' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Impersonation POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process impersonation request' },
      { status: 500 }
    )
  }
}
