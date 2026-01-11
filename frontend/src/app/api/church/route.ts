export const dynamic = 'force-dynamic'

/**
 * Church Suite — Main API Route
 * Phase 1: Registry & Membership
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CHURCH_SUITE_DISCLAIMERS } from '@/lib/church';

// GET /api/church - Suite info and stats
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const churchId = req.nextUrl.searchParams.get('churchId');

    // Get stats
    const where: Record<string, unknown> = { tenantId };
    if (churchId) where.churchId = churchId;

    const [churches, members, units, cellGroups, roles] = await Promise.all([
      prisma.chu_church.count({ where: { tenantId } }),
      prisma.chu_member.count({ where }),
      prisma.chu_church_unit.count({ where }),
      prisma.chu_cell_group.count({ where }),
      prisma.chu_role.count({ where }),
    ]);

    // Member stats by status
    const membersByStatus = await prisma.chu_member.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Minors count
    const minors = await prisma.chu_member.count({
      where: { ...where, isMinor: true },
    });

    return NextResponse.json({
      suite: 'Church Suite',
      phase: 'Phase 1: Registry & Membership',
      version: '1.0.0',
      stats: {
        churches,
        members,
        units,
        cellGroups,
        roles,
        membersByStatus: Object.fromEntries(
          membersByStatus.map((s: any) => [s.status, s._count])
        ),
        minors,
        adults: members - minors,
      },
      capabilities: [
        'chu_registry_denomination',
        'chu_registry_hierarchy',
        'chu_registry_branch',
        'chu_registry_leadership',
        'chu_member_registration',
        'chu_member_guardian',
        'chu_member_lifecycle',
        'chu_member_cell_group',
      ],
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Church Suite API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
