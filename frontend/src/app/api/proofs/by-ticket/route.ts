/**
 * PROOFS API - By Ticket Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
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
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalProofService } from '@/lib/commerce/canonical-proof'

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

  const result = await TenantContextResolver.resolveForOrders(tenantSlug)

  if (!result.success) {
    const statusMap = { not_found: 404, suspended: 403, module_disabled: 403 }
    return NextResponse.json(
      { error: result.reason === 'not_found' ? 'Tenant not found' : 'Tenant not active' },
      { status: statusMap[result.reason] }
    )
  }

  const ctx = result.context

  if (!ctx.isDemo && !phone) {
    return NextResponse.json(
      { error: 'phone required for non-demo tenants' },
      { status: 400 }
    )
  }

  if (!ctx.isDemo) {
    const normalizedPhone = normalizePhone(phone)
    
    const ticket = await prisma.park_ticket.findFirst({
      where: { tenantId: ctx.tenantId, ticketNumber },
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

  const proof = await CanonicalProofService.getProofByTicket(ctx.tenantId, ticketNumber)

  if (!proof) {
    return NextResponse.json(
      { error: 'Ticket not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    proof,
  })
}
