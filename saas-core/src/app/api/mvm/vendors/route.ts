/**
 * MVM Vendors API
 * 
 * Vendor CRUD and onboarding endpoints.
 * Proxies to MVM module's vendor-engine.
 * 
 * NOTE: This is a routing layer only - no business logic modifications.
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// TYPES (From MVM module)
// ============================================================================

type VendorStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'CHURNED'

// ============================================================================
// MOCK STORAGE (Until MVM database is connected)
// ============================================================================

// Temporary in-memory storage - MVM module handles persistence
const vendorStore = new Map<string, Map<string, any>>()

function getOrCreateTenantStore(tenantId: string) {
  if (!vendorStore.has(tenantId)) {
    vendorStore.set(tenantId, new Map())
  }
  return vendorStore.get(tenantId)!
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/mvm/vendors
 * List vendors for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status') as VendorStatus | null
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const store = getOrCreateTenantStore(tenantId)
    let vendors = Array.from(store.values())
    
    // Filter by status
    if (status) {
      vendors = vendors.filter(v => v.status === status)
    }
    
    // Search by name/email
    if (query) {
      const q = query.toLowerCase()
      vendors = vendors.filter(v => 
        v.name?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q)
      )
    }
    
    // Paginate
    const total = vendors.length
    vendors = vendors.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      vendors,
      total,
      hasMore: offset + vendors.length < total,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error listing vendors:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/vendors
 * Create/register a new vendor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, email, phone, businessType, description } = body
    
    if (!tenantId || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'tenantId, name, and email are required' },
        { status: 400 }
      )
    }
    
    const store = getOrCreateTenantStore(tenantId)
    
    // Check for duplicate email
    const existing = Array.from(store.values()).find(v => v.email === email)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A vendor with this email already exists' },
        { status: 400 }
      )
    }
    
    const vendorId = `vendor_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    
    const vendor = {
      id: vendorId,
      tenantId,
      name,
      slug,
      email,
      phone,
      businessType,
      description,
      status: 'PENDING_APPROVAL' as VendorStatus,
      isVerified: false,
      commissionRate: 15, // Default
      totalSales: 0,
      totalOrders: 0,
      reviewCount: 0,
      onboardingStep: 'REGISTERED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    store.set(vendorId, vendor)
    
    return NextResponse.json({
      success: true,
      vendor,
      module: 'MVM'
    }, { status: 201 })
    
  } catch (error) {
    console.error('[MVM] Error creating vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
