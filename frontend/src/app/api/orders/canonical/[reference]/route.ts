/**
 * CANONICAL ORDERS API - Detail Endpoint
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * 
 * GET /api/orders/canonical/[reference]
 * 
 * Gets a single canonical order by reference (order number / ticket number).
 * Requires tenantSlug query param for tenant isolation.
 * 
 * @module app/api/orders/canonical/[reference]/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalOrderService } from '@/lib/commerce/canonical-order'

interface RouteParams {
  params: Promise<{ reference: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { reference } = await params
  const searchParams = request.nextUrl.searchParams
  const tenantSlug = searchParams.get('tenantSlug')

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'tenantSlug is required' },
      { status: 400 }
    )
  }

  if (!reference) {
    return NextResponse.json(
      { error: 'Order reference is required' },
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

  const order = await CanonicalOrderService.getByReference(ctx.tenantId, reference)

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    order,
  })
}
