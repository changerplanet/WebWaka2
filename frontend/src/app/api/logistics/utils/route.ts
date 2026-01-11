export const dynamic = 'force-dynamic'

/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Utilities API Route - Entitlements, Statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { EntitlementsService } from '@/lib/logistics/entitlements-service'
import { AssignmentService } from '@/lib/logistics/assignment-service'

/**
 * GET /api/logistics/utils
 * Get entitlements or statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    const resource = searchParams.get('resource')

    switch (resource) {
      case 'entitlements': {
        const summary = await EntitlementsService.getEntitlementsSummary(tenantId)
        return NextResponse.json(summary)
      }

      case 'statistics': {
        const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
        const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
        const stats = await AssignmentService.getStatistics(tenantId, { dateFrom, dateTo })
        return NextResponse.json(stats)
      }

      case 'usage': {
        const usage = await EntitlementsService.getUsage(tenantId)
        return NextResponse.json(usage)
      }

      default:
        return NextResponse.json(
          { error: 'Invalid resource. Use: entitlements, statistics, usage' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error getting logistics utils:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
