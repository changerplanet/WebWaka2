/**
 * PROOFS API - By Order Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * 
 * GET /api/proofs/by-order
 * 
 * Gets proof chain by order reference.
 * Attempts resolution across SVM → MVM → ParkHub.
 * 
 * Security model:
 * - Demo tenants: Full access
 * - Live tenants: Requires email or phone that matches order customer
 * 
 * @module app/api/proofs/by-order/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CanonicalProofService } from '@/lib/commerce/canonical-proof'

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

function normalizeEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined
  return email.toLowerCase().trim()
}

function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  return phone.replace(/[\s\-\(\)\.]/g, '')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantSlug = searchParams.get('tenantSlug')
  const reference = searchParams.get('reference')
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

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

  if (!tenantIsDemo && !email && !phone) {
    return NextResponse.json(
      { error: 'email or phone required for non-demo tenants' },
      { status: 400 }
    )
  }

  if (!tenantIsDemo) {
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhone(phone)
    
    const svmOrder = await prisma.svm_orders.findFirst({
      where: { tenantId: tenant.id, orderNumber: reference },
      select: { customerEmail: true, customerPhone: true },
    })
    
    if (svmOrder) {
      const emailMatch = normalizedEmail && normalizeEmail(svmOrder.customerEmail) === normalizedEmail
      const phoneMatch = normalizedPhone && normalizePhone(svmOrder.customerPhone) === normalizedPhone
      
      if (!emailMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Access denied - identifier does not match order' },
          { status: 403 }
        )
      }
    }
    
    const mvmOrder = await prisma.mvm_parent_order.findFirst({
      where: { tenantId: tenant.id, orderNumber: reference },
      select: { customerEmail: true, customerPhone: true },
    })
    
    if (mvmOrder) {
      const emailMatch = normalizedEmail && normalizeEmail(mvmOrder.customerEmail) === normalizedEmail
      const phoneMatch = normalizedPhone && normalizePhone(mvmOrder.customerPhone) === normalizedPhone
      
      if (!emailMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Access denied - identifier does not match order' },
          { status: 403 }
        )
      }
    }
    
    const ticket = await prisma.park_ticket.findFirst({
      where: { tenantId: tenant.id, ticketNumber: reference },
      select: { passengerPhone: true },
    })
    
    if (ticket) {
      const phoneMatch = normalizedPhone && normalizePhone(ticket.passengerPhone) === normalizedPhone
      
      if (!phoneMatch) {
        return NextResponse.json(
          { error: 'Access denied - phone does not match ticket' },
          { status: 403 }
        )
      }
    }
  }

  const proof = await CanonicalProofService.getProofByOrder(tenant.id, reference)

  if (!proof) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: tenantIsDemo,
    proof,
  })
}
