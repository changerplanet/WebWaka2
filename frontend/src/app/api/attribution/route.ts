export const dynamic = 'force-dynamic'

/**
 * Attribution API
 * 
 * POST /api/attribution - Create attribution (referral link signup)
 * GET /api/attribution?tenantId=xxx - Get attribution for tenant
 * POST /api/attribution/lock - Lock attribution after first billing (internal)
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createAttributionByCode,
  getAttributionForTenant,
  hasExistingAttribution,
  ATTRIBUTION_RULES
} from '@/lib/partner-attribution'
import { getCurrentSession } from '@/lib/auth'

// POST - Create attribution via referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.tenantId || !body.referralCode) {
      return NextResponse.json(
        { error: 'tenantId and referralCode are required' },
        { status: 400 }
      )
    }
    
    // Check if already attributed
    const hasAttribution = await hasExistingAttribution(body.tenantId)
    if (hasAttribution) {
      return NextResponse.json(
        { 
          error: 'Tenant already has attribution. Attribution is immutable.',
          code: 'ALREADY_ATTRIBUTED'
        },
        { status: 409 }
      )
    }
    
    // Create attribution
    const result = await createAttributionByCode(
      body.tenantId,
      body.referralCode,
      {
        referralSource: body.referralSource,
        landingPage: body.landingPage,
        metadata: body.metadata
      }
    )
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        'ALREADY_ATTRIBUTED': 409,
        'PARTNER_INACTIVE': 403,
        'INVALID_CODE': 400,
        'NOT_FOUND': 404
      }
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusMap[result.code || ''] || 500 }
      )
    }
    
    return NextResponse.json({
      attribution: {
        id: result.referral!.id,
        partnerId: result.referral!.partnerId,
        tenantId: result.referral!.tenantId,
        method: result.referral!.attributionMethod,
        referredAt: result.referral!.referredAt,
        attributionWindowDays: result.referral!.attributionWindowDays,
        isLifetime: !result.referral!.attributionWindowDays,
        isLocked: result.referral!.attributionLocked
      },
      rules: {
        immutable: ATTRIBUTION_RULES.IMMUTABLE,
        locksAfterBilling: ATTRIBUTION_RULES.LOCKS_AFTER_BILLING,
        noReassignment: ATTRIBUTION_RULES.NO_REASSIGNMENT
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating attribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get attribution for tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId query parameter is required' },
        { status: 400 }
      )
    }
    
    // Get session - require authentication
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get attribution
    const attribution = await getAttributionForTenant(tenantId)
    
    if (!attribution) {
      return NextResponse.json(
        { 
          hasAttribution: false,
          attribution: null 
        }
      )
    }
    
    // Type assertion for included relations
    const attrWithRelations = attribution as typeof attribution & {
      partner?: { id: string; name: string; slug: string; status: string }
      referralCode?: { id: string; code: string; campaignName: string | null }
    }
    
    return NextResponse.json({
      hasAttribution: true,
      attribution: {
        id: attribution.id,
        partnerId: attribution.partnerId,
        partner: attrWithRelations.partner || null,
        tenantId: attribution.tenantId,
        method: attribution.attributionMethod,
        referredAt: attribution.referredAt,
        attributionWindowDays: attribution.attributionWindowDays,
        attributionExpiresAt: attribution.attributionExpiresAt,
        isLifetime: !attribution.attributionWindowDays,
        isLocked: attribution.attributionLocked,
        lockedAt: attribution.lockedAt,
        referralCode: attrWithRelations.referralCode || null,
        referralSource: attribution.referralSource
      }
    })
    
  } catch (error) {
    console.error('Error getting attribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
