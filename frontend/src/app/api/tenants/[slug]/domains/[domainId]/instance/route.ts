/**
 * Domain-Instance Mapping API (Phase 2.1)
 * 
 * PATCH /api/tenants/[slug]/domains/[domainId]/instance
 * 
 * Maps a domain to a platform instance.
 * No DNS verification logic - mapping only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; domainId: string } }
) {
  try {
    const { slug, domainId } = params
    const body = await request.json()
    const { platformInstanceId } = body
    
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Find domain and verify it belongs to tenant
    const domain = await prisma.tenantDomain.findFirst({
      where: { 
        id: domainId,
        tenantId: tenant.id
      }
    })
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }
    
    // Verify instance belongs to tenant if provided
    if (platformInstanceId) {
      const instance = await prisma.platformInstance.findFirst({
        where: {
          id: platformInstanceId,
          tenantId: tenant.id
        }
      })
      
      if (!instance) {
        return NextResponse.json(
          { error: 'Instance not found or does not belong to this tenant' },
          { status: 400 }
        )
      }
    }
    
    // Update domain mapping
    const updated = await prisma.tenantDomain.update({
      where: { id: domainId },
      data: { 
        platformInstanceId: platformInstanceId || null 
      },
      select: {
        id: true,
        domain: true,
        type: true,
        status: true,
        isPrimary: true,
        platformInstanceId: true,
      }
    })
    
    return NextResponse.json({ success: true, domain: updated })
  } catch (error) {
    console.error('Failed to update domain mapping:', error)
    return NextResponse.json(
      { error: 'Failed to update domain mapping' },
      { status: 500 }
    )
  }
}
