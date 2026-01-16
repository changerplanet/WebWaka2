/**
 * Paystack Webhook Handler
 * 
 * Wave K.3: Handles Paystack payment notifications
 * 
 * Verifies signature and processes payment events
 * Idempotent: duplicate events are safely ignored
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WebhookProcessor, WebhookPayload } from '@/lib/payment-execution/webhook-processor'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature')
    const rawBody = await request.text()

    if (!signature) {
      console.error('[Paystack Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[Paystack Webhook] Invalid JSON payload')
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const secretKey = await getPaystackSecretKey(payload)
    
    if (secretKey) {
      const isValid = WebhookProcessor.verifyPaystackSignature(rawBody, signature, secretKey)
      
      if (!isValid) {
        console.error('[Paystack Webhook] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn('[Paystack Webhook] No secret key found - skipping signature verification in demo mode')
    }

    console.log(`[Paystack Webhook] Processing event: ${payload.event}, reference: ${payload.data.reference}`)

    const result = await WebhookProcessor.processPaymentWebhook(payload, false)

    if (!result.success) {
      console.error(`[Paystack Webhook] Processing failed: ${result.message}`)
      return NextResponse.json(
        { received: true, message: result.message },
        { status: 200 }
      )
    }

    console.log(`[Paystack Webhook] Processed successfully: ${result.message}`)

    return NextResponse.json({
      received: true,
      message: result.message,
      transactionId: result.transactionId,
      alreadyProcessed: result.alreadyProcessed
    })

  } catch (error) {
    console.error('[Paystack Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getPaystackSecretKey(payload: WebhookPayload): Promise<string | null> {
  const reference = payload.data.reference
  
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      OR: [
        { reference },
        { providerReference: reference }
      ]
    },
    select: { partnerId: true }
  })

  if (!transaction) {
    return null
  }

  const config = await prisma.partnerPaymentConfig.findFirst({
    where: { 
      partnerId: transaction.partnerId,
      provider: 'paystack'
    },
    select: { webhookSecret: true }
  })

  return config?.webhookSecret || null
}
