export const dynamic = 'force-dynamic'

/**
 * Political Suite - Main API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POLITICAL_SUITE_INFO } from '@/lib/political';

// GET /api/political - Suite info and stats
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    // Get suite statistics
    const [parties, members, campaigns, activeCampaigns, candidates, events, upcomingEvents, volunteers, activeVolunteers] = await Promise.all([
      prisma.pol_party.count({ where: { tenantId } }),
      prisma.pol_member.count({ where: { tenantId } }),
      prisma.pol_campaign.count({ where: { tenantId } }),
      prisma.pol_campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.pol_candidate.count({ where: { tenantId } }),
      prisma.pol_event.count({ where: { tenantId } }),
      prisma.pol_event.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          startDateTime: { gte: new Date() },
        },
      }),
      prisma.pol_volunteer.count({ where: { tenantId } }),
      prisma.pol_volunteer.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      suite: POLITICAL_SUITE_INFO,
      stats: {
        parties,
        members,
        campaigns,
        activeCampaigns,
        candidates,
        events,
        upcomingEvents,
        volunteers,
        activeVolunteers,
      },
      disclaimers: POLITICAL_SUITE_INFO.disclaimers,
    });
  } catch (error) {
    console.error('Political Suite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
