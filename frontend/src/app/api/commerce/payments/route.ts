/**
 * PAYMENTS & COLLECTIONS SUITE
 * Main API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/payments - Get payment configuration status
 * POST /api/commerce/payments - Initialize payment configuration
 * 
 * @module api/commerce/payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/commerce/payments
 * Get payment configuration and status for tenant
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

    // Get payment configuration
    const config = await prisma.pay_configurations.findUnique({
      where: { tenantId }
    })

    if (!config) {
      return NextResponse.json({
        initialized: false,
        message: 'Payment configuration not initialized. Call POST to initialize.'
      })
    }

    return NextResponse.json({
      initialized: true,
      config: {
        paymentsEnabled: config.paymentsEnabled,
        walletsEnabled: config.walletsEnabled,
        refundsEnabled: config.refundsEnabled,
        defaultCurrency: config.defaultCurrency,
        supportedCurrencies: config.supportedCurrencies,
        // Payment methods
        cashEnabled: config.cashEnabled,
        cardEnabled: config.cardEnabled,
        bankTransferEnabled: config.bankTransferEnabled,
        mobileMoneyEnabled: config.mobileMoneyEnabled,
        ussdEnabled: config.ussdEnabled,
        podEnabled: config.podEnabled,
        // POD settings
        podMaxAmount: config.podMaxAmount?.toNumber(),
        podFee: config.podFee?.toNumber(),
        podExcludedStates: config.podExcludedStates,
        // Partial payments
        partialPaymentsEnabled: config.partialPaymentsEnabled,
        // Gateway settings (masked)
        paystackEnabled: config.paystackEnabled,
        flutterwaveEnabled: config.flutterwaveEnabled,
        // Platform settings
        platformCommission: config.platformCommission?.toNumber(),
        updatedAt: config.updatedAt
      }
    })
  } catch (error) {
    console.error('[Payments API] Get config error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/payments
 * Initialize or update payment configuration
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

    // Upsert configuration
    const config = await prisma.pay_configurations.upsert({
      where: { tenantId },
      create: {
        id: `pay_config_${tenantId}`,
        tenantId,
        paymentsEnabled: body.paymentsEnabled ?? true,
        walletsEnabled: body.walletsEnabled ?? true,
        refundsEnabled: body.refundsEnabled ?? true,
        defaultCurrency: body.defaultCurrency ?? 'NGN',
        supportedCurrencies: body.supportedCurrencies ?? ['NGN'],
        cashEnabled: body.cashEnabled ?? true,
        cardEnabled: body.cardEnabled ?? false,
        bankTransferEnabled: body.bankTransferEnabled ?? true,
        mobileMoneyEnabled: body.mobileMoneyEnabled ?? false,
        ussdEnabled: body.ussdEnabled ?? false,
        podEnabled: body.podEnabled ?? true,
        podMaxAmount: body.podMaxAmount ?? 500000,
        podFee: body.podFee ?? 500,
        podExcludedStates: body.podExcludedStates ?? ['Borno', 'Yobe', 'Adamawa'],
        partialPaymentsEnabled: body.partialPaymentsEnabled ?? false,
        paystackEnabled: body.paystackEnabled ?? false,
        flutterwaveEnabled: body.flutterwaveEnabled ?? false,
        platformCommission: body.platformCommission ?? 0,
        offlineCashEnabled: body.offlineCashEnabled ?? true,
        updatedAt: new Date()
      },
      update: {
        paymentsEnabled: body.paymentsEnabled,
        walletsEnabled: body.walletsEnabled,
        refundsEnabled: body.refundsEnabled,
        cashEnabled: body.cashEnabled,
        cardEnabled: body.cardEnabled,
        bankTransferEnabled: body.bankTransferEnabled,
        mobileMoneyEnabled: body.mobileMoneyEnabled,
        ussdEnabled: body.ussdEnabled,
        podEnabled: body.podEnabled,
        podMaxAmount: body.podMaxAmount,
        podFee: body.podFee,
        podExcludedStates: body.podExcludedStates,
        partialPaymentsEnabled: body.partialPaymentsEnabled,
        platformCommission: body.platformCommission,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment configuration updated',
      configId: config.id
    })
  } catch (error) {
    console.error('[Payments API] Update config error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
