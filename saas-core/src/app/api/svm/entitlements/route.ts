/**
 * SVM Entitlements API
 * 
 * GET /api/svm/entitlements?tenantId=xxx - Get SVM entitlements for tenant
 * 
 * This endpoint is called by the SVM module to check what features
 * and limits are available for a tenant's marketplace.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSVMEntitlements } from '@/lib/svm-event-handlers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const entitlements = await getSVMEntitlements(tenantId)

    if (!entitlements) {
      return NextResponse.json(
        { success: false, error: 'SVM not enabled for this tenant' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...entitlements
    })
  } catch (error) {
    console.error('Error fetching SVM entitlements:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
