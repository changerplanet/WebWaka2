/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Offline Sync API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { OfflineProcurementService } from '@/lib/procurement/offline-service'
import { ProcEntitlementsService } from '@/lib/procurement/entitlements-service'

/**
 * GET /api/procurement/offline
 * Get offline data package
 */
export async function GET() {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId

    // Check entitlement
    const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'offlineSync')
    if (!entitlement.allowed) {
      return NextResponse.json({ error: entitlement.reason }, { status: 403 })
    }

    const package_ = await OfflineProcurementService.getOfflinePackage(tenantId)
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
 * POST /api/procurement/offline
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

    // Check entitlement
    const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'offlineSync')
    if (!entitlement.allowed) {
      return NextResponse.json({ error: entitlement.reason }, { status: 403 })
    }

    // Get changes since last sync
    if (body.action === 'get-changes' && body.lastSyncAt) {
      const changes = await OfflineProcurementService.getChangesSince(
        tenantId,
        new Date(body.lastSyncAt)
      )
      return NextResponse.json(changes)
    }

    // Sync offline changes
    const result = await OfflineProcurementService.syncOfflineChanges(tenantId, {
      purchaseRequests: body.purchaseRequests,
      goodsReceipts: body.goodsReceipts,
      lastSyncAt: body.lastSyncAt ? new Date(body.lastSyncAt) : undefined,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error syncing offline changes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
