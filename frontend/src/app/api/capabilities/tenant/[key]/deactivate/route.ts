export const dynamic = 'force-dynamic'

/**
 * POST /api/capabilities/tenant/[key]/deactivate
 * 
 * Deactivate a capability for the current tenant.
 * Requires TENANT_ADMIN role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user || !session?.activeTenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is tenant admin
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: session.activeTenantId,
        },
      },
    });

    if (membership?.role !== 'TENANT_ADMIN' && session.user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin role required to deactivate capabilities' },
        { status: 403 }
      );
    }

    const { key } = await params;

    // Parse request body for optional reason
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body?.reason;
    } catch {
      // No body is fine
    }

    const result = await CapabilityActivationService.deactivate(
      session.activeTenantId,
      key,
      session.user.id,
      reason,
      'SELF'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      capability: result.capabilityKey,
      status: result.status,
      deactivatedDependents: result.deactivatedDependents,
      message: `Capability '${result.capabilityKey}' deactivated successfully`,
    });
  } catch (error) {
    console.error('Error deactivating capability:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate capability' },
      { status: 500 }
    );
  }
}
