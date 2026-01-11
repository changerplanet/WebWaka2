export const dynamic = 'force-dynamic'

/**
 * MVM Single Vendor API
 * 
 * GET /api/commerce/mvm/vendors/[vendorId] - Get vendor
 * PUT /api/commerce/mvm/vendors/[vendorId] - Update vendor
 * POST /api/commerce/mvm/vendors/[vendorId]?action=... - Status actions
 * 
 * @module api/commerce/mvm/vendors/[vendorId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { 
  VendorService, 
  VendorStatusService, 
  VendorOnboardingService,
  VendorTierService 
} from '@/lib/mvm'

// ============================================================================
// GET - Get Vendor
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { vendorId } = params
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include') // onboarding, dashboard, tier-progress

    const vendor = await VendorService.getById(tenantId, vendorId)
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    let response: any = { vendor }

    // Include additional data if requested
    if (include?.includes('onboarding')) {
      response.onboarding = await VendorOnboardingService.getStatus(vendorId)
    }
    if (include?.includes('dashboard')) {
      response.dashboard = await VendorService.getDashboardSummary(tenantId, vendorId)
    }
    if (include?.includes('tier-progress')) {
      response.tierProgress = await VendorTierService.getTierProgress(tenantId, vendorId)
    }

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('[MVM Vendor API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update Vendor
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { vendorId } = params
    const body = await request.json()

    // Check vendor exists
    const existing = await VendorService.getById(tenantId, vendorId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const updated = await VendorService.update(tenantId, vendorId, body)

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('[MVM Vendor API] PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Vendor Actions (approve, reject, suspend, etc.)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { vendorId } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    // Check vendor exists
    const existing = await VendorService.getById(tenantId, vendorId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    let result: any

    switch (action) {
      case 'approve':
        result = await VendorStatusService.approve(tenantId, vendorId, body.approvedBy || 'system')
        break
      
      case 'reject':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Rejection reason required' },
            { status: 400 }
          )
        }
        result = await VendorStatusService.reject(tenantId, vendorId, body.rejectedBy || 'system', body.reason)
        break
      
      case 'suspend':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'Suspension reason required' },
            { status: 400 }
          )
        }
        result = await VendorStatusService.suspend(tenantId, vendorId, body.suspendedBy || 'system', body.reason)
        break
      
      case 'reinstate':
        result = await VendorStatusService.reinstate(tenantId, vendorId, body.reinstatedBy || 'system')
        break
      
      case 'verify':
        result = await VendorStatusService.verify(tenantId, vendorId, body.verifiedBy || 'system')
        break
      
      case 'unverify':
        result = await VendorStatusService.unverify(tenantId, vendorId)
        break
      
      case 'reapply':
        result = await VendorStatusService.reapply(tenantId, vendorId)
        break
      
      case 'churn':
        result = await VendorStatusService.markChurned(tenantId, vendorId, body.reason)
        break
      
      case 'auto-tier':
        result = await VendorTierService.autoAssignTier(vendorId)
        break
      
      // Onboarding actions
      case 'complete-profile':
        result = await VendorOnboardingService.completeProfile(vendorId)
        break
      
      case 'complete-bank':
        result = await VendorOnboardingService.completeBankInfo(vendorId)
        break
      
      case 'complete-products':
        result = await VendorOnboardingService.completeProducts(vendorId)
        break
      
      case 'sign-agreement':
        result = await VendorOnboardingService.signAgreement(vendorId, body.signedBy || 'vendor')
        break
      
      case 'complete-onboarding':
        result = await VendorOnboardingService.completeOnboarding(vendorId)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    if (result && !result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Vendor API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
