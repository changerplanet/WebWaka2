/**
 * MVM Payouts API
 * 
 * GET /api/commerce/mvm/payouts - List payouts
 * GET /api/commerce/mvm/payouts?eligible=true - Get eligible vendors
 * POST /api/commerce/mvm/payouts - Create payout
 * 
 * @module api/commerce/mvm/payouts
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { PayoutService, CommissionService } from '@/lib/mvm'

// ============================================================================
// GET - List Payouts or Eligible Vendors
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
    const eligible = searchParams.get('eligible') === 'true'
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status') as any
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Return eligible vendors for payout
    if (eligible) {
      const eligibleVendors = await PayoutService.getEligibleVendors(tenantId)
      return NextResponse.json({
        success: true,
        data: eligibleVendors
      })
    }

    // If vendorId, return vendor-specific data
    if (vendorId) {
      const [summary, recent, payable] = await Promise.all([
        PayoutService.getVendorPayoutSummary(vendorId),
        PayoutService.getRecentPayouts(vendorId, 5),
        CommissionService.getPayable(vendorId)
      ])

      return NextResponse.json({
        success: true,
        data: {
          summary,
          recentPayouts: recent,
          payableCommissions: payable
        }
      })
    }

    // Return list
    const result = await PayoutService.list({
      tenantId,
      status: status || undefined,
      page,
      pageSize
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Payouts API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Payout
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

    const body = await request.json()
    const { vendorId, commissionIds, payoutMethod } = body

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendorId required' },
        { status: 400 }
      )
    }

    // Check eligibility
    const eligibility = await PayoutService.checkEligibility(tenantId, vendorId)
    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, error: eligibility.reason },
        { status: 400 }
      )
    }

    let payout

    // If specific commissionIds provided, create payout from those
    if (commissionIds && Array.isArray(commissionIds) && commissionIds.length > 0) {
      payout = await PayoutService.create({
        tenantId,
        vendorId,
        commissionIds,
        payoutMethod
      })
    } else {
      // Create payout from all cleared commissions
      payout = await PayoutService.createFromAllCleared(tenantId, vendorId)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payout.id,
        payoutNumber: payout.payoutNumber,
        netAmount: payout.netAmount.toNumber(),
        status: payout.status
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('[MVM Payouts API] POST Error:', error)
    
    if (error.message) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
