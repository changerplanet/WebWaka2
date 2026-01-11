export const dynamic = 'force-dynamic'

/**
 * SVM Bank Transfer API
 * 
 * POST /api/commerce/svm/payments/transfer - Initiate bank transfer
 * GET /api/commerce/svm/payments/transfer - Get transfer details
 * 
 * @module api/commerce/svm/payments/transfer
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { formatNGN } from '@/lib/currency'
import {
  createBankTransferDetails,
  generateTransferReference,
  isValidTransferReference
} from '@/lib/svm'

// ============================================================================
// POST - Initiate Bank Transfer
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
    const { orderId } = body as { orderId: string }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.svm_orders.findFirst({
      where: { id: orderId, tenantId },
      select: { 
        id: true, 
        orderNumber: true,
        grandTotal: true, 
        paymentStatus: true,
        paymentMethod: true,
        paymentRef: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (order.paymentStatus === 'CAPTURED') {
      return NextResponse.json(
        { success: false, error: 'Order has already been paid' },
        { status: 400 }
      )
    }

    // Check payment method
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      return NextResponse.json(
        { success: false, error: 'Order payment method is not bank transfer' },
        { status: 400 }
      )
    }

    // Generate transfer details
    const transferDetails = await createBankTransferDetails(
      tenantId,
      orderId,
      Number(order.grandTotal)
    )

    // Update order with payment reference
    await prisma.svm_orders.update({
      where: { id: orderId },
      data: {
        paymentRef: transferDetails.reference,
        paymentStatus: 'PENDING',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        orderNumber: order.orderNumber,
        transfer: {
          bankName: transferDetails.bankName,
          accountNumber: transferDetails.accountNumber,
          accountName: transferDetails.accountName,
          reference: transferDetails.reference,
          amount: transferDetails.amount,
          amountFormatted: transferDetails.amountFormatted,
          expiresAt: transferDetails.expiresAt,
          expiresIn: '24 hours'
        },
        instructions: [
          `1. Transfer exactly ${transferDetails.amountFormatted} to the account above`,
          `2. Use reference: ${transferDetails.reference}`,
          '3. Payment will be confirmed within 5 minutes of transfer',
          '4. Do not close this page until payment is confirmed'
        ]
      }
    })
  } catch (error) {
    console.error('[SVM Transfer API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get Transfer Details for Order
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
    const orderId = searchParams.get('orderId')
    const reference = searchParams.get('reference')

    if (!orderId && !reference) {
      return NextResponse.json(
        { success: false, error: 'Order ID or reference required' },
        { status: 400 }
      )
    }

    // Build query
    const where: Record<string, unknown> = { tenantId }
    if (orderId) {
      where.id = orderId
    }
    if (reference) {
      where.paymentRef = reference
    }

    // Fetch order
    const order = await prisma.svm_orders.findFirst({
      where,
      select: {
        id: true,
        orderNumber: true,
        grandTotal: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentRef: true,
        paidAt: true,
        createdAt: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Validate reference format
    const hasValidRef = order.paymentRef && isValidTransferReference(order.paymentRef)

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentRef: order.paymentRef,
        isValidReference: hasValidRef,
        amount: Number(order.grandTotal),
        amountFormatted: formatNGN(Number(order.grandTotal)),
        isPaid: order.paymentStatus === 'CAPTURED',
        paidAt: order.paidAt,
        createdAt: order.createdAt
      }
    })
  } catch (error) {
    console.error('[SVM Transfer API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
