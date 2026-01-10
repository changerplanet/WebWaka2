/**
 * PAYMENTS & COLLECTIONS SUITE
 * Payment Status API
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/payments/status - Resolve payment status
 * 
 * @module api/commerce/payments/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { 
  PaymentStatusResolver, 
  PaymentService,
  formatPaymentStatusForCustomer,
  getStatusBadgeClass
} from '@/lib/payments'
import { PayPaymentStatus } from '@prisma/client'

/**
 * GET /api/commerce/payments/status
 * Resolve and display payment status
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
    
    const transactionNumber = searchParams.get('transactionNumber')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status') as PayPaymentStatus | null

    // Get display for a specific status
    if (status) {
      const display = PaymentStatusResolver.getPaymentStatusDisplay(status)
      return NextResponse.json({
        status,
        display: {
          ...display,
          customerText: formatPaymentStatusForCustomer(status),
          badgeClass: getStatusBadgeClass(status)
        },
        canRefund: PaymentStatusResolver.canRefund(status),
        canRetry: PaymentStatusResolver.canRetry(status),
        isTerminal: PaymentStatusResolver.isTerminal(status)
      })
    }

    // Get payment by transaction number
    if (transactionNumber) {
      const payment = await PaymentService.getPayment(tenantId, transactionNumber)
      
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      const display = PaymentStatusResolver.getPaymentStatusDisplay(payment.status)

      return NextResponse.json({
        payment: {
          id: payment.id,
          transactionNumber: payment.transactionNumber,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          confirmedAt: payment.confirmedAt
        },
        display: {
          ...display,
          customerText: formatPaymentStatusForCustomer(payment.status),
          badgeClass: getStatusBadgeClass(payment.status)
        },
        canRefund: PaymentStatusResolver.canRefund(payment.status),
        canRetry: PaymentStatusResolver.canRetry(payment.status),
        isTerminal: PaymentStatusResolver.isTerminal(payment.status)
      })
    }

    // Get order payment status (aggregated from multiple payments)
    if (orderId) {
      const { payments, total } = await PaymentService.listPayments(tenantId, { orderId })
      
      // Need to get order total from somewhere - using sum of confirmed payments as fallback
      const confirmedPayments = payments.filter((p: any) => p.status === 'CONFIRMED')
      const orderTotal = confirmedPayments.reduce((sum: any, p: any) => sum + p.amount, 0) || 
        payments[0]?.amount || 0

      const orderStatus = PaymentStatusResolver.resolveOrderPaymentStatus(
        payments.map((p: any) => ({ status: p.status, amount: p.amount })),
        orderTotal
      )

      return NextResponse.json({
        orderId,
        orderStatus,
        payments: payments.map((p: any) => ({
          id: p.id,
          transactionNumber: p.transactionNumber,
          amount: p.amount,
          status: p.status,
          paymentMethod: p.paymentMethod,
          confirmedAt: p.confirmedAt
        })),
        total
      })
    }

    return NextResponse.json({ 
      error: 'Provide transactionNumber, orderId, or status' 
    }, { status: 400 })
  } catch (error) {
    console.error('[Payment Status API] Get error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
