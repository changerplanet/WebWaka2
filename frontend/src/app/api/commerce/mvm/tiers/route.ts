/**
 * MVM Vendor Tiers API
 * 
 * GET /api/commerce/mvm/tiers - List tiers
 * POST /api/commerce/mvm/tiers - Create tier
 * POST /api/commerce/mvm/tiers?action=seed - Seed default tiers
 * 
 * @module api/commerce/mvm/tiers
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { VendorTierService } from '@/lib/mvm'

// ============================================================================
// GET - List Tiers
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

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const tiers = await VendorTierService.list(tenantId, includeInactive)

    return NextResponse.json({
      success: true,
      data: tiers.map((t: any) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        description: t.description,
        commissionRate: t.commissionRate.toNumber(),
        priorityLevel: t.priorityLevel,
        featuredSlots: t.featuredSlots,
        supportLevel: t.supportLevel,
        minMonthlySales: t.minMonthlySales?.toNumber() || null,
        minRating: t.minRating?.toNumber() || null,
        minOrderCount: t.minOrderCount,
        isActive: t.isActive,
        isDefault: t.isDefault
      }))
    })
  } catch (error) {
    console.error('[MVM Tiers API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Tier or Seed Defaults
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

    // Seed default tiers
    if (action === 'seed') {
      const result = await VendorTierService.seedDefaultTiers(tenantId)
      return NextResponse.json({
        success: true,
        data: result
      })
    }

    // Create custom tier
    const body = await request.json()
    const { name, code, description, commissionRate, ...rest } = body

    if (!name || !code || commissionRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, code, and commissionRate are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await VendorTierService.getByCode(tenantId, code)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A tier with this code already exists' },
        { status: 409 }
      )
    }

    const tier = await VendorTierService.create({
      tenantId,
      name,
      code,
      description,
      commissionRate,
      ...rest
    })

    return NextResponse.json({
      success: true,
      data: {
        id: tier.id,
        name: tier.name,
        code: tier.code,
        commissionRate: tier.commissionRate.toNumber()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('[MVM Tiers API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
