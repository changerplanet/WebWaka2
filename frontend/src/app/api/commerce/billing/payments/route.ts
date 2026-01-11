export const dynamic = 'force-dynamic'

/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Invoice Payments API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/payments - List payments (by invoice)
 * POST /api/commerce/billing/payments - Record a payment
 * 
 * @module api/commerce/billing/payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { InvoicePaymentService } from '@/lib/billing'

/**
 * GET /api/commerce/billing/payments
 * Get payments for an invoice
 * 
 * Query params:
 * - invoiceId: string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId query parameter is required' },
        { status: 400 }
      )
    }

    const payments = await InvoicePaymentService.getInvoicePayments(
      tenantId,
      invoiceId
    )

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[Billing API] List payments error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing/payments
 * Record a payment against an invoice
 * 
 * Body:
 * - invoiceId: string (required)
 * - amount: number (required)
 * - paymentMethod: string (required) - BANK_TRANSFER, CARD, CASH, MOBILE_MONEY, USSD, etc.
 * - paymentReference?: string
 * - transactionId?: string - Link to Payments suite transaction
 * - notes?: string
 * - paidAt?: ISO date string
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Validate required fields
    if (!body.invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId is required' },
        { status: 400 }
      )
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!body.paymentMethod) {
      return NextResponse.json(
        { error: 'paymentMethod is required' },
        { status: 400 }
      )
    }

    const result = await InvoicePaymentService.recordPayment(
      tenantId,
      {
        invoiceId: body.invoiceId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
        transactionId: body.transactionId,
        notes: body.notes,
        paidAt: body.paidAt ? new Date(body.paidAt) : undefined
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      payment: result.payment,
      invoice: result.invoice
    }, { status: 201 })
  } catch (error) {
    console.error('[Billing API] Record payment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
