/**
 * PROOFS API - By Receipt Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
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
    
    const receipt = await prisma.receipt.findFirst({
      where: { tenantId: tenant.id, receiptNumber },
      select: { customerEmail: true, customerPhone: true },
    })
    
    if (receipt) {
      const emailMatch = normalizedEmail && normalizeEmail(receipt.customerEmail) === normalizedEmail
      const phoneMatch = normalizedPhone && normalizePhone(receipt.customerPhone) === normalizedPhone
      
      if (!emailMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Access denied - identifier does not match receipt' },
          { status: 403 }
        )
      }
    }
  }

  const proof = await CanonicalProofService.getProofByReceipt(tenant.id, receiptNumber)

  if (!proof) {
    return NextResponse.json(
      { error: 'Receipt not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: tenantIsDemo,
    proof,
  })
}
