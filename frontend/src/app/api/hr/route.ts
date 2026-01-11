export const dynamic = 'force-dynamic'

/**
 * MODULE 5: HR & PAYROLL
 * Main API Route - Configuration management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { HrConfigurationService } from '@/lib/hr/config-service'
import { HrEntitlementsService } from '@/lib/hr/entitlements-service'

/**
 * GET /api/hr
 * Get HR configuration for current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check entitlement
    const entitlementCheck = await HrEntitlementsService.checkEntitlement(tenantId, 'hr_enabled')
    
    const { initialized, config } = await HrConfigurationService.getConfiguration(tenantId)
    
    return NextResponse.json({
      initialized,
      enabled: entitlementCheck.allowed,
      entitlementStatus: entitlementCheck,
      config,
    })
  } catch (error) {
    console.error('Error getting HR config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr
 * Initialize HR for tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check entitlement
    await HrEntitlementsService.enforceEntitlement(tenantId, 'hr_enabled')
    
    const body = await request.json()
    
    const config = await HrConfigurationService.initialize(tenantId, body)

    return NextResponse.json({
      success: true,
      message: 'HR initialized successfully',
      config,
    })
  } catch (error) {
    console.error('Error initializing HR:', error)
    
    if (error instanceof Error && error.message.includes('already initialized')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    if (error instanceof Error && error.message.includes('not allowed')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/hr
 * Update HR configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check if initialized
    const { initialized } = await HrConfigurationService.getConfiguration(tenantId)
    if (!initialized) {
      return NextResponse.json(
        { error: 'HR not initialized' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    const config = await HrConfigurationService.updateConfiguration(tenantId, body)

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Error updating HR config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
