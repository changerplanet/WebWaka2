/**
 * MVM Single Payout API
 * 
 * GET /api/commerce/mvm/payouts/[payoutId] - Get payout
 * POST /api/commerce/mvm/payouts/[payoutId]?action=... - Payout actions
 * 
 * @module api/commerce/mvm/payouts/[payoutId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'
import { PayoutService } from '@/lib/mvm'

// ============================================================================
// GET - Get Payout
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { payoutId } = params
    
    // Check if it's a payout number (starts with PAY-)
    const payout = payoutId.startsWith('PAY-')
      ? await PayoutService.getByNumber(payoutId)
      : await PayoutService.getById(payoutId)

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payout.id,
        payoutNumber: payout.payoutNumber,
        vendorId: payout.vendorId,
        vendorName: null, // Would need to fetch vendor separately
        periodStart: payout.periodStart,
        periodEnd: payout.periodEnd,
        currency: payout.currency,
        grossAmount: payout.grossAmount.toNumber(),
        deductions: payout.deductions.toNumber(),
        netAmount: payout.netAmount.toNumber(),
        status: payout.status,
        payoutMethod: payout.payoutMethod,
        bankName: payout.bankName,
        accountNumber: payout.accountNumber ? `****${payout.accountNumber.slice(-4)}` : null,
        accountName: payout.accountName,
        paymentRef: payout.paymentRef,
        approvedAt: payout.approvedAt,
        approvedBy: payout.approvedBy,
        processedAt: payout.processedAt,
        completedAt: payout.completedAt,
        failedAt: payout.failedAt,
        failureReason: payout.failureReason,
        createdAt: payout.createdAt,
        commissions: [] // Would need to fetch commissions separately
      }
    })
  } catch (error) {
    console.error('[MVM Payout API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Payout Actions
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const { payoutId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    // Check payout exists
    const payout = await PayoutService.getById(payoutId)
    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    let result

    switch (action) {
      case 'approve':
        result = await PayoutService.approve(payoutId, body.approvedBy || 'admin')
        break
      
      case 'complete':
        result = await PayoutService.markCompleted(payoutId, body.paymentRef)
        break
      
      case 'fail':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Failure reason required' },
            { status: 400 }
          )
        }
        result = await PayoutService.markFailed(payoutId, body.reason)
        break
      
      case 'cancel':
        result = await PayoutService.cancel(payoutId)
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
  } catch (error: any) {
    console.error('[MVM Payout API] POST Error:', error)
    
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
