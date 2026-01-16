/**
 * PROOFS API - By Order Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * 
 * GET /api/proofs/by-order
 * 
 * Gets proof chain by order reference.
 * Attempts resolution across SVM → MVM → ParkHub.
 * 
 * Security model:
 * - Demo tenants: Full access
 * - Live tenants: Requires email/phone that matches order customer
 * 
 * @module app/api/proofs/by-order/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalProofService } from '@/lib/commerce/canonical-proof'

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

  const result = await TenantContextResolver.resolveForOrders(tenantSlug)

  if (!result.success) {
    const statusMap = { not_found: 404, suspended: 403, module_disabled: 403 }
    return NextResponse.json(
      { error: result.reason === 'not_found' ? 'Tenant not found' : 'Tenant not active' },
      { status: statusMap[result.reason] }
    )
  }

  const ctx = result.context

  if (!ctx.isDemo && !email && !phone) {
    return NextResponse.json(
      { error: 'email or phone required for non-demo tenants' },
      { status: 400 }
    )
  }

  if (!ctx.isDemo) {
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhone(phone)
    
    const svmOrder = await prisma.svm_orders.findFirst({
      where: { tenantId: ctx.tenantId, orderNumber: reference },
      select: { customerEmail: true, customerPhone: true },
    })
    
    if (svmOrder) {
      const emailMatch = normalizedEmail && normalizeEmail(svmOrder.customerEmail) === normalizedEmail
      const phoneMatch = normalizedPhone && normalizePhone(svmOrder.customerPhone) === normalizedPhone
      
      if (!emailMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Unable to process request' },
          { status: 403 }
        )
      }
    }
    
    const mvmOrder = await prisma.mvm_parent_order.findFirst({
      where: { tenantId: ctx.tenantId, orderNumber: reference },
      select: { customerEmail: true, customerPhone: true },
    })
    
    if (mvmOrder) {
      const emailMatch = normalizedEmail && normalizeEmail(mvmOrder.customerEmail) === normalizedEmail
      const phoneMatch = normalizedPhone && normalizePhone(mvmOrder.customerPhone) === normalizedPhone
      
      if (!emailMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Unable to process request' },
          { status: 403 }
        )
      }
    }
    
    const ticket = await prisma.park_ticket.findFirst({
      where: { tenantId: ctx.tenantId, ticketNumber: reference },
      select: { passengerPhone: true },
    })
    
    if (ticket) {
      const phoneMatch = normalizedPhone && normalizePhone(ticket.passengerPhone) === normalizedPhone
      
      if (!phoneMatch) {
        return NextResponse.json(
          { error: 'Unable to process request' },
          { status: 403 }
        )
      }
    }
  }

  const proof = await CanonicalProofService.getProofByOrder(ctx.tenantId, reference)

  if (!proof) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    proof,
  })
}
