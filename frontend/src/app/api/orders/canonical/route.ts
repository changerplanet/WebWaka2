/**
 * CANONICAL ORDERS API - List Endpoint
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * 
 * GET /api/orders/canonical
 * 
 * Lists canonical orders for a tenant. Requires tenantSlug query param.
 * For demo tenants: returns all orders
 * For live tenants: requires email or phone query param
 * 
 * @module app/api/orders/canonical/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalOrderService } from '@/lib/commerce/canonical-order'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantSlug = searchParams.get('tenantSlug')
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

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

  if (ctx.isDemo) {
    const listResult = await CanonicalOrderService.listAllForTenant(ctx.tenantId, { limit })
    return NextResponse.json({
      success: true,
      isDemo: true,
      ...listResult,
    })
  }

  if (!email && !phone) {
    return NextResponse.json({
      success: true,
      isDemo: false,
      orders: [],
      total: 0,
      message: 'Provide email or phone to view orders',
    })
  }

  const identifier = { email: email || undefined, phone: phone || undefined }
  const listResult = await CanonicalOrderService.listByCustomerIdentifier(
    ctx.tenantId,
    identifier,
    { limit }
  )

  return NextResponse.json({
    success: true,
    isDemo: false,
    ...listResult,
  })
}
