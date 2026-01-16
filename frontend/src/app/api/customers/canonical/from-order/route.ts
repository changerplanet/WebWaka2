/**
 * CANONICAL CUSTOMERS API - From Order Endpoint
 * Wave J.2: Unified Customer Identity (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * Wave C2: Security hardened - identity verification required for non-demo
 * 
 * GET /api/customers/canonical/from-order
 * 
 * Resolves customer identity from an order reference.
 * Attempts resolution across SVM → MVM → ParkHub.
 * 
 * Security model:
 * - Demo tenants: Full access
 * - Live tenants: Requires email or phone that matches order customer
 * 
 * @module app/api/customers/canonical/from-order/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalCustomerService } from '@/lib/commerce/canonical-customer'

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
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 403 }
    )
  }

  const ctx = result.context

  if (!ctx.isDemo && !email && !phone) {
    return NextResponse.json(
      { error: 'email or phone required for customer lookup' },
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

  const customer = await CanonicalCustomerService.resolveFromOrder(
    ctx.tenantId,
    reference
  )

  if (!customer) {
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    customer,
  })
}
