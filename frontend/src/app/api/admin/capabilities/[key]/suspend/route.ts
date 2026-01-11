export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/capabilities/[key]/suspend
 * 
 * Super Admin: Suspend a capability for a specific tenant.
 * Requires SUPER_ADMIN role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';

export async function POST(
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
    const { tenantId, reason } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required for suspension' },
        { status: 400 }
      );
    }

    const result = await CapabilityActivationService.suspend(
      tenantId,
      key,
      session.user.id,
      reason
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
      message: `Capability '${result.capabilityKey}' suspended for tenant ${tenantId}`,
    });
  } catch (error) {
    console.error('Error suspending capability:', error);
    return NextResponse.json(
      { error: 'Failed to suspend capability' },
      { status: 500 }
    );
  }
}
