/**
 * Payment Verification API
 * 
 * Phase E1.2: Verify a payment transaction
 * 
 * POST /api/payments/verify
 * 
 * Required fields:
 * - tenantId: string
 * - partnerId: string
 * - reference: string
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentExecutionService } from '@/lib/payment-execution'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { tenantId, partnerId, reference } = body
    
    if (!tenantId || !partnerId || !reference) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: tenantId, partnerId, reference' 
        },
        { status: 400 }
      )
    }
    
    const result = await PaymentExecutionService.verifyPayment({
      tenantId,
      partnerId,
      reference
    })
    
    return NextResponse.json({
      success: result.success,
      transactionId: result.transactionId,
      reference: result.reference,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      fee: result.fee,
      netAmount: result.netAmount,
      channel: result.channel,
      paidAt: result.paidAt,
      provider: result.provider,
      isDemo: result.isDemo,
      error: result.error
    })
    
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
