/**
 * CANONICAL CUSTOMERS API - Resolution Endpoint
 * Wave J.2: Unified Customer Identity (Read-Only)
 * 
 * GET /api/customers/canonical
 * 
 * Resolves customer identity by email or phone.
 * Returns CanonicalCustomer with source system attribution.
 * 
 * @module app/api/customers/canonical/route
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
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

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

  if (!email && !phone) {
    return NextResponse.json({
      success: true,
      isDemo: tenantIsDemo,
      customers: [],
      isAmbiguous: false,
      message: 'Provide email or phone to resolve customer identity',
    })
  }

  if (email) {
    const result = await CanonicalCustomerService.getByEmail(tenant.id, email)
    return NextResponse.json({
      success: true,
      isDemo: tenantIsDemo,
      ...result,
    })
  }

  if (phone) {
    const result = await CanonicalCustomerService.getByPhone(tenant.id, phone)
    return NextResponse.json({
      success: true,
      isDemo: tenantIsDemo,
      ...result,
    })
  }

  return NextResponse.json({
    success: true,
    isDemo: tenantIsDemo,
    customers: [],
    isAmbiguous: false,
  })
}
