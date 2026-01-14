/**
 * Super Admin: Payment Providers Management API
 * 
 * Phase E1.1: Super Admin controls for enabling/disabling Paystack per Partner
 * 
 * GET - List all partners with payment status
 * POST - Enable Paystack for a partner
 * DELETE - Disable Paystack for a partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentAdminService } from '@/lib/payment-providers/admin-service'
import { requireSuperAdmin } from '@/lib/authorization'

export async function GET() {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const partners = await PaymentAdminService.listPartnerPaymentStatus()
    return NextResponse.json({ partners })
  } catch (error) {
    console.error('Failed to list partner payment status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment providers status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const { partnerId } = body

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    const result = await PaymentAdminService.enablePaystackForPartner({
      partnerId,
      enabledByUserId: authResult.user.id
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Paystack enabled for partner' })
  } catch (error) {
    console.error('Failed to enable Paystack:', error)
    return NextResponse.json(
      { error: 'Failed to enable Paystack' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    const result = await PaymentAdminService.disablePaystackForPartner(partnerId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Paystack disabled for partner' })
  } catch (error) {
    console.error('Failed to disable Paystack:', error)
    return NextResponse.json(
      { error: 'Failed to disable Paystack' },
      { status: 500 }
    )
  }
}
