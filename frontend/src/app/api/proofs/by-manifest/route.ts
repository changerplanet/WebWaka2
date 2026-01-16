/**
 * PROOFS API - By Manifest Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * 
 * GET /api/proofs/by-manifest
 * 
 * Gets proof chain by manifest number.
 * 
 * Security model:
 * - Demo tenants: Full access
 * - Live tenants: Requires phone that matches a ticket on the manifest
 * 
 * GAP: Cannot verify manifest access without iterating all tickets.
 * This is a performance concern for large manifests.
 * 
 * @module app/api/proofs/by-manifest/route
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
  const manifestNumber = searchParams.get('manifestNumber')
  const phone = searchParams.get('phone')

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'tenantSlug is required' },
      { status: 400 }
    )
  }

  if (!manifestNumber) {
    return NextResponse.json(
      { error: 'manifestNumber is required' },
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
    
    const manifest = await prisma.park_manifest.findFirst({
      where: { tenantId: tenant.id, manifestNumber },
      select: { tripId: true },
    })
    
    if (manifest) {
      const matchingTicket = await prisma.park_ticket.findFirst({
        where: { 
          tenantId: tenant.id, 
          tripId: manifest.tripId,
          passengerPhone: normalizedPhone,
        },
        select: { id: true },
      })
      
      if (!matchingTicket) {
        return NextResponse.json(
          { error: 'Access denied - phone does not match any passenger on manifest' },
          { status: 403 }
        )
      }
    }
  }

  const proof = await CanonicalProofService.getProofByManifest(tenant.id, manifestNumber)

  if (!proof) {
    return NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: tenantIsDemo,
    proof,
  })
}
