export const dynamic = 'force-dynamic'

/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Single Payment API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/payments/[id] - Get payment by ID
 * POST /api/commerce/billing/payments/[id] - Payment actions (reverse, link)
 * 
 * @module api/commerce/billing/payments/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { InvoicePaymentService } from '@/lib/billing'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/commerce/billing/payments/[id]
 * Get payment by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const { id } = await params
    const tenantId = session.activeTenantId

    const payment = await InvoicePaymentService.getPayment(tenantId, id)

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('[Billing API] Get payment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing/payments/[id]
 * Perform actions on payment
 * 
 * Body:
 * - action: 'reverse' | 'link'
 * - reason?: string (required for reverse)
 * - transactionId?: string (required for link)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const { id } = await params
    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'action is required (reverse, link)' },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'reverse':
        if (!body.reason) {
          return NextResponse.json(
            { error: 'reason is required for reverse action' },
            { status: 400 }
          )
        }
        const reverseResult = await InvoicePaymentService.reversePayment(
          tenantId,
          id,
          body.reason,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          message: 'Payment reversed',
          payment: reverseResult.payment,
          invoice: reverseResult.invoice
        })

      case 'link':
        if (!body.transactionId) {
          return NextResponse.json(
            { error: 'transactionId is required for link action' },
            { status: 400 }
          )
        }
        const payment = await InvoicePaymentService.linkToTransaction(
          tenantId,
          id,
          body.transactionId
        )
        return NextResponse.json({
          success: true,
          message: 'Payment linked to transaction',
          payment
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}. Valid actions: reverse, link` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Billing API] Payment action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
