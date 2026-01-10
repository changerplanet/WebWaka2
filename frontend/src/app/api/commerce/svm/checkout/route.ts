/**
 * SVM Checkout API
 * 
 * POST /api/commerce/svm/checkout - Calculate checkout summary
 * POST /api/commerce/svm/checkout?action=validate - Validate checkout
 * POST /api/commerce/svm/checkout?action=finalize - Create order
 * 
 * @module api/commerce/svm/checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import {
  calculateCheckoutSummary,
  validateCheckout,
  finalizeCheckout,
  createCheckoutSession,
  getCheckoutShippingOptions,
  getCheckoutPaymentMethods,
  type CartItem,
  type ShippingAddress
} from '@/lib/svm'

// ============================================================================
// POST - Checkout Operations
// ============================================================================

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'summary'

    const {
      items,
      shippingAddress,
      shippingOption,
      paymentMethod,
      promotionCode,
      discountTotal,
      customerEmail,
      customerNotes,
      sessionId,
      cartId,
      customerId
    } = body as {
      items: CartItem[]
      shippingAddress?: ShippingAddress
      shippingOption?: { fee: number; rateName: string; rateId: string; zoneId: string; zoneName: string; carrier: string; estimatedDays: { min: number; max: number }; isLocalPickup: boolean }
      paymentMethod?: string
      promotionCode?: string
      discountTotal?: number
      customerEmail?: string
      customerNotes?: string
      sessionId?: string
      cartId?: string
      customerId?: string
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items required' },
        { status: 400 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'summary': {
        // Calculate checkout summary
        const summary = await calculateCheckoutSummary(tenantId, items, {
          shippingAddress,
          shippingOption: shippingOption as any,
          paymentMethod: paymentMethod as any,
          promotionCode,
          discountTotal
        })

        return NextResponse.json({
          success: true,
          data: summary
        })
      }

      case 'validate': {
        // Validate checkout data
        const validation = await validateCheckout(
          tenantId,
          items,
          shippingAddress,
          shippingOption as any,
          paymentMethod as any
        )

        return NextResponse.json({
          success: true,
          data: validation
        })
      }

      case 'finalize': {
        // Validate required fields for finalization
        if (!customerEmail) {
          return NextResponse.json(
            { success: false, error: 'Customer email required' },
            { status: 400 }
          )
        }

        if (!shippingAddress) {
          return NextResponse.json(
            { success: false, error: 'Shipping address required' },
            { status: 400 }
          )
        }

        if (!shippingOption) {
          return NextResponse.json(
            { success: false, error: 'Shipping method required' },
            { status: 400 }
          )
        }

        if (!paymentMethod) {
          return NextResponse.json(
            { success: false, error: 'Payment method required' },
            { status: 400 }
          )
        }

        // Create checkout session
        const session = await createCheckoutSession(
          tenantId,
          sessionId || `session_${Date.now()}`,
          items,
          { cartId, customerId, shippingAddress }
        )

        // Update session with selections
        session.shippingOption = shippingOption as any
        session.paymentMethod = paymentMethod as any
        session.summary = await calculateCheckoutSummary(tenantId, items, {
          shippingAddress,
          shippingOption: shippingOption as any,
          paymentMethod: paymentMethod as any,
          promotionCode,
          discountTotal
        })

        // Finalize checkout
        const result = await finalizeCheckout(session, customerEmail, customerNotes)

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            orderId: result.orderId,
            orderNumber: result.orderNumber,
            summary: session.summary
          }
        })
      }

      case 'options': {
        // Get shipping and payment options
        if (!shippingAddress?.state) {
          return NextResponse.json(
            { success: false, error: 'State required for options' },
            { status: 400 }
          )
        }

        const subtotal = items.reduce((sum: any, item: any) => sum + (item.unitPrice * item.quantity), 0)
        
        const [shippingOptions, paymentOptions] = await Promise.all([
          getCheckoutShippingOptions(tenantId, shippingAddress.state, subtotal),
          getCheckoutPaymentMethods(tenantId, subtotal, shippingAddress.state)
        ])

        return NextResponse.json({
          success: true,
          data: {
            shippingOptions,
            paymentOptions: paymentOptions.filter((p: any) => p.isAvailable)
          }
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[SVM Checkout API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
