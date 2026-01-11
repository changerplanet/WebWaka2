export const dynamic = 'force-dynamic'

/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Zone Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ZoneService } from '@/lib/logistics/zone-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/logistics/zones/[id]
 * Get zone by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const zone = await ZoneService.getZoneById(tenantId, id)

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Error getting zone:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/logistics/zones/[id]
 * Update zone
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    const zone = await ZoneService.updateZone(tenantId, id, body)

    return NextResponse.json({
      success: true,
      zone,
    })
  } catch (error) {
    console.error('Error updating zone:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/logistics/zones/[id]
 * Delete zone
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    await ZoneService.deleteZone(tenantId, id)

    return NextResponse.json({
      success: true,
      message: 'Zone deleted',
    })
  } catch (error) {
    console.error('Error deleting zone:', error)
    
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/zones/[id]
 * Add pricing rule to zone
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Rule name is required' },
        { status: 400 }
      )
    }

    const rule = await ZoneService.createPricingRule(tenantId, {
      zoneId: id,
      ...body,
    })

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error) {
    console.error('Error creating pricing rule:', error)
    
    if (error instanceof Error && error.message === 'Zone not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
