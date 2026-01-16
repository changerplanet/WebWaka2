/**
 * CANONICAL CUSTOMERS API - From Order Endpoint
 * Wave J.2: Unified Customer Identity (Read-Only)
 * 
 * GET /api/customers/canonical/from-order
 * 
 * Resolves customer identity from an order reference.
 * Attempts resolution across SVM → MVM → ParkHub.
 * 
 * @module app/api/customers/canonical/from-order/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CanonicalCustomerService } from '@/lib/commerce/canonical-customer'

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

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

  const customer = await CanonicalCustomerService.resolveFromOrder(
    tenant.id,
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
    isDemo: tenantIsDemo,
    customer,
  })
}
