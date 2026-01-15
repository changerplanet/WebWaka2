/**
 * CANONICAL ORDERS API - Detail Endpoint
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * 
 * GET /api/orders/canonical/[reference]
 * 
 * Gets a single canonical order by reference (order number / ticket number).
 * Requires tenantSlug query param for tenant isolation.
 * 
 * @module app/api/orders/canonical/[reference]/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CanonicalOrderService } from '@/lib/commerce/canonical-order'

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

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

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, status: true },
  })

  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    )
  }

  const tenantIsDemo = isDemo(tenant)

  if (!tenantIsDemo && tenant.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Tenant not active' },
      { status: 403 }
    )
  }

  const order = await CanonicalOrderService.getByReference(tenant.id, reference)

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: tenantIsDemo,
    order,
  })
}
