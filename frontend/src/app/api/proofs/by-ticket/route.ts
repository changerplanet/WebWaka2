/**
 * PROOFS API - By Ticket Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * 
 * GET /api/proofs/by-ticket
 * 
 * Gets proof chain by ticket number.
 * 
 * Security model:
 * - Demo tenants: Full access
 * - Live tenants: Requires phone that matches ticket passenger
 * 
 * @module app/api/proofs/by-ticket/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CanonicalProofService } from '@/lib/commerce/canonical-proof'

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  return phone.replace(/[\s\-\(\)\.]/g, '')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantSlug = searchParams.get('tenantSlug')
  const ticketNumber = searchParams.get('ticketNumber')
  const phone = searchParams.get('phone')

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'tenantSlug is required' },
      { status: 400 }
    )
  }

  if (!ticketNumber) {
    return NextResponse.json(
      { error: 'ticketNumber is required' },
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

  if (!tenantIsDemo && !phone) {
    return NextResponse.json(
      { error: 'phone required for non-demo tenants' },
      { status: 400 }
    )
  }

  if (!tenantIsDemo) {
    const normalizedPhone = normalizePhone(phone)
    
    const ticket = await prisma.park_ticket.findFirst({
      where: { tenantId: tenant.id, ticketNumber },
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

  const proof = await CanonicalProofService.getProofByTicket(tenant.id, ticketNumber)

  if (!proof) {
    return NextResponse.json(
      { error: 'Ticket not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: tenantIsDemo,
    proof,
  })
}
