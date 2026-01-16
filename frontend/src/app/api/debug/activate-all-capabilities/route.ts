export const dynamic = 'force-dynamic'

/**
 * DEBUG ENDPOINT - Activate All Capabilities
 * 
 * ⚠️ SECURED: Requires BOTH Super Admin authentication AND development environment
 * 
 * Wave C1: Security hardened - dual gate protection
 * 
 * POST /api/debug/activate-all-capabilities
 * Body: { tenantId: string } or { tenantSlug: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { CapabilityActivationService } from '@/lib/capabilities/activation-service'
import { getAllCapabilityKeys, getCoreCapabilities } from '@/lib/capabilities/registry'

async function checkDualGate(): Promise<{ passed: false; response: Response } | { passed: true; userId: string; userEmail: string }> {
  // GATE 1: Environment check - MUST be development
  if (process.env.NODE_ENV === 'production') {
    return {
      passed: false,
      response: NextResponse.json(
        { error: 'Debug endpoint disabled in production' },
        { status: 403 }
      )
    }
  }

  // GATE 2: Require Super Admin authentication
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return {
      passed: false,
      response: NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
  }

  return { passed: true, userId: authResult.user.id, userEmail: authResult.user.email ?? 'unknown' }
}

export async function POST(request: NextRequest) {
  const gateResult = await checkDualGate()
  if (!gateResult.passed) {
    return gateResult.response
  }

  try {
    const body = await request.json()
    const { tenantId, tenantSlug } = body

    let targetTenantId = tenantId
    
    if (!targetTenantId && tenantSlug) {
      const { prisma } = await import('@/lib/prisma')
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      })
      if (tenant) {
        targetTenantId = tenant.id
      }
    }

    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'tenantId or tenantSlug is required' },
        { status: 400 }
      )
    }

    const allKeys = getAllCapabilityKeys()
    const coreKeys = getCoreCapabilities().map(c => c.key)
    const nonCoreKeys = allKeys.filter(k => !coreKeys.includes(k))

    const results = await CapabilityActivationService.bulkActivate(
      targetTenantId,
      nonCoreKeys,
      gateResult.userId,
      'ADMIN'
    )

    const activated = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    return NextResponse.json({
      success: true,
      tenantId: targetTenantId,
      activatedBy: gateResult.userEmail,
      message: `Activated ${activated.length} capabilities for tenant`,
      summary: {
        total: results.length,
        activated: activated.length,
        failed: failed.length,
        coreAlwaysActive: coreKeys.length,
      },
      activatedCapabilities: activated.map(r => r.capabilityKey),
      failedCapabilities: failed.map(r => ({ key: r.capabilityKey, reason: r.message })),
    })
  } catch (error) {
    console.error('Error activating all capabilities:', error)
    return NextResponse.json(
      { error: 'Failed to activate capabilities', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const gateResult = await checkDualGate()
  if (!gateResult.passed) {
    return gateResult.response
  }

  const { searchParams } = new URL(request.url)
  const tenantSlug = searchParams.get('tenant')

  if (!tenantSlug) {
    return NextResponse.json({
      authenticatedAs: gateResult.userEmail,
      usage: 'POST with { tenantId: "..." } or { tenantSlug: "..." }',
      curlExample: `curl -X POST /api/debug/activate-all-capabilities -H "Content-Type: application/json" -d '{"tenantSlug":"acme"}'`,
      description: 'Activates ALL registered capabilities for a tenant (Super Admin + development only)',
    })
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const capabilities = await CapabilityActivationService.getTenantCapabilities(tenant.id)
    
    const stats = {
      total: capabilities.length,
      active: capabilities.filter(c => c.status === 'ACTIVE').length,
      inactive: capabilities.filter(c => c.status === 'INACTIVE').length,
      suspended: capabilities.filter(c => c.status === 'SUSPENDED').length,
    }

    return NextResponse.json({
      authenticatedAs: gateResult.userEmail,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      stats,
      capabilities: capabilities.map(c => ({
        key: c.key,
        displayName: c.displayName,
        domain: c.domain,
        status: c.status,
        isCore: c.isCore,
      })),
    })
  } catch (error) {
    console.error('Error fetching capabilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch capabilities', details: String(error) },
      { status: 500 }
    )
  }
}
