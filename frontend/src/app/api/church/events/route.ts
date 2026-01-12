export const dynamic = 'force-dynamic'

/**
 * Church Suite — Events API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createEvent,
  listEvents,
  getUpcomingEvents,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/events
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;

    // Upcoming events mode
    if (searchParams.get('upcoming') === 'true') {
      const churchId = searchParams.get('churchId');
      if (!churchId) {
        return NextResponse.json(
          { error: 'churchId is required for upcoming events' },
          { status: 400 }
        );
      }
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const events = await getUpcomingEvents(tenantId, churchId, limit);
      return NextResponse.json({
        events,
        total: events.length,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    const filters = {
      churchId: searchParams.get('churchId') || undefined,
      unitId: searchParams.get('unitId') || undefined,
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') || undefined,
      startDateFrom: searchParams.get('startDateFrom') ? new Date(searchParams.get('startDateFrom')!) : undefined,
      startDateTo: searchParams.get('startDateTo') ? new Date(searchParams.get('startDateTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await listEvents(tenantId, filters);

    return NextResponse.json({
      ...result,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Events Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/events
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

    if (!body.churchId || !body.title || !body.startDate) {
      return NextResponse.json(
        { error: 'churchId, title, and startDate are required' },
        { status: 400 }
      );
    }

    const event = await createEvent(tenantId, body, actorId);

    return NextResponse.json({
      event,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Event Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
