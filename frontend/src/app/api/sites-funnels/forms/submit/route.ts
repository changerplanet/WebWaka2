export const dynamic = 'force-dynamic'

/**
 * Form Submission API - Phase E1.3
 * 
 * Public endpoint for form submissions (no auth required for public forms)
 * Handles both standard and payment-enabled forms
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitForm, verifySubmissionPayment, getSubmission } from '@/lib/sites-funnels/forms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, formId, submissionId, data, ...metadata } = body

    if (action === 'verify-payment') {
      if (!submissionId || !metadata.tenantId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Submission ID and tenant ID required' 
        }, { status: 400 })
      }
      
      const result = await verifySubmissionPayment(submissionId, metadata.tenantId)
      return NextResponse.json(result)
    }

    if (!formId) {
      return NextResponse.json({ success: false, error: 'Form ID required' }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'Form data required' }, { status: 400 })
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : undefined
    const userAgent = request.headers.get('user-agent') || undefined
    const referer = request.headers.get('referer') || undefined

    const result = await submitForm({
      formId,
      data,
      submitterEmail: metadata.submitterEmail,
      submitterName: metadata.submitterName,
      submitterPhone: metadata.submitterPhone,
      ipAddress,
      userAgent,
      referrer: referer,
      utmSource: metadata.utmSource,
      utmMedium: metadata.utmMedium,
      utmCampaign: metadata.utmCampaign,
      callbackUrl: metadata.callbackUrl
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Form submit API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submissionId')
  const tenantId = searchParams.get('tenantId')

  if (!submissionId || !tenantId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Submission ID and tenant ID required' 
    }, { status: 400 })
  }

  try {
    const submission = await getSubmission(submissionId, tenantId)
    
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    console.error('Form submit GET API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
