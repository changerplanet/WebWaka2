export const dynamic = 'force-dynamic'

/**
 * Form Submissions List API - Phase E1.3
 * 
 * Authenticated endpoint for listing form submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { requireSitesFunnelsEnabled, requirePartnerOwnership } from '@/lib/sites-funnels/entitlements-service'
import { listSubmissions, completeSubmissionDemo } from '@/lib/sites-funnels/forms'
import { validateSubmissionStatus } from '../validators'

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId') || session.activeTenantId

  if (!tenantId) {
    return NextResponse.json({ 
      success: false, 
      error: 'No active tenant.',
      code: 'NO_TENANT'
    }, { status: 400 })
  }

  const entitlementCheck = await requireSitesFunnelsEnabled(tenantId)
  if (!entitlementCheck.authorized) {
    return NextResponse.json({ success: false, error: entitlementCheck.error }, { status: 403 })
  }

  try {
    const formId = searchParams.get('formId') || undefined
    const status = validateSubmissionStatus(searchParams.get('status'))
    const submitterEmail = searchParams.get('email') || undefined
    const includeDemo = searchParams.get('includeDemo') === 'true'
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await listSubmissions(tenantId, {
      formId,
      status: status || undefined,
      submitterEmail,
      includeDemo,
      fromDate,
      toDate,
      page,
      limit
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Submissions API GET error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession()
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, submissionId } = body

    if (action === 'complete-demo') {
      if (!submissionId) {
        return NextResponse.json({ success: false, error: 'Submission ID required' }, { status: 400 })
      }
      
      const result = await completeSubmissionDemo(submissionId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Submissions API POST error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
