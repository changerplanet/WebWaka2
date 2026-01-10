/**
 * GET/PUT /api/admin/capabilities/[key]
 * 
 * Super Admin: Get or update a specific capability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin role required' },
        { status: 403 }
      );
    }

    const { key } = await params;

    const capability = await prisma.core_capabilities.findUnique({
      where: { key },
      include: {
        core_tenant_capability_activations: {
          orderBy: { updatedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!capability) {
      return NextResponse.json(
        { error: `Capability '${key}' not found` },
        { status: 404 }
      );
    }

    const activations = (capability as any).core_tenant_capability_activations;
    const stats = {
      totalActivations: activations.length,
      active: activations.filter((a: any) => a.status === 'ACTIVE').length,
      inactive: activations.filter((a: any) => a.status === 'INACTIVE').length,
      suspended: activations.filter((a: any) => a.status === 'SUSPENDED').length,
    };

    return NextResponse.json({
      capability: {
        ...capability,
        core_tenant_capability_activations: undefined,
      },
      activations: activations.map((a: any) => ({
        id: a.id,
        tenantId: a.tenantId,
        status: a.status,
        activatedAt: a.activatedAt,
        deactivatedAt: a.deactivatedAt,
        suspendedAt: a.suspendedAt,
        activatedBy: a.activatedBy,
        suspensionReason: a.suspensionReason,
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching capability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capability' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin role required' },
        { status: 403 }
      );
    }

    const { key } = await params;
    const body = await request.json();

    // Only allow updating certain fields
    const {
      displayName,
      description,
      isAvailable,
      sortOrder,
      icon,
      metadata,
    } = body;

    const capability = await prisma.core_capabilities.update({
      where: { key },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(description !== undefined && { description }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(icon !== undefined && { icon }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    return NextResponse.json({
      success: true,
      capability,
      message: `Capability '${key}' updated successfully`,
    });
  } catch (error) {
    console.error('Error updating capability:', error);
    return NextResponse.json(
      { error: 'Failed to update capability' },
      { status: 500 }
    );
  }
}
