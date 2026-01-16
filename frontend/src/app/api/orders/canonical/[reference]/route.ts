/**
 * CANONICAL ORDERS API - Detail Endpoint
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * Wave C2: Security hardened - identity verification required for non-demo
 * 
 * GET /api/orders/canonical/[reference]
 * 
 * Gets a single canonical order by reference (order number / ticket number).
 * Requires tenantSlug query param for tenant isolation.
 * 
 * Security model:
 * - Demo tenants: Full access with valid reference
 * - Live tenants: Requires email or phone that matches order customer
 * 
 * @module app/api/orders/canonical/[reference]/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalOrderService } from '@/lib/commerce/canonical-order'

interface RouteParams {
  params: Promise<{ reference: string }>
}

function normalizeEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined
  return email.toLowerCase().trim()
}

function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  return phone.replace(/[\s\-\(\)\.]/g, '')
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { reference } = await params
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

  if (!reference) {
    return NextResponse.json(
      { error: 'Order reference is required' },
      { status: 400 }
    )
  }

  const result = await TenantContextResolver.resolveForOrders(tenantSlug)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 403 }
    )
  }

  const ctx = result.context

  if (!ctx.isDemo && !email && !phone) {
    return NextResponse.json(
      { error: 'email or phone required to view order details' },
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
    
    if (!svmOrder && !mvmOrder && !ticket) {
      return NextResponse.json(
        { error: 'Unable to process request' },
        { status: 404 }
      )
    }
  }

  const order = await CanonicalOrderService.getByReference(ctx.tenantId, reference)

  if (!order) {
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    order,
  })
}
