export const dynamic = 'force-dynamic'

/**
 * MVM Vendor by ID API
 * 
 * GET/PUT/DELETE for individual vendor operations.
 */

import { NextRequest, NextResponse } from 'next/server'

// Temporary storage - same as parent route
const vendorStore = new Map<string, Map<string, any>>()

function getOrCreateTenantStore(tenantId: string) {
  if (!vendorStore.has(tenantId)) {
    vendorStore.set(tenantId, new Map())
  }
  return vendorStore.get(tenantId)!
}

interface RouteParams {
  params: Promise<{ vendorId: string }>
}

/**
 * GET /api/mvm/vendors/:vendorId
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const store = getOrCreateTenantStore(tenantId)
    const vendor = store.get(vendorId)
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      vendor,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error fetching vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/mvm/vendors/:vendorId
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const body = await request.json()
    const { tenantId, action, ...updates } = body
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const store = getOrCreateTenantStore(tenantId)
    const vendor = store.get(vendorId)
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }
    
    // Handle specific actions
    switch (action) {
      case 'APPROVE':
        vendor.status = 'APPROVED'
        vendor.approvedAt = new Date().toISOString()
        break
      case 'SUSPEND':
        vendor.status = 'SUSPENDED'
        break
      case 'REJECT':
        vendor.status = 'REJECTED'
        break
      case 'UPDATE_ONBOARDING':
        vendor.onboardingStep = updates.onboardingStep
        break
      default:
        // General update
        Object.assign(vendor, {
          ...updates,
          updatedAt: new Date().toISOString()
        })
    }
    
    store.set(vendorId, vendor)
    
    return NextResponse.json({
      success: true,
      vendor,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error updating vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mvm/vendors/:vendorId
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { vendorId } = await context.params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const store = getOrCreateTenantStore(tenantId)
    const vendor = store.get(vendorId)
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }
    
    store.delete(vendorId)
    
    return NextResponse.json({
      success: true,
      message: `Vendor ${vendor.name} deleted`,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error deleting vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
