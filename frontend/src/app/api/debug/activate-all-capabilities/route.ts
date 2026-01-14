export const dynamic = 'force-dynamic'

/**
 * POST /api/debug/activate-all-capabilities
 * 
 * DEBUG ENDPOINT: Activates ALL registered capabilities for a tenant.
 * This is for Manus/reviewers to see all modules in the sidebar.
 * 
 * Body: { tenantId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';
import { getAllCapabilityKeys, getCoreCapabilities } from '@/lib/capabilities/registry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, tenantSlug } = body;

    // Get tenant ID from slug if needed
    let targetTenantId = tenantId;
    
    if (!targetTenantId && tenantSlug) {
      const { prisma } = await import('@/lib/prisma');
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });
      if (tenant) {
        targetTenantId = tenant.id;
      }
    }

    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'tenantId or tenantSlug is required' },
        { status: 400 }
      );
    }

    // Get all capability keys except core (core is always active)
    const allKeys = getAllCapabilityKeys();
    const coreKeys = getCoreCapabilities().map(c => c.key);
    const nonCoreKeys = allKeys.filter(k => !coreKeys.includes(k));

    // Activate all non-core capabilities
    const results = await CapabilityActivationService.bulkActivate(
      targetTenantId,
      nonCoreKeys,
      'system-reviewer', // system user for review
      'ADMIN' // activated by admin
    );

    // Summarize results
    const activated = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      tenantId: targetTenantId,
      message: `Activated ${activated.length} capabilities for tenant`,
      summary: {
        total: results.length,
        activated: activated.length,
        failed: failed.length,
        coreAlwaysActive: coreKeys.length,
      },
      activatedCapabilities: activated.map(r => r.capabilityKey),
      failedCapabilities: failed.map(r => ({ key: r.capabilityKey, reason: r.message })),
    });
  } catch (error) {
    console.error('Error activating all capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to activate capabilities', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({
      usage: 'POST with { tenantId: "..." } or { tenantSlug: "..." }',
      curlExample: `curl -X POST http://localhost:5000/api/debug/activate-all-capabilities -H "Content-Type: application/json" -d '{"tenantSlug":"acme"}'`,
      description: 'Activates ALL registered capabilities for a tenant so Manus/reviewers can see all modules in the sidebar',
    });
  }

  // Get current capabilities for the tenant
  try {
    const { prisma } = await import('@/lib/prisma');
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const capabilities = await CapabilityActivationService.getTenantCapabilities(tenant.id);
    
    const stats = {
      total: capabilities.length,
      active: capabilities.filter(c => c.status === 'ACTIVE').length,
      inactive: capabilities.filter(c => c.status === 'INACTIVE').length,
      suspended: capabilities.filter(c => c.status === 'SUSPENDED').length,
    };

    return NextResponse.json({
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      stats,
      capabilities: capabilities.map(c => ({
        key: c.key,
        displayName: c.displayName,
        domain: c.domain,
        status: c.status,
        isCore: c.isCore,
      })),
    });
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capabilities', details: String(error) },
      { status: 500 }
    );
  }
}
