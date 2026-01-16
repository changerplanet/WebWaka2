/**
 * PROOFS API - By Receipt Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
 * 
 * GET /api/proofs/by-receipt
 * 
 * Gets proof chain by receipt number.
 * 
 * Security model:
 * - Demo tenants: Full access
 * - Live tenants: Requires email or phone that matches receipt customer
 * 
 * @module app/api/proofs/by-receipt/route
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
  const receiptNumber = searchParams.get('receiptNumber')
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'tenantSlug is required' },
      { status: 400 }
    )
  }

  if (!receiptNumber) {
    return NextResponse.json(
      { error: 'receiptNumber is required' },
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
    
    const receipt = await prisma.receipt.findFirst({
      where: { tenantId: ctx.tenantId, receiptNumber },
      select: { customerEmail: true, customerPhone: true },
    })
    
    if (receipt) {
      const emailMatch = normalizedEmail && normalizeEmail(receipt.customerEmail) === normalizedEmail
      const phoneMatch = normalizedPhone && normalizePhone(receipt.customerPhone) === normalizedPhone
      
      if (!emailMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Unable to process request' },
          { status: 403 }
        )
      }
    }
  }

  const proof = await CanonicalProofService.getProofByReceipt(ctx.tenantId, receiptNumber)

  if (!proof) {
    return NextResponse.json(
      { error: 'Receipt not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    proof,
  })
}
