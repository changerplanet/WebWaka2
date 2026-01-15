/**
 * CANONICAL ORDERS API - List Endpoint
 * Wave J.1: Unified Order Abstraction (Read-Only)
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
import { prisma } from '@/lib/prisma'
import { CanonicalOrderService } from '@/lib/commerce/canonical-order'

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

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

  if (tenantIsDemo) {
    const result = await CanonicalOrderService.listAllForTenant(tenant.id, { limit })
    return NextResponse.json({
      success: true,
      isDemo: true,
      ...result,
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
  const result = await CanonicalOrderService.listByCustomerIdentifier(
    tenant.id,
    identifier,
    { limit }
  )

  return NextResponse.json({
    success: true,
    isDemo: false,
    ...result,
  })
}
