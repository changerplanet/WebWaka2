export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Main API Route
 * 
 * GET - Returns civic suite configuration and stats
 * POST - Initialization and management operations
 * 
 * @module api/civic
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

// ============================================================================
// GET - Get civic suite configuration and stats
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard - check any civic capability
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'config'

    switch (action) {
      case 'config':
        // Get civic configuration
        const config = await prisma.civic_config.findUnique({
          where: { tenantId },
        })

        return NextResponse.json({
          success: true,
          initialized: !!config,
          config: config || null,
          defaults: {
            defaultSlaBusinessDays: 14,
            enablePublicTracking: true,
          },
        })

      case 'stats':
        // Get civic statistics
        const [
          citizenCount,
          organizationCount,
          agencyCount,
          staffCount,
          serviceCount,
          requestCount,
          caseCount,
          pendingCases,
          inspectionCount,
          pendingBillingFacts,
        ] = await Promise.all([
          prisma.civic_citizen.count({ where: { tenantId, isActive: true } }),
          prisma.civic_organization.count({ where: { tenantId, isActive: true } }),
          prisma.civic_agency.count({ where: { tenantId, isActive: true } }),
          prisma.civic_staff.count({ where: { tenantId, isActive: true } }),
          prisma.civic_service.count({ where: { tenantId, isActive: true } }),
          prisma.civic_request.count({ where: { tenantId } }),
          prisma.civic_case.count({ where: { tenantId } }),
          prisma.civic_case.count({ where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
          prisma.civic_inspection.count({ where: { tenantId } }),
          prisma.civic_billing_fact.count({ where: { tenantId, status: 'PENDING' } }),
        ])

        return NextResponse.json({
          success: true,
          stats: {
            citizens: citizenCount,
            organizations: organizationCount,
            agencies: agencyCount,
            staff: staffCount,
            services: serviceCount,
            requests: requestCount,
            cases: caseCount,
            pendingCases,
            inspections: inspectionCount,
            pendingBillingFacts,
          },
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Civic GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Initialize or manage civic suite
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    switch (body.action) {
      case 'initialize':
        // Initialize civic configuration for tenant
        const existingConfig = await prisma.civic_config.findUnique({
          where: { tenantId },
        })

        if (existingConfig) {
          return NextResponse.json({
            success: true,
            message: 'Civic suite already initialized',
            config: existingConfig,
          })
        }

        const config = await prisma.civic_config.create({
          data: {
            tenantId,
            agencyName: body.agencyName || 'Default Agency',
            agencyCode: body.agencyCode,
            jurisdiction: body.jurisdiction,
            defaultSlaBusinessDays: body.defaultSlaBusinessDays || 14,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Civic suite initialized',
          config,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Civic POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
