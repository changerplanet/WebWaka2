export const dynamic = 'force-dynamic'

/**
 * SVM Shipping API
 * 
 * GET /api/commerce/svm/shipping - Get shipping zones
 * POST /api/commerce/svm/shipping - Calculate shipping quote
 * 
 * @module api/commerce/svm/shipping
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { formatNGN } from '@/lib/currency'
import {
  getShippingZones,
  calculateShipping,
  getCheapestShipping,
  getFastestShipping,
  isLocalPickupAvailable,
  seedNigerianShippingZones,
  isValidNigerianState,
  getRegionForState,
  NIGERIAN_STATES,
  NIGERIAN_REGIONS
} from '@/lib/svm'

// ============================================================================
// GET - Get Shipping Zones
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

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'zones'

    switch (action) {
      case 'zones': {
        // Get all zones for tenant
        let zones = await getShippingZones(tenantId)
        
        // Seed zones if none exist
        if (zones.length === 0) {
          zones = await seedNigerianShippingZones(tenantId)
        }

        return NextResponse.json({
          success: true,
          data: {
            zones,
            count: zones.length
          }
        })
      }

      case 'states': {
        // Return list of Nigerian states with their regions
        const states = NIGERIAN_STATES.map(state => ({
          name: state,
          region: getRegionForState(state)
        }))

        return NextResponse.json({
          success: true,
          data: {
            states,
            regions: Object.keys(NIGERIAN_REGIONS)
          }
        })
      }

      case 'pickup': {
        // Check if local pickup is available
        const available = await isLocalPickupAvailable(tenantId)

        return NextResponse.json({
          success: true,
          data: {
            localPickupAvailable: available
          }
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[SVM Shipping API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Calculate Shipping Quote
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
    const {
      state,
      subtotal,
      includeLocalPickup = true,
      preferredOption // 'cheapest' | 'fastest' | 'all'
    } = body as {
      state: string
      subtotal: number
      includeLocalPickup?: boolean
      preferredOption?: 'cheapest' | 'fastest' | 'all'
    }

    // Validate state
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State is required' },
        { status: 400 }
      )
    }

    if (!isValidNigerianState(state)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid Nigerian state: ${state}`,
          validStates: NIGERIAN_STATES
        },
        { status: 400 }
      )
    }

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid subtotal is required' },
        { status: 400 }
      )
    }

    // Calculate shipping based on preference
    switch (preferredOption) {
      case 'cheapest': {
        const option = await getCheapestShipping(tenantId, state, subtotal)
        return NextResponse.json({
          success: true,
          data: {
            option,
            region: getRegionForState(state)
          }
        })
      }

      case 'fastest': {
        const option = await getFastestShipping(tenantId, state, subtotal)
        return NextResponse.json({
          success: true,
          data: {
            option,
            region: getRegionForState(state)
          }
        })
      }

      default: {
        // Return all options
        const options = await calculateShipping(tenantId, state, subtotal, includeLocalPickup)
        
        // Find cheapest and fastest for convenience
        const cheapest = options.reduce((min, opt) => 
          !opt.isLocalPickup && opt.fee < min.fee ? opt : min
        , options.find((o: any) => !o.isLocalPickup) || options[0])
        
        const fastest = options.reduce((fast, opt) => 
          !opt.isLocalPickup && opt.estimatedDays.max < fast.estimatedDays.max ? opt : fast
        , options.find((o: any) => !o.isLocalPickup) || options[0])

        // Calculate free shipping threshold info
        const freeShippingInfo = options
          .filter((o: any) => o.freeThreshold && o.amountToFreeShipping && o.amountToFreeShipping > 0)
          .map((o: any) => ({
            method: o.rateName,
            threshold: o.freeThreshold,
            thresholdFormatted: formatNGN(o.freeThreshold!),
            amountNeeded: o.amountToFreeShipping,
            amountNeededFormatted: formatNGN(o.amountToFreeShipping!)
          }))[0] || null

        return NextResponse.json({
          success: true,
          data: {
            options,
            region: getRegionForState(state),
            recommendations: {
              cheapest: cheapest?.rateId,
              fastest: fastest?.rateId
            },
            freeShipping: freeShippingInfo,
            localPickupAvailable: options.some((o: any) => o.isLocalPickup)
          }
        })
      }
    }
  } catch (error) {
    console.error('[SVM Shipping API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
