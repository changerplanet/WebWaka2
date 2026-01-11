export const dynamic = 'force-dynamic'

/**
 * MVM Single Commission API
 * 
 * GET /api/commerce/mvm/commissions/[commissionId] - Get commission
 * POST /api/commerce/mvm/commissions/[commissionId]?action=... - Commission actions
 * 
 * @module api/commerce/mvm/commissions/[commissionId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { CommissionService } from '@/lib/mvm'

// ============================================================================
// GET - Get Commission
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { commissionId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { commissionId } = params
    const commission = await CommissionService.getById(commissionId)

    if (!commission) {
      return NextResponse.json(
        { success: false, error: 'Commission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: commission.id,
        tenantId: commission.tenantId,
        subOrderId: commission.subOrderId,
        subOrderNumber: commission.subOrder.subOrderNumber,
        orderNumber: commission.subOrder.parentOrder.orderNumber,
        vendorId: commission.vendorId,
        vendorName: commission.vendor.name,
        saleAmount: commission.saleAmount.toNumber(),
        vatAmount: commission.vatAmount.toNumber(),
        commissionRate: commission.commissionRate.toNumber(),
        commissionAmount: commission.commissionAmount.toNumber(),
        vendorPayout: commission.vendorPayout.toNumber(),
        status: commission.status,
        clearsAt: commission.clearsAt,
        clearedAt: commission.clearedAt,
        paidAt: commission.paidAt,
        payoutId: commission.payoutId,
        disputedAt: commission.disputedAt,
        disputeReason: commission.disputeReason,
        resolvedAt: commission.resolvedAt,
        resolutionNotes: commission.resolutionNotes,
        reversedAt: commission.reversedAt,
        reversalReason: commission.reversalReason,
        calculatedAt: commission.calculatedAt
      }
    })
  } catch (error) {
    console.error('[MVM Commission API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Commission Actions
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { commissionId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { commissionId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    // Check commission exists
    const commission = await CommissionService.getById(commissionId)
    if (!commission) {
      return NextResponse.json(
        { success: false, error: 'Commission not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'clear':
        result = await CommissionService.markCleared(commissionId)
        break
      
      case 'dispute':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Dispute reason required' },
            { status: 400 }
          )
        }
        result = await CommissionService.dispute(commissionId, body.disputedBy || 'vendor', body.reason)
        break
      
      case 'resolve':
        if (!body.notes || !body.resolution) {
          return NextResponse.json(
            { success: false, error: 'Resolution notes and outcome required' },
            { status: 400 }
          )
        }
        if (!['CLEARED', 'REVERSED'].includes(body.resolution)) {
          return NextResponse.json(
            { success: false, error: 'Resolution must be CLEARED or REVERSED' },
            { status: 400 }
          )
        }
        result = await CommissionService.resolveDispute(
          commissionId, 
          body.resolvedBy || 'admin', 
          body.notes, 
          body.resolution
        )
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Commission API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
