/**
 * Platform Instance Detail API (Phase 2.1)
 * 
 * PATCH /api/platform-instances/[id] - Update instance
 * DELETE /api/platform-instances/[id] - Delete instance (soft)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { 
      tenantSlug,
      name, 
      slug, 
      description,
      suiteKeys,
      displayName,
      primaryColor,
      secondaryColor,
      logoUrl,
      isActive
    } = body
    
    // Find instance
    const instance = await prisma.platformInstance.findUnique({
      where: { id },
      include: { tenant: { select: { slug: true } } }
    })
    
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }
    
    // Verify tenant access if tenantSlug provided
    if (tenantSlug && instance.tenant.slug !== tenantSlug) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Prevent deactivating default instance
    if (instance.isDefault && isActive === false) {
      return NextResponse.json(
        { error: 'Cannot deactivate the default instance' },
        { status: 400 }
      )
    }
    
    // Check for slug conflict if changing slug
    if (slug && slug !== instance.slug) {
      const conflict = await prisma.platformInstance.findFirst({
        where: { 
          tenantId: instance.tenantId, 
          slug,
          NOT: { id }
        }
      })
      
      if (conflict) {
        return NextResponse.json(
          { error: 'An instance with this slug already exists' },
          { status: 400 }
        )
      }
    }
    
    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined && !instance.isDefault) updateData.slug = slug
    if (description !== undefined) updateData.description = description || null
    if (suiteKeys !== undefined) updateData.suiteKeys = suiteKeys
    if (displayName !== undefined) updateData.displayName = displayName || null
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor || null
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor || null
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null
    if (isActive !== undefined && !instance.isDefault) updateData.isActive = isActive
    
    // Update instance
    const updated = await prisma.platformInstance.update({
      where: { id },
      data: updateData,
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
    
    return NextResponse.json({ success: true, instance: updated })
  } catch (error) {
    console.error('Failed to update platform instance:', error)
    return NextResponse.json(
      { error: 'Failed to update instance' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Find instance
    const instance = await prisma.platformInstance.findUnique({
      where: { id }
    })
    
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }
    
    // Prevent deleting default instance
    if (instance.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete the default instance' },
        { status: 400 }
      )
    }
    
    // Soft delete by setting isActive = false
    await prisma.platformInstance.update({
      where: { id },
      data: { isActive: false }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete platform instance:', error)
    return NextResponse.json(
      { error: 'Failed to delete instance' },
      { status: 500 }
    )
  }
}
