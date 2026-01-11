export const dynamic = 'force-dynamic'

/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Main API Route - Configuration and status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ProcConfigurationService } from '@/lib/procurement/config-service'
import { ProcEntitlementsService } from '@/lib/procurement/entitlements-service'

/**
 * GET /api/procurement
 * Get procurement status and configuration
 */
export async function GET() {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId

    const [status, entitlements] = await Promise.all([
      ProcConfigurationService.getStatus(tenantId),
      ProcEntitlementsService.getEntitlements(tenantId),
    ])

    return NextResponse.json({
      ...status,
      entitlements: {
        procurementEnabled: entitlements.procurementEnabled,
        supplierPriceList: entitlements.supplierPriceList,
        supplierAnalytics: entitlements.supplierAnalytics,
      },
    })
  } catch (error) {
    console.error('Error getting procurement status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement
 * Initialize procurement module
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
    const entitlement = await ProcEntitlementsService.checkEntitlement(tenantId, 'procurementEnabled')
    if (!entitlement.allowed) {
      return NextResponse.json(
        { error: entitlement.reason || 'Procurement not enabled for this plan' },
        { status: 403 }
      )
    }

    const config = await ProcConfigurationService.initialize(tenantId, body)

    return NextResponse.json({
      success: true,
      config,
      message: 'Procurement module initialized',
    })
  } catch (error) {
    console.error('Error initializing procurement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/procurement
 * Update procurement configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    const config = await ProcConfigurationService.updateConfig(tenantId, body)

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Error updating procurement config:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Procurement not initialized. Call POST first.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
