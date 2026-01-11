export const dynamic = 'force-dynamic'

/**
 * PAYMENTS & COLLECTIONS SUITE
 * Bank Transfer API
 * 
 * S4 - API Exposure & Guarding
 * 
 * POST /api/commerce/payments/transfer - Initiate bank transfer
 * GET /api/commerce/payments/transfer - Get transfer details
 * PUT /api/commerce/payments/transfer - Validate transfer
 * 
 * @module api/commerce/payments/transfer
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { BankTransferService, PaymentService } from '@/lib/payments'

/**
 * GET /api/commerce/payments/transfer
 * Get bank transfer details or Nigerian banks list
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
    if (guardResult) return guardResult

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get Nigerian banks list
    if (action === 'banks') {
      const banks = BankTransferService.getNigerianBanks()
      return NextResponse.json({ banks })
    }

    // Get transfer reference validation
    if (action === 'validate-reference') {
      const reference = searchParams.get('reference')
      if (!reference) {
        return NextResponse.json({ error: 'reference is required' }, { status: 400 })
      }
      const isValid = BankTransferService.isValidReferenceFormat(reference)
      return NextResponse.json({ reference, isValid })
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use: banks, validate-reference' 
    }, { status: 400 })
  } catch (error) {
    console.error('[Bank Transfer API] Get error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/payments/transfer
 * Initiate a bank transfer payment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    const { orderId, orderNumber, amount, expiryHours } = body

    if (!amount) {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 })
    }

    // Create payment intent
    const intent = await PaymentService.createIntent(tenantId, {
      amount,
      orderId,
      orderNumber,
      paymentMethod: 'BANK_TRANSFER',
      expiresInMinutes: (expiryHours || 24) * 60,
      idempotencyKey: orderId ? `transfer_${orderId}` : undefined
    })

    // Generate transfer details
    const transferDetails = await BankTransferService.createTransferDetails(
      tenantId,
      {
        orderId,
        orderNumber,
        amount,
        expiryHours
      }
    )

    return NextResponse.json({
      success: true,
      intent: {
        id: intent.id,
        intentId: intent.intentId,
        status: intent.status,
        expiresAt: intent.expiresAt
      },
      transfer: transferDetails
    })
  } catch (error) {
    console.error('[Bank Transfer API] Initiate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/commerce/payments/transfer
 * Validate a bank transfer (confirm payment received)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    const { intentId, reference, receivedAmount, expectedAmount } = body

    if (!intentId || !reference) {
      return NextResponse.json(
        { error: 'intentId and reference are required' },
        { status: 400 }
      )
    }

    // Validate the transfer
    const validation = await BankTransferService.validateTransfer(
      tenantId,
      reference,
      receivedAmount || expectedAmount,
      expectedAmount
    )

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        validation
      }, { status: 400 })
    }

    // If valid, confirm the payment
    const payment = await PaymentService.confirmPayment(tenantId, intentId, {
      paymentMethod: 'BANK_TRANSFER',
      gatewayReference: reference,
      methodDetails: {
        receivedAmount,
        expectedAmount,
        isPartialPayment: validation.isPartialPayment,
        remainingAmount: validation.remainingAmount
      },
      processedBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        transactionNumber: payment.transactionNumber,
        amount: payment.amount,
        status: payment.status,
        confirmedAt: payment.confirmedAt
      },
      validation
    })
  } catch (error) {
    console.error('[Bank Transfer API] Validate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
