/**
 * CANONICAL CUSTOMERS API - Resolution Endpoint
 * Wave J.2: Unified Customer Identity (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * 
 * GET /api/customers/canonical
 * 
 * Resolves customer identity by email or phone.
 * Returns CanonicalCustomer with source system attribution.
 * 
 * @module app/api/customers/canonical/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalCustomerService } from '@/lib/commerce/canonical-customer'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantSlug = searchParams.get('tenantSlug')
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'tenantSlug is required' },
      { status: 400 }
    )
  }

  const result = await TenantContextResolver.resolveForOrders(tenantSlug)

  if (!result.success) {
    const statusMap = { not_found: 404, suspended: 403, module_disabled: 403 }
    return NextResponse.json(
      { error: result.reason === 'not_found' ? 'Tenant not found' : 'Tenant not active' },
      { status: statusMap[result.reason] }
    )
  }

  const ctx = result.context

  if (!email && !phone) {
    return NextResponse.json({
      success: true,
      isDemo: ctx.isDemo,
      customers: [],
      isAmbiguous: false,
      message: 'Provide email or phone to resolve customer identity',
    })
  }

  if (email) {
    const customerResult = await CanonicalCustomerService.getByEmail(ctx.tenantId, email)
    return NextResponse.json({
      success: true,
      isDemo: ctx.isDemo,
      ...customerResult,
    })
  }

  if (phone) {
    const customerResult = await CanonicalCustomerService.getByPhone(ctx.tenantId, phone)
    return NextResponse.json({
      success: true,
      isDemo: ctx.isDemo,
      ...customerResult,
    })
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    customers: [],
    isAmbiguous: false,
  })
}
