/**
 * GET /api/capabilities
 * 
 * List all available capabilities in the system.
 * Public endpoint - no auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CAPABILITY_REGISTRY, getAvailableDomains } from '@/lib/capabilities/registry';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    // First, ensure capabilities are seeded
    await CapabilityActivationService.seedCapabilities();

    // Build query
    const where: Record<string, unknown> = {
      isAvailable: true,
    };
    if (domain) {
      where.domain = domain;
    }

    const capabilities = await prisma.core_capabilities.findMany({
      where,
      orderBy: [{ domain: 'asc' }, { sortOrder: 'asc' }],
      select: {
        key: true,
        displayName: true,
        domain: true,
        description: true,
        dependencies: true,
        isCore: true,
        icon: true,
        sortOrder: true,
        metadata: includeMetadata,
      },
    });

    // Group by domain for easier consumption
    const domains = getAvailableDomains();
    const grouped = domains.map((d) => ({
      domain: d.key,
      label: d.label,
      capabilities: capabilities.filter((c) => c.domain === d.key),
    })).filter((g) => g.capabilities.length > 0);

    return NextResponse.json({
      capabilities,
      byDomain: grouped,
      totalCount: capabilities.length,
    });
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}
