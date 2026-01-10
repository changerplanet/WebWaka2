/**
 * PAYMENTS & COLLECTIONS SUITE
 * Payment Methods API
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/payments/methods - Get available payment methods
 * POST /api/commerce/payments/methods/check - Check method availability
 * 
 * @module api/commerce/payments/methods
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { 
  PaymentMethodAvailabilityService, 
  PaymentMethodCode 
} from '@/lib/payments'

/**
 * GET /api/commerce/payments/methods
 * Get all payment methods with availability for a transaction amount
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
    
    const amount = searchParams.get('amount')
    const state = searchParams.get('state')
    const walletBalance = searchParams.get('walletBalance')

    // If amount provided, get availability
    if (amount) {
      const methods = await PaymentMethodAvailabilityService.getAvailableMethods(
        tenantId,
        parseFloat(amount),
        {
          state: state || undefined,
          walletBalance: walletBalance ? parseFloat(walletBalance) : undefined
        }
      )

      return NextResponse.json({
        methods: methods.map((m: any) => ({
          code: m.method.code,
          name: m.method.name,
          description: m.method.description,
          icon: m.method.icon,
          isAvailable: m.isAvailable,
          unavailableReason: m.unavailableReason,
          additionalFee: m.method.additionalFee,
          additionalFeeType: m.method.additionalFeeType,
          requiresVerification: m.method.requiresVerification,
          instructions: m.method.instructions,
          priority: m.method.nigeriaFirstPriority
        })),
        transactionAmount: parseFloat(amount),
        currency: 'NGN'
      })
    }

    // Otherwise, return all methods
    const methods = await PaymentMethodAvailabilityService.getPaymentMethods(tenantId)

    return NextResponse.json({
      methods: methods.map((m: any) => ({
        code: m.code,
        name: m.name,
        description: m.description,
        icon: m.icon,
        isEnabled: m.isEnabled,
        minAmount: m.minAmount,
        maxAmount: m.maxAmount,
        additionalFee: m.additionalFee,
        additionalFeeType: m.additionalFeeType,
        requiresVerification: m.requiresVerification,
        instructions: m.instructions,
        priority: m.nigeriaFirstPriority
      }))
    })
  } catch (error) {
    console.error('[Payment Methods API] List error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/payments/methods
 * Check specific method availability and calculate total with fee
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

    const { 
      method, 
      amount, 
      state, 
      walletBalance,
      subtotal,
      shippingTotal,
      taxTotal,
      discountTotal
    } = body

    if (!method || !amount) {
      return NextResponse.json(
        { error: 'method and amount are required' },
        { status: 400 }
      )
    }

    // Check availability
    const availability = await PaymentMethodAvailabilityService.checkAvailability(
      tenantId,
      method as PaymentMethodCode,
      amount,
      { state, walletBalance }
    )

    // Calculate total with fee if subtotal provided
    let totalCalculation = null
    if (subtotal !== undefined) {
      totalCalculation = await PaymentMethodAvailabilityService.calculateTotalWithFee(
        tenantId,
        method as PaymentMethodCode,
        subtotal,
        shippingTotal || 0,
        taxTotal || 0,
        discountTotal || 0
      )
    }

    return NextResponse.json({
      method: {
        code: availability.method.code,
        name: availability.method.name,
        isAvailable: availability.isAvailable,
        unavailableReason: availability.unavailableReason,
        additionalFee: availability.method.additionalFee,
        additionalFeeType: availability.method.additionalFeeType
      },
      ...(totalCalculation && { total: totalCalculation })
    })
  } catch (error) {
    console.error('[Payment Methods API] Check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
