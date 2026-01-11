export const dynamic = 'force-dynamic'

/**
 * MODULE 10: PAYMENTS & WALLETS
 * Main API Route
 * 
 * 🚨 CRITICAL: This is THE ONLY module that mutates money.
 * All other modules REQUEST payment actions via this API.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { PayConfigService } from '@/lib/payments/config-service'
import { WalletService } from '@/lib/payments/wallet-service'
import { PaymentService } from '@/lib/payments/payment-service'
import { RefundService } from '@/lib/payments/refund-service'
import { PayEntitlementsService, PayValidationService } from '@/lib/payments/entitlements-service'

/**
 * GET /api/payments
 * Get payment status, wallets, transactions, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Status
    if (action === 'status' || !action) {
      const status = await PayConfigService.getStatus(tenantId)
      return NextResponse.json(status)
    }

    // List wallets
    if (action === 'wallets') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const result = await WalletService.listWallets(tenantId, { page, limit })
      return NextResponse.json(result)
    }

    // Get single wallet
    if (action === 'wallet') {
      const walletId = searchParams.get('walletId')
      if (!walletId) {
        return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 })
      }
      const wallet = await WalletService.getWallet(tenantId, walletId)
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
      }
      return NextResponse.json({ wallet })
    }

    // Wallet transactions
    if (action === 'wallet-transactions') {
      const walletId = searchParams.get('walletId')
      if (!walletId) {
        return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 })
      }
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const result = await WalletService.getTransactionHistory(tenantId, walletId, { page, limit })
      return NextResponse.json(result)
    }

    // List payments
    if (action === 'payments') {
      const orderId = searchParams.get('orderId') || undefined
      const customerId = searchParams.get('customerId') || undefined
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const result = await PaymentService.listPayments(tenantId, { orderId, customerId, page, limit })
      return NextResponse.json(result)
    }

    // Get single payment
    if (action === 'payment') {
      const transactionNumber = searchParams.get('transactionNumber')
      if (!transactionNumber) {
        return NextResponse.json({ error: 'Transaction number required' }, { status: 400 })
      }
      const payment = await PaymentService.getPayment(tenantId, transactionNumber)
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      return NextResponse.json({ payment })
    }

    // Payment statistics
    if (action === 'payment-statistics') {
      const days = parseInt(searchParams.get('days') || '30')
      const stats = await PaymentService.getStatistics(tenantId, days)
      return NextResponse.json({ statistics: stats })
    }

    // List refunds
    if (action === 'refunds') {
      const paymentId = searchParams.get('paymentId') || undefined
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const result = await RefundService.listRefunds(tenantId, { paymentId, page, limit })
      return NextResponse.json(result)
    }

    // Refund statistics
    if (action === 'refund-statistics') {
      const stats = await RefundService.getStatistics(tenantId)
      return NextResponse.json({ statistics: stats })
    }

    // Entitlements
    if (action === 'entitlements') {
      const entitlements = await PayEntitlementsService.getEntitlements(tenantId)
      return NextResponse.json(entitlements)
    }

    // Validation
    if (action === 'validate') {
      const result = await PayValidationService.validateModule(tenantId)
      return NextResponse.json(result)
    }

    // Manifest
    if (action === 'manifest') {
      const manifest = PayValidationService.getManifest()
      return NextResponse.json(manifest)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/payments
 * Initialize, create intents, confirm payments, request refunds
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Initialize
    if (body.action === 'initialize') {
      const config = await PayConfigService.initialize(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Create wallet (for vendors, customers)
    if (body.action === 'create-wallet') {
      const wallet = await WalletService.getOrCreateWallet(
        tenantId,
        body.ownerType,
        body.ownerId,
        body.currency || 'NGN',
        body.name
      )
      return NextResponse.json({ success: true, wallet })
    }

    // Create payment intent
    if (body.action === 'create-intent') {
      // Check entitlement
      const canProcess = await PayEntitlementsService.canProcessPayment(tenantId, body.amount)
      if (!canProcess.allowed) {
        return NextResponse.json({ error: canProcess.reason }, { status: 403 })
      }

      const intent = await PaymentService.createIntent(tenantId, body)
      return NextResponse.json({ success: true, intent })
    }

    // Confirm payment
    if (body.action === 'confirm-payment') {
      const payment = await PaymentService.confirmPayment(tenantId, body.intentId, {
        paymentMethod: body.paymentMethod,
        methodDetails: body.methodDetails,
        gatewayReference: body.gatewayReference,
        gatewayResponse: body.gatewayResponse,
        processedBy: session.user.id,
        idempotencyKey: body.idempotencyKey,
      })
      return NextResponse.json({ success: true, payment })
    }

    // Cancel payment intent
    if (body.action === 'cancel-intent') {
      const intent = await PaymentService.cancelIntent(tenantId, body.intentId)
      return NextResponse.json({ success: true, intent })
    }

    // Record cash payment (shortcut)
    if (body.action === 'record-cash') {
      const payment = await PaymentService.recordCashPayment(tenantId, {
        amount: body.amount,
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        customerId: body.customerId,
        receivedBy: session.user.id,
        notes: body.notes,
      })
      return NextResponse.json({ success: true, payment })
    }

    // Request refund
    if (body.action === 'request-refund') {
      // Check entitlement
      const entitlements = await PayEntitlementsService.getEntitlements(tenantId)
      if (!entitlements.refundsEnabled.allowed) {
        return NextResponse.json({ error: 'Refunds not enabled for your plan' }, { status: 403 })
      }

      const refund = await RefundService.requestRefund(tenantId, body.refund, session.user.id)
      return NextResponse.json({ success: true, refund })
    }

    // Approve refund
    if (body.action === 'approve-refund') {
      const refund = await RefundService.approveRefund(tenantId, body.refundId, session.user.id)
      return NextResponse.json({ success: true, refund })
    }

    // Process refund
    if (body.action === 'process-refund') {
      const refund = await RefundService.processRefund(tenantId, body.refundId)
      return NextResponse.json({ success: true, refund })
    }

    // Reject refund
    if (body.action === 'reject-refund') {
      const refund = await RefundService.rejectRefund(tenantId, body.refundId, body.reason)
      return NextResponse.json({ success: true, refund })
    }

    // Manual wallet credit (admin only)
    if (body.action === 'wallet-credit') {
      const transaction = await WalletService.credit(tenantId, body.walletId, body.amount, {
        type: 'ADJUSTMENT',
        description: body.description,
        performedBy: session.user.id,
      })
      return NextResponse.json({ success: true, transaction })
    }

    // Manual wallet debit (admin only)
    if (body.action === 'wallet-debit') {
      const transaction = await WalletService.debit(tenantId, body.walletId, body.amount, {
        type: 'ADJUSTMENT',
        description: body.description,
        performedBy: session.user.id,
      })
      return NextResponse.json({ success: true, transaction })
    }

    // Suspend wallet
    if (body.action === 'suspend-wallet') {
      const wallet = await WalletService.suspendWallet(tenantId, body.walletId, body.reason)
      return NextResponse.json({ success: true, wallet })
    }

    // Reactivate wallet
    if (body.action === 'reactivate-wallet') {
      const wallet = await WalletService.reactivateWallet(tenantId, body.walletId)
      return NextResponse.json({ success: true, wallet })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/payments
 * Update configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Update config
    if (body.action === 'update-config') {
      const config = await PayConfigService.updateConfig(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payments PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
