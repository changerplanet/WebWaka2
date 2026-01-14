/**
 * Partner: Payment Configuration API
 * 
 * Phase E1.1: Partner credential configuration (stub)
 * 
 * GET - Get current payment configuration status
 * POST - Configure payment credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentAdminService } from '@/lib/payment-providers/admin-service'
import { PaymentCapabilityService } from '@/lib/payment-providers/capability-service'
import { requirePartnerUser } from '@/lib/partner-authorization'

export async function GET() {
  try {
    const authResult = await requirePartnerUser()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const partnerId = authResult.partner.id

    const [status, displayStatus, maskedCredentials] = await Promise.all([
      PaymentAdminService.getPartnerPaymentStatus(partnerId),
      PaymentCapabilityService.getDisplayStatus(partnerId),
      PaymentAdminService.getMaskedCredentials(partnerId, 'paystack')
    ])

    return NextResponse.json({
      status,
      displayStatus,
      credentials: maskedCredentials
    })
  } catch (error) {
    console.error('Failed to get payment config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePartnerUser()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const partnerId = authResult.partner.id
    const body = await request.json()
    const { publicKey, secretKey, webhookSecret, testMode } = body

    if (!publicKey || !secretKey) {
      return NextResponse.json(
        { error: 'Public key and secret key are required' },
        { status: 400 }
      )
    }

    const result = await PaymentAdminService.configureCredentials({
      partnerId,
      provider: 'paystack',
      publicKey,
      secretKey,
      webhookSecret,
      testMode: testMode ?? true
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment credentials configured successfully' 
    })
  } catch (error) {
    console.error('Failed to configure payment credentials:', error)
    return NextResponse.json(
      { error: 'Failed to save payment configuration' },
      { status: 500 }
    )
  }
}
