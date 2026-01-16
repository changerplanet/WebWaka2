/**
 * CANONICAL CUSTOMERS API - From Order Endpoint
 * Wave J.2: Unified Customer Identity (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * 
 * GET /api/customers/canonical/from-order
 * 
 * Resolves customer identity from an order reference.
 * Attempts resolution across SVM → MVM → ParkHub.
 * 
 * @module app/api/customers/canonical/from-order/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalCustomerService } from '@/lib/commerce/canonical-customer'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantSlug = searchParams.get('tenantSlug')
  const reference = searchParams.get('reference')

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'tenantSlug is required' },
      { status: 400 }
    )
  }

  if (!reference) {
    return NextResponse.json(
      { error: 'reference is required' },
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

  const customer = await CanonicalCustomerService.resolveFromOrder(
    ctx.tenantId,
    reference
  )

  if (!customer) {
    return NextResponse.json(
      { error: 'Order not found or has no customer data' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    customer,
  })
}
