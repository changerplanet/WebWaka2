/**
 * POST /api/admin/capabilities/[key]/activate-for-tenant
 * 
 * Super Admin: Activate a capability for a specific tenant (admin override).
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
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const result = await CapabilityActivationService.activate(
      tenantId,
      key,
      session.user.id,
      'ADMIN'
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
      activatedDependencies: result.activatedDependencies,
      message: `Capability '${result.capabilityKey}' activated for tenant ${tenantId}`,
    });
  } catch (error) {
    console.error('Error activating capability for tenant:', error);
    return NextResponse.json(
      { error: 'Failed to activate capability' },
      { status: 500 }
    );
  }
}
