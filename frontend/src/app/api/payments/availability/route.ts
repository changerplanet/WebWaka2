/**
 * Payment Availability Check API
 * 
 * Phase E1.2: Check if payments are available for a partner
 * 
 * GET /api/payments/availability?partnerId=xxx
 * 
 * Returns whether payments are available and which provider is configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentExecutionService } from '@/lib/payment-execution'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const partnerId = searchParams.get('partnerId')
    
    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'partnerId is required' },
        { status: 400 }
      )
    }
    
    const result = await PaymentExecutionService.isAvailable(partnerId)
    
    return NextResponse.json({
      success: true,
      available: result.available,
      provider: result.provider,
      reason: result.reason
    })
    
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check payment availability' },
      { status: 500 }
    )
  }
}
