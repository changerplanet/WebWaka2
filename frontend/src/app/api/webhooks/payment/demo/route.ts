/**
 * Demo Payment Webhook Handler
 * 
 * Wave K.3: Simulates payment completion for demo/test mode
 * 
 * Used when payment provider is not configured
 * Allows testing the full checkout flow without real payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { WebhookProcessor } from '@/lib/payment-execution/webhook-processor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, success = true } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing reference' },
        { status: 400 }
      )
    }

    console.log(`[Demo Webhook] Processing reference: ${reference}, success: ${success}`)

    const result = await WebhookProcessor.simulateDemoPayment(reference, success)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      transactionId: result.transactionId,
      orderId: result.orderId,
      alreadyProcessed: result.alreadyProcessed
    })

  } catch (error) {
    console.error('[Demo Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
