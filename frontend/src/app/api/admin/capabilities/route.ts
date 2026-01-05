/**
 * GET /api/admin/capabilities
 * 
 * Super Admin: List all capabilities with activation stats.
 * Requires SUPER_ADMIN role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';
import { getAvailableDomains } from '@/lib/capabilities/registry';

export async function GET(request: NextRequest) {
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

    // First seed to ensure all capabilities exist
    await CapabilityActivationService.seedCapabilities();

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const includeStats = searchParams.get('includeStats') !== 'false';

    // Build query
    const where: Record<string, unknown> = {};
    if (domain) {
      where.domain = domain;
    }

    const capabilities = await prisma.core_capabilities.findMany({
      where,
      orderBy: [{ domain: 'asc' }, { sortOrder: 'asc' }],
      include: {
        core_tenant_capability_activations: includeStats
          ? {
              select: { status: true },
            }
          : false,
      },
    });

    // Transform with stats
    const capabilitiesWithStats = capabilities.map((cap) => {
      const activations = (cap as unknown as { core_tenant_capability_activations?: Array<{ status: string }> }).core_tenant_capability_activations || [];
      return {
        id: cap.id,
        key: cap.key,
        displayName: cap.displayName,
        domain: cap.domain,
        description: cap.description,
        dependencies: cap.dependencies,
        isCore: cap.isCore,
        isAvailable: cap.isAvailable,
        icon: cap.icon,
        sortOrder: cap.sortOrder,
        metadata: cap.metadata,
        createdAt: cap.createdAt,
        updatedAt: cap.updatedAt,
        stats: includeStats
          ? {
              totalActivations: activations.length,
              active: activations.filter((a) => a.status === 'ACTIVE').length,
              inactive: activations.filter((a) => a.status === 'INACTIVE').length,
              suspended: activations.filter((a) => a.status === 'SUSPENDED').length,
            }
          : undefined,
      };
    });

    // Group by domain
    const domains = getAvailableDomains();
    const byDomain = domains.map((d) => ({
      domain: d.key,
      label: d.label,
      capabilities: capabilitiesWithStats.filter((c) => c.domain === d.key),
    })).filter((g) => g.capabilities.length > 0);

    // Global stats
    const globalStats = {
      totalCapabilities: capabilities.length,
      coreCapabilities: capabilities.filter((c) => c.isCore).length,
      availableCapabilities: capabilities.filter((c) => c.isAvailable).length,
      domainCount: byDomain.length,
    };

    return NextResponse.json({
      capabilities: capabilitiesWithStats,
      byDomain,
      stats: globalStats,
      domains: domains.map((d) => d.key),
    });
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/capabilities
 * 
 * Super Admin: Register a new capability.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      key,
      displayName,
      domain,
      description,
      dependencies = [],
      isCore = false,
      isAvailable = true,
      sortOrder = 0,
      icon,
      metadata,
    } = body;

    // Validate required fields
    if (!key || !displayName || !domain) {
      return NextResponse.json(
        { error: 'key, displayName, and domain are required' },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await prisma.capability.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Capability with key '${key}' already exists` },
        { status: 409 }
      );
    }

    const capability = await prisma.capability.create({
      data: {
        key,
        displayName,
        domain,
        description,
        dependencies,
        isCore,
        isAvailable,
        sortOrder,
        icon,
        metadata,
      },
    });

    return NextResponse.json({
      success: true,
      capability,
      message: `Capability '${key}' registered successfully`,
    });
  } catch (error) {
    console.error('Error registering capability:', error);
    return NextResponse.json(
      { error: 'Failed to register capability' },
      { status: 500 }
    );
  }
}
