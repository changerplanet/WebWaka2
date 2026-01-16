/**
 * PROOFS API - By Manifest Endpoint
 * Wave J.3: Receipt & Proof Linking (Read-Only)
 * Wave J.4: Refactored to use TenantContextResolver
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
import { TenantContextResolver } from '@/lib/tenant-context'
import { CanonicalProofService } from '@/lib/commerce/canonical-proof'

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
    
    const manifest = await prisma.park_manifest.findFirst({
      where: { tenantId: ctx.tenantId, manifestNumber },
      select: { tripId: true },
    })
    
    if (manifest) {
      const matchingTicket = await prisma.park_ticket.findFirst({
        where: { 
          tenantId: ctx.tenantId, 
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

  const proof = await CanonicalProofService.getProofByManifest(ctx.tenantId, manifestNumber)

  if (!proof) {
    return NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    isDemo: ctx.isDemo,
    proof,
  })
}
