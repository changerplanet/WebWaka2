/**
 * Paystack Webhook Handler
 * 
 * Wave K.3: Handles Paystack payment notifications
 * Wave C3: Security hardened - signature verification always enforced
 * 
 * Verifies signature and processes payment events
 * Idempotent: duplicate events are safely ignored
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WebhookProcessor, WebhookPayload } from '@/lib/payment-execution/webhook-processor'

const DEMO_WEBHOOK_SECRET = 'demo_webhook_secret_for_signature_verification'

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

    const { secretKey, isDemo } = await getPaystackSecretKey(payload)
    
    const isValid = WebhookProcessor.verifyPaystackSignature(rawBody, signature, secretKey)
    
    if (!isValid) {
      console.error('[Paystack Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log(`[Paystack Webhook] Processing event: ${payload.event}, reference: ${payload.data.reference}${isDemo ? ' (demo mode)' : ''}`)

    const result = await WebhookProcessor.processPaymentWebhook(payload, isDemo)

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

async function getPaystackSecretKey(payload: WebhookPayload): Promise<{ secretKey: string; isDemo: boolean }> {
  const reference = payload.data.reference
  
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      OR: [
        { reference },
        { providerReference: reference }
      ]
    },
    select: { partnerId: true, isDemo: true }
  })

  if (!transaction) {
    return { secretKey: DEMO_WEBHOOK_SECRET, isDemo: true }
  }

  const config = await prisma.partnerPaymentConfig.findFirst({
    where: { 
      partnerId: transaction.partnerId,
      provider: 'paystack'
    },
    select: { webhookSecret: true }
  })

  if (config?.webhookSecret) {
    return { secretKey: config.webhookSecret, isDemo: transaction.isDemo }
  }

  return { secretKey: DEMO_WEBHOOK_SECRET, isDemo: true }
}
