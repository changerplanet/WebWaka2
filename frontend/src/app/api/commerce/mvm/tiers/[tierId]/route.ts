/**
 * MVM Single Tier API
 * 
 * GET /api/commerce/mvm/tiers/[tierId] - Get tier
 * PUT /api/commerce/mvm/tiers/[tierId] - Update tier
 * DELETE /api/commerce/mvm/tiers/[tierId] - Delete tier
 * 
 * @module api/commerce/mvm/tiers/[tierId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { VendorTierService } from '@/lib/mvm'

// ============================================================================
// GET - Get Tier
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
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

    const { tierId } = params
    const tier = await VendorTierService.getById(tenantId, tierId)

    if (!tier) {
      return NextResponse.json(
        { success: false, error: 'Tier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tier.id,
        name: tier.name,
        code: tier.code,
        description: tier.description,
        commissionRate: tier.commissionRate.toNumber(),
        priorityLevel: tier.priorityLevel,
        featuredSlots: tier.featuredSlots,
        supportLevel: tier.supportLevel,
        minMonthlySales: tier.minMonthlySales?.toNumber() || null,
        minRating: tier.minRating?.toNumber() || null,
        minOrderCount: tier.minOrderCount,
        isActive: tier.isActive,
        isDefault: tier.isDefault
      }
    })
  } catch (error) {
    console.error('[MVM Tier API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update Tier
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
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

    const { tierId } = params
    const body = await request.json()

    // Check tier exists
    const existing = await VendorTierService.getById(tenantId, tierId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tier not found' },
        { status: 404 }
      )
    }

    const updated = await VendorTierService.update(tenantId, tierId, body)

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        commissionRate: updated.commissionRate.toNumber()
      }
    })
  } catch (error) {
    console.error('[MVM Tier API] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete Tier (soft delete)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
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

    const { tierId } = params

    // Check tier exists
    const existing = await VendorTierService.getById(tenantId, tierId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tier not found' },
        { status: 404 }
      )
    }

    // Cannot delete default tier
    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default tier' },
        { status: 400 }
      )
    }

    await VendorTierService.delete(tenantId, tierId)

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })
  } catch (error) {
    console.error('[MVM Tier API] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
