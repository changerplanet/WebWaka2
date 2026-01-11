export const dynamic = 'force-dynamic'

/**
 * GET /api/capabilities/tenant
 * 
 * Get capability activations for the current tenant.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';
import { CapabilityStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user || !session?.activeTenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || undefined;
    const statusFilter = searchParams.get('status') as CapabilityStatus | undefined;

    const capabilities = await CapabilityActivationService.getTenantCapabilities(
      session.activeTenantId,
      {
        domain,
        status: statusFilter,
      }
    );

    // Group by domain
    const byDomain = capabilities.reduce((acc, cap) => {
      if (!acc[cap.domain]) {
        acc[cap.domain] = [];
      }
      acc[cap.domain].push(cap);
      return acc;
    }, {} as Record<string, typeof capabilities>);

    // Summary stats
    const stats = {
      total: capabilities.length,
      active: capabilities.filter((c) => c.status === 'ACTIVE').length,
      inactive: capabilities.filter((c) => c.status === 'INACTIVE').length,
      suspended: capabilities.filter((c) => c.status === 'SUSPENDED').length,
      core: capabilities.filter((c) => c.isCore).length,
    };

    return NextResponse.json({
      tenantId: session.activeTenantId,
      capabilities,
      byDomain,
      stats,
    });
  } catch (error) {
    console.error('Error fetching tenant capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant capabilities' },
      { status: 500 }
    );
  }
}
