/**
 * MVM Vendors List API
 * 
 * GET /api/commerce/mvm/vendors - List vendors
 * POST /api/commerce/mvm/vendors - Create vendor
 * 
 * @module api/commerce/mvm/vendors
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { VendorService, VendorStatusService } from '@/lib/mvm'

// ============================================================================
// GET - List Vendors
// ============================================================================

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const tierId = searchParams.get('tierId')
    const isVerified = searchParams.get('isVerified')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await VendorService.list({
      tenantId,
      status: status || undefined,
      tierId: tierId || undefined,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
      search: search || undefined,
      page,
      pageSize
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[MVM Vendors API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create Vendor
// ============================================================================

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, email, phone, legalName, taxId, businessType, description, ...rest } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await VendorService.getByEmail(tenantId, email)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A vendor with this email already exists' },
        { status: 409 }
      )
    }

    const vendor = await VendorService.create({
      tenantId,
      name,
      email,
      phone,
      legalName,
      taxId,
      businessType,
      description,
      ...rest
    })

    return NextResponse.json({
      success: true,
      data: vendor
    }, { status: 201 })
  } catch (error) {
    console.error('[MVM Vendors API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
