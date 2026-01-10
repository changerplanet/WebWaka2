/**
 * MVM Marketplace Config API
 * 
 * GET /api/commerce/mvm/config - Get marketplace config
 * PUT /api/commerce/mvm/config - Update config
 * POST /api/commerce/mvm/config?action=... - Config actions
 * 
 * @module api/commerce/mvm/config
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { MarketplaceConfigService } from '@/lib/mvm'

// ============================================================================
// GET - Get Marketplace Config
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuardLegacy(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const config = await MarketplaceConfigService.getOrCreate(tenantId)

    return NextResponse.json({
      success: true,
      data: {
        tenantId: config.tenantId,
        marketplaceName: config.marketplaceName,
        marketplaceSlug: config.marketplaceSlug,
        description: config.description,
        logo: config.logo,
        defaultCommissionRate: config.defaultCommissionRate.toNumber(),
        vatRate: config.vatRate.toNumber(),
        autoApproveVendors: config.autoApproveVendors,
        requireVerification: config.requireVerification,
        payoutCycleDays: config.payoutCycleDays,
        minPayoutAmount: config.minPayoutAmount.toNumber(),
        clearanceDays: config.clearanceDays,
        vendorPricing: config.vendorPricing,
        vendorShipping: config.vendorShipping,
        isActive: config.isActive
      }
    })
  } catch (error) {
    console.error('[MVM Config API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update Marketplace Config
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuardLegacy(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate commission rate if provided
    if (body.defaultCommissionRate !== undefined) {
      if (body.defaultCommissionRate < 0 || body.defaultCommissionRate > 100) {
        return NextResponse.json(
          { success: false, error: 'Commission rate must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Validate VAT rate if provided
    if (body.vatRate !== undefined) {
      if (body.vatRate < 0 || body.vatRate > 100) {
        return NextResponse.json(
          { success: false, error: 'VAT rate must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    const config = await MarketplaceConfigService.update(tenantId, body)

    return NextResponse.json({
      success: true,
      data: {
        tenantId: config.tenantId,
        defaultCommissionRate: config.defaultCommissionRate.toNumber(),
        vatRate: config.vatRate.toNumber(),
        minPayoutAmount: config.minPayoutAmount.toNumber(),
        isActive: config.isActive
      }
    })
  } catch (error) {
    console.error('[MVM Config API] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Config Actions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuardLegacy(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    let result

    switch (action) {
      case 'activate':
        result = await MarketplaceConfigService.activate(tenantId)
        break
      
      case 'deactivate':
        result = await MarketplaceConfigService.deactivate(tenantId)
        break
      
      case 'reset':
        result = await MarketplaceConfigService.resetToDefaults(tenantId)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        tenantId: result.tenantId,
        isActive: result.isActive
      }
    })
  } catch (error) {
    console.error('[MVM Config API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
