export const dynamic = 'force-dynamic'

/**
 * Public Form API - Phase E1.3
 * 
 * Public endpoint for fetching active forms (no auth required)
 * Used by public-facing websites and funnels
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPublicForm } from '@/lib/sites-funnels/forms'
import { PaymentExecutionService } from '@/lib/payment-execution'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const formId = searchParams.get('formId')

  if (!formId) {
    return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
  }

  try {
    const form = await getPublicForm(formId)
    
    if (!form) {
      return NextResponse.json({ success: false, error: 'Form not found or not active' }, { status: 404 })
    }

    let paymentAvailable = false
    if (form.paymentEnabled) {
      const availability = await PaymentExecutionService.isAvailable(form.partnerId)
      paymentAvailable = availability.available
    }

    const publicForm = {
      id: form.id,
      name: form.name,
      description: form.description,
      schema: form.schema,
      submitButtonText: form.submitButtonText,
      paymentEnabled: form.paymentEnabled,
      paymentAmount: form.paymentAmount,
      paymentCurrency: form.paymentCurrency,
      paymentDescription: form.paymentDescription,
      paymentAvailable,
      styling: form.styling,
      tenantId: form.tenantId
    }

    return NextResponse.json({ success: true, form: publicForm })
  } catch (error: any) {
    console.error('Public form API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
