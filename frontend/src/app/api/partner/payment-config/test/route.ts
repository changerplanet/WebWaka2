/**
 * Partner: Test Payment Connection API
 * 
 * Phase E1.1: Connection test (stub - no actual API call)
 */

import { NextResponse } from 'next/server'
import { PaymentAdminService } from '@/lib/payment-providers/admin-service'
import { requirePartnerUser } from '@/lib/partner-authorization'

export async function POST() {
  try {
    const authResult = await requirePartnerUser()
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const partnerId = authResult.partner.id
    const result = await PaymentAdminService.testConnection(partnerId, 'paystack')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to test connection:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to test connection' },
      { status: 500 }
    )
  }
}
