/**
 * SVM Order Cancel API
 * 
 * POST /api/commerce/svm/orders/[orderId]/cancel - Cancel an order
 * 
 * @module api/commerce/svm/orders/[orderId]/cancel
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { formatNGN } from '@/lib/currency'
import { 
  checkCancellationEligibility,
  cancelOrder,
  type CancellationReason
} from '@/lib/svm'

// ============================================================================
// POST - Cancel Order
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { orderId } = params
    const body = await request.json()
    const { 
      reason = 'CUSTOMER_REQUEST',
      notes
    } = body as {
      reason?: CancellationReason
      notes?: string
    }

    // Verify order belongs to tenant
    const order = await prisma.svm_orders.findFirst({
      where: { id: orderId, tenantId },
      select: { id: true, status: true, grandTotal: true }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check eligibility first
    const eligibility = await checkCancellationEligibility(orderId)
    
    if (!eligibility.canCancel) {
      return NextResponse.json({
        success: false,
        error: eligibility.reason || 'Order cannot be cancelled',
        eligibility
      }, { status: 400 })
    }

    // Perform cancellation
    const result = await cancelOrder(orderId, reason, 'CUSTOMER', notes)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: 'CANCELLED',
        refundAmount: result.refundAmount,
        refundAmountFormatted: formatNGN(result.refundAmount || 0),
        cancellationFee: eligibility.cancellationFee,
        cancellationFeeFormatted: formatNGN(eligibility.cancellationFee),
        message: eligibility.refundEligible 
          ? `Order cancelled. Refund of ${formatNGN(result.refundAmount || 0)} will be processed.`
          : 'Order cancelled successfully.'
      }
    })
  } catch (error) {
    console.error('[SVM Order Cancel API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Check Cancellation Eligibility
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'svm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { orderId } = params

    // Verify order belongs to tenant
    const order = await prisma.svm_orders.findFirst({
      where: { id: orderId, tenantId },
      select: { id: true }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check eligibility
    const eligibility = await checkCancellationEligibility(orderId)

    return NextResponse.json({
      success: true,
      data: {
        ...eligibility,
        refundAmountFormatted: formatNGN(eligibility.refundAmount),
        cancellationFeeFormatted: formatNGN(eligibility.cancellationFee)
      }
    })
  } catch (error) {
    console.error('[SVM Order Cancel Eligibility API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
