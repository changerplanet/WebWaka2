/**
 * PAYMENTS & COLLECTIONS SUITE
 * Partial Payment API
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/payments/partial - Get partial payment summary
 * POST /api/commerce/payments/partial - Record partial payment
 * 
 * @module api/commerce/payments/partial
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { PartialPaymentService } from '@/lib/payments'
import { PayPaymentMethod } from '@prisma/client'

/**
 * GET /api/commerce/payments/partial
 * Get partial payment summary for an order or list all partial chains
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

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    
    const orderId = searchParams.get('orderId')
    const action = searchParams.get('action')

    // Check if partial payments are enabled
    if (action === 'status') {
      const isEnabled = await PartialPaymentService.isEnabled(tenantId)
      return NextResponse.json({ enabled: isEnabled })
    }

    // Get summary for specific order
    if (orderId) {
      const summary = await PartialPaymentService.getPaymentSummary(tenantId, orderId)
      
      if (!summary) {
        return NextResponse.json({ 
          orderId,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          paymentCount: 0,
          payments: [],
          isFullyPaid: false
        })
      }

      // Calculate minimum next payment
      const minimumNextPayment = PartialPaymentService.calculateMinimumPartialPayment(
        summary.remainingAmount
      )

      return NextResponse.json({
        ...summary,
        minimumNextPayment
      })
    }

    // List all partial payment chains
    if (action === 'chains') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const onlyIncomplete = searchParams.get('incomplete') === 'true'

      const result = await PartialPaymentService.getPartialPaymentChains(tenantId, {
        page,
        limit,
        onlyIncomplete
      })

      return NextResponse.json({
        chains: result.chains,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      })
    }

    return NextResponse.json({ 
      error: 'Provide orderId or action (status, chains)' 
    }, { status: 400 })
  } catch (error) {
    console.error('[Partial Payment API] Get error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/payments/partial
 * Record a partial payment for an order
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

    const { orderId, orderNumber, amount, paymentMethod, gatewayReference } = body

    if (!orderId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'orderId, amount, and paymentMethod are required' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods: PayPaymentMethod[] = [
      'CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 
      'WALLET', 'POS_TERMINAL', 'USSD', 'PAY_ON_DELIVERY'
    ]
    
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Valid options: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // Check minimum amount
    const existingSummary = await PartialPaymentService.getPaymentSummary(tenantId, orderId)
    if (existingSummary && existingSummary.remainingAmount > 0) {
      const minimum = PartialPaymentService.calculateMinimumPartialPayment(
        existingSummary.remainingAmount
      )
      if (amount < minimum) {
        return NextResponse.json(
          { error: `Minimum partial payment is ₦${minimum.toLocaleString()}` },
          { status: 400 }
        )
      }
    }

    const result = await PartialPaymentService.recordPartialPayment(tenantId, {
      orderId,
      orderNumber,
      amount,
      paymentMethod,
      gatewayReference,
      processedBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      payment: result.payment,
      summary: result.summary
    })
  } catch (error) {
    console.error('[Partial Payment API] Record error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
