/**
 * Platform Instances API (Phase 2.1)
 * 
 * GET /api/platform-instances - List instances for tenant
 * POST /api/platform-instances - Create new instance
 * 
 * Query params (GET):
 * - tenantId: Required - the tenant to fetch instances for
 * 
 * Body (POST):
 * - tenantSlug: Required
 * - name, slug, description, suiteKeys, branding fields
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  
  if (!tenantId) {
    return NextResponse.json(
      { error: 'tenantId is required' },
      { status: 400 }
    )
  }
  
  try {
    // First try to find by ID, then by slug
    let tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    })
    
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantId },
        select: { id: true }
      })
    }
    
    if (!tenant) {
      return NextResponse.json({ instances: [] })
    }
    
    // Fetch instances for the tenant (include inactive for admin view)
    const instances = await prisma.platformInstance.findMany({
      where: {
        tenantId: tenant.id
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        suiteKeys: true,
        isDefault: true,
        isActive: true,
        displayName: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        createdAt: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })
    
    return NextResponse.json({ instances })
  } catch (error) {
    console.error('Failed to fetch platform instances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tenantSlug, 
      name, 
      slug, 
      description,
      suiteKeys = [],
      displayName,
      primaryColor,
      secondaryColor,
      logoUrl
    } = body
    
    if (!tenantSlug || !name || !slug) {
      return NextResponse.json(
        { error: 'tenantSlug, name, and slug are required' },
        { status: 400 }
      )
    }
    
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true }
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Check for duplicate slug within tenant
    const existing = await prisma.platformInstance.findFirst({
      where: { tenantId: tenant.id, slug }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'An instance with this slug already exists' },
        { status: 400 }
      )
    }
    
    // Create instance
    const instance = await prisma.platformInstance.create({
      data: {
        tenantId: tenant.id,
        name,
        slug,
        description: description || null,
        suiteKeys,
        displayName: displayName || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        logoUrl: logoUrl || null,
        isDefault: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        suiteKeys: true,
        isDefault: true,
        isActive: true,
        displayName: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        createdAt: true,
      }
    })
    
    return NextResponse.json({ success: true, instance })
  } catch (error) {
    console.error('Failed to create platform instance:', error)
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    )
  }
}
