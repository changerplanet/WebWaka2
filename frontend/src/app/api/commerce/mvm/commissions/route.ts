/**
 * MVM Commissions API
 * 
 * GET /api/commerce/mvm/commissions - List commissions
 * GET /api/commerce/mvm/commissions?summary=true - Get summary
 * POST /api/commerce/mvm/commissions?action=process-clearances - Batch process
 * 
 * @module api/commerce/mvm/commissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { CommissionService } from '@/lib/mvm'

// ============================================================================
// GET - List Commissions or Summary
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuardLegacy(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const summary = searchParams.get('summary') === 'true'
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status') as any
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // Return summary
    if (summary) {
      const summaryData = await CommissionService.getSummary(tenantId, vendorId || undefined)
      return NextResponse.json({
        success: true,
        data: summaryData
      })
    }

    // Return list
    const result = await CommissionService.list({
      tenantId,
      vendorId: vendorId || undefined,
      status: status || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Commissions API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Commission Actions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuardLegacy(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'process-clearances': {
        const count = await CommissionService.processClearances(tenantId)
        return NextResponse.json({
          success: true,
          data: { clearedCount: count }
        })
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[MVM Commissions API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
