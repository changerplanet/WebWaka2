export const dynamic = 'force-dynamic'

/**
 * Church Suite — Schedules API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUpcomingSchedules,
  cancelSchedule,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/schedules
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const churchId = searchParams.get('churchId') || undefined;
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 7;

    const schedules = await getUpcomingSchedules(tenantId, churchId, days);

    return NextResponse.json({
      schedules,
      total: schedules.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Schedules Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/schedules - Actions (cancel)
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'cancel': {
        if (!body.scheduleId || !body.reason) {
          return NextResponse.json(
            { error: 'scheduleId and reason are required' },
            { status: 400 }
          );
        }
        const schedule = await cancelSchedule(tenantId, body.scheduleId, body.reason, actorId);
        return NextResponse.json({
          schedule,
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Schedule Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
