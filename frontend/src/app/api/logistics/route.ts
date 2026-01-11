export const dynamic = 'force-dynamic'

/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Main API Route - Configuration management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ConfigurationService } from '@/lib/logistics/config-service'
import { EntitlementsService } from '@/lib/logistics/entitlements-service'

/**
 * GET /api/logistics
 * Get logistics configuration for current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check entitlement
    const entitlementCheck = await EntitlementsService.checkEntitlement(tenantId, 'logistics_enabled')
    
    const { initialized, config } = await ConfigurationService.getConfiguration(tenantId)
    
    return NextResponse.json({
      initialized,
      enabled: entitlementCheck.allowed,
      entitlementStatus: entitlementCheck,
      config,
    })
  } catch (error) {
    console.error('Error getting logistics config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics
 * Initialize logistics for tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check entitlement
    await EntitlementsService.enforceEntitlement(tenantId, 'logistics_enabled')
    
    const body = await request.json()
    
    const config = await ConfigurationService.initialize(tenantId, {
      createDefaultZones: body.createDefaultZones ?? true,
      deliveryEnabled: body.deliveryEnabled,
      autoAssignmentEnabled: body.autoAssignmentEnabled,
      proofOfDeliveryRequired: body.proofOfDeliveryRequired,
      photoProofRequired: body.photoProofRequired,
      signatureProofRequired: body.signatureProofRequired,
      pinVerificationEnabled: body.pinVerificationEnabled,
      otpVerificationEnabled: body.otpVerificationEnabled,
      defaultPriority: body.defaultPriority,
      defaultCurrency: body.defaultCurrency,
      assignmentAlgorithm: body.assignmentAlgorithm,
      maxConcurrentDeliveries: body.maxConcurrentDeliveries,
      maxDeliveryAttempts: body.maxDeliveryAttempts,
      operatingHours: body.operatingHours,
      metadata: body.metadata,
    })

    return NextResponse.json({
      success: true,
      message: 'Logistics initialized successfully',
      config,
    })
  } catch (error) {
    console.error('Error initializing logistics:', error)
    
    if (error instanceof Error && error.message.includes('already initialized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('not allowed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/logistics
 * Update logistics configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check if initialized
    const { initialized } = await ConfigurationService.getConfiguration(tenantId)
    if (!initialized) {
      return NextResponse.json(
        { error: 'Logistics not initialized' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Check auto-assignment entitlement if trying to enable it
    if (body.autoAssignmentEnabled) {
      await EntitlementsService.enforceEntitlement(tenantId, 'auto_assignment_enabled')
    }
    
    // Check real-time tracking entitlement if trying to enable it
    if (body.realTimeTrackingEnabled) {
      await EntitlementsService.enforceEntitlement(tenantId, 'real_time_tracking_enabled')
    }
    
    const config = await ConfigurationService.updateConfiguration(tenantId, body)

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Error updating logistics config:', error)
    
    if (error instanceof Error && error.message.includes('not allowed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
