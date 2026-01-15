/**
 * SVM Social Proof API (Wave G3)
 * 
 * GET /api/svm/social-proof?tenantId=X&productId=Y - Single product social proof
 * POST /api/svm/social-proof - Batch product social proof
 * 
 * Security: Read-only, tenant-isolated via session validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import {
  getProductSocialProof,
  getBatchProductSocialProof,
  getRecentStoreActivity,
  generateDemoSocialProof
} from '@/lib/svm/social-proof-service'

const DEMO_TENANT_ID = 'demo-tenant-001'

function getTenantIdFromSession(session: { activeTenantId?: string | null } | null): string | null {
  return session?.activeTenantId ?? null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') || 'product'
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (activeTenantId && activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const effectiveTenantId = activeTenantId || tenantId
    const isDemo = effectiveTenantId === DEMO_TENANT_ID
    
    if (type === 'store-activity') {
      const activity = await getRecentStoreActivity(effectiveTenantId)
      return NextResponse.json({
        success: true,
        ...activity
      })
    }
    
    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required for product social proof' },
        { status: 400 }
      )
    }
    
    if (isDemo) {
      const demoData = generateDemoSocialProof(productId)
      return NextResponse.json({
        success: true,
        socialProof: demoData
      })
    }
    
    const socialProof = await getProductSocialProof(effectiveTenantId, productId)
    
    return NextResponse.json({
      success: true,
      socialProof
    })
  } catch (error) {
    console.error('[SocialProof API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social proof data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const activeTenantId = getTenantIdFromSession(session)
    
    const body = await request.json()
    const { tenantId, productIds } = body
    
    if (!tenantId || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'tenantId and productIds array are required' },
        { status: 400 }
      )
    }
    
    if (activeTenantId && activeTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch - access denied' },
        { status: 403 }
      )
    }
    
    const effectiveTenantId = activeTenantId || tenantId
    const isDemo = effectiveTenantId === DEMO_TENANT_ID
    
    if (isDemo) {
      const demoResults: Record<string, ReturnType<typeof generateDemoSocialProof>> = {}
      productIds.forEach((id: string) => {
        demoResults[id] = generateDemoSocialProof(id)
      })
      return NextResponse.json({
        success: true,
        socialProof: demoResults,
        isDemo: true
      })
    }
    
    const resultsMap = await getBatchProductSocialProof(effectiveTenantId, productIds)
    
    const results: Record<string, unknown> = {}
    resultsMap.forEach((value, key) => {
      results[key] = value
    })
    
    return NextResponse.json({
      success: true,
      socialProof: results,
      isDemo: false
    })
  } catch (error) {
    console.error('[SocialProof API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch social proof data' },
      { status: 500 }
    )
  }
}
