export const dynamic = 'force-dynamic'

/**
 * POST /api/capabilities/seed
 * 
 * Seed/sync capabilities from registry to database.
 * Requires SUPER_ADMIN role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';
import { CAPABILITY_REGISTRY } from '@/lib/capabilities/registry';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only super admin can seed capabilities
    if (session.user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin role required' },
        { status: 403 }
      );
    }

    await CapabilityActivationService.seedCapabilities();

    return NextResponse.json({
      success: true,
      message: 'Capabilities seeded successfully',
      count: Object.keys(CAPABILITY_REGISTRY).length,
    });
  } catch (error) {
    console.error('Error seeding capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to seed capabilities' },
      { status: 500 }
    );
  }
}
