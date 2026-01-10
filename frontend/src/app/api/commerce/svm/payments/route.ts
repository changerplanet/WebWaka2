/**
 * SVM Payments API
 * 
 * GET /api/commerce/svm/payments - Get available payment methods
 * POST /api/commerce/svm/payments - Check method availability
 * 
 * @module api/commerce/svm/payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { formatNGN } from '@/lib/currency'
import {
  getPaymentMethods,
  getAvailablePaymentMethods,
  checkPaymentMethodAvailability,
  isPODAvailable,
  calculatePODFee,
  getPODConfig,
  type PaymentMethodCode
} from '@/lib/svm'

// ============================================================================
// GET - Get Payment Methods
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
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        // Get all payment methods
        const methods = await getPaymentMethods(tenantId)
        
        return NextResponse.json({
          success: true,
          data: {
            methods: methods.map((m: any) => ({
              ...m,
              minAmountFormatted: m.minAmount ? formatNGN(m.minAmount) : null,
              maxAmountFormatted: m.maxAmount ? formatNGN(m.maxAmount) : null,
              additionalFeeFormatted: m.additionalFee > 0 
                ? (m.additionalFeeType === 'FIXED' ? formatNGN(m.additionalFee) : `${m.additionalFee}%`)
                : null
            })),
            count: methods.length,
            enabledCount: methods.filter((m: any) => m.isEnabled).length
          }
        })
      }

      case 'pod-config': {
        // Get POD configuration
        const config = await getPODConfig(tenantId)
        
        return NextResponse.json({
          success: true,
          data: {
            ...config,
            maxAmountFormatted: formatNGN(config.maxAmount),
            additionalFeeFormatted: formatNGN(config.additionalFee)
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
    console.error('[SVM Payments API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Check Payment Method Availability
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
    const {
      amount,
      state,
      method // Optional - check specific method
    } = body as {
      amount: number
      state?: string
      method?: PaymentMethodCode
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Check specific method or all methods
    if (method) {
      const availability = await checkPaymentMethodAvailability(
        tenantId,
        method,
        amount,
        state
      )

      // Add POD-specific info if checking POD
      let podInfo = null
      if (method === 'POD' && state) {
        const podAvailable = await isPODAvailable(tenantId, amount, state)
        const podFee = await calculatePODFee(tenantId, amount)
        podInfo = {
          ...podAvailable,
          fee: podFee,
          feeFormatted: formatNGN(podFee)
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          method: availability.method.code,
          methodName: availability.method.name,
          isAvailable: availability.isAvailable,
          reason: availability.unavailableReason,
          ...(podInfo && { podDetails: podInfo })
        }
      })
    } else {
      // Get all available methods
      const availabilities = await getAvailablePaymentMethods(tenantId, amount, state)

      // Group by availability
      const available = availabilities.filter((a: any) => a.isAvailable)
      const unavailable = availabilities.filter((a: any) => !a.isAvailable)

      return NextResponse.json({
        success: true,
        data: {
          available: available.map((a: any) => ({
            code: a.method.code,
            name: a.method.name,
            description: a.method.description,
            icon: a.method.icon,
            fee: a.method.additionalFee,
            feeFormatted: a.method.additionalFee > 0 
              ? (a.method.additionalFeeType === 'FIXED' 
                  ? formatNGN(a.method.additionalFee) 
                  : `${a.method.additionalFee}%`)
              : 'Free',
            instructions: a.method.instructions
          })),
          unavailable: unavailable.map((a: any) => ({
            code: a.method.code,
            name: a.method.name,
            reason: a.unavailableReason
          })),
          summary: {
            totalMethods: availabilities.length,
            availableCount: available.length,
            unavailableCount: unavailable.length
          }
        }
      })
    }
  } catch (error) {
    console.error('[SVM Payments API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
