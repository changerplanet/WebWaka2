/**
 * Demo Payment Completion API
 * 
 * Phase E1.2: Complete a demo payment (for testing)
 * 
 * POST /api/payments/demo/complete
 * 
 * Required fields:
 * - reference: string
 * 
 * Optional fields:
 * - success: boolean (default: true)
 * 
 * This endpoint allows testing the payment flow without real payments.
 * Only works for transactions marked as demo (isDemo: true).
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentExecutionService } from '@/lib/payment-execution'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { reference, success = true } = body
    
    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'reference is required' },
        { status: 400 }
      )
    }
    
    const result = await PaymentExecutionService.completeDemoPayment(reference, success)
    
    if (!result.success && result.error === 'Transaction not found') {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    if (!result.success && result.error === 'This is not a demo transaction') {
      return NextResponse.json(
        { success: false, error: 'This endpoint only works for demo transactions' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: result.success,
      transactionId: result.transactionId,
      reference: result.reference,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      paidAt: result.paidAt,
      isDemo: result.isDemo
    })
    
  } catch (error) {
    console.error('Demo completion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete demo payment' },
      { status: 500 }
    )
  }
}
