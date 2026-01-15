/**
 * Multi-Park Operator Dashboard API (Wave G5)
 * 
 * GET /api/parkhub/operator-dashboard - Get consolidated operator view
 * 
 * Constraints:
 * - Read-only: No modifications
 * - Tenant-isolated via session.activeTenantId
 * - No automation, no background jobs
 * 
 * Security: Session validation enforced - activeTenantId required for non-demo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { createMultiParkOperatorService } from '@/lib/commerce/parkhub/multi-park-operator-service'

const DEMO_TENANT_ID = 'demo-tenant-001'

function getTenantIdFromSession(session: { activeTenantId?: string | null } | null): string | null {
  return session?.activeTenantId ?? null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const isDemo = tenantId === DEMO_TENANT_ID
    
    if (isDemo) {
      const service = createMultiParkOperatorService(DEMO_TENANT_ID)
      const dashboard = await service.getOperatorDashboard()
      return NextResponse.json({
        success: true,
        data: dashboard
      })
    }
    
    if (!activeTenantId) {
      return NextResponse.json(
        { error: 'Authentication required - no active tenant in session' },
        { status: 401 }
      )
    }
    
    if (activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const service = createMultiParkOperatorService(activeTenantId)
    const dashboard = await service.getOperatorDashboard()
    
    return NextResponse.json({
      success: true,
      data: dashboard
    })
  } catch (error) {
    console.error('[OperatorDashboard API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operator dashboard' },
      { status: 500 }
    )
  }
}
