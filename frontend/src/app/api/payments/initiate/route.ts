/**
 * Payment Initiation API
 * 
 * Phase E1.2: Start a new payment transaction
 * 
 * POST /api/payments/initiate
 * 
 * Required fields:
 * - tenantId: string
 * - partnerId: string
 * - amount: number
 * - currency: string
 * - customerEmail: string
 * 
 * Optional fields:
 * - customerName: string
 * - customerId: string
 * - sourceModule: string (e.g., 'svm', 'pos', 'forms')
 * - sourceType: string (e.g., 'order', 'invoice')
 * - sourceId: string
 * - callbackUrl: string
 * - metadata: object
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentExecutionService } from '@/lib/payment-execution'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      tenantId, 
      partnerId, 
      amount, 
      currency, 
      customerEmail,
      customerName,
      customerId,
      sourceModule,
      sourceType,
      sourceId,
      callbackUrl,
      metadata
    } = body
    
    if (!tenantId || !partnerId || !amount || !currency || !customerEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: tenantId, partnerId, amount, currency, customerEmail' 
        },
        { status: 400 }
      )
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }
    
    const result = await PaymentExecutionService.initiatePayment({
      tenantId,
      partnerId,
      amount,
      currency,
      customerEmail,
      customerName,
      customerId,
      sourceModule,
      sourceType,
      sourceId,
      callbackUrl,
      metadata
    })
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          errorCode: result.errorCode
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      reference: result.reference,
      status: result.status,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      provider: result.provider,
      isDemo: result.isDemo
    })
    
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
