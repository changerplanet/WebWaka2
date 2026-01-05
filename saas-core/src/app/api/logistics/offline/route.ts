/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Offline API Route - Offline data and sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { OfflineService } from '@/lib/logistics/offline-service'

/**
 * GET /api/logistics/offline
 * Get offline data package
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId') || undefined

    const package_ = await OfflineService.getOfflinePackage(tenantId, agentId)

    return NextResponse.json(package_)
  } catch (error) {
    console.error('Error getting offline package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/offline
 * Sync offline changes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    const result = await OfflineService.syncOfflineChanges(tenantId, {
      lastSyncAt: body.lastSyncAt,
      statusUpdates: body.statusUpdates,
      proofs: body.proofs,
      locationUpdates: body.locationUpdates,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error syncing offline changes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
