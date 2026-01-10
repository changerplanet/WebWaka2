/**
 * SVM Local Pickup API
 * 
 * GET /api/commerce/svm/shipping/pickup - Check pickup availability
 * POST /api/commerce/svm/shipping/pickup - Enable/disable pickup
 * 
 * @module api/commerce/svm/shipping/pickup
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import {
  isLocalPickupAvailable,
  enableLocalPickup,
  disableLocalPickup
} from '@/lib/svm'

// ============================================================================
// GET - Check Local Pickup Availability
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const available = await isLocalPickupAvailable(tenantId)

    return NextResponse.json({
      success: true,
      data: {
        localPickupEnabled: available,
        description: available 
          ? 'Customers can pick up orders from your store location'
          : 'Local pickup is currently disabled'
      }
    })
  } catch (error) {
    console.error('[SVM Pickup API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Enable/Disable Local Pickup
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { enabled } = body as { enabled: boolean }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled (boolean) is required' },
        { status: 400 }
      )
    }

    if (enabled) {
      await enableLocalPickup(tenantId)
    } else {
      await disableLocalPickup(tenantId)
    }

    return NextResponse.json({
      success: true,
      data: {
        localPickupEnabled: enabled,
        message: enabled 
          ? 'Local pickup has been enabled'
          : 'Local pickup has been disabled'
      }
    })
  } catch (error) {
    console.error('[SVM Pickup API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
