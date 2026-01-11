export const dynamic = 'force-dynamic'

/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Zones API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ZoneService } from '@/lib/logistics/zone-service'
import { EntitlementsService } from '@/lib/logistics/entitlements-service'
import { ConfigurationService } from '@/lib/logistics/config-service'

/**
 * GET /api/logistics/zones
 * List delivery zones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined
    const zoneType = searchParams.get('zoneType') as 'CITY' | 'LGA' | 'STATE' | 'DISTANCE' | 'CUSTOM' | undefined
    const city = searchParams.get('city') || undefined
    const state = searchParams.get('state') || undefined
    const includeRules = searchParams.get('includeRules') === 'true'

    const zones = await ZoneService.getZones(tenantId, {
      status,
      zoneType,
      city,
      state,
      includeRules,
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error('Error getting zones:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/zones
 * Create delivery zone
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check if logistics is initialized
    const { initialized } = await ConfigurationService.getConfiguration(tenantId)
    if (!initialized) {
      return NextResponse.json(
        { error: 'Logistics not initialized' },
        { status: 400 }
      )
    }
    
    // Check zone limit
    await EntitlementsService.enforceEntitlement(tenantId, 'create_zone')
    
    const body = await request.json()
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      )
    }

    const zone = await ZoneService.createZone(tenantId, body)

    return NextResponse.json({
      success: true,
      zone,
    })
  } catch (error) {
    console.error('Error creating zone:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not allowed') || error.message.includes('Maximum')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: 'Zone code already exists' }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
